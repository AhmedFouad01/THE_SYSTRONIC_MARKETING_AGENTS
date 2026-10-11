# 01 LENS screen research: jobs and questions per screen (t-sag CRM redesign, step 1 of 4)

Status: ACCEPTED by Lead 2026-10-09 as input to SPARK (not a final deliverable). Lead live spot-check: 8/8 A-rated claims confirmed (ledger rows 1, 2, 4, 5, 7, 11, 13, 15). Date: 2026-10-09. Agent: LENS_AG. Skills: TSST-LENS-SK-001 (scope), -002 (evidence grading), -003 (vendor comparison, OBSERVED/INFERRED/UNKNOWN), -004 (jobs; hypotheses only).

## 0. How to read this
- Input: Gemini report GEM-CRM-001 (INPUT, not truth). I opened 16 vendor pages live and ran 5 searches. Result: 13 pages readable, 3 Salesforce/SLDS pages did not render (JavaScript shell), 0 dead.
- **Confidence:** A = official page opened and it supports the claim. B = official page partly supports it, or search-level only. C = Gemini inference or general pattern with no opened source.
- **Jobs and questions are HYPOTHESES.** They come from vendor docs plus Gemini plus Ahmed's review. No interviews with our users exist. SPARK/CREATIVE should validate them with Ahmed, not treat them as customer evidence.
- **Biggest weakness of the report:** for most screens Gemini names only 1-2 vendors and writes "No public evidence" for the rest. "Convergent" and "universal" claims are therefore mostly INFERENCE. Its "Visual separation" paragraphs (f) have no source at all. Its source list is not linked to claims and includes irrelevant pages (HubSpot knowledge-base builder, Salesforce Experience Cloud community pages, a YouTube video, third-party blogs).

## 1. Summary table (our 16 screens)
Users: A = agency staff, C = client user, A+C = both. Roles: M manager, P rep, R reader.

| # | Screen | Our route (NAV spec s1) | Users | Top jobs | 5-second questions | Convergent layout (regions; where primary action sits) | Conf. |
|---|---|---|---|---|---|---|---|
| 1 | App shell | all routes; tenant block under brand | A+C | go to a module; know/switch client workspace; search; create | Which client am I in? Where is X? | Logical-start sidebar + top bar with search/profile. HubSpot switch: account menu, top right (A). GHL switcher placement unverified (C). Create: top right (C) | B |
| 2 | Sign-in | route not in spec s1 | A+C | sign in; reset password; (client) open without a password | Where do I type? Is this the right workspace? | Centred card, no navigation. Only GHL evidenced: client-portal magic link (A) | C |
| 3 | Dashboard | `/dashboard`, `/` | A+C (M/P/R) | see what needs attention; track pipeline vs goal; jump to work | What is due or stuck? How is this month? | Widget grid; Attio grid with drag/resize (A); toolbar with Share top right (A). Agency roll-up vs client view: HubSpot reports across accounts (A) | B |
| 4 | Leads | `/leads` | A (P/M), C read | triage new leads; see source; assign; follow up | Who is new and untouched? From which ad? Who owns it? | Toolbar (search, filters, columns) over table; bulk bar on selection. GHL/Salesforce lead tables only from Gemini | C |
| 5 | Contacts | `/contacts` | A+C | find; filter and save views; edit inline; bulk message | How many match? Which view am I in? | Saved views as tabs, filter panel, table. GHL Smart Lists confirmed (A) | B |
| 6 | Contact record + journey | detail from `/contacts`, `/leads` | A+C | read history; log call/note/email; update fields; see source | Who is this? What happened last? What is next? | Left property cards / middle timeline and tabs / right associations. HubSpot (A via search) and Attio (A). Composer top of middle | B |
| 7 | Merge | action on `/contacts` (merge capability) | A (M) | pick survivor; resolve conflicts; confirm | Which record survives? What is lost? | Side-by-side with per-field choice and preview. Pipedrive "..." > Merge > preview (A). Salesforce side-by-side (B, third-party) | B |
| 8 | Deals + deal record | `/deals` | A (M/P) | track value and close date; edit; review history | Value? Stage? Close date? Who is involved? | Table or board toggle; record mirrors contact record. Attio highlights strip, up to 6 attributes (A) | B |
| 9 | Pipeline | `/pipeline` | A | move deals; spot stalled deals; see stage totals | Where is the money? What is stale? | Stage columns; header count + value; stage hover total (Pipedrive A); per-stage rotting days (B); drag | B |
| 10 | Tasks | `/tasks` | A (P) | do today's items; reschedule overdue | What is due today? What is overdue? | HubSpot default views: Due today / Overdue / Upcoming / Completed / All, "Assignee: Me" (A). Right preview pane: Gemini only | B / C (pane) |
| 11 | Segments | `/segments` (proposed) | A | define rule groups; see count; act on the group | What rules? How many match? | Field / operator / value rows, AND / OR / negative; saved as a list inside Contacts (GHL A) | A |
| 12 | Import | `/imports` (M only; proposed UI) | A (M) | upload; map columns; fix errors; confirm | Which columns are unmapped? How many rows fail? | Stepper. HubSpot: file > mapping, "Create new property" inline, name + consent, then status page (A) | B |
| 13 | Reports | `/reporting` | A+C | answer a question; compare periods; drill down; share | What changed? Which filter is on? Can I click through? | Dashboard of report cards; Attio New dashboard > Create first report, Share (A). Builder: sidebar + canvas is Gemini only | C |
| 14 | Journeys and tracking | `/journeys` (proposed) | A | trace a lead to an ad; compare sources | Which ad/campaign produced this? First touch? | Gemini: inside the record timeline. No vendor source opened | C |
| 15 | Integrations | `/settings/integrations` (proposed) | A (M) | connect Meta/Google/TikTok; see health; map forms | Connected? Token valid? Which account? | GHL TikTok: Settings > Integration, business login, pick advertiser account, form "Map Fields" (A). Card grid: Gemini only | B |
| 16 | Settings: users/roles, properties, security | `/settings/users`, `/settings/properties`, `/settings/security` | A (M); C own profile | invite and role users; edit fields; enforce 2FA | Who has access? Where do I add a field? | Settings as own area. GHL Agency vs Account user type (A). HubSpot requires 2FA for multi-account org (A) | B |

