# HubSpot CRM — Competitor Intelligence for T.SAG CRM MVP

Agent: LENS_AG (`TSST/LENS/AGENT.md`) · Brand: T.SAG only · Date/access: 2026-10-05 · Status: DRAFT for TSST Lead
Skills applied: **TSST-LENS-SK-001** (plan §1), **SK-002** (grades + ledger §2, §8), **SK-003** (OBSERVED/INFERRED/UNKNOWN
labels §2–§5), **SK-004** (ICP limits only, §6). Rules: `TSST/core/rules.md`, `TSST/brands/t-sag/rules.md`.
We state **no T.SAG prices, claims or customer facts**. All differentiation items are hypotheses.
Method: public web only (vendor pricing pages, HubSpot Knowledge Base, community pages, third-party reviews). No sign-up, trial, spend
or contact. Text is summarised, not quoted.

## 1. Research plan (SK-001)
- **Decision:** which HubSpot-parity capabilities T.SAG CRM must have for a credible MVP, and which angles to test for positioning.
  Owner: TSST Lead → user. Alternatives: (a) parity-first, (b) differentiation-first, (c) narrow ICP-first.
- **RQ1** What does HubSpot offer per tier (Free/Starter/Pro/Ent), and what sits behind a paywall? **RQ2** Which UX patterns
  are worth copying? **RQ3** Where is our MVP Have/Partial/Missing/M3? **RQ4** Where might HubSpot be weak for MENA/Arabic buyers?
- **Scope:** HubSpot Smart CRM + Sales Hub; Marketing/Service only where they gate CRM features (WhatsApp, attribution).
  USD list prices as served to our fetch location on 2026-10-05; local/regional prices may differ. Excludes Salesforce, Zoho,
  local MENA CRMs (next step: 5-competitor set per SK-003).
- **Our product evidence:** `MVP_UI_IMPLEMENTATION_MAP.md` §2/§7, `M1_CONTRACTS.md`, `M2_CONTRACTS.md` (read 2026-10-05).
- **Stop condition:** each RQ answered with ≥1 grade-A/B source or marked UNKNOWN.

## 2. Evidence grades (SK-002) and labels (SK-003)
Grade is per claim–source pair. **A** = official HubSpot page, current, read directly. **B** = official, but read through a search
snippet only, or older vendor PR. **C** = third-party review/aggregator/blog (possible affiliate or competitor bias).
**D** = anecdote, not corroborated. Labels: **OBS** = observed on the source; **INF** = our inference; **UNK** = not established.
Fetches were summarised by a tool model, so re-check numbers on the live page before any external use.

