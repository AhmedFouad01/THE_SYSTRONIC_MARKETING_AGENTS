# AUTH_PLAN — Roadmap v2 item 2 "Real sign-in" (plan only, no code)

Status: PROPOSED. Decisions D1–D13 adopted as Lead-provisional (2026-10-07 night run) — user to confirm in the morning; D1 (mandatory in-house TOTP for managers) and D2 (scrypt cost) most need confirmation. Author: tsst-dev (SK-002/003/007/008, all UNVALIDATED). Revision: `feat/crm-mvp-ui` @ 0641b45. Requirements: user, `NIGHT_RUN.md` §5 item 2 and §6.
No new dependency (SES adapter is code-only, slice A12). Not deployed, not pushed.

## 1. Current state (read from source)

- `src/api.ts:45` `context()`: tenant from `X-Tenant-ID`, token from `Authorization: Bearer`, optional `X-Grant-ID`. Only UUID shape is checked there.
- `src/db.ts:31` `transaction()`: `set_config('crm.tenant', ...)` and `set_config('crm.token', ...)` with `is_local=true`, then `crm.actor()` -> 401 and `crm.tenant_access()` -> 403.
- `crm.actor()` (001): `SECURITY DEFINER`, fixed `search_path`; looks up `crm.session` by `sha256(token)` hex and `expires_at>now()`. No `revoked_at`, no idle expiry, no origin of the session recorded.
- `crm.session(token_hash, principal_id, expires_at, mfa_verified)` is not RLS'd. `crm_runtime` has no grant on it. Only definer functions and seed scripts touch it. `scripts/seed.ts:49` and `scripts/spike/b0-setup.ts:136` mint test sessions with `mfa_verified=true`.
- `crm.principal(id, name)` has no email or credential. `crm.membership(tenant_id, id, principal_id, role, active)` has `UNIQUE(tenant_id, principal_id)`, so one principal can belong to many tenants.
- `crm.mfa_ok(p, t)` (002/003): a principal who is an active `manager` in tenant t needs a session with `mfa_verified=true`. **A password-only session would lock every manager out of `can_object` and `object_scope` paths. This drives decision D1.**
- Tenant RLS (008+): `tenant_id = (SELECT crm.context_tenant_if_allowed())`. P1A review (`audits/2026-10-07/P1A_SECURITY_REVIEW.md`): MAJOR finding = definer functions lacked an explicit `REVOKE ... FROM PUBLIC`; fixed in 008 plus a repair in `scripts/migrate.ts:57`; ACL catalog test `tests/p1a.test.ts:27`.
- The web client keeps pasted token and tenant in `sessionStorage` (`app/src/api/session.ts`, `ConnectGate.tsx`). The worker (`src/worker.ts`, `jobs.ts`) calls the DB directly with a session token and a `worker` membership; it does not use HTTP.
- No CORS is emitted except `/v1/collect/events`. Every non-GET API call already needs `Idempotency-Key` and a JSON body.

## 2. Design summary

1. **Identity** is global: `crm.principal` + new `crm.credential` (email, scrypt hash). **Roles** stay per tenant in `crm.membership.role`. No new role names except invite and admin actions added to `crm.role_permission`.
2. **Session** = 32 random bytes (CSPRNG), cookie value is the raw token, DB stores `sha256` hex in the existing `crm.session.token_hash`. Reuses `crm.actor()`, `mfa_ok()`, RLS and every existing function. The cookie path and the dev Bearer path feed the same `Context.token`, so no authorization code changes.
3. **Auth DB access** goes through definer functions granted to `crm_runtime` (same pattern as 001/008). No new DB role (D6).
4. **Dev Bearer path** stays, gated by `CRM_DEV_BEARER=1`; the API refuses to boot with it when `NODE_ENV=production`; in production the `Authorization` header is ignored. The worker and service sessions keep `kind='service'` and are minted by script only (never over HTTP).
5. **Tenant selection** stays the `X-Tenant-ID` header, always checked by `tenant_access()` against active membership. The cookie carries identity only.
6. **No open signup.** A bootstrap script (A5) creates a tenant plus first manager invite and prints a one-time link to stdout. Everyone else enters by invite (D8).

## 3. Threat model (SK-008; hypotheses are labelled, evidenced items cite source)

