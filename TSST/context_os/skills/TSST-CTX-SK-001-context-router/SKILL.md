---
name: tsst-ctx-sk-001-context-router
description: "Use when a non-trivial TSST task needs project context, multiple sources, agents, tools or a resumable state, to build the smallest sufficient Context Pack."
id: TSST-CTX-SK-001
status: UNVALIDATED
version: 0.1
---
# SKILL — Context Router
ID: TSST-CTX-SK-001
Status: UNVALIDATED

## Trigger
Use for any non-trivial TSST task requiring project context, multiple sources, agents, tools or a resumable execution state.

## Objective
Build the smallest sufficient Context Pack for a decision or execution package.

## Workflow
1. Identify project/workstream/task/decision.
2. Load governance kernel.
3. Request Current State Loader.
4. Resolve source authority.
5. Identify required evidence classes.
6. Select minimum skills/tools.
7. Delegate heavy reads where useful.
8. Assemble bounded Context Pack.
9. Reject unrelated/duplicate/stale context.
10. Return pack + unresolved gaps.

## Output
Context Pack + retrieval rationale + excluded-context note.

## Guardrails
- Never import unrelated project memory.
- Never treat derived summaries as higher authority than their sources.
- Never bulk-load merely because sources are available.

## Evaluation
Given a noisy project with old/new states, retrieve enough to correctly continue the active task while excluding unrelated history.


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
