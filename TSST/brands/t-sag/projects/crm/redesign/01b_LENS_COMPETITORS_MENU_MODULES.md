# 01b LENS competitor study: menus, CRM mechanics, two-way ad data, modules (t-sag CRM redesign, step 1b of 4)

Status: ACCEPTED by Lead 2026-10-09 as input to SPARK (not a final deliverable). Lead live spot-check: 8/8 A-rated claims confirmed (ledger 1, 2, 7, 8, 9, 11, 15, 16). Date: 2026-10-09. Agent: LENS_AG. Skills: TSST-LENS-SK-001 (bounded questions, caps), -002 (claim grading, ledger), -003 (OBSERVED / INFERRED / UNKNOWN), -004 (business-type jobs, hypotheses only).

## 0. How to read this
- **Input:** Gemini report GEM-CRM-002 (no source list; INPUT, not truth). Every vendor claim in it is treated as UNVERIFIED unless an official page below supports it.
- **Caps used: WebFetch 18/18, WebSearch 5/5.** Of the 18 fetches: 10 OK, 3 PART (answer incomplete), 1 did not render (TikTok), 4 dead (404, guessed URLs). See the ledger (section 8).
- **Confidence:** A = official page opened and it supports the claim. B = partial, or search-level (an official page was returned by search with a summary, but I did not open it). C = Gemini-only or my inference.
- **Matrix codes:** Y = yes, P = partial / needs a plan, add-on, extension or limits, N = documented as absent, U = unverified (no evidence either way). The cell format is **Meta / Google / TikTok**.
- **Not covered by evidence:** menus (Part 1) and CRM mechanics (Part 2) were not in my fetch budget after Part 3 and 4, so those tables are mostly Gemini (C). Where an opened page contradicts Gemini, I say so.
- **Recurring weakness of the Gemini report:** it fills every cell with a confident Yes / No. Where I could test it, 4 of its claims were wrong or unsupported (section 1, finding 1). Treat the untested cells the same way.

## 1. The 10 findings that most matter