Assets: credentials and hashes, session tokens, reset and invite tokens, tenant data behind RLS. Actors: anonymous internet caller, authenticated member of tenant A, manager, invited person, mail-box thief, insider with log access. Boundaries: browser -> API (new cookie boundary), API -> `crm_runtime` (unchanged), API -> mail (stub).

| # | Threat | Path | Mitigation | Test (slice) |
|---|---|---|---|---|
| T1 | Credential stuffing / brute force | Bot replays leaked pairs against `/v1/auth/login` | Three DB throttles (account, IP, IP+account) with backoff; scrypt concurrency cap; generic 401; 12-char minimum + in-house common-password blocklist; auth_event audit rows. Residual: distributed low-rate attack (no CAPTCHA, no breached-password API: D11) | A3, A4 |
| T2 | Session fixation | Attacker plants a known cookie before login | Server never accepts a client-chosen session id; login always mints a new token and expires any presented cookie; password change/reset revokes all sessions of the principal | A4, A6 |
| T3 | CSRF (state change and login CSRF) | Third-party page auto-submits to the API with the victim's cookie | `SameSite=Lax` cookie; `Origin` must equal `CRM_PUBLIC_ORIGIN` for every non-GET (also pre-auth POSTs); per-session synchronizer token in `X-CSRF-Token` (hash in `crm.session.csrf_hash`, constant-time compare); JSON-only (415 otherwise); no CORS on these routes; existing `Idempotency-Key` requirement stays. No GET mutates | A4 |
| T4 | User enumeration | Differences in login, reset, invite-accept responses, timing or status | One error code `INVALID_CREDENTIALS` for unknown email, wrong password, no active membership and throttled-unknown; reset request always `202` with the same body, work done after the response; invite accept errors collapsed to `INVITE_INVALID`. Managers may see "already a member" (authenticated, tenant-scoped) | A4, A5, A6 |
| T5 | Timing | Hash-compare short-circuit or unknown-email fast path | Unknown email runs a full scrypt against a startup-computed dummy hash with the current params; compare with `timingSafeEqual`; token lookups are by hash (equality on a SHA-256 of a 256-bit secret, not timing-exploitable) | A1, A4 |
| T6 | Reset-token replay / theft | Reused, guessed or leaked reset link | 256-bit token, only `sha256` stored, single use (`used_at` set in the same transaction as the password write, `UPDATE ... WHERE used_at IS NULL`), 60 min expiry, new request invalidates earlier tokens, success revokes all sessions, token carried in the URL fragment so it never reaches server logs or Referer, `Referrer-Policy: no-referrer`, link host from `CRM_PUBLIC_ORIGIN` (never `Host`: reset poisoning) | A6, A10 |
| T7 | Invite takeover | Guess or intercept an invite; invite for an existing account used to hijack it; role escalation | 256-bit hashed single-use token bound to `email_norm`, 7-day expiry, revocable; new email: accepter sets a password; existing account: acceptance requires an active login as that same email (token alone never attaches a membership to an existing account); invitable roles allow-list `manager`/`rep`/`reader` (never `worker`); inviter needs `user.invite`; tenant comes from the invite row, never the request | A5 |
| T8 | Dev Bearer left on in production | Static seeded token works on the internet | Env gate plus boot refusal; header ignored in prod; deploy runbook check `SELECT count(*) FROM crm.session WHERE kind='dev'` must be 0 | A4, A12 |
| T9 | Cookie theft (XSS) / session hijack | Script reads token | `HttpOnly`; token never in JS or storage; CSP delivered by nginx (note for `DEPLOY_EC2.md`); client stops using `sessionStorage` in cookie mode | A9 |
| T10 | Privilege and lifecycle | Removed or demoted user keeps access; last manager removed; a worker/service session used as login | `tenant_access()` already re-checks `membership.active` per request; role change/deactivate via definer functions with a last-manager guard; `kind` separates dev/service/cookie sessions | A5 |
| T11 | scrypt DoS | Many concurrent logins exhaust memory (about 128 MiB each at N=2^17) | Semaphore (max 2 concurrent hashes), 429/503 beyond it, password length cap 128 before hashing, throttle before hash | A1, A3 |
| T12 | Secrets in logs | Tokens, passwords, links in log lines or error bodies | Central redactor; stub mailer logs message id and a recipient hash only; link printed only when `CRM_MAIL_STUB_SHOW_LINK=1` and not production (D10); auth_event stores no token | A6, gate |
| T13 | Clickjacking | Framed login page | `X-Frame-Options: DENY` plus CSP `frame-ancestors 'none'` on HTML responses (small `api.ts` change in A4) | A4 |

