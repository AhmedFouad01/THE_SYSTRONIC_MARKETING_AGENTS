# SKILL — Progress Recovery
ID: TSST-CTX-SK-016
Status: UNVALIDATED
Priority: P1

## Trigger
Fresh session, model switch, interrupted run or handoff must resume work.

## Workflow
1. Load governance kernel.
2. Load latest verified checkpoint for the relevant workstream.
3. Resolve current state across state scopes.
4. Confirm changed artifacts/evidence still exist.
5. Identify do-not-repeat items.
6. Resume the smallest next executable action.
7. Flag stale checkpoint if newer verified work exists.

## Output
Recovery brief + next action.

## Critical failure
Repeating already-closed work without evidence that it must be reopened.


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
