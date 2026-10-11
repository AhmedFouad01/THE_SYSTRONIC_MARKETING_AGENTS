# 02 SPARK screen data spec: what every screen must surface (t-sag CRM redesign, step 2 of 4)

Date: 2026-10-09 · Agent: SPARK_AG · Skills: TSST-SPARK-SK-001 (KPI tree), -002 (events, dedup, consent, ownership), -003 (attribution limits, time basis). Status: ACCEPTED by Lead 2026-10-09 as input to CREATIVE (open questions in s7 pending Ahmed). Lead live check: F1, F2, F3 confirmed. Over the word cap (about 6.9k vs 4.5k), accepted as is. UNVALIDATED skills. Data and meaning only: no colours, layout or code.

## 0. How to read this

**Inputs read:** DECISIONS D-01..D-06; LENS 01b s1, 4, 5.3, 7; LENS 01 s1-2; ADS_REQUIREMENTS (full); VISUAL_REVIEW (R04, R05, R07, R10, R01, R09); NAV_AND_SCREENS s2 (import, read for rules) and s3 (dashboard); BUILD_PLAN_v3 (headings, task list, risks). No app code, no `local-auth-demo.json`, app not run.

**Calls used: WebFetch 4/6, WebSearch 3/3.** All URLs came from search results; none guessed.

| # | URL | Status | What it gave |
|---|---|---|---|
| S1-S3 | three searches (Meta Insights, Google reporting, TikTok leads/reporting) | OK | Only URLs below; TikTok search returned no developer docs |
| F1 | developers.facebook.com/blog/post/2025/10/16/ads-insights-api-metric-availability-updates/ | OK (A) | From 2026-01-12: 7d_view and 28d_view windows no longer returned; 1d click, 7d click, 28d click, 1d engaged view, 1d view remain. Unique-count and hourly breakdowns: 13 months. Frequency breakdown: 6 months. MMM: async only. Totals: up to 37 months |
| F2 | developers.google.com/google-ads/api/docs/reporting/segmentation | OK, PART | `segments.date` and week/month/quarter/year; a finite date range is required when a core date segment is selected; date/week/hour lookback 37 months. Time zone and conversion-date metrics NOT on the page |
| F3 | developers.google.com/google-ads/api/docs/concepts/retrieving-objects | OK, PART | `SearchStream` for large downloads (>10,000 rows); `Search` pages fixed at 10,000. Quotas not on page |
| F4 | ads.tiktok.com/business/it/blog/tiktok-world-native-lead-generation | OK (2022 blog, dated) | Instant Forms; leads synced to CRM via WebHooks API, Zapier, Leadsbridge, or downloaded manually |

Everything not in the table is **UNVERIFIED** (field names, scopes, refresh latency, Google lead-form ingestion route, TikTok reporting endpoint, audience minimums for Meta/Google). The `ads_read` scope for Insights comes from a search snippet of a Meta page I did not open (B).

**Status codes:** EXISTS = in the CRM today per BUILD_PLAN (it has no "built" section; I treat only the Dashboard C1-C5 contracts, lead statuses open/qualified/closed, custom properties, import contract and migrations 001-014 + 018 as existing; DEV must confirm) · BACKEND = new CRM backend work · PLATFORM = needs an ad-platform integration · DEV-CONFIRM = unsure.

**Role keys:** M manager, P rep, R reader. **Tier keys:** AG = agency staff, CL = client user. "Roll-up" = the agency's cross-client numbers.

## 1. KPI tree

### 1.1 Nodes

Time-basis rule: **funnel rates use the cohort view** (leads grouped by lead-created date, followed forward); **volumes and money use the event view** (counted on the date the event happened). Each report states which one it uses. Cohorts younger than the typical cycle are marked "still maturing".

