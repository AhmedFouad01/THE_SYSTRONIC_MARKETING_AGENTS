# 03b Page redesign report (t-sag CRM, full UI redesign step 3, round C1b)

Status: PLAN for Ahmed's approval. Lead review 2026-10-09: accepted for Ahmed. Notes: RTL site-map render checked by the Lead (OK except step arrows not mirrored in RTL); skills applied from index triggers only (bodies not opened); "Users & roles" shown as coming soon although sign-in/users is roadmap item 1, to confirm with Ahmed. No drawings, no colours (neutral greys only; the theme is a parallel run). Wireframes follow in C2.
Inputs: DECISIONS D-01..D-07, LENS 01 and 01b s7, SPARK 02 s2 and s5.3, VISUAL_REVIEW R01-R12, NAV_AND_SCREENS s1. Visual map: `03b_SITE_MAP.html` (+ `.png`).
Mode (Impeccable): **Operate**. Familiar patterns, density where users need it, one component vocabulary, motion 150-250 ms for state only, no modal as first thought.

Legend: M manager, P rep, R reader. AG agency staff, CL client user. "Gate" = module or connection state. R-items refer to the visual review.

---

## 0. Shared patterns (apply to every page)

### 0.1 Global rules

| Rule | Meaning |
|---|---|
| Separation | Regions are separated by space and elevation (surface step), not lines. Rows in tables may use a hairline only where scanning needs it; no divider under a header, no button resting on a line, no boxed inner scroll frame (R01, R07). |
| One scale | One spacing scale, one 36 px control height, one baseline per action row (`align-items:center`). Hidden labels are truly hidden (R02). |
| No native controls | File, select, date, checkbox, radio, switch all use the styled kit (React Aria). DropZone + FileTrigger for files (R12). |
| Names | One name field per user-entered object, `dir=auto` (R08). UI chrome stays bilingual. |
| Direction | AR is complete RTL: sidebar at the right, motion enters from the right, "logical end" = left in AR. Numbers, phones, emails and mixed AR/EN strings are bidi-isolated. EN is equally first-class. |
| Viewports | 1440 desktop and 375 mobile for every page; one breakpoint decision (<=720 px) switches shell and table behaviour. |
| Tenant | Workspace shows the client **name**; the UUID appears only in a tooltip or copy action (R06). |
| Coming soon | Disabled item, small amber dot at the logical end, tooltip "Coming soon / قريبًا". No badge text (R06 update). |
| Masking | Phone and email masked without `sensitive.read`; money always shows currency (R09, D-07). |

### 0.2 Page header anatomy

| Part | Position | Notes |
|---|---|---|
| Title | Logical start | One H1, one line, truncates with tooltip. |
| Scope line | Under the title, muted | Client name, date range or view name, "as of" time. |
| Secondary actions | Logical end, before primary | Icon buttons and one overflow menu (Merge, Export, Settings). |
| **Primary action** | **Logical end of the header's own region** | One per page, filled; label is a verb plus object ("New deal"). Never inside a table row or on a divider. |
| Page tabs / view switch | Under the header, own row, spaced | Only when the page has sibling views (e.g. List / Board). |
| At 375 | Title on row 1, primary action becomes a full-width button at the bottom of the viewport only when it is the main task (Tasks, Leads), otherwise stays at the end of row 1; secondary actions collapse into the overflow menu. |

### 0.3 List pattern (Leads, Contacts, Deals, Tasks, Segments, Forms, Users, ledgers)

| Layer | Spec |
|---|---|
| Saved views | Row of view chips (not boxed tabs) at the logical start, "+ view" and a view menu at the end. Defaults per screen come from SPARK 2.2. Personal views are separate from segments (D-07-3). |
| Toolbar | One row: search, filter button (opens a side panel, never a dimming modal), column chooser, density, export (role-gated). Same 36 px height. A filter summary row appears only when filters are active. |
| KPI strip | Optional, 3-5 neutral tiles above the toolbar; tiles are clickable filters. |
| Table | Full content width, no inner frame. Sticky header and sticky first column, freeze 1-3, drag to reorder columns, column chooser popup (all properties, search, checkboxes, reflects the saved view), inline edit (click cell, select, save) under panel permissions (R07). Horizontal scroll only on real overflow. Row height = density setting. |
| Bulk bar | Appears on selection, floats at the bottom-centre at 1440 (elevated, not a line) and docks above the bottom bar at 375: count, assign, status, add to segment, delete (confirm), clear. |
| Row click | Opens the record **drawer** (preview); "Open full page" in the drawer header. |
| 375 | Table becomes a card list: line 1 = display name + status; line 2 = channel/source + owner; line 3 = key metric (value, due, age). Tap = full page. Filters and columns open as a bottom sheet. Selection mode via long-press. |
| Empty | Says why (no data / no match / not connected) and offers the one next action. Filtered-empty shows "Clear filters". |

