# SKILL — Tool Router
ID: TSST-CTX-SK-011
Status: UNVALIDATED
Priority: P1

## Trigger
More than one tool/MCP/source connector could satisfy a task.

## Inputs
Task intent, authority, data location, read/write requirement, sensitivity, available tool inventory.

## Workflow
1. Prefer the authoritative native source/tool.
2. Prefer read-only discovery before write-capable action.
3. Load only relevant tool namespace/schema.
4. Check authority before write/external action.
5. Return tool choice + reason + fallback.
6. Avoid duplicate reads through multiple connectors unless verifying a conflict.

## Output
Selected tool plan, permissions required, source-of-truth expectation, fallback.

## Critical failures
- using public web to replace a private authoritative project source;
- invoking a write-capable tool without applicable authority;
- loading a broad toolset unnecessarily.


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