| # | Node | Definition | Formula | Source | Time basis | Attribution limits |
|---|---|---|---|---|---|---|
| N1 | Spend | Money the platform charged | Sum of daily ad-level spend, account currency | PLATFORM | Platform report date (impression day), account time zone | Never converted or summed across currencies silently. Platform figure, not an invoice |
| N2 | Impressions | Ad shown | Sum | PLATFORM | Report date | Platform-defined; not deduplicated across platforms |
| N3 | Clicks | Platform clicks (link or all, label which) | Sum | PLATFORM | Report date | Not equal to site visits (blockers, consent, redirects). CRM sessions are a separate node |
| N3b | Sessions with ad touch | Consented page_view with click ID or UTM | Count | CRM (BACKEND) | Event time | Consent-limited; undercounts |
| N4 | Platform leads | Leads the platform says it got | Platform lead action count | PLATFORM | Choose impression or conversion time (Meta lets you pick; Google, TikTok UNVERIFIED) | Model, window and view-through differ per platform. Do not add platforms together |
| N5 | CRM leads | Valid leads with phone or email (R10) | Count of lead_created | CRM EXISTS (source/campaign fields BACKEND) | Event time (lead_created, UTC; shown in browser time zone) | Source is "observed", can be unknown/direct. Import and manual leads carry source "import"/"manual" and never count toward ad leads unless UTM is mapped |
| N5b | Lead gap | N4 minus N5, per campaign | Difference | CRM + PLATFORM | Same-day buckets | Expected to differ (time basis, rejected invalid leads, dedup). Show as reconciliation, never "error" |
| N6 | Contacted (attempted) | Lead has at least one logged outreach | Leads with first contact_attempted / N5 (cohort) | CRM EXISTS (activities); event contract BACKEND | Cohort | Only logged outreach counts. Unlogged calls are invisible |
| N6b | Reached | Attempt with outcome "answered/replied" | Leads reached / N5 | CRM | Cohort | Outcome codes needed (BACKEND) |
| N6c | Speed-to-lead | Minutes from lead_created to first attempt | Median and share within SLA | CRM | Event time | Excludes imports. SLA is tenant-set |
| N7 | Qualified | First verified qualification (lead status = qualified) | Qualified / N5 (cohort); count (event view) | CRM EXISTS (status). `qualified_at` + rule version BACKEND | Cohort and event | Definition is the tenant's, not the platform's. Re-qualification does not recount |
| N8 | Deals created | Deals linked to a lead or contact | Count; rate = deals / qualified | CRM EXISTS | Event time | A deal may have no lead origin (manual). Flag it "no source" |
| N9 | Won deals | Verified terminal won | Count; win rate = won / (won + lost) in period | CRM EXISTS | Event time (won date) | Won is a sales outcome, not payment |
| N10 | Won revenue (deal value) | Sum of value on won deals | Sum of `value_minor` per currency | CRM EXISTS | Won date | Sales claim, not recognised revenue. Separate currencies |
| N11 | Paid revenue (Commerce module) | Confirmed payment minus refunds | payment_received - refund_issued | CRM module BACKEND (finance producer DEV-CONFIRM) | Payment date | Source of truth for commerce. Refunds reduce it, never become a positive event |
| N12 | CRM-ROAS | Won revenue (or paid revenue for Commerce) over spend | N10 / N1 (same currency only) | CRM + PLATFORM | Event view with a lag | Based on observed first/last click credit (30-day look-back proposed). Not incremental lift |
| N13 | Cost ratios | CPL = N1 / N5; cost per qualified; cost per won (CAC proxy) | Division, same campaign and currency | CRM + PLATFORM | Spend by report date, outcomes by cohort. Show "maturing" | Spend not matched to any CRM lead stays visible as "unmatched spend" |

Ownership (SK-002): website/form owns visits; sales owns qualification; CRM owns stage transitions; finance owns payment. Platforms own spend, impressions, clicks.

### 1.2 Headline KPIs (5-7 per tier)

| Tier | Headline KPIs | Notes |
|---|---|---|
| **Agency roll-up** | 1 Spend per client (each currency separate); 2 CRM leads and cost per lead; 3 Qualified rate and cost per qualified lead; 4 Won revenue and CRM-ROAS per client; 5 Speed-to-lead median; 6 Pipeline value open; 7 **Clients needing attention** (integration broken, delivery rejects, no leads in 7 days, SLA breaches, consent unknown share high) | Counts may be summed across clients; money never across currencies. Row per client, not one blended total. Aggregates only; no record-level cross-client data (see Q1) |
| **Client** | 1 New leads (and untouched count); 2 Speed-to-lead median vs SLA; 3 Qualified leads and rate; 4 Open pipeline value; 5 Won deals and won revenue; 6 Cost per qualified lead (if ads connected); 7 Overdue tasks | P sees "Mine". R sees all, read only. Without ad connection, tiles 6 shows "Not connected" and the rest still work |

## 2. Per-screen data spec

Common to all list screens (R07): column chooser, reorder, freeze 1-3, saved views, inline edit under the same validation and permission, full-width table, sticky first column. Money always shows its currency. Phone/email masked without `sensitive.read` (R09). Names are one field, `dir=auto` (R08). Empty states below are data-level only (what is missing), CREATIVE writes the look.

### 2.1 Overview

| Screen | Must surface | Role / tier differences | Empty / no-connection | Status |
|---|---|---|---|---|
| **Dashboard** | Keep C1 pipeline, C2 leads by status/source, C3 outcomes, C4 tasks due, C5 activity. Add a KPI strip with the tier's headline KPIs (1.2). Add widget "Lead source quality": leads vs qualified by campaign (client) or by client (agency). Show range, comparison, `as_of`, time zone. Default range: last 30 days for KPI strip; last 6 months trend (R04), leading empty months trimmed | CL: M/R tenant-wide, P "Mine". AG roll-up: one row per client, drill into a client opens that client's dashboard. AG in a single client sees the client view | All zero: "No data for this period" and a data hint ("no leads yet"; "no ad account connected" for ad tiles). Platform tiles: "Not connected" with link to Integrations. Stale platform data: show "last updated" | C1-C5 EXISTS; KPI strip BACKEND; ad tiles PLATFORM; roll-up DEV-CONFIRM |

### 2.2 CRM