### 0.4 Record pattern (contact, lead, deal)

| Zone | Content |
|---|---|
| Header | Display name (single field), type chip, owner, action cluster at the logical end: call, mailto, WhatsApp (R09), "Log activity" as the primary action. Overflow: Merge, Add to segment, Delete. |
| Highlights strip | Up to 6 attributes in one elevated band: contact = lifecycle, owner, phone, email, first-touch source, open deal value; deal = value, stage, close date, owner, origin, stale flag. |
| Three regions | Logical start: detail cards (collapsible, reorderable). Middle: composer on top, then the single timeline. Logical end: associations (leads, deals, segments with "Add to segment", consent card). Regions are separated by gaps (Attio-style), cards by elevation. |
| Timeline | One stream. Chips **All / People / System**. People events (notes, calls, tasks, stage changes by hand) always visible; System events (touches, form submits, consent, conversion events queued/sent/rejected) collapsed by default, grouped, with a distinct neutral treatment. Corrections marked. Times in browser zone with UTC on hover. |
| 375 | Stack: header, highlights (horizontal scroll, 2 visible), then segmented switch **Timeline / Details / Related**. Actions as a sticky bottom bar (call, WhatsApp, log). |

### 0.5 Drawer vs full page

| Use a **drawer** (side sheet, logical end; bottom sheet at 375) | Use a **full page** |
|---|---|
| Quick preview of a row, create/edit of a small object (task, deal, note), filters, column chooser, user invite, property edit, ledger row detail | Records with a timeline (contact, lead, deal), builders (segment, report), multi-step flows (import, merge, connect), anything that needs the URL to be shared or back-button safe |
| Closes on Esc and outside click; preserves list state; one drawer at a time | Has breadcrumb back to the list with filters preserved |
Dialogs only for destructive confirmation and consent-bearing actions.

### 0.6 States

| State | Pattern |
|---|---|
| Loading | Skeleton of the final layout; no centred spinner. Buttons show inline progress and stay the same width. |
| Empty (first use) | Icon-free text block: what this is, why empty, one action. Tiles with ad data show "Not connected" with a link to Integrations. |
| Empty (no match) | "No results for these filters" + clear action; count stays visible. |
| Error | Inline in the failing region (card/table), message in AR/EN with a retry; the rest of the page stays usable. 403 names the missing permission without leaking data. |
| Not connected | Region-level state with the platform name, one "Connect in Administration > Integrations" action (managers) or "Ask your manager" (others). CRM-only data still shows. |
| Stale | Banner chip "Last updated <time>" when platform pull > 24 h; numbers stay visible, never hidden. |
| Success/undo | Toast with undo for reversible actions (merge has an undo window, DEV-CONFIRM). |

### 0.7 CRM numbers vs platform numbers

| Rule | UI consequence |
|---|---|
| Two sources, never silently summed | Every metric carries a source marker: **CRM** (our records) or **Platform** (Meta/Google/TikTok pull). Mixed tables use two column groups with group headers. |
| Gap is shown, not hidden | "Platform leads vs CRM leads" gap column (RP7). Unmatched spend and unattributed revenue are explicit rows. |
| Attribution note | One persistent line on Ads insights, Reports and Dashboard ad tiles (SPARK 5.5 text). |
| Currency | Per client, own currency, no conversion; roll-up shows one currency per client row (D-07-8). |
| Won revenue | Labelled "Won deal value", not "paid revenue" (D-07-6). |

---

## 1. Shell

### 1.1 Sidebar

| Field | Spec |
|---|---|
| Purpose | Move between modules and always show which client workspace you are in. |
| Users / roles | All. Items hidden by capability; module groups absent (not greyed) when not entitled. |
| Regions | (1) Brand. (2) **Workspace block**: client name, plan/status line, "Switch client" (AG only). (3) Scrolling nav: Overview, CRM, Marketing, module groups, Insights, Administration. (4) Footer: profile, language, theme. |
| Primary action | None in the sidebar. A global "+ Create" lives in the top bar. |
| Key components | Group disclosures with `aria-expanded`, active-branch auto-expand, per-user persisted state, nested Deals > Pipeline with its own disclosure button, coming-soon dot at the row end, no icon-only rail. |
| States | Item active / hover / focus / disabled (coming soon); collapsed group; tenant switching (skeleton in content, announced). |
| Changes | New Marketing group and Overview/Insights order (D-05). Workspace name replaces UUID. Coming-soon badge text becomes a dot. Segments move out of CRM. |
| R-items | R06. |
| 375 | Not shown; replaced by bottom bar + More sheet. |
| AR/RTL | Sidebar on the right; chevrons and the active indicator mirror; dot sits at the left end of the row. |

### 1.2 Top bar (client switcher + search)

