# CRMS-TSST-016 — Billing page: bills named by table or takeaway, Arabic status, clean quantities, default amount, payment confirm (QA F5)

Date: 2026-11-10 · Done by: TSST Lead (Claude, R61), no bus task · Owner OK: "ابدأ F5" (chat 2026-11-10)
Team: build · Skills applied: TSST-DEV-SK-011 (tests), TSST-DEV-SK-015 (verification)
Found in: Beta QA run, Cafe `docs/gates/CRMS-BETA-QA-RUN-2026-11-10.md` (F5).

## Problem (at `44fa3bf`)

Billing listed bills by an id fragment (`01a1c5d5`) with no table or takeaway label, showed `PARTIALLY_PAID` untranslated and quantities as `2.000000`, left the amount empty, and recorded cash without asking (POS asks).

## Fix — Cafe branch `claude/crms-billing-labels-016`, `bf276e601aa62ae39676ba575a972da7c3ff57db` (from `44fa3bf`), pushed, no PR

Commits `772584d` (fix) and `bf276e6` (test wait). 7 files, +144/−16. No SQL or permission change.

- Edge (read-only): `GET /billing/bills` and the bill detail add `table_name` (the tab's table) and `service_mode` (the bill's first order). The new type is `BillSummaryRow`; `lockBill` and every write are unchanged.
- PWA `BillingPage`:
  - Cards show the label (table name, "تيك أواي", "دليفري", or "فاتورة") and the opening time (Cairo, Latin digits) instead of the id. The detail summary has a "الطلب" cell.
  - `PARTIALLY_PAID` shows "مدفوعة جزئيًا" (warning colour). Unknown bill or payment statuses show "حالة غير معروفة", never the raw code.
  - Quantities are formatted (`2`, `1.5`).
  - The amount starts at the outstanding balance and follows it after each payment.
  - Recording any payment asks `تأكيد تسجيل دفعة <طريقة> بقيمة <المبلغ> ج.م؟`, the same as POS.
- PWA type `Bill` has the two fields as optional, so an older Edge still renders.

## Tests and gates on `bf276e6`

- New PWA tests (Billing): label and time with no id fragment and "مدفوعة جزئيًا", quantity, default amount, and confirm (decline records nothing; accept collects 150.00 cash).
- `002w` case E also asserts `table_name` and `service_mode` on the bill detail and on the list row (TAKEAWAY and "002W CASHIER").
- PWA 26 files, 223/223. `typecheck`, `lint` and `build` (all) exit 0. `@crms/testing` 8/8.
- `verify:crms-002w:local` PASS twice: once on `772584d` and once on `bf276e6` (`crms002w-verify-5040464d248e`); the code under test is the same in both. One more run failed in setup with the known `db:migrate` flake.
- `verify:crms-002s:local` PASS. `verify:crms-002e:local` PASS (integration 65/65, Git Bash).
- One full run failed 2 of the new tests: they asserted before the bill had loaded. Fixed in `bf276e6` (wait for the amount), then everything passed.

## QA environment and browser check

- QA clone detached at `bf276e6`. No new migration. Edge-api and PWA were rebuilt (PowerShell, `/api/v1`), the CA was copied, and both services restarted.
- As `qa-cashier` (loopback copy, session removed afterwards): takeaway tea ×2 → bill 201 → Billing showed "تيك أواي · 7:03 م", older bills "QA Table 01" / "QA Table 04", and amount 40.00 → cash 15 (confirm asked) → "مدفوعة جزئيًا", amount 25.00 → cash 25 → "مسددة", quantity "2" → close → "مغلقة". No failed API call.

## Cafe records

`docs/gates/CRMS-CLOUD-HANDOFF.md` row on `codex/crms-cashier-first-036` (`2695d3a`, pushed).

## Next

F6 (POS does not pick up a bill opened on another device), F7 (KDS/POS kitchen labels after serving), F8 (touch targets under 44px), F9 (POS product buttons have no accessible name). All minor; one batch is possible.