| Screen | Must surface | Role / tier differences | Empty / no-connection | Status |
|---|---|---|---|---|
| **Leads** | Columns (default order): display name (person, else company, else email/phone, else "Untitled lead", R10) + company; phone; email; source/channel; campaign; ad (if known); status open/qualified/closed; owner; created; age since created; first-contact time or "untouched"; consent (ad purpose); form. KPI strip: new, untouched, qualified, missing contact (no navy, R03). Default views: **New and untouched**, **My leads**, **From ads**, **Missing contact**, **Stale (no activity N days)**, **All**. Filters: status, source, campaign, owner, created range, missing contact, consent, segment. Create/import requires phone or email with AR/EN error | M all + bulk assign; P own and unassigned pool (assignment rule DEV-CONFIRM); R read. CL sees own workspace; AG sees per workspace | No leads: "No leads yet" plus whether a form or ad source is connected. "Missing contact" count shown even when zero | EXISTS (status, source basic); campaign/ad/click fields, consent, first-contact BACKEND |
| **Contacts + record + journey** | List columns: name, company, job title, phone, email, owner, lifecycle, first-touch source, latest-touch source, segments (chips), consent (ad measurement / customer list), last activity, created. Saved views: **All, My contacts, Customers, Recently active, No owner, Duplicates suspected, Unknown consent**. Filter by segment (D-01). **Record page**: highlights strip (up to 6): lifecycle, owner, phone, email, first-touch source, open deal value. Cards: details, associations (leads, deals), segment membership with "Add to segment", consent card (status, purpose, source, time, notice version, evidence ref) with M-only change. One timeline with chips All / People / System (section 4). Actions: call, mailto, WhatsApp (R09) | M edit all, consent edit; P own scope, log activity, no consent edit; R read. Masking per `sensitive.read`. Client sees own workspace only | Empty timeline: "No activity". Unknown source: label "Unknown/direct", never blank | EXISTS (record, custom props); journey/consent/lifecycle BACKEND; DEV-CONFIRM for 006/007 schema |
| **Merge** | Duplicate keys: **email** (trim, lowercase) then **phone** (E.164, +20 default: `01xxxxxxxxx` becomes `+201xxxxxxxxx`), same order as import. Never auto-merge on name alone. Review screen shows only conflicting fields, survivor choice, preview of result and loss list. Rules: consent takes the **most restrictive** value (denied/withdrawn beats granted); touches are unioned; first touch = earliest; click IDs unioned; segment memberships and deals re-pointed; merged-away record is excluded from audiences and a removal is queued; audit trail with undo window DEV-CONFIRM. Duplicate queue: pairs, matched key, score reason | M only (merge capability); P can flag; R none. AG: only inside a client | No duplicates: "No suspected duplicates", count by key | EXISTS (merge, import matching); consent/journey merge rules BACKEND |
| **Deals + record** | Columns: title, contact/company, value + currency, stage, close date, owner, created, age in stage, **origin** (lead, campaign, ad, first/last touch snapshot), status open/won/lost, loss reason. Highlights strip: value, stage, close date, owner, origin, stale flag. Views: Open, Closing this month, Stale, Won, Lost, Mine. Marking lost requires reason code (feeds loss report). Marking won stores won date and value. Optional stage probability for weighted value (DEV-CONFIRM). Same record anatomy as Contact | M all; P own; R read. Value fields respect sensitive permission | No deals: "No deals yet". Deals without origin carry a "no source" chip | EXISTS (value, stage, outcomes); origin snapshot, loss reason code BACKEND |
| **Pipeline** | Board by stage; header: count, value per currency, weighted value (if probabilities exist). Card: title wraps 2 lines, value, contact, age in stage, owner, stale mark. **Stale rule:** days since the later of last stage change and last logged activity; threshold is a **per-stage setting `stale_after_days`**, blank means off; won/lost never stale. No invented defaults; suggest a starting value only after the tenant has 30 days of stage-duration data (show median days per stage as the guide). Pipeline settings: add, rename, reorder, archive stages (single name, R01); stage-to-conversion-event mapping lives in Integrations (6c). Drag between stages uses the existing transition API | M edit stages; P move own deals; R read. Stage names are tenant data | Empty stage shows count 0 (stage preserved) | EXISTS (stages, transition); stale threshold, probability BACKEND |
| **Tasks** | Types tied to lead follow-up: **First contact** (auto-created with the lead; due = lead created + tenant SLA), **Follow-up**, **Qualification call**, **Send quote**, **Booking**, **Other**. Columns: type, title, related record, due, assignee, status, overdue by. Views: Due today, Overdue, Upcoming, Completed, Assignee: Me. A completed First-contact task writes the `contact_attempted` event; an overdue First-contact task is an SLA breach (KPI N6c). Task completion needs an outcome for outreach types (answered/no answer/wrong number/interested/not interested) | P own; M all and reassign; R read | "Nothing due" | EXISTS (tasks, due); types, auto-task, outcomes BACKEND |
| **Import** | Keep the five steps (NAV s2). Add: map **source fields** (utm_*, click IDs, original created date, source label); optional consent mapping with purpose/source/time/notice (T6), otherwise consent = unknown. **Update vs create:** contacts match email then phone; Skip (default) / Update / Create; blank never clears; leads reuse matching contacts and duplicate = same contact + same title, not closed; **a lead row needs phone or email**, else row error `lead.contact_required`. Import never creates conversion events or speed-to-lead data, and never counts as ad-sourced unless UTM columns are mapped. **Error report:** per row: row number, target field, error code, safe AR/EN message, retryable; filter by outcome; download CSV of failed rows with an added "reason" column; history of jobs with counts | M only (MFA), AG or CL manager | No file chosen: step-1 state. Zero valid rows: commit disabled | EXISTS (import, ledger); source and consent mapping BACKEND; downloadable error CSV DEV-CONFIRM |

