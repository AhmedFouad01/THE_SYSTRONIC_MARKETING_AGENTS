# CRM-U09 - completed 2026-10-08
Agent/runtime: tsst-dev / DEV_AG; Codex gpt-6.1-sol high; readiness NOT_READY.
Skills used: TSST-DEV-SK-005 B4/B5 admin contracts; TSST-DEV-SK-011 adverse-path tests; TSST-DEV-SK-015 fresh verification; skipped none; skill_friction none.
Commit: a9f5b8ef449175e06d6fe735a1a5d42589f9e1a0; branch feat/crm-ui-migration; 14 UI/API/test files.
Scope: /app/settings/users, authorized navigation, member/invite lists, role save, confirmation for deactivation/cancel, manager reset/invite copy links.
Acceptance: strict B4/B5 bodies, member-ID scoping, 100/offset paging, manager hints/no agency grant; live server 403/401 remains authoritative.
Reconciliation: GET lists after writes/failures, no mutation replay; failed refresh disables actions; self changes/permission loss refresh session and clear workspace UI.
Copy links: validated same-origin accepted fragments, plain selectable field/explicit copy, clipboard fallback, memory-only and cleared on exit/refresh/new action.
C: lint PASS 368 files/no diagnostics; typecheck PASS both projects; unit PASS 652/652 in 64 files/no failed/skipped; build PASS 1521 modules.
UI: test:ui:auth PASS 57/57 (20 U09 + unchanged 37 U07/U08); manager/rep/reader/grant gates, direct API 403 fixtures, last-manager 409, self changes and reconciliation.
Visual: AR/EN x light/dark x 1440/375 checks; reviewed Arabic dark mobile and English light desktop screenshots; page overflow/runtime errors absent, table overflow contained.
Evidence: C:/Work/tsst-crm-codex/CRM_APP/audits/2026-10-08/ui-u09-{lint,typecheck,unit,build,auth}.log; test-results/auth-users-*/users.png.
Deviations: shared client now honors explicit write idempotency keys; U09 DELETE actions supply fresh UUIDs per accepted all-write header contract; focused RED/GREEN caught gap; future-nav assertions updated for activation only.
Risks/limits: browser API checks mocked; accepted B4/B5 server authorization unchanged, DB not rerun; no backend/auth-policy change/S2 acceptance; existing chunk warning, prior dev-shell failures, brief and untracked logs preserved.
Next: STOP before U10 for context handoff; Security sessions/change-password next, B6 deferred; no push/merge/deploy, secrets read or port4317 use.
