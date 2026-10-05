---
name: tsst-ctx-sk-006-project-isolation-guard
description: "Use when any retrieval or handoff can touch more than one Real Memory project, to keep projects isolated."
id: TSST-CTX-SK-006
status: UNVALIDATED
version: 0.1
---
# SKILL — Project Isolation Guard
ID: TSST-CTX-SK-006
Status: UNVALIDATED

## Trigger
Any retrieval or handoff can touch more than one Real Memory project.

## Rules
- Default deny durable cross-project import.
- Every context item must retain project_key.
- Cross-project operational analysis is allowed only within task scope.
- Durable transfer requires an explicit controlled handoff.
- Never copy secrets/credentials/private customer data into TSST memory.

## Evaluation
Adversarial fixture with same entity names across multiple projects must produce zero wrong-project durable facts.


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
