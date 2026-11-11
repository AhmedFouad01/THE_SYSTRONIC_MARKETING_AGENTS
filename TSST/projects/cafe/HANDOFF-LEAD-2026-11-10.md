# Cafe (CRMS) — Lead handoff for the next session (2026-11-10)

Read root `AGENTS.md` → `TSST/core/rules.md` first (R61: Claude is the direct Lead). Reply to Ahmed in short Egyptian Arabic, verdict first. Get scope + cost OK before any dispatch.

## Where things are

- **Cafe repo:** https://github.com/Do7a193/CAFE_RESTAURANT_MS. Nothing below is merged; no PRs. Each branch is built on the one before it:
  - `codex/crms-cashier-first-036` @ `745f083`: docs only since `545f595` (handoff, checklist, paper fallback, QA run, 014–017 rows).
  - `codex/crms-beta-e2e-008` @ `3815b60`: runner `verify:crms-002w:local` (one-order HTTP E2E).
  - `codex/crms-close-kds-message-009` @ `2be3e6e`: Arabic kitchen-close message.
  - `codex/crms-cashier-close-010` @ `7f28f69`: migration 0032, CASH_CUSTODIAN can close.
  - `codex/crms-dashboard-gate-011` @ `d32b94e`: dashboard gate, role landing, Arabic close messages map.
  - `claude/crms-kds-language-012` @ `8f46c25`: KDS/Dashboard wording.
  - `claude/crms-pending-payment-guard-013` @ `24adf83`: pending payments reserve the balance.
  - `claude/crms-cashier-grants-014` @ `15e31e2`: migration 0033, the cashier runs takeaway and dine-in alone (F1–F3).
  - `claude/crms-offline-session-015` @ `44fa3bf`: Edge outage shows Arabic "offline", and the saved session survives it (F4). PWA only.
  - `claude/crms-billing-labels-016` @ `bf276e6`: Billing names bills by table or takeaway, with Arabic status, clean quantities, default amount and payment confirm (F5). Read-only `table_name`/`service_mode` on the bills API.
  - `claude/crms-pos-polish-017` @ `47b5747`: POS picks up a bill made elsewhere, "partly served" in KDS and POS, 44px targets, product names (F6–F9). Read-only `bill_id` on POS orders and `order_served_count` on the KDS queue.
  - `claude/crms-app-title-018` @ `b5ac7e0`: Arabic page title and app name. Pushed.
  - `claude/crms-edge-wording-019` @ `f6be50f`: manager screens say "النظام" instead of "Edge". **This is the tip.** Pushed.
  - The log row for both and for the Android run is on `codex/crms-cashier-first-036` @ `7ccf592`, pushed. Clone: `C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_E2E008`.
  - **RC:** `claude/crms-beta-rc` @ `514717f` = 019 + the 036 docs (merge, docs only), pushed. **PR https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/38 → `main`** (opened 2026-11-11 with Ahmed's OK "ابدأ 1–3"). GitHub says MERGEABLE/CLEAN, and there are no CI checks (both workflows are `workflow_dispatch` only). Gates on `514717f`: static, typecheck, lint and build exit 0; `@crms/testing` 8/8; 002e PASS (65/65, PWA 240/240); 002s PASS; 002w PASS twice (`317d0721c26d`, `5cec8fc78c8d`). Some runs failed earlier, all on timeouts: the PC had 0.5 GB of RAM free and rebooted at 20:05.
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
2. Done: F4 in `CRMS-TSST-015` (`44fa3bf`, `TSST/projects/cafe/tasks/CRMS-TSST-015-OFFLINE-WORDING-SESSION.md`). Left open there: a rare logout when a refresh reply is lost (needs an Edge grace window), and the "Edge" wording on manager screens.
2a. Done: F5 in `CRMS-TSST-016` (`bf276e6`, `TSST/projects/cafe/tasks/CRMS-TSST-016-BILLING-LABELS.md`).
2b. Done: F6–F9 in `CRMS-TSST-017` (`47b5747`, `TSST/projects/cafe/tasks/CRMS-TSST-017-POS-KDS-POLISH.md`). All QA findings F1–F9 are fixed on the stack.
3. Still needed from Ahmed: a real Android phone run with the QA CA (checklist A–H, a first-time cashier). **Ahmed 2026-11-10: paused for now; the next Cafe session starts with this run** (rebuild the QA env first, see below). Merge decision comes after it.
   **Done 2026-11-11 (real Android phone, QA CA trusted, `47b5747`, first-time cashier):** core path PASS per the DB. 4 dine-in orders + 1 takeaway; 6 kitchen items QUEUED → SERVED; 2 bills (QA-T02 190.00 cash, QA-T05 85.00 InstaPay with reference) closed by the cashier at 16:51 Cairo, paid = total, 0 outstanding, 0 overpaid; tabs CLOSED, all 5 tables AVAILABLE. Ahmed: "the cashier found it simple". Not seen in data (not run or not observable): D2 split payment, D3 overpay refusal, D4 pending payment, D7 reversal, C3/C4, B7, E roles. The waiter's smoke takeaway order is still SUBMITTED with no bill.
   Fixes done the same day (Ahmed: "ابدأ"): (1) `CRMS-TSST-018` Arabic page title and app name; (2) `CRMS-TSST-019` "Edge" wording off the manager screens. Gates PASS on `f6be50f`, and the QA env is on it. (3) The refresh grace window was **dropped** by Ahmed ("سيبه بره"), because it breaks the 002a replay check.
4. **Merged 2026-11-11** (Ahmed: "نعمل merge"): PR #38 → `main` as the merge commit `618def6` (parents `5cb2095` + `514717f`). The `main` tree equals the RC exactly. Rollback: `git revert -m 1 618def6`. Nothing was deployed. Migrations 0032/0033 apply only when `db:migrate` runs on a site. The stacked branches are kept as they are.
5. Plan agreed with Ahmed on 2026-11-11 to finish the Beta: (a) a short second phone run of the manual-only items not seen on 2026-11-11, (b) write the Beta acceptance in the Cafe log, (c) install at the real cafe (server, `db:migrate` 0032/0033, real accounts instead of the QA ones, the CA on each device, backups; not planned yet, it needs facts from Ahmed), (d) a first live day with the paper forms ready.
   The run items are: **D5** (close while the kitchen is still working must be refused), **C4** (kitchen down → close blocked), **H1–H3** (paper fallback; stop the Edge for 2 minutes; this is the checklist blocker for owner decision 3), **F1–F2** (keyboard open, field and button visible), and **B6** (move a table QA-T02 → QA-T03).
   **Status at the end of the 2026-11-11 session:** the QA env was rebuilt on the merged code (`f6be50f` = `main` code) and reseeded, so the passwords are new. The run was **not started**: Ahmed paused to commit and start a new development session. The QA Edge and PWA processes stop with that session. The containers `crmsbetaqa-20261109` may still be running; check with `docker ps`.
6. Next: Ahmed opens a new session to keep developing the program. The run in (a) is still open and can be done whenever he says.

## QA environment (dies when the session that started it ends)

- QA clone `C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_BETAGATE_20261109`, detached at `f6be50f` since 2026-11-11 (0033 applied; the Edge build is still from `47b5747`, which has the same Edge code). Its origin is a local mirror, so fetch new commits from the E2E008 clone path. Postgres/Redis are compose project `crmsbetaqa-20261109` (tmpfs: the data is lost when the containers stop). The Edge runs from `tmp/beta-qa/qa-env.sh` + `node apps/edge-api/dist/main.js`. The PWA runs from `vite preview --config tmp/beta-qa/vite.qa-https.config.mjs` (https://192.168.1.25:5194, QA CA in `tmp/beta-qa/tls`, valid until 2026-12-09).
- Rebuild if it is down: `docker compose -p crmsbetaqa-20261109 -f infra/docker/compose.crms-002a-verify.yaml up -d` **with `CRMS_VERIFY_POSTGRES_PORT=55460` and `CRMS_VERIFY_REDIS_PORT=55461`** (the defaults are other ports), then `pnpm db:migrate` with qa-env, then start the Edge, then `pnpm bootstrap:owner` from `tmp/beta-qa/.owner.tsv` (fields 1–2 = user and password; any 6-digit PIN), then `node tmp/beta-qa/seed-qa.mjs`, then `pnpm qa:seed-tables` (dine-in tables QA-T01..05; seed-qa does not make them) (it writes new passwords to `QA-ACCOUNTS.local.md`; never print them), then build edge-api and the PWA **from PowerShell** with `VITE_EDGE_API_URL=/api/v1`, and copy `tls/crms-qa-ca.der.crt` to `apps/pwa/dist/crms-qa-ca.crt`.
- Lead browser runs: `tmp/beta-qa/session-for.py <user>` writes a one-time session for the loopback preview copy (`vite.qa-local.config.mjs`, 127.0.0.1:5195). Copy `apps/pwa/dist` to `tmp/beta-qa/dist-local` first, and delete that folder afterwards. `tmp/beta-qa/qa-api.py serve|bill <orderId>` runs the setup steps that are not under test.

## Gotchas

- Run `verify:crms-002e:local` from Git Bash: PowerShell has no `openssl`.
- Build the PWA from PowerShell: Git Bash rewrites `/api/v1`.
- `python -I` ignores `PYTHONIOENCODING`, so keep script output ASCII.
- The built-in browser blocks native `confirm()`. Override it in the page and log the messages.
- 2026-11-11: the Docker engine died under Docker Desktop (`docker ps` hangs, WSL `docker-desktop` Stopped); the PWA shows "تعذر الاتصال بالنظام". Fix: kill the Docker Desktop processes, relaunch, then the full rebuild above (tmpfs data is gone, passwords change).
- One 002w run failed during setup (`db:migrate` connection terminated). It was environment flakiness; rerun.
