# Architecture decisions and open risks

All ADRs below are PROPOSED, not user/Lead approvals.

| ADR | Decision | Rationale / trade-off | Revisit trigger |
|---|---|---|---|
| ADR-001 | Modular monolith + workers | Clear ownership with simpler transactions; scale workers separately | Measured deployment/scaling bottleneck |
| ADR-002 | Tenant isolation from first migration | Retrofitting it later risks data exposure | Enterprise isolation requirements |
| ADR-003 | Business events distinct from provider deliveries | Retries/provider changes do not redefine sales truth | None; core invariant |
| ADR-004 | Versioned deterministic attribution first | Explainable and testable; does not estimate causality | Sufficient data for advanced analysis |
| ADR-005 | Store remains order authority initially | Prevents premature ERP scope | Explicit decision to own inventory/checkout |
| ADR-006 | Foundation selected by spike, not UI appearance alone | Preserves options across Twenty/Frappe/custom | M0 results |
| ADR-007 | Narrow task workflows before visual general-purpose builder | Faster reliable vertical slice; less initial flexibility | Repeated validated workflow demand |
| ADR-008 | Agency operations P1; CRM/tracking pilot first | Keeps initial delivery bounded while preserving full vision | Pilot demonstrates operations dependency |

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
