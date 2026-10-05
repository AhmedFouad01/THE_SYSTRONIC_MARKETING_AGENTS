---
name: tsst-ctx-sk-020-large-project-planner
description: "Use when work spans multiple milestones, teams, gates or sessions, to plan a large project."
id: TSST-CTX-SK-020
status: UNVALIDATED
version: 0.1
---
# SKILL — Large Project Planner
ID: TSST-CTX-SK-020
Status: UNVALIDATED
Priority: P1

## Trigger
Work spans multiple milestones, teams, gates or sessions.

## Workflow
1. Define outcome and acceptance.
2. Separate governance/product/release state scopes.
3. Build milestones and reversible increments.
4. Define evidence required to close each gate.
5. Map dependencies and reserved decisions.
6. Define checkpoints and recovery points.
7. Route work packages with bounded context.
8. Track changes without reopening closed gates casually.

## Output
Gate map, dependencies, acceptance evidence, next executable task.


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