## 3. HubSpot capability profile (RQ1)
| Area | What HubSpot offers (summary) | Tier where it starts | Label · Src · Grade |
|---|---|---|---|
| Core objects | Contacts, companies, deals, tickets, plus a separate Leads object linked to contacts/companies, with lead stages and a prospecting workspace | Leads object: Sales Pro/Ent | OBS · S11 · A |
| Free CRM limits | 2 users; 1,000 contacts; 1M standard records; HubSpot branding | Free | OBS · S3 · A |
| Record page | Three areas: left sidebar (properties), middle (Overview + Activities timeline tabs, cards), right sidebar (association cards you can add/edit/remove). Up to 50 cards; layout editing needs a permission | All; customisation needs a permission | OBS · S9 · B |
| Index pages / views | Table and board views; saved view tabs (private or shared); advanced filters with custom logic; pipeline filter; other view types (calendar, gantt, report) | All (limits vary) | OBS · S10 · B |
| Pipelines / board | Board cards grouped by stage with inline property edits; pipelines: Free 15, Starter 100, Pro/Ent 350 | Free+ | OBS · S1,S10 · A/B |
| Sequences | Automated email, manual email, call, task and LinkedIn steps; needs a connected individual inbox | **Disputed:** pricing page shows Starter; KB says Pro/Ent | OBS conflict · S1 vs S7 · A/A |
| Workflows | Free 50 (limited), Starter restricted triggers, Pro 300, Ent 1,000 | Free+ | OBS · S1 · A |
| Lead scoring | Starter up to 5 scores, Pro/Ent up to 10 | Starter | OBS · S1 · A |
| Calling | Calling minutes per month: Free 500, Starter 3,000, Pro/Ent 12,000 (CRM page lists Starter at 500; conflict) | Free+ | OBS conflict · S1,S3 · A |
| Forecasting | Default and custom forecasts | Pro | OBS · S1,S2 · A |
| Quotes | Pricing comparison lists quotes at Pro (free basic quotes **UNK**) | Pro | OBS · S2 · A (tool-read) |
| Meetings / reports / playbooks | Meeting scheduling, custom reports, playbooks listed from Starter | Starter | OBS · S2 · A (tool-read) |
| Conversation intelligence | Call recording analysis | Pro | OBS · S2 · A |
| Custom objects | Enterprise only (any hub); limits by subscription | Ent | OBS · S8 · A |
| Dedupe + merge | Daily duplicate detection on name/email/phone/company, etc.; **merges cannot be reverted**; bulk dedupe needs Data Hub | Pro/Ent | OBS · S6 · A |
| Import | Auto-dedupe contacts by email and companies by domain, or by Record ID; free tier: 20 MB files, 50 imports/day, 500k rows/day | Free | OBS · S13 · B |
| Mobile app | Create/edit records; log calls, notes, tasks; business-card and QR scan; device import; **no offline**; 99 associations max per record | Free+ | OBS · S12 · A |
| WhatsApp | Native channel in the shared inbox; needs a Meta-verified WhatsApp Business account | Marketing/Service **Pro+** | OBS · S14 · B |
| AI (Breeze) | Free in-app Assistant; paid Agents (Prospecting, Customer, Data…) on Pro/Ent, charged in credits per outcome (e.g. ~50 credits per resolved conversation, ~100 per recommended lead, since Apr 2026) | Pro/Ent + credits | OBS(3rd-party) · S17 · C |
| Credits bundled | Starter 500, Pro 3,000, Ent 5,000 HubSpot Credits | Starter+ | OBS · S1 · A |
| Marketplace | 2,000+ apps, 2.5M+ installs | — | OBS · S16 · B |
| Permissions/teams | Advanced permissions linked to Enterprise in third-party summaries; exact matrix **UNK** | Ent (INF) | INF · S20 · C |
| Interface language | 17 UI languages; **Arabic not among them**. Arabic is offered only for system-generated content and call transcription (page updated 2026-09-04) | — | OBS · S4 · A |
| RTL in CRM | Community answers say RTL rich text works in Marketing/CMS/KB editors but **not in the CRM/Sales/Service editor** (third-party editor) | — | OBS · S15 · C (date not captured) |
| Data residency | EU (DE), US East/West, Canada, Australia. **No Middle East region; page says no immediate plans** | — | OBS · S5 · A |

### Pricing (USD, captured 2026-10-05)
| Tier | Seat price observed | One-time fee | Label · Src · Grade |
|---|---|---|---|
| Free | $0, up to 2 users | — | OBS · S1,S3 · A |
| Sales Starter | Page shows **$7/seat/mo** (annual) against a **$20** list price; a "new customer up to 65% off" banner is present. Third parties cite $15 annual / $20 monthly | — | OBS + conflict · S1,S3 vs S20 · A/C → treat $7 as a **promotion** (INF) |
| Sales Pro | $90/seat (annual) · $100 (monthly) | $1,500 onboarding | OBS · S1 · A |
| Sales Ent | $150/seat (annual) | $3,500 onboarding | OBS · S1 · A |
| Marketing Pro | ~$890/mo; the next marketing-contact tier adds ~$50 per 1,000 contacts; ~$3,000 onboarding | — | OBS(3rd-party) · S18 · C, not verified on S1 |

### Known weaknesses / complaints
| Theme | Evidence | Label · Grade |
|---|---|---|
| Price jump from Starter to Pro, plus mandatory onboarding fees | The fees are official (S1). Reviewers call the jump the most-cited complaint (S18; one source, Nutshell, is a competitor) | OBS fee (A); sentiment C |
| Cost grows with marketing contacts and seats | Per-seat + contact-tier + onboarding stacking (S18) | C |
| Core hygiene features paywalled | Leads object Pro+ (S11), dedupe Pro+ (S6), custom objects Ent (S8), forecasting Pro (S1) | OBS · A |
| Arabic / RTL | No Arabic UI (S4); CRM editor RTL limited (S15); no ME data centre (S5) | OBS · A/C |
| Overall satisfaction remains high | ~4.4–4.5/5 average on G2 and Capterra (aggregator figure; G2 page not read directly) | C |

