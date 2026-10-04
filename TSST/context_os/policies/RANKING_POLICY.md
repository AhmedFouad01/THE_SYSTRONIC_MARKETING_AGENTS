# TSST Retrieval Ranking Policy v0.2

Status: PROPOSED / UNVALIDATED

## Rule 1 — Filter, then rank

Project isolation, sensitivity, revocation and incompatible state-scope rules are hard filters.
They are not weights.

## Rule 2 — Authority is intent-specific

Suggested authority preference:

### current_state
Within the same state_scope:
LIVE_STATUS > VERIFIED_IMPLEMENTATION > ACCEPTED_DECISION > APPROVED_SPEC > REVIEWED_HANDOFF > history

### durable_decision
ACCEPTED_DECISION > OPERATING_GOVERNANCE > LIVE_STATUS > APPROVED_SPEC > implementation evidence

### implementation_truth
VERIFIED_IMPLEMENTATION > LIVE_STATUS > APPROVED_SPEC > ACCEPTED_DECISION > handoff

### approved_spec
APPROVED_SPEC > ACCEPTED_DECISION > LIVE_STATUS > implementation notes

### procedure
OPERATING_GOVERNANCE > APPROVED_SPEC > reviewed handoff > historical examples

### customer_evidence
Operational CRM evidence > reviewed research synthesis > derived cluster.
The derived cluster must link back to source evidence.

## Rule 3 — Scope beats similarity

Exact:
project + workstream + entity + state_scope

must rank above semantically similar material from another scope.

## Rule 4 — Supersession

`SUPERSEDED` records are excluded by default.
They are eligible only when:
- historical comparison is requested; or
- explaining why a decision changed.

## Rule 5 — Freshness

Freshness is relevant only when the fact is time-sensitive or the source class is mutable.
Do not penalize durable accepted decisions simply because they are old.

## Rule 6 — Verification

VERIFIED > REVIEWED > UNVERIFIED > HYPOTHESIS.

No amount of semantic similarity promotes HYPOTHESIS into FACT.

## Suggested Scoring After Hard Filters

The reference prototype uses normalized signals:

- intent authority fit: 0.30
- exact scope/entity fit: 0.25
- verification: 0.15
- keyword: 0.10
- semantic: 0.10
- provenance completeness: 0.05
- freshness when applicable: 0.05

Weights are benchmark parameters, not governance truth.
