# Security, privacy and operational design

## Access model
| Role | Default access |
|---|---|
| Tenant owner | Tenant settings, memberships, explicitly authorized integrations |
| Sales manager | Tenant sales team records and reports |
| Sales rep | Assigned/team-permitted contacts/deals/tasks; no bulk export by default |
| Marketing analyst | Campaign/segment views; raw identifiers and audience export are separate permissions |
| Account manager | Granted client operations only |
| Client approver | Assigned plan/deliverable versions only |
| Platform operator | Health/usage metadata; time-bound audited escalation for customer data |

All grants checked server-side. Bulk jobs re-check permission and tenant before execution. Field-level policies apply to exports and reporting as well as pages. Private attachment URLs are short-lived and permission-checked.

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

## Observability
Metrics by bounded tenant/provider dimensions: intake acceptance/rejection, queue lag, dead letters, dedup rate, stage command conflict, segment freshness, conversion rejection, spend-sync lag. No contact IDs/email as metric labels. Correlate redacted traces with event/request IDs. Alert on sustained queue lag, intake failure, authentication failure spikes and cross-tenant policy violations.

## Reliability and recovery
Daily backup plus point-in-time recovery where platform supports proposed RPO; encrypted object backups; restore drills using synthetic or authorized staging data. Workers recover outbox leases after crash. Provider outage must not block sales operations. Operators can pause one connector/tenant, retry bounded batches and inspect safe error reasons.

Release: CI tests → staging migration → integration fixtures → backup/restore check → canary tenant → monitor → expand. Rollback app only when compatible with migrated schema; otherwise roll forward or restore through documented incident plan. Do not equate redeploying old code with reversing data migrations.

Incident runbook: identify affected tenants/time window → pause affected sends → preserve minimal evidence → restore service → reconcile missing/duplicate effects → communicate verified scope → regression test. RPO/RTO targets in SRS are not SLAs until demonstrated.