## 4. Data model and migrations (013 onward; each ends with explicit `REVOKE ... FROM PUBLIC`)

Rules for every migration: `SECURITY DEFINER SET search_path=pg_catalog,crm`; `REVOKE EXECUTE ... FROM PUBLIC` then `GRANT ... TO crm_runtime` named per function; `REVOKE ALL` on new tables from PUBLIC and `crm_runtime`; add the new function names to the idempotent repair block in `scripts/migrate.ts`; extend the catalog test to assert "no `crm` SECURITY DEFINER function has PUBLIC EXECUTE" generically (not just a name list). Tables without `tenant_id` get `ENABLE ROW LEVEL SECURITY` with no policy (deny-all for non-owners, defence in depth; not `FORCE`, so definer functions owned by the migrator still work). Tenant-scoped tables use the standard `tenant_boundary` policy on `context_tenant_if_allowed()` plus `FORCE`.

**013_auth_credentials_sessions.sql**
- `crm.credential(principal_id uuid PK -> principal, email_norm text NOT NULL UNIQUE CHECK(email_norm = lower(email_norm) AND length <= 254), password_hash text NOT NULL, password_changed_at timestamptz, created_at)`. Email is normalised in app code (trim, lower-case, single `@`); no NFKC on email.
- `ALTER crm.session ADD kind text NOT NULL DEFAULT 'dev' CHECK(kind IN ('dev','service','cookie')), created_at, last_seen_at, absolute_expires_at, revoked_at, csrf_hash text, ua_hash text`. Backfill all rows `kind='dev'`.
- `CREATE OR REPLACE crm.actor()` and `crm.mfa_ok()`: add `revoked_at IS NULL AND (absolute_expires_at IS NULL OR absolute_expires_at>now())`. Same signature and grants, so every policy keeps working.
- Definer functions (runtime-callable): `auth_credential(email_norm)` returns `principal_id, password_hash` only for a principal with at least one active membership; `auth_session_create(principal, token_hash, csrf_hash, ua_hash, idle, absolute)`; `auth_session_info()` (principal, csrf_hash, memberships list; bound to the current token); `auth_session_touch()` (update `last_seen_at`/`expires_at` at most every 5 min); `auth_session_revoke(all boolean)`; `auth_password_set(principal, hash)` (also revokes sessions).
- `auth_event(id, at, principal_id null, tenant_id null, event text, ip_hash, request_id)`: append-only audit, insert through `auth_log()` definer only.

**014_auth_throttle.sql**: `crm.auth_throttle(key_hash text PK, window_start, count, blocked_until)`; `crm.auth_throttle_hit(key_hash, window_secs, limit)` returns `(allowed, retry_after_secs)` via atomic `INSERT ... ON CONFLICT DO UPDATE`; opportunistic purge of rows older than 1 day. Keys are `sha256(scope || ':' || value)` so emails and IPs are not stored in clear.

**015_auth_invites_members.sql**: `crm.invite(tenant_id, id, email_norm, role CHECK(role IN ('manager','rep','reader')), token_hash UNIQUE, invited_by, expires_at, accepted_at, revoked_at)`, RLS `tenant_boundary` + FORCE, no direct runtime DML. New `role_permission` rows for `manager`: `user.read`, `user.invite`, `user.manage`. Definers: `invite_create`, `invite_revoke`, `invite_list`, `invite_accept(token_hash, ...)` (the only function usable before login; takes the token hash and does all checks inside one transaction with `FOR UPDATE`), `member_list`, `member_set_role`, `member_deactivate` (refuse if it would remove the last active manager).

**016_auth_password_reset.sql**: `crm.password_reset(principal_id, token_hash UNIQUE, expires_at, used_at, issued_by null)`; definers `reset_request(email_norm, token_hash)` (no-op row if unknown email), `reset_consume(token_hash, new_hash)` (single transaction, `used_at` guard, revoke sessions), `reset_issue_for_member(principal)` (manager-issued link, needs `user.manage`).

