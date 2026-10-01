# Architecture decisions and open risks

Version: v0.2 | Status: M0 READY FOR FOUNDATION SPIKE | Pre-implementation.

Architecture selections and role/business defaults below remain PROPOSED, not user/Lead approvals. The user's remediation mandate freezes the evidence boundary and staged delivery gates for this blueprint; that is not approval of open business policies or a foundation choice.

| ADR | Decision | Rationale / trade-off | Revisit trigger |
|---|---|---|---|
| ADR-001 | Modular monolith + workers | Clear ownership with simpler transactions; scale workers separately | Measured deployment/scaling bottleneck |
| ADR-002 | Tenant isolation from first migration | Retrofitting it later risks data exposure | Enterprise isolation requirements |
| ADR-003 | BusinessEvent → immutable Conversion → Provider Delivery; attribution on Conversion | Adapters map Conversion; provider transport never redefines business truth or creates a second conversion source | Blueprint invariant required by remediation mandate |
| ADR-004 | Versioned deterministic attribution first | Explainable and testable; does not estimate causality | Sufficient data for advanced analysis |
| ADR-005 | Store remains order authority initially | Prevents premature ERP scope | Explicit decision to own inventory/checkout |
| ADR-006 | Foundation selected by spike, not UI appearance alone | Preserves options across Twenty/Frappe/custom | M0 results |
| ADR-007 | Narrow task workflows before visual general-purpose builder | Faster reliable vertical slice; less initial flexibility | Repeated validated workflow demand |
| ADR-008 | Agency operations P1; CRM/tracking pilot first | Keeps initial delivery bounded while preserving full vision | Pilot demonstrates operations dependency |
| ADR-009 | Fixed RBAC/action catalogue + scoped client-issued agency grants | Simple explicit role/action/field rules and finite object scopes; arbitrary ACL scripting rejected for M0/M1 | Demonstrated need beyond assigned/tenant scopes; role defaults need OQ-08 approval |
| ADR-010 | Foundation / Vertical Slice gate M0–M1, Pilot Completion gate M2–M4 | All P0 scope retained; simultaneous full-P0 first release rejected because it prevents a narrow learning slice | Explicit owner-approved scope change |
| ADR-011 | Subject privacy and tenant portability are separate P0 workflows | Separate authority, completeness, models and tests; deferring portability to SaaS billing rejected | Approved export policy; new modules extend dataset inventory |

## M0 foundation scorecard
Score only after demonstration: isolation 25%, extension/upgrade path 20%, journey/event model fit 20%, Arabic/mobile usability 15%, operational recovery 10%, commercial/license fit 10%. Any isolation failure or incompatible licensing blocks selection regardless of total score. Numbers are proposed evaluation weights, not scores already earned.

## Open decisions
| ID | Missing input | Current working position | Required before |
|---|---|---|---|
| OQ-01 | Actual store platform | Generic store adapter contract | Store connector implementation |
| OQ-02 | Hosting region/data retention | Configurable policies, no legal period assumed | Production hosting |
| OQ-03 | Volumes/team/budget | SRS benchmark as provisional load envelope | Capacity/cost commitment |
| OQ-04 | Ad assets and app access | Mock/test-account adapters | Real provider acceptance |
| OQ-05 | What counts as a purchase per business | Distinct ordered/paid/delivered metrics | Conversion mapping activation |
| OQ-06 | Default stage definitions and qualification | Reference profiles in scope document | Pilot configuration |
| OQ-07 | SaaS distribution/license model | Upstream boundaries reviewed in M0 | Foundation adoption/distribution |
| OQ-08 | Owner-approved role/action/field defaults and delegation scopes | Deny by default; proposed RBAC/scoped grants, no arbitrary ACL | M1 real-user configuration; owner approval |
| OQ-09 | Dedup/suppression tombstone retention versus privacy policy | Keep replay identity independent of API/raw-body expiry; minimize identifiers | M0 design validation; approved policy before real-data intake/deletion |
| OQ-10 | API retry-cache duration and provider retry/dedup windows | API 7 days proposed; provider-specific windows unverified; no expiry of internal business identity | M0/M3 contract freeze |
| OQ-11 | Tenant export eligible dataset/field inventory, audit exclusions, snapshot and artifact expiry policy | Complete authorized export with versioned manifest; never secrets or foreign tenant data | DAT-02 implementation design and M4 owner acceptance |
| OQ-12 | Attribution defaults, qualification and measurement policy approval | First/last-touch and 30-day lookback proposed; purchase remains OQ-05 | M2 reporting configuration and pilot approval |

Product owner approves business meanings, role defaults, export exclusions and target/scope changes. Engineering supplies foundation/retention/retry evidence; privacy/legal and measurement reviewers advise within their remit. Missing access or evidence stays open. M0 may investigate with synthetic fixtures while these questions remain unresolved; M1 starts only after the applicable foundation/security decisions, not all provider/pilot work. Foundation choice and external schemas/capabilities remain unselected/unverified until demonstrated.

## Risk register
| Risk | Mitigation / owner |
|---|---|
| Meta/Google permissions or API changes | Capability probes, pinned tested versions, adapter contract tests / Engineering |
| Cross-client leakage | Composite constraints, isolation tests, scoped agency grants / Engineering |
| Attractive starter lacks CRM invariants | Same vertical slice in each candidate / DEV_AG proposed |
| Building ERP and CRM simultaneously | Phase boundaries and explicit change requests / Lead |
| Incorrect revenue or double conversions | Canonical outcomes, immutable IDs, reconciliation / Measurement + engineering |
| Losing source attribution | Persist source evidence, unknown bucket, versioned recalculation / Engineering |
| Provider outage creates backlog | Durable outbox, aging limits, health view and kill switch / Operations |
| Upgrade conflicts with upstream customization | Prefer extension APIs, pin releases, migration rehearsals / Engineering |
| Scope includes AI too early | Rule-based baseline, AI later only with evaluation and permissions / Product |

Change log: v0.1 initial architecture package, 2026-10-01. No implementation or provider account mutation performed.

v0.2, 2026-10-01: controlled audit remediation of authorization, logical model, DAT-02 portability, staged gates, conversion truth, dedup lifecycles and full traceability. Original v0.1 preserved at `bb89734f30522532e720111c90c76095db00405f`. No application code, provider testing or operational verification performed. This documentation status does not mean M0 has passed or that business decisions were approved.