| # | Finding | Evidence | Conf. |
|---|---|---|---|
| 1 | **Gemini's ad matrix is not reliable.** It says GoHighLevel has no ad control (GHL has Marketing > Ad Manager that creates Meta lead-gen campaigns); that Zoho conversions back need Stape (Zoho's own LeadChain extension syncs Leads, Contacts and Deals to Meta Conversions API); that Odoo ingests Meta leads via Social Marketing (the Odoo page covers organic posts only); that HubSpot needs Marketing Hub Pro or Enterprise (Starter is included for audiences and Meta conversion events). It also gives HubSpot and Salesforce "Yes" on all 18 cells. | Ledger 7, 9, 15, 18; searches S2, S3 | A / B |
| 2 | **Meta is the deep channel everywhere; Google and TikTok are thin.** Meta lead ingestion, audiences and CAPI are documented for 6 of 8 vendors. Google and TikTok depth is only documented for HubSpot (and Salesforce at product level). | Ledger 1, 2, 8, 9, 10; S1 to S5 | B |
| 3 | **"Conversions back" is a fixed, narrow menu in every product I checked, not a free mapping.** HubSpot: lifecycle-stage change, form submit or page view only; HubSpot forms only; Meta lifecycle data only for lead-generation campaigns; event caps Starter 5 / Pro 50 / Enterprise 100. GHL: lead events only for Facebook lead form submit or pipeline stage change; value and currency only if the stage is literally named "Purchase". Kommo: only Lead and Purchase, only for click-to-message ads. | Ledger 9; S2, S5 | A / B |
| 4 | **Only HubSpot clearly documents a two-way audience loop** ("synchronization is bidirectional"), with a minimum of 20 contacts (about 1,000 recommended), for Facebook, Google, Microsoft, LinkedIn; TikTok is search-level. Kommo and Bitrix24 push by stage or segment, one direction. | Ledger 8; S1, S4, S5 | A / B |
| 5 | **Spend and performance pull is the weakest, least documented item.** HubSpot imports performance metrics (impressions, clicks); the opened page does not say "spend". For the other seven I found no official claim. This is a gap our "Ads insights" can fill, joined to CRM revenue. | Ledger 1 | A (HubSpot) / U (rest) |
| 6 | **Three packaging patterns, with different levers.** Hubs and editions (HubSpot; custom objects Enterprise only), config snapshots (GHL; copies pipelines, fields, workflows, sites, but not contacts, conversations or integrations), installable apps (Odoo; uninstall deletes the app's records). | Ledger 15, 16, 17 | A |
| 7 | **Ad tools sit under Marketing; connections sit in Settings.** GHL: Marketing > Ad Manager (must be activated per sub-account). Bitrix24: CRM > Contact center > Facebook Lead Ads. Kommo: Digital Pipeline > Incoming leads. HubSpot: the ad-account connection page is the Ads tool; Gemini places Integrations under the gear icon. | Ledger 7; S4, S5; Gemini C | A / B |
| 8 | **Platform side is partly verified.** Meta's page confirms the API accepts events "from ... CRM" and offline events for measurement and custom audiences; Google's page confirms hashed first-party data for enhanced conversions for leads. Neither page gave event_id dedup, gclid or processing delay, and TikTok did not render. Gemini's "24 to 48 h" Google delay is unverified. | Ledger 12, 13, 14 | A (partial) |
| 9 | **A real opening exists, as an inference:** a configurable stage-to-event mapping with a delivery ledger, consent gating, event_id dedup, multi-tenant isolation and Google/TikTok parity, with ad insights joined to deal revenue. ADS_REQUIREMENTS already plans most of it; it lacks spend pull, Google/TikTok lead-form ingestion and insights. | Sections 4.2, 4.3 | C |
| 10 | **Regional evidence is thin.** Only Zoho "Arabic (Egypt)" is confirmed (from step 1). WhatsApp claims (Kommo "official, zero markup") are Gemini-only. No vendor gives verified RTL mirroring evidence. Our RTL rules (NAV spec, R08) stay the source of truth. | 01 report s3; Gemini | A (Zoho) / C |

## 2. Menus side by side

Almost all of this table is Gemini (C). Cells marked * were supported or contradicted by an opened or searched official page.

| Vendor | Pattern | Top-level groups (Gemini unless starred) | Marketing / Ads | Segments / Lists | Forms | SEO | Reports | Integrations |
|---|---|---|---|---|---|---|---|---|
| HubSpot | Top bar | Contacts, Conversations, Marketing, Sales, Service, Automation, Reports | Marketing > Ads, Ads reporting* (ads tool and analyse-campaigns pages exist, B) | Contacts > Lists / Segments | Marketing > Forms | Marketing > SEO | Reports | Gear (settings) |
| GoHighLevel | Left sidebar | Launchpad, Dashboard, Conversations, Calendars, Contacts, Opportunities, Payments, Marketing, Automation, Sites, Reporting | **Marketing > Ad Manager*** (A, needs activation); Gemini put Marketing = Social Planner and Emails, ads reporting = Reporting | Contacts > Smart Lists | Sites > Forms | Sites | Reporting | Settings (bottom) |
| Zoho CRM | Top tabs, customisable | Home, Leads, Contacts, Accounts, Deals, Activities, Reports, Analytics, Campaigns | Zoho Marketing Plus or extension (LeadChain*) | Filters / views | Settings > Webforms | n/a | Reports, Analytics | Settings |
| Salesforce | App launcher + tabs | Per app (Sales, Marketing, Service): Leads, Accounts, Contacts, Opportunities, Reports, Dashboards | Separate products (Marketing Cloud, Data 360*) | Lists / campaigns | Separate | Separate | Tabs | Setup |
| Pipedrive | Left sidebar | Leads, Deals, Mail, Activities, Contacts, Insights | Marketplace apps (LeadsBridge*) | Filters in Contacts | Leads > Web Forms | n/a | Insights | Tools and apps |
| Kommo | Left icon rail | Leads, Chats, Calendar, Lists, Mail, Stats, Settings | **Inside Digital Pipeline*** (lead forms, ad triggers, B) | Lists | Digital Pipeline | n/a | Stats | Settings > Integrations |
| Bitrix24 | Left, customisable | CRM, Tasks and Projects, Communications, Drive, Mail, Sites and Stores, CRM Marketing | **CRM Marketing / Contact center*** (B) | Marketing segments* (B) | CRM > Add-ons > CRM forms* (B) | Sites | CRM analytics | Settings, Contact center |
| Odoo | App grid + app bar | Per installed app (CRM, Sales, Website, Email Marketing, Social Marketing) | Social Marketing app: organic posts*, not ads (A) | Mailing lists (Email Marketing) | Website app | Website app | CRM > Reporting | Settings app |

**How menus change (Gemini unless starred):**

| Lever | Vendors | Conf. |
|---|---|---|
| By plan or subscription | HubSpot (Hub tier hides items), Pipedrive (Insights, automations by tier), Bitrix24 (ad tools on higher plans), Kommo (Google Ads trigger on Pro* , B) | C / B |
| By module or installed app | Odoo (grid changes by installed app*, A), Zoho (custom modules, tab hide / rename), GHL (SaaS Mode toggles hide items per client) | A (Odoo) / C |
| By role or permission | All eight; HubSpot "Ads publishing" permission is required to connect ad accounts* | A (HubSpot) / C |
| By tenant | GHL (agency to sub-account switch), HubSpot (account switch), Odoo (multi-company); others need separate logins. Detail already in step 1 report s3 | A (step 1) |

**Reading for us (INFERENCE):** the leaders put "Marketing" as its own group and keep ad connections in settings. D-01 matches that. The one place we differ is that ads need a tenant-level permission for connections, which is a separate gate from viewing ads.

## 3. How the CRM works

Gemini-based (C), with the few official corrections noted. Use only for shape, not for fine facts.

| Vendor | Core objects | Lifecycle / status | Pipelines | Duplicates | Custom objects |
|---|---|---|---|---|---|
| HubSpot | Contacts, Companies, Deals, Tickets | Lifecycle stage on contacts (Subscriber to Customer) | Deal pipelines | Auto-detect by email / domain | **Enterprise only (A)**; limits vary by subscription |
| GoHighLevel | Contacts, Opportunities, Companies | Stage in pipeline (Open, Won, Lost, Abandoned) | Opportunity pipelines | Exact email / phone settings | Gemini: all plans, 10 per location (UNVERIFIED) |
| Zoho CRM | Leads, Contacts, Accounts, Deals | Lead "Convert" splits into contact, account, deal | Deal pipelines, Blueprint | Block / merge | Custom modules (Enterprise; unverified) |
| Salesforce | Leads, Contacts, Accounts, Opportunities | Lead conversion | Sales processes | Matching and duplicate rules | Yes, edition-limited |
| Pipedrive | People, Organizations, Deals | Leads inbox then Deals (no conversion wall) | Kanban pipelines | Flag and merge | No |
| Kommo | Leads (deal) tied to Contact and Company; Chats woven into the lead card | Digital Pipeline stages | Digital Pipeline | Basic (phone match in chat) | No |
| Bitrix24 | Leads, Deals, Contacts, Companies; Simple vs Classic CRM | Lead conversion (Classic) | Deal pipelines | Built-in scan | Smart Process Automation |
| Odoo | Leads, Opportunities, Contacts | Lead to Opportunity | Pipeline | Manual merge tools | Studio |

**Inference for us:** our model (lead, contact, deal, pipeline stages, merge) is the HubSpot / Zoho shape. Two ideas matter for ads: (1) HubSpot lifecycle stage as a property separate from deal stage (matches ADS_REQUIREMENTS: lifecycle is derived and separate from configurable stages); (2) Kommo's chat as a first-class part of the lead card (relevant when WhatsApp lands).

## 4. Two-way ad data

### 4.1 Matrix (Meta / Google / TikTok)

| Vendor | a Lead ingestion | b Audience sync | c Conversions back | d Spend pull | e Attribution to deals | f Ad control from CRM | Conf. | Ledger |
|---|---|---|---|---|---|---|---|---|
| HubSpot | Y / Y / P (Google only from Lead Form Extensions; TikTok conflicts, see note) | Y / Y / Y (TikTok B) | Y / Y / Y (Meta A, Google and TikTok B) | P / P / P (impressions, clicks; spend not stated) | Y (auto-tracking UTM links contacts and deals to campaigns) | U / U / U | A (Meta, audiences, leads); B (Google, TikTok conversions) | 1, 2, 8, 9; S1 |
| GoHighLevel | Y / U / P (TikTok via Labs, 2023 article) | U / U / U | P / U / U (Meta CAPI action in workflows) | U / U / U | U | **Y** / U / U (Ad Manager creates Meta lead-gen campaigns) | A (Meta ad control), B (rest) | 7; S2 |
| Zoho CRM | Y / U / Y (via LeadChain extension, free) | U / U / U | Y / U / U (LeadChain: CRM modules to Meta CAPI, with filter) | U | U | U | B | S3 |
| Salesforce | U (AppExchange, Gemini only) | Y / Y / Y (Data 360 and Marketing Cloud, "push audiences ... Meta, Google"; TikTok named) | P: CAPI to "paid platforms"; per-platform U | U | Y at product level (Marketing Intelligence multi-touch) | U | A (page opened), but it is a marketing page for Data 360, not core Sales Cloud | 10 |
| Pipedrive | P (LeadsBridge, third party) | P (LeadsBridge: "audience sync") | P (LeadsBridge: "offline conversions sync", headline only) | U | U | U | A that it is a third-party paid app; capability detail C | 18 |
| Kommo | Y / U / Y (Meta in Digital Pipeline; TikTok Ads Manager lead capture listed) | P / P / U (stage trigger adds leads to Facebook custom audience; Google trigger, Pro plan) | P / U / U (Meta CAPI: Lead and Purchase only, click-to-message only) | U | U | P / P / U (pipeline triggers) | B | S5 |
| Bitrix24 | Y / U / U (Facebook Lead Ads; new CRM forms can no longer be linked to Facebook) | Y / Y / U (segment to Facebook custom audience and Google customer list; lookalike via Facebook) | P / U / U ("Send customer actions to Facebook" article exists; content not opened) | U | U | U | B | S4 |
| Odoo | U (Social Marketing page = organic posts, not ads) | U | U | U | U | U | A (negative on that page only) | 11 |

Notes: (1) HubSpot TikTok lead sync: the connect page says lead syncing for Meta and LinkedIn; the sync-leads page lists TikTok requirements; the two disagree, so TikTok is P. (2) A row full of U is not "No"; it means my budget did not reach it. Gemini's No / Partial cells for these were not confirmed or refuted.

### 4.2 What leaders do (table stakes) and where nobody is strong (our opening)

**Table stakes (seen in at least two of HubSpot, GHL, Zoho, Kommo, Bitrix24, Salesforce):**
1. Meta lead-form leads arrive in the CRM with field mapping and a source label (A / B).
2. Click or form ID kept on the contact so a later event can match: gclid (HubSpot Google), fbclid and Facebook Lead ID (GHL) (A / B).
3. A CRM event goes to Meta CAPI on a stage change or form submit, with a consent property in HubSpot (A / B).
4. CRM lists or segments push to Meta custom audiences, with automatic removal on delete (HubSpot A; Bitrix B).
5. Ads connected under a permission gate; connection done once per account.

**Where nobody looks strong (INFERENCE from the gaps above, C):**
- Free stage-to-event mapping: one tenant picks which stage sends which event, with value and currency from the deal, not a fixed menu.
- A visible delivery ledger (sent, accepted, rejected, reason) the manager can read. HubSpot says its support cannot review sync logs unless an error occurred (A).
- Google and TikTok at the same depth as Meta, in one place.
- Spend, impressions and clicks per ad joined to deal revenue, so the page answers "which ad made money" (not just which ad made leads).
- Multi-tenant agency isolation of tokens, audiences and event datasets (only GHL and HubSpot have an agency model at all; step 1 report).
- Ad control from the CRM: GHL does Meta lead-gen campaign creation; the rest unverified. Not our MVP.

### 4.3 Mapping to `ADS_REQUIREMENTS.md`

| Competitor capability | In our plan? | Where / note |
|---|---|---|
| a Meta lead ingestion | **Covered** | s3 Lead Ads webhook, dedup tenant + leadgen_id, replay |
| a Google / TikTok lead-form ingestion | **Missing** | s4 deltas cover only Customer Match, offline / enhanced conversions, Events API, audiences. HubSpot proves Google lead forms (Lead Form Extensions, campaign-level, auto-tagging) and TikTok exist |
| b Audience sync with consent and removal | **Covered** | s1, s3 Custom Audiences, s4 Google Customer Match, TikTok customer file (20 / 1,000 minimum is a competitor number; ours is TikTok 1,000) |
| b Audience change flowing back from the ad network to the CRM | **Missing / unclear** | HubSpot says "bidirectional"; we only push |
| c Conversions back with dedup and original time | **Covered, stronger than competitors** | s2 mapping table, s3 CAPI and dedup, s4 Google / TikTok |
| c Per-stage configurable mapping UI | **Partly** | s2 says "never auto-send every stage"; no screen defined for the manager to choose |
| c Platform constraints: HubSpot Meta lifecycle only for lead-gen campaigns; Meta "Conversion Leads" optimisation goal | **Missing** | Add to Meta delta as verification targets |
| d Spend and performance pull | **Missing** | s3 mentions `ads_read` "only if reporting needs it"; s5 puts advanced reporting later. D-01 now needs Ads insights, so this needs a requirement |
| e First / last touch, click IDs, UTM | **Covered** | s2 |
| e Revenue attribution to deals (HubSpot: contacts and deals to campaigns) | **Partly** | CRM journey views yes; revenue per ad needs d |
| f Ad control (create / pause) | **Deferred** | s5 later; GHL has Meta lead-gen creation; not needed for the core |
| Consent and PDPL gates | **Covered** | s2; competitors: HubSpot consent property only |

## 5. Modules by business type

### 5.1 Packaging patterns

| Pattern | Vendor | What switches on or off | Who switches it per client | Conf. |
|---|---|---|---|---|
| Hubs and editions | HubSpot | Hub tiers (Starter / Pro / Enterprise); custom objects Enterprise only (A); ad conversion event caps 5 / 50 / 100 by tier (A) | Account owner buys; agency partners per portal | A |
| Snapshots | GoHighLevel | Reusable template from a sub-account: pipelines, fields, workflows, calendars, sites, reporting; excludes contacts, conversations, integrations (A). Load into existing or new sub-account, with conflict review (A) | Agency | A |
| SaaS Mode toggles | GoHighLevel | Hide or show features per sub-account (Gemini) | Agency | C; snapshot page does not mention it |
| Apps | Odoo | Install / uninstall per database; uninstall deletes the app's records; test on a duplicate first (A) | Database administrator | A |
| Editions, profiles, vertical CRMs | Zoho | Edition + profile permissions; "Vertical CRM" builds (Gemini) | Org admin | C |
| Clouds, permission sets | Salesforce | Vertical clouds such as Health Cloud (Gemini) | Admin | C |
| Tiers only | Pipedrive, Kommo | No vertical packages | n/a | C |
| Menu customisation | Bitrix24 | Show / hide tools per plan and role | Admin | C |

### 5.2 Business type to modules to vendors (hypotheses; C unless starred)

| Business type | Common modules or objects | Vendors named by Gemini | Our status |
|---|---|---|---|
| Real estate | Property object, listing pipeline, viewings, WhatsApp follow-up | GHL (snapshots + custom objects), Zoho | Not planned; needs custom objects |
| E-commerce | Orders, products, abandoned cart, repeat-buyer segments, payment event | HubSpot, Salesforce, Odoo | **Commerce** (Ahmed) and ADS_REQUIREMENTS examples |
| Restaurants | POS, KDS, reservations, loyalty | Odoo, GHL | **Later** (Ahmed: POS / KDS) |
| Clinics | Patients, appointments, compliance; ad audiences must exclude clinical data | Salesforce Health Cloud, Odoo | ADS_REQUIREMENTS excludes clinical data from audiences |
| Education | Students, courses, intake pipeline | not covered by Gemini | UNKNOWN |
| Services | Quotes, contracts, projects | HubSpot, Bitrix24, Pipedrive | Core CRM covers most |

### 5.3 INFERENCE for our backend-module model
1. **Three layers.** Core (always on: CRM, Marketing, ad connections); Module (a tenant entitlement: Commerce, later Restaurants); Preset (a business-type bundle that switches on modules and loads starter pipelines, properties, forms, segment templates, like a GHL snapshot, but without contacts or integrations as in the A-rated snapshot page).
2. **Entitlement is per tenant and set by the agency, not by the client.** Access to a screen needs both the tenant entitlement and the user capability (matches the NAV spec "hide denied leaves").
3. **Switch off is "hide and keep data", not "uninstall and delete"** (Odoo's uninstall deletes records, A). Deletion would need a separate explicit action.
4. **Every module must plug into three things:** the ad event list (Commerce adds Purchase and refund; Restaurants adds orders), the segment property list, and the menu. This keeps "ads steered by CRM data" true across modules.
5. **Custom objects** (real estate property) are the big modelling gap; HubSpot gates them to Enterprise (A). We can offer them per module rather than as a general feature.

## 6. Regional fit (short)

| Topic | Verified | Gemini only / unverified |
|---|---|---|
| Arabic UI | Zoho: "Arabic (Egypt)" fully supported (A, step 1) | Bitrix24 and Odoo "best RTL"; GHL "LTR backend" (C) |
| RTL mirroring | No vendor evidence | Design from our own rules (logical start / end, bidi-safe names) |
| WhatsApp | none opened | Kommo "official Meta partner, zero markup, native Cloud API"; GHL markup per message (C). Gemini does not discuss unofficial WhatsApp (QR / web-session) tools at all |
| Local presence | none | Zoho, Bitrix24, Odoo partner networks in Egypt (C) |

For us: WhatsApp should be treated as an official-API-only channel (consistent with the rest of the Meta stack and with consent rules); unofficial routes risk the number and the ad account. This is a recommendation, C; Gemini gave no evidence either way.

## 7. Proposed menu for our CRM (INFERENCE, for Ahmed's decision)

### 7.1 Tree (AR / EN)

| Group | Children (AR / EN) | Route (proposed) | Gate |
|---|---|---|---|
| 1 نظرة عامة / Overview | لوحة المعلومات / Dashboard | `/dashboard` | Core |
| 2 إدارة العملاء / CRM | العملاء المحتملون / Leads; جهات الاتصال / Contacts; الصفقات / Deals (child: مسار المبيعات / Pipeline); المهام / Tasks; استيراد البيانات / Import | existing | Core |
| 3 **التسويق / Marketing** | الإعلانات / Ads; تحليلات الإعلانات / Ads insights; الشرائح / Segments; النماذج / Forms; تحسين محركات البحث / SEO | `/marketing/ads`, `/marketing/insights`, `/marketing/segments`, `/marketing/forms`, `/marketing/seo` | Core; Ads / Insights need ad connection; SEO and Forms may be "coming soon" |
| 4 Module groups (appear only when enabled) | التجارة / Commerce (Orders, Products, Customers value); later المطاعم / Restaurants (POS, KDS) | per module | Tenant entitlement |
| 5 الرؤى / Insights | التقارير / Reports; رحلات العملاء والتتبع / Journeys and tracking | `/reporting`, `/journeys` | Core |
| 6 الإدارة / Administration | التكاملات / Integrations (ad accounts, tokens, health); المستخدمون والأدوار / Users and roles; الإعدادات / Settings (Properties, Security); for agency staff only: الوحدات والقوالب / Modules and presets | `/settings/...` | Manager; modules screen agency only |

### 7.2 Recommendation on the open item in DECISIONS.md

| Question | Recommendation | Reason (one line) | Conf. |
|---|---|---|---|
| Where do general Reports sit? | Keep **Insights > Reports** as the home of CRM reports (pipeline, leads, tasks, revenue). Put ad-specific analysis in **Marketing > Ads insights**. Add one shared report, "Revenue by campaign", reachable from both, built from the same data. | Leaders keep Reports as a separate top level (HubSpot, Zoho, Pipedrive Insights); ad insights are a marketing task and D-01 already names them under Marketing; two homes avoid mixing ad numbers with CRM numbers. | C |
| Where do ad-account connections sit? | **Administration > Integrations** is the single home (connect, tokens, health, reconnect). Show a status chip and a "Connect" empty state inside Marketing > Ads that links there. | Every vendor opened keeps connections in settings or Contact center, and our connection needs manager + MFA + `integration.manage`, which differs from who may view ads. Viewing ads is not a reason to see tokens. | B |

### 7.3 Module-gated items
- The module group is **absent** when the tenant has no entitlement (not greyed). Items the user lacks capability for are hidden, as in the NAV spec.
- **Coming soon** stays a non-navigating badge (existing rule).
- Marketing > Ads and Ads insights show a connect empty state until an ad account is connected; Forms and SEO follow the module state.
- Agency staff see a per-client "Modules and presets" page (like GHL's snapshot step, A for snapshots) to switch modules and apply a business-type preset.
- Activity records for a disabled module remain stored; reports exclude them or label them.

### 7.4 Role visibility (proposed)

| Item | Manager | Rep | Reader | Agency staff vs client |
|---|---|---|---|---|
| Dashboard, Leads, Contacts, Deals, Tasks | Yes | Yes (own scope) | Read | Same, scoped to tenant |
| Import | Yes (MFA) | No | No | Per NAV spec |
| Marketing > Segments | Edit | View, use in Contacts | View | Same |
| Marketing > Ads | Edit (campaign / sync controls) | No | No | Agency edits; client manager views |
| Marketing > Ads insights | Yes | View | View | Client reader sees own tenant only |
| Marketing > Forms, SEO | Edit | View | No | Agency edits |
| Insights > Reports, Journeys | Yes | Own scope | Read | Same |
| Administration > Integrations | Yes (MFA) | No | No | Agency-assisted; no token display for clients |
| Modules and presets | No | No | No | Agency only |

## 8. Evidence ledger

Status: OK = opened and readable; PART = opened, answer incomplete; NR = did not render; dead = 404. S = search result (official URL returned by search, summary seen, page not opened) = B.

| # | URL | Status | Claim supported / note |
|---|---|---|---|
| 1 | https://knowledge.hubspot.com/ads/connect-and-set-up-your-ad-accounts-in-hubspot | OK | Connect Meta, Google, LinkedIn, Microsoft, TikTok; lead syncing for Meta and LinkedIn; impressions and clicks shared; auto-tracking UTM attribution; all plans; "Ads publishing" permission |
| 2 | https://knowledge.hubspot.com/ads/sync-leads-from-your-facebook-page-or-linkedin-ads-account-to-hubspot | OK | Meta leads: up to 2 h delay, 90-day backfill, custom field limits; Google lead sync from Lead Form Extensions only; TikTok admin requirement |
| 3 | https://knowledge.hubspot.com/ads/create-and-manage-ads-audiences | dead (404) | guessed URL |
| 4 | https://knowledge.hubspot.com/ads/send-conversion-events-from-hubspot-to-ad-networks | dead (404) | guessed URL |
| 5 | https://help.gohighlevel.com/support/solutions/articles/48001215040-facebook-lead-ads-integration | dead (404) | guessed URL |
| 6 | https://www.zoho.com/crm/integrations/ads/ | dead (404) | guessed URL |
| 7 | https://help.gohighlevel.com/support/solutions/articles/155000005064-getting-started-setup-facebook-and-instagram-lead-ads | OK | Ad Manager under Marketing > Ad Manager, must be activated; creates Meta lead-gen campaigns; Meta only on that page |
| 8 | https://knowledge.hubspot.com/ads/create-ads-audiences-in-hubspot | OK | Audiences for Facebook, Google, Microsoft, LinkedIn; bidirectional; contact segment audiences need Marketing Hub Starter+, 20 contacts minimum |
| 9 | https://knowledge.hubspot.com/ads/create-and-sync-ad-conversion-events-with-your-meta-ads-accounts-using-metas-conversion-api | OK | Meta CAPI events from lifecycle / form / page view; Starter 5, Pro 50, Enterprise 100; HubSpot forms only; lead-gen campaigns only; Conversion Leads goal |
| 10 | https://www.salesforce.com/marketing/data-advertising/ | OK | Data 360 pushes audiences to Meta, Google; TikTok named; CAPI; multi-touch via Marketing Intelligence. Not Sales Cloud core |
| 11 | https://www.odoo.com/documentation/18.0/applications/marketing/social_marketing.html | OK | Social Marketing = organic management for Facebook, Instagram, LinkedIn, Twitter, YouTube; no ads, lead ads, audiences or conversions on page |
| 12 | https://developers.facebook.com/docs/marketing-api/conversions-api/ | PART | CRM as event source; offline events for measurement and custom audiences. No event_id, action_source or lead events on page |
| 13 | https://support.google.com/google-ads/answer/9888656 | PART | Hashed first-party data (SHA256, E.164) for enhanced conversions for leads. No gclid, CRM or delay on page |
| 14 | https://business-api.tiktok.com/portal/docs?id=1771101027431425 | NR | Title only; TikTok Events API UNVERIFIED |
| 15 | https://www.odoo.com/documentation/18.0/applications/general/apps_modules.html | OK | Install / uninstall per database; uninstall deletes records; admin responsible |
| 16 | https://help.gohighlevel.com/support/solutions/articles/48000982511-what-is-a-snapshot | OK | Snapshot contents and exclusions; load to existing or new sub-account. SaaS Mode not on page |
| 17 | https://knowledge.hubspot.com/object-settings/create-custom-objects | OK | Custom objects Enterprise only; limits vary |
| 18 | https://www.pipedrive.com/en/marketplace/app/leads-bridge/735a83a4b7845864 | PART | LeadsBridge is a third-party paid iPaaS; headlines "audience sync", "offline conversions sync"; no detail |
| S1 | HubSpot search (audiences, conversion events) | S, B | Google Enhanced Conversions needs GCLID or hashed contact data; TikTok conversion sync and audience; pages: .../ads/create-and-sync-ad-conversion-events-with-your-google-ads-account, .../with-your-tiktok-account, .../connect-your-tiktok-ad-account-to-hubspot |
| S2 | GHL search | S, B | Meta CAPI action (Integrations or Ad Manager); lead events only on FB lead form or stage change; value only if stage "Purchase"; TikTok lead ads via Labs (Apr 2023); URLs: help.gohighlevel.com/support/solutions/articles/155000003691, 48001223558 |
| S3 | Zoho search | S, B | LeadChain: Facebook lead ads, TikTok lead gen, Facebook CAPI from Leads / Contacts / Deals; no Google official source found; URLs: help.zoho.com/portal/en/kb/zoho-lead-chain/... |
| S4 | Bitrix24 search | S, B | Advertising audiences (Google customer list, Facebook custom audiences), lookalike via Facebook, Facebook Lead Ads, new CRM forms cannot be linked to Facebook, "Send customer actions to Facebook"; URLs: helpdesk.bitrix24.com/open/24488078/, 20838876, 24208002 |
| S5 | Kommo search | S, B | Facebook lead ads in Digital Pipeline, Facebook Ads trigger audiences, CAPI Lead / Purchase for click-to-message only, Google Ads trigger Pro plan, TikTok integrations; URLs: kommo.com/support/lead-generation/facebook-form/, facebook-ads/, messenger-apps/capi-overview/, integrations/google-ads/ |

Gemini inline URLs (anytrack, coupler, stape, leadjourney, improvado, signalsight, attribi, ideas.gohighlevel.com) were **not opened**: third-party or vendor blogs, outside the budget order.

## 9. Open gaps
1. **Menus (Part 1)** not verified for any vendor; no official navigation page opened. Cheapest next step: HubSpot and GHL navigation pages (2 fetches), plus one screenshot-level check from a trial account.
2. **TikTok Events API / audiences** official page did not render; Google offline import (gclid, processing time) not confirmed; Meta dedup (event_id) not confirmed on the page I opened. ADS_REQUIREMENTS still lists Meta, Google and TikTok pages as verification targets.
3. **Spend pull** (item d) is U for seven vendors; HubSpot's page says "performance metrics", not "spend".
4. **Salesforce, Pipedrive, Odoo, Kommo (Google/TikTok), Zoho (Google)** native ad capabilities U; Salesforce lead ingestion C.
5. **GHL SaaS Mode feature toggles** and **custom objects on all plans** (Gemini) not confirmed.
6. **Education vertical** and **WhatsApp official vs unofficial** have no evidence; the WhatsApp recommendation in section 6 is an inference.
7. **Bitrix24 "Send customer actions to Facebook"** page content not opened.
8. Role table in 7.4 and the route names in 7.1 are proposals, not sourced.
