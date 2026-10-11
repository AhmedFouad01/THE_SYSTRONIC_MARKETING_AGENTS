# PROJECT_DECISIONS — YAKEBDA_MS


Last Updated: 2026-07-12


## Confirmed repository baseline


- PR #14 is merged and closed.
- Main baseline at this checkpoint: `4df57964ef0dacddbbaca2b723849dd4afe055c0`.
- Final PR #14 head: `14b1d12befeddf0700e083edd1374700366c0e53`.
- Final validation: CI #159 success, API 95/95, Admin build passed.
- Draft documentation PR #16 is open, mergeable, and unmerged.
- PR #16 confirmed head: `2686c4607694cbe8a29537b3c58deaed8448604e`.
- PR #16 CI #179 passed.
- No runtime or schema implementation exists yet for YKMS-11 through YKMS-18.


## Existing approved decisions


- YAKEBDA_MS is independent from other projects.
- Arabic-first and RTL-first are mandatory.
- PostgreSQL is the operational system of record.
- Backend services own order totals and pricing.
- Account, branch, permission, audit, and tenant isolation are non-negotiable.
- Google Drive is the user-facing memory source of truth.
- GitHub stores code and safe engineering documentation, not private strategy or chat memory.


## D-2026-07-12-01 — Finance architecture


**Status:** Approved


Use a hybrid model:


`Restaurant Finance Control + Accounting Bridge`


YAKEBDA MS owns operational finance details, subledgers, reconciliation, source/platform/driver settlements, expenses, taxes, and accounting events. Full double-entry journals and external accounting integration are introduced in a controlled later layer.


Do not build a large standalone ERP accounting product first.


## D-2026-07-12-02 — Implementation order


**Status:** Approved


1. `YKMS-11` — Order Sources & Pricing Context.
2. `YKMS-12` — Channel Menus & External Mappings.
3. `YKMS-13` — Inventory & Recipes.
4. `YKMS-14` — Delivery & Driver Operations.
5. `YKMS-15` — Finance Control.
6. `YKMS-16` — Accounting Bridge, COGS & Profitability.
7. `YKMS-17` — Online / QR / Platform Connectors.
8. `YKMS-18` — Egyptian e-Receipt & Compliance.


Finance-control design may begin early, but reliable COGS and profitability wait for inventory valuation. Driver settlement requires delivery ownership and COD custody first.


## D-2026-07-12-03 — Source-aware menu and pricing


**Status:** Approved


- Do not duplicate products for each source.
- Keep one master product, variants, modifiers, recipe, and stock identity.
- Channel Menu controls visible categories/items/modifiers, ordering, schedule, presentation, and availability.
- Pricelist controls prices and pricing rules.
- Source configuration controls commission, fees, default behavior, and settlement.
- External mappings connect YAKEBDA product IDs to platform IDs.


## D-2026-07-12-04 — Server-authoritative repricing


**Status:** Approved


- Source selection is part of quote context.
- Backend quote returns resolved prices, modifiers, tax, fees, availability, and applied rules.
- Changing source re-quotes all lines.
- User confirms changed totals and unavailable items.
- No zero-price fallback.
- Final orders store source/menu/pricelist/rule and monetary snapshots.


## D-2026-07-12-05 — Financial records


**Status:** Approved


- Posted journal entries are immutable.
- Corrections use reversal entries.
- Every financial event has an idempotency key and source reference.
- Debit must equal credit.
- Financial records are scoped by account, branch, date, and actor.
- Closed periods cannot be modified without authorized reopening.


## D-2026-07-12-06 — Reporting dimensions


**Status:** Approved


Use analytical dimensions rather than exploding the chart of accounts:


- branch;
- source/channel;
- order type;
- payment method;
- cost center;
- driver/platform where relevant.


## Pending decisions


- Exact external accounting provider(s).
- Egyptian e-receipt production scope and legal/accountant review.
- Inventory costing policy: weighted average vs another approved method.
- Driver compensation model.
- Platform-specific settlement/tax rules.
- Whether journal posting is per transaction or controlled daily batch.
