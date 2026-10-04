from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Iterable
from datetime import datetime, timezone

class Intent(str, Enum):
    CURRENT_STATE = "current_state"
    DURABLE_DECISION = "durable_decision"
    IMPLEMENTATION_TRUTH = "implementation_truth"
    APPROVED_SPEC = "approved_spec"
    HISTORICAL_EVIDENCE = "historical_evidence"
    CUSTOMER_EVIDENCE = "customer_evidence"
    EXTERNAL_CURRENT_FACT = "external_current_fact"
    PROCEDURE = "procedure"

AUTHORITY = {
    Intent.CURRENT_STATE: {
        "LIVE_STATUS": 1.0, "VERIFIED_IMPLEMENTATION": .90, "ACCEPTED_DECISION": .82,
        "APPROVED_SPEC": .72, "OPERATING_GOVERNANCE": .70, "REVIEWED_HANDOFF": .58,
        "HISTORICAL_EVIDENCE": .42, "CHAT_MEMORY": .20, "MODEL_INFERENCE": 0.0,
    },
    Intent.DURABLE_DECISION: {
        "ACCEPTED_DECISION": 1.0, "OPERATING_GOVERNANCE": .95, "LIVE_STATUS": .80,
        "APPROVED_SPEC": .75, "VERIFIED_IMPLEMENTATION": .60, "REVIEWED_HANDOFF": .50,
        "HISTORICAL_EVIDENCE": .35, "CHAT_MEMORY": .15, "MODEL_INFERENCE": 0.0,
    },
    Intent.IMPLEMENTATION_TRUTH: {
        "VERIFIED_IMPLEMENTATION": 1.0, "LIVE_STATUS": .90, "APPROVED_SPEC": .75,
        "ACCEPTED_DECISION": .72, "REVIEWED_HANDOFF": .60, "OPERATING_GOVERNANCE": .55,
        "HISTORICAL_EVIDENCE": .40, "CHAT_MEMORY": .15, "MODEL_INFERENCE": 0.0,
    },
    Intent.APPROVED_SPEC: {
        "APPROVED_SPEC": 1.0, "ACCEPTED_DECISION": .95, "LIVE_STATUS": .78,
        "OPERATING_GOVERNANCE": .70, "VERIFIED_IMPLEMENTATION": .65,
        "REVIEWED_HANDOFF": .50, "HISTORICAL_EVIDENCE": .35, "CHAT_MEMORY": .15,
        "MODEL_INFERENCE": 0.0,
    },
    Intent.PROCEDURE: {
        "OPERATING_GOVERNANCE": 1.0, "APPROVED_SPEC": .90, "ACCEPTED_DECISION": .85,
        "REVIEWED_HANDOFF": .65, "LIVE_STATUS": .60, "VERIFIED_IMPLEMENTATION": .55,
        "HISTORICAL_EVIDENCE": .40, "CHAT_MEMORY": .15, "MODEL_INFERENCE": 0.0,
    },
}
# sensible fallback for evidence intents
for i in [Intent.HISTORICAL_EVIDENCE, Intent.CUSTOMER_EVIDENCE, Intent.EXTERNAL_CURRENT_FACT]:
    AUTHORITY[i] = {
        "VERIFIED_IMPLEMENTATION": .95, "LIVE_STATUS": .90, "ACCEPTED_DECISION": .82,
        "APPROVED_SPEC": .78, "OPERATING_GOVERNANCE": .72, "REVIEWED_HANDOFF": .65,
        "HISTORICAL_EVIDENCE": .80, "CHAT_MEMORY": .20, "MODEL_INFERENCE": 0.0,
    }

VERIFICATION = {"VERIFIED": 1.0, "REVIEWED": .75, "UNVERIFIED": .35, "HYPOTHESIS": 0.0}

@dataclass(frozen=True)
class ContextRecord:
    record_id: str
    project_key: str
    memory_class: str
    authority_class: str
    source_locator: str
    source_date: str
    state_scope: Optional[str]
    status: str
    sensitivity: str
    content: str
    workstream: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    state_key: Optional[str] = None
    source_version: Optional[str] = None
    verification_state: str = "UNVERIFIED"
    superseded_by: Optional[str] = None
    tags: tuple[str, ...] = field(default_factory=tuple)
    time_sensitive: bool = False

