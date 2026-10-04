# TSST Context OS v0.3 — C3 Model / Tool / Cost Routing

Status: **PROPOSED / UNVALIDATED**
Gate: C3 Model & Tool Routing

## 1. Goal

Choose:
1. the smallest sufficient context,
2. the smallest sufficient skill set,
3. the smallest sufficient tool surface,
4. the cheapest reliable model tier,

while preserving quality, authority, security and recoverability.

The router must optimize **cost per accepted task**, not cheapest call.

---

## 2. Provider-Neutral Model Tiers

Do not hardcode long-lived architecture to one provider model ID.

### `FAST`
Use for:
- classification;
- extraction;
- normalization;
- deduplication;
- short summaries;
- metadata tagging;
- deterministic transformations.

### `EXECUTION`
Default tier for:
- implementation;
- standard research synthesis;
- CRM analysis;
- debugging;
- planning;
- UI/UX reasoning;
- routine specialist work.

### `CODE`
Use when the runtime provides a coding-specialized model/harness and the task is codebase-heavy:
- repo exploration;
- implementation;
- test-driven changes;
- refactors;
- migrations;
- debugging.

`CODE` may map to `EXECUTION` when no specialized model is configured.

### `EXECUTIVE`
Use only for:
- architecture boundaries;
- cross-agent disagreement;
- high-impact ambiguous decisions;
- irreversible choices;
- strategic synthesis;
- final critical acceptance;
- repeated lower-tier failure.

## 3. Runtime Binding

Logical tiers are mapped in configuration:

```yaml
providers:
  claude:
    FAST: <current-fast-model-id>
    EXECUTION: <current-general-model-id>
    EXECUTIVE: <current-high-reasoning-model-id>
  openai:
    FAST: <current-fast-model-id>
    EXECUTION: <current-general-model-id>
    CODE: <current-coding-model-id>
    EXECUTIVE: <current-high-reasoning-model-id>
```

Model availability/pricing is runtime configuration, not durable project memory.

---

## 4. Routing Inputs

Every routing decision receives:

```yaml
routing_request:
  task_id: ...
  task_type: ...
  project_key: ...
  state_scope: ...
  risk:
    business_impact: 0..4
    security_privacy: 0..4
    irreversibility: 0..4
  complexity:
    ambiguity: 0..4
    cross_domain: 0..4
    reasoning_depth: 0..4
    codebase_coupling: 0..4
  workload:
    input_volume: 0..4
    expected_output: 0..4
  verification:
    required: true
    independent_review: false
  history:
    same_issue_failures: 0
  budget:
    class: LOW|NORMAL|HIGH|CRITICAL
```

---

## 5. Core Rule

**Volume is not reasoning difficulty.**

A huge feedback corpus should normally be:
- partitioned;
- processed by FAST/EXECUTION;
- compressed;
- synthesized by EXECUTIVE only if the final decision warrants it.

Do not send 100k tokens to the executive model simply because they exist.

---

## 6. Escalation

### FAST → EXECUTION
Escalate when:
- low confidence;
- material ambiguity;
- non-trivial synthesis;
- verification failure;
- task exceeds extraction/classification scope.

### EXECUTION/CODE → EXECUTIVE
Escalate when:
- two materially failed attempts on the same issue;
- architecture boundary changes;
- unresolved evidence conflict;
- high-impact irreversible decision;
- cross-agent disagreement affects acceptance;
- explicit critical final review.

### Executive escalation packet
Include only:
- decision needed;
- compressed prior attempts;
- evidence locators;
- unresolved contradiction;
- acceptance criteria;
- risks;
- exact escalation reason.

Do not replay full raw history.

---

## 7. Cost Guard

A cost guard controls:
- max calls per task;
- max executive calls;
- retry count;
- context budget;
- tool-discovery overhead;
- parallel subagent count.

Default proposal:

| Budget class | Max model calls | Max executive calls | Max retries / same failure | Parallel subagents |
|---|---:|---:|---:|---:|
| LOW | 4 | 0 | 1 | 1 |
| NORMAL | 8 | 1 | 2 | 3 |
| HIGH | 14 | 2 | 2 | 4 |
| CRITICAL | 20 | 3 | 2 | 5 |

