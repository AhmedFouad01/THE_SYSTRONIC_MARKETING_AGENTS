# Architecture decisions and open risks


Version: v0.2 | Status: M1 CLOSED / M2 READY | M0 closed 2026-10-02; M1 closed 2026-10-02.


Owner decisions confirmed on 2026-10-01 are marked ACCEPTED below. M0 foundation and M1 core vertical-slice evidence have now been produced and independently re-audited. M2 and later operational/product gates remain separate and unpassed.


| ADR | Decision | Status | Rationale / trade-off | Revisit trigger |
|---|---|---|---|---|
| ADR-001 | Modular monolith + workers | ACCEPTED | Clear ownership with simpler transactions; scale workers separately | Measured deployment/scaling bottleneck |
| ADR-002 | Tenant isolation from first migration | ACCEPTED | Retrofitting it later risks data exposure | Enterprise isolation requirements |
| ADR-003 | BusinessEvent → immutable Conversion → Provider Delivery; attribution on Conversion | ACCEPTED | Adapters map Conversion; provider transport never redefines business truth or creates a second conversion source | Core invariant; change requires explicit architecture decision |
| ADR-004 | Versioned deterministic attribution first | ACCEPTED | Explainable and testable; does not estimate causality | Sufficient data for advanced analysis |
| ADR-005 | Store remains order authority initially | ACCEPTED | Prevents premature ERP scope | Explicit decision to own inventory/checkout |
| ADR-006 | **Custom Build foundation** | ACCEPTED 2026-10-01 | Full control over tenancy, CRM/event invariants and long-term SaaS path; avoids adapting the product core to Twenty/Frappe constraints | Explicit owner-approved architecture reset |
| ADR-007 | Narrow task workflows before visual general-purpose builder | ACCEPTED | Faster reliable vertical slice; less initial flexibility | Repeated validated workflow demand |
| ADR-008 | Agency operations P1; CRM/tracking pilot first | ACCEPTED | Keeps initial delivery bounded while preserving full vision | Pilot demonstrates operations dependency |
| ADR-009 | Fixed RBAC/action catalogue + scoped client-issued agency grants; deny by default | ACCEPTED 2026-10-01 | Simple explicit role/action/field rules and finite object scopes; arbitrary ACL scripting rejected for M0/M1 | Demonstrated need beyond assigned/tenant scopes |
| ADR-010 | Foundation / Vertical Slice gate M0–M1, Pilot Completion gate M2–M4 | ACCEPTED | All P0 scope retained; simultaneous full-P0 first release rejected because it prevents a narrow learning slice | Explicit owner-approved scope change |
| ADR-011 | Subject privacy and tenant portability are separate P0 workflows | ACCEPTED | Separate authority, completeness, models and tests; portability is not deferred to billing | Approved export exclusions; new modules extend dataset inventory |
| ADR-012 | Idempotency and deduplication use separate lifecycles | ACCEPTED 2026-10-01 | API retry-cache expiry must never erase source/business outcome identity; provider delivery has its own stable idempotency key | Evidence from M0/M3 requires tuning |
| ADR-013 | Tenant export is complete authorized portability, versioned and audited | ACCEPTED 2026-10-01 | Supports future SaaS portability while preserving tenant/field boundaries | Approved dataset exclusions or regulatory constraints |
| ADR-014 | Attribution defaults: First Touch + Last Non-Direct Touch; 30-day configurable lookback | ACCEPTED 2026-10-01 | Explainable baseline; internal attribution remains distinct from provider reports | Measurement owner approves a different default/model |
| ADR-015 | Default conversion truth by business profile | ACCEPTED 2026-10-01 | Services/agency: `deal_won`; commerce: ordered/paid/delivered remain separate, with `payment_captured` as default revenue truth; no double counting | Explicit owner-approved profile mapping |


## M0 custom-build exit gate
M0 no longer compares product foundations. It must select/pin concrete libraries and versions inside the accepted Custom Build direction and prove with synthetic evidence:
- two isolated tenants with tenant-equal constraints + PostgreSQL RLS + application authorization;
- RBAC/scoped-grant allow/deny and revocation behavior;
- one CRM entity/controlled stage transition with expected-version conflict handling;
- BusinessEvent + transactional outbox + worker retry/idempotency;
- audit evidence;
- Arabic RTL / English LTR proof;
- migrations plus backup/restore feasibility;
- dependency/license/security review for selected libraries.


