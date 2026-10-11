# CRM-F1 â€” done (technical; visual review pending)
Commit: 765a4d1 on feat/crm-review-fix1; no push/merge.
R02 done-when: 36px kit single-line controls; centered header actions; scoped visually-hidden accessible field labels.
R11 done-when: form siblings and field content align at start; hints/errors cannot stretch sibling label/control spacing.
Kit docs: CRM_APP/app/src/ui/README.md spacing, height, EN/AR line-height scale and reviewer checklist; manual design fallback (Impeccable absent, install approval absent).
Checks C: lint 378 files; typecheck 2 TS projects; test:unit 67 files / 661 tests passed; build 1512 modules passed (existing >500kB chunk warning).
Eyeball: Deals > Pipeline header; Leads/Contacts/Deals/Tasks page headers; Properties > New property dialog (unequal hints/errors); EN/AR RTL, light/dark, 1440 and 375px.
Visual verification skipped: cua.getState failed before browser creation, windows sandbox helper_unknown_error.
Skills used: TSST-DEV-SK-005 (presentation-only diff audit; API producer/consumer contracts preserved), TSST-DEV-SK-011 (risk-based existing regression suite), TSST-DEV-SK-015 (fresh exact-worktree C checks and diff review).
Skills skipped: none. skill_friction: bus requires all listed skill citations even when API scope is unchanged. Readiness: NOT_READY.