## 2. Per screen
Format: Jobs / Questions are in the table above. Here: adopt, avoid, which R-items it addresses, and open questions.

**1 Shell.** Adopt: tenant block pinned in the sidebar (our spec) and a "recent / pinned clients" list (HubSpot offers recents, pin, set-as-default, A). Avoid: a switcher that exists only under the profile menu (HubSpot pattern; hides scope). Place the switcher at the logical START in AR, not "top-left": Gemini's left-to-right scanning argument does not survive RTL. Addresses R06 (name not UUID). SPARK: which cross-client numbers does an agency manager need on entry? CREATIVE: shell chrome weight and the mobile More sheet.

**2 Sign-in.** Adopt: a passwordless option for read-only clients (GHL magic link: one app, one contact, expires in 15 minutes, A). Avoid: copying Gemini's "SSO above email field" (no source). Addresses: none directly. SPARK: do clients need login at all, or only dashboards by link? CREATIVE: agency-branded vs neutral card.

**3 Dashboard.** Adopt: an agency roll-up tier and a client tier (inference from HubSpot cross-account reports, A, and GHL agency dashboard, A for title only). Adopt Attio's grid editing as a mental model: drag by title, resize by dragging the gap (A). Avoid: a static grid. Addresses R04 (empty state, default range, chart theme), R03. SPARK: the 5-7 KPIs per tier. CREATIVE: chart theme.

**4 Leads.** Adopt: source and ad campaign columns visible by default (inference; needed for Meta/Google/TikTok), phone and email visible, display rule from R10, a "missing contact" filter. Avoid: a separate Lead-to-Contact conversion step (Salesforce model from Gemini, not opened; inference only). Addresses R07, R09, R10, R08. SPARK: lead states and speed-to-lead KPI. CREATIVE: row density, bulk bar, 375 card list (name, channel, status).

**5 Contacts.** Adopt: saved views as tabs + filter panel (GHL A); column chooser, freeze, reorder, inline edit (Ahmed R07 asks; HubSpot as his reference, not opened by me). Avoid: filters hidden behind a modal that dims the table (Gemini, unsourced). Addresses R07, R08, R09. SPARK: which saved views ship by default. CREATIVE: the toolbar row alignment (R02).

**6 Contact record + journey.** Adopt: 3 regions of collapsible cards; HubSpot left cards, middle cards, right associated records, up to 50 cards, Super-Admin customisable (A, search-level); Attio's up-to-6 highlights above the fold (A). Note: both leaders keep tabs in the middle (HubSpot Activities tab; Attio Overview/Activity/Emails/Notes/Tasks, A). Gemini's "avoid tabs, use one unified timeline" is a preference, not convergent evidence; keep one timeline with filter chips as our choice. Addresses R09 (call/mailto/WhatsApp actions), R10. SPARK: which journey events and source fields are mandatory. CREATIVE: record header and stacking at 375.

