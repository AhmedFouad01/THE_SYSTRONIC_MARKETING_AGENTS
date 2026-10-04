# SKILL — Memory Write Gate
ID: TSST-CTX-SK-005
Status: UNVALIDATED

## Trigger
Execution produces information that may deserve durable memory.

## Workflow
1. Classify item: FACT/DECISION/FEEDBACK/HYPOTHESIS/LEARNING/TODO/RISK/CHECKPOINT.
2. Confirm project scope.
3. Attach source/evidence.
4. Check duplication/conflict/supersession.
5. Check sensitivity and secret rules.
6. Decide: discard / ephemeral / proposed durable write.
7. Route durable TSST changes through controlled sync/review.

## Critical Failure
Promoting unsupported model inference or a single customer comment into durable general truth.


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
