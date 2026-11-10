# CRMS-TSST-011 — Dashboard permission gate + role landing page + clear Arabic bill-close messages

Date: 2026-11-10 · Issued by: TSST Lead (Claude, R61) · Owner OK: "Yes, send it" (chat 2026-11-10) · Bus task: `CRMS-TSST-011` · Worker: Codex (`tsst-dev`, CODE tier)
Team: build · Skills: `TSST/DEV/skills/tsst-dev-sk-005-api-integration-engineering`, `TSST/DEV/skills/tsst-dev-sk-011-testing-tdd-engineering`, `TSST/DEV/skills/tsst-dev-sk-015-verification-before-completion`
Follows: `CRMS-TSST-010` (closed; Cafe `7f28f69` on `codex/crms-cashier-close-010`).

## Part 1 — Dashboard gate and landing page (Beta blocker)

Facts at `7f28f69`:
- `apps/pwa/src/app/router.tsx` serves `dashboard` with no `PermissionRoute`, while every other page has one. `/` redirects to `/dashboard`.
- `apps/pwa/src/pages/LoginPage.tsx` (lines 21 and 44) sends everyone to `/dashboard` after login.
- `DashboardPage.tsx` gates each section client-side with `hasPermission` on `payments.read`, `pos.read`, `inventory.read`, `workforce.read`, `cash.custody.read`, `cash.treasury.read` and `kds.read`. The server enforces every endpoint (403 confirmed earlier), so this is UX and defence in depth, not a data leak.

Lead decision (product, small): **each role lands where it works.**
1. Add one helper, e.g. `apps/pwa/src/session/homePath.ts` → `homePathFor(hasPermission)`:
   - users with management reads (`cash.treasury.read`, `inventory.read` or `workforce.read`) go to `/dashboard`;
   - otherwise `pos.read` goes to `/pos`;
   - otherwise `kds.read` goes to `/kds`;
   - otherwise any remaining dashboard permission goes to `/dashboard`;
   - otherwise `/forbidden`.
   Check this against the real role grants in `infra/db/migrations` (0013, 0022 and others). Report the resulting landing per seeded role (OWNER_ADMIN, MANAGER, CASH_CUSTODIAN, WAITER, BARISTA). If a role lands somewhere that clearly makes no sense, report it and do not invent a new rule.
2. Use it for the `/` index redirect and for the post-login redirect (keep `state.from` when present).
3. Wrap `dashboard` in `PermissionRoute anyOf=[the 7 permissions above]`.
4. Hide the "الرئيسية" nav item in `AppLayout.tsx` for users who cannot open it, the same way other items are filtered. If nav is not filtered today, report it and only hide this one item.

## Part 2 — Clear Arabic messages for the other close refusals

Same pattern as `CRMS-TSST-009`. Read `billing.service.ts` to find which sentinel a close on an unpaid bill throws. In the CRMS-TSST-010 runtime test it came back as the generic `409 "Bill lifecycle does not allow this operation"`.

| Sentinel | Edge 409 message (new) | Arabic shown in POS and Billing |
|---|---|---|
| `BILLING:bill_not_settled` (or whichever one fires for an unpaid bill) | `Bill still has an amount due; collect it before closing the bill` | لسه فيه مبلغ متبقي على الفاتورة. حصّله الأول، وبعدين اقفل الفاتورة. |
| `BILLING:pending_payments_exist` | `A payment is still awaiting confirmation; confirm or reverse it before closing the bill` | فيه دفعة لسه مستنية تأكيد. أكّدها أو الغيها الأول، وبعدين اقفل الفاتورة. |
| `BILLING:gaming_session_still_live` (Edge message already exists, keep it) | unchanged | جلسة البلايستيشن لسه شغالة. اقفلها وضيف حسابها الأول، وبعدين اقفل الفاتورة. |

Remove only those sentinels from the generic list. Status stays 409. No service or rule change. In the PWA, put the message→Arabic mapping in **one shared place** used by both `PosPage.tsx` and `BillingPage.tsx`, including the kitchen message from 009. Behaviour must stay identical.

## Tests

- PWA:
  - `homePathFor` for each seeded role's permission set.
  - Router: a WAITER opening `/` lands on `/pos`, a BARISTA lands on `/kds`, and a direct `/dashboard` open by a BARISTA goes to `/forbidden`. The existing `ProtectedRoute.test.tsx` and `DashboardPage.test.tsx` must still pass.
  - One test per new Arabic message (POS or Billing) that asserts no English text is shown.
- Runtime `scripts/crms-002w-runtime-verify.mjs`: the cashier's unpaid close in case A asserts the new 409 message. Add a pending-InstaPay close attempt (before confirm) that asserts the pending-payment message and that the bill is unchanged.

## Where / limits

Same clone `C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_E2E008`. New branch `codex/crms-dashboard-gate-011` from `7f28f69`. All isolation rules from `CRMS-TSST-008` apply. **Also do not touch the QA clone, which now runs `7f28f69`.** No SQL, migration, permission or service change. No merge, PR, deploy or Actions. Push only the new branch. Build from PowerShell.

## Done when

1. `pnpm verify:crms-002w:local` (full) passes twice from a clean tree with the new messages asserted, and there are no leftovers.
2. PWA vitest passes in full (183 plus the new tests). PWA and edge-api `typecheck`, `lint` and `build` pass. `@crms/testing test` is 8/8, and `static-verify` passes.
3. Commit(s) end with `Co-Authored-By: Codex`, on `codex/crms-dashboard-gate-011`, pushed, with no PR.
4. Report at `TSST/bus/out/CRMS-TSST-011.md` (≤4 KB): branch + SHA, diff stat, the landing table per role, the exact 409 bodies, the commands run with their counts, cleanup proof, and `skills_used`.
