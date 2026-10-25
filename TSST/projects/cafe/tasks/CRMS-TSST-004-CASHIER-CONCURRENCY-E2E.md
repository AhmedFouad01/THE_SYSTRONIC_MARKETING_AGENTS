# CRMS-TSST-004 — Cashier Concurrency E2E Verification

Date: 2026-10-24
Project: `CAFE_RESTAURANT_MS`
TSST coordinator: supervised/manual TSST Lead
Owner-approved task scope: continue last checkpoint and prepare/attempt focused cashier concurrency QA, without authorizing merges, code changes to application, CI or production.
State: `QA_RUNBOOK_DELIVERED / LIVE_E2E_NOT_EXECUTED`
Upstream: [CRMS-TSST-003](../reviews/CRMS-TSST-003-POS-PR34-FORMAL-REVIEW.md)

## Lock before work
- Shared task ownership locked to this single QA evidence task; no developer or agent should modify same POS behavior in parallel.
- Target POS [PR #34](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34), candidate `ca01c872a0c84039ead2713e102f4cf14a7c863f`; UX [PR #35](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/35) remains separate draft.
- Historical owner local PWA 150/150 PASS, typecheck/lint/build PASS (2026-10-20); do NOT re-run unchanged full suite without source risk.
- Acceptance: prove through actual QA-runtime interaction (not static/mocked tests) that cashier B claims test table, cashier A attempts stale claim, POST /pos/table-tabs produces HTTP 409, UI shows alert, no duplicate live tabs, orders, or items. Evidence must not include bearer tokens or personal/real business records.
- If owner QA browser/DB is not available through connected tools, mark E2E `NOT_EXECUTED`, publish a safe focused runbook and exact proof requirements. Do not claim PASS.
- Inspect code/tests/migrations only as needed to make runbook grounded.
- No application code changes, GitHub Actions, merges, branch rebases, deployments, production writes, remote execution assumptions, or Real Memory canonical apply. Stage Real Memory intake if useful, with governed apply.

## Delivered checkpoint — 2026-10-24

- Safe local QA steps and read-only SQL published: [CRMS-TSST-004 Two-Cashier E2E Runbook](../gates/CRMS-TSST-004-TWO-CASHIER-E2E-QA.md), commit `44ed5ed85e90b6b31000c0a3ceb56d8e9a9d43a4`.
- New source-level verification discovered: `scripts/crms-002c-runtime-verify.mjs` contains a **real API** parallel table-open test that asserts `[201,409]`, plus duplicate live-tab 409. `packages/testing/integration/orders-pos.test.ts` covers database one-live-tab and idempotency constraints. `infra/db/migrations/0004_catalog_orders_kds.sql` defines partial unique `ux_table_tabs_one_live_per_table`. **Not run in TSST-004**.
- Project QA fixture tooling verified: `QA-T01..QA-T05`, `qa:seed-tables`, `START-CRMS-DEV.cmd`; beware `qa:clean-local` and `qa:reset-tables` mutate local state and can bypass triggers. No reset was executed.
- Test target: exact POS candidate `ca01c872a0c84039ead2713e102f4cf14a7c863f`; local frontend `http://localhost:5174/pos`, existing Edge backend through proxy. Independent cashier sessions and real 409 capture are still necessary for live E2E.
- PR #34 comment ID `6384820609` logs focused evidence gap and runbook. Both PR #34 / #35 remain DRAFT, unmerged.
- **No connected access to owner's live Windows machine, QA Chrome sessions, or local PostgreSQL DB**. This task deliberately records `LIVE_QA_NOT_EXECUTED`; does not reinterpret code checks or earlier owner screenshots as new E2E PASS.
- Historical PWA 150/150 PASS and static typecheck/lint/build PASS preserved from 2026-10-20 and not repeated.
- Next: owner runs narrow QA with cropped HTTP response/status and two safe SQL snapshots; only then claim E2E PASS. No new source code, PR merge, actions, live DB writes or deployment performed.


## Observed live QA attempt — 2026-10-25 (owner browser screenshots)

**Checkpoint:** `ATTEMPTED / HTTP_401_NOT_409 / AUTH_DIAGNOSTIC_REQUIRED`. **Do not mark E2E PASS.**

- Owner local Windows POS source already verified `fix/crms-pos-readd-after-empty-cancel` at `ca01c872a0c84039ead2713e102f4cf14a7c863f`; Docker PostgreSQL/Redis healthy, Edge API listening on `127.0.0.1:8443`, PWA `localhost:5174`, tests carried out with ordinary plus private Brave sessions both showing `System Owner`.
- Read-only QA-T02 DB baseline before attempted A action: `OCCUPIED`, **1 live table tab, 1 active order, 1 item** (B's QA Burger quantity 1 at EGP 50).
- Owner DevTools screenshot after pressing a QA item on stale A: Network filter `table-tabs` shows a **401** status row for `table-tabs`, and a `200` row for `live`; exact method/path of 401 requires clicking its General section (likely POST, not independently displayed). No observed 409. A ticket screenshot shows Arabic generic occupied-table warning `الترابيزة مشغولة بالفعل. اقفل حسابها الحالي قبل فتح طلب جديد عليها.`, 0 EGP, disabled submit.
- Source `PosPage.ensureOrder` throws that generic occupied warning from the *cached liveTabs* pre-check; this warning is **not** the intended 409 handler's distinct text `الترابيزة اتفتحت من كاشير تاني...`. Therefore **do not attribute current UI state to a successful HTTP 409**.
- Source auth default `AUTH_ACCESS_TTL_SECONDS = 900` (15 minutes) in `apps/edge-api/src/modules/identity/identity.service.ts`, and PWA client dispatches `EDGE_UNAUTHORIZED_EVENT` on HTTP 401, with SessionProvider attempting token refresh. The screenshots indicate ~27 minutes between initial A/B login and observed request, which makes access expiration plausible, **not proven**; a deployment-specific `.env` override and Response body were not inspected.
- **Follow-up controls:** preserve QA-T02 and its order, confirm read-only DB counts remain 1/1/1 after the 401 attempt, then choose *another unused QA fixture (QA-T03)*; refresh/re-authenticate sessions and stage the two-cashier stale-occupancy scenario promptly within the TTL, with sanitized Network method/path/status and the two DB snapshots. A fresh login/refresh may update table selection, so don't claim A's current cached QA-T02 state is suitable for another 409 race. Do not use production data or reset.
- Source inspection and this evidence log are not a new passing regression or a completed concurrency gate; PR #34/#35 remain DRAFT/no merge.
