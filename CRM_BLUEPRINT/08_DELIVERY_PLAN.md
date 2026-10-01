# Delivery, validation and traceability

No calendar promise until foundation, staffing and volumes are known. Work packages below have exit gates rather than invented completion dates. Suggested roles are work ownership, not evidence that named agents participated or approved.

| Milestone | Deliverable | Exit gate | Owner |
|---|---|---|---|
| M0 Foundation spike | Twenty/Frappe/custom comparison; dependency/license boundary; Arabic prototype; connector eligibility; architecture ADR | Two isolated tenants, one custom entity/transition, backup/restore, API extension and RTL demo; selected route justified | DEV_AG proposed; Lead reviews |
| M1 CRM vertical slice | Tenancy/auth, contacts, lead intake, deals, stages, tasks, audit, outbox | TEN/IAM/CRM fixtures and cross-tenant negative tests pass | Engineering |
| M2 Journey and reporting | Web/form collection, identity links, campaign taxonomy, order import, attribution v1 | Deterministic known/unknown/refund fixtures; repeated events counted once | Engineering + measurement reviewer |
| M3 Provider integrations | Meta, eligible Google conversion path, GA4, spend import, health UI | Test-account receipts, failure/retry evidence, permissions and consent tests | Engineering + SPARK_AG proposed |
| M4 Segments and pilot | Segment rules, audience capability, three business configurations | End-to-end acceptance for each profile; restore and load targets measured | Lead + pilot users |
| M5 Agency operations | Plans, deliverables, versioned approvals, project milestones | Realistic monthly-plan rehearsal with client role | Operations + engineering |
| M6 SaaS readiness | Provisioning, entitlements, billing, metering, support boundaries | Tenant lifecycle, payment failure, export/deletion and isolation gates | Product + engineering |

M3 may proceed in parallel with M2 only after M1 event contracts are stable. No live customer data or ad activation required for documentation completion. Audience access blockers are surfaced as unsupported capabilities, not hidden behind a generic Connected status.

## Implementation order inside each milestone
Write executable schemas/contracts → migration and indexes → domain service → permission checks → worker behavior → UI → meaningful tests → staging evidence → release note. Each ticket names requirement IDs, dependencies, acceptance fixture and rollback approach.

## Initial engineering backlog
| Ticket | Scope | Depends on | Acceptance / SRS |
|---|---|---|---|
| ENG-001 | Foundation proof and ADR | None | M0 evidence; TEN-01, NFR-05 |
| ENG-002 | Tenant/member/grant enforcement | 001 | TEN-01/02, IAM-01 |
| ENG-003 | Contacts/intake/import/merge preview | 002 | CRM-01/02/03 |
| ENG-004 | Pipeline rules and concurrent transitions | 003 | CRM-04/06 |
| ENG-005 | Tasks/escalation + outbox/execution ledger | 004 | CRM-05, WF-01, INT-02 |
| ENG-006 | Collection schemas/identity/consent | 002,005 | TRK-01/02/03, DAT-01 |
| ENG-007 | Campaign/spend ingestion + attribution | 006 | CMP-01/02, ATR-01/02 |
| ENG-008 | Commerce and service thin records | 004,006 | COM-01, SRV-01 |
| ENG-009 | Provider connection and delivery adapters | 005,006 | INT-01/03/04 |
| ENG-010 | Segment AST/materialization/audience sync | 007,009 | SEG-01/02 |
| ENG-011 | Operations plan/approval module | 008 | OPS-01/02 |
| ENG-012 | Approved outbound channel workflows | 009,011 | WF-02 |
| ENG-013 | Commercialization control plane | Pilot exit | SAS-01 |

## Verification matrix
| Test | Scenario | Requirements |
|---|---|---|
| T01 | A requests B contact, signed file, job/export and forged tenant context | TEN-01/02, IAM-01 |
| T02 | Same lead webhook 10 times, then process crash | CRM-01, INT-02 |
| T03 | Shared phone and corrected identity link | CRM-02/03, TRK-02 |
| T04 | Concurrent transitions, stale version, won/reopened/won | CRM-04/06, TRK-03 |
| T05 | Browser/server copies, late event, out-of-window touch, unknown source | TRK-01/03, ATR-01/02 |
| T06 | Provider 429, 500, timeout after acceptance, partial batch error | INT-02/03/04 |
| T07 | Withdrawal after queueing, removal failure, expired OAuth | INT-01, SEG-02, DAT-01 |
| T08 | Unpaid/COD order, delivered order, partial payment/refund, duplicate status | COM-01, ATR-02 |
| T09 | Rule version change, timezone boundary, segment re-entry | SEG-01, WF-01 |
| T10 | Ad rename, cost reimport, multiple currencies/account timezones | CMP-01/02 |
| T11 | Superseded asset version approval and repeated project creation | OPS-01/02 |
| T12 | Follow-up due, escalation retry, rescheduled survey/quote version | CRM-05, SRV-01 |
| T13 | Deleted subject restored from backup, suppression reapplied | DAT-01, NFR-04 |
| T14 | Load/freshness, keyboard, RTL, mobile, secret-free logs | NFR-01/02/03/05/06 |
| T15 | Outbound opt-out/quiet hours; entitlement denied server-side | WF-02, SAS-01 |

## Definition of done
Linked requirement passes acceptance test; permissions and tenant scope covered; migration/backfill reviewed; provider calls use fixtures plus authorized test-account evidence where relevant; UI error/stale/empty states present; monitoring and recovery notes exist; no secret or unnecessary PII in logs; remaining unverified behavior stated explicitly.

## Pilot acceptance dataset
Three synthetic tenants. Include direct purchase with no lead, recurring buyer, unpaid delivered order, partial refund, survey reschedule, rejected quote, repeated form, anonymous visitor never identified, late-arriving event, revoked agency grant and consent withdrawal. Report expected counts/values per fixture before running product tests.

## Validation status of this package
Documentation only. Product tests, load tests, provider acceptance, license suitability, ERD rendering and real tenant isolation have not been performed. A structural document check is appropriate now; implementation verification belongs to the milestones above.
