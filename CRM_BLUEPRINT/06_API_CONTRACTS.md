# API and event contracts — design draft

These routes describe the desired product boundary. They are not implemented endpoints or a complete OpenAPI specification. Freeze executable OpenAPI/JSON Schema in M0/M1 after selecting the foundation.

## Rules
Prefix /v1. Authenticated requests resolve user and authorized tenant from membership/grant plus selected workspace. A caller-supplied tenant header alone never grants access. Public collection uses a separate scoped site-key endpoint. Cursor pagination; UTC ISO timestamps; money as minor-unit integer plus currency; request_id on every response.

Mutation Idempotency-Key scoped to tenant/principal/route. Store request hash and response for a proposed 7-day retry window pending M0 validation (OQ-10); same key/different body returns 409 within that window. Always authorize current access before cache replay and apply current field filtering. After expiry the cache makes no retry guarantee: durable source/business-outcome identities, command ledgers and If-Match/expected_version still prevent replayed business effects. Source dedup keys persist independently for the source lifecycle and approved replay horizon, using minimal tombstones when payloads are removed (OQ-09).

Effect-producing manual commands, including POST /v1/leads, must carry a command_id generated once per intended action and reused on retries, independently of the response-cache key. INBOX stores the durable receipt under (tenant, command:principal:operation, command_id), including request hash and result reference. Receipt/domain effect/event/outbox commit atomically. After cache expiry, the same command/hash returns the currently authorized existing result (which need not be the original cached bytes), or a safe tombstoned/unavailable status; a changed body conflicts. It never creates a second effect. External source commands use their durable source identity instead. T16 covers manual creates as well as provider replay.

All authenticated routes enforce the 07 role/action catalogue, active membership or client grant, same-tenant object scope and readable/writable field groups. Reject unauthorized writes instead of silently mass-assigning fields; filter responses/reports/export output. Object IDs, including every bulk item and nested reference, do not confer access. Jobs capture authority references and reauthorize before each batch/effect; download checks use current authority too. Source intake instead uses a narrowly scoped verified connection or public collection policy, never an implicit human role.

| Route | Purpose | Important response |
|---|---|---|
| POST /v1/leads | Validate/create inquiry | 201 new, replay original response on same key |
| GET /v1/contacts/{id}/journey | Authorized timeline | 200 cursor page; redacted fields per permission |
| POST /v1/contacts/merge-previews | Preview explicit merge | 200 conflicts and affected references |
| POST /v1/contacts/merges | Execute reviewed merge | 202 job with audit; version conflict 409 |
| POST /v1/deals/{id}/transitions | Atomic stage transition | 200 updated version; invalid transition 422 |
| POST /v1/collect/events | Public low-trust telemetry | 202 durably queued; size 413/rate 429 |
| POST /v1/integrations/{connection}/webhooks | Signed external intake | 202 after durable inbox write |
| POST /v1/segments/preview | Evaluate draft rule | 200 count/sample/as_of, permission-limited |
| POST /v1/segments/{id}/versions | Freeze new definition | 201 immutable version |
| POST /v1/audience-syncs | Queue eligible destination delta | 202 sync ID; unsupported capability 422 |
| GET /v1/reports/campaign-performance | Report under explicit model | 200 model/version/window/currency/as_of |
| POST /v1/connections/{id}/disconnect | Revoke local access and stop sends | 202 cancellation/revocation workflow |
| POST /v1/privacy-requests | DAT-01 subject export/delete; privacy.manage plus verified subject/representative authority | 202 request ID; exactly one tenant-local contact/visitor; no arbitrary subject lookup |
| GET /v1/privacy-requests/{id} | Authorized subject workflow status/result | 200 step states including unresolved provider removals; protected artifact access |
| POST /v1/tenant-exports | DAT-02 tenant portability; tenant.export plus required field/dataset rights | 202 export ID and scope; deny incomplete authority for a full export; record explicit policy exclusions |
| GET /v1/tenant-exports/{id} | Manifest/status under current tenant.export authority | 200 snapshot/schema/counts/checksums/exclusions or safe failure |
| GET /v1/tenant-exports/{id}/download | Reauthorize complete export access and artifact expiry | Short-lived protected download; revoked/expired access denied |

## Stage command example
```json
{
  "to_stage_id": "stage-qualified",
  "expected_version": 4,
  "reason": "Budget and service fit confirmed",
  "command_id": "cmd-demo-001"
}
```
Synthetic IDs are illustrative; implementation schemas use opaque IDs. Server determines tenant, actor and occurred_at for manual commands. Imported historical timestamps require distinct import permission and retain received_at.

## Canonical server event example
```json
{
  "event_id": "evt-demo-001",
  "tenant_id": "tenant-demo",
  "event_name": "lead_qualified",
  "schema_version": 1,
  "source": "crm",
  "source_event_id": "transition-demo-001",
  "occurred_at": "2026-10-01T10:00:00Z",
  "received_at": "2026-10-01T10:00:00Z",
  "contact_id": "contact-demo",
  "consent_snapshot_ref": "consent-demo",
  "properties": {"deal_id": "deal-demo", "qualification_rule_version": 1}
}
```