## 4. HubSpot UX patterns (RQ2)
**Adopt (why):**
1. **Three-zone record page** (properties | timeline | association cards) (S9): one screen answers "who, what happened, what's linked".
   It fits our Lead→Contact→Deal context requirement (S6 slice).
2. **Saved-view tabs plus a table/board toggle on every index** (S10): this pattern is already familiar to buyers, and our D3 client-side views can use the same layout.
3. **Preset workspace views** (e.g. Open leads, Recent activity, Not in sequence) (S11): users get a useful start with no setup; this maps to our All/My views.
4. **Board cards with inline edits and stage filters** (S10): quick to scan. *Keep our rule:* moves must also work by keyboard menu, not drag only.
5. **Required associations on create** (S12): prevents orphan deals and tasks; our API already enforces contact/deal agreement.
6. **Mobile quick-log after a meeting** (S12): a fast capture path. We can serve this through the responsive 360px web app before building a native app.
7. **Dedupe on import by a unique key** (email/phone) (S13): prevents duplicate records at entry, before merges are needed.

**Avoid (why):**
1. **Irreversible merges** (S6): our merge keeps a tombstone, provenance and audit. Keep that, and look at offering undo/unmerge later.
2. **Gating hygiene features behind higher tiers** (Leads object, dedupe) (S6, S11): this drives the cost complaints in S18. INF: SMBs feel it as a trap.
3. **Pricing on several axes with surprise fees** (S1, S18): if we ever price, keep it predictable. This is a design principle, not a price claim.
4. **LTR-only rich text in CRM notes and emails** (S15): it breaks Arabic content. Every text input we add must handle `dir=auto` and bidi isolation.
5. **Card-limit sprawl** (50 cards, S9): keep the MVP record page opinionated; customisation can come later.

## 5. Gap matrix (RQ3)
Our status per §2/§7 of the implementation map and the M1/M2 contracts. Priority: **P0** = needed for a credible MVP demo or pilot; P1 = next; P2 = later.
Effort: **UI** = UI-only · **API** = needs server/API · **CONN** = needs connector (M3).
| # | Capability | HubSpot (tier) | Ours today | Pri | Effort |
|---|---|---|---|---|---|
| 1 | Real sign-in / user & seat management | All | **Missing** (token+tenant paste, M0 limit; D6) | P0 | API |
| 2 | Server search, filter, sort, global search | All (S10) | **Partial** (client-side over loaded pages; G6) | P0 | API |
| 3 | CSV import with dedupe-on-import | Free (S13) | **Missing** (no endpoint; G6) | P0 | API |
| 4 | Notes + manual activity log (call/meeting/WhatsApp logged by hand) | Free (S12) | **Missing** (tasks have an outcome field only; no notes object) | P0 | API |
| 5 | Unified record page: timeline + association cards | All (S9) | **Partial** (journey endpoint; G8/G9 missing names & dates) | P0 | UI + API(G9) |
| 6 | Pipeline board (stages, totals, move by menu/drag, lost reason) | Free (S1) | **Partial** (API Have; board UI = slice S7) | P0 | UI |
| 7 | Saved views / preset views | All (S10) | **Partial** (localStorage only; "Unassigned" always empty, G2) | P0 | UI (+API for shared views, P1) |
| 8 | Dashboard KPIs (pipeline value, won/lost, overdue tasks) | Starter custom reports (S2) | **Partial** (D4, client-derived "loaded sample") | P0 | API (aggregates) |
| 9 | Companies / accounts object | Free core | **Missing** | P0 if ICP is B2B, else P1 | API |
| 10 | Custom properties (contact/deal) | Free (INF; limits UNK) | **Missing** (unknown fields rejected) | P0 | API |
| 11 | Leads with qualification | Leads object Pro+ (S11) | **Have** (open/qualified/closed) | — | — |
| 12 | Contacts, identifiers (E.164/email), provenance | Free | **Have** | — | — |
| 13 | Deals + immutable pipelines + transition rules + history | Free/Starter | **Have** (stronger audit; no deletion) | — | — |
| 14 | Tasks + due buckets | Free | **Have** (G10 gaps: no lead_id, no source marker) | P1 fixes | API |
| 15 | Task queues | Starter+ (INF) | Missing | P2 | UI+API |
| 16 | Duplicate detection + merge | Pro+ (S6), irreversible | **Have** (preview, provenance, tombstone) | — | — |
| 17 | Field-level validation errors | All (INF) | Partial (form-level only; G3) | P1 | API |
| 18 | Bulk edit / assign | All (INF) | Partial (sequential PATCH) | P1 | API (batch) |
| 19 | Export (CSV) | Free (S13) | Missing (M1 "no exports") | P1 | API |
| 20 | Workflow automation | Free 50 → Ent 1,000 (S1) | Partial (stage-trigger → task only) | P1 | API |
| 21 | Email logging/tracking, inbox connect | Free/Starter | **M3** | P1 | CONN |
| 22 | WhatsApp channel | Mkt/Service Pro+ (S14) | **M3** | P1 (differentiator) | CONN |
| 23 | Calling | Free 500 min (S1) | M3 | P2 | CONN |
| 24 | Sequences | Starter or Pro (disputed, S1/S7) | M3 | P2 | CONN |
| 25 | Meeting scheduler | Starter (S2) | Missing | P2 | CONN |
| 26 | Quotes / payments | Pro (S2) | Missing (M2 has commerce *ingest* only) | P2 | API+CONN |
| 27 | Forecasting / weighted pipeline | Pro (S1) | Missing (amount yes; stage probability no) | P2 | API |
| 28 | Lead scoring | Starter 5 / Pro 10 (S1) | Missing (G5) | P2 | API |
| 29 | Custom objects | Ent (S8) | Missing | P2 | API |
| 30 | Roles / permissions / audit | Advanced at Ent (S20, C) | **Have** (manager/rep/reader/agency grant, MFA marker, audit, outbox) | — (teams P2) | API |
| 31 | Campaign attribution + contact journey | Marketing Hub (tier **UNK**) | **Have** (M2: journey, conversions, campaign performance, calculate) | — | — |
| 32 | Arabic-first RTL UI | No Arabic UI (S4) | **Have** (Arabic RTL default) | — | — |
| 33 | Mobile | Native app, online only (S12) | Partial (360px responsive web) | P2 | UI |
| 34 | AI assistant / agents | Free Assistant; paid Agents (S17) | Missing | P2 | API+CONN |
| 35 | Public API / webhooks / marketplace | 2,000+ apps (S16) | Missing (outbox exists internally) | P1 | API |
| 36 | Data residency choice | EU/US/CA/AU; no ME (S5) | **UNK** (no hosting decision; local only) | Decision | Ops |

