# CRM-U12 - completed 2026-10-08
Agent/runtime: tsst-dev / DEV_AG; Codex gpt-6.1-sol high; readiness NOT_READY.
Skills used: TSST-DEV-SK-005 chart consumer contract preservation; TSST-DEV-SK-011 chart regression evidence; TSST-DEV-SK-015 fresh checks; skipped none; skill_friction none.
Commit: e1508c20605bd916abe48974bdee0e3c391933bc; feat/crm-ui-migration; 6 chart/widget TSX files.
Scope: canonical token chart canvas/meta/KPI/control styling, disclosure and scroll-table focus, semantic surfaces, responsive sizing.
Acceptance: same Chart.js/react-chartjs-2 registration, data models/hooks/API, widget state/retry contracts, exact table values, timezone and zero rows; no weekly rebucketing changes.
C: lint PASS 370 files/no diagnostics; typecheck PASS both projects; unit PASS 656/656 in 64 files; build PASS 1521 modules.
Regression: existing ChartSurface SSR covers AR/EN captions/headers/table keyboard disclosure, bidi exact money, empty zero rows, loading, denied/retry and real canvas ARIA; models remain unchanged.
Evidence: C:/Work/tsst-crm-codex/CRM_APP/audits/2026-10-08/ui-u12-{lint,typecheck,unit,build}.log; scoped diff className/import only.
Ownership: ChartSurface no longer imports charts.css; migrated widget controls and summaries own utility styling; stylesheet retained for U20/reversal.
Deviations: widget summaries/controls receive utilities in addition to named ChartSurface scope because they were consumers of the same chart stylesheet.
Limits: no UI suite or DB run; chart rendering/theme/font/contrast/viewport visual acceptance remains pending; existing large-chunk warning.
Risks: no dependency, backend, auth policy or chart data changes; no CSS retirement/push/merge/rebase/deploy/port4317 use.
Next: U13 import upload/mapping frame, preserving limits, drafts/back, tenant and MFA behavior.
