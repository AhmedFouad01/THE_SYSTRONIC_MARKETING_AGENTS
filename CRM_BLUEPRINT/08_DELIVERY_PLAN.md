# Delivery, validation and traceability

No calendar promise until foundation, staffing and volumes are known. Work packages below have exit gates rather than invented completion dates. Suggested roles are work ownership, not evidence that named agents participated or approved.

| Milestone | Deliverable | Exit gate | Owner |
|---|---|---|---|
| M0 Custom-Build foundation spike | Freeze concrete TypeScript/PostgreSQL/queue/storage libraries and versions; dependency/license/security review; Arabic prototype; tenancy/RBAC/outbox/recovery proof | Two synthetic isolated tenants, one entity/transition, RBAC/revocation and replay probes, business event + outbox/worker idempotency, audit, migrations, backup/restore and RTL/LTR demo; evidence and blockers recorded | DEV_AG proposed; Lead reviews |
| M1 CRM vertical slice | Tenancy/auth, manual contacts/lead intake, deals/stages, tasks, narrow automation, audit, internal event/outbox ledger | Only SRS M1 subsets pass with cross-tenant/object/field negative tests; no requirement to finish tracking, providers, segmentation or all profiles | Engineering |
| M2 Journey and reporting | Web/form collection, identity links, campaign taxonomy, order import, attribution v1 | Deterministic known/unknown/refund fixtures; repeated events counted once | Engineering + measurement reviewer |
| M3 Provider integrations | Meta, eligible Google conversion path, GA4, spend import, health UI | Test-account receipts, failure/retry evidence, permissions and consent tests | Engineering + SPARK_AG proposed |
| M4 Segments and pilot | Segment rules, audience capability, three business configurations, completed privacy and tenant portability | Every P0 criterion including DAT-01/02; end-to-end profile acceptance, restore/load evidence and open decision approvals | Lead + pilot users |
| M5 Agency operations | Plans, deliverables, versioned approvals, project milestones | Realistic monthly-plan rehearsal with client role | Operations + engineering |
| M6 SaaS readiness | Provisioning, entitlements, billing, metering, support boundaries | Tenant lifecycle/payment failure; regression of pilot export/deletion/isolation gates | Product + engineering |

M3 may proceed in parallel with M2 only after M1 event contracts are stable. No live customer data or ad activation required for documentation completion. Audience access blockers are surfaced as unsupported capabilities, not hidden behind a generic Connected status.

**Foundation / Vertical Slice gate** spans the M0 demonstration and narrow M1 slice. Custom Build is owner-confirmed; **M0 closed on 2026-10-02 after independent re-audit with no blocking findings**. M1 is now the active product-delivery gate; M0 closure does not imply production readiness. **Pilot Completion gate** is M4 after all M2–M4 and remaining M1 requirement coverage is complete. P0 capabilities are retained even when later than M1. Unsupported providers remain blockers to their required pilot capability unless the owner explicitly changes scope.

## Implementation order inside each milestone
Write executable schemas/contracts → migration and indexes → domain service → permission checks → worker behavior → UI → meaningful tests → staging evidence → release note. Each ticket names requirement IDs, dependencies, acceptance fixture and rollback approach.

