# Security, privacy and operational design

## Access model
The M0/M1 design uses fixed explicit RBAC + scoped grants, not an arbitrary ACL engine. The role defaults below are proposed for owner review (OQ-08); deny by default until configured. One active membership assigns one role; the versioned ROLE_PERMISSION catalogue defines action/resource/finite scope and field groups. Tenant owner is not an unrestricted bypass.

| Role | Default access |
|---|---|
| Tenant owner | Tenant settings, memberships, explicitly authorized integrations |
| Sales manager | Tenant sales records and reports |
| Sales rep | Assigned contacts/deals/tasks within role/grant scope; no bulk export by default |
| Marketing analyst | Campaign/segment views; raw identifiers and audience export are separate permissions |
| Account manager | Granted client operations only |
| Client approver | Assigned plan/deliverable versions only |
| Platform operator | Health/usage metadata; time-bound audited escalation for customer data |

Direct access requires active membership in the target tenant. Agency access requires active agency membership and a nonexpired, unrevoked grant issued by the client, naming that membership, allowed actions and tenant/assigned or fixed resource scope. Effective agency permissions are the intersection of role actions/field groups and grant limits. Global user identity, agency ownership and a platform operator role confer no customer-data access on their own. Any support escalation needs explicit time-bound client authorization and audit; no M0/M1 support backdoor.

Action catalogue: tenant.admin; crm.read/write/import/merge; contact.export; sensitive.read/write/export; tenant.export; privacy.manage; integration.manage/read/ingest/send; conversion.normalize; report.read/calculate; segment.manage; audience.export; automation.execute; operations.manage; asset.approve. Actions are explicit, not a wildcard that allows unknown future actions. Resource-specific writable/readable field groups are versioned allowlists. For example, contact.export requires both the export action and permission to read each included field; it never implies sensitive.export. Tenant portability needs tenant.export and full eligible dataset/field rights. Membership/grant administration cannot delegate beyond the administrator's authorized tenant and delegation scope.

Object authorization checks tenant equality and the role/grant's tenant or assigned-record scope. Assignment may name a direct member or explicitly authorized agency actor, validated in client context. M0/M1 uses assigned records rather than a new team/group policy subsystem. Client approvers receive explicit assigned deliverable/version scope. Lists, searches, reports and nested references apply the same restrictions as object endpoints; hidden UI buttons are not enforcement.

Server-side checks cover API, imports, field writes, reports, exports and files, including cached Idempotency-Key responses. Reject disallowed input fields and redact disallowed output fields. Bulk jobs retain initiating membership/grant references and re-check current authority, tenant, object and field permissions before each bounded batch/side effect; revoked roles/grants block pending work and artifact download. Scheduled jobs use explicit tenant service principals with narrow roles/actions, current rule enablement and connection/consent checks. Already completed effects remain audited; revocation does not pretend to undo a completed external send.

Private attachments and exports use permission-checked download paths with short-lived links; where immediate revocation is required, use a reauthorizing download gateway rather than an irrevocable pre-signed URL. Recheck export authority before releasing generated output; never include connector credentials, secret references or other tenants' data.

## Threat cases and required controls
| Threat | Control | Evidence |
|---|---|---|
| Cross-tenant object access | Composite FKs, scoped queries and database isolation | Negative CRUD/search/export/worker/file tests |
| Fake pixel purchase | Untrusted collection separated from authoritative server events | Browser cannot increment paid revenue |
| Webhook replay | Signature validation, durable source keys | Repeated signed request yields one effect |
| Credential disclosure | Managed secret references, encryption, redaction | Logs/export contain no tokens |
| Consent race | Check latest permission at dispatch and retry | Withdrawal between enqueue/send suppresses delivery |
| Agency overreach | Scoped expiring grant, real actor audit | Revocation blocks cached/pending authorization |
| Uploaded malicious files/URLs | Type/size limits, scanning, private storage, restricted server fetches | Malicious sample blocked; no arbitrary internal URL fetch |
| Runaway workflows | Idempotent action ledger, depth/rate limits, kill switch | Cycle terminates without repeated messages |

## Data lifecycle
Proposed initial retention pending business/jurisdiction review: raw webhook bodies 7 days, rejected diagnostic payloads 7 days, pseudonymous journey events 180 days, delivery diagnostics 90 days, audit records 365 days, backups 35 days. Financial/customer records require a separately approved retention policy before production; do not infer statutory periods.

Avoid raw bodies unless needed; encrypt restricted payloads and scrub PII from operational logs. Consent/withdrawal evidence must remain sufficient to enforce suppression without retaining unnecessary identifiers. Hashing identifiers for a destination does not make them non-personal data.

Deletion workflow: validate authority → suppress outbound work → remove/redact identifiers in transactional and projection stores → delete private attachments where applicable → request supported remote removals → retain minimal audited completion record. Backups expire on schedule; restorations reapply deletion/suppression ledger before reopening traffic. Show unresolved remote deletion rather than claiming completion.

DAT-01 subject privacy requests identify exactly one contact or visitor with verified requester authority and tracked lifecycle steps. DAT-02 tenant portability is separate: authorized tenant-wide machine-readable datasets/relationships and attachments, a consistent declared snapshot, versioned manifest, counts/checksums and explicit exclusions. Export artifacts are private, expire, and are reauthorized at execution and download. Completeness means all eligible tenant-owned data, not provider account replication or secrets; restricted audit/security fields and exclusion policy need OQ-11 approval before pilot acceptance.

The proposed 7-day raw-body retention is not a dedup lifetime. Durable source/event/outcome identities and minimal suppression/replay tombstones must survive payload and API retry-cache expiry. Exact retention and privacy-compatible tombstone design remain OQ-09; M0 must demonstrate replay protection without preserving unnecessary raw PII.

## Observability
Metrics by bounded tenant/provider dimensions: intake acceptance/rejection, queue lag, dead letters, dedup rate, stage command conflict, segment freshness, conversion rejection, spend-sync lag. No contact IDs/email as metric labels. Correlate redacted traces with event/request IDs. Alert on sustained queue lag, intake failure, authentication failure spikes and cross-tenant policy violations.

## Reliability and recovery
Daily backup plus point-in-time recovery where platform supports proposed RPO; encrypted object backups; restore drills using synthetic or authorized staging data. Workers recover outbox leases after crash. Provider outage must not block sales operations. Operators can pause one connector/tenant, retry bounded batches and inspect safe error reasons.

Release: CI tests → staging migration → integration fixtures → backup/restore check → canary tenant → monitor → expand. Rollback app only when compatible with migrated schema; otherwise roll forward or restore through documented incident plan. Do not equate redeploying old code with reversing data migrations.

Incident runbook: identify affected tenants/time window → pause affected sends → preserve minimal evidence → restore service → reconcile missing/duplicate effects → communicate verified scope → regression test. RPO/RTO targets in SRS are not SLAs until demonstrated.