**017_auth_totp.sql** (only if D1 = yes): `crm.credential_totp(principal_id PK, secret_enc bytea, nonce, enabled_at, last_step bigint)`, `crm.recovery_code(principal_id, code_hash, used_at)`, definer `auth_session_mark_mfa()`.

## 5. Cryptography and parameters

- **Hash**: `crypto.scrypt` (async, thread-pool), `N=2^17, r=8, p=1`, 32-byte key, 16-byte random salt, `maxmem=256 MiB` (Node default 32 MiB would throw). Stored as `scrypt$v1$kid$N$r$p$salt_b64$hash_b64`; verify reads params from the string; `timingSafeEqual`; on successful login rehash when params or pepper id are not current. Target 100-250 ms on the EC2 size; A1 ships a bench script; fallback `N=2^16, r=8, p=2` (OWASP-equivalent) if memory is short (D2).
- **Pepper**: `HMAC-SHA256(pepper, NFKC(password))` before scrypt. Env placeholders only: `CRM_AUTH_PEPPER_1` (32+ bytes, base64), `CRM_AUTH_PEPPER_ACTIVE=1`; older ids stay for verification during rotation. Missing or short pepper in production = refuse to start; never in DB, repo, logs or `.env.example` values (placeholder text only).
- **Tokens** (session, invite, reset, CSRF): `randomBytes(32)`, base64url, only SHA-256 stored. No custom crypto: only `node:crypto` primitives.
- **Password policy**: NFKC-normalise, 12-128 characters, not equal to email, not in the shipped top-common list; no composition rules.
- **Cookie** `__Host-crm_sid` (production; plain `crm_sid` when `CRM_COOKIE_SECURE=0` for http dev because `__Host-` requires `Secure`): `HttpOnly; Secure; SameSite=Lax; Path=/`, no `Domain`, `Max-Age` = absolute lifetime. Logout and revocation send `Max-Age=0`. Idle 8 h sliding, absolute 14 days (D4). `Cache-Control: no-store` already global.
- **Proxy**: API listens on 127.0.0.1 behind nginx. Client IP and `https` are read from `X-Forwarded-For`/`-Proto` only when `CRM_TRUST_PROXY=1`, taking the right-most value added by nginx; otherwise the socket address.

## 6. Rate-limit store: recommendation = in-database

| Option | For | Against |
|---|---|---|
| In-memory Map | zero latency, no migration | resets on restart (deploys, crashes), per-process, lost on a second process; weak for stuffing |
| **In-DB `crm.auth_throttle`** | survives restart, atomic upsert, shared by API and any future second process, auditable, no dependency | one small write per auth attempt (login volume is low); needs periodic purge |
| Redis | standard | new service and dependency: rejected |

Limits (initial, tunable by env): login per account 5 fails / 15 min with doubling `blocked_until` up to 15 min; per IP 30 / 15 min; per IP+account 10 / 15 min; reset request per email 3 / h and per IP 10 / h; invite accept per IP 20 / h. Throttle is checked before any scrypt. Success clears the account counter only. Throttle rows exist for unknown emails too (no enumeration). Response `429 RATE_LIMITED` with `Retry-After`.

## 7. Endpoints (all under `/v1/auth`, JSON only, handled before `context()` where no tenant is needed)

`POST login` (email, password) -> sets cookie, returns `{csrf_token, principal, tenants:[{id, role}]}`. `POST logout`. `GET session` (cookie only; returns csrf token and tenants; also returns 401 cleanly). `POST password/change`. `POST password/reset-request`, `POST password/reset-confirm`. `POST invites/accept`. Tenant-scoped (normal `context()` + CSRF): `GET/POST /v1/users`, `POST /v1/invites`, `DELETE /v1/invites/:id`, `PATCH /v1/users/:id`, `POST /v1/users/:id/reset-link`. Existing business routes only change in how the token reaches `Context` (cookie or dev Bearer) and in the new CSRF/Origin check for cookie-authenticated non-GETs.

## 8. Slices (server first, then plain UI; each = one agent round; commit only after the Lead's gate)