## Open decisions / verification inputs
| ID | Missing input | Current working position | Required before |
|---|---|---|---|
| OQ-01 | Actual store platform | Generic store adapter contract | Store connector implementation |
| OQ-02 | Hosting region/data retention | Configurable policies, no legal period assumed | Production hosting |
| OQ-03 | Volumes/team/budget | SRS benchmark as provisional load envelope | Capacity/cost commitment |
| OQ-04 | Ad assets and app access | Mock/test-account adapters | Real provider acceptance |
| OQ-05 | Per-business override of default conversion mapping, if any | ADR-015 defaults apply until explicitly overridden | Conversion mapping activation |
| OQ-06 | Default stage definitions and qualification | Reference profiles in scope document | Pilot configuration |
| OQ-07 | SaaS commercialization/license model | Custom Build selected; M0 stack frozen; commercialization/license policy remains a later product decision | Commercial distribution decision |
| OQ-08 | Role/action/field catalogue fine-tuning | ADR-009 baseline accepted; exact role matrix may evolve from pilot evidence | M1 real-user configuration |
| OQ-09 | Dedup/suppression tombstone retention versus privacy policy | Keep replay identity independent of API/raw-body expiry; minimize identifiers | Approved policy before real-data intake/deletion |
| OQ-10 | Exact API retry-cache duration and provider retry/dedup windows | M0 validated separation/binding semantics; exact policy duration and provider-specific windows remain configurable/verified later | M3 provider contract freeze |
| OQ-11 | Exact tenant-export dataset/field exclusions and artifact expiry | Complete authorized export with versioned manifest; never secrets or foreign tenant data | DAT-02 implementation design and M4 acceptance |
| OQ-12 | Profile-specific attribution/qualification overrides | ADR-014 defaults apply; overrides require explicit approval | M2 reporting/pilot configuration |


The owner has approved the scalable default direction; the OQs above remain concrete configuration/evidence inputs rather than reasons to reopen the foundation. Missing provider access or operational evidence stays open.


## Risk register
| Risk | Mitigation / owner |
|---|---|
| Meta/Google permissions or API changes | Capability probes, pinned tested versions, adapter contract tests / Engineering |
| Cross-client leakage | Composite constraints, RLS, isolation tests, scoped agency grants / Engineering |
| Custom Build expands too broadly | M0/M1 narrow exit gates; explicit change requests / Lead + Engineering |
| Building ERP and CRM simultaneously | Phase boundaries and explicit change requests / Lead |
| Incorrect revenue or double conversions | Canonical outcomes, immutable IDs, reconciliation, ADR-015 / Measurement + engineering |
| Losing source attribution | Persist source evidence, unknown bucket, versioned recalculation / Engineering |
| Provider outage creates backlog | Durable outbox, aging limits, health view and kill switch / Operations |
| Dependency or license surprises | Pin libraries, dependency/license review in M0, upgrade rehearsals / Engineering |
| Scope includes AI too early | Rule-based baseline, AI later only with evaluation and permissions / Product |


Change log:
- 2026-10-02 M1 closure: implementation `1b395b81a9f0398bd0b9d333b7f7c8f22c1ed897`, targeted remediation `e0a86d9876e29caad5009015074e04b322ad7601`, independent re-audit PASS; M2 not started.
- v0.1 initial architecture package, 2026-10-01. No implementation or provider account mutation performed.
- v0.2 audit remediation, 2026-10-01, commit `e09446c54ae202a7415006fd61b891242b0e7f7f`.
- 2026-10-01 owner decision update: Custom Build confirmed; scalable baseline defaults accepted for RBAC, tenant isolation, idempotency/dedup separation, tenant portability, attribution and conversion truth.


## M0 closure decision/evidence — 2026-10-02
[ADR-001](../CRM_APP/ADR-001.md) freezes the minimal Node/TypeScript/PostgreSQL stack. The bounded worker uses the database outbox directly without Redis; external delivery remains excluded. The implementation was remediated at `7f3ce318eac24e8ec4f6bd47fcde44f07dae2560` and independently re-audited with verdict **PASS WITH NON-BLOCKING FOLLOW-UPS**. All three prior findings are CLOSED; 22/22 tests, lint/typecheck/build, real PostgreSQL RLS/isolation, RBAC/revocation, retry-key binding, concurrent-worker SKIP LOCKED behavior and native restore evidence passed. No blocking M0 finding remains.


**Decision:** M0 is CLOSED and the product may enter M1 CRM Vertical Slice. This does not certify production readiness or later-milestone acceptance. Non-blocking follow-ups: add bounded timeout/cancellation/cleanup to the worker-concurrency test; Docker-specific tooling remains unverified while the native/local-mirror M0 path is demonstrated.




## M1 implementation decision/evidence — 2026-10-02
The bounded M1 CRM core vertical slice is closed and the product is **M2 READY**.


Final independent evidence:
- audited remediation commit: `e0a86d9876e29caad5009015074e04b322ad7601`;
- verdict: **PASS — M1 may close**;
- **55/55** tests passed with **22/22 M0 regression**;
- real PostgreSQL tenant/RBAC checks passed;
- lead idempotency, deal/pipeline atomicity and commercial-outcome dedup passed;
- task/automation retry and authority-revocation behavior passed;
- protected-key missing/wrong-key behavior fails closed without runtime replacement;
- Task PATCH target-deal authorization is enforced before mutation with no denied-operation side effects;
- bounded clean-install and M0→M1 upgrade evidence preserved rows and protected-field state.


Deployment follow-ups remain Docker/direct-Drive execution verification plus real production identity/MFA and external secret custody/KMS. No production readiness or M2 implementation is inferred.