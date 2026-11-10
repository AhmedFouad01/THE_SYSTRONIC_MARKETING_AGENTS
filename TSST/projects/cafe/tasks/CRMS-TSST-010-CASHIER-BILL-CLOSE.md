# CRMS-TSST-010 — Cashier (CASH_CUSTODIAN) can close a settled bill

Date: 2026-11-10 · Issued by: TSST Lead (Claude, R61) · Bus task: `CRMS-TSST-010` · Worker: Codex (`tsst-dev`, CODE tier)
Owner decision (chat 2026-11-10, Beta checklist question 1): **"الكاشير كمان"**. The cashier closes bills too; OWNER_ADMIN and MANAGER keep the permission.
Team: build · Skills: `TSST/DEV/skills/tsst-dev-sk-006-data-sql-migration-engineering`, `TSST/DEV/skills/tsst-dev-sk-007-identity-access-secrets-engineering`, `TSST/DEV/skills/tsst-dev-sk-011-testing-tdd-engineering`, `TSST/DEV/skills/tsst-dev-sk-015-verification-before-completion`
Follows: `CRMS-TSST-009` (closed; Cafe `2be3e6e` on `codex/crms-close-kds-message-009`).

## Facts

- `infra/db/migrations/0022_billing_payments_core.sql` (around lines 497–521) grants `billing.bill.close` to `OWNER_ADMIN` and `MANAGER` only. `CASH_CUSTODIAN` has `billing.read`, `payments.read` and `payments.collect`.
- The close rules are unchanged by this task and stay enforced in the service: the bill must be `SETTLED`, nothing outstanding, no pending payments, no live kitchen work, no live gaming session.
- The PWA already gates the close button on `hasPermission("billing.bill.close")` (`PosPage.tsx` `canCloseBill`, `BillingPage.tsx` ~line 447), so no UI change should be needed.

## Change

1. **New migration** `infra/db/migrations/0032_cashier_bill_close.sql`. Inside `BEGIN … COMMIT`, insert into `identity.role_permissions` the pair (`CASH_CUSTODIAN`, `billing.bill.close`) with `ON CONFLICT DO NOTHING`, in the same style as 0022. Additive only. Do not edit 0001–0031, other roles, the `PAYMENT_OPERATOR` bundle, or `payments.confirm`.
2. **Counts**: `packages/testing/foundation.contract.test.ts` changes 31 → 32 (title and `toHaveLength`). `scripts/static-verify.mjs` changes `expectedMigrationCount` to 32, `expectedLastMigration` to `0032_`, and its message to `0001..0032`.
3. **Runtime test** `scripts/crms-002w-runtime-verify.mjs`:
   - `createActor` for `CASH_CUSTODIAN` now requires `billing.bill.close`. It must still lack `payments.confirm`.
   - In case A, the **cashier (custodian)** closes the bill instead of the owner. All A assertions stay.
   - Case D still proves WAITER close returns 403 and CASH_CUSTODIAN confirm returns 403.
   - Add one negative: the cashier closing a bill that is **not** settled (amount still due) gets 409 and the bill stays open. This proves the permission did not bypass the rules.
4. Do not change the PWA unless a test proves it is needed. If it is, report why.

## Where

Same clone `C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_E2E008`. New branch `codex/crms-cashier-close-010` from `2be3e6e`. All isolation rules from `CRMS-TSST-008` apply, including the protected folders, compose projects and ports 55460, 55461, 18543 and 5194. Build from PowerShell.

## Hard limits

Only the new migration, the two count updates, and the 002w test. No change to service logic, other permissions or roles, or seeds. No production DB. No merge, PR, deploy or Actions. Push only the new branch. If an existing integration test asserts that CASH_CUSTODIAN cannot close, report it with file:line before changing it.

## Done when

1. `pnpm verify:crms-002w:local` (full) passes twice from a clean tree, with the cashier closing in A, the new not-settled negative, and no leftovers.
2. `pnpm verify:crms-002s:local` passes. It runs the billing integration on a fresh DB with all 32 migrations.
3. `node scripts/static-verify.mjs` passes, and `@crms/testing test` passes 8/8. Edge-api and testing `typecheck` and `lint` pass.
4. Commit(s) end with `Co-Authored-By: Codex`, on `codex/crms-cashier-close-010`, pushed, with no PR.
5. Report at `TSST/bus/out/CRMS-TSST-010.md` (≤4 KB): branch + SHA, diff stat, the migration text, the commands run with their counts, cleanup proof, and `skills_used`.
