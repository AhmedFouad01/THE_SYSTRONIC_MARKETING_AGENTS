# CRM-D5R — C4 tasks due
Agent: tsst-dev / DEV_AG; team: build; tier: CODE.
Commit: 58b8275b4fb0c18969c3d8e0a22774445787f5ec; clean implementation lane.
Files: CRM_APP/CHARTS_CONTRACTS.md.
Files: CRM_APP/app/src/features/dashboard/DashboardView.tsx, TasksWidget.tsx,
Files: CRM_APP/app/src/features/dashboard/tasksDue.ts and tasksDue.test.ts.
Files: CRM_APP/app/src/ui/i18n/ar.ts and en.ts; seven files total.
Lint: PASS, 308 files, zero issues; git diff whitespace check PASS.
Typecheck: PASS, server and app configurations (2).
Unit: PASS, 529/529 tests across 46/46 files; 11 new tasks-due tests.
Build: PASS, TypeScript plus Vite, 191 modules and assets.
Done: existing W1/W2 cards now display exact aggregate overdue and next_24h counts.
Done: C4 plots overdue, seven server local dates and later from the same response.
Done: next_24h never enters partition rows or sum; localized note explains overlap.
Done: chart/table partition equals open_total; zero rows and empty state preserved.
Shared load: one authority-scoped tasks-due snapshot feeds KPIs and C4, without duplicates.
Timezone: browser IANA zone requested/verified; as_of and timezone displayed.
Scope: server Mine/tenant preserved; stale ready data hidden on authority-key change.
Follow-ups: list loads still supply actionable rows; task creation refreshes both sources.
Tests: exact counts above page limits, partition, overlapping KPI, zeros, Arabic dates,
Tests: chart/table parity, scope, metadata, key reset, endpoint and timezone mismatch.
Deviations: none functional; due-dated total label reflects server exclusion of undated tasks.
Risks: existing bundle-size warning; visual/contrast review deferred per brief; no blocker.
Skills used: TSST-DEV-SK-005, TSST-DEV-SK-011, TSST-DEV-SK-015; gap: none.
Next: root reviews, bus done CRM-D5R and claims CRM-D6R; producer bus untouched.
