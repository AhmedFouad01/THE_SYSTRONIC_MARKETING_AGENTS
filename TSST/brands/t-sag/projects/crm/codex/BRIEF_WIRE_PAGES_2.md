CODEX REQUEST WIRE-PAGES-2 · t-sag · crm (C2 wireframes: Reports fixes + 5 pages) · from TSST Lead · 2026-10-09
SURFACE: Codex (desktop), same workspace as WIRE-REPORTS-1

## Steps for Ahmed
1. Open Codex on the **same folder `C:\Work\tsst-crm-reports-trial`**. The same conversation is fine. A new conversation is fine too, because the prompt is self-contained.
2. Paste **PROMPT 1**. When it finishes, tell the Lead, who reviews batch 1.
3. Paste **PROMPT 2** only after the Lead says batch 1 is OK.

## PROMPT 1 (Reports fixes + Dashboard + Pipeline)

```text
ROLE: EXTERNAL TOOL (ROLE B). Same rules as your previous Reports task: work ONLY inside C:\Work\tsst-crm-reports-trial; no TSST boot, no bus, no git commits; add NO new packages (chart.js 4.5.1 + react-chartjs-2 5.3.1 are already there; for drag-and-drop use react-aria-components, which HeroUI v3 already depends on).

Keep everything that the owner approved in your Reports page: the HeroUI Pro-level look, the question-led cards, the cohort/event labels, the CRM-vs-platform honesty, the not-connected and empty states.

STEP 1: FIX THE REPORTS PAGE (Lead review findings)
F1. Arabic text inside the charts (canvas) is drawn in a fallback font and too small. Make Chart.js use the app fonts: IBM Plex Sans Arabic in RTL/AR, Poppins in EN. Set the font family after the fonts load (document.fonts.ready), then redraw. Use the same size as the HTML labels (min 12px).
F2. At 375px in AR, the RP1 funnel's first label "العملاء المحتملون" is clipped at the canvas edge. Reserve enough label width (afterFit / padding) or wrap labels so no label is ever clipped, at any width or language.
F3. The "Won deal value" KPI card: the delta chip wraps to 2 lines. Chips must stay on one line: shorten the format (e.g. "+170k · +81%"), and add a tooltip with the full value if needed.
F4. Cards side by side in the grid have different heights. Make each row's cards equal height, with the footer (owner · viewed, View data, Open list) pinned to the card bottom.
F5. Polish: bars get a small corner radius (4px on the free end only), slightly thinner bars, and softer grid lines, closer to HeroUI Pro chart cards. The palette and series order do not change.
Re-shoot the 4 reports shots after the fixes.

STEP 2: TWO NEW PAGES
Use the same method as Reports: read the plan, reuse the shell, tokens and your Reports components (KPI card, chart card, states, filter bar, saved views), all in AR/EN, light/dark, desktop + 375px, Western digits, logical CSS only, and <bdi> for mixed AR/EN.

P1. Dashboard, full page (?view=dashboard: replace the current top-only version).
   Plan: refs\03b_PAGE_REDESIGN_REPORT.md section 3 "Overview: Dashboard (two tiers)" + 0.7 "CRM numbers vs platform numbers". Data: refs\02_SPARK_SCREEN_DATA.md, the Dashboard rows and the N-node table.
   Must show: both tiers, the CRM vs Platform split, the attention row (things that need action today, red only with an icon + word), one not-connected platform state, and the agency roll-up note (aggregates only, D-07 #1).
P2. Pipeline (?view=pipeline, sidebar CRM > Deals > Pipeline active).
   Plan: 03b section 4.6 + 4.5 (deal fields). Data: the SPARK Deals rows.
   Must show: a stage board (columns with count + EGP value per stage, cards with title, contact, value, owner, age in stage, origin chip, stale flag), drag a card between stages (react-aria-components DnD, keyboard-accessible), "mark lost" requires a reason (dialog), and a toggle to a list view. At 375px: one stage at a time with stage tabs/swipe; no horizontal page overflow.

QA (bounded: build, shoot, look, fix once, re-shoot once)
- npm run build (tsc -b && vite build) must pass; never remove or weaken tsc; vite base stays './'.
- qa\shoot.mjs: assert data-theme and dir before each shot. For EACH new page, 4 shots: <page>_1440_light_en, <page>_1440_dark_en, <page>_1440_light_ar, <page>_375_light_ar.
- Full-page shots: hide the fixed mobile bottom bar during full-page capture or shoot the viewport, so it does not appear in the middle of the image; same for the sidebar (it must look full-height in the shot).
- Checks: 0 horizontal overflow, 0 console errors, text contrast >= 4.5:1, no native controls, no grey/black dark surfaces, chart canvases not blank, no clipped chart labels.

DELIVER (overwrite deliverables\ in place)
- deliverables\shots\: 4 reports shots + 4 per new page.
- deliverables\preview\: the new built dist (one preview for all views).
- deliverables\NOTES.md: keep the Reports notes, add <= 15 lines per new page (sections, what you drew, departures from 03b and why, open questions), and a "Fixes F1–F5" line with what you did for each.
END with a short report: build/QA results, what is left, and the exact list of files created or changed.
```

## PROMPT 2 (Ads insights + Segment builder + Integrations)

```text
ROLE: EXTERNAL TOOL (ROLE B). Same rules and same folder as PROMPT 1 (C:\Work\tsst-crm-reports-trial; no new packages; no TSST boot, bus or git). Apply any Lead review notes from batch 1 to ALL pages first, if the owner pasted them below.

THREE NEW PAGES, same method, components, languages, themes and widths as before:

P3. Ads insights (?view=ads-insights, sidebar Marketing > Ads insights).
   Plan: refs\03b section 5.2 + 0.7. Data: the SPARK "Ads insights" row + the N-node table (N1..N13) + section 5 "Revenue by campaign".
   Must show: KPI strip (spend, CRM leads, lead gap, cost per lead, cost per qualified, CRM-ROAS), a breakdown table by platform > campaign > ad set > ad (expand rows), a period comparison, the attribution note always visible, the "Revenue by campaign" report shared with Reports, "unmatched spend", the stale-pull banner with timestamp, and the not-connected state (CRM-only columns by UTM campaign with "Connect to see spend"). Money per account currency, never converted (D-07).
P4. Segment builder (?view=segment, sidebar Marketing > Segments).
   Plan: 03b section 5.3. Data: the SPARK Segments rows + D-01 + D-07 #3.
   Must show: name + live/static switch, rule groups with AND/OR (field, operator, value, built from HeroUI controls only), a live member count with a small breakdown, a preview list of matching contacts, consent/eligibility counts (who can be sent to which ad platform), the audience sync status per platform (Meta / Google / TikTok: synced, pending, not connected, below minimum), and "Save filter as segment" kept separate from personal saved views.
P5. Integrations (?view=integrations, sidebar Administration > Integrations).
   Plan: 03b section 8.1 "connections, event mapping, delivery ledger" + D-05 (ad-account connections live only here).
   Must show three tabs: (1) Connections: cards per platform with status, account, scopes, last sync, Connect/Reconnect; (2) Event mapping: CRM events (lead created, qualified, won...) → platform conversion events per platform, with value/currency mapping and consent rule; (3) Delivery ledger: a table of sent events with time, event, platform, contact (masked), status (delivered, rejected, retrying), error code + safe message, retry action, and filters.

QA and DELIVER: exactly as in PROMPT 1. 4 shots per new page, one updated preview, NOTES.md gets <= 15 lines per new page.
END with a short report: build/QA results, what is left, and the exact list of files created or changed.
```