## Initial engineering backlog
| Ticket | Scope | Depends on | Acceptance / SRS |
|---|---|---|---|
| ENG-001 | Custom-Build foundation proof, stack/version freeze and ADR | None | M0 evidence; TEN-01, IAM-01, NFR-04/05/06 |
| ENG-002 | Tenant/member/grant enforcement | 001 | TEN-01/02, IAM-01 |
| ENG-003 | M1 manual contacts/intake/merge; remaining channels in M2/M3 | 002 | CRM-01/02/03; partial M1 acceptance only |
| ENG-004 | Pipeline rules and concurrent transitions | 003 | CRM-04/06 |
| ENG-005 | Tasks/escalation + outbox/execution ledger | 004 | CRM-05, WF-01, INT-02 |
| ENG-006 | Collection schemas/identity/consent | 002,005 | TRK-01/02/03; DAT-01 consent/suppression integration, lifecycle in 014 |
| ENG-007 | Campaign/spend ingestion + attribution | 006 | CMP-01/02, ATR-01/02 |
| ENG-008 | Commerce and service thin records | 004,006 | COM-01, SRV-01 |
| ENG-009 | Provider connection and delivery adapters | 005,006 | INT-01/03/04 |
| ENG-010 | Segment AST/materialization/audience sync | 007,009 | SEG-01/02 |
| ENG-011 | Operations plan/approval module | 008 | OPS-01/02 |
| ENG-012 | Approved outbound channel workflows | 009,011 | WF-02 |
| ENG-013 | Commercialization control plane | Pilot exit | SAS-01 |
| ENG-014 | Subject privacy lifecycle, active-store deletion, remote status and restore suppression (M2–M4) | 002,006 | DAT-01, NFR-04; T07/T13 |
| ENG-015 | Tenant portability snapshot/manifest/attachments and revocable download (M4) | 002,008,010,014 | DAT-02; T17; future modules extend export inventory |
| ENG-016 | Gate-specific benchmark, accessibility, audit/log and recovery evidence | 001; each affected module | NFR-01/02/03/04/05/06; T13/T14; full pilot evidence by M4 |

## Verification matrix
| Test | Scenario | Requirements |
|---|---|---|
| T01 | A requests B contact, file/job/export; forged tenant context; role/grant expiry/revocation; privileged MFA; forbidden field reads/writes/imports; cached response and artifact download after revocation | TEN-01/02, IAM-01 |
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
| T16 | Retry API command inside/after proposed cache window; raw-body expiry then source replay; duplicate conversion normalization, remap and delivery timeout; disable rule/revoke actor between batches | CRM-01/06, TRK-03, INT-02, TEN-02, IAM-01, WF-01 |
| T17 | Export complete tenant fixture and reconcile manifest counts/relationships/attachments; exclude secrets and other tenants; restricted-field denial; revoke while queued/generating and before download; expired artifact | DAT-02, TEN-01/02, IAM-01 |

T06 includes fake browser payment rejection and proof that provider receipt/error/remapping cannot alter Conversion or attribution (TRK-01/03, ATR-02). T13 also covers subject export authority, visitor-only deletion, active-store redaction, explicit unresolved remote steps and replay after payload deletion (DAT-01). T15 includes duplicate usage-effect replay (SAS-01). These are planned tests, not executed evidence.

## Complete requirement-to-evidence traceability
All model names below refer to 04; service contracts/actions are in 06/07. TEN-01/02 and IAM-01 apply to every tenant-data row, including service workers. An evidence bundle for every test must retain requirement/criterion, fixture and expected result, observed result, build/schema/policy versions, timestamp, reviewer and artifact path. No implementation bundle exists yet. The Evidence column specifies what must be produced, not what has passed.

