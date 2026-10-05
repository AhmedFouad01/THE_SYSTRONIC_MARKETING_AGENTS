---
name: tsst-ctx-sk-010-model-router
description: "Use before assigning a model or runtime to a task, to route it to the right model tier."
id: TSST-CTX-SK-010
status: UNVALIDATED
version: 0.1
---
# SKILL — Model Router
ID: TSST-CTX-SK-010
Status: UNVALIDATED

## Trigger
Before assigning model/runtime for a task.

## Routing
FAST: extraction/classification/simple transformation.
EXECUTION: default specialist implementation/research/debugging.
EXECUTIVE: architecture, material conflicts, high-impact ambiguity, repeated execution failure, critical synthesis.

## Escalation
Escalate with a compressed Escalation Packet, not full transcript replay.

## Guardrail
Do not use executive tier merely because input volume is large.


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
