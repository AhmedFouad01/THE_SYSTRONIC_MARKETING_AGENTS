# CRMS-TSST-011 — PASS (Codex code, finished by Lead after Codex hit its usage limit)

- **Codex** claimed it, wrote and pushed `ee53576` (13 files) on `codex/crms-dashboard-gate-011` from `7f28f69`, and ran the focused tests (Arabic UI 5/5, route/home/guard/dashboard 30/30). It then hit its usage limit before the full gates and before the report. Ahmed said in chat on 2026-11-10: "الليمت خلص ف كوديكس ممكن تكمل مكانه".
- **Lead (Claude)** reviewed the diff and changed one thing, commit `d32b94e`. The spec rule "management reads → /dashboard" included `cash.treasury.read`, which CASH_CUSTODIAN holds (0023), so the cashier landed on the dashboard. Managers and owners are now recognized by `payments.reverse` (0022, OWNER_ADMIN/MANAGER only) or `inventory.read` (0025). The treasury read is still a dashboard read.
- Final branch head: `d32b94ec072fd0e92cc5dea1250cf75f539721f2`, pushed, no PR. 14 files, +298/−35.

## Landing per seeded role

| Role | Home | Dashboard |
|---|---|---|
| OWNER_ADMIN | `/dashboard` | yes |
| MANAGER | `/dashboard` | yes |
| CASH_CUSTODIAN | `/pos` | yes (has `payments.read` and treasury read) |
| WAITER | `/pos` | yes, but only its POS and KDS sections (`pos.read` and `kds.read`) |
| BARISTA | `/kds` | no: kitchen operator (`kds.read`+`kds.transition`, no `pos.order.manage`, no independent read) → `/forbidden` with a back link to `/kds` |

## Edge 409 bodies (runtime)

- Unpaid: `Bill still has an amount due; collect it before closing the bill`. It also fires before InstaPay confirmation (PARTIALLY_PAID, 60.00 due).
- Settled but InstaPay pending: `A payment is still awaiting confirmation; confirm or reverse it before closing the bill`. Bill unchanged.
- Kitchen live: unchanged from 009. Gaming: Edge message unchanged; the PWA now shows Arabic.
- PWA: a single map in `apps/pwa/src/lib/billCloseConflict.ts`, used by POS and Billing.

## Gates (Lead, on `d32b94e`)

- PWA vitest: 25 files, 205/205. PWA and edge-api `typecheck` and `lint` PASS. PWA `build` PASS. `@crms/testing` 8/8. `static-verify` PASS.
- `pnpm verify:crms-002w:local`: two full runs PASS (`crms002w-verify-d75912881707` and `crms002w-verify-67c3a01edc3b`). In each: A (cashier unpaid 409, pre-confirmation 409, settled close 201, 16 audit rows), pending-InstaPay 409, B, C (201/400/409), D (403/403). "no project containers, volumes, or networks" both times. The QA env was not touched.

## Found, not fixed (follow-up)

The cashier can settle a bill with cash while an InstaPay payment on it is still `PENDING_CONFIRMATION`. Close is correctly refused, but if that InstaPay is confirmed later, the bill may be paid twice. This needs its own task: either block a new payment while one is pending, or make confirmation fail with an overpayment error. It was not changed here.

Skills applied: TSST-DEV-SK-005 (API↔UI error contract), TSST-DEV-SK-011 (role and route tests, runtime), TSST-DEV-SK-015 (gates and evidence).
