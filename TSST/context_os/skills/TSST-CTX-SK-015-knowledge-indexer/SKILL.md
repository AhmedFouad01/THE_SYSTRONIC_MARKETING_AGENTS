---
name: tsst-ctx-sk-015-knowledge-indexer
description: "Use when a source corpus needs derived search or index support, to build and maintain the knowledge index."
id: TSST-CTX-SK-015
status: UNVALIDATED
version: 0.1
---
# SKILL — Knowledge Indexer
ID: TSST-CTX-SK-015
Status: UNVALIDATED
Priority: P1

## Trigger
A source corpus needs derived search/index support.

## Workflow
1. Read source metadata without altering canonical content.
2. Exclude secrets/prohibited material.
3. Assign project/workstream/state_scope/entity metadata.
4. Chunk by semantic/document boundaries, not arbitrary size alone.
5. Preserve source/version/line or section locators.
6. Build metadata + lexical index first.
7. Add embeddings only when benchmarked.
8. Invalidate/reindex on source version change.

## Output
Derived index records with mandatory source_refs.

## Critical failure
Index becoming the only copy of important project truth.


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
