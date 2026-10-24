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
