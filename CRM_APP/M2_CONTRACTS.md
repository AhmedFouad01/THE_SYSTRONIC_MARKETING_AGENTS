# M2 Journey & Reporting contracts

Bounded synthetic/internal implementation of TRK-01/02/03, CMP-01/02,
ATR-01/02 and COM-01. Existing M0/M1 authentication, protected identifiers,
tenant context, transactions and worker loop remain the foundation.

## HTTP and authority

Authenticated routes retain bearer session, `X-Tenant-ID`, current membership,
MFA where required, and optional existing scoped grant semantics. POST requires
`Idempotency-Key`; durable identities below, rather than that transport header,
prevent repeated business effects. Unknown fields are rejected. Money is integer
minor units with an explicit currency. Timestamps use UTC ISO strings.

| Route | Authority / identity |
|---|---|
| POST `/v1/journey/sites` | `integration.manage`; stable `id`, exact origin, enabled flag; server generates public site key |
| OPTIONS/POST `/v1/collect/events` | Separate public policy; `X-Site-Key` + allowed Origin; tenant resolves server-side; no CRM authority |
| POST `/v1/journey/identities` | `integration.ingest` and target/previous contact `crm.write`; durable `command_id` and evidence identity |
| POST `/v1/journey/campaigns` | `integration.ingest`; source/account/external campaign key; rename updates display name only |
| POST `/v1/journey/spend` | `integration.ingest`; campaign/reporting-date/campaign-day grain snapshot, replace on reload |
| POST `/v1/journey/commerce` | `integration.ingest` + `conversion.normalize`, contact `crm.write`; synthetic namespace/source event ID |
| POST `/v1/journey/calculate` | `report.calculate` + `conversion.normalize`; optional lookback_days 1–365, default 30 |
| GET `/v1/contacts/{id}/journey` | Current contact `crm.read`, including existing assigned scope; chronological `(occurred_at,id)` cursor |
| GET `/v1/conversions[/{id}]` | `report.read`; detail checks contact authority; canonical evidence plus versioned credits |
| GET `/v1/journey/{visitors,sessions,identities,events,touchpoints,orders,campaigns,sites}[/{id}]` | `report.read`; raw journey/site records additionally require `crm.read`; click/visitor/session external IDs require `sensitive.read` |
| GET `/v1/reports/campaign-performance` | `report.read`; optional model and run_id; explicit internal source, model/version/window/as-of/time basis |

Lists use 50-row cursor pages. Aggregate reports cover the bounded tenant evidence
set; they are not a large-volume BI implementation. No arbitrary protected fields
or freeform event properties are returned. New roles/actions are explicit:
manager gets M2 intake/configuration/report actions; analyst gets aggregate
`report.read`; worker gets calculation/normalization. An agency grant cannot
silently gain these tenant-wide actions.

## Collection and identity

Public body: `event_id`, `visitor_id`, `session_id` (UUIDs), `name` (page_view or
form_submitted), schema_version=1, occurred_at, consent `{analytics,advertising}`,
landing_path; optional source/medium/utm_campaign/campaign_id/ad_id/click_id,
referrer_category and empty honeypot `website`. Strict types/allowlists, 8 KiB
limit, exact origin policy and 120 new events/site/minute. The origin/public key
is an abuse signal, not proof of a human or identity. No public payments, stage
changes, contact IDs, tenant override, email/phone, or arbitrary properties.
Landing paths exclude query/fragment; campaign/ad/click/UTM fields are bounded
tokens. Advertising-denied click IDs are discarded. Analytics permission is
required and its collection policy version is retained. No advertising or
messaging delivery is implemented.

Event, visitor, session and campaign UUIDs are canonicalized to lowercase text (migration 007), so a retry with the same UUID in any letter case is a replay of the same event.

Browser CORS preflight supports only configured origins, POST and bounded headers.
The DB definer intake has a finite schema and derives its own tenant; it exposes
no general tenant access. It synchronously commits visitor/session, event,
touchpoint, durable receipt and calculation work before returning 202.
Public timestamps allow up to 365 days late and 5 minutes clock skew; older/future
events are rejected without partial effects. Accepted occurrence and receipt
times remain distinct; session start/end expand for out-of-order evidence.
Retries return the same event; changed payload under the same source identity
conflicts. Dedup survives transport cache expiry and uses no retained raw body.