| Requirements | Logical model | API/event contract and permission | Milestone / tests | Acceptance evidence to retain |
|---|---|---|---|---|
| TEN-01, TEN-02, IAM-01 | Tenant, User, Membership, Role/Permission, AgencyGrant, ServicePrincipal, AuditLog | Membership/Grant administration; all request/job/download boundaries; tenant.admin and scoped actions | M0 probes; M1 slice, M4 full; T01/T16/T17 | Allowed/denied tenant/object/field matrix, MFA, revocation and cache/job traces |
| CRM-01 | Contact, Lead, Inbox, BusinessEvent | CRM intake/import; crm.write/import, verified Meta connection | M1 manual, M2 CSV/web, M3 Meta; T02/T16 | One lead/effect per source key, source retained across replay/crash |
| CRM-02, CRM-03 | Contact, ContactIdentifier, Lead, Deal, CommerceOrder, AuditLog | Intake/merge preview and execute; crm.read/write/merge | M1 CRM, M2 direct orders; T03/T08 | Shared-phone review, retained merge provenance and direct-order fixture without fabricated deal |
| CRM-04, CRM-06 | Pipeline, Stage, Deal, StageTransition, Conversion | Transition command; crm.write and expected_version | M1 internal; M2/M3 conversion regression; T04/T16 | Atomic history, invalid/stale rejection, reopened outcome dedup |
| CRM-05 | Task, AutomationRule/Version/Run, Outbox | Task/AutomationExecute; crm.write and bounded automation.execute | M1; T12/T16 | Due/overdue visibility and one escalation despite retries |
| TRK-01, TRK-02 | Visitor, Session, IdentityLink, ConsentRecord, BusinessEvent | Collection/identity-link validation; scoped site policy or crm.write, consent checks | M2; T03/T05/T06 | Invalid/forged event rejection, supported linkage and no IP merge |
| TRK-03 | BusinessEvent, Conversion, Outbox, Delivery | NormalizeConversion/mapConversion; conversion.normalize/integration.send | M1 identity subset, M2/M3 complete; T04/T05/T06/T16 | One canonical outcome across sources and unchanged evidence across transport changes |
| CMP-01, CMP-02 | AdAccount, Campaign, Ad, Touchpoint, SpendFact | CampaignSpendImport; integration.read/report.read | M2 fixtures, M3 provider path; T10 | Rename joins, source currency/timezone and idempotent interval reload |
| ATR-01, ATR-02 | Conversion, Touchpoint, AttributionCredit, SpendFact | Attribute and campaign-performance; report.calculate/read | M2, M3 provider comparison; T05/T06/T08 | Deterministic credits, unknown bucket, refund allocation and labelled sources/windows |
| INT-01 | Connection, Destination, Delivery, AuditLog | Capability/OAuth/disconnect; integration.manage/send | M3; T01/T07 | Owned destination checks, disconnect and token/permission denial traces |
| INT-02 | Inbox, Outbox, Conversion, Delivery | Durable intake/publication/sendBatch/reconcile; scoped service actions | M1 internal, M3 transport; T02/T06/T16 | Crash recovery, stable keys, per-item failures and no lost/extra logical conversion |
| INT-03, INT-04 | Connection, Destination, Lead, Conversion, Delivery | Verified lead intake/mapConversion and separate analytics; integration.ingest/send | M3; T02/T06/T07 | Authorized test-account capability/schema/receipt and partial failure evidence; still absent |
| SEG-01, SEG-02 | Segment/Version/Membership, AudienceSync, ConsentRecord | Preview/freeze/evaluate/sync; segment.manage/audience.export and field/consent checks | M4; T07/T09 | Fixed preview equivalence, version/as_of, withdrawal/removal receipts or explicit unresolved state |
| COM-01 | CommerceOrder, OrderLine, Payment, Refund, Fulfillment, Conversion | CommerceImport/NormalizeConversion; integration.ingest/conversion.normalize | M2, pilot profiles M4; T08 | Separate order/payment/fulfillment counts, partial reversal and duplicate-source ledger |
| SRV-01 | Appointment/Revision, QuoteVersion, Deal | Appointment/Quote service; crm.write | M2–M4; T12 | Preserved reschedules and exact accepted quote version |
| OPS-01, OPS-02 | ClientEngagement, MonthlyPlan, Deliverable, AssetVersion, Approval, ServiceProject, Milestone | PlanApprove/ProjectCreate; operations.manage/asset.approve | M5; T11 | Exact-version approval and one project per originating deal |
| WF-01, WF-02 | AutomationRule/Version/Run, BusinessEvent, Task, Outbox, ConsentRecord | AutomationExecute; current actor/service action rights | M1 internal, M5 outbound; T09/T12/T15/T16 | Stable execution keys, disabled rule, bounded cycles, opt-out/quiet-hour denial |
| DAT-01 | PrivacyRequest/Step, ConsentRecord, Contact/Visitor, AuditLog | Subject privacy request/status; privacy.manage and verified requester | M2–M4; T07/T13 | Scoped subject export; active-store deletion, remote step results and restore suppression |
| DAT-02 | TenantExport, all eligible tenant entities/attachments, AuditLog | Tenant export create/status/download; tenant.export plus dataset/field rights | M4; T17 | Snapshot/schema manifest, fixture counts/checksums, relationship integrity, exclusions and revocation denial |
| SAS-01 | Tenant; M6 entitlements/metering/billing logical extension deferred | EntitlementCheck/UsageRecord; scoped control-plane principal | M6; T15 | Disabled-feature denial and exactly one billable effect per usage key |
| NFR-01, NFR-02, NFR-03 | Indexed tenant data, Inbox/Outbox, SegmentMembership, AttributionCredit | Core reads/intake/projections with same permission boundaries | M0 target review, M4 benchmarks; T14 | Stated load envelope, measured latency/loss/freshness and stale-state evidence |
| NFR-04 | All persisted stores, PrivacyStep suppression ledger | Backup/restore runbook, restricted operations authority | M0 feasibility, M4 recovery; T13 | Measured RPO/RTO and suppression reapplication; availability needs operational observation |
| NFR-05, NFR-06 | Audited tenant records, AuditLog | Core flows and audit/log controls; current role/field permissions | M0 prototypes, M1 slice, M4 full; T14/T01 | RTL/LTR/keyboard/mobile/contrast review and privileged audit/secret scan results |

