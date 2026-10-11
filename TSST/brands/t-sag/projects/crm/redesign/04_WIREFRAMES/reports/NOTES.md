# Reports prototype
Sections, in order: header/actions; scope/as-of; saved views; filters; five KPI cards; report grid; data-trust states; currency note.
Entry: preview/index.html?view=reports&theme=light&dir=ltr (also dark and rtl).
KPIs: lead cohort size, qualified cohort rate, median first-attempt minutes, event won deal value, CRM attributed won value / Google spend.
RP1: horizontal funnel bars, six achieved steps; cohort; recent two-day maturity label; step rates in its data table.
RP2: weekly stacked columns by source, Saturday buckets, leading empty weeks removed; creation events.
RP3: working-minute histogram and median line; 15-minute working-hours SLA; Open list shows breaches.
RP8: stacked current/stale bars by stage; event-derived snapshot at period end; counts and EGP values in its data table.
RP5: campaign bars plus table; event dates; separate Google spend / CRM measures, unmatched spend and unattributed value.
RP5 includes the persistent attribution note, full explanation, recent-sales maturity and Google account timezone/pull labels.
RP7: Meta not connected; connection action explains the missing account, permission and field mapping in an Integrations sheet.
RP9: empty loss-reason report; required-data action names missing fields.
HeroUI Pro in spirit: compact KPI trend chips/sparklines, calm chart cards, soft surfaces and small toolbars; independently written, no Pro code/assets.
Reused shell, brand block, tokens, fonts, page title and source markers. Sidebar changed only to activate the Reports destination.
Pinned additions only: chart.js 4.5.1 and react-chartjs-2 5.3.1 (its color helper is transitive).
7.1 departure: one question-led catalogue/dashboard hybrid as requested; no drag/resize, access sharing or custom report builder.
7.1 departure: Open list uses a shareable Reports detail/list URL; external Deals/Contacts navigation remains outside this prototype.
Direction conflict: DESIGN.md section 4 takes precedence; time order stays LTR, value axes and legends mirror in Arabic.
Saved views persist locally (maximum six); filters and report/bucket are shareable URL parameters; CSV headers follow UI language.
Data is deterministic, explicitly marked sample data, fixed as of 9 Oct 2026. Future fixture events are excluded from achieved stages.
Money is EGP with no conversion; won deal value is not paid revenue. CRM scope filters do not filter the platform account's spend.
QA: npm run build passed with tsc intact; file:// verified; base './' and the existing classic IIFE build retained.
QA: four requested full-page PNGs; one initial shoot, one fix pass, one final reshoot; all four manually inspected.
QA: zero page overflow, console errors, visible native controls, contrast failures or dark-surface failures; all 10 canvases nonblank per shot.
QA: 926 text elements checked; axis text contrast 5.46:1 light / 7.20:1 dark; 31 data and interaction checks passed.
Build emits nonblocking existing inlineDynamicImports / single-bundle size warnings; no build configuration was weakened.
Open questions: live data/permissions, true account connection flow, configured client SLA, campaign/ad-set/ad hierarchy and attribution-query reuse with Ads insights.
Evidence: QA.json; shots/report.json; exact authored/build/deliverable file inventory in FILES.txt.