These are control defaults, not billing estimates.

If budget would be exceeded:
- checkpoint;
- return partial verified work;
- escalate to Lead;
- do not loop silently.

---

## 8. Tool Surface Policy

### Always-visible tools
Keep only the tools used in most TSST tasks:
- current-state / project retrieval;
- skill discovery;
- checkpoint;
- safe read-only source access.

### Deferred tools
Defer:
- GitHub write tools;
- deployment;
- CRM mutation;
- ads/platform mutation;
- design export;
- specialist administration;
- rarely used provider tools.

### Tool group limits
Prefer clear namespaces:
- `drive.*`
- `github.*`
- `crm.*`
- `web.*`
- `design.*`
- `ads.*`
- `runtime.*`

A task should load only namespaces it plausibly needs.

---

## 9. Tool Authority

Tool selection and permission are separate.

A tool may be discoverable but still not callable.

Actions are classified:

### READ
Can be used inside an approved work plan.

### DRAFT
Can create local/reviewable artifacts.

### MUTATE_INTERNAL
Changes internal systems/data.
Requires applicable delegated authority.

### EXTERNAL_ACTION
Publishes, spends, sends, deploys, contacts customers, mutates third-party accounts.
Requires explicit applicable user authority.

### SECRET_ACCESS
Requires dedicated secure capability and must never expose secret values to durable memory.

---

## 10. Tool Search Strategy

Use deferred discovery when:
- 10+ candidate tools;
- schemas are large;
- multiple MCP servers exist;
- only a small subset is normally needed.

Use eager loading when:
- toolset is tiny;
- nearly every task needs the tools;
- schema cost is negligible.

Runtime adapters should support provider-native deferred loading when available.

---

## 11. Prompt / Tool Cache Strategy

Cache stable prefixes where supported:
- governance kernel;
- stable tool metadata;
- stable agent contract;
- stable output contract.

Do not put rapidly changing:
- current checkpoint;
- customer data;
- search results;
- temporary tool output

inside a supposedly stable cached prefix.

---

## 12. Context Editing / Compaction

Long sessions should:
1. checkpoint verified work;
2. remove dead tool results;
3. preserve decision/evidence references;
4. continue from compacted state.

Never rely on opaque compaction alone for project continuity.

---

## 13. Tool Result Compression

Bulk tool outputs must be processed before returning to executive context.

Example:

```text
CRM: 8,000 feedback rows
        ↓
FAST workers classify
        ↓
EXECUTION validates clusters
        ↓
evidence bundle (100–300 rows/claims)
        ↓
EXECUTIVE synthesizes decision
```

---

## 14. Failure Loop Protection

The router records a failure fingerprint:

`task_type + artifact + failure_class + acceptance_criterion`

If the same fingerprint fails twice:
- do not retry the same tier/prompt unchanged;
- change method/tool/context or escalate.

If executive fails:
- stop;
- expose blocker and evidence;
- do not recursively invoke more executive attempts without a new input.

---

## 15. Audit Record

Every significant routed task should be able to emit:

```yaml
routing_audit:
  selected_tier: EXECUTION
  selected_provider: ...
  selected_model_id: ...
  reason: ...
  tools_loaded: [...]
  tools_deferred: [...]
  context_budget: M
  retries: 0
  escalations: []
  verification: PASS
  cost_units:
    input_tokens: ...
    output_tokens: ...
    cached_tokens: ...
    tool_calls: ...
  accepted: true
```

Real provider costs are calculated from runtime price configuration.

---

## 16. C3 Exit Gate

C3 cannot close by document creation.

Must prove:
- low-risk extraction does not use executive tier;
- architecture/high-risk decisions can escalate correctly;
- input volume alone does not trigger executive tier;
- write/external tools remain blocked without authority;
- deferred tool selection excludes irrelevant namespaces;
- retry loop stops under policy;
- model ID can change without rewriting skill/governance files;
- routing audit explains every executive-tier use.
