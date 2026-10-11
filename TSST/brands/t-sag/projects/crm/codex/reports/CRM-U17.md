# CRM-U17 - completed 2026-10-08
Agent/runtime: tsst-dev / DEV_AG; Codex gpt-6.1-sol high; readiness NOT_READY.
Skills used: TSST-DEV-SK-005 work-view consumer contracts; TSST-DEV-SK-011 existing interaction regressions; TSST-DEV-SK-015 fresh verification; skipped none; skill_friction none.
Commit: 20bbf54496df14764bea5a6ce550d82e54fe10a1; feat/crm-ui-migration; 11 TSX files.
Scope: deals/tasks/pipeline frames, forms, history/stats/stepper/task rows, due/completion/related UI and pipeline card/state token utilities.
Acceptance: stage/history/task/selection behavior and hidden deal-list/record routing retained; pipeline card uses RAC native button with the same onClick navigation.
States: done/current/won/lost tokens, directional breadcrumb/back icons, mobile task labels, stepper fade/scroll and pipeline responsive columns preserved.
C: lint PASS 372 files; typecheck PASS both projects; unit PASS 658/658 in 65 files; build PASS 1515 modules.
Regression: existing deal/task/stage/selection/grid/preview model tests pass; no feature API/model/hooks/mutation/history/authorization changes.
Evidence: C:/Work/tsst-crm-codex/CRM_APP/audits/2026-10-08/ui-u17-{lint,typecheck,unit,build}.log; scoped import/control/event review.
Ownership: deals.css/tasks.css/pipeline.css imports removed from migrated consumers; legacy files retained untouched for U20/reversal.
Deviation: leads BulkTaskDialog receives the equivalent task-form utilities because it shared the retired task stylesheet; common record-panel styling remains U18.
Limits: no UI suite/DB run; live stage/task/selection, focus and AR/EN/theme/mobile visual acceptance pending; existing large-chunk warning.
Risks: no backend/auth/API/model/new dependencies/CSS deletion; no push/merge/rebase/deploy/port4317 use.
Next: U18 record panels; preserve desktop non-modal/mobile modal, Prev/Next/deep-link/reveal/focus-return contracts.