### 2.3 Marketing

| Screen | Must surface | Role / tier differences | Empty / no-connection | Status |
|---|---|---|---|---|
| **Ads** | Read-only structure per platform: account > campaign > ad set > ad, with status, objective, spend (period), CRM leads, qualified, won. Status chips per row: **conversion delivery** (active/paused/errors) and **audience sync**. Connection chip per platform (healthy, reauth needed, disconnected). No ad creation or edits (deferred) | M: sync controls (pause delivery, bind audience). P, R: none (LENS 7.4). AG edits; CL manager views | No connection: "Connect Meta/Google/TikTok in Administration > Integrations". Connected but not yet pulled: "First sync pending" | PLATFORM (structure pull); chips BACKEND |
| **Ads insights** | Per ad, ad set, campaign, platform: spend, impressions, clicks, CTR, CPC, platform leads, CRM leads, lead gap, cost per lead, qualified, cost per qualified, won, won revenue, CRM-ROAS. Breakdowns: platform, campaign, ad set, ad, day/week, placement (platform pull only). Comparison with previous period. Attribution note always visible (5.5). Shared report "Revenue by campaign" opens here | M, P, R view (LENS 7.4); P sees CRM outcomes for own leads only (DEV-CONFIRM) | Not connected: show CRM-only columns (by UTM campaign) with a "Connect to see spend" line. Pull stale > 24 h: banner with timestamp | PLATFORM + BACKEND |
| **Segments** | List: name (single field), object (contact/lead), type (live/static), CRM count, with-identifier count, consent-eligible count, last calculated, revision, owner, sync status per platform. See section 3 | M create/edit/sync; P view and use in Contacts; R view. Client reader sees own tenant | "No segments yet" plus template suggestions per module | BACKEND (S1-S6) |
| **Forms** | Per form: name, status, destination pipeline/owner, fields mapped to properties, submissions (period), conversion to qualified, source channel, consent checkbox/notice version shown. Per submission: submission id, lead id, time, spam/dup outcome. Meta/Google/TikTok lead forms listed with field map and last lead received | M edit mapping; P view; R none | No forms: "No forms connected" | DEV-CONFIRM (collect routes exist, schema unknown); platform lead forms PLATFORM |
| **SEO** | Minimal and honest: organic landing pages with sessions-with-touch, leads, qualified, won; UTM-less organic = "Organic/direct". Search Console queries and rankings only if connected (not planned; UNVERIFIED API scope) | M edit, P view, R none | "No organic data" | BACKEND (landing-path aggregation); Search Console PLATFORM, later |

### 2.4 Module groups (data events only)

| Module | Adds | Status |
|---|---|---|
| **Commerce** | Events `order_placed`, `payment_received` (Purchase, value, currency), `refund_issued` (reduces paid revenue; never a positive conversion). Properties: `order_count`, `last_paid_order`, `lifetime_value`, `average_order_value`, `open_complaint`. Customers view: value, orders, last order. Segment templates: repeat customers, lapsed 90-180 days | BACKEND; finance/payment producer DEV-CONFIRM |
| **Restaurants (later)** | Orders, reservations. Not specified now | Later |

### 2.5 Insights

| Screen | Must surface | Role / tier | Empty / no-connection | Status |
|---|---|---|---|---|
| **Reports** | The catalogue in section 5: filter bar (range, compare, source, campaign, owner, pipeline, segment), saved views, share (full / read-write / read-only), export CSV where role allows | M all; P own scope; R read, no export. AG roll-up variants per client | Each card has its own empty/error/403 state with the missing data named | EXISTS (CRM reports at C1-C5 level); rest BACKEND/PLATFORM |
| **Journeys & tracking** | Two views. (1) Journey list: lead/contact, first touch, latest touch, touches count, days to lead / to qualified / to won, lifecycle. (2) Source health: share of leads with known source, with click ID, with UTM, "unknown/direct" rate, tracking-gap flags. Per record: the timeline of section 4. Frozen first/last snapshot per conversion with corrections marked | M, P own scope, R read. AG sees per workspace | "No tracked visits yet: install the tracking snippet / connect a form" | BACKEND (T1-T8) |

### 2.6 Administration

