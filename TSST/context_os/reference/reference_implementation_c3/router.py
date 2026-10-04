from dataclasses import dataclass, field
from enum import Enum
from typing import List, Set, Dict

class Tier(str, Enum):
    FAST="FAST"
    EXECUTION="EXECUTION"
    CODE="CODE"
    EXECUTIVE="EXECUTIVE"

class Budget(str, Enum):
    LOW="LOW"
    NORMAL="NORMAL"
    HIGH="HIGH"
    CRITICAL="CRITICAL"

BUDGETS = {
    Budget.LOW: {"max_calls":4,"max_exec":0,"retries":1,"parallel":1},
    Budget.NORMAL: {"max_calls":8,"max_exec":1,"retries":2,"parallel":3},
    Budget.HIGH: {"max_calls":14,"max_exec":2,"retries":2,"parallel":4},
    Budget.CRITICAL: {"max_calls":20,"max_exec":3,"retries":2,"parallel":5},
}

@dataclass
class RouteRequest:
    task_type: str
    business_impact: int = 0
    security_privacy: int = 0
    irreversibility: int = 0
    ambiguity: int = 0
    cross_domain: int = 0
    reasoning_depth: int = 0
    codebase_coupling: int = 0
    input_volume: int = 0
    expected_output: int = 0
    same_issue_failures: int = 0
    budget: Budget = Budget.NORMAL
    needs_code_harness: bool = False
    explicit_external_action_authority: bool = False
    internal_mutation_authority: bool = False
    requested_namespaces: Set[str] = field(default_factory=set)

@dataclass
class RouteDecision:
    tier: Tier
    reasons: List[str]
    context_budget: str
    max_calls: int
    max_executive_calls: int
    max_parallel_subagents: int
    tool_namespaces: Set[str]
    blocked_actions: List[str]

def _validate_0_4(v:int)->int:
    if v < 0 or v > 4:
        raise ValueError("routing dimensions must be 0..4")
    return v

def route(req: RouteRequest) -> RouteDecision:
    vals = [req.business_impact, req.security_privacy, req.irreversibility, req.ambiguity,
            req.cross_domain, req.reasoning_depth, req.codebase_coupling, req.input_volume,
            req.expected_output]
    list(map(_validate_0_4, vals))

    reasons=[]
    high_impact = max(req.business_impact, req.security_privacy, req.irreversibility)
    hard_reasoning = max(req.ambiguity, req.cross_domain, req.reasoning_depth)

    # Volume deliberately excluded from executive trigger.
    executive_trigger = (
        high_impact >= 4 and hard_reasoning >= 3
        or req.same_issue_failures >= 2
        or (req.cross_domain >= 4 and req.reasoning_depth >= 3)
    )

    if executive_trigger:
        tier = Tier.EXECUTIVE
        if req.same_issue_failures >= 2:
            reasons.append("repeated_material_failure")
        if high_impact >= 4 and hard_reasoning >= 3:
            reasons.append("high_impact_ambiguous_decision")
        if req.cross_domain >= 4 and req.reasoning_depth >= 3:
            reasons.append("cross_domain_critical_synthesis")
    elif req.needs_code_harness and req.codebase_coupling >= 2:
        tier = Tier.CODE
        reasons.append("codebase_heavy_execution")
    elif hard_reasoning >= 2 or req.business_impact >= 2 or req.codebase_coupling >= 2:
        tier = Tier.EXECUTION
        reasons.append("standard_nontrivial_execution")
    else:
        tier = Tier.FAST
        reasons.append("bounded_low_risk_transformation")

    # LOW budget cannot silently use executive. Escalation must return/block.
    budget_cfg = BUDGETS[req.budget]
    if tier == Tier.EXECUTIVE and budget_cfg["max_exec"] == 0:
        reasons.append("budget_requires_lead_escalation")
        tier = Tier.EXECUTION

    complexity = max(hard_reasoning, req.codebase_coupling)
    if req.input_volume >= 4:
        # volume increases context strategy, not model tier
        context_budget = "L" if complexity < 4 else "XL"
        reasons.append("bulk_input_requires_partition_and_compression")
    elif complexity >= 4:
        context_budget = "L"
    elif complexity >= 2:
        context_budget = "M"
    else:
        context_budget = "S"

    blocked=[]
    ns=set(req.requested_namespaces)
    # Generic write/action namespace policy.
    if "external_action" in ns and not req.explicit_external_action_authority:
        ns.remove("external_action")
        blocked.append("external_action_without_explicit_authority")
    if "internal_mutation" in ns and not req.internal_mutation_authority:
        ns.remove("internal_mutation")
        blocked.append("internal_mutation_without_delegated_authority")

    return RouteDecision(
        tier=tier,
        reasons=reasons,
        context_budget=context_budget,
        max_calls=budget_cfg["max_calls"],
        max_executive_calls=budget_cfg["max_exec"],
        max_parallel_subagents=budget_cfg["parallel"],
        tool_namespaces=ns,
        blocked_actions=blocked,
    )

@dataclass
class Tool:
    tool_id: str
    namespace: str
    mode: str
    defer_by_default: bool
    frequent: bool=False
    tags: Set[str]=field(default_factory=set)

def select_tools(tools: List[Tool], needed_tags:Set[str], allowed_modes:Set[str]) -> List[Tool]:
    # Only expose tools whose namespace/tag is relevant and action mode is allowed.
    selected=[]
    for t in tools:
        if t.mode not in allowed_modes:
            continue
        if needed_tags and not (t.tags & needed_tags):
            continue
        selected.append(t)
    # frequent eager tools first, then stable ID
    return sorted(selected, key=lambda t: (not t.frequent, t.namespace, t.tool_id))

def should_defer(tool:Tool, total_catalog_size:int)->bool:
    if tool.frequent:
        return False
    if total_catalog_size >= 10:
        return True
    return tool.defer_by_default
