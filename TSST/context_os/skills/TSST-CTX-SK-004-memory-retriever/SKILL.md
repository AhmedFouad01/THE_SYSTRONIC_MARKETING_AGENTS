---
name: tsst-ctx-sk-004-memory-retriever
description: "Use when a task needs facts, history or state that is not already in the bounded context, to retrieve the right memory."
id: TSST-CTX-SK-004
status: UNVALIDATED
version: 0.1
---
# SKILL — Memory Retriever
ID: TSST-CTX-SK-004
Status: UNVALIDATED

## Trigger
Task needs facts/history/state not already in the bounded context.

## Workflow
1. Convert decision need into retrieval queries.
2. Apply project/workstream filters first.
3. Prefer identifiers and exact current-state locators.
4. Retrieve small ranked fragments.
5. Expand only promising hits.
6. Preserve source locator/version/date.
7. Stop when decision-support sufficiency is reached.

## Output
Evidence bundle, not a generic corpus dump.


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
