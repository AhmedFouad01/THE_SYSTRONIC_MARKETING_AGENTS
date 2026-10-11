# CRM-AUTH-B5 - DONE (2026-10-08)
Agent: tsst-dev / DEV_AG; Mission/Owns/Does-not-own applied; Track C only.
Runtime: Codex Windows/PowerShell, Node v24.18.0; routed model mapping gpt-6.1-sol is unverified runtime metadata.
Branch: feat/crm-mvp-ui; base B4 0562b100774310d6fe76cf887e281004853306e1; earlier B3/Track A/B ancestry preserved.
Commit: 5e650676cbcad540fbd333d8e07231f138ce9632 - feat(crm): auth B5 - manager reset links and session controls.
Files (13): src/auth/{ba,errors,mailer,reset}.ts; migrations/019_auth_password_reset.sql; scripts/migrate.ts; package.json.
Files continued: AUTH_PLAN.md; tests/{auth-b1,auth-b3,auth-b5,auth-mailer.unit,m1-remediation}.test.ts.
Acceptance: D4a tenant-scoped manager copy-link; configured host /app/reset#token; no-store/no-referrer; reset-by-email OFF (known/unknown both404).
U11: hashed identifiers, one-hour expiry, single use, live policy before consumption; user-row lock retires only known older reset hashes.
Ordering: BA consumes before hashing; already-consumed older work may finish after new issuance; scoped cleanup preserves new token.
Sessions: reset revokes all even on metadata cleanup failure; change requires current password, applies A1, rotates cookie and revokes old sessions.
Own-session list exposes stable IDs without tokens; revoke-one cannot target another user; strict bodies/origin checks and AR/EN errors retained.
Mailer: invitation/reset callbacks use interface stub; delivery ID+recipient hash only; link logging requires dev flag1 and non-production.
Migration019 applied only to crm_lane_auth via lane wrapper; auth-only RLS/ACLs verified; mfa_required OFF; no new dependencies.
Required checks: lint348 files clean; typecheck PASS; unit625/625 (60files); build209 modules; bootstrap4/4; full DB211/211 (0fail/skip/cancel).
Log base: C:/Work/tsst-crm-mvp/CRM_APP/audits/2026-10-08/
Required logs: auth-b5-{lint,typecheck,unit,build,bootstrap}.log; auth-b5-db-final.log (290803ms).
Focused: auth-b5-focused.log 10/10; auth-b5-b1.log 11/11; final full DB also B4 6/6 and B5 10/10.
Security evidence: cross-runtime concurrent issuance, paused hash, 2FA/trust preservation, poolmax1 cleanup, actual token/email/password log redaction.
Deviation: first DB207/211 exposed outdated exact B1 inventory plus three M1 child timeouts; inventory now includes019 with ACL assertions intact.
Measured harness correction: 2104tenants/35224identifiers; scan9091ms; API9764ms/worker8815ms, exit1, empty stdout, exact sanitized stderr; child limit10s->30s.
Risks: reset copy-link is a bearer capability; raw DB session tokens remain T18; existing902KB Vite chunk warning; production startup unchanged.
Skills used: TSST-DEV-SK-007, TSST-DEV-SK-005, TSST-DEV-SK-011.
skill_friction: none; unrelated retained lane fixtures were preserved; scoped B5 fixtures/diagnostic tenant cleaned; AUTH_PLAN contains API/ordering handoff.
Next increment: STOP after B5; parent handles bus done; no push/merge/deploy, UI suite/manual smoke, port4317 listener or B6 work.