| Screen | Must surface | Role / tier | Empty / no-connection | Status |
|---|---|---|---|---|
| **Integrations** | Card per platform: connected account/page/dataset names (never IDs only), who connected, when, scopes granted vs needed, **health**: token state (valid, expiring, revoked), last successful pull, last lead received, webhook last event, conversion delivery counts (pending/accepted/rejected/removed, 24 h and 7 d), audience sync counts, lag, last error reason code, paused flag. Lead-form field maps. **Conversion event mapping screen and ledger (6c)** | M with MFA and `integration.manage`; P, R none. AG assists; no token display for CL | Not connected: connect action and the requirements checklist (business verification, access level) | M3/M14 planned; Google/TikTok PLATFORM later |
| **Users & roles** | User, role (M/P/R), workspace(s), status, 2FA state, last sign-in, scope (all records / own). Agency staff: **agency type**: all clients vs selected clients. Mapping: agency M can manage client workspaces they are assigned; agency staff are never silently M in every client; client users exist in one workspace only. No Login-As (D-02), no magic link (D-03) | M manages users; agency-only rows hidden from CL | Not applicable | EXISTS (roles, capabilities); agency all/selected type DEV-CONFIRM |
| **Settings** | System properties ads need (read-only list, cannot be deleted): phone, email, company, job title, owner, source, `utm_source/medium/campaign/content/term`, `gclid/fbclid/ttclid` (opaque, unhashed), landing path, referrer, session id, form id, `external_lead_id`, platform ad/adset/campaign ids, first-touch / latest-touch snapshots, lifecycle stage + reached-at times, `marketing_consent` per purpose (ad measurement, customer-list personalization, newsletter) with source/time/notice/evidence, qualification fields + rule version, loss reason, currency. Also: time zone display, week start (Saturday default), SLA minutes, stale thresholds, retention (after legal approval), property types incl. email/phone/url (R09) | M edit; others read | n/a | EXISTS (custom props); system ad properties BACKEND |
| **Modules & presets** (AG only) | Per workspace: module toggles (Commerce, later Restaurants), preset by business type, what each module adds (below), switch off = hide and keep data (D-06), record of who changed it and when | AG only | "No modules enabled" | BACKEND; D-06 assumption |

**What each module adds** (D-06, LENS 5.3 point 4):

| Preset / module | Ad events added | Segment properties added | Menu |
|---|---|---|---|
| Core (all) | page_view, form_submitted, lead_created, contact_attempted, lead_qualified, deal_created, stage_changed, deal_won, deal_lost, consent_changed | Contact, lead, deal, journey, lifecycle, consent, activity fields | Core |
| Commerce | payment_received (Purchase), refund_issued, order_placed | order_count, last_paid_order, lifetime_value, open_complaint | Commerce group |
| Real estate preset (custom objects needed; DEV-CONFIRM) | appointment_booked (viewing) | area_interest, budget_egp, property_type | none until custom objects |
| Clinic preset | appointment_booked stays **internal, never sent to platforms**; no clinical attribute enters any audience or event | Non-clinical only | none |

## 3. Segments

**Rule model.** A rule is `field / operator / value`. Groups nest to 2 levels with AND or OR. **NOT** negates a condition or a group. Operators by type: text (is, is not, contains, starts with, is empty, is not empty); number/money (=, !=, >, >=, <, <=, between); date (is, before, after, between, in the last N days, more than N days ago); select/multi-select (is any of, is none of); boolean; segment membership (in / not in a static segment only, to prevent loops). **Missing is not false:** "is empty" is an explicit operator. Archived, unknown or unreadable properties are rejected. Object: contact or lead; leads resolve to distinct, non-merged contacts for audience use. Same filter engine as list views (BUILD_PLAN S1). Definition stores: single name, object, rules, revision, owner, status.

**Available properties.**

| Group | Fields |
|---|---|
| Contact / lead | Name, company, job title, city/area, owner, created, last activity, days since last contact, tags, lead status, lead age, has phone, has email, custom properties (non-sensitive only) |
| Deal | Has open deal, open deal value, last won date, total won value, stage, lost reason |
| Ad and journey | First-touch source/campaign/ad set/ad, latest-touch (same), has gclid/fbclid/ttclid, form id, channel (lead form / web / import / manual), landing path, lifecycle stage, days in lifecycle, number of touches |
| Consent | ad measurement status, customer-list status, newsletter status (unknown/granted/denied/withdrawn) |
| Module | Commerce: order_count, last_paid_order, lifetime_value |
| Excluded | Health/clinical data, free text, raw identifiers as filter values in labels |

**Live vs static.**

| Type | Behaviour | Use |
|---|---|---|
| Live | Rules re-evaluated after record, import, merge or consent changes, hourly reconciliation, manual refresh; target 15 minutes (ADS s1) | Audiences, dashboards, saved filters |
| Static | A frozen list; members added from Contacts (single or bulk) or by import; stays until removed. Can also be an audience source | Event guests, manual campaigns |
| Bridge | "Save current Contacts filter as segment" (live) and "Freeze segment as static copy" | Contacts access (D-01) |

ADS_REQUIREMENTS describes only dynamic segments: static is a proposed addition (see Q3).

**Size counts, always labelled with as-of time and revision:** (1) CRM distinct contacts; (2) with at least one identifier (email or phone); (3) consent-eligible for customer-list personalization; (4) per bound platform: submitted, accepted, rejected, removed, and the platform's own match estimate **only if returned** (kept as a separate figure). Stale or unknown counts are labelled. Never display (3) as reach.

**Audience sync per platform** (manager, MFA; consent gate before every add; removal priority).

| Rule | Meta (phase 1) | Google Customer Match | TikTok |
|---|---|---|---|
| Minimum size | UNVERIFIED (check at build) | UNVERIFIED | 1,000 for targeting per ADS_REQUIREMENTS (B, not re-read) |
| Match keys | Email, phone, hashed | Email, phone (route: current supported route, ADS s4) | Per customer-file rules |
| Warn when below minimum | Yes, from a per-platform setting, not hard-coded | Same | Same |
| Consent gate | Customer-list personalization = granted, else excluded; newsletter grant never enough | Also Google `ad_user_data` / `ad_personalization` | Same product rule |
| Removal | Departed, merged, withdrawn contacts removed first; ledger records each | Same | Same |
| Status | Pending, processing, accepted, rejected, paused | Same | Async 30-60 min (ADS, B) |

