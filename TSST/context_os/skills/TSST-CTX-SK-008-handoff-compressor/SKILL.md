---
name: tsst-ctx-sk-008-handoff-compressor
description: "Use when a subagent or specialist hands work to the Lead or another specialist, to compress the handoff."
id: TSST-CTX-SK-008
status: UNVALIDATED
version: 0.1
---
# SKILL — Handoff Compressor
ID: TSST-CTX-SK-008
Status: UNVALIDATED

## Trigger
Subagent/specialist hands work to Lead or another specialist.

## Output Contract
- task;
- result;
- facts;
- evidence locators;
- assumptions;
- contradictions;
- decisions required;
- acceptance status;
- residual risks;
- exact next action.

Do not include raw chain-of-thought or irrelevant exploration logs.


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
