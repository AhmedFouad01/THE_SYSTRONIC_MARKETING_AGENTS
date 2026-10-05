---
name: tsst-ctx-sk-009-session-checkpoint
description: "Use when closing a non-trivial execution block, nearing compaction or planning a handoff to a fresh session, to write a checkpoint."
id: TSST-CTX-SK-009
status: UNVALIDATED
version: 0.1
---
# SKILL — Session Checkpoint
ID: TSST-CTX-SK-009
Status: UNVALIDATED

## Trigger
Closing a non-trivial execution block, context nearing compaction, or planned handoff to a fresh session.

## Required Fields
- current milestone/gate;
- last verified state;
- completed items;
- evidence;
- changed artifacts;
- open items;
- blockers;
- next action;
- do-not-repeat;
- confidence/uncertainty.

## Rule
Checkpoint describes verified state, not aspirations.


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