| Slice | Scope | Acceptance checks | Tests |
|---|---|---|---|
| **A1** Password primitives | `src/auth/password.ts` (hash/verify/rehash flag/pepper keyring/dummy verify/policy/semaphore), `src/auth/tokens.ts`, `scripts/bench-scrypt.ts` | N, r, p, maxmem as in §5; no import outside `node:crypto`; missing pepper fails in prod mode; bench output recorded | unit: round-trip, wrong pw, param-upgrade rehash, pepper rotation, malformed hash fails closed, 129-char rejected, dummy verify cost within 30% of real, policy list, token length/uniqueness |
| **A2** Migration 013 | credential, session hardening, `actor()`/`mfa_ok()` update, session and event definers, seed marks `kind='dev'` | all existing suites green (`test:db`); `actor()` honours `revoked_at`/absolute expiry; runtime cannot SELECT credential/session | db: revoked and expired sessions = 401; credential unreadable by runtime; cross-principal `auth_session_info`; generic catalog test: no definer with PUBLIC EXECUTE; dev session still works |
| **A3** Migration 014 + throttle | `auth_throttle` table and function, `src/auth/throttle.ts` | atomic under concurrency; keys hashed; purge works | db: limit hit/blocked/backoff/expiry, 20 parallel hits count exactly, unknown email throttled the same |
| **A4** Login, logout, session, cookie, CSRF, dev-Bearer gate | `src/auth/http.ts`, `api.ts` wiring (cookie parse, `context()` change, Origin and CSRF check, 415, frame headers, boot guard) | cookie flags exact; new token each login; Bearer ignored unless `CRM_DEV_BEARER=1`; boot refuses Bearer in production; generic errors | http+db: happy login; wrong pw / unknown email / no membership give identical body and similar timing shape; fixation (old cookie rejected, new minted); logout revokes server-side; CSRF missing/wrong/foreign Origin = 403 and no write; GET with cookie has no side effect; throttle 429; idle and absolute expiry; revoked principal membership = 403 |
| **A5** Migration 015: invites + members + bootstrap | invite and member definers, `src/auth/users.ts`, routes, `scripts/create-tenant-admin.ts` | RLS on `invite`; role allow-list; last-manager guard; link returned to the inviting manager | db/http: reader/rep cannot invite (403); tenant B manager cannot see or revoke A invites; token replay, expired, revoked, wrong email, role `worker` rejected; existing-account accept needs matching login; last-manager deactivate refused; demoted user loses scope on next request |
| **A6** Migration 016: password reset + mailer stub | reset definers, `src/auth/mailer.ts` (interface + stub; logs id and recipient hash; link only under `CRM_MAIL_STUB_SHOW_LINK=1` and non-production), manager-issued reset link | same body and timing shape for unknown/known email; single use; sessions revoked | db/http: replay fails, expiry, newer request voids older, concurrent double-consume (one wins), password policy enforced, old sessions 401, log capture contains no token/password |
| **A7** TOTP (if D1 = yes), migration 017 | RFC 6238 over `node:crypto` HMAC, AES-256-GCM secret encryption with `CRM_AUTH_TOTP_KEY` (placeholder), enrol/verify, 8 recovery codes, login step-up marks `mfa_verified` | manager session without TOTP gets no manager scope; ±1 step window; step reuse refused | unit: RFC test vectors; db/http: enrol, wrong code throttled, replay of same step, recovery code single use, `mfa_ok` end-to-end |
| **A8** Server hardening + review prep | session list and revoke-all, `password/change`, throttle purge job, redactor, update `P1A_THREAT_MODEL.md`-style notes into `AUTH_THREAT_MODEL.md`, negative-test sweep | every row of §3 has a passing test or a labelled hypothesis | full `lint`, `typecheck`, `test:unit`, `test:db`, `test:bootstrap` output captured |
| **GATE S1** | `tsst-dev` SK-007/008 security review of A1-A8 (source plus tests), written to `audits/<date>/AUTH_SECURITY_REVIEW.md` | no open BLOCKER or MAJOR; Lead verifies, then commits | review re-runs T1-T13 against the diff |
| **A9** Plain UI: sign-in | login page, cookie bootstrap through `GET /v1/auth/session`, CSRF header and `credentials:'same-origin'` in `app/src/api/client.ts`, logout, `ConnectGate` kept only when `VITE_DEV_BEARER` is set; AR/EN, RTL | no credential in `sessionStorage` in cookie mode; 401 returns to login | vitest client headers; Playwright login/logout, wrong password message, AR and EN |
| **A10** Plain UI: invite accept, forgot/reset | pages reading the token from the URL fragment, `Referrer-Policy: no-referrer` | token never sent in a query string | Playwright: accept flow, reset flow, expired/used link message, fragment cleared after read |
| **A11** Plain UI: users admin | members table, invite form (copy link), change role, deactivate, revoke invite, issue reset link, my sessions, change password; TOTP enrol if A7 | controls hidden for non-managers **and** server returns 403 | Playwright manager vs rep; API 403 asserted directly |
| **A12** SES adapter (code only) + ops notes | `src/auth/mailer-ses.ts` behind the interface, lazy `import()`; env placeholders `CRM_MAIL_MODE`, `CRM_MAIL_FROM`; add `@aws-sdk/client-sesv2` exact pin only at this slice (approved §6) then lint/typecheck/build; deploy-runbook checks (dev-session count, pepper set, `CRM_TRUST_PROXY`) | no AWS call in tests (client mocked); nothing runs without `CRM_MAIL_MODE=ses` | unit with mock client; build passes |
| **GATE S2** | delta review of A9-A12 (client token handling, link handling, CSP note, SES adapter) | no open BLOCKER/MAJOR | Lead verifies, then commits |

