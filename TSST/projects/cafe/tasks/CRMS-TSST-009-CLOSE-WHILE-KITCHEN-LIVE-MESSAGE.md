# CRMS-TSST-009 — Clear Arabic message when a bill is closed while kitchen work is live

Date: 2026-11-10 · Issued by: TSST Lead (Claude, R61) · Owner OK: "Yes, send it" (chat 2026-11-10) · Bus task: `CRMS-TSST-009` · Worker: Codex (`tsst-dev`, CODE tier)
Team: build · Skills: `TSST/DEV/skills/tsst-dev-sk-005-api-integration-engineering`, `TSST/DEV/skills/tsst-dev-sk-011-testing-tdd-engineering`, `TSST/DEV/skills/tsst-dev-sk-015-verification-before-completion`
Follows: `CRMS-TSST-008` (closed; Cafe `3815b60` on `codex/crms-beta-e2e-008`).

## Problem (proven in CRMS-TSST-008 case B)

Closing a fully paid bill while a kitchen item is still `QUEUED/PREPARING/READY/REMAKE` is correctly refused. But:

- `apps/edge-api/src/modules/billing/billing.controller.ts` (the lifecycle group around lines 112–124) maps `BILLING:kds_work_still_live` and `BILLING:order_close_kds_live` to the generic `409 "Bill lifecycle does not allow this operation"`.
- POS (`apps/pwa/src/pages/PosPage.tsx` `errorMessage`, ~line 96) then shows the cashier `"Bill lifecycle does not allow this operation حدّث البيانات وحاول مرة أخرى."`, which mixes English and Arabic and gives no reason. `BillingPage.tsx` `errorMessage` (~line 39) does the same.
- The gaming case already has its own message (`BILLING:gaming_session_still_live` → "Finish the active gaming session…"). Do the kitchen case the same way.

## Change (smallest possible)

1. **Edge API**: in `billing.controller.ts`, before the generic lifecycle group, map `BILLING:kds_work_still_live` and `BILLING:order_close_kds_live` to `ConflictException("Kitchen items are still in progress; serve or cancel them before closing the bill")`. Remove those two from the generic list. Do not change the service, the status code (stays 409), the rule itself, or any other mapping.
2. **PWA**: in both `PosPage.tsx` and `BillingPage.tsx` `errorMessage`, when a `conflict` message matches that kitchen message, show exactly:
   `لسه فيه أصناف في المطبخ ما اتسلمتش. سلّمها أو الغيها الأول، وبعدين اقفل الفاتورة.`
   Do not add the "refresh and retry" suffix to this one. Other messages stay as they are. Prefer a shared helper if one fits; do not refactor beyond that.
3. **Tests**:
   - PWA: one test in `PosPage.test.tsx` and one in `BillingPage.test.tsx`. Mock the 409 kitchen message on close, then assert the Arabic text is shown and no English text is shown.
   - Runtime: update `scripts/crms-002w-runtime-verify.mjs` case B to assert the new 409 message (status + message), keeping its unchanged-state and serve-then-close checks.

## Where

Same clone `C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_E2E008`. New branch `codex/crms-close-kds-message-009` from `3815b60`. All isolation rules from `CRMS-TSST-008` still apply. Do not touch `CAFE_RESTAURANT_MS_036`, `CAFE_RESTAURANT_MS_BETAGATE_20261109`, the compose projects `crmsbetaqa-20261109` and `*androidclone*`, or the ports 55460, 55461, 18543 and 5194. Build from PowerShell.

## Hard limits

Only the two mappings, the two `errorMessage` helpers, and the tests. No SQL, migration, seed, service or permission change. No merge, PR, deploy or Actions. Push only the new branch. No secrets in logs. If anything else looks wrong, report it and do not fix it.

## Done when

1. `pnpm verify:crms-002w:local` (full run, not `--case-b`) passes twice from a clean tree, case B asserts the new message, and there are no leftover containers or volumes.
2. PWA `vitest` passes in full, up from 181 by the new tests, and `PosPage.test.tsx` is at least 50. PWA and edge-api `typecheck`, `lint` and `build` pass. `@crms/testing test` is 8/8.
3. Commit(s) on `codex/crms-close-kds-message-009` end with `Co-Authored-By: Codex`, pushed, no PR.
4. Report at `TSST/bus/out/CRMS-TSST-009.md` (≤4 KB): branch + SHA, diff stat, the commands run with their counts, the exact 409 body seen in the runtime test, cleanup proof, and `skills_used`.
