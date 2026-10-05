---
name: tsst-ctx-sk-018-skill-evaluator
description: "Use when a new or materially changed skill needs evidence before promotion, to evaluate the skill."
id: TSST-CTX-SK-018
status: UNVALIDATED
version: 0.1
---
# SKILL — Skill Evaluator
ID: TSST-CTX-SK-018
Status: UNVALIDATED
Priority: P1

## Trigger
New or materially changed skill requires evidence before promotion.

## Workflow
1. Define trigger-positive and trigger-negative fixtures.
2. Define expected outputs and critical failures.
3. Run practical evaluation.
4. Score correctness, scope discipline, evidence and cost.
5. Preserve run artifacts.
6. Recommend status; only authorized Lead/governance may promote.

## Guardrail
File existence is never validation.


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
