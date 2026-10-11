# CRM-U18 - completed 2026-10-08
Agent/runtime: tsst-dev / DEV_AG; Codex gpt-6.1-sol high; readiness NOT_READY.
Skills used: TSST-DEV-SK-005 record consumer compatibility; TSST-DEV-SK-011 semantic preview regression; TSST-DEV-SK-015 fresh checks; skipped none; skill_friction none.
Commit: b2716ecdcb0534decf634e785669a5c30ec83bf5; feat/crm-ui-migration; 10 record/feature/style/test files.
Scope: preview/record/facts/edit-footer/technical-detail utility styling, RAC native Prev/Next/Close/copy controls, equivalent shared record consumers.
Acceptance: desktop stays aria-modal=false with underlying grid access; mobile still uses existing RAC Dialog side sheet/history; Prev/Next/deep-link/reveal/guard/focus-return wiring untouched.
Motion: existing logical desktop in/out, physical-right sheet exit, ghost cleanup and reduced-motion rules isolated to preview-motion.css; no permanent transform rebases fixed children.
C: lint PASS 373 files; typecheck PASS both projects; unit PASS 659/659 in 66 files; build PASS 1513 modules.
Regression: new SSR test proves non-modal body access, disabled nav, bidi heading and native tooltip forwarding; existing preview key/dismissal/typing/grid/reveal regressions pass.
Evidence: C:/Work/tsst-crm-codex/CRM_APP/audits/2026-10-08/ui-u18-{lint,typecheck,unit,build}.log; scoped source/diff ownership review.
Ownership: preview-panel.css/record-panel.css/record-details.css imports removed; old files retained untouched for U20/reversal; reusable tokens/base untouched.
Deviation: CustomFields shared record classes migrated with other detail consumers before U19 to avoid unstyled record facts; no property behavior changes.
Limits: SSR/model coverage does not prove live modal focus/trap/history/scroll/return; no UI suite/DB run; visual/focus acceptance pending; existing large-chunk warning.
Risks: no API/model/backend/auth/dependency/CSS deletion; no push/merge/rebase/deploy/port4317 use.
Next: U19 remaining properties/reporting/CustomFields/CustomColumns; then STOP, U20 waits for visual acceptance.
