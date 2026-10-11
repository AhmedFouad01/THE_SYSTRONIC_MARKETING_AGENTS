# CRM-AUTH-B4 — 2026-10-08
Agent: tsst-dev / DEV_AG; readiness NOT_READY; implementation and tests only.
Runtime/model: Codex delegated runtime; configured gpt-6.1-sol mapping; actual model metadata unavailable.
Skills used: TSST-DEV-SK-007 identity/tenant gates; TSST-DEV-SK-005 API contracts; TSST-DEV-SK-011 adverse-path integration tests (all opened).
Skills skipped: none; SQL architecture skills not selected because schema/plan were decided.
Commit: 0562b100774310d6fe76cf887e281004853306e1 — feat(crm): auth B4 — tenant bootstrap and invite-only membership.
Worktree: C:/Work/tsst-crm-mvp; feat/crm-mvp-ui; base a99f01a; B3 91706c1 ancestry confirmed.
Files: CRM_APP/src/auth/{ba.ts,errors.ts}, src/api.ts, scripts/create-tenant-admin.ts.
Files: CRM_APP/tests/{auth-b3.test.ts,auth-b4.test.ts}, package.json, AUTH_PLAN.md.
Acceptance: SQL bootstrap creates org/user/credential/first manager atomically and seeds every new tenant's four standard objects/system properties; rollback verified.
Acceptance: U6 no-id/wrong-email/valid/expired/replay plus malformed IDs, password policy and no auto sign-in; six B4 test groups pass.
Acceptance: user-create hook rechecks after hashing; cancel-during-hash denies signup with no user/account/principal/session persisted.
Acceptance: manager-only invite/users routes via crm.can_action + plugin/direct-manager checks; rep/reader 403; tenant/object crossing denied; worker/owner/admin/member roles rejected.
Acceptance: matching-login invite accept, expiry/cancel/replay; last-manager 409 LAST_MANAGER_REQUIRED; next-request demotion/deactivation scope loss; projection survives.
lint: PASS, 344 files, zero diagnostics; typecheck: PASS, server + app projects.
test:unit: PASS, 620/620 tests, 59/59 files, zero failed/skipped.
build: PASS, TypeScript/assets + Vite 209 modules; existing >500 kB chunk warning only.
test:db: PASS, 201/201, zero failed/cancelled/skipped, full wrapper run on crm_lane_auth; all 6 B4 groups green.
test:bootstrap: PASS, 4/4, zero failed/cancelled/skipped; focused B4: PASS 6/6 (first exploratory race failure corrected).
Logs: C:/Work/tsst-crm-mvp/CRM_APP/audits/2026-10-08/auth-b4-{lint,typecheck,unit,build,db,bootstrap,focused,verify}.log.
Verification: DB readback crm_lane_auth; mfa_required=false; seven check logs scanned, zero credential/session patterns; staged diff clean; LF sources.
Deviations: brief's stale HEAD replaced by a99f01a; Track A/B merges and untracked audits preserved; brief direct-manager bootstrap supersedes older plan invite wording; BA masks hook 403, so internal 422 maps to public 403.
Risks/limits: stub mail/no email proof; TOTP and UI remain deferred; no new dependency/migration, no 4317 listener/UI suite/manual smoke, no push/merge/deploy.
Next: B5 reset/change password and session revoke; keep internal-422 gate, scoped targets/body allow-list and fragment links; reset-by-email OFF; retire only known reset identifiers, never value=userId alone.
skill_friction: none; provider behavior verified against official docs and pinned 1.7.7 source; no validation promotion.