@dataclass(frozen=True)
class RetrievalRequest:
    project_key: str
    intent: Intent
    decision_needed: str
    workstream: Optional[str] = None
    state_scope: Optional[str] = None
    entity_id: Optional[str] = None
    allow_historical: bool = False
    allow_cross_project: bool = False
    sensitivity_ceiling: str = "RESTRICTED"
    max_results: int = 8

SENSITIVITY = {"PUBLIC":0, "INTERNAL":1, "CONFIDENTIAL":2, "RESTRICTED":3, "SECRET_PROHIBITED":99}

def hard_filter(req: RetrievalRequest, r: ContextRecord) -> tuple[bool, str]:
    if r.project_key != req.project_key and not req.allow_cross_project:
        return False, "wrong_project"
    if r.sensitivity == "SECRET_PROHIBITED":
        return False, "secret_prohibited"
    if SENSITIVITY.get(r.sensitivity, 99) > SENSITIVITY.get(req.sensitivity_ceiling, 3):
        return False, "sensitivity"
    if r.status == "REVOKED":
        return False, "revoked"
    if r.status == "SUPERSEDED" and not req.allow_historical:
        return False, "superseded"
    if req.state_scope and r.state_scope and req.state_scope != r.state_scope:
        return False, "wrong_state_scope"
    if req.workstream and r.workstream and req.workstream != r.workstream:
        return False, "wrong_workstream"
    return True, "ok"

def score(req: RetrievalRequest, r: ContextRecord, *, keyword: float=0.0, semantic: float=0.0) -> float:
    authority = AUTHORITY[req.intent].get(r.authority_class, 0.0)
    exact = 0.0
    exact += .35 if r.project_key == req.project_key else 0
    exact += .20 if req.workstream and r.workstream == req.workstream else 0
    exact += .20 if req.state_scope and r.state_scope == req.state_scope else 0
    exact += .25 if req.entity_id and r.entity_id == req.entity_id else 0
    if not any([req.workstream, req.state_scope, req.entity_id]):
        exact = 1.0 if r.project_key == req.project_key else 0.0

    verification = VERIFICATION.get(r.verification_state, 0.0)
    provenance = 1.0 if r.source_locator else 0.0
    freshness = 1.0
    # In v0.2 we do not invent TTLs. Stale/superseded must be metadata-driven.
    if r.status == "HISTORICAL" and req.intent in {Intent.CURRENT_STATE, Intent.EXTERNAL_CURRENT_FACT}:
        freshness = .25

    total = (
        .30 * authority +
        .25 * exact +
        .15 * verification +
        .10 * max(0.0, min(keyword, 1.0)) +
        .10 * max(0.0, min(semantic, 1.0)) +
        .05 * provenance +
        .05 * freshness
    )
    return round(total, 6)

def retrieve(req: RetrievalRequest, records: Iterable[ContextRecord], signals: dict[str, tuple[float,float]]|None=None):
    signals = signals or {}
    selected = []
    excluded = []
    for r in records:
        ok, reason = hard_filter(req, r)
        if not ok:
            excluded.append((r.record_id, reason))
            continue
        kw, sem = signals.get(r.record_id, (0.0, 0.0))
        selected.append((score(req, r, keyword=kw, semantic=sem), r))
    selected.sort(key=lambda x: (x[0], x[1].source_date), reverse=True)
    return selected[:req.max_results], excluded

def detect_same_scope_conflicts(records: Iterable[ContextRecord]):
    active = [r for r in records if r.status == "ACTIVE" and r.state_scope and r.state_key]
    groups = {}
    for r in active:
        key = (r.project_key, r.workstream, r.state_scope, r.state_key)
        groups.setdefault(key, []).append(r)
    conflicts = []
    for key, rs in groups.items():
        contents = {r.content.strip() for r in rs}
        if len(contents) > 1:
            conflicts.append((key, tuple(r.record_id for r in rs)))
    return conflicts
