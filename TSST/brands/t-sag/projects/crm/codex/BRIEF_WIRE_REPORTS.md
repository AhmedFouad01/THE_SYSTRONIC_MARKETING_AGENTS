CODEX REQUEST WIRE-REPORTS-1 · t-sag · crm (C2 wireframes, TRIAL: Reports page) · from TSST Lead · 2026-10-09
SURFACE: Codex (desktop)

## Steps for Ahmed
1. In Codex, open the **workspace folder `C:\Work\tsst-crm-reports-trial`**. Do not open the Drive folder; that is what broke Codex last time.
2. Paste everything inside the PROMPT block.
3. When it finishes, tell the Lead. The Lead copies `deliverables\` into Drive and reviews it.

## PROMPT

```text
ROLE: EXTERNAL TOOL (ROLE B). Build one page of a UI prototype. You are NOT a TSST agent: no TSST boot, no bus tasks, no git commits. Work ONLY inside C:\Work\tsst-crm-reports-trial. Never touch any other folder.

CONTEXT
This folder is a Vite + React 19 + TypeScript + Tailwind v4 + HeroUI v3 prototype of "Datatronic CRM" by The Systronic. It already has the app shell (sidebar with the brand block, top bar), the theme tokens, light/dark, AR (RTL)/EN, and views driven by URL params: ?view=leads|dashboard|signin|contact&theme=light|dark&dir=ltr|rtl.

READ FIRST (all in refs\)
1. refs\03b_PAGE_REDESIGN_REPORT.md: section 0 (shared patterns 0.1–0.7) and section 7.1 "Reports: catalogue, report view, dashboard". This is the plan.
2. refs\02_SPARK_SCREEN_DATA.md: the "Reports" row in the screen table, and section 5 "Reports rebuild (R05)" with the report catalogue RP1..RPn (question, chart, dimensions, filters, drill-down). The time-basis rule (cohort vs event) and the CRM-vs-platform labels are mandatory.
3. refs\DESIGN.md: theme rules, palette roles, chart series order, the state matrix and logo usage. Follow it exactly.
4. refs\DECISIONS.md: D-05 menu, D-07 (money in the client's own currency, default EGP, no conversion), D-09 palette, D-10 Western digits.
5. refs\shots\: the approved look (contact page, dashboard). Match their quality and spacing.
6. src\: reuse the existing shell, tokens, i18n dictionary and components. Do not restyle the shell or the brand block.

SETUP
- Run: npm install
- Add exactly two packages, pinned: chart.js@4.5.1 and react-chartjs-2@5.3.1 (already approved for this product). Add nothing else.

STYLE TARGET: "HeroUI Pro" level
The owner wants this page to feel like the HeroUI Pro dashboards and analytics blocks: dense but calm, KPI cards with a small trend chip and sparkline, clean chart cards with a title, subtitle and toolbar, soft surfaces, and generous but tight spacing.
- You MAY look at the public pages of heroui.pro and heroui.com for visual reference only.
- Do NOT copy, download or install any HeroUI Pro code or package. It is a paid product. Build everything yourself with the free @heroui/react 3.2.6 components plus chart.js.
- HeroUI v3 uses compound components (e.g. Tabs > Tabs.ListContainer > Tabs.List > Tabs.Tab + Tabs.Indicator; Table > Table.ScrollContainer > Table.Content > ...). Check the real API in node_modules\@heroui\react types and in src\ before writing. Do not guess from v2 docs.

WHAT TO BUILD: view "reports" (?view=reports), with Insights > Reports active in the sidebar
A. Page header per 0.2: title with the red bar, a one-line subtitle, the primary action ("New report" or "Save view"), and "Export CSV".
B. Filter bar: date range, compare to previous period, source, campaign, owner, pipeline, segment. Plus saved views as tabs or chips. Use HeroUI controls only.
C. KPI strip, 4–6 cards, e.g. leads, qualified rate, median speed-to-lead vs SLA 15 min, won deal value (EGP), CRM-ROAS. Each card has a value, a delta vs the previous period, a sparkline, and a CRM or PLATFORM source tag.
D. Report cards grid using the catalogue in SPARK section 5. At least these, each with its chart type as written there:
   - RP1 lead funnel (cohort);
   - RP2 leads by source over time;
   - RP3 speed-to-lead histogram + median;
   - RP8 pipeline health;
   - "Revenue by campaign" (shared with Ads insights).
   Each card shows: its question as the title, the time-basis label (Cohort / Event), the attribution note where ad credit is used, a "still maturing" marker where SPARK requires it, and a drill-down affordance ("Open list").
E. Card states: at least one card in the "not connected" state (e.g. needs Meta, with a "Connect in Integrations" action), and one card in the empty state with the missing data named.
F. Charts: use the palette and series order from DESIGN.md (Royal Blue, Impact Red, Legacy Blue, Cyan; tints only beyond that). The tooltips, grid lines and axes must follow the theme in light AND dark. No default Chart.js colours anywhere. In RTL, mirror time axes and legends correctly.
G. Bilingual AR/EN for every label (add the keys to the i18n dictionary). Western digits. Logical CSS properties only. Mixed AR/EN text wrapped with <bdi> so it never breaks.
H. At 375px: KPIs in a 2-column grid, then one card per row, and the filter bar collapses into a "Filters" button that opens a drawer or sheet. No horizontal page overflow.

Theme rules (hard):
- no native browser controls;
- no neutral grey or black surfaces in dark mode;
- no button sitting on a divider line;
- no divider lines everywhere;
- one logo per screen (the sidebar only);
- red is never used as a generic accent: only the heading bar, the active indicator, chart series 2 and "needs attention" (with an icon and a word).

QA (bounded: build, shoot, look, fix once, re-shoot once)
- npm run build (tsc -b && vite build) must pass. Do NOT remove or weaken the tsc step.
- Extend qa\shoot.mjs to shoot the reports view (assert data-theme and dir before each shot). 4 shots: reports_1440_light_en, reports_1440_dark_en, reports_1440_light_ar, reports_375_light_ar.
- Checks: 0 horizontal overflow, 0 console errors, text contrast >= 4.5:1, chart canvases not blank.
- vite base must stay './' so the build opens from file://.

DELIVER (inside C:\Work\tsst-crm-reports-trial\deliverables\)
- shots\ (the 4 PNGs)
- preview\ (a copy of the built dist)
- NOTES.md (<= 30 lines: the sections in order, which RP reports you drew and how, what you borrowed in spirit from HeroUI Pro, where you departed from 7.1 and why, open questions)

END with a short report: what you built, the build/QA results, what is left, and the exact list of files you created or changed.
```
