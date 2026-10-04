from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set

@dataclass
class EvidenceRef:
    locator: str
    version: Optional[str]=None
    critical: bool=True

@dataclass
class Checkpoint:
    checkpoint_id: str
    project_key: str
    workstream: Optional[str]
    state_scope: str
    last_verified_state: str
    completed: List[str]
    evidence: List[EvidenceRef]
    open_items: List[str]
    blockers: List[str]
    next_action: str
    do_not_repeat: List[str]
    status: str="CURRENT"
    superseded_by: Optional[str]=None
    version: int=1

@dataclass
class ResumePack:
    checkpoint_id: str
    checkpoint_status: str
    project_key: str
    workstream: Optional[str]
    current_state: str
    next_action: str
    evidence_locators: List[str]
    do_not_repeat: List[str]
    blockers: List[str]
    notes: List[str]=field(default_factory=list)

def validate_checkpoint(cp:Checkpoint, available_sources:Dict[str,Optional[str]],
                        newer_evidence:List[dict]|None=None)->str:
    if cp.status=="SUPERSEDED" or cp.superseded_by:
        return "SUPERSEDED"

    for e in cp.evidence:
        if not e.critical:
            continue
        if e.locator not in available_sources:
            return "INVALID"
        current_version=available_sources[e.locator]
        if e.version and current_version and e.version != current_version:
            return "STALE"

    for n in (newer_evidence or []):
        if n.get("project_key") != cp.project_key:
            continue
        # Only same state scope can stale this checkpoint directly.
        if n.get("state_scope") != cp.state_scope:
            continue
        if cp.workstream and n.get("workstream") not in (None, cp.workstream):
            continue
        if n.get("verified",False):
            return "STALE"
    return "CURRENT"

def build_resume_pack(cp:Checkpoint, status:str)->ResumePack:
    note=[]
    next_action=cp.next_action
    if status=="INVALID":
        next_action="Re-verify checkpoint evidence before continuing claimed state."
        note.append("critical checkpoint evidence missing or invalid")
    elif status=="STALE":
        next_action="Reconcile newer same-scope evidence, then resume the bounded next task."
        note.append("checkpoint is a locator, not current truth")
    elif status=="SUPERSEDED":
        next_action="Load the superseding checkpoint."
        note.append("do not resume this checkpoint")

    return ResumePack(
        checkpoint_id=cp.checkpoint_id,
        checkpoint_status=status,
        project_key=cp.project_key,
        workstream=cp.workstream,
        current_state=cp.last_verified_state,
        next_action=next_action,
        evidence_locators=[e.locator for e in cp.evidence],
        do_not_repeat=cp.do_not_repeat,
        blockers=cp.blockers,
        notes=note
    )

def should_repeat(item:str, cp:Checkpoint, new_failure_evidence:bool=False,
                  requirement_changed:bool=False, dependency_changed:bool=False)->bool:
    if item not in cp.do_not_repeat:
        return True
    return bool(new_failure_evidence or requirement_changed or dependency_changed)
