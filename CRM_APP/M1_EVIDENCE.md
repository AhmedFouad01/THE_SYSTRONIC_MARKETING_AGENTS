# M1 evidence — 2026-10-02

**Verdict: PASS for the bounded M1 manual CRM slice.** No blocking finding. This is not full P0/pilot or production acceptance; TSST/DEV readiness is unchanged.

Branch: `feat/crm-m1-core`. M0 closure: `f54fbf6a4ac5366f047ca49b5ee9db19e0d68ccc`. Implementation commit: **PENDING_FEATURE_COMMIT** (recorded by the evidence-only follow-up after the feature commit).

## Scope and evidence

| M1 requirement subset | Implemented and verified |
|---|---|
| TEN-01/02, IAM-01 | M0 transaction-local context/RLS preserved, all tenant tables FORCE RLS; current membership/fixed-deal grant, object assignment, explicit action and identifier field checks, manager/agency-manager MFA evidence. Tenant/read/update/forged-context/FK/role/grant/replay/worker negatives pass |
| CRM-01 manual, CRM-02 | Contact create/read/update and manual lead intake with existing or inline contact, assignment/source evidence, separate inquiries/deals, durable command receipts and retry binding; concurrent replay and injected rollback create no extra effects |
| CRM-03 | Encrypted nonunique identifiers, shared-phone candidates, explicit versioned merge preview/202 completed bounded job, original provenance/source tombstone/audit retained; linked records move and increment version |
| CRM-04/06 | Tenant-configured pipelines/stages/edges; deal create/read/list/assignment; M0 atomic stage engine extended with terminal metadata/loss reason, stale/invalid checks, history. Won→reopened→won retains one internal logical commercial outcome |
| CRM-05, WF-01 | Assigned next-action tasks with UTC due/open/completed state; owner/manager overdue visibility; one durable escalation per task. Configured immutable stage rule produces one follow-up task/run despite retry; disabled rule and revoked membership/grant block effects |
| INT-02, TRK-03 internal identity | Atomic audit/BusinessEvent/outbox for CRM mutations, follow-up tasks and escalations; bounded worker claims, rollback/retry/crash, stable effects, blocked/dead-letter status. No external delivery or full conversion normalization claim |
| NFR-05/06 on slice | Arabic-first RTL / English LTR,360px/1280px real browser journeys, basic details and timeline, keyboard focus, empty/loading/error/retry/denied/stale feedback. Append-only redacted audits and restricted operational status; no raw PII/credentials in generated logs/artifacts |

Migrations: `002_crm_core.sql` (CRM fields/tables/permissions), `003_object_integrity.sql` (finite typed tenant ledger references and agency MFA), `004_relationship_authority.sql` (deferred linked-contact agreement and real scheduled-worker authority).001 remains unchanged. Schema now30CRM tables.

Routes: contact/list/detail/update/duplicates/journey/merge-preview/merge; manual leads; deal/list/detail/update/history/transition; tasks with due filters; pipeline create/read; narrow rule create/enable/disable; session capabilities/assignee directory; restricted audit/outbox. Exact writable fields, status codes, durable keys, policy matrix and run/recovery instructions: [M1 contracts](M1_CONTRACTS.md).

UI: work queue, Contacts, Leads, Deals/pipeline, Tasks, record details/timeline, merge review, basic configuration and internal audit/outbox. Preserved M0 screen at `/foundation`; no placeholder provider screens.

## Fresh validation

- `npm run lint` PASS (19 files); `npm run typecheck` PASS; `npm run build` PASS.
- `npm test`: **45 passed /0 failed /0 skipped** =32 real PostgreSQL/API (14 M0 +18 M1),4 bootstrap-state,9 Chromium (4 retained M0 +5 M1). **All22 M0 regressions remain green.** Test14 now bounds worker2 with PostgreSQL statement cancellation/rollback, destroys the temporary timed connection, releases reservations and guarantees barrier cleanup; no production change for that hardening.
- Permission matrix exercised: manager tenant scope/MFA; rep assigned contact/lead/deal/task scope; reader write denial and identifier redaction; sensitive action removal; scoped agency grant revocation and MFA; worker own role plus current initiating authority. Read-only assignment directory exposes only tenant-local eligible IDs/display names.
- Clean exact native bootstrap: migrations1–4,2 synthetic tenants,30 tables, non-super/non-bypass runtime and MFA-marked synthetic sessions; partial retry safely preserves credentials. [Sanitized result](evidence/m1/clean-bootstrap.json).
- Existing native M0 upgrade: original two fixture deals retain contact/pipeline/owner/name relationships and valid stages;106 durable receipts and106 transition-outbox references all resolve. This is a post-upgrade identity/relationship check, not a before/after full-database digest. [Sanitized result](evidence/m1/m0-upgrade.json).
- Browser screenshots: [Arabic360](evidence/m1/ar-360.png), [Arabic1280](evidence/m1/ar-1280.png), [English360](evidence/m1/en-360.png), [English1280](evidence/m1/en-1280.png). Lead visually reviewed RTL/narrow and LTR/desktop; no visible overflow/craft blocker. [Validation summary](evidence/m1/validation.json).
- Source mirror is explicitly synchronized/hash-verified before commit. `git diff --check` and staged check pass. Original FAIL audit remains unchanged; no private fixtures, passwords, native data, backups or logs are added.

## Limits and follow-ups

Native PostgreSQL17.10 on loopback and source-verified local execution are the demonstrated path; npm-on-Drive and Docker remain unverified environment follow-ups. Windows test-server/native process management required the same-account execution context; final full run exited0. Synthetic opaque sessions/MFA flags validate authorization enforcement, not real identity-provider enrollment. Tenant encryption keys are protected in the local database; external key custody/rotation belongs to deployment. These do not block the authorized synthetic local M1 slice. No production availability/RPO/RTO claim.

Explicit exclusions remain untouched: CSV/web/Meta intake, tracking/anonymous identity, ad providers/cost/attribution, commerce, segments/audiences, agency planning/approvals, SaaS billing/subscriptions, AI scoring and production hosting. **M2/M3 and all later milestones have not started. No push or merge performed.**
