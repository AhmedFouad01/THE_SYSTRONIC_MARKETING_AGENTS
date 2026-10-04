# SKILL — Stale Memory Detector
ID: TSST-CTX-SK-013
Status: UNVALIDATED
Priority: P1

## Trigger
A task depends on mutable, time-sensitive, provider, policy, runtime or versioned information.

## Workflow
1. Determine whether the fact is inherently mutable.
2. Inspect source date/version/validity.
3. Inspect superseded_by and source revision.
4. Apply TTL only where a policy exists.
5. Mark CURRENT / STALE / SUPERSEDED / UNKNOWN.
6. Request refresh when current truth is required.

## Guardrail
Old does not automatically mean stale for accepted decisions or immutable historical evidence.


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
