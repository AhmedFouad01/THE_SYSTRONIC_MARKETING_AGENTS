# API and event contracts — design draft

These routes describe the desired product boundary. They are not implemented endpoints or a complete OpenAPI specification. Freeze executable OpenAPI/JSON Schema in M0/M1 after selecting the foundation.

## Rules
Prefix /v1. Authenticated requests resolve user and authorized tenant from membership/grant plus selected workspace. A caller-supplied tenant header alone never grants access. Public collection uses a separate scoped site-key endpoint. Cursor pagination; UTC ISO timestamps; money as minor-unit integer plus currency; request_id on every response.

Mutation Idempotency-Key scoped to tenant/principal/route. Store request hash and response for a proposed 7-day retry window; same key/different body returns 409. Provider/source dedup keys persist for the source record lifetime regardless of API cache expiry. If-Match/expected_version prevents lost updates.

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
| POST /v1/privacy-requests | Authorized export/delete | 202 tracked job; no arbitrary contact lookup |

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
capabilities(); validateConfiguration(); ingestWebhook(); pullSince(cursor); mapEvent(event,mappingVersion); sendBatch(items); reconcile(receipts); disconnect(). Audience and spend functions are optional capabilities, not assumed for every provider. Persist provider schema/API version with connector release; contract fixtures must detect breaking changes.

Webhook verification uses provider-specific signatures/challenges over the correct raw body, timestamp tolerance where available and durable replay protection. OAuth callbacks require state validation and tenant-bound initiating authorization; no credentials in redirects or frontend logs.