| Field | Spec |
|---|---|
| Purpose | Global scope, search and create. |
| Regions | Logical start: breadcrumb/page title context. Centre: global search (contacts, leads, deals, segments, pages; command-palette style). Logical end: "+ Create" (primary, one in the shell), notifications, profile. |
| Client switcher | AG only. A control holding client name + status; opens a popover list with search, pinned and recent clients, set default. Switching clears selection, drawers and import drafts and announces the new workspace. CL users see the name, no switcher. |
| States | Search empty (recent items), loading, no results, no permission; switcher with one client (static label). |
| Changes | Switcher visible at the logical start of the shell instead of only in a profile menu. Global search is new. |
| R-items | R06. |
| 375 | Top bar reduces to workspace name (tap = switcher sheet), search icon (full-screen search), profile. Create moves to the More sheet and to page-level actions. |
| AR/RTL | Search and results mirror; typed Latin text keeps `dir=auto`. |

### 1.3 Mobile bottom bar and More sheet

| Field | Spec |
|---|---|
| Purpose | Four daily destinations plus everything else. |
| Regions | Bottom bar: Leads, Contacts, Deals, Tasks, More (kept from the current spec). More = bottom sheet with the workspace header (name, switch), then the same grouped hierarchy, gates and coming-soon dots, scrollable, search field on top. |
| Primary action | None; the sheet's close handle at the top. |
| States | Active tab; badge count on Tasks (overdue); sheet open/closed; scroll position kept. |
| Changes | More now lists Dashboard, Marketing, Insights, Administration with the new groups; depth <= 2 taps. |
| 375 | This is the 375 behaviour. Bar height 56 px plus safe area; targets >= 44 px. |
| AR/RTL | Tab order mirrors; sheet handle centred; list rows right-aligned. |

---

## 2. Sign-in

| Field | Spec |
|---|---|
| Purpose | Sign in and reach the right workspace. |
| Users | AG and CL, no role yet. |
| Regions | Single centred card on a quiet surface: product mark, title, email, password, "Forgot password", primary "Sign in". After credentials: 2FA step in the same card. After sign-in: AG with several clients land on the roll-up; CL land on their dashboard. |
| Primary action | "Sign in", full width at the bottom of the card (end of its own region). |
| Key components | Styled inputs with show/hide, language switch (AR/EN) at the card corner, inline errors. |
| States | Invalid, locked, 2FA required / code expired, offline, password reset sent. |
| Changes | Standard sign-in + 2FA only; magic link and Login As are out (D-02, D-03). Neutral card, workspace name shown after email lookup only if safe. |
| R-items | none directly (R12 kit rule applies). |
| 375 | Card becomes full-screen form; button pinned above the keyboard. |
| AR/RTL | Email and code fields keep LTR content with right-aligned label; digits Latin. |

---

## 3. Overview: Dashboard (two tiers)

| Field | Spec |
|---|---|
| Purpose | Show what needs attention and how the period is going. |
| Users / roles | **Agency roll-up**: AG with all/selected-clients scope. **Client**: CL M/R tenant-wide, P "Mine"; AG inside one client sees this tier. |
| Regions (client tier) | 1 Header: title, scope (client, range, compare), range picker, "Customize" (end). 2 KPI strip: 7 headline KPIs (SPARK 1.2) with delta vs previous period. 3 Attention row: untouched leads past SLA, overdue tasks, stale deals. 4 Chart grid: RP1 funnel, RP2 leads by source, RP8 pipeline health, RP5 summary. 5 Lower: C4 tasks due, C5 recent activity. Footer line: "as of", time zone, attribution note. |
| Regions (roll-up) | Header with client filter. 7 KPIs aggregated. **Attention list** (clients with problems: disconnected, stale pull, rejected conversions). Client table: spend, leads, cost per qualified, won deal value, CRM-ROAS, health flags, trend sparkline; each row in its own currency; click opens that client's dashboard. Aggregates only, no contact rows (D-07-1). |
| Primary action | Client: "Customize" is secondary; the page's primary is none (monitoring page) except "New lead" in the global Create. Roll-up: none. |
| Key components | KPI tile, delta chip, shared chart theme (labels short "Nov", light gridlines, no rotated labels, empty leading months trimmed, default 30 d KPIs / 6 m trend), source markers CRM/Platform, grid with drag-by-title and resize-by-gap. |
| States | All zero: "No data for this period" + hint. Ad tiles "Not connected". Stale pull banner. Per-tile error/403. Loading skeleton grid. |
| Changes | Two tiers; KPI strip with deltas; attention row; lead-source quality; agency roll-up is new; charts themed (R04). |
| R-items | R04, R03 (no navy tiles). |
| 375 | Single column; KPI strip scrolls horizontally (2.3 tiles visible); charts stack, each with a simple list fallback; roll-up table becomes client cards. |
| AR/RTL | Charts keep axis order by time right to left in AR; numerals Latin; legends at the logical end. |

