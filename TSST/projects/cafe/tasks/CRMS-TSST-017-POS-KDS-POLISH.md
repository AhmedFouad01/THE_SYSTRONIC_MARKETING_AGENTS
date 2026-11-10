# CRMS-TSST-017 — POS/KDS polish: remote bill pick-up, honest kitchen labels, 44px targets, product names (QA F6–F9)

Date: 2026-11-10 · Done by: TSST Lead (Claude, R61), no bus task · Owner OK: "ابدأ F6–F9" (chat 2026-11-10)
Team: build · Skills applied: TSST-DEV-SK-011 (tests), TSST-DEV-SK-015 (verification)
Found in: Beta QA run, Cafe `docs/gates/CRMS-BETA-QA-RUN-2026-11-10.md` (F6–F9).

## Causes (at `bf276e6`)

- F6: the POS order response had no `bill_id`. POS only learned of a bill by materializing one itself or by reopening the table (`resumeOccupiedTable`), and a takeaway order has no table to reopen.
- F7: the KDS queue leaves out SERVED items, so the remaining items of a half-served order looked like a new order ("طلب جديد"). In POS, `kitchenSummary` had no branch for "some served, rest queued" and fell through to "بانتظار بدء المطبخ".
- F8: `.pos-order-more-toggle` and the open-table action were 38px, `.pos-order-actions .pos-order-action` 42px on phones, and the header refresh and category toggle had no minimum.
- F9: product buttons had no explicit name. Their content name joined category, product and price.

## Fix — Cafe branch `claude/crms-pos-polish-017`, `47b5747ab0218eab686dcffedb3f6e2909f1ee0a` (from `bf276e6`), pushed, no PR

12 files, +174/−7. No SQL or permission change, and no write path changed.

- Edge, read-only: the POS `orderDetail` adds `o.bill_id`. The KDS queue and item rows add `order_served_count` (the order's SERVED kitchen items).
- POS: an effect loads the bill when `order.bill_id` appears and differs from the shown bill (skipping CLOSED), driven by the existing 5 s order refresh. A new summary branch says "اتسلّم جزء من الطلب". Product buttons have `aria-label="<name>، <price>"` and `type="button"`.
- KDS: a new group state `PARTIAL_SERVED` ("اتسلّم جزء، والباقي لسه", warning colour, same priority as partial ready).
- CSS: a 44px minimum for the header refresh, the category toggle and every order/table action. The rule is placed last, at the specificity of the 38/42px rules it replaces.
- PWA types: `bill_id` and `order_served_count` are optional, so an older Edge still renders.

## Tests and gates on `47b5747`

- New: POS (remote bill pick-up with no second materialize, partly served summary, product names), KDS (partly served vs new), `styles/pos-touch-targets.test.ts`. 7 tests.
- `002w` check F: after one of two items is served, the queue row says `order_served_count` 1, and `GET /pos/orders/:id` has `bill_id` = the bill.
- PWA 27 files, 230/230. `typecheck`, `lint` and `build` exit 0. `@crms/testing` 8/8.
- `002w` PASS twice (`crms002w-verify-a01173c68ce7`, `crms002w-verify-ab23d41b628c`). `002s` PASS. `002e` PASS (integration 65/65, Git Bash).

## QA environment and browser check

- QA clone detached at `47b5747`. No new migration. Edge-api and PWA were rebuilt (PowerShell, `/api/v1`), the CA was copied, and both services restarted.
- As `qa-cashier` (loopback copy, session removed afterwards):
  - F9: product names read "برجر QA، 120.00 ج.م".
  - F8: refresh is 44px (was 37), category toggle 69px at that width (was 34), and the table actions in the real build are 44px (were 42/38).
  - F6: takeaway tea sent, then the waiter served it and made the bill through `qa-api.py`. Within one refresh POS showed the bill (due 20.00, "تسجيل الدفعة") with no reopen and no POS materialize. Then cash → close 201.
  - No failed API call. F7 was checked by `002w` and unit tests only, not in the browser.

## Cafe records

`docs/gates/CRMS-CLOUD-HANDOFF.md` row on `codex/crms-cashier-first-036` (`745f083`, pushed).

## Next

All QA findings F1–F9 are fixed on the branch stack (tip `47b5747`). Next is Ahmed's real Android run with the QA CA (checklist A–H, a first-time cashier). Merging the stack needs his decision.
