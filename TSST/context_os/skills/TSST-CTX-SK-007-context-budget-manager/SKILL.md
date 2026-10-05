---
name: tsst-ctx-sk-007-context-budget-manager
description: "Use when a task involves multiple sources, skills or tools or runs long, to keep the context budget under control."
id: TSST-CTX-SK-007
status: UNVALIDATED
version: 0.1
---
# SKILL — Context Budget Manager
ID: TSST-CTX-SK-007
Status: UNVALIDATED

## Trigger
Multiple sources/skills/tools or a long-running task.

## Workflow
1. Assign budget tier S/M/L/XL.
2. Prefer source fragments over entire files.
3. Prefer subagent compression for bulk material.
4. Deduplicate repeated context.
5. Keep stable governance in cacheable prefix where runtime supports it.
6. Check whether each added source can change the decision.
7. Compact/checkpoint before quality degrades.

## Output
Budget tier, included sources, excluded sources, escalation reason if XL.


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
