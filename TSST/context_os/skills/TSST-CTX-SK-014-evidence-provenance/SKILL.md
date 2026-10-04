# SKILL — Evidence Provenance
ID: TSST-CTX-SK-014
Status: UNVALIDATED
Priority: P1

## Trigger
A claim, decision, memory write or handoff must remain auditable.

## Required chain
Claim -> Evidence record -> Source locator -> Version/date -> Verification state.

## Workflow
1. Attach smallest sufficient source locator.
2. Record source class and scope.
3. Separate direct evidence from inference.
4. Preserve transform lineage for derived summaries/clusters.
5. Reject orphan derived facts without source refs.

## Output
Provenance map suitable for audit/retrieval.


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
