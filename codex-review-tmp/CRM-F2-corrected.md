# CRM-F2 — done (technical; visual review pending)
Commit: d408c7f on feat/crm-review-fix1; no push/merge.
R03 done-when: removed navy KPI variants, uses, tokens and pigment; light primary cyanDark; neutral KPI replacement; one theme.
Palette: eight 45-degree OKLCH hue rotations from cyanDark/light and cyan/dark; identical L/C across each mode; --sy-series-1..8 and derived sRGB chart aliases (Chart.js hover/tooltip compatibility); kit documented.
Guard: no raw hex/functions/named CSS/JS/canvas/Tailwind pigments outside tokens; token references, comments and ordinary data excluded; detector fixtures pass.
Checks C: lint 378 files; typecheck 2 TS projects; test:unit 67 files / 666 tests passed; build 1512 modules passed (existing >500kB warning).
Evidence: all runtime navy/original pigment searches empty; light/dark graphics 3:1 and text 4.5:1 contrast checks retained with OKLCH-to-linear-sRGB conversion/clamp; installed Chart.js parser/hover fixtures pass.
Eyeball: Leads KPI strip, Dashboard KPI/charts, Insights > Reports KPI, primary actions across screens; EN/AR RTL, light/dark, 1440/375px.
Visual skipped: in-app browser sandbox helper_unknown_error. Manual kit audit; Impeccable absent, installation approval absent.
Skills used: TSST-DEV-SK-005 (API compatibility audit), TSST-DEV-SK-011 (palette/guard/contrast regressions), TSST-DEV-SK-015 (fresh C and diff review).
Skills skipped: none. skill_friction: none. Readiness: NOT_READY.
