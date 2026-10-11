# CRM-U07 — B7 sign-in
Agent: DEV_AG / tsst-dev; Runtime/model: Codex / gpt-6.1-sol; TIER CODE; readiness NOT_READY.
Commit: 7039e2b2b695243dbdfa132f90215c1146e560b0 (feat/crm-ui-migration, C:/Work/tsst-crm-codex).
Deliverable: CRM_APP/app/src/features/auth/SignIn.tsx + api/auth, session/client/App wiring; AR/EN dictionaries; browser/unit tests.
Claim/done_when: cookie login/bootstrap/logout/401 recovery; no stored cookie credentials; localized safe errors; AR/EN/theme/mobile passed.
Method/results: lint 360 files; typecheck both projects; test:unit 633 tests / 62 files; build exit 0 (existing >500kB bundle warning).
UI: npm run test:ui:auth, 11/11 Playwright scenarios; all 8 AR/EN × light/dark × 1440/375 modes, mixed email, reload/logout/401/errors/actor isolation.
Visual: inspected AR/light/375 and EN/dark/1440 screenshots; no clipping/overflow; full screenshots under ignored CRM_APP/test-results/.
Existing UI: isolated explicit dev shell 5 passed / 3 baseline failed; identical 7px menu placement and Tab-dismiss failures reproduced from source-only U06 HEAD archive.
Deviations: tenant discovery absent; accepted X-Tenant-ID contract uses non-secret workspace input plus actor-bound, server-revalidated remembered context.
Gates: B6 factor controls inactive; no backend/auth-policy change, DB/real-auth rerun, push/merge/rebase or port4317 use; S2/visual acceptance separate.
Test harness: test:ui explicitly builds VITE_DEV_BEARER=1 for existing fixtures; test:ui:auth builds cookie mode on isolated static preview 4418; temporary archive/configs removed.
Skills used: TSST-DEV-SK-005 (accepted cookie/header contracts); TSST-DEV-SK-011 (negative lifecycle/client/browser tests); TSST-DEV-SK-015 (fresh exact-source C/UI evidence).
Skills skipped: none; skill_friction: none; Next: U08 safe invite/reset link UI; inherited Menu defects reported separately.
