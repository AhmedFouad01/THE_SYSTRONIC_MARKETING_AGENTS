# Cafe (CRMS) — Lead handoff for the next session (2026-11-10)

Read root `AGENTS.md` → `TSST/core/rules.md` first (R61: Claude is the direct Lead). Reply to Ahmed in short Egyptian Arabic, verdict first. Get scope + cost OK before any dispatch.

## Where things are

- **Cafe repo:** https://github.com/Do7a193/CAFE_RESTAURANT_MS. Nothing below is merged; no PRs. Each branch is built on the one before it:
  - `codex/crms-cashier-first-036` @ `d89ead8`: docs only since `545f595` (handoff, checklist, paper fallback, QA run, 014 row).
  - `codex/crms-beta-e2e-008` @ `3815b60`: runner `verify:crms-002w:local` (one-order HTTP E2E).
  - `codex/crms-close-kds-message-009` @ `2be3e6e`: Arabic kitchen-close message.
  - `codex/crms-cashier-close-010` @ `7f28f69`: migration 0032, CASH_CUSTODIAN can close.
  - `codex/crms-dashboard-gate-011` @ `d32b94e`: dashboard gate, role landing, Arabic close messages map.
  - `claude/crms-kds-language-012` @ `8f46c25`: KDS/Dashboard wording.
  - `claude/crms-pending-payment-guard-013` @ `24adf83`: pending payments reserve the balance.
  - `claude/crms-cashier-grants-014` @ `15e31e2`: migration 0033, the cashier runs takeaway and dine-in alone (F1–F3). **This is the tip.**
- **Records:** `TSST/bus/out/CRMS-TSST-00{8..12}.md`, `TSST/projects/cafe/tasks/CRMS-TSST-0{08..13}-*.md`, and Cafe `docs/gates/CRMS-CLOUD-HANDOFF.md` (log rows) + `CRMS-BETA-ACCEPTANCE-CHECKLIST.md` + `CRMS-BETA-PAPER-FALLBACK.md` + `CRMS-BETA-QA-RUN-2026-11-10.md`.
- **Owner decisions (2026-11-10):** the cashier closes bills; printing is out of the Beta (KDS only); the offline plan is paper.
- **Bus:** 008, 009 and 010 closed. 011 and 012 were cancelled on the bus because Codex hit its usage limit; the Lead finished them and the work was accepted (see their out files). 013 was done by the Lead without a bus task. 3 old VILL tasks are still `done` and waiting for a Lead close (not Cafe).

## QA run result (Cafe `docs/gates/CRMS-BETA-QA-RUN-2026-11-10.md`)

All money paths are correct (6 bills, 400.00, no over-collection, no pending payment). New blockers:

- **F1:** the cashier cannot create a bill.
- **F2:** the cashier cannot close from POS, because it has no `kds.read`, so `/kds/queue` returns 403 and the close button never appears.

Also:

- **F3:** the cashier cannot open a dine-in table. This needs Ahmed's decision.
- **F4:** when the Edge is down, a raw English 502 message is shown, and staff are logged out after it comes back.
- **F5–F9:** minor (Billing labels, refresh, KDS labels, touch sizes, a11y).

## Next step (needs Ahmed's OK)

1. Done: F3 = yes (Ahmed: "صالة وتيك أواي"). F1–F3 were fixed in `CRMS-TSST-014` (`15e31e2`, `TSST/projects/cafe/tasks/CRMS-TSST-014-CASHIER-ALONE-GRANTS.md`).
2. Next: F4 (raw English 502 when the Edge is down, and staff logged out after it comes back), then F5.
3. Still needed from Ahmed: a real Android phone run with the QA CA (checklist A–H, a first-time cashier).

## QA environment (dies when the session that started it ends)

- QA clone `C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_BETAGATE_20261109`, detached at `15e31e2` (0033 applied). Its origin is a local mirror, so fetch new commits from the E2E008 clone path. Postgres/Redis are compose project `crmsbetaqa-20261109` (tmpfs: the data is lost when the containers stop). The Edge runs from `tmp/beta-qa/qa-env.sh` + `node apps/edge-api/dist/main.js`. The PWA runs from `vite preview --config tmp/beta-qa/vite.qa-https.config.mjs` (https://192.168.1.25:5194, QA CA in `tmp/beta-qa/tls`, valid until 2026-12-09).
- Rebuild if it is down: `docker compose -p crmsbetaqa-20261109 -f infra/docker/compose.crms-002a-verify.yaml up -d`, then `pnpm db:migrate` with qa-env, then `node tmp/beta-qa/seed-qa.mjs` (it writes new passwords to `QA-ACCOUNTS.local.md`; never print them), then build edge-api and the PWA **from PowerShell** with `VITE_EDGE_API_URL=/api/v1`, and copy `tls/crms-qa-ca.der.crt` to `apps/pwa/dist/crms-qa-ca.crt`.
- Lead browser runs: `tmp/beta-qa/session-for.py <user>` writes a one-time session for the loopback preview copy (`vite.qa-local.config.mjs`, 127.0.0.1:5195). Copy `apps/pwa/dist` to `tmp/beta-qa/dist-local` first, and delete that folder afterwards. `tmp/beta-qa/qa-api.py serve|bill <orderId>` runs the setup steps that are not under test.

## Gotchas

- Run `verify:crms-002e:local` from Git Bash: PowerShell has no `openssl`.
- Build the PWA from PowerShell: Git Bash rewrites `/api/v1`.
- `python -I` ignores `PYTHONIOENCODING`, so keep script output ASCII.
- The built-in browser blocks native `confirm()`. Override it in the page and log the messages.
- One 002w run failed during setup (`db:migrate` connection terminated). It was environment flakiness; rerun.