Error envelope: code, safe_message, field_errors, request_id, retryable. Codes: UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404 for inaccessible object references, VERSION_CONFLICT 409, VALIDATION_FAILED 422, RATE_LIMITED 429, TEMPORARILY_UNAVAILABLE 503. Do not leak whether another tenant's object exists.

## Connector interface
capabilities(); validateConfiguration(); ingestWebhook(); pullSince(cursor); mapConversion(conversion,authorizedContext,mappingVersion); mapAnalyticsEvent(businessEvent,mappingVersion); sendBatch(items); reconcile(receipts); disconnect(). `mapConversion` maps immutable Conversion, not a mutable deal/order or an independently interpreted BusinessEvent. Its authorizedContext supplies permitted identity/consent/source evidence without changing conversion_type, value, currency or outcome identity. `mapAnalyticsEvent` is restricted to nonconversion analytics. Audience and spend functions are optional capabilities, not assumed for every provider. Persist provider schema/API version with connector release; contract fixtures must detect breaking changes.

Webhook verification uses provider-specific signatures/challenges over the correct raw body, timestamp tolerance where available and durable replay protection. OAuth callbacks require state validation and tenant-bound initiating authorization; no credentials in redirects or frontend logs.

## Internal contract inventory and permission boundaries
These service contracts complete requirement traceability; route names/schemas beyond the table remain to be frozen in M0/M1. Every contract inherits tenant/object/field checks above.

| Contract | Inputs / durable result | Permission / requirement |
|---|---|---|
| Membership/Grant administration | Target membership/role or client-owned agency grant, version; audit old/new authority | tenant.admin; TEN-01/02, IAM-01; no self-elevation outside administrator authority |
| CRM intake/import/merge | Source namespace/ID, typed allowlisted fields, merge preview/version; Contact/Lead and audit | crm.write, crm.import or crm.merge; CRM-01/02/03 |
| Transition/Task/Appointment/Quote | Object/version, allowed state/time/outcome; history/revisions and BusinessEvent | crm.write within record scope; CRM-04/05/06, SRV-01 |
| NormalizeConversion | Eligible BusinessEvent + business-object reference + definition_version; Conversion and outbox atomically | Tenant service principal conversion.normalize; TRK-03, COM-01, INT-02 |
| DeliverConversion | conversion_id, destination_id, mapping_version, stable effect key; Delivery receipt/error only | integration.send plus current connection/consent/field checks; INT-01/02/03/04 |
| CampaignSpendImport / Attribute | Provider account/grain snapshot; Conversion/touch inputs + model version; spend/credit projections | integration.read / report.calculate service actions; CMP-01/02, ATR-01/02 |
| SegmentEvaluate / AudienceSync | Immutable rule version, as_of, eligible subject delta; membership/receipt | segment.manage / audience.export, permitted fields and consent; SEG-01/02 |
| CommerceImport | Signed order/payment/refund/fulfillment source identity; thin records and events | integration.ingest; COM-01 |
| AutomationExecute | Rule version/event/action key; unique run/effect ledger and task/notification | automation.execute service role or current initiating role, bounded action rights; WF-01/02 |
| PlanApprove / ProjectCreate | Exact asset version or originating won deal; approval/project idempotent result | operations.manage / asset.approve within assigned scope; OPS-01/02 |
| EntitlementCheck / UsageRecord | Tenant plan feature and usage effect key; allow/deny and deduped usage | Control-plane service principal, no customer-data bypass; SAS-01 (M6 logical structures deferred) |

Conversion envelope: conversion_id, tenant_id, event_id, conversion_type, business_object_ref, business_outcome_key, definition_version, occurred_at, value_minor/currency where applicable, evidence_kind and optional reversal_of_id. Delivery envelope: delivery_id, kind, conversion_id OR analytics_event_id, destination_id, mapping_version, stable idempotency_key and transport status. Attribution takes conversion_id; provider delivery cannot create or edit Conversion.

Privacy requests follow verified → queued → processing → completed/blocked/failed with per-step evidence; unresolved provider removal prevents an unqualified completed claim. Tenant exports follow authorized → queued → generating → ready/failed/cancelled → expired; revoked authority cancels pending work and blocks artifact release. Manifest contains dataset/schema versions, snapshot boundary, relationship IDs, counts/checksums, authorized attachment references, exclusions/reasons and expiry. A filtered export must not be labelled complete; full-export authorization and allowed exclusions are OQ-08/OQ-11.

Delivery idempotency is unique per tenant/destination/logical effect, separate from API cache, source dedup and event identity. Retry keeps the key even if mapping code changes; receipt uncertainty remains explicit. Intentional adjustments require new canonical reversal/correction evidence plus a supported destination operation, not key rotation on an old conversion.