---

## 4. CRM

### 4.1 Leads

| Field | Spec |
|---|---|
| Purpose | Triage new leads fast and follow up. |
| Users / roles | M all + bulk assign; P own + unassigned pool; R read; CL own workspace. |
| Regions | Header (title, scope, **New lead** at the end, overflow: Import, Export). KPI strip: new, untouched, qualified, missing contact (neutral). Saved views: New and untouched, My leads, From ads, Missing contact, Stale, All. Toolbar. Table. Row drawer. |
| Primary action | "New lead" at the logical end of the header; requires phone or email (AR/EN validation). |
| Key components | Display-name rule: person, else company, else email/phone, else "Untitled lead" (R10). Default columns: name+company, phone, email, source, campaign, ad, status, owner, created, age, first contact/untouched, consent. Inline status edit, click-to-call/WhatsApp icons (R09). "Missing contact" flag. |
| States | Empty: "No leads yet" + whether a form/ad source is connected. Filter-empty. Masked identifiers. Create-blocked error. |
| Changes | Phone and email visible; source/campaign/ad columns; speed-to-lead cue; full-width table with column controls; no navy KPI. |
| R-items | R03, R07, R08, R09, R10. |
| 375 | Card list (name, channel, status; owner; age); KPI strip scrolls; New lead as sticky bottom button. |
| AR/RTL | Phone and email isolated LTR inside RTL cells; name `dir=auto`; table first column at the right. |

### 4.2 Contacts

| Field | Spec |
|---|---|
| Purpose | Find, segment and maintain people. |
| Users / roles | M edit all; P own scope; R read; CL own workspace. |
| Regions | Header (**New contact**, overflow: Import, Merge duplicates, Export). Views: All, My contacts, Customers, Recently active, No owner, Duplicates suspected, Unknown consent. Toolbar with Segment filter (D-01). Table with segment chips column. Bulk bar includes "Add to segment". |
| Primary action | "New contact" at header end. |
| Key components | Same grid kit as Leads; lifecycle chip; first/latest-touch source; consent column; drawer preview. |
| States | As list pattern; "Duplicates suspected" count badge. |
| Changes | Segments no longer a separate CRM item but reachable here; phone/email/company/job title as first-class columns. |
| R-items | R07, R08, R09. |
| 375 | Card list; filters in a bottom sheet. |
| AR/RTL | As Leads. |

### 4.3 Contact / lead record with journey timeline

| Field | Spec |
|---|---|
| Purpose | Know who this is, what happened, what is next. |
| Users / roles | M edit and consent; P own scope and log activity; R read; masking by permission. |
| Regions | Per section 0.4. Start: details, custom properties. Middle: composer (note, call, WhatsApp, email, task) then timeline. End: associations (leads, deals), segment membership with "Add to segment", **consent card** (status, purpose, source, time, notice version; M-only change), first/latest touch card. |
| Primary action | "Log activity" at the logical end of the header (opens the composer). |
| Key components | Highlights strip, timeline chips All/People/System, system-event groups (touch, form, consent, conversion queued/sent/rejected with reason), frozen first/last touch snapshot. |
| States | New record with no activity ("Nothing yet" + log first activity); timeline loading skeleton; system events empty ("No tracked visits yet"); masked fields; merged-away redirect notice. |
| Changes | One unified timeline with People/System separation; highlights strip; visible actions; consent and source cards; segment membership. |
| R-items | R09, R10, R08. |
| 375 | Section 0.4 stack with sticky action bar. |
| AR/RTL | Region order mirrors (details at the right); timeline time stamps at the logical end; mixed-language notes `dir=auto` per entry. |

### 4.4 Merge

| Field | Spec |
|---|---|
| Purpose | Combine duplicates safely. |
| Users / roles | M only (merge capability); P may flag; R none. |
| Regions | Full-page flow, 3 steps. 1 **Duplicate queue** or pick pair (matched key email/phone, score reason). 2 **Review**: side-by-side, only conflicting fields shown, per-field radio choice, survivor selector; rule notes (consent most restrictive, touches unioned, first touch earliest). 3 **Preview and confirm**: resulting record, loss list, effects on deals/segments. |
| Primary action | "Merge" at the logical end of the sticky footer of step 3 (back is at the start). |
| Key components | Compare table without zebra, survivor badge, loss list, undo toast. |
| States | No duplicates: "No suspected duplicates" + counts by key; conflict-free (auto-ready); permission denied; failed merge with safe message. |
| Changes | Conflict-only rows, explicit survivor, preview before commit. Never auto-merge on name alone. |
| R-items | none (R08 single name). |
| 375 | One field conflict per card, swipe/next; summary step at the end. |
| AR/RTL | Survivor column on the right in AR; arrows mirror. |