**7 Merge.** Adopt: Pipedrive flow (menu > Merge > search item > pick values on conflict > preview > confirm; admin/permission needed, A) plus an undo/audit trail (inference). Avoid: blind auto-merge (inference). SPARK: duplicate key rules (phone/email). CREATIVE: conflict-only rows with a clear survivor.

**8 Deals + record.** Adopt: the same record anatomy as contacts; amount, stage, close date in a highlights strip (Attio A). Avoid: a different layout per object (inference). Addresses R01, R08. SPARK: deal value model. CREATIVE: list/board toggle placement.

**9 Pipeline.** Adopt: stage header with count and value (Pipedrive hover total, summary with count, value by currency, weighted total, B); per-stage "rotting" days (B); drag between stages. Avoid: an inner boxed scroll frame (R01). Pipedrive orders cards by activity date and does not allow manual order (community reply, possibly stale, C). Addresses R01, R02, R08 (stage names). SPARK: stale-deal threshold per stage. CREATIVE: column width at 1440, board at 375 (stage switcher vs horizontal scroll).

**10 Tasks.** Adopt: default views Due today / Overdue / Upcoming / Completed, "Assignee: Me" (HubSpot A). Queue / "work next task" mode: only a third-party guide (C). Avoid: the right-side preview pane as a "convergent" claim (no source). SPARK: task types tied to lead SLAs. CREATIVE: list + drawer.

**11 Segments.** Adopt: GHL model, a Smart List is a filter set (field, operator, value; AND via "nested filter", OR via "add filter"; negative operators; A) created at user level, optionally pushed to all users (A). Avoid: a module disconnected from the Contacts list. Open: our `/segments` route is "coming soon"; fold into Contacts saved views? Addresses R07 (views), R08 (single name). SPARK: audience size and ad-platform sync need. CREATIVE: rule-group container.

**12 Import.** Adopt: map step with inline "Create new property" (HubSpot A); name the import; status page after finishing (A). Gemini's "Validate" step and "summary card" are not on the page I opened (C); our five-step review already exceeds it. Rule from R10: rows without phone or email go to row errors. Addresses R12, R06, R09. SPARK: error-report and update-vs-create semantics. CREATIVE: dropzone and mapping table at 375.

**13 Reports.** Adopt: dashboard = grid of report cards; New dashboard > add report; Share with access levels full / read-write / read-only / none (Attio A). HubSpot builds reports that aggregate across accounts (A) but on an Enterprise parent. Builder layout (sidebar + canvas) is Gemini only (C); R05 asks for a rebuild anyway. Addresses R05, R04, R07. SPARK: question list and KPI tree (this is its main input). CREATIVE: report card anatomy, empty state.

**14 Journeys and tracking.** Evidence is the thinnest: Gemini marks it "inferred from CRM architecture standards", no source. Treat as OPEN. Hypothesis: keep it on the record timeline plus a source/campaign view in Reports. SPARK owns attribution fields (first touch, latest touch, ad id). CREATIVE: system events vs human events treatment (hypothesis).

**15 Integrations.** Adopt: GHL TikTok flow as a template for all three ad platforms: business login with permissions > choose advertiser account > form mapping tab with "Map Fields" > update to subscribe; supported types text, long text, number, phone, money, single option, date; no multi-select (A). Surface connection health on the card (inference; token state not evidenced). Caveat: GHL gates this under a "labs" setting, so it may change. SPARK: lead-form field map to our properties (email/phone required, R10). CREATIVE: status, error and reconnect states.

**16 Settings.** Adopt: Agency vs Account user types ("all client accounts" vs "selected accounts"), permission-gated "Login As" (GHL A); 2FA enforced for cross-account work (HubSpot A). Our roles are manager / rep / reader, so SPARK must map them. Avoid: showing agency-level settings to client users. Addresses R08, R09, R11. SPARK: which properties are system properties. CREATIVE: settings navigation, dialog field alignment.

