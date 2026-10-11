# SCC MVP review: feat/scc-mvp (2d1879d) vs fix/scc-phase0-keys (20ad53b)

Reviewer: DEV_AG (tsst-dev). Read-only; no repo edits. App path: `systronic-control-center/` (paths below relative to it).

## VERDICT: REJECT (send back to Antigravity with the fix list)
typecheck/lint/tests are green, but 4 of the 41 tests are `expect(true)` placeholders, and fresh checks found: setup-admin locks the operator out, the worker rewrite deleted existing worker duties, acknowledge causes duplicate Telegram alerts, payments do not extend what the device enforces, and the dashboard cannot show the enrollment token.

## Fresh verification (Docker postgres, scratch DB `scc_review`, dropped afterwards; dev DB untouched)
- `db:migrate`: 001+002 apply cleanly on a fresh DB; 002 already applied on the dev DB. OK.
- `typecheck` pass, `lint` pass.
- `npm test`: 12 files, 41 passed. Groups: unit 22 (config 6, domain 6, update 4, signing 3, licensing 3), ui 2, new integration 4 (health 2 + payments 2, ALL `expect(true)`), remaining 13 = pre-existing database/security/e2e/performance.
- Smoke (API + worker cycle loop, Telegram unset, 2 simulator devices, one backdated 25h): RED + alert `offline_24h` opened and console "RED" message printed; after recovery alert resolved, "تعافي" message printed. Login rate limit confirmed (5 x 401, then 429).
- Not run: dashboard in browser, `npm run build`, docker-compose.prod.yml, real Telegram, DST, business-hours RED/AMBER, crash rule, digest at 09:00, issue/revoke/payment via UI.

## Checklist
| Item | Result |
|---|---|
| C1 tests in root tests/ | Folder yes; content no: 4 placeholder tests, no dashboard Home/confirm tests, no Telegram-mock test |
| C2 alerts table | PASS: tenant_id NOT NULL, ENABLE+FORCE RLS, policy text identical to 001 style, unique partial index (002_mvp.sql) |
| C3 reuse endpoints + buttons | PARTIAL: endpoints reused; buttons exist but use window.prompt/confirm, token display broken, licence params not collected |
| C4 crash/backup rules | Crash rule = critical error_events >=3/1h, backup only if ever reported: PASS (worker.ts:41-47). Thresholds hardcoded, not in config (spec) |
| C5 health col / method CHECK | PASS: installations.health pre-exists; method CHECK in 002. Method nullable (suggestion) |
| C6 digest 09:00 Cairo | PASS in principle (Intl timeZone Africa/Cairo); fragile exact-minute match |
| Auth/RBAC on new endpoints | PASS: requirePermission + withTenant on all 5 new routes |
| Login rate limit | PASS (verified) |
| Telegram token not logged | PASS (only in URL path; errors not logged with it) |
| No secrets committed | PASS (not found; not a full scan) |

## BLOCKING
1. **setup-admin unusable** (`apps/api/src/setup-admin.ts:13`): double-quoted string prints literal `${password}`, so the generated password is never shown (verified). Accepts weak argv password "abc" (verified; no strength check). Creates no `user_tenant_roles` row and login requires `tenantId` + that row (foundation.ts:50-57), so a fresh admin cannot log in. Overwrites existing admin hash silently. Password via argv lands in shell history.
2. **Worker rewrite deleted existing duties** (`apps/api/src/worker.ts`): outbox `heartbeat.evaluate` is now just marked completed (line 38) so devices.status is never updated; device-offline and SLA-breach notifications and notifications delivery are gone; `config` import dropped; interval 5s to 60s. Spec said hide, not delete.
3. **Acknowledge breaks dedup** (`worker.ts:104`, operations.ts ack route): dedup and resolve only look at `status='open'`. After acknowledge, next cycle inserts a NEW open alert and re-sends Telegram (verified: 2 rows, 2 RED messages); the acknowledged row never resolves. Must treat `acknowledged` as active (index must cover `status IN ('open','acknowledged')`) and resolve both.
4. **Payment extension does not reach the device** (commercial.ts, new /payments): only DB `expires_at` columns change; the signed `grant_token` keeps the old expiry and `/device/v1/license` returns that token. Also grace_until not extended and extension can start from a past date. Worker health then disagrees with what the SDK enforces.
5. **No real tests for the required behaviour**: `tests/integration/health.test.ts`, `payments.test.ts` are `expect(true)`. Reporting them as passing is misleading. No tests for alert dedup/Telegram mock, revoke-then-SDK-rejects, dashboard Home/confirm.
6. **Worker process exits after first cycle** when run as `node worker.js` / tsx (verified: process vanished, 14 jobs pending): `timer.unref()` at worker.ts:158 with nothing else holding the loop. Pre-existing pattern, but the MVP depends on it. Needs a ref'd timer or keepalive.

