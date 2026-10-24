# CRMS-TSST-004 — Two-Cashier Table-Claim E2E QA Runbook

Date: 2026-10-24
Project: CAFE_RESTAURANT_MS
GitHub review target: https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34
Candidate POS SHA: `ca01c872a0c84039ead2713e102f4cf14a7c863f`
Last owner QA evidence: 2026-10-20 PWA 150/150 historical PASS, not rerun by this checkpoint.
**Current state: `E2E_NOT_EXECUTED — REQUIRES_OWNER_LOCAL_QA_SESSION`.** This is a prescribed test and inspected source, not a successful live test.

## 0. Safety and boundaries

- Run only against the owner's **local isolated QA database** and fake `QA-Txx` tables / `QA Burger` item; never use a live customer table, payment, or production site.
- **Do not** run `RESET-CRMS-QA.cmd`, `pnpm qa:clean-local`, or `pnpm qa:reset-tables` merely to perform this test: those are state-mutating recovery utilities, including QA record state changes. Do not bypass database triggers.
- `START-CRMS-DEV.cmd` boots Docker and can run migrations: use it **only if this is an authorized QA environment**, not on production. If already running, keep the current session.
- No GitHub Actions, source edits, PR merge/rebase or deployment.
- Do not send screenshots of Authorization/Bearer tokens, cookies, raw request headers, `.env`, password, HAR archives or customer data. Share cropped Network **Method/Path/Status** and a sanitized SQL result only.
- The two browsers must have independent login sessions; use Chrome regular and incognito/separate profile. Both must have POS permissions. Distinct users are preferred, with cashier A and cashier B if already provisioned; do not create credentials as part of this test.

## 1. Local source identity and QA readiness (read-only)

From Windows PowerShell:

```powershell
cd C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS
git branch --show-current
git rev-parse HEAD
git status --short
```

Expected for the POS candidate: branch `fix/crms-pos-readd-after-empty-cancel`, HEAD exactly `ca01c872a0c84039ead2713e102f4cf14a7c863f`, and clean status. If branch/SHA differs, **STOP** and report it. Do not force switch/rebase/pull while the runtime is active.

Application endpoints (confirmed from `scripts/start-crms-dev.ps1`): POS `http://localhost:5174/pos`, Edge health `http://localhost:8443/api/v1/health/live`.

The runtime must already be healthy; if not, start `START-CRMS-DEV.cmd` **only after** confirming the `.env` targets local isolated QA. Do not run it against production.

## 2. Read-only PostgreSQL evidence script (run both before and after competing claim)

Paste exactly as one PowerShell block in the project root. Changes no data: transaction is explicitly `READ ONLY`. `QA-T01` is the example; choose a verified unused `QA-Txx` table consistently for both operators and query.

```powershell
$Sql = @'
BEGIN TRANSACTION READ ONLY;
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'orders'
  AND indexname = 'ux_table_tabs_one_live_per_table';
SELECT t.code, t.status AS table_status, t.active,
       COUNT(DISTINCT tt.id) AS live_tabs,
       COUNT(DISTINCT o.id) AS nonterminal_orders,
       COUNT(DISTINCT oi.id) AS noncancelled_items
FROM operations.sites AS s
JOIN orders.tables AS t ON t.site_id = s.id
LEFT JOIN orders.table_tabs AS tt
  ON tt.table_id = t.id
 AND tt.status IN ('OPEN','ACTIVE','BILL_REQUESTED','CLOSING')
LEFT JOIN orders.orders AS o
  ON o.table_tab_id = tt.id
 AND o.status NOT IN ('CLOSED','CANCELLED','VOIDED')
LEFT JOIN orders.order_items AS oi
  ON oi.order_id = o.id
 AND oi.status NOT IN ('CANCELLED','VOIDED','WASTED')
WHERE s.code = 'SITE-001' AND t.code = 'QA-T01'
GROUP BY t.code, t.status, t.active;
COMMIT;
'@
$Sql | docker compose -f infra/docker/compose.yaml exec -T postgres psql -U crms_app -d crms -X -v ON_ERROR_STOP=1 -P pager=off
```

- Initial: require exactly one `QA-T01` result, `active=t`, `table_status=AVAILABLE`, `live_tabs=0`. If not, **STOP**: use another genuinely empty QA table (and edit `QA-T01` in query consistently) or arrange a separately approved QA cleanup.
- Index must be present as `ux_table_tabs_one_live_per_table`; this partial unique index is defined in `infra/db/migrations/0004_catalog_orders_kds.sql` for live statuses.
- Before A's attempt, after B opens one order and adds exactly one QA Burger/Fries item, record counts `live_tabs=1`, `nonterminal_orders=1`, `noncancelled_items=1` (assuming no earlier QA work exists on the chosen table). If counts differ, investigate fixture state rather than forcing PASS.
- After A's rejected claim, repeat the same query. The three counts must remain **identical** to B's recorded values. If a duplicate appears, STOP and report.
- `psql` should exit with status 0; any SQL error, wrong DB, missing schema or missing fixture = `BLOCKED`, not PASS.

