# CRM-D2R — C2 leads (plan D2)
Commit: 61f8d4f5658d9aa20326a3c23ead3bdd23241307; feat/crm-v3-dashboard; clean after task commit.
Worktree: C:/Work/tsst-crm-lanes/dash/CRM_APP; 9 changed files, LF; no new dependencies.
Files: app/src/features/dashboard/{LeadsWidget.tsx,leads.ts,leads.test.ts,DashboardView.tsx}.
Files: app/src/features/dashboard/charts/{model.ts,charts.css}; app/src/ui/i18n/{ar.ts,en.ts}; CHARTS_CONTRACTS.md.
Lint: PASS, 302 files, 0 issues.
Typecheck: PASS, server + app configs (2).
Unit: PASS, 506/506 tests, 44/44 files, 0 failures; 11 new leads adapter/API tests.
Build: PASS, TypeScript + Vite 187 modules + asset build; JS 815.54 kB / gzip 242.75 kB; existing >500 kB warning.
done_when — status KPI strip: authoritative by_status open/qualified/closed plus overall total, localized numbers, semantic definition list.
done_when — stacked sources + Other(N): three horizontal status datasets; server top-source order retained; server Other group appended exactly once with source_count and muted semantic tone.
done_when — localized labels: both dictionaries include title, statuses, source/total, Other(count), status summary and read action; Arabic source count/digits and English labels tested.
done_when — Mine scope: response scope retained by adapter and shared heading; no client actor/owner filtering; assigned/tenant rows tested unchanged.
Evidence: source+Other totals equal status KPIs; row open+qualified+closed equals row total; literal source named other never collides with aggregate Other key.
Evidence: absent Other produces no synthetic row; Other-only and empty payloads covered; no duplicate regrouping or truncation in UI.
Evidence: three plotted datasets and non-plotted total column use identical typed rows; table/tooltip share counts; AR horizontal x reversal/stacking tested.
API: GET /v1/dashboard/leads-breakdown through existing authenticated client/envelope and AbortSignal; independent useLoad/Retry/403 states reused.
Integration: C2 placed after C1 in existing chart grid; half desktop/full mobile; tenant/actor/grant key resets data; empty action is read-only leads navigation.
Deviation: plan handoff shorthand leads-by-source resolved to actual documented leads-breakdown endpoint; no contract/API mutation.
Constraints: no SQL/migration, DB suite, UI suite, manual visual smoke, secrets, push/merge/rebase/deploy, other worktree or port 4317 use.
Risks: measured contrast/render acceptance deferred to Ahmed per brief; bundle-size warning remains; all C checks passed first attempt.
Skills used: TSST-DEV-SK-005, TSST-DEV-SK-011, TSST-DEV-SK-015; other skills skipped; no concrete skill gap; validation statuses unchanged.
Next: Lead review/bus done CRM-D2R, then claim CRM-D4R; producer did not mutate bus.