### 4.5 Deals and the deal record

| Field | Spec |
|---|---|
| Purpose | Track value, stage and close date. |
| Users / roles | M all; P own; R read; value fields respect sensitive permission. |
| Regions | Header (**New deal**, view switch List | Board where Board = Pipeline). Views: Open, Closing this month, Stale, Won, Lost, Mine. Table with value+currency, stage, close date, owner, age in stage, origin, status. Record: section 0.4 with deal highlights; associated contact/company; stage history; origin card. |
| Primary action | "New deal" at header end. Marking Lost opens a drawer asking a reason code; Won stores date and value. |
| Key components | Stage chip, stale mark, origin chip ("no source" when missing), loss reason select. |
| States | "No deals yet"; deals without origin; read-only for R. |
| Changes | Same anatomy as contacts; origin snapshot; reason codes; list/board toggle. |
| R-items | R01, R08. |
| 375 | Card list (title, value, stage); record per 0.4. |
| AR/RTL | Currency code beside amount, number isolated. |

### 4.6 Pipeline

| Field | Spec |
|---|---|
| Purpose | Move deals and see where the money is stuck. |
| Users / roles | M edits stages; P moves own deals; R read. |
| Regions | Header: title, pipeline selector (visually-hidden label, same 36 px baseline), **New deal** at end. Stage board using the full content width: each column header = name, count, value per currency, weighted value (if probabilities). Cards: title wraps to 2 lines, value, contact, age in stage, owner, stale mark. "Pipeline settings" drawer: add, rename, reorder, archive stages; stale-after days per stage. |
| Primary action | "New deal" at header end. |
| Key components | Drag-and-drop (React Aria DnD, keyboard-accessible, RTL), drop-target highlight, column totals, median days per stage as the guide. |
| States | Empty stage keeps count 0; drag in progress; move rejected by transition rule (inline message, card snaps back); Won/Lost never stale; real overflow = whole board scrolls with snap. |
| Changes | No inner boxed frame; all 6 stages fit at 1440 (min ~200 px); wrapped titles; stage settings screen; stale rule. |
| R-items | R01, R02, R08. |
| 375 | Stage switcher (segmented scroller) showing one column at a time; "Move to stage" menu replaces drag. |
| AR/RTL | First stage at the right; drag direction and scroll snap RTL-correct. |

### 4.7 Tasks

| Field | Spec |
|---|---|
| Purpose | Do today's follow-ups and clear overdue ones. |
| Users / roles | P own; M all + reassign; R read. |
| Regions | Header (**New task**). Views: Due today, Overdue, Upcoming, Completed, Assignee: Me. List grouped by day; columns type, title, related record, due, assignee, overdue by. Task drawer. |
| Primary action | "New task" at header end; row checkbox completes. |
| Key components | Types: First contact, Follow-up, Qualification call, Send quote, Booking, Other. Outcome select on completion of outreach types. SLA breach mark for overdue First contact. |
| States | "Nothing due" empty; completing without outcome blocked with inline message; reschedule menu. |
| Changes | Typed tasks tied to lead SLA; outcomes; default views; drawer instead of a page. |
| R-items | R07 (grid kit). |
| 375 | Agenda-style list with big checkboxes; bottom "New task". |
| AR/RTL | Checkbox at the start (right); due dates localised with Latin digits option. |

### 4.8 Import

| Field | Spec |
|---|---|
| Purpose | Bring a file in without breaking data. |
| Users / roles | M only, MFA; AG or CL manager. |
| Regions | Full-page stepper (1 Upload, 2 Map, 3 Review, 4 Confirm, 5 Result) with the stepper as a spaced row, content card, sticky footer (Back at start, **Next/Import** at end). Step 1 DropZone + FileTrigger + file chip; step 2 mapping table (incl. source fields, optional consent mapping, create-property inline); step 3 error preview; step 5 status and downloadable failed rows. Import history list reachable from the header. |
| Primary action | "Next" / "Import" at the logical end of the sticky footer. |
| Key components | Update-vs-create selector (Skip default / Update / Create), error table with code and safe AR/EN message, retryable flag. |
| States | No file; zero valid rows; row errors (`lead.contact_required`); running job; failed job; history empty. |
| Changes | Styled drop zone replaces the native file button; source and consent mapping; error report with CSV; job history; workspace name replaces UUID. |
| R-items | R12, R06, R09. |
| 375 | Steps collapse to "Step 2 of 5" header; mapping rows become stacked cards. |
| AR/RTL | Stepper runs right to left; column names `dir=auto`. |

---

## 5. Marketing

### 5.1 Ads (with the not-connected state)

