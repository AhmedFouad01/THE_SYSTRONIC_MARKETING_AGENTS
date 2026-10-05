---
name: tsst-ctx-sk-012-memory-reconciler
description: "Use when two or more durable or operational records appear inconsistent, to reconcile them."
id: TSST-CTX-SK-012
status: UNVALIDATED
version: 0.1
---
# SKILL — Memory Reconciler
ID: TSST-CTX-SK-012
Status: UNVALIDATED
Priority: P1

## Trigger
Two or more durable/operational records appear inconsistent.

## Workflow
1. Compare project/workstream/state_scope.
2. Distinguish real conflict from cross-scope coexistence.
3. Resolve source authority by intent.
4. Check explicit supersession/version history.
5. Preserve unresolved contradiction.
6. Produce proposed reconciliation; do not mutate durable memory automatically.

## Output
RESOLVED / UNRESOLVED, winning/retained records, rationale, proposed write changes.

## Critical failure
Treating a CRM product milestone as superseding TSST governance state merely because it is newer.


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
