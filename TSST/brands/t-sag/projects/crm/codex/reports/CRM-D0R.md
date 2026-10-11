# CRM-D0R — Shared chart surface (plan D0)
Commit: 074a9c1055ff21507e1fd50644cdee633aa2f908; feat/crm-v3-dashboard; clean after task commit.
Worktree: C:/Work/tsst-crm-lanes/dash; CRM_APP; npm ci already completed once for D3.
Files: package.json, package-lock.json, CHARTS_CONTRACTS.md, app/src/features/dashboard/index.ts.
Files: app/src/features/dashboard/charts/{model.ts,ChartSurface.tsx,charts.css,model.test.ts,ChartSurface.test.tsx}.
Files: app/src/ui/i18n/{ar.ts,en.ts}; 11 changed files, LF.
Dependencies: exact chart.js 4.5.1 and react-chartjs-2 5.3.1; 3 installed packages including required transitive; 0 vulnerabilities.
Lint: PASS, 296 files, 0 issues; initial 5 findings corrected before second run (final fresh lint also green).
Typecheck: PASS, server + app configs (2); initial 2 type-contract findings corrected before second run.
Unit: PASS, 485/485 tests, 42/42 files, 0 failures; 18 new focused tests (12 model, 6 SSR surface).
Build: PASS, TypeScript + Vite 183 modules + asset build; existing >500 kB warning; JS 801.31 kB / gzip 238.85 kB.
done_when — approved libraries: registered actual Chart.js controllers/scales/plugins; real React chart canvas ARIA output covered by SSR unit test.
done_when — semantic theme tokens: resolve --sy-text/border/surface, status foregrounds, font-data, chart-1..8; re-resolve on theme/locale changes; both token maps tested.
done_when — reduced motion: false animation when requested, normal animation enabled; options tested; existing ThemeProvider drives preference changes.
done_when — localized accessible tables: identical typed rows drive plots/exact tooltips/table; captions, header scopes, keyboard disclosure/scrolling, bidi isolation and AR/EN digits tested.
done_when — independent states: widget-local loading skeleton, tenant/assigned empty, safe error with Retry, and 403 without Retry; zero rows remain in table; adapter/SSR coverage.
Money evidence: >MAX_SAFE_INTEGER retains every digit, negative sub-unit sign, JPY/KWD exponents, Arabic digits; unsafe plots omitted with exact table explanation.
Scope evidence: response scope supplies Mine; no client assignment filtering; RTL legend/tooltip and horizontal numeric reversal tested; chronological axis unreversed.
Deviation: chart files live in existing features/dashboard/charts convention; shared exports provided, C1–C5 integrations remain their assigned tasks.
Deviation: narrow lint suppressions document intentional theme/locale token refresh and keyboard scrolling of the semantic table region.
Constraints: no SQL/migration, DB suite, UI suite, manual visual smoke, push/merge/rebase/deploy, port 4317 or secret reads.
Risks: measured contrast/render acceptance deferred to Ahmed per brief; existing esbuild install-policy warning did not block build; bundle warning retained.
Skills used: TSST-DEV-SK-005, TSST-DEV-SK-011, TSST-DEV-SK-015; SQL and other skills skipped; no concrete skill gap; validation statuses unchanged.
Next: Lead review, CRM-D0R bus done, then claim CRM-D1R; producer did not mutate bus.
