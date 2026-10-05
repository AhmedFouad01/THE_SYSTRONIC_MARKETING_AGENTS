---
name: tsst-ctx-sk-003-source-authority-resolver
description: "Use when two or more sources can answer the same project-state or decision question, to resolve which source is authoritative."
id: TSST-CTX-SK-003
status: UNVALIDATED
version: 0.1
---
# SKILL — Source Authority Resolver
ID: TSST-CTX-SK-003
Status: UNVALIDATED

## Trigger
Two or more sources can answer the same project-state or decision question.

## Workflow
1. Classify each source: live state, accepted decision, implementation evidence, approved spec, reviewed handoff, historical evidence, chat/inference.
2. Compare version/date.
3. Check whether newer source legitimately supersedes older source.
4. Preserve unresolved contradiction.
5. Return selected source set and rationale.

## Guardrail
Recency alone does not override an accepted decision unless the newer source has authority to supersede it.


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