| Field | Spec |
|---|---|
| Purpose | See ad structure and the health of data flowing both ways. |
| Users / roles | M sync controls; P, R none (hidden); AG edits; CL manager views. |
| Regions | Header: title, scope, per-platform **connection chips** (Meta/Google/TikTok: healthy / reauth needed / disconnected) at the end. Tree table: account > campaign > ad set > ad with status, objective, spend, CRM leads, qualified, won; **conversion delivery** and **audience sync** status chips per row. Row drawer: delivery and sync detail, pause delivery, bind audience. |
| Primary action | None for creating ads (deferred); "Sync controls" are row actions. Reconnect lives on the chip and links to Integrations. |
| Key components | Expandable tree rows, source markers (Platform spend vs CRM leads), chips. |
| States | **Not connected**: region-level block "Connect Meta, Google or TikTok in Administration > Integrations" with the requirements link; "First sync pending"; stale pull banner; permission-hidden controls. |
| Changes | New page. Connections do not live here (D-05); only the status chip and empty state. |
| R-items | R07 (grid kit). |
| 375 | Campaign cards with expandable children; chips wrap under the title. |
| AR/RTL | Platform names stay Latin; metrics isolated. |

### 5.2 Ads insights

| Field | Spec |
|---|---|
| Purpose | Answer which campaign and ad make qualified leads and money. |
| Users / roles | M, P (own leads' CRM outcomes), R view. |
| Regions | Header (range, compare, platform), **filter bar**, attribution note (always visible), metric table by level (platform, campaign, ad set, ad, day/week, placement) with two column groups: Platform (spend, impressions, clicks, CTR, CPC, platform leads) and CRM (CRM leads, lead gap, qualified, won, won deal value, CRM-ROAS, cost per lead/qualified/won). Charts: RP4, RP6, RP7, RP15, shared RP5 "Revenue by campaign". |
| Primary action | "Save view" (secondary) / "Share" at header end; no destructive primary. |
| Key components | Group-headed table, compare deltas, drill rows, unmatched-spend and unattributed-revenue rows. |
| States | Not connected: CRM-only columns by UTM campaign with a "Connect to see spend" line; stale pull banner; empty range. |
| Changes | New page; separates platform from CRM numbers (0.7). |
| R-items | R04 (chart theme), R05, R07. |
| 375 | Level selector + metric cards; two-metric chips chosen by user; table is optional "Full table". |
| AR/RTL | Group headers mirrored; delta arrows keep meaning (up = good) not direction. |

### 5.3 Segments: list and builder

| Field | Spec |
|---|---|
| Purpose | Define audiences from CRM data and sync them to ad platforms. |
| Users / roles | M create/edit/sync; P view and use in Contacts; R view. |
| Regions (list) | Header (**New segment**). Table: name, object (contact/lead), type live/static, CRM count, with-identifier count, consent-eligible count, last calculated, owner, sync status per platform. Row drawer: summary and members preview. |
| Regions (builder, full page) | Header with name field (single), object, type, **Save** at the end. Start region: rule builder (field / operator / value rows, groups nested to 2 levels, AND/OR, NOT). End region: live **count panel** (CRM count, with identifier, consent-eligible), sample members, platform sync card (choose platform, status). Footer: "Save filter as segment" entry also from Contacts. |
| Primary action | List: "New segment". Builder: "Save segment" at header end. |
| Key components | Rule rows with styled selects, operator list by type, "Missing is not false" hint, segment-in-segment limited to static, template suggestions. |
| States | "No segments yet" + templates; recalculating; count loading skeleton; sync error with reason; too-small audience warning (platform minimum, UNVERIFIED). |
| Changes | Segments move to Marketing (D-01) and stay reachable from Contacts; live and static types (D-07-3). |
| R-items | R07, R08. |
| 375 | List as cards; builder as stacked rule cards, count pinned in a collapsible bottom bar. |
| AR/RTL | Rule row reads right to left (field, operator, value); AND/OR badges mirrored. |

### 5.4 Forms

| Field | Spec |
|---|---|
| Purpose | See what forms feed leads and whether they convert. |
| Users / roles | M edit mapping; P view; R none. |
| Regions | Header (**Connect form** if module on). List: name, status, destination pipeline/owner, submissions (period), conversion to qualified, source channel, consent notice version. Form drawer: field map to properties, last submissions (id, lead, time, spam/dup outcome). Platform lead forms listed with field map and last lead received. |
| Primary action | "Add form" at header end (manager). |
| States | "No forms connected"; coming soon where the module is not live (disabled item with dot); mapping incomplete (email/phone required). |
| Changes | New page. |
| R-items | R07. |
| 375 | Card list; mapping in a full-screen sheet. |
| AR/RTL | Field labels bidi-safe. |

### 5.5 SEO

| Field | Spec |
|---|---|
| Purpose | Honest organic view: which landing pages bring leads. |
| Users / roles | M edit, P view, R none. |
| Regions | Header (range). Table of organic landing pages: sessions-with-touch, leads, qualified, won; "Organic/direct" row for UTM-less. Chart of leads by landing page. Search Console block later (hidden). |
| Primary action | None. |
| States | "No organic data"; coming soon (disabled with dot) until the aggregation exists. |
| Changes | New, deliberately minimal (D-07-7). |
| R-items | none. |
| 375 | Card list. |
| AR/RTL | URLs isolated LTR. |

---

## 6. Module group: Commerce (placeholder)

| Field | Spec |
|---|---|
| Purpose | Show how a module group appears and behaves; Commerce is the first example. |
| Users / roles | Appears only when the workspace has the entitlement (absent, not greyed). Same role gates. |
| Regions | Sidebar: a group between Marketing and Insights with children Orders, Products, Customers (value). Each child opens a standard list page (list pattern). Customers view: value, orders, last order. Segment templates "repeat customers", "lapsed 90-180 days" appear in Segments. Reports RP16 appears in Insights. |
| Primary action | Per child list (e.g. "New order"), end of header. |
| States | Module off: group and RP16 disappear, data kept (D-06); activity excluded or labelled in reports. Module on, no data: standard empty with "Connect your order source". |
| Changes | New concept; pattern proven once, reused for Restaurants later. |
| 375 | Group appears in the More sheet with the same hierarchy. |
| AR/RTL | Group label AR "التجارة". |
| Note | Blueprint only; specific Commerce page designs are outside this round. |

---

## 7. Insights

### 7.1 Reports: catalogue, report view, dashboard

| Field | Spec |
|---|---|
| Purpose | Answer a business question with a report, compare periods, drill down, share. |
| Users / roles | M all; P own scope; R read, no export. AG roll-up variants per client. |
| Regions: **Catalogue** | Header (**New report**, search). Question-led cards grouped by theme (Leads, Sales, Team, Data trust): the question as title, chart thumbnail, owner, last viewed, home label. Saved reports row. |
| Regions: **Report view** | Header with report title as the question, scope, share and export at the end. Filter bar (range, compare, source, campaign, owner, pipeline, segment). Main chart; supporting table; drill-down opens the filtered list (leads, deals, campaign). Saved views chips. |
| Regions: **Dashboard** | Grid of report cards, drag by title, resize by gap; "Add report"; Share access levels full / read-write / read-only / none. |
| Primary action | Catalogue: "New report"; report view: "Share"; dashboard: "Add report", all at header end. |
| Key components | RP1-RP3, RP8-RP14, RP16 live in Reports; RP4-RP7, RP15 in Ads insights; RP5 shared. Chart theme (R04). Attribution note. |
| States | Each card with own empty / error / 403 naming the missing data; export hidden for R; stale banner for platform data. |
| Changes | Rebuilt as a question-led catalogue, shareable dashboards, filter bar, drill-down; replaces the clipped table. |
| R-items | R05, R04, R07. |
| 375 | Catalogue as list; report view chart first then table as cards; filter bar in a bottom sheet. |
| AR/RTL | Axes and legends mirrored; exported CSV keeps headers in the UI language. |

### 7.2 Journeys & tracking

| Field | Spec |
|---|---|
| Purpose | Trace leads to the ad that produced them and judge tracking health. |
| Users / roles | M, P own scope, R read; AG per workspace. |
| Regions | Header (range). Two views switched by a spaced segmented control. **Journey list**: lead/contact, first touch, latest touch, touches, days to lead/qualified/won, lifecycle. **Source health**: meters for share of leads with known source, with click ID, with UTM, unknown/direct rate, tracking-gap flags. Row opens the record with its timeline. |
| Primary action | None; "Install tracking" (manager) appears only in the empty state. |
| States | "No tracked visits yet: install the snippet or connect a form"; gap flags; coming soon until backend exists. |
| Changes | New consolidated screen; record timeline remains the detail view. |
| R-items | R05 (supports). |
| 375 | List as cards; health as stacked meters. |
| AR/RTL | Source names Latin-isolated. |

---

## 8. Administration

### 8.1 Integrations: connections, event mapping, delivery ledger

| Field | Spec |
|---|---|
| Purpose | Connect ad platforms and prove data flows both ways. |
| Users / roles | M with MFA and `integration.manage`; P, R none; AG assists; no tokens shown to CL. |
| Regions | Header (title, scope). Sub-views as a spaced segmented control: **Connections**, **Event mapping**, **Delivery ledger**. Connections: one card per platform: account/page/dataset names (never IDs only), who connected and when, scopes granted vs needed, health (token state, last pull, last lead, webhook event, delivery counts 24 h/7 d, audience sync, lag, last error), lead-form field maps. Event mapping: row per trigger to platform event, value source, currency, platforms on/off, role, status; guards shown inline; forward-only versioning notice. Ledger: time, event, record, destination, status, reason, attempts, lag, version, consent decision; filters; row drawer. |
| Primary action | Connections: "Connect" per card (card's own end). Mapping: "Add mapping" at end of the region header; "Activate" in a row drawer. |
| Flow | Connect = full-page flow: business login > choose advertiser account > map form fields > confirm. |
| States | Not connected with requirements checklist (business verification, access level); reauth needed; expiring token; test mode; ledger empty; reconciliation alert. |
| Changes | New hub; single home for connections (D-05); two-way status visible. |
| R-items | R07 (ledger grid). |
| 375 | Cards stacked; mapping rows as expandable cards; ledger as cards. |
| AR/RTL | Event and platform names Latin-isolated. |

### 8.2 Users & roles

| Field | Spec |
|---|---|
| Purpose | Control who can do what in a workspace. |
| Users / roles | M manages; agency-only rows hidden from CL. |
| Regions | Header (**Invite user**). List: user, role (M/P/R), workspace(s), status, 2FA, last sign-in, scope (all/own). AG users carry agency type (all clients / selected clients). Invite and edit in a drawer (email, role, scope). Role help card explaining M/P/R. |
| Primary action | "Invite user" at header end. |
| States | Pending invitation; 2FA off warning; last manager cannot be removed (inline error). |
| Changes | New page; no Login As, no magic link. |
| R-items | R07, R08. |
| 375 | Card list; drawer as bottom sheet. |
| AR/RTL | Emails LTR-isolated. |

### 8.3 Settings: Properties and Security

| Field | Spec |
|---|---|
| Purpose | Shape the data model and security policy. |
| Users / roles | M edit; others read. |
| Regions | Settings is a disclosure with two children. **Properties**: header (**New property**), object tabs (Contact, Lead, Deal), groups, list with system properties (read-only, lock marker) and custom ones; email, phone, url types available; single label field; New property in a drawer (name, type, group, options). **Security**: 2FA enforcement, session rules, password policy, SLA minutes (default 15, working hours), stale thresholds, time zone, week start. |
| Primary action | "New property" at header end; Security "Save changes" in the sticky footer end. |
| States | System property locked; type change blocked when data exists; validation messages with hints in a reserved row (no field jumps). |
| Changes | One name field; Email/Phone/Company/Job title as system properties; new types; Security page becomes real. |
| R-items | R08, R09, R11. |
| 375 | Object switcher as a select; property list as cards; drawer as a bottom sheet. |
| AR/RTL | Name inputs `dir=auto`, no forced LTR. |

### 8.4 Modules & presets (agency only)

| Field | Spec |
|---|---|
| Purpose | Switch modules and apply a business-type preset per client. |
| Users / roles | AG only; invisible to CL. |
| Regions | Header (client name, **Apply preset**). Preset selector (Core, Commerce, Real estate, Clinic) with a "What each adds" summary (events, segment properties, menu). Module toggle list (Commerce, later Restaurants) with description. Change log (who, when). |
| Primary action | "Apply preset" at header end, with a confirm showing what will appear/hide. |
| States | "No modules enabled"; switching off warns "hidden, data kept"; clinic note: appointments stay internal. |
| Changes | New page (D-06 assumption). |
| 375 | Stacked cards. |
| AR/RTL | Standard. |

---

## 9. The 5 biggest changes vs today

1. A new **Marketing** group (Ads, Ads insights, Segments, Forms, SEO) and two-tier navigation with module groups that appear only when enabled.
2. **Agency roll-up dashboard** plus a client dashboard with a KPI strip, attention row and themed charts.
3. **Records rebuilt**: highlights strip, three regions, one timeline with People/System, visible call/WhatsApp/mailto, consent and source cards.
4. **Grids rebuilt** as one kit: full width, no inner frames, freeze/reorder/chooser/inline edit, card lists at 375; Pipeline with drag-and-drop and stage settings.
5. **Reports rebuilt** as a question catalogue with shareable dashboards, and Integrations as the single home of connections, event mapping and the delivery ledger; CRM and platform numbers always separated.

## 10. Open questions for Ahmed

| # | Question | Default if no answer |
|---|---|---|
| Q1 | Should the global "+ Create" button live in the top bar (proposed) or only on pages? | Top bar. |
| Q2 | Roll-up dashboard: is a per-client trend drawer enough, or a full comparison page? | Drawer. |
| Q3 | Does the dashboard have a primary action, or is "Customize" enough? | Customize only. |
| Q4 | Tasks and Merge as drawer vs full page: confirm Tasks = drawer, Merge = full page. | As written. |
| Q5 | Clinic preset: appointments never leave the CRM (confirm). | Never sent. |
| Q6 | Is the Commerce placeholder enough, or should one Commerce list be designed in C2? | Placeholder only. |
| Q7 | Pipeline at 375: stage switcher (proposed) or horizontal scroll with snap? | Stage switcher. |
