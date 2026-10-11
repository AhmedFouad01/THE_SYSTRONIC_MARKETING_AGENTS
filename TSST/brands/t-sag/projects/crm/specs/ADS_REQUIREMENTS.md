# ADS_REQUIREMENTS — CRM-PLAN-ADS

Date: 2026-10-07 · Owner: SPARK_AG · Status: PROPOSED / NOT_READY.

Requirements only; no implementation, installations, tests or live account changes. Two uses: agency CRM for its own clients; separate client tenants for campaign-driven CRM. Never combine their audiences. Arabic-first, full RTL, English equally first-class; bilingual labels/errors and isolated mixed-direction identifiers.

Evidence: read only P1B_CONTRACTS, IMPORT_CONTRACTS, CHARTS_CONTRACTS, AUTH_PLAN §§1–3 and migration filenames in C:/Work/tsst-crm-mvp/CRM_APP; branch verified as feat/crm-mvp-ui. Custom properties support contacts/leads, typed values and sensitive-field permissions; P1B says filter metadata is additive later, so segments are proposed, not shipped. Existing audit/business-event/outbox conventions can support delivery requirements. Import consent mapping is not currently defined. Journey migrations 006/007 exist; filenames alone do not establish their schema. Migration listing includes 013/014 and 018 but lacks AUTH_PLAN's proposed 015–017; developer must reconcile before implementation.

## 1. Segments

A segment is a tenant-scoped dynamic saved filter over contacts or leads, including authorized custom properties. Leads resolve to distinct, non-merged contacts for audience delivery. Definition stores object, typed predicates, logical groups, name in AR/EN, owner, revision and status; no customer identifiers in its label.

| Requirement | Proposed acceptance |
|---|---|
| Filters | AND/OR, typed equality/ranges, selection membership, empty/not-empty and relative dates; reuse future registry-supported operators. Reject archived/unknown/unreadable properties. Do not infer missing equals false. |
| Authorization | Manager with MFA controls shared audience sources and sync; rep preview respects assigned scope; reader cannot export. Existing fixed-deal agency grants do not grant tenant-wide audiences. Add explicit permissions through the dev design. |
| Refresh | Recalculate after relevant record/import/merge/consent changes; hourly reconciliation and manual refresh. Target eligible changes queued within 15 minutes; platform availability remains asynchronous. |
| Size estimate | Show CRM distinct-contact count, consent-eligible identifiable count, last calculation time and definition revision. Unknown/stale is labelled. Never equate uploaded identifiers with matched/reachable people; display platform estimate only if returned. |
| Audience source | Bind tenant + segment revision + platform account + audience ID. Initial snapshot then add/remove diffs. Remove departed/withdrawn contacts; retry without duplicate additions. Track pending/accepted/rejected/removed counts. |
| Invalid definition | Pause export on incompatible property changes; notify manager. Consent withdrawal suppresses immediately even if a segment snapshot is stale. |

All examples additionally require valid audience-sharing consent and an email/phone. These are illustrative business filters, not customer research.

| Egyptian SMB example | Saved filter / use |
|---|---|
| Clinic general announcements | Contacts: city=Cairo AND general_newsletter=true; only nonclinical opt-ins. Exclude patient, diagnosis, treatment or appointment-derived membership from ad audiences pending legal/platform approval. |
| Real estate fresh enquiries | Leads: area_interest=New Cairo AND status=open AND created within 30 days; re-engagement. |
| Real estate qualified prospects | Leads: status=qualified AND budget_egp≥3,000,000 AND property_type=apartment; sales follow-up audience. |
| E-commerce repeat customers | Contacts: order_count≥2 AND last_paid_order within 180 days; loyalty offers. |
| E-commerce lapsed customers | Contacts: order_count≥1 AND last_paid_order 90–180 days ago AND no open complaint; reactivation. |

Required example properties/relationship filters are proposed extensions, not asserted existing columns.

## 2. Tracking and journey data

Flow: consented landing/form → touchpoint → tenant contact/lead → CRM qualification/deal outcome → consent gate → platform delivery ledger. Website/form owns observed visits; sales owns qualification; CRM owns stage transitions; payment/finance owns recognized revenue.

