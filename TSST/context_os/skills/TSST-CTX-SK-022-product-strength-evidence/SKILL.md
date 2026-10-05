---
name: tsst-ctx-sk-022-product-strength-evidence
description: "Use when the Lead must identify, rank or communicate product strengths or differentiators, to ground them in evidence."
id: TSST-CTX-SK-022
status: UNVALIDATED
version: 0.1
---
# SKILL — Product Strength Evidence
ID: TSST-CTX-SK-022
Status: UNVALIDATED
Priority: P1

## Trigger
The Lead must identify, rank or communicate product strengths/differentiators.

## Strength record
- candidate strength;
- target segment/JTBD;
- customer problem addressed;
- alternative/comparison;
- evidence types;
- proof locators;
- observed outcome;
- confidence;
- limitations;
- marketing-claim readiness.

## Confidence
VERIFIED:
multiple strong sources or measured outcome.

STRONG_SIGNAL:
credible repeated evidence, not yet conclusive.

HYPOTHESIS:
plausible but insufficiently proven.

## Workflow
1. Gather customer + product + outcome evidence.
2. Separate feature from customer value.
3. Compare against relevant alternative.
4. Check repeatability across appropriate segment.
5. Score evidence quality.
6. Flag claims that require more proof.
7. Never convert internal enthusiasm into differentiation.

## Output
Evidence-backed strength scorecard and open proof gaps.


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