## 3. Cross-cutting
| Topic | Verified (OBSERVATION) | INFERENCE for us | Conf. |
|---|---|---|---|
| Agency model: switching | HubSpot: account name top right > Account > recent accounts; All accounts, pin, set default; your email must be a user on each account (A). Mobile app: menu top left > account name > Account (A) | Pin the client block in the sidebar; add recents. GHL switcher location is NOT stated on the page I opened | A / C |
| Agency model: structure | HubSpot: Enterprise parent, up to 29 additional accounts (30 total), Super Admin in each, 2FA, reports aggregate across accounts (A). GHL: Agency user sees all client accounts, Account user sees selected ones, Login As gated by permission (A). Agency View has Agency Dashboard, Sub-Accounts, Reselling, Template Library, Agency Settings (A, titles only) | Our model is closer to GHL than HubSpot. Client staff see one workspace only | A |
| Client logins / portals | GHL Client Portal: SSO magic link per app per contact, expires in 15 minutes, made from Client Portal Dashboard (A). Gemini's "Google sign-in toggle" is NOT on that page (unsupported) | Offer link-based access for readers | A / C |
| Record anatomy | HubSpot: left cards, middle cards + Customize, right associated records; collapsible sections; up to 50 cards (B, search-level). Attio: left sidebar (Record Details, Lists), tabs, Overview highlights up to 6 (A). Pipedrive: detail-view sidebar customisable (A); Gemini's "split view" unsupported | One anatomy for contact, lead, deal | B |
| Mobile at 375 | HubSpot app: account menu in top-left menu (A). SLDS mobile-first stacking: page did not render (unverified). Gemini's collapse order (Highlights > actions > timeline) is inference | Our NAV spec already defines bottom tabs + More sheet. Lists become cards (name, channel, status); record stacks highlights > actions > timeline | C |
| Arabic / RTL | Zoho: "Arabic (Egypt)" fully supported; 16 other Arabic variants partial, where system entities such as setup components and default buttons stay in the default language; RTL layout not mentioned (A). Salesforce RTL: both pages failed to render, UNVERIFIED. GHL: Gemini cites SMS encoding only | No vendor evidence for a verified structural RTL flip. Design RTL from our own rules: logical start/end, sidebar and drawers enter from the right, bidi-safe names (R08). Mirror the primary action to logical end | C |

## 4. Layout observations for CREATIVE (observation only, no colours)
- **What the official docs let me state:** leaders divide a record or dashboard into **modules** that the user can add, drag, collapse and resize: HubSpot cards in three columns with collapsible sections (B); Attio report cards in a grid, resized by dragging **the gap between them** (A); Attio highlights as widgets (A). The unit of structure is the card plus spacing, not a drawn rule.
- **Where actions sit:** HubSpot "Customize" at the upper right of the middle column (B); Attio "Share" top right of a dashboard (A); GHL "+ Add smart list" and a three-dot menu beside "Add Contact" (A); Pipedrive Merge inside the "..." menu (A); HubSpot Next / Finish at the end of the import flow (A). Pattern: primary action at the **logical end of its own region header**; secondary actions in an overflow menu.
- **Not verified:** card vs divider-line vs elevation use, shadows, zebra rows, tinted columns, and "red borders on stale deals" appear only in Gemini's unsourced (f) paragraphs (C). **Gap:** this needs a screenshot pass of public product pages (a FAST reader or Ahmed's captures). I did not do it; no image evidence was available to me.
- **Link to Ahmed's complaints:** nothing I verified requires visible divider lines, or a button resting on a line, to define regions. Spacing plus grouped modules is what the docs describe.

## 5. Findings that most change the redesign
1. **Agency model is closer to GHL than HubSpot.** Two user tiers (all clients vs selected clients), a permission-gated "Login As", and passwordless client access. HubSpot's multi-account needs an Enterprise parent and 2FA. Decide whether impersonation exists (SPARK/Lead).
2. **Record anatomy is confirmed, "no tabs" is not.** Left / middle / right module cards (HubSpot, Attio) is solid. Both leaders still use tabs in the middle. A single unified timeline is our design choice. A highlights strip (up to 6) answers R10/R09.
3. **Segments belong inside Contacts** as saved Smart-List-style views (field/operator/value, AND/OR/negative, personal vs shared). This challenges the separate `/segments` route.
4. **Arabic/RTL has no verified vendor precedent.** Only Zoho's partial-language limitation is confirmed. Treat RTL as our differentiator and design it from first principles.
5. **Most of Gemini's "convergence" is thin.** 12 of 16 screens rest on 1-2 vendors. Use the A/B items above; treat the rest (tasks preview pane, import "validate" step, sign-in, visual separation) as hypotheses.