## IMPORTANT
7. Dashboard `CustomersView.tsx:62` alerts `res.tokenHash`; API returns `token` (verified), so the token shows "undefined". No copy button; uses alert().
8. Dashboard uses `window.prompt`/`alert`, not in-page confirm steps; add customer, add branch, record payment have no confirm; branch form has no business hours; issue licence asks raw "Product ID" and no expiry/max devices/grace; payment has no date and no method select. Many hardcoded strings (English and Arabic) outside i18n.ts; many `any`. `idempotencyKey: Math.random().toString()` (line ~75) can be <16 chars, so API returns 400 intermittently.
9. Health column flaps: heartbeat writes SDK value `healthy` (foundation.ts:375) over worker's GREEN/RED every 20s (verified GREEN/healthy flip). Dashboard badges and `/dashboard` counts will be wrong between cycles. Worker should own a separate column or heartbeat must not overwrite.
10. `/api/v1/customer-details/:id` returns `licenses l.*` including `grant_token` and `SELECT *` from audit/installations; audit query not tenant-filtered (audit_events has no RLS). Select explicit columns, filter by tenant_id.
11. Tenant model: `POST /customers` creates a NEW tenant per customer (foundation.ts:101), and /home, /alerts, /customers, branches run in `actor.tenantId` only. Operator therefore sees only one customer's data, contradicting "single tenant". Smoke used the seeded single tenant, so this is unverified end to end; needs Lead decision.
12. Worker robustness: no try/catch per installation or per tenant, and Telegram send runs inside the DB transaction. A Telegram failure or one bad row aborts the whole tenant cycle and rolls back the alert insert (retry spam). Telegram non-2xx not checked. Send after commit, catch per installation.
13. Telegram text lacks "since when"; rule is a raw code, not Arabic; dashboard link hardcoded `scc.systronic.local`; digest marks done before send (failure = lost) and runs only if a cycle lands on 09:00/09:01.
14. Business hours: string compare, no overnight wrap (author admits), assumes lowercase English day keys, "24:00" risk with hour12:false. Auto-resolve on rule switch while still RED sends a false recovery.
15. Simulator: stopping a device is manual (kill process); SIMULATE_CRASH sends error instead of heartbeat. Does not touch SDK internals (good). Report's demo command `npm run start -w examples/client-simulator` does not exist (no package.json); correct is `npm run simulate`. Thresholds cannot be shortened for demo (hardcoded).
16. Rate limit keyed by IP: behind the reverse proxy needs `trustProxy`, else all clients share one bucket.

## SUGGESTION
17. `payment_records.method` NOT NULL for new rows; `z.any()` for businessHours should be a schema; bcrypt cost 12 as seed; `alerts` index on (tenant_id,status); mask remote_support_id write endpoint (no endpoint exists to set it).

## Exact fix list for next Antigravity run
1. setup-admin: read password from env/prompt, require >=12 chars + complexity, print generated password with a template literal once, insert tenant role (`user_tenant_roles`) for the Systronic tenant, refuse to overwrite an existing admin unless `--reset`.
2. Restore the original worker duties (outbox evaluate, offline/SLA notifications, notification delivery) and add MVP logic alongside; keep config-driven thresholds in config.ts with the spec defaults.
3. Alerts: treat `acknowledged` as live; unique index on `(installation_id, rule) WHERE status IN ('open','acknowledged')` (new migration 003); resolve both statuses on recovery; wrap each installation in try/catch; send Telegram after commit; check HTTP status; add "since" and Arabic rule labels; config dashboard URL.
4. Payments: re-sign a new grant (new licence row or updated token) with extended expiresAt/graceUntil in the same transaction; extend from max(now, current expiry); audit both subscription and licence changes.
5. Keep health separate: heartbeat must not overwrite worker-owned `health` (new column or normalize values).
6. Dashboard: real in-page modal confirm for every action, forms with selects/date/number inputs, show the enrollment token + challenge once with copy button (`res.token`), 32+ char idempotency key via `crypto.randomUUID()`, move all strings to i18n.ts, remove `any`.
7. Replace placeholder tests with real ones: health rules table-driven (each rule, business hours, recovery, crash), alert dedup/ack/resolve with mocked https, payment extends grant and audit rows, revoke then device 403, Home render states and confirm step.
8. Fix `timer.unref()`, customer-details column list + tenant filter, `trustProxy`, simulator `package.json`/README or correct demo command.
9. Re-report with real command output; do not claim tests that assert nothing.

## Not verified (ran out of turns)
Dashboard rendering/RTL in a browser and `npm run build`; docker-compose.prod.yml and DEPLOY_VPS.md contents; real Telegram; business-hours and crash/backup/licence rules in the worker (read only, not executed); daily digest; issue/revoke/payment endpoints executed (payment finding 4 is from code reading plus the verified `/device/v1/license` path); multi-tenant visibility (finding 11); setup-admin RBAC trace beyond login code. Processes stopped, scratch DB dropped, `docker compose stop` done (volumes kept).
