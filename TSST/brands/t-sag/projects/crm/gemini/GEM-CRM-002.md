GEMINI REQUEST GEM-CRM-002 · t-sag · crm (full UI redesign) · from TSST Lead, for LENS_AG review · 2026-10-09
SURFACE: Gemini app (Deep Research, NEW chat)
ROLE:            EXTERNAL TOOL — research; reply with text only in the chat, write no files (block: TSST/context/request-role.md)
OBJECTIVE:       Detailed public evidence on how 8 competitor CRMs structure their navigation, how their CRM works, how deep their two-way ad-platform data goes, and how they package features into modules per business type.
CONTEXT:         Inside the prompt (self-contained). No client data, no internal numbers.
FILES/ASSETS:    none. Upload nothing.
CONSTRAINTS:     Public sources only; a URL for every vendor claim; observations separate from inferences.
OUTPUT:          One report in the chat. Share the link with the Lead (as for GEM-CRM-001); the Lead saves it as `GEM-CRM-002_out.md`.
ACCEPTANCE (LENS_AG on return):
- all 8 vendors × 5 parts covered, or marked "no public evidence";
- every claim in part 3 (ad-platform data) verified on an official vendor or platform page before use;
- LENS opens ≥10 load-bearing URLs live; observation vs inference kept apart; no invented features;
- then LENS writes `../redesign/01b_LENS_COMPETITORS_MENU_MODULES.md`.

## Steps for Ahmed
1. Gemini app → **new chat** → **Deep Research**.
2. Paste everything inside the PROMPT block (from "ROLE" to the end). Upload nothing.
3. Approve the plan and let it run.
4. Share the report link with the Lead.

## PROMPT

```text
ROLE: EXTERNAL TOOL — research. You are not part of any team or system; reply with a report in this chat only. Do not write files or run code.

GOAL
We are building a CRM for a marketing/ads agency. The agency uses it for its own sales, and it runs a separate workspace per client; client staff log in to their own workspace only. The product core is a strong CRM plus strong two-way data flow between the CRM and the ad platforms (Meta, Google, TikTok), so that ads are steered by CRM data. Extra features will be modules that are switched on per client, depending on the client's business type. The market is Egypt and the Middle East (Arabic and English).

I need a detailed, evidence-based competitor study covering 5 parts.

VENDORS
1. HubSpot (all Hubs, especially Marketing Hub and Sales Hub)
2. GoHighLevel (agency view, sub-accounts, snapshots, SaaS mode)
3. Zoho CRM (plus Zoho Marketing Plus / Bigin where relevant)
4. Salesforce (Sales Cloud, Marketing Cloud / Account Engagement where relevant)
5. Pipedrive (including its add-ons)
6. Kommo (formerly amoCRM)
7. Bitrix24
8. Odoo (CRM, Marketing and its app/module model)

SOURCES
- Prefer official help centres, product docs, developer/API docs, official pricing/edition pages and official app marketplaces.
- For part 3, also use the ad platforms' official docs (Meta for Developers / Meta Business Help, Google Ads Help / Google Ads API, TikTok Business Help / TikTok API for Business) to confirm what each integration does.
- Use public reviews (G2, Capterra, Reddit) only for user complaints, and label them "user reports".
- Give a working URL for every vendor claim and the page's last-updated date, if shown. If you cannot find a source, write "no public evidence". Do not guess.

PART 1: NAVIGATION (MENU) — for each vendor
- The full main navigation tree: top-level sections and the pages under each, as of the latest public docs.
- Specifically: where Marketing, Ads, Ads reporting, Segments/Lists, Forms, SEO, general Reports/Dashboards, Integrations/Connected apps and Settings sit.
- Whether the menu changes by plan/edition, by installed module, or by user role, and how.
- How an agency user moves between client accounts (if supported).

PART 2: HOW THE CRM WORKS — for each vendor
- The core objects (contact/person, company/organisation, lead, deal/opportunity, activity/task, and others) and how they relate.
- Lifecycle stages or lead statuses, pipelines and stages, ownership/assignment, and duplicate handling.
- Custom fields and custom objects: availability and limits.
- Automation/workflows: what triggers and actions exist at a high level.

PART 3: TWO-WAY AD-PLATFORM DATA (most important) — for each vendor, and for each of Meta, Google Ads and TikTok, answer each item with Yes / Partial / No, plus a URL:
a. Lead ingestion: pulls leads from the platform's lead forms (Meta Lead Ads, Google lead form assets, TikTok Lead Generation) into the CRM automatically. Note the field mapping and the delay.
b. Audience sync: pushes CRM lists/segments to the platform as audiences (Meta Custom Audiences, Google Customer Match, TikTok Custom Audiences). Note whether it is one-off or kept in sync.
c. Conversions back: sends CRM events (lead qualified, deal won, purchase, revenue) back to the platform (Meta Conversions API / CRM integration, Google offline conversion import or enhanced conversions for leads, TikTok Events API). Note which identifiers are used (click IDs such as gclid/fbclid/ttclid, hashed email/phone).
d. Spend and performance pull: imports ad spend, impressions, clicks and cost data into the CRM for reporting.
e. Attribution: links ads/campaigns to contacts, deals and revenue. Which models are offered (first touch, last touch, multi-touch)?
f. Ad control from the CRM: can users create, edit, pause ads, or change budgets inside the CRM? Which actions exactly?
g. Plan/edition required, and known limits or user-reported problems.
End part 3 with one comparison matrix: vendors as rows, a–f × 3 platforms as columns.

PART 4: MODULES AND PACKAGING BY BUSINESS TYPE — for each vendor
- How features are packaged: hubs, editions, apps, add-ons, marketplace, snapshots, feature toggles.
- Whether an admin or agency can switch features on or off per account or per client, and how.
- Industry/vertical packaging: ready-made setups or modules for real estate, e-commerce/retail, restaurants/food, clinics/healthcare, education, and services. What each one adds (objects, pipelines, fields, screens).
- End with a table: business type → modules that commonly get switched on, and which vendors offer them.

PART 5: REGIONAL FIT (short)
- Arabic UI and right-to-left support (documented, with limits).
- WhatsApp integration (official WhatsApp Business Platform/API vs unofficial), and what it does inside the CRM.
- Local presence or partners in Egypt/MENA, if documented.

OUTPUT FORMAT
- Start with a one-page executive summary: the 10 most important findings for a product whose core is CRM + two-way ad data, plus modules by business type.
- Then parts 1–5. Within each part, one subsection per vendor, followed by a comparison table.
- Mark every claim as OBSERVATION [source number] or INFERENCE.
- End with a numbered source list giving the URL, vendor, page title and last-updated date (or "not shown").
- English. Plain language. No marketing fluff.
```
