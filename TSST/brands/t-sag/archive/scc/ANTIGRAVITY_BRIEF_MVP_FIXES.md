# Antigravity follow-up — SCC MVP fixes · 2026-10-07

> **للتشغيل:**
> 1. شغّل Docker Desktop.
> 2. افتح **نفس محادثة الـ MVP** في Antigravity. لو المحادثة اتقفلت، افتح واحدة جديدة على نفس الفولدر، والبرومت هيمشي فيها برضه.
> 3. الصق اللي تحت "PROMPT".
>
> اقتراح: جرّب في الجولة دي موديل **Claude Opus 5.5** من قايمة Antigravity بدل Gemini. الجولة اللي فاتت كان فيها اختبارات شكلية، والموديل ده بيتحسب على باقة Antigravity مش على باقتنا.
>
> المصدر: مراجعة DEV `reviews/MVP_REVIEW_2d1879d.md`، والحكم: مرفوض لحد ما التصليحات تتعمل.

## PROMPT
```
A code review of feat/scc-mvp (2d1879d) REJECTED it. Typecheck/lint/tests are green, but 4 of the new tests are `expect(true)` placeholders and several behaviours are broken. Fix everything below on feat/scc-mvp as NEW commits (no amend). Docker Desktop is running.

LEAD DECISION (tenant model): SCC has ONE operator tenant ("Systronic"). Customers are rows inside that tenant. `POST /customers` must NOT create a new tenant per customer (foundation.ts ~L101); it creates a customer in the actor's tenant. Keep RLS as is. The operator must see all customers on /home, /alerts, /customers.

BLOCKING
1. setup-admin (apps/api/src/setup-admin.ts): it prints the literal "${password}" (line 13 uses a normal string, not a template literal), accepts weak passwords, creates no user_tenant_roles row (so the admin cannot log in: login needs tenantId + role, foundation.ts ~L50-57), and silently overwrites an existing admin. Fix: password from env var SCC_ADMIN_PASSWORD or generated; require >= 12 chars with letters + digits; print a generated password ONCE via a template literal; create/ensure the Systronic tenant + the admin's user_tenant_roles row; refuse to overwrite an existing admin unless `--reset`. Never take the password from argv.
2. Worker rewrite deleted existing duties (apps/api/src/worker.ts): the outbox `heartbeat.evaluate` job is just marked completed (~L38) so devices.status never updates; device-offline + SLA-breach notifications and notification delivery are gone; interval changed. The spec said HIDE, not delete. Restore every original duty from fix/scc-phase0-keys:apps/api/src/worker.ts and add the MVP health/alerts logic alongside it.
3. Worker exits after the first cycle: `timer.unref()` at ~L158 with nothing else keeping the event loop alive. The worker must keep running as a standalone process.
4. Acknowledge breaks dedup: dedup/resolve only look at status='open', so after acknowledge the next cycle opens a NEW alert and sends Telegram again, and the acknowledged one never resolves. Treat 'acknowledged' as live: new migration 003 replacing the unique index with (installation_id, rule) WHERE status IN ('open','acknowledged'); resolve both statuses on recovery.
5. Payments do not reach the device: /payments only changes DB expires_at; the signed grant_token keeps the old expiry, and /device/v1/license returns that token. Re-sign a new grant (with Phase 0 signing) with the extended expiresAt AND graceUntil in the same transaction; extend from max(now, current expiry); audit both the payment and the licence change.
6. Placeholder tests: tests/integration/health.test.ts and payments.test.ts assert nothing. Replace with real tests:
   - health rules, table-driven: each RED/AMBER/GREEN rule, business hours, recovery, crash rule, backup-only-if-ever-reported;
   - alert lifecycle: open → acknowledge → no duplicate + no second Telegram → recovery resolves; Telegram HTTP mocked, message text checked, non-2xx handled;
   - payment extends the SIGNED grant (decode it and check exp) + audit rows; revoke then the device's licence refresh is rejected;
   - dashboard (tests/ui): Home renders green/amber/red + empty state; an action shows the in-page confirm step before calling the API.

IMPORTANT
7. Health column flaps: heartbeat writes the SDK value 'healthy' (foundation.ts ~L375) over the worker's GREEN/AMBER/RED every 20s. Give the worker its own column (e.g. ops_health via migration 003) and use it everywhere in the dashboard/home.
8. customer-details (/api/v1/customer-details/:id) returns licences `l.*` including grant_token and SELECT * on installations/audit; audit query not tenant-filtered. Select explicit columns, never return grant_token, filter audit by tenant_id.
9. Worker robustness: try/catch per installation; send Telegram AFTER the DB commit; check the HTTP status; digest must not be marked done before a successful send, and must not depend on a cycle landing exactly on 09:00 (send once per Cairo day at or after 09:00).
10. Telegram text: Arabic rule labels (not raw codes), "since <time>", dashboard URL from config (SCC_DASHBOARD_URL), not hardcoded.
11. Thresholds (30 min, 24 h, 4 h, 30 days, 26 h, 3 crashes/1 h) must be in config.ts with these defaults, overridable by env, so the demo can use short values.
12. Business hours: validate with a schema (not z.any()), support overnight ranges (e.g. 18:00–02:00), and don't send a false "recovered" when an alert switches rule while still RED.
13. Dashboard: replace every window.prompt/alert/confirm with in-page forms and an in-page confirm step; branch form with business hours; issue licence with product select, expiry date, max devices, grace days; payment with amount, method select, date, note; show the enrollment token once with a copy button (API returns `token`, the UI reads `tokenHash` → shows "undefined", CustomersView.tsx ~L62); add a way to set remote_support_id; idempotency keys via crypto.randomUUID(); ALL strings in i18n.ts; remove `any`.
14. Rate limit behind the reverse proxy: configure trustProxy so clients don't share one bucket.
15. Simulator demo: add the missing way to run it (the report's `npm run start -w examples/client-simulator` does not exist; use or document `npm run simulate`), and an easy way to stop/start one device.

VERIFY BEFORE REPORTING
- After your LAST edit: docker compose up -d postgres, npm run db:migrate, npm run typecheck, npm run lint, npm test. Report the count per test file.
- Run the acceptance demo yourself with short thresholds (Telegram unset → console): admin setup + login, add customer/branch, enroll 2 simulated devices, stop one → RED alert + console message, acknowledge it → no duplicate, restart → resolved message, record a payment → decoded grant has the new expiry. Paste the key console lines.
- docker compose stop. Stop every process you started.

RULES: no push/merge/PR/deploy; no secrets in code/logs/commits/report; nothing outside this repo; no placeholder or always-true tests; if something needs a bigger redesign, stop and ask.

REPORT (plain Egyptian Arabic; file names/commands in English): fix by fix (one line each), test counts per file, demo console lines, what is not done, git log --oneline fix/scc-phase0-keys..HEAD.
```
