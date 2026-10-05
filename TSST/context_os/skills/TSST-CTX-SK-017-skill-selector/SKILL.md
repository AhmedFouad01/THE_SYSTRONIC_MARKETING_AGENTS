---
name: tsst-ctx-sk-017-skill-selector
description: "Use when a task can match multiple registered skills, to select the smallest set that covers the acceptance criteria."
id: TSST-CTX-SK-017
status: UNVALIDATED
version: 0.1
---
# SKILL — Skill Selector
ID: TSST-CTX-SK-017
Status: UNVALIDATED
Priority: P1

## Trigger
A task can match multiple registered skills.

## Workflow
1. Read skill metadata only.
2. Select smallest set covering the acceptance criteria.
3. Load selected SKILL.md files.
4. Load references/scripts only when the workflow requires them.
5. Record why non-selected adjacent skills were unnecessary.

## Guardrail
Do not select skills merely because an agent owns them.

## Metric
Useful-skill precision and context overhead.


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