**Access from Contacts:** filter by segment; segment chips on the record; bulk "Add to segment" (static) and "Save as segment"; Segments screen shows members as a Contacts-style list.

## 4. Journey and tracking

**Timeline events.** Every event: id, name, occurred_at (UTC, shown in browser time zone), received_at, actor or system, source, record ids, consent version.

| Kind | Events | Shown how |
|---|---|---|
| **System** | ad_click touch recorded; page_view (consented); form_submitted; lead_created (incl. Lead Ads, import); lead_assigned (auto); consent_changed; stage_changed (automation); duplicate flagged / merged; conversion event queued, sent, accepted, rejected (reason code); audience added / removed; payment_received; refund_issued; appointment_booked (booking system) | Collapsed by default; chip "System" |
| **Human** | note; call, WhatsApp, email logged with outcome; task created/completed; meeting; owner change; manual stage change; qualified marked; deal won/lost marked with reason; consent recorded (verbal/form) with evidence; edit of a field | Chip "People"; always visible |

**Source fields (stored on each touch; contact shows first and latest):** `first_touch` and `latest_touch` (channel, platform, utm_source/medium/campaign/content/term, campaign id/name, ad set id/name, ad id/name), `gclid`, `fbclid`, `ttclid` (opaque), `form_id`, `submission_id`, `external_lead_id` (Meta leadgen_id, Google/TikTok lead id), landing path, sanitized referrer, session id, touched_at. Rule: click IDs never hashed or reconstructed. **ID macros:** ad URLs should carry platform id macros in UTM parameters (campaign/ad set/ad ids, not names) so a CRM lead joins to the pulled ad row; names are a fallback only. Macro syntax per platform is UNVERIFIED. Sources not observed show "Unknown/direct", not blank.

**Lifecycle derivation** (separate from deal stages and lead status; evidence-based; highest stage reached is kept with a time, current value can only move by explicit rules):

| Stage | Enters when | Evidence | Can leave when |
|---|---|---|---|
| Visitor (anonymous) | Consented session | page_view; not a contact until linked by form | Becomes Lead on form/lead creation |
| Lead | Valid lead created (phone or email) | lead_created | Qualified, or Lost |
| Qualified | Lead status qualified by a permitted user | lead_qualified + rule version | Opportunity or Lost |
| Opportunity | Deal created and open | deal_created | Customer or Lost |
| Customer | Verified deal_won (Commerce: payment_received) | deal_won / payment | Repeat |
| Repeat customer | Second won deal or second paid order | Count >= 2 | Stays |
| Lost (branch) | Lead closed-lost or all deals lost | Reason code | Reopen appends history; no deletion |

Store `lifecycle_current` plus `reached_at` for every stage (needed for the cohort funnel).

## 5. Reports rebuild (R05)

### 5.1 Principles
1. Every report answers one question, names its time basis (cohort or event), and shows the attribution note when it uses ad credit.
2. CRM numbers and platform numbers sit in separate columns, never one blended number.
3. One filter bar, one date control, comparison on by default.
4. Every chart has a data table of the same payload and a drill-down to the records behind it.
5. Report home: Insights > Reports for CRM reports; Marketing > Ads insights for ad reports; "Revenue by campaign" appears in both from the same query.

### 5.2 Default catalogue

| ID | Question | Report | Chart | Dimensions / measures | Filters | Drill-down | Home |
|---|---|---|---|---|---|---|---|
| RP1 | Where do leads drop out? | Lead funnel (cohort) | Horizontal funnel bars | Leads, attempted, reached, qualified, deals, won; counts and step rates | Range, source, campaign, owner, segment | Step opens lead list at that step | Reports |
| RP2 | Which channels send leads? | Leads by source over time | Stacked columns (week/month) | Channel x period; leads; share | Range, campaign, owner | Column opens Leads filtered | Reports |
| RP3 | Do we reply fast enough? | Speed-to-lead | Histogram + median line | Minutes to first attempt; share inside SLA; by owner, source | Range, owner, source | Breaches open lead list | Reports |
| RP4 | Which campaigns send *qualified* leads? | Lead quality by campaign | Sorted bar + table | Campaign; leads, qualified rate, cost per qualified | Range, platform, campaign | Campaign opens ad set, ad, then leads | Ads insights |
| **RP5** | **Which campaign and ad made money?** | **Revenue by campaign (shared)** | Table + bar | Campaign > ad set > ad; spend, CRM leads, qualified, won, won revenue, paid revenue (Commerce), CRM-ROAS, cost per won; "unmatched spend" and "unattributed revenue" rows | Range, platform, currency, touch model (first / latest), pipeline | Row opens deals, then contact journeys | Both |
| RP6 | Is cost per result improving? | Cost trend | Lines (CPL, cost/qualified, cost/won) | Week; same currency only | Range, platform, campaign | Point opens campaign table | Ads insights |
| RP7 | Does platform lead count match the CRM? | Platform vs CRM leads | Paired bars + gap column | Campaign; platform leads, CRM leads, gap | Range, platform | Gap opens unmatched leads | Ads insights |
| RP8 | Where is the money and what is stuck? | Pipeline health | Stacked bars by stage | Stage; count, value per currency, stale count | Pipeline, owner | Stage opens deals | Reports |
| RP9 | Why do we lose and who wins? | Win / loss | Bar by reason + win-rate table | Loss reason; win rate by source, owner | Range, pipeline | Bar opens deals | Reports |
| RP10 | How long does a sale take? | Sales cycle | Distribution + median | Days lead to qualified to won; by source | Range (cohort) | Bucket opens deals | Reports |
| RP11 | Do first and last touch tell different stories? | Touch comparison | Paired bars | Channel; first-touch credit vs latest-touch credit, leads and won | Range | Channel opens journeys | Reports |
| RP12 | Is the team keeping up? | Team activity | Table + bars | Owner; attempts, tasks done, overdue, leads untouched | Range, owner | Owner opens tasks | Reports |
| RP13 | Are segments working and syncing? | Segment performance | Table + trend | Segment; size, eligible, sync status, lead-to-won of members | Range, segment | Segment opens members | Reports |
| RP14 | Can we trust the data? | Data quality | Meter-style rows | % unknown source, % missing click ID, leads missing contact, duplicates pending, consent unknown, rejected conversion events | Range | Row opens the offending records | Reports |
| RP15 | Are conversions reaching the platforms? | Delivery health | Stacked bars per platform | Sent, accepted, rejected, lag, reason codes | Range, platform | Reason opens ledger | Ads insights |
| RP16 | Who comes back? (Commerce) | Repeat customers | Line + table | Cohort month; repeat rate, order value | Range, segment | Cohort opens customers | Reports (module) |

