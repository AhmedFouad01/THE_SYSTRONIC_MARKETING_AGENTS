# CRMS-TSST-014 — The cashier runs takeaway and dine-in alone (QA F1, F2, F3)

Date: 2026-11-10 · Done by: TSST Lead (Claude, R61), no bus task · Owner decision (chat 2026-11-10, F3): **"أيوه، صالة وتيك أواي"**
Team: build · Skills applied: TSST-DEV-SK-006 (data/SQL migration), TSST-DEV-SK-007 (identity/access), TSST-DEV-SK-015 (verification)
Found in: Beta QA run, Cafe `docs/gates/CRMS-BETA-QA-RUN-2026-11-10.md` (F1, F2, F3).

## Problem (proven at `24adf83`)

- F1: `CASH_CUSTODIAN` lacked `billing.bill.create`, so `POST /billing/bills` was 403 and POS hid the bill button (`PosPage.tsx` `canCreateBill`).
- F2: POS reads `GET /kds/queue` (no station filter) before it shows the close button (`PosPage.tsx` kitchen refresh, `kitchenScopeReady`). The cashier lacked `kds.read`, so the read was 403 and the close button never appeared.
- F3: the cashier lacked `pos.table.open` (open and move a dine-in table).

## Fix — Cafe branch `claude/crms-cashier-grants-014`, `15e31e23a1345a7d5645d3d6a0f5ce29de951cad` (from `24adf83`), pushed, no PR

6 files, +77/−14.

- New migration `infra/db/migrations/0033_cashier_takeaway_dine_in.sql`: additive grant of `billing.bill.create`, `kds.read`, `pos.table.open` to `CASH_CUSTODIAN`, `ON CONFLICT DO NOTHING`. Nothing removed; no other role touched. The cashier still has no `kds.transition` and no `payments.confirm`.
- Counts 32 → 33: `packages/testing/foundation.contract.test.ts`, `scripts/static-verify.mjs`.
- `packages/testing/integration/billing-payments.test.ts`: the cashier's billing/payment grants now include `billing.bill.create`.
- `apps/pwa/src/session/homePath.test.ts`: the cashier row carries `kds.read` + `pos.table.open` and still lands on `/pos` (no code change; `homePathFor` checks `pos.read` before `kds.read`, and the cashier is not a kitchen operator without `kds.transition`).
- `scripts/crms-002w-runtime-verify.mjs`: the cashier actor must have the three grants and must lack `payments.confirm` and `kds.transition`. New case **E** (`verifyCashierAlone`): TAKEAWAY then DINE_IN, the cashier alone opens the table (dine-in), orders, sends, reads `/kds/queue` (200, item QUEUED; empty after the kitchen serves), makes the bill, collects cash, and closes; bill + order CLOSED, table AVAILABLE, tab not live. The kitchen steps stay with BARISTA. `submitOrder` now takes a null tab for TAKEAWAY.
- No service, controller, PWA source, seed or other permission change.

## Gates on `15e31e2`

- PWA 26 files, 207/207. `typecheck`, `lint` and `build` (all packages) PASS. `@crms/testing` 8/8. `node scripts/static-verify.mjs` PASS (0001..0033).
- `verify:crms-002w:local`: two full PASS runs with case E (`crms002w-verify-63d889dc5ec3`, `crms002w-verify-8bcb0ed5d724`). One earlier run failed in setup (`pnpm db:migrate` "Connection terminated unexpectedly", before any test). This is the known environment flake; it was rerun.
- `verify:crms-002s:local` PASS. `verify:crms-002e:local` PASS from Git Bash (integration 17 files, 65/65, including the updated role list).
- No RED run against `24adf83`: there, the new `createActor` grant check would fail before case E.

## QA environment

- QA clone `CAFE_RESTAURANT_MS_BETAGATE_20261109` is detached at `15e31e2`, fetched from the E2E008 clone, because its origin is the local mirror. `pnpm db:migrate` with qa-env applied only `0033`. Edge-api and PWA were rebuilt from PowerShell (`VITE_EDGE_API_URL=/api/v1`), the CA was copied to `dist`, and both services restarted (Edge 127.0.0.1:18543, PWA https://192.168.1.25:5194). QA DB: the cashier has the 3 grants and no `kds.transition` or `payments.confirm`. As before, the services stop when the session that started them ends.
- Browser check (loopback copy on 5195, `qa-cashier` session, then removed): as the cashier alone, dine-in QA Table 01 went table-tab 201 → order → send → kitchen served (`qa-api.py serve`) → "فتح الحساب والدفع" bill 201 → cash 120.00 201 → "إغلاق الحساب وتحرير الترابيزة" close 201. The table is available again, `/kds/queue` returned 200 every time, and 0 of 64 API calls failed. Takeaway was covered by 002w case E only, not in the browser.

## Cafe records

`docs/gates/CRMS-CLOUD-HANDOFF.md` row on `codex/crms-cashier-first-036` (`d89ead8`, pushed).

## Next

F4 (raw English 502 when the Edge is down, and staff logged out after it comes back), then F5.
