# CRMS-TSST-020 — Backend tests: close refused while the kitchen works, and table move

Date: 2026-11-11 · Lead: Claude (R61) · Owner OK: "ابدأ 1" (chat 2026-11-11)
Team: build → `tsst-dev` · Tier: CODE · Skills: TSST-DEV-SK-011 (tests), TSST-DEV-SK-006 (SQL/data), TSST-DEV-SK-015 (verification)
NOT_SELECTED: SK-010 (no known bug), SK-012 (Lead reviews). SKILL_GAP: none.

## Why

Feature review v2 (2026-11-09) §3 item 2: two paths have no backend test.
Checklist items D5 and B6 of the second phone run; if both pass in code, the phone run gets shorter.

1. Bill close refused while kitchen work is live: `BILLING:kds_work_still_live` (`apps/edge-api/src/modules/billing/billing.service.ts:662`).
2. Table move: `POST table-tabs/:tabId/transfer` (`apps/edge-api/src/modules/pos/pos.controller.ts:279`).

## Scope

Cafe repo, new branch `claude/crms-close-move-tests-020` from `main` `618def6`, clone `C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_E2E008`.
Tests only. A product code change only if a test finds a real bug, and then it stops and reports first.

## Acceptance

- Integration tests in `packages/testing/integration/` on real Postgres, both paths, positive and negative.
- `verify:crms-002e:local` PASS (Git Bash); static, typecheck, lint, build exit 0; `@crms/testing` unit 8/8.
- Branch pushed only with Ahmed's OK. No merge, no deploy.

## Result (2026-11-11, accepted by the Lead)

Branch `claude/crms-close-move-tests-020`: `b6c2780` (2 test files, +601) + `a77c2fe` (60s `beforeAll`, null-safe teardown). Not pushed. Tests only.

- `billing-close-kds-guard.test.ts` (5): QUEUED / PREPARING / READY / REMAKE block the close with nothing changed; after SERVED the same close works (bill, order, tab CLOSED, table AVAILABLE, 1 audit event, stale retry refused); CANCELLED does not block; scoped per bill.
- `pos-table-transfer.test.ts` (14): tab + order + bill + gaming session move A→B, A free, B busy, audit + outbox; refused with no change: busy destination (both guards), same table / replay, CLOSING/CLOSED/TRANSFERRED/MERGED tab, stale version, other site / unknown / inactive table, unknown / foreign tab.
- Gates on `a77c2fe`: `verify:crms-002e:local` PASS (integration 84/84 in 19 files, was 65; PWA 240/240; testing 8/8; config 4/4; static/typecheck/lint/build 0). Run 1 on `b6c2780` failed on a 10s `beforeAll` timeout (low RAM), not an assertion.
- Lead checked: commits, clean tree, and finding 2 in code.

## Findings (not fixed, tests only)

1. The transfer does not bump `orders.table_tabs.version` (`apps/edge-api/src/modules/pos/pos.service.ts:284-287`, only `table_id`, `updated_at`). Two devices holding the same version can both move the tab (A→B, then B→C). Fix is one line; needs Ahmed's OK.
2. WASTED with no remake does not block the close (guard list `billing.service.ts:662` and trigger in migration 0030). Looks right (nothing left to serve); no change proposed.
3. QA env processes (Edge PID 15068, vite preview 9152, started 21:55) were started by another session, not by this task.

Skills used: TSST-DEV-SK-011, TSST-DEV-SK-006, TSST-DEV-SK-015.