## 6. Open gaps
- Reports/builder layout, journeys/attribution views, sign-in: no opened vendor source. Needs a targeted pass (HubSpot attribution reports, Pipedrive Insights) if SPARK needs precedents.
- Salesforce pages (SLDS layout, RTL FAQ, contact merge) did not render; re-check through another channel.
- GHL switcher location, GHL Google sign-in toggle, HubSpot "Create" button position: unverified.
- No screenshot-based layout evidence (section 4).
- No evidence from our own users on jobs and questions.

## 7. Evidence ledger
Status: OK = opened and supports; PART = opened, part of Gemini's claim unsupported; NR = page did not render. Retrieved 2026-10-09.

| # | URL (short) | Status | Claim it supports / what failed |
|---|---|---|---|
| 1 | knowledge.hubspot.com/account-management/manage-multiple-hubspot-accounts | OK | Switch from account name, upper right; recents, pin, default; mobile: top-left menu > account |
| 2 | knowledge.hubspot.com/account-management/set-up-multi-account-management | OK | Enterprise parent, 29 additional (30), Super Admin, 2FA, aggregate reports. Dashboards not mentioned |
| 3 | help.gohighlevel.com/support/solutions/155000000148 | PART | Agency View contents (titles). Switcher location not stated |
| 4 | help.gohighlevel.com/.../155000001667-client-portal-sso-magic-links... | PART | Magic link per app/contact, 15 min. Google sign-in toggle not on page |
| 5 | help.gohighlevel.com/.../48000982600-user-access | OK | Agency vs Account user types; Login As permission |
| 6 | lightningdesignsystem.com/2e1ef8501/p/33e9af-layout | NR | Mobile-first/collapse claim unverified |
| 7 | attio.com/help/.../understanding-records | OK | Left sidebar, tabs, highlights up to 6 |
| 8 | support.pipedrive.com/en/article/updating-items-in-the-detail-view | PART | Merge via "..." with preview and permissions (OK). "Split view"/left-centre layout not supported |
| 9 | knowledge.hubspot.com/import-and-export/import-contacts-quick-import | PART | Upload > mapping > name + consent > status page; inline "Create new property". "3 columns", "validate", "summary card" not supported |
| 10 | help.gohighlevel.com/.../155000007530-advanced-filters-in-smart-lists | PART | Operators, AND/OR, negative filters. "Saved as tabs" not covered |
| 11 | attio.com/help/.../dashboards | OK | Report grid, drag/resize, Share top right, access levels |
| 12 | help.salesforce.com ... faq_getstart_rtl | NR | Salesforce RTL claim unverified |
| 13 | help.zoho.com/.../languages-supported-in-zoho-crm | PART | Arabic (Egypt) full; others partial; RTL not mentioned |
| 14 | help.gohighlevel.com/.../48001223558-how-to-integrate-tiktok-lead-ads | OK | Login, advertiser account, form mapping, field types |
| 15 | help.gohighlevel.com/.../48001062094-how-to-create-manage-smart-lists | OK | Smart Lists under Contacts, create, personal vs pushed to all, manage menu |
| 16 | help.salesforce.com ... contacts_merge_lex | NR | Merge UX not verified from official page; third-party sources describe master + per-field choice (C) |
| S1 | support.pipedrive.com/en/article/pipeline-view (search result) | B | Stage columns, hover totals, summary, drag; rotting steps from a third-party blog |
| S2 | knowledge.hubspot.com/records/work-with-records (search) | B | Left/middle/right layout, 50 cards, Customize |
| S3 | knowledge.hubspot.com/tasks/filter-tasks-and-manage-task-views (search) | B | Default task views, Assignee: Me. Queues from consultevo.com only |
| S4 | Salesforce RTL (search) | none | Search returned only Zoho SalesIQ; no Salesforce source found |
| S5 | Salesforce merge (search) | C | Only third-party guides (xappex.com et al.) |

Totals: 16 opened (one over the 15 cap, noted) = 7 OK, 6 PART, 3 NR, 0 dead; 5 searches (5 used).

Removed or downgraded from Gemini: GHL Google sign-in toggle (unsupported); "Zoho renders RTL appropriately" (not on page); Pipedrive "split view" (unsupported); HubSpot import "3-column table", "validate step" and "summary card" (unsupported); Salesforce RTL "default layout" (unverified); tasks right preview pane (no source); all section (f) visual-separation text (unsourced, kept only as hypothesis).
