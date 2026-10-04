# SKILL — Current State Loader
ID: TSST-CTX-SK-002
Status: UNVALIDATED

## Trigger
Start/resume of substantial project or workstream work.

## Workflow
1. Read live current-status/checkpoint.
2. Read accepted decisions affecting the task.
3. Inspect newer verified implementation evidence if current status may lag.
4. Identify current milestone/gate/checkpoint.
5. List completed, active, blocked, next.
6. Identify explicit do-not-repeat work.
7. Surface governance-state mismatch without reopening completed implementation.

## Output
Verified Current State Snapshot.

## Critical Failure
Restarting completed work because an older status file was not reconciled with newer authoritative evidence.


## Shared v0.2 execution contract

### Required return fields
- `status`: PASS | PARTIAL | BLOCKED | FAIL
- `facts`
- `assumptions`
- `evidence_locators`
- `conflicts`
- `remaining_unknowns`
- `next_action`

### General guardrails
- Respect project/workstream/state_scope boundaries.
- Preserve source provenance.
- Do not promote derived material above canonical sources.
- Do not claim validation/readiness from package creation.
- Do not persist secrets.

### Evaluation requirement
This skill remains `UNVALIDATED` until a practical fixture demonstrates correct triggering, output, boundary behavior and critical-failure avoidance.
