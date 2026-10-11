# CRM-U08 - completed 2026-10-08
Agent/runtime: tsst-dev / DEV_AG; Codex gpt-6.1-sol high; readiness NOT_READY.
Skills used: TSST-DEV-SK-005 strict B4/B5 consumer contracts; TSST-DEV-SK-011 adverse-path tests; TSST-DEV-SK-015 fresh verification; skipped none; skill_friction none.
Commit: 7a971c39faa14720d230c3bd3f3d9551886aba7f; branch feat/crm-ui-migration; 14 UI/API/test files.
Scope: public /app/invite and /app/reset pages, fragment reader, headless client methods, AR/EN errors, existing cookie browser harness.
Acceptance: fragment/query cleared synchronously before React/bootstrap; capabilities remain memory-only, cleared on success/cancel; strict POST bodies and no-referrer fetch.
Invite: gated signup then matching-email sign-in then accept; existing cookie/account paths; wrong actor switch-account recovery; signup never repeated after login failure.
Reset: 24-character B5 token; password confirmation/policy; single-use/expiry errors; reset-by-email unavailable, no request endpoint exposed.
C: lint PASS 364 files/no diagnostics; typecheck PASS both projects; unit PASS 642/642 in 63 files/no failed/skipped; build PASS 1521 modules.
UI: test:ui:auth PASS 37/37 (26 U08 + unchanged 11 U07); AR/EN x light/dark x 1440/375, expiry/replay, password clearing, duplicate submit and recovery.
Visual: reviewed Arabic dark mobile invite and English light desktop reset screenshots; no overflow/clipped controls; runtime-error checks green.
Evidence: C:/Work/tsst-crm-codex/CRM_APP/audits/2026-10-08/ui-u08-{lint,typecheck,unit,build,auth}.log; test-results/auth-links-*/link.png.
Deviations: public route set kept separate from workspace navigation to preserve inherited assertions; initial unit failures fixed in source; approval-service limit resumed same task.
Risks/limits: browser contracts mocked; no DB/backend policy change or S2 approval; existing build chunk warning and historical dev-shell 5pass/3fail baseline remain; new logs and preexisting brief preserved.
Next: CRM-U09 users/admin UI; no push, merge, deploy or port4317 use; rollback only this increment's UI/API imports.