## 3. Two-browser, deliberately stale-state scenario

1. **Cashier A**, Chrome session 1: log into `http://localhost:5174/pos`. Select the empty `QA Table 01` but **do not tap any product yet**. A's front-end now holds the selection and an earlier AVAILABLE occupancy snapshot. Keep this tab open; don't refresh it.
2. **Cashier B**, independent Chrome session 2: log into POS. Select the *same* QA table; tap **QA Burger** (one item). Wait until the B ticket shows the item; do not submit, pay, or close. The app opens a new table tab and draft through the real Edge API.
3. Run the **read-only SQL above** and record B's `1 live tab / 1 draft order / 1 item` baseline.
4. On **Cashier A** browser, open DevTools `Network > Fetch/XHR` and filter `table-tabs`. Keep the Network log on (if available). **Do not capture sensitive headers.** Click a QA item on A using the selected but now stale table.
5. Record actual `POST /api/v1/pos/table-tabs` Status **409 Conflict** in A Network. Record only method/path/status/time. If no request was sent because A was already updated, retry with a new empty QA table and controlled stale selection; no fake claim.
6. Check the ticket-adjacent Arabic warning indicating the table was opened by another cashier; A should have **no newly created order/item**, a zero basket and disabled send. On the table chooser, the occupied table should be visible as occupied.
7. On B, its one-item draft remains intact. Repeat the read-only SQL from section 2 and confirm **no change** from after-B/before-A counts.

## 4. Explicit acceptance decision

| Requirement | Required proof | Status now |
| --- | --- | --- |
| Correct source candidate | `git rev-parse HEAD` and clean status | `HISTORICAL PASS 2026-10-20; NEW SESSION NOT EXECUTED` |
| Actual stale A POST conflict | sanitized DevTools POST `/pos/table-tabs` `409` | `NOT_VERIFIED` |
| A operator UX | visible Arabic alert, no item/order, zero basket, disabled submit | `HISTORICAL UI PASS 2026-10-20; NOT RE-RUN` |
| B order integrity | B ticket still has item, no disappearance | `PENDING TARGETED LIVE RETEST` |
| Single live tab and no A writes | two read-only SQL snapshots before/after A attempt, counts unchanged | `NOT_VERIFIED` |
| DB unique protection exists | read-only index existence query | `SOURCE VERIFIED; LOCAL DB NOT QUERIED` |
| Previously accepted PWA tests | 22/22 files 150/150 at `ca01c872`, owner evidence | `HISTORICAL PASS, NO REPEAT NEEDED FOR UNCHANGED SOURCE` |

**PASS only when all required current live evidence exists** (including actual 409 and SQL invariant). A generic on-screen warning by itself does not establish server/DB race correctness.

If B's action works and A receives a 403/401 or no network request, classify `BLOCKED / AUTH OR STALE-CONDITION ISSUE` rather than labelling 409 PASS; never weaken authorization.

## 5. Existing automated verification (do not misstate as current run)

- [Source runtime checker](https://github.com/Do7a193/CAFE_RESTAURANT_MS/blob/main/scripts/crms-002c-runtime-verify.mjs) already issues concurrent real API requests to open the same test table with distinct request IDs; asserts statuses `[201,409]` and tests duplicate-open 409.
- [Integration test](https://github.com/Do7a193/CAFE_RESTAURANT_MS/blob/main/packages/testing/integration/orders-pos.test.ts) checks DB one-live-tab and idempotency constraints.
- [DB migration](https://github.com/Do7a193/CAFE_RESTAURANT_MS/blob/main/infra/db/migrations/0004_catalog_orders_kds.sql) defines `ux_table_tabs_one_live_per_table`, a partial unique index for live states.
- Source checks do not mean that either script was re-run during TSST-004; test must use running local QA instance to close this exact gate.

## 6. Signoff handoff

Record and provide only:
- observed short/full HEAD + whether `git status --short` is blank;
- test table code (QA-Txx), A Network POST path/status (with secrets cropped);
- A operator alert and whether submit was disabled; B ticket still populated;
- SQL table_status, live_tabs, nonterminal_orders, noncancelled_items **before and after A**.

TSST Lead can then mark `CRMS-TSST-004` `PASS` or `FAIL/BLOCKED` and update the scoped PR evidence. Until then it remains `E2E_NOT_EXECUTED`; PRs #34/#35 DRAFT, unmerged. No approval of any merge is implied.
