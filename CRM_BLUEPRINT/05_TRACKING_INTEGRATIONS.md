# Tracking, identity and provider integration plan

## Event contract
Canonical event: event_id, tenant_id (server resolved), event_name, schema_version, source, source_event_id, occurred_at, received_at, optional contact_id/visitor_id/session_id, consent_snapshot_ref, correlation_id, allowlisted properties. Browser identifiers are untrusted; authoritative commercial outcomes require authenticated server evidence.

| Internal event | Meaning | Provider treatment |
|---|---|---|
| page_viewed | Eligible page observation | Analytics only; never a CRM lead |
| form_submitted | Accepted non-spam form | May map to a lead conversion; no duplicate event from subsequent CRM creation |
| lead_created | Recorded business inquiry | Conversion mapping is explicit per source; avoid counting same form twice |
| lead_qualified | Tenant-defined qualification rule met | Only supported/configured conversion action; qualification definition version retained |
| appointment_completed | Survey/meeting actually completed | Distinct from booking and from a won deal |
| deal_won | Commercial acceptance | Not automatically paid revenue |
| order_placed | Store accepted order | Not automatically delivered or collected revenue |
| payment_captured | Authoritative payment confirmation | Candidate purchase milestone according to configured business policy |
| order_delivered | Confirmed fulfillment outcome | Separate fulfillment metric; no automatic second purchase |
| refund_recorded | Financial reversal | Retain original conversion; supported adjustment or separate internal reversal |
| consent_changed | Permission changed | Suppress pending prohibited sends and schedule supported audience removal |

One documented purchase milestone per business/destination; avoid sending both order placement and delivery as purchases for the same order. Partial payments/refunds have their own immutable IDs and values. Reopened deals create new transition evidence, not automatic repeated conversion credit.

## First-party collection
Tenant-specific public site key resolves tenant/destination server-side; it is not a secret or authorization for CRM access. Verify allowed origins as a signal, enforce rate limits and bot controls, reject excessive payloads and sanitize URLs/query parameters. Browser telemetry cannot create trusted payments or change stages. Forms use bounded field schemas and anti-abuse controls.

Capture UTMs, landing path, referrer category, provider click identifiers when permitted, event time and tenant-local visitor/session IDs. Do not put names, email or phone in URLs, logs, GA4 parameters or arbitrary custom properties. Consent collection and processing permissions must be checked separately for analytics, advertising and messaging.

## Identity resolution
Use explicit form/authentication/order evidence, not name similarity, IP, device fingerprint or arbitrary shared phone. Shared identifiers create review candidates. Identity links have evidence, effective intervals and revocation. Linking allows eligible historical touches inside the configured window; it does not authorize sending previously disallowed data. Unidentified visitors stay anonymous. Matching on an ad platform does not reveal a visitor's identity to this CRM.

## Attribution v1
Proposed models: first eligible touch and last non-direct eligible touch; proposed lookback 30 days, configurable and versioned. Eligible touches must precede conversion, be tenant-local, have supported identity evidence and fall within lookback. If no eligible non-direct touch exists, label direct only when direct evidence exists; otherwise unknown. Do not invent campaign IDs from ambiguous UTM text.

Attribution is deterministic rule-based allocation, not proof of causality. Late events trigger a new calculation run; published reports identify their run/as-of time. Refunds reverse credit using the original allocation. Track occurrence-date and acquisition-cohort reports separately. Preserve provider-reported windows and currencies; never sum Meta + Google reported conversions to compute unique sales.

## Independent provider capabilities
| Adapter | Capability | Gate |
|---|---|---|
| Meta lead intake | Webhook/pull import with source ID deduplication | App permissions, page/form access, subscription verification and backfill test |
| Meta conversions | Server delivery plus browser dedup design | Current API/schema verification, owned dataset, test events, diagnostic evidence |
| Meta reporting | Campaign metadata and spend | Read permissions, pagination and reporting-timezone test |
| Meta audiences | Add/remove eligible members | Account/product eligibility, terms and removal test |
| Google conversion adapter | CRM/offline outcomes | Probe currently supported Data Manager route and destination access before implementation |
| Google Ads reporting | Campaign metadata/spend | Account permission and current reporting API test |
| Google audiences | Eligible audience operations | Separate capability review; not implied by conversions access |
| GA4 | Permitted analytics events | Validate measurement schema; separate stream/configuration and no PII |
| Store adapter | Orders/payments/refunds | Choose actual platform later; signed webhook, pagination and reconciliation required |

Google documentation checked on 2026-10-01 directs new restricted offline-conversion integrations to Data Manager API rather than assuming UploadClickConversions availability. This is a routing constraint, not a tested implementation. Meta's direct deduplication page could not be retrieved in this session: exact field semantics, version and delivery windows remain M0 verification items. See sources.

## Deduplication and failure model
Generate stable ID once for the business action. Browser and server paths for the same provider action use matching provider-required identity fields after documentation verification. Internal business deduplication remains authoritative even if the provider window expires. Retries do not get new event IDs. After ambiguous timeout, reconcile receipt if supported; otherwise retry with original key within eligibility window and surface uncertainty.

Persist item-level outcomes from batch APIs. Retry transient network/429/5xx responses with jitter and provider Retry-After; refresh authorization only where appropriate; permanent schema/consent failures go to blocked/dead-letter states. Re-evaluate consent and connection state before every retry. Never replay beyond provider acceptance age by falsifying occurred_at.

## Segments and synchronization
Rules use typed fields/events, AND/OR groups, relative windows and tenant timezone. Start with SQL-backed deterministic rules: new lead, qualified/no next task, quote pending, first purchase, repeat purchaser, lapsed purchaser. Show rule preview, last evaluation and membership change reason. Avoid health-condition inference in supplements segmentation.

Remote sync stores additions/removals and receipts per destination; matching and audience availability are not guaranteed. Withdrawal blocks future additions immediately and creates removal work where supported. Distinguish local member count, submitted count, accepted count and provider-visible audience count.

## Integration diagnostics UI
Connected account/dataset, permission state, last received/sent event, oldest queued age, rejected fields without PII, retries, dead letters, last spend sync and stale badge. Accepted delivery is not evidence of ad attribution; show these statuses separately.
