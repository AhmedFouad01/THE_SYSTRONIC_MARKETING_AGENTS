# CRM-D1R — C1 pipeline (plan D1)
Commit: 2cd9a0c51190f5ca96673f3d1bff9cd66e77ff33; feat/crm-v3-dashboard; clean after task commit.
Worktree: C:/Work/tsst-crm-lanes/dash/CRM_APP; 10 changed files, LF; no new dependencies.
Files: app/src/features/dashboard/{PipelineWidget.tsx,pipeline.ts,pipeline.test.ts,DashboardView.tsx,dashboard.css}.
Files: app/src/features/dashboard/charts/{model.ts,charts.css}; app/src/ui/i18n/{ar.ts,en.ts}; CHARTS_CONTRACTS.md.
Lint: PASS, 299 files, 0 issues.
Typecheck: PASS, server + app configs (2).
Unit: PASS, 495/495 tests, 43/43 files, 0 failures; 10 new focused pipeline tests.
Build: PASS, TypeScript + Vite 185 modules + asset build; JS 812.94 kB / gzip 242.20 kB; existing >500 kB warning.
done_when — horizontal RTL bars include won/lost: live C1 uses shared horizontal counts; AR x-axis reversed with zero origin; both outcomes labeled and semantic colors tested.
done_when — pipeline/currency selectors: options from authorized aggregate; first pipeline/stale-choice fallback; currencies remain distinct and unavailable choices reset deterministically.
done_when — exact bigint money: selected currency decimal strings preserved; >MAX_SAFE_INTEGER digits match exact table/secondary tooltip; currencies never summed.
done_when — identical table payload: chart and accessible table share stage rows/counts; selected money is a non-plotted secondary column, exposed in the same tooltip.
Evidence: zero stages preserved; empty archived hidden, occupied archived retained; stage-position/ID ordering and immutable payload tested.
Evidence: GET /v1/dashboard/pipeline-stages uses existing API envelope, headers and AbortSignal; response scope drives Mine, without client-side owner filtering.
Integration: original operational/reporting dashboard retained; C1 appended in 12-column chart grid, half desktop/full mobile; reader has no mutation controls.
Isolation: widget keyed by tenant/actor/grant resets selectors and data on authority changes; independent useLoad and Retry/403 states reused.
Review correction: text-only options use existing custom Select-owned bdi output and preserve keyboard typeahead; no unsupported option children.
Deviation/limitation: aggregate, session and report contracts contain no configured tenant primary currency; currency-code order used instead of inventing primary-first; documented in chart contract.
Constraints: no SQL/migration, DB suite, UI suite, manual visual smoke, push/merge/rebase/deploy, other worktree or port 4317 use; no secrets read.
Risks: measured contrast/render acceptance deferred to Ahmed per brief; bundle-size warning remains; no check failure.
Skills used: TSST-DEV-SK-005, TSST-DEV-SK-011, TSST-DEV-SK-015; other skills skipped; no concrete skill gap; validation statuses unchanged.
Next: Lead review/bus done CRM-D1R, then claim CRM-D2R; producer did not mutate bus.