Capture utm_source, utm_medium, utm_campaign, utm_content, utm_term plus gclid, fbclid, ttclid, landing path, sanitized referrer, session ID and UTC occurred/received timestamps. Keep click IDs opaque, unhashed; strip arbitrary URL query parameters and free text. Capture only permitted tracking, never reconstruct missing IDs. Associate anonymous sessions with contacts only through a permitted deterministic form/login link within one tenant.

First touch is earliest observed acquisition; last touch is latest observed acquisition before each conversion. Preserve first touch, append touches, and freeze a conversion's first/last snapshots; late events can create a versioned correction. Label direct/unknown and missing/cross-device history. No fingerprinting or cross-tenant identity stitching.

Every event requires event_id, tenant_id (internal only), name, occurred_at, received_at, source, applicable contact/lead/deal/session identifiers and consent snapshot/version. Values use integer minor units with ISO currency internally; platform adapters convert units. Optional parameters below are omitted when unknown.

| Event | Exact trigger / extra parameters / owner |
|---|---|
| page_view | Consented page displayed; path, referrer, UTM/click IDs; website. |
| form_submitted | Server accepts valid enquiry; form_id, submission_id, channel; form service. |
| lead_created | New enquiry committed, including Lead Ads; lead_id, acquisition_source, external_lead_id; CRM. |
| contact_attempted | Sales logs outreach; channel, activity_id, outcome; sales. |
| appointment_booked | Confirmed booking; booking_id, booked_at; booking owner. Clinic event stays internal. |
| lead_qualified | First verified qualification, not import creation; qualification_rule_version; sales. |
| deal_created / stage_changed | Committed deal/transition; pipeline_id, from_stage, to_stage, transition_id; CRM. |
| deal_won / deal_lost | Verified terminal transition; deal_id, outcome_reason_code, value_minor, currency; sales. |
| payment_received / refund_issued | Confirmed payment/refund; transaction_id, order_id, amount_minor, currency; finance. |
| consent_changed | Recorded grant/withdrawal; purpose, status, source, notice_version; privacy owner; internal only. |

Lifecycle: anonymous visitor → known enquiry (lead=open) → qualified (lead=qualified) → opportunity (deal created) → customer (verified won) → repeat customer. Lead closed/lost and deal lost are terminal branches; reopening appends history. Lifecycle derives from evidence and remains separate from configurable deal stages and existing open/qualified/closed lead statuses.

| CRM signal | Proposed Meta mapping / optimization policy |
|---|---|
| Genuine enquiry accepted | Lead; secondary once qualified-lead volume is sufficient. Meta-native lead ingestion must not resend the same native lead as a new conversion. |
| Qualified lead | Proposed QualifiedLead/custom mapping, subject to dataset/event support verification; primary for lead generation once valid. |
| Nonclinical confirmed booking | Schedule; optional secondary. |
| Payment confirmed | Purchase, actual value/currency; primary for commerce. |
| Deal won without payment | Proposed custom DealWon; observed sales outcome, not Purchase or recognized revenue. |
| Generic stage/lost/refund/consent/import | Internal observation; never auto-send every stage as a conversion. Platform corrections require supported adjustment rules. |

Choose one primary funnel outcome per campaign objective; other stages are observations, never an additive conversion total.

**Consent requirements:** per contact record marketing_consent = unknown/granted/denied/withdrawn, purpose/channel, source (form/import/verbal evidence), granted/changed_at UTC, collector, notice_version and evidence reference. Separate permission for ad measurement and customer-list personalization; a newsletter grant does not authorize platform sharing. Lead form completion or imported membership never implies consent. Import must supply verifiable purpose/source/time or default unknown.

Unknown/denied/withdrawn blocks audience additions and identifying conversion exports. Recheck consent immediately before dispatch, cancel queued sends, enqueue audience removals and retain minimal withdrawal evidence. Hashing is not anonymization. Exclude health/sensitive attributes and event/URL leakage from all exports; raw identifiers stay access-controlled.

