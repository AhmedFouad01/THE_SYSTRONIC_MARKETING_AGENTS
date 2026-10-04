# TSST Context OS v0.6 RC1 — Proposal Pack

Status: **PROPOSED / NOT DURABLY APPLIED**
Date: 2026-10-03

This pack is the first implementation proposal for a context and memory operating layer for TSST.

It does **not** replace TSST governance, Real Memory, specialist contracts, CRM architecture, or readiness gates. It is designed to sit above them as the context-selection and continuity layer.

## Objectives

1. Recover the exact current case without rereading the whole project.
2. Route only relevant context to each agent/subagent.
3. Preserve authoritative project state outside the model context window.
4. Separate canonical memory from derived retrieval indexes.
5. Reduce token use and context pollution.
6. Support Claude and Codex with compatible skill packages.
7. Enforce project isolation, evidence provenance, and guarded memory writes.
8. Enable model routing by task complexity/cost rather than agent identity.
9. Resume long-running work from verified checkpoints.
10. Make CRM/customer feedback usable as structured evidence without polluting TSST durable memory.

## Proposed Gate Sequence

- Gate C0 — Architecture & Governance
- Gate C1 — Core Context Skills
- Gate C2 — Retrieval & Indexing
- Gate C3 — Model/Tool Routing
- Gate C4 — CRM/Voice-of-Customer Memory
- Gate C5 — Long-Run Recovery & Compaction
- Gate C6 — Evaluation / Cost / Failure Testing
- Gate C7 — Controlled Production Pilot

Nothing in this pack changes current TSST readiness by itself.


## v0.2 delta

- Completed SKILL.md packages for all 22 proposed Context OS skills.
- Added multi-axis State Scope Model.
- Added retrieval request/result contract.
- Added Context Record JSON schema.
- Added deterministic hard-filter + ranking policy.
- Added conflict/staleness policy.
- Added C2 benchmark harness.
- Added executable reference retrieval prototype with unit tests.
- No Real Memory or TSST production governance was modified.


## v0.3 delta — C3 Routing

- Added provider-neutral FAST / EXECUTION / CODE / EXECUTIVE tiers.
- Added runtime model binding configuration.
- Added cost guard and retry ceilings.
- Added authority-aware tool routing.
- Added deferred/eager tool policy.
- Added failure-fingerprint escalation rules.
- Added routing audit contract.
- Added executable reference router.
- 12/12 C3 reference tests pass.
- No provider model ID or price is made durable project truth.
- No Real Memory, production registry or readiness status was changed.


## v0.4 delta — C4 CRM / Voice of Customer

- Added VOC observation schema.
- Added customer-evidence privacy boundary.
- Added deduplication and distinct-account logic.
- Added contradiction preservation.
- Added product strength confidence states.
- Added stricter CLAIM_READY gate.
- Added product-vs-UX-vs-positioning-vs-measurement routing.
- Added executable VOC reference implementation.
- 10/10 C4 reference tests pass.
- Synthetic benchmark does not assert a real product strength.


## v0.5 delta — C5 Recovery

- Added durable checkpoint classes and schema.
- Added provider-neutral Resume Pack.
- Added stale/superseded/invalid checkpoint handling.
- Added do-not-repeat protection.
- Added same-scope vs cross-scope recovery rules.
- Added evidence/version validation before resume.
- Added fresh-session/provider-switch recovery prototype.
- 10/10 C5 reference tests pass.


## v0.6 RC1 delta — C6 Stress & Installability

- Added integrated C6 stress harness.
- Exercised 12,503 synthetic/reference assertions.
- Hard failures: 0.
- Added install map separating runtime/repository/governance/Real Memory changes.
- Added Release Candidate definition and rollback boundary.
- RC1 is installable for controlled evaluation, not production-ready.
