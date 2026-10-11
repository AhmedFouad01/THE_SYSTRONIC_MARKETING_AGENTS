# Antigravity brief — SCC MVP (after Phase 0) · 2026-10-07

> **للتشغيل:** بعد ما المرحلة 0 تخلص وDEV يراجعها. نفس الفولدر `C:\dev\systronic-control-center`، محادثة جديدة، موديل **Gemini 3.1 Pro (High)**، وتلصق كل اللي تحت "PROMPT".
> قبل ما تبدأ، اعمل بوت تليجرام من @BotFather وخلي التوكن معاك. **متلصقوش في الشات.** هتحطه بإيدك في ملف `.env` لما يطلب منك.
> لما يخلّص، هات تقريره، وDEV هيراجع مرة واحدة قبل الدمج.

MVP = Ahmed opens one dashboard, sees every customer device green/amber/red, gets a Telegram message when one dies, and issues, renews or revokes a licence with buttons. Nothing else.

## PROMPT
```
You are working in the Systronic Control Center (SCC) repository at C:\dev\systronic-control-center. The app is in the nested folder `systronic-control-center/` (run npm there). Phase 0 (persistent + pinned signing keys, refuse default secrets) is done on branch `fix/scc-phase0-keys`. Create branch `feat/scc-mvp` from it.

CONTEXT
SCC manages the software I sell (first product: YAKEBDA_MS, a restaurant system running on Windows PCs at each restaurant). I am a single operator, not a SaaS. The backend already has: device enrollment, signed licence grants with offline grace, heartbeats/telemetry, error reporting, audit log, Postgres with tenant_id + RLS. The current dashboard is a generic read-only table viewer (apps/dashboard: App.tsx nav + DataView.tsx); all actions are API-only; notifications in apps/api/src/worker.ts are console.log only. examples/client-simulator simulates a device.

GOAL: a usable MVP for one operator. Rebuild the dashboard cleanly, add the few missing actions, real phone alerts. Hide everything else.

FIRST: read the code you will touch, then write me a short plan (screens, endpoints, files) before editing.

1. SCOPE CUT (hide, do not delete backend code)
   - Single operator: one tenant ("Systronic") is used; hide tenant switching and the customer portal from the UI. Keep RLS and tenant_id as they are (dormant).
   - Remove from the dashboard navigation: rollouts/releases, remote config, tickets/SLA, reports, anything not listed below. Leave their API routes and tests intact.

2. DASHBOARD (rebuild apps/dashboard; Arabic, full RTL, clean and simple; keep all UI strings in one dictionary file so English can be added later; numbers and dates must render correctly in RTL)
   a. "الأجهزة دلوقتي" (home): every installation as a row/card: customer, branch, product, version, last seen (relative time), health badge (green/amber/red), licence days left. Sorted worst first. Search by customer. Summary counts at top (green/amber/red, licences expiring in 30 days).
   b. Customer page: customer + branches + installations + licences + payments + the last 20 events (heartbeats/errors) + a "remote support ID" text field per installation (MeshCentral/AnyDesk ID) with a copy button.
   c. Actions (each with an in-page confirm step, each written to the audit log):
      - add customer, add branch (with optional business hours open/close per day);
      - create a one-time device enrollment token (shown once, copy button);
      - issue licence (product, expiry date, max devices, offline grace days);
      - record payment (amount EGP, method: cash | Instapay | Vodafone Cash | bank transfer, date, note) and optionally extend the licence expiry in the same step;
      - revoke licence;
      - acknowledge an alert with a note.
   d. Alerts page: open alerts first, then resolved; who/when acknowledged.
   Add the backend endpoints these actions need if missing (payments table exists as payment_records; add fields only via a NEW migration).

3. HEALTH + ALERTS (server side)
   - Health per installation, worst rule wins:
     RED: no heartbeat > 30 min during the branch's business hours (or > 24 h if no business hours set), OR licence expired, OR >= 3 crash events in 1 h.
     AMBER: no heartbeat > 4 h outside business hours, OR licence expires within 30 days, OR last backup report older than 26 h (only if the installation ever reported backups).
     GREEN: otherwise.
     Put thresholds in config with these defaults.
   - The worker evaluates every minute: opens an alert per installation+rule (dedup), auto-resolves on recovery, never sends the same alert twice.
   - Telegram delivery: replace the console.log notifier with a Telegram Bot API notifier (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID from env). Message in Arabic: customer, branch, what happened, since when, dashboard link. Send on RED open and on resolve. Daily 09:00 Cairo time digest: licences expiring within 30 days + open alerts. If the token is missing, log a warning and keep console delivery (dev).
   - Never log or print the bot token.

4. SECURITY BASICS FOR THE OPERATOR LOGIN
   - Require a strong admin password at setup (no seeded default in production), rate-limit the login endpoint, session JWT as today.

5. RUN IT FOR REAL (prepare, do NOT deploy)
   - Add docker-compose.prod.yml (api, worker, dashboard behind one reverse proxy, postgres with a volume) and a runbook docs/runbooks/DEPLOY_VPS.md: env vars, key generation (from Phase 0), Telegram setup, backup of the Postgres volume and the keys folder.
   - Update examples/client-simulator so I can run N fake devices and stop one to trigger an alert.

TESTS (add; all must pass)
   - health rules (each rule, business hours, recovery);
   - alert dedup + auto-resolve + Telegram notifier called with the right text (mock the HTTP call);
   - record payment extends licence and writes audit entries; revoke works and the SDK then rejects the grant after refresh;
   - dashboard: home screen renders green/amber/red states and empty state; actions show confirm step.
   Run from systronic-control-center/: npm run typecheck, npm run lint, npm test. If Docker/Postgres is unavailable, say exactly which suites did not run.

ACCEPTANCE DEMO (describe in the report exactly how I run it)
   1. Log in, add a customer + branch, create an enrollment token.
   2. Start 3 simulated devices with the simulator → all green on the home screen.
   3. Stop one (with a short threshold for the demo) → it turns red and a Telegram message arrives → restart it → it turns green and a "resolved" message arrives.
   4. Issue a licence, record a payment that extends it, revoke it.

CONSTRAINTS
   - Do not touch the YAKEBDA repo. Do not push, merge, open a PR or deploy anything.
   - No secrets, tokens or keys in code, logs, commits or the report.
   - Prefer existing libraries already in the repo; justify any new dependency.
   - Small focused commits on feat/scc-mvp. If something needs a bigger redesign, stop and ask.

REPORT (plain Egyptian Arabic; file names/commands in English)
   1. What you built, screen by screen and endpoint by endpoint.
   2. Commands run + pass/fail summary lines.
   3. Exact steps for the acceptance demo.
   4. What is not done or not verified.
   5. git log --oneline of the branch.
```