Identity linking is a separate authenticated, explicit verification action. A form
link must reference that visitor's collected form event; order/authentication
evidence must name the contact. A form alone never silently identifies a visitor.
Operators provide evidence_ref and finite effective interval; overlapping active
links are rejected. Corrections atomically revoke the old link and append a new
link with corrects_id, actor, evidence and times. Shared email/phone stays an M1
review candidate, never an automatic merge. There is no IP/fingerprint matching.

## Commerce and conversion truth

Commerce input kind is order/payment/fulfillment/refund, with source,
source_event_id, external_order_id and occurred_at. Orders freeze contact,
currency and net_minor from amount_minor; status snapshots cannot regress on
older timestamps or disagree at the same timestamp. Order existence precedes
financial/fulfillment outcomes; retry out-of-order dependencies after importing
the order. Payment/refund/fulfillment external IDs dedup independently from the
transport event. No deal or lead is fabricated for a direct order.

Order placed/cancelled, payment captured, fulfillment shipped/delivered/returned
and refund are separate records/events. Payment captures (including partial
payments) are positive canonical conversions; order/delivery are never additional
purchase credit. Canceled orders cannot accept new captures; unpaid/COD delivery
is zero paid revenue. Refunds reference the original payment/conversion, use
negative conversion value and cannot cumulatively exceed the capture. Original
outcomes remain immutable. Changed amount under an old identity conflicts.

New M1 won outcomes snapshot their amount/currency into a `service-won-v1`
conversion in the original transition transaction. Existing pre-M2 outcomes are
normalized once from the existing outcome ledger and current deal value on first
calculation; historic value reconstruction is unavailable in the M1 schema and
must not be represented as paid revenue. Commerce definition is
`commerce-paid-v1`. Conversion, source receipt, audit and typed calculation
outbox entry commit atomically for imported commerce.

## Attribution and publication

`deterministic-v1` computes First Touch and Last Non-Direct Touch, weight=1 per
conversion/model/run, default 30-day lookback (configurable 1–365). Eligible
tenant-local, consented touches must precede conversion, fall within lookback and
the explicit identity interval. Ties use occurrence time then stable touch ID.
Last Non-Direct chooses known non-direct, then evidenced direct, otherwise
unknown. Unknown has null touchpoint_id. Ambiguous UTM names never invent campaign
IDs. Refunds use the original conversion's allocation within the same run.

Each publication is immutable, retaining version, lookback, as-of and evidence
hash. Same evidence/config yields the same hash and credits, while each execution
has a distinct run ID. Reports can select an earlier run. Late collection,
identity corrections and imports enqueue recalculation; the existing worker
processes one durable item at a time, checks current worker and originating
authority/site enablement, then commits the run and completion atomically.
Revoked work is marked blocked; an interrupted transaction remains retryable.
No external delivery or provider effect exists. New service outcomes retain the
existing M1 outbox and appear on the next calculation.

Reports separate outcome types, currencies and models; refund values are signed.
They do not sum both attribution models or provider counts into unique sales.
Conversion occurrence is UTC; costs retain campaign source account, source
currency/timezone and account-local reporting date, with fetched_at. Costs are
explicitly synthetic internal snapshots, separate from provider-reported
attribution (null). No FX, causal claims, acquisition-cohort BI, ML attribution,
provider spend ingestion or external conversion delivery.

## UI and operations

`/reporting`, linked from CRM, provides campaign summary, conversion list/detail,
order/payment/refund detail and contact journey. Arabic RTL/English LTR at 360px
and desktop, keyboard focus, loading/empty/error/permission states and explicit
unknown/source/model labels are tested. Credentials stay in the page's memory.
No production identity, operational capacity, RPO/RTO or Docker claims.

Run migrations 006 and 007 after 001–005 (current chain 001–007). Migration 006 adds 17 FORCE-RLS tables and additive event
columns/indexes/permissions/functions; it does not replace keys or ciphertext.
Use the existing explicitly provisioned protected keys. The disposable validation
helpers `scripts/m2-clean-check.ts` and `scripts/m2-upgrade-check.ts` are destructive
only to the dedicated loopback validation database and must never target real
data. Native Windows PostgreSQL tests use private environment configuration.
