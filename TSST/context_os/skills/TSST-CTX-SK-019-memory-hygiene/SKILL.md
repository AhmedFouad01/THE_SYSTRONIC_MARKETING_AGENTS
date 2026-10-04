# SKILL — Memory Hygiene
ID: TSST-CTX-SK-019
Status: UNVALIDATED
Priority: P2

## Trigger
Duplicate, stale, superseded or low-value durable records accumulate.

## Workflow
1. Identify exact/near duplicates.
2. Preserve canonical source and provenance.
3. Mark superseded rather than destroying audit history.
4. Archive low-use historical evidence where policy allows.
5. Detect orphan derived records.
6. Produce proposed cleanup set for review.

## Guardrail
Never delete evidence needed for accepted decisions/audit without retention authority.


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