Egypt PDPL Law 151/2020 alignment is a proposed product gate: explicit informed purpose-specific consent, withdrawal, access/correction/deletion workflows, minimization, retention and controller/processor responsibilities. Ahmed's legal adviser must validate applicable licensing, cross-border transfers, sensitive-data rules and notices before activation. **SKILL_GAP: Egyptian privacy/legal validation is not covered by the assigned skills; no compliance certification is claimed.** Legal source validation was not performed because the brief limits web domains to platform docs. Meet Meta terms through lawful collection/use and Google consent fields for ad_user_data/ad_personalization, with unknown blocked under our stricter product policy. [Google consent/upload requirements](https://developers.google.com/google-ads/api/docs/conversions/upload-offline), [Customer Match consent](https://developers.google.com/google-ads/api/docs/remarketing/audience-segments/customer-match/get-started).

CRM observed outcomes are the business baseline; finance separately reconciles paid/refunded revenue. CRM journey views use first-touch and last-touch observed click credit, proposed 30-day lookback, conversion-event date, UTC storage/browser timezone display. Each platform report must expose its actual model/window, interaction-versus-conversion date, timezone, view-through/modeled/cross-device scope and freshness. Never sum platform-attributed totals or claim causal lift.

## 3. Meta — phase 1

**Evidence limitation:** seven official Meta pages below returned access errors/429 on 2026-10-07. Meta-specific details are proposed requirements pending official verification; these links are verification targets, not claims of successfully read guidance.

| Integration | Proposed requirements |
|---|---|
| Lead Ads webhook | Client authorizes its Page/ad account; subscribe Page leadgen. Verify challenge and request signature, durably enqueue before acknowledgement, retrieve lead details by leadgen_id, route through authorized asset→tenant mapping. Preserve page/form/ad IDs and original submission time. Dedup tenant+leadgen_id; validate/map fields through existing CRM custom-property rules, normalize +20 phone, quarantine ambiguous matches. Paginated catch-up after webhook gaps; no cross-client fallback. |
| Custom Audiences | Manager selects eligible segment/account. Normalize email/phone per Meta field rules, then SHA-256; preferred match keys EMAIL and PHONE, optional names/location only if necessary, consented and supported. Never hash click IDs/cookie identifiers. Do not export sensitive/custom-property values. Batched additions/removals, job status and deletion receipts. |
| CAPI | Use approved dataset/pixel tied to client's connection. Map only approved business events above; include event_name, original event_time, event_id, truthful action_source, consented user_data and applicable value/currency. Derive fbc from valid fbclid under documented rules; never fabricate fbp. Do not use current operator IP as customer IP. |
| Dedup | Stable opaque event_id per business action, retained across retries; browser/server copies share event_name+event_id. Distinct qualification/payment actions have different IDs. CRM delivery uniqueness tenant+destination+event_id; retries retain original time; stage no-ops/import replays do not generate conversions. |
| Operations | Exponential retry transient/rate-limit errors; quarantine permanent/schema/expired-token failures; freshness cutoff follows verified API limits. Show receipt status, lag, rejects and reason codes without identifiers. Accepted delivery is not proof of matching, attribution or optimization eligibility. |

Official verification targets: [Lead retrieval](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving/), [Custom Audiences](https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences/), [CAPI parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/), [CAPI dedup](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/).

Ahmed starts the following in parallel before promising client onboarding. Times are internal scheduling allowances, **not verified Meta SLAs**.

| Dependency | Start/proposed allowance | Gate |
|---|---|---|
| Business verification | Day 0; reserve 2–4 weeks plus document remediation | Legal entity details/documents and administrator access. |
| App Review / Advanced Access | Day 0 preparation; reserve 2–4 weeks after complete submission, longer if resubmission | Privacy policy, deletion flow, reviewer instructions/test assets and screencasts for actual use cases. |
| Permissions and asset access | Day 0 inventory; reserve 3–5 working days preparation, approval overlaps review | Proposed leads_retrieval, pages_manage_metadata, pages_show_list/pages_read_engagement as needed, ads_management for audience writes; ads_read only if reporting needs it. Confirm exact permission set/access levels for current API. Page lead access and dataset/ad-account assignments also required. |