Critical path to a sellable sign-in: A1-A6, A7 (if D1 yes), A8, S1, A9-A11, S2. A12 can slip until the user supplies SES.

## 9. Security-review gate (before any commit)

For both gates: bind repo and revision; trace each §3 row to code and a passing test; confirm negative tests (unauthenticated, cross-tenant, expired, revoked, replayed token, wrong Origin, no CSRF token); grep logs and fixtures for token or password leakage; confirm every new definer has fixed `search_path` and `REVOKE ... FROM PUBLIC` in catalog output; confirm dev-Bearer production refusal; confirm `.env` and `local-fixture.json` untouched. Output is a review file with findings and residual risk; the Lead commits only after "no unresolved BLOCKER or MAJOR". Using the skills does not validate them; readiness stays `NOT_READY`.

## 10. Decisions needed (recommended answer first)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Managers need `mfa_verified` (`mfa_ok`). Password-only sessions would lock out all managers. | Build in-house TOTP (A7) and make it mandatory for managers. Rejected: weakening `mfa_ok` for password sessions (silent security downgrade). |
| D2 | scrypt cost vs EC2 size | `N=2^17, r=8, p=1`, 2 concurrent hashes; benchmark in A1; drop to `N=2^16, p=2` only if the instance has under 2 GB RAM. |
| D3 | Pepper | Yes: env keyring with id, HMAC pre-hash, refuse to start without it in production; the user stores the value (Secrets Manager or a root-only env file). |
| D4 | Session lifetime | Idle 8 h sliding, absolute 14 days, revoke-all on password change/reset. |
| D5 | Rate-limit store | In-DB (`crm.auth_throttle`), not in-memory. |
| D6 | DB access for auth | Definer functions granted to `crm_runtime` (matches 001/008), not a second DB role. |
| D7 | SameSite | `Lax` plus Origin check plus synchronizer CSRF token; `__Host-` prefix only in production. |
| D8 | Tenant onboarding | No open signup; bootstrap script creates tenant and first-manager invite. |
| D9 | One account in several tenants | Yes (schema already allows it); tenant chosen per request, verified by membership. |
| D10 | Mail before SES exists | Stub logs only; invite and manager-issued reset links are shown to the manager for copy-paste in the UI, so the product works without email. Production reset-by-email stays disabled until A12 plus SES setup. |
| D11 | Breached-password check (HIBP) | Defer (needs an outbound call); ship the in-house common-password list now. |
| D12 | Dev Bearer | Keep behind `CRM_DEV_BEARER=1`, boot refusal in production, `kind='dev'` rows must be zero at deploy. |
| D13 | Service/worker sessions | Keep `kind='service'`, long-lived, minted by script, rotated manually; never accepted over HTTP in production. |

## 11. Risks and open items

- `crm.actor()` and `mfa_ok()` are replaced in A2: highest regression risk; the full `test:db` suite is the guard.
- All existing definers outside this work were not re-audited (same limit as the P1A review).
- scrypt memory use and Node `maxmem` behaviour must be confirmed on the target instance (A1 bench).
- Multi-process deployment later needs nothing extra for throttle (in-DB), but the semaphore is per process.
- Not covered: SSO/OIDC, CAPTCHA, device management, email verification beyond invite/reset token possession.