## 6. ICP / buyer note (SK-004, minimal)
There is no first-party T.SAG customer evidence in scope, so **no persona, pain or ICP is asserted**. Two open decisions change the priorities above:
(1) B2B vs B2C/SMB buyer, which affects the Companies object (#9); (2) the buyer (owner/manager) may differ from the user (rep).
Validation step: 5–8 interviews with target MENA SMB sales leads, plus win/loss notes once a pilot runs.

## 7. Differentiation hypotheses (RQ4) — NOT facts; each needs validation
| H | Hypothesis | Supporting observation | What would validate / falsify | Status |
|---|---|---|---|---|
| H1 | **Arabic-first RTL CRM** beats HubSpot for Arabic-speaking teams | HubSpot has no Arabic UI (S4, A); CRM editor RTL limited (S15, C); we ship Arabic RTL by default | Usability test with AR reps: task time and error rate vs HubSpot; check whether buyers will accept an English UI | HYPOTHESIS |
| H2 | **WhatsApp-native at the entry tier** wins MENA SMBs | HubSpot WhatsApp needs Mkt/Service Pro+ and Meta verification (S14, B) | We first need it built (M3); then interviews on channel mix; measure WhatsApp share of conversations | HYPOTHESIS (not built) |
| H3 | **Predictable all-in pricing** (no onboarding fee, no contact tiers) | HubSpot Pro fees (S1, A) and cost complaints (S18, C) | Pricing interviews / Van Westendorp; **no T.SAG price may be stated until approved** | HYPOTHESIS |
| H4 | **Attribution + journey + safe merge in the base product** | Our M2 attribution and audited merge are Have; HubSpot dedupe is Pro+ and irreversible (S6) | Demo feedback; confirm HubSpot's attribution tier (UNK) before any claim | HYPOTHESIS |
| H5 | **GCC data residency** | No HubSpot ME region, no plans (S5, A) | Needs our hosting decision first; ask buyers whether residency affects purchase (regulated sectors) | HYPOTHESIS |
| H6 | **Local payments/commerce** (e.g. regional gateways, BNPL) linked to deals | No evidence collected this round | Research HubSpot payments geography plus buyer interviews | UNK |

## 8. Claim–evidence ledger: conflicts and limits (SK-002)
- **C1 Starter price** $7 (S1/S3, observed promo) vs $20 list (S1) vs $15 annual (S20). Disposition: QUALIFIED. Cite "$20 list, promos observed".
- **C2 Sequences tier:** Starter (S1 pricing table) vs Pro/Ent (S7 KB). Disposition: DISPUTED. The KB may be outdated, or the tool summary may be wrong. Re-check both pages by hand.
- **C3 Calling minutes:** S1 says Starter 3,000; S3 says Starter 500. DISPUTED; it may depend on product (Sales Starter vs Platform Starter).
- **C4 Review sentiment** comes only from aggregators (C). No primary G2/Capterra/Reddit review was read; Reddit was not sampled. UNSUPPORTED as prevalence.
- **C5 RTL community answer:** the page returned 403 on fetch and was read through snippets only; its date was not captured. Re-check before external use.
- Limits: no hands-on product use, so UX comes from documentation, not observation. Prices are USD as served to our location. One competitor only (SK-003 asks for 5).
  Absence of evidence (e.g. HubSpot attribution tier) is recorded as UNK, not as "missing".
- Review routing: SPARK_AG before any attribution or measurement claim; CREATIVE_AG for any visual use.

## 9. Sources (accessed 2026-10-05)
| ID | Source | Type | Grade (for claims cited) |
|---|---|---|---|
| S1 | https://www.hubspot.com/pricing/sales | Official pricing | A |
| S2 | https://www.hubspot.com/pricing/sales/enterprise (feature comparison) | Official pricing | A (tool-read; re-check) |
| S3 | https://www.hubspot.com/pricing/crm | Official pricing | A |
| S4 | https://knowledge.hubspot.com/account/hubspot-language-offerings (upd. 2026-09-04) | Official KB | A |
| S5 | https://www.hubspot.com/data-centers | Official | A |
| S6 | https://knowledge.hubspot.com/records/manage-duplicate-records | Official KB | A |
| S7 | https://knowledge.hubspot.com/sequences/create-and-edit-sequences | Official KB | A (conflicts S1) |
| S8 | https://knowledge.hubspot.com/object-settings/create-custom-objects | Official KB | A |
| S9 | https://knowledge.hubspot.com/records/work-with-records ; .../object-settings/customize-records | Official KB (snippet) | B |
| S10 | https://knowledge.hubspot.com/records/view-and-filter-records ; .../create-and-manage-saved-views | Official KB (snippet) | B |
| S11 | https://knowledge.hubspot.com/records/manage-leads | Official KB | A |
| S12 | https://knowledge.hubspot.com/records/work-with-records-in-the-hubspot-mobile-app | Official KB | A |
| S13 | https://knowledge.hubspot.com/records/deduplication-of-records ; .../import-and-export/understand-the-import-tool | Official KB (snippet) | B |
| S14 | https://www.hubspot.com/company-news/hubspot-announces-general-availability-of-whatsapp-integration ; instantreply.co guide | Vendor PR (snippet) + 3rd party | B |
| S15 | https://community.hubspot.com/t5/CRM/Right-to-Left-Capabilities/m-p/686043 ; .../HubSpot-Ideas/...idi-p/38023 | Vendor community (snippet; 403) | C |
| S16 | https://community.hubspot.com/t5/Releases-and-Updates/2-000-Apps-2-5M-Active-Installs/ba-p/1209474 | Vendor community | B |
| S17 | https://vantagepoint.io/blog/hs/hubspot-breeze-prospecting-agent-credits-pricing-guide ; https://resolve247.ai/blog/hubspot-ai-agent-pricing/ | 3rd-party blogs | C |
| S18 | https://www.docket.io/resources/research/hubspot-marketing-hub-review ; https://saascrmreview.com/hubspot-crm-reviews/ ; https://www.nutshell.com/blog/why-is-hubspot-so-expensive (competitor) | 3rd-party | C |
| S19 | https://www.g2.com/products/hubspot-sales-hub/reviews ; https://www.capterra.com/p/171840/HubSpot-CRM/ | Review sites (listing only) | C |
| S20 | https://www.sybill.ai/blogs/hubspot-sales-hub-pricing ; https://www.mo.agency/blog/hubspot-pricing | 3rd-party | C |
Source count by grade: **A 10 · B 5 · C 5 · D 0** (20 source entries; the C entries group 2–3 URLs each).