[App Review](https://developers.facebook.com/docs/app-review/), [Business verification](https://developers.facebook.com/docs/development/release/business-verification/), [Permissions](https://developers.facebook.com/docs/permissions/). Delay exports until permissions, legal consent and valid event mapping are verified; campaign optimization readiness requires meaningful qualified/paid evidence.

## 4. Google and TikTok — phase 2 deltas only

| Platform | Deltas from Meta |
|---|---|
| Google Customer Match | OAuth/account ownership, policy/payment eligibility and per-platform normalization. Track list processing/match status; honor ad_user_data and ad_personalization. Current guide restricts legacy Customer Match upload services for projects without activity in Oct 2025–Mar 2026 and recommends Data Manager API; developer must choose current supported route rather than copy legacy jobs. [Guide](https://developers.google.com/google-ads/api/docs/remarketing/audience-segments/customer-match/get-started). |
| Google offline / Enhanced Conversions for Leads | Precreate appropriate conversion actions; qualified lead/paid outcome maps to an action, not Meta event names. Capture gclid; enhanced matching adds normalized hashed email/phone and consent, with enablement/terms prerequisites. Send original conversion datetime with timezone, value/currency, stable order_id; inspect per-record failures and reconciliation. Prefer current Data Manager route for new integration; verify Google Ads API availability before implementation. [Offline guide](https://developers.google.com/google-ads/api/docs/conversions/upload-offline). |
| TikTok Events API | Events API 2.0 /event/track/ uses explicit event_source/event_source_id; supports web/offline/CRM. Map supported TikTok events independently; send ttclid and consented hashed email/phone, truthful user context and stable event_id for shared Pixel/server actions. Never use sunset Events API 1.0 routes. [Events 2.0](https://business-api.tiktok.com/gateway/docs/index?doc_id=1771100779668482&language=ENGLISH), [Matching/dedup](https://business-api.tiktok.com/gateway/docs/index?doc_id=1799004097478658). |
| TikTok audiences | Advertiser-specific Customer File APIs and normalization; asynchronous file processing. Official guide states 1,000-person minimum for targeting and roughly 30–60-minute processing, service-dependent; below-threshold CRM counts do not promise reach. [Audience types](https://business-api.tiktok.com/portal/docs/audience-types/v1.3). |

## 5. MVP cut

| Must-have to sell Meta-connected CRM | Later |
|---|---|
| Tenant-isolated dynamic segments, custom filters, distinct eligible size and basic sync/removal status | Complex behavioral sequences, predictive scoring, lookalikes |
| UTM/click-ID capture, first/last touch, chronological journey and purpose-specific consent evidence/withdrawal | Advanced attribution, incrementality experiments |
| Meta Lead Ads retrieval, replay/catch-up and field mapping; consent-gated audiences and approved CRM conversions | Google first, then TikTok adapters; automated campaign creation |
| Client OAuth connection per tenant and selected Page/ad account/dataset; manager+MFA, asset verification, disconnect/reconnect | Additional accounts/advanced reporting and automation |
| Server-side secure token storage requirement: encrypted at rest, minimal scope, expiry/revocation/rotation, audited access, no browser/log exposure; dev task designs storage | Token storage architecture is deliberately left to dev |
| AR/EN, full RTL; truthful empty/stale/error/retry/permission states | Rich journey analytics |
| Delivery ledger, consent removals, pause switch, privacy/account gates | Expanded correction/refund adapters |

Planned acceptance evidence only: valid enquiry reaches correct tenant; webhook/retry duplicates produce one action; missing/ambiguous identifiers quarantine; withdrawal blocks queued sends/removes audience membership; delayed events retain original time; refund does not become a positive Purchase; unlinked cross-device visits remain unknown; wrong-tenant assets fail closed. Reconcile committed eligible actions against pending/accepted/rejected deliveries daily; alert any unexplained count gap, denied-consent send, or lag above target. Pause connector on consent/isolation failures. No tests were run.

## 6. Open questions for Ahmed

1. Which first pilot client/vertical and client-owned Page, ad account and dataset should onboarding use?
2. What verified qualification rule and single primary outcome does each pilot need; is commerce Purchase based on payment or cash-on-delivery completion?
3. What consent notices/evidence exist, and who approves PDPL, cross-border processing and clinic exclusions?
4. Who supplies business-verification documents, App Review assets and each client's authorization?
5. What approved retention periods and withdrawal/deletion response targets apply to identifiers, journeys and delivery evidence?