### 5.3 Two dashboards

| | Agency roll-up | Client dashboard |
|---|---|---|
| Audience | AG staff with "all clients" or "selected clients" scope | CL users and AG inside one workspace |
| Top | 7 headline KPIs (1.2) as a row per client; attention list | 7 headline KPIs (1.2) |
| Body | Client table: spend, leads, cost per qualified, won revenue, CRM-ROAS, health flags; trend per client on click | RP1, RP2, RP8, RP5 summary, C4 tasks, C5 activity |
| Privacy | Aggregates only; no contact-level rows; clients never see other clients | Own workspace only |
| Status | DEV-CONFIRM (cross-tenant read) | EXISTS base, BACKEND additions |

### 5.4 Dates and comparison

| Item | Default |
|---|---|
| Range | Last 30 days (KPIs); last 6 months for trends; presets: today, 7 days, 30 days, this month, last month, this quarter, custom |
| Comparison | Previous period of the same length (on); optional same period last year; delta shows value and percent; zero base shows "no baseline" |
| Week start | Saturday (server-side bucketing exists as D3) |
| Time zone | Browser zone for display; UTC storage; platform data labelled with account time zone; `as_of` shown |
| Maturity | Cohort rates for the last N days marked "still maturing" (N = median days to qualified, once known) |
| Trimming | Leading empty periods removed (R04) |

### 5.5 Attribution text that must appear in the UI

Short note on every ad or revenue chart, with "Learn more" showing the full text:

- **Short:** "Ad credit here follows the last and first click we recorded, within 30 days. It shows which ads were involved, not which ads caused the sale."
- **Platform columns:** "Numbers marked Meta, Google or TikTok are what each platform reports with its own rules. They can claim the same lead, so never add them together."
- **CRM columns:** "CRM numbers count what your team recorded. A lead without a recorded click or form shows as Unknown or Direct."
- **Time:** "Spend is counted on the day the ad ran. Leads and sales are counted on the day they happened. Recent sales may still appear later for earlier ads."
- **Gaps:** "People who decline tracking, switch devices or arrive through WhatsApp or calls may not be linked to an ad. Totals here are therefore a floor, not exact."
- **No lift claim:** "This report does not prove the ads increased sales. That needs a controlled test."

Translated AR/EN copy is for CREATIVE and UX copy.

## 6. Proposed additions to ADS_REQUIREMENTS (not edited there)

### 6a. Spend and performance pull

| Item | Meta | Google | TikTok |
|---|---|---|---|
| Grain | Daily, ad level (campaign, ad set, ad, plus ids and names); breakdowns on demand | Daily, ad level via `segments.date` | Daily, ad level (UNVERIFIED) |
| Measures | spend, impressions, clicks, reach, leads and other actions, conversions with attribution window (field names UNVERIFIED this run) | cost (micros), impressions, clicks, conversions (UNVERIFIED) | spend, impressions, clicks, conversions (UNVERIFIED) |
| Verified facts | Windows available: 1d click, 7d click, 28d click, 1d engaged view, 1d view; 7d_view and 28d_view not returned since 2026-01-12; unique-count and hourly breakdowns 13 months, frequency 6 months, totals up to 37 months; async reports for large ranges (A, F1) | Core date segment needs a finite range; date lookback 37 months; `SearchStream` for large downloads, 10,000-row pages in `Search` (A, F2/F3) | Nothing verified (reporting API page not found by search) |
| Frequency (proposed) | Today and yesterday hourly or every 3 h; **nightly re-pull of the trailing 28 days** because conversions restate; full backfill once at connect (max 37 months) | Same pattern | Same pattern |
| Scopes / access | `ads_read` (search snippet, B); Advanced Access via App Review | OAuth + developer token + account access; scope UNVERIFIED | Advertiser authorization, scope UNVERIFIED |
| Store | Account currency, account time zone, pulled_at, attribution setting and window label per row | Same | Same |
| Join | Ad id from touch/Lead Ads to pulled ad row; fallback campaign name | Same, via ValueTrack id macros (UNVERIFIED) | Same |