M4 requires measured results and owner disposition of targets; a proposed availability percentage cannot be labelled demonstrated by a single restore drill. Operational availability remains unverified until a sufficient observation window exists. Any target/scope change is recorded explicitly, never silently treated as a pass.

## Definition of done
Linked requirement passes acceptance test; permissions and tenant scope covered; migration/backfill reviewed; provider calls use fixtures plus authorized test-account evidence where relevant; UI error/stale/empty states present; monitoring and recovery notes exist; no secret or unnecessary PII in logs; remaining unverified behavior stated explicitly.

## Pilot acceptance dataset
Three synthetic tenants. Include direct purchase with no lead, recurring buyer, unpaid delivered order, partial refund, survey reschedule, rejected quote, repeated form, anonymous visitor never identified, late-arriving event, revoked agency grant and consent withdrawal. Report expected counts/values per fixture before running product tests.

## Validation status of this package
M0 foundation implementation evidence has now been executed against real native PostgreSQL and independently re-audited. This validates the bounded M0 foundation only; provider acceptance, later-milestone load/operations evidence, production availability and full pilot scope remain unverified. M1 and later milestones retain their own exit gates.

v0.2 audit scope: requirement/model/contract/permission/milestone/test/evidence links and logical invariants. This does not promote TSST/DEV_AG readiness or validate skills. Custom Build and scalable baseline defaults are owner-confirmed as of 2026-10-01. OQ-01–OQ-12 now represent remaining configuration/evidence inputs or approved-default overrides; implementation/pilot gates remain unpassed.

## M0 closure evidence — 2026-10-02
Custom-Build M0 is **CLOSED**. The original bounded implementation was remediated at `7f3ce318eac24e8ec4f6bd47fcde44f07dae2560`; evidence-only follow-up is `f1a1810246453594894645bf3ae50c6d54dbe5cc`. Independent re-audit passed with non-blocking follow-ups only: all three prior findings are CLOSED; 22/22 tests passed (14 real PostgreSQL/API, 4 bootstrap-state, 4 Chromium RTL/LTR); lint/typecheck/build and diff checks passed; RLS/isolation, RBAC/revocation, retry-key conflict behavior, actual concurrent-worker SKIP LOCKED behavior and backup/restore all passed. Native restore matched 18 table counts/digests. No production RPO/RTO or production-readiness claim is made. Non-blocking follow-ups are test timeout/cancellation hardening and an unverified Docker-specific path; the native/local-mirror path is the demonstrated M0 path. **M1 CRM Vertical Slice is the next gate.**
