# CRMS-TSST-013 — Pending electronic payments reserve the bill balance (no double collection)

Date: 2026-11-10 · Done by: TSST Lead (Claude, R61), in its own context because Codex was out of usage · Owner OK: "Yes, fix it" (chat 2026-11-10)
Team: build · Skills applied: TSST-DEV-SK-009 (resilience/failure), TSST-DEV-SK-011 (tests), TSST-DEV-SK-015 (verification)
Found in: CRMS-TSST-011 review (`TSST/bus/out/CRMS-TSST-011.md`, "Found, not fixed").

## Problem (proven at `d32b94e`)

`billing.service.ts` `collectPayment` checked `amount > outstanding_total` for CASH only. A pending InstaPay or wallet payment is not allocated until it is confirmed. So with a 40.00 bill and a pending 40.00 InstaPay, the cashier could take 40.00 cash and the bill became `SETTLED`. The ledger was safe, because confirmation later fails with `PAYMENTS:overpayment`. But at the counter the customer had paid twice, the InstaPay stayed pending, close was blocked, and the payment needed a manual reversal.

## Fix — Cafe branch `claude/crms-pending-payment-guard-013`, `24adf83bf98094894155c5adf7088e70cb859db8` (from `8f46c25`), pushed, no PR

- `collectPayment`, for all methods:
  - Reserve the sum of the bill's `INITIATED` and `PENDING_CONFIRMATION` payment amounts. This runs under the existing `FOR UPDATE` bill lock and compares in cents.
  - `amount > outstanding` → `PAYMENTS:overpayment`. This is unchanged for cash and new at collection time for electronic payments.
  - `amount > outstanding − reserved` → new sentinel `PAYMENTS:pending_payment_covers_balance`.
- Controller: the new sentinel maps to 409 `A payment awaiting confirmation already covers this amount; confirm or reverse it first`.
- PWA: the shared map (`lib/billCloseConflict.ts`) shows `فيه دفعة لسه مستنية تأكيد بتغطي المبلغ ده. أكّدها أو الغيها الأول، وبعدين حصّل الباقي.` in POS and Billing.
- No SQL, migration, permission or confirm/reverse change. 5 files, +70/−26.

## Tests

- `002w`: the old "settled + pending → close refused" case is no longer reachable and was replaced. The new case uses a 40.00 bill with a 40.00 pending InstaPay. Cash 40.00, cash 1.00 and a second InstaPay 40.00 are each refused with 409 and the new message, and the bill is unchanged. The owner then confirms, the bill is `SETTLED`, and the cashier closes it with 201.
- PWA: `lib/billCloseConflict.test.ts` (2 tests).

## Gates on `24adf83`

- PWA 26 files, 207/207. PWA and edge-api `typecheck` and `lint` PASS.
- `verify:crms-002w:local`: two full PASS runs (`crms002w-verify-f9c9e5eea350`, `crms002w-verify-8fed7649c95d`). One more run failed during setup (`pnpm db:migrate` "Connection terminated unexpectedly", before any test). That was environment flakiness and was not repeated.
- `verify:crms-002e:local` PASS (billing runtime; integration 65/65 inside). It must be run from Git Bash: from PowerShell it fails with `spawnSync openssl ENOENT`.
- `verify:crms-002s:local` PASS.
- No RED run: the new runtime case was not run against the old code first.