Rules: money never converted silently; spend not matched to CRM stays visible as unmatched; a failed pull keeps old data with a stale label; pulls are read-only and tenant-scoped.

### 6b. Google and TikTok lead-form ingestion

| Platform | Known | Requirement (proposed) |
|---|---|---|
| Google | HubSpot syncs Google leads from Lead Form Extensions at campaign level (LENS B). Official route and latency **UNVERIFIED** | Ingest through the supported Google route (webhook or API retrieval, DEV to verify), dedup tenant + lead id, preserve campaign, ad group, form id, gclid if present, submission time; same quarantine, +20 phone, field-map and catch-up rules as Meta |
| TikTok | TikTok (2022 blog, A but old) lists WebHooks API and manual download for Instant Forms; scopes and endpoints **UNVERIFIED** | Same rules; manual CSV download goes through Import with TikTok source label and no consent unless the form carries it |
| Both | | Leads from ad-native forms need explicit consent text mapping, because completion never implies consent |

### 6c. Conversion-event mapping screen and ledger (Administration > Integrations)

| Part | Requirement |
|---|---|
| Mapping rows | One row per trigger: **stage or event** (lead created, qualified, deal stage X, deal won, payment received) > **event name per platform** (Meta, Google conversion action, TikTok event) > **value source** (deal value, payment amount, none) and **currency** > **platforms on/off** > **role** (primary or observation; one primary per campaign objective) > status (draft, test, active, paused) |
| Guards | Refund, import, merge and generic stage moves cannot be mapped to a positive conversion. Native Meta leads are not resent as new Lead. Deal won without payment cannot be mapped to Purchase |
| Versioning | Changes apply forward only; past deliveries keep the version they used |
| Dedup | Stable `event_id` per business action; unique tenant + destination + event_id; browser and server copies share name + id |
| Consent | Recheck immediately before send; denied, withdrawn or unknown means not sent; reason shown as "consent" without identity |
| Ledger columns | Time, event, record (name link, role-gated), destination, status (pending, accepted, rejected, cancelled), reason code, attempts, lag, event version, consent decision, original event time. Filters by status, platform, reason. No identifiers or hashes in view |
| Reconciliation | Daily count of eligible actions vs deliveries; unexplained gap raises an alert |
| Test mode | Send to a test destination before activation (platform support UNVERIFIED) |

### 6d. Meta constraints as verification targets (all UNVERIFIED)

| # | Constraint seen at a competitor | Verify |
|---|---|---|
| 1 | HubSpot sends lifecycle data to Meta only for **lead-generation campaigns** (LENS ledger 9) | Is this Meta's rule or HubSpot's? Which campaign objectives accept CRM events? |
| 2 | Meta **"Conversion Leads"** optimisation goal (LENS ledger 9) | Required event, lead id parameter, minimum lead volume, which campaigns qualify |
| 3 | Event caps per tier (HubSpot 5 / 50 / 100) | Whether Meta imposes any custom-event limit |
| 4 | Meta-native lead must not resend as new conversion | Dedup keys on lead id |
| 5 | Attribution windows after 2026-01-12 | Confirm via live response what `action_attribution_windows` returns |

## 7. Open questions

**Ahmed**
1. Agency roll-up needs cross-client reads. Is it acceptable as aggregates only (no contact rows, no audience mixing) for agency staff scoped "all" or "selected" clients?
2. Qualified: one rule for all, or per business type? Who may mark it? (ADS Q2 still open.)
3. Static segments and "Save filter as segment": agree to have both live and static, kept separate from personal saved views?
4. Speed-to-lead SLA: set per client; do you want a starting value (I did not invent one)?
5. Do clients see spend, cost per lead and CRM-ROAS, or only agency staff?
6. Revenue without Commerce: is deal value entered by hand and trusted as "won revenue"? Currency per tenant EGP only?
7. SEO: is organic-landing view enough for now?
8. Should the roll-up default currency display be per client only (my recommendation) or an approved single reporting currency with a stated rate?

**CREATIVE**
1. Design KPI strip, report card, and funnel with "maturing" and "Not connected" states.
2. Timeline chips People / System, source chips with Unknown/direct.
3. Conversion mapping table and delivery ledger, and the connection health card.
4. Segment rule builder with NOT and groups, and the count block with four figures.
5. The attribution note as a persistent small text, expandable.

**DEV**
1. Confirm what EXISTS: migrations 006/007 schema, form collect routes, merge, activity outcomes, lead assignment, dashboard contracts.
2. Cross-tenant aggregate read for roll-up without breaking isolation.
3. Time-window data model: `reached_at` per lifecycle stage, frozen touch snapshots, stage entry time for stale rule.
4. Pull-job design for 28-day restatement and per-platform account time zone.
5. Verify the UNVERIFIED items in section 0 before building M/G/T tasks.
