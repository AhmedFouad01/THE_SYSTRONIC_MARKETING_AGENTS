# CURRENT STATUS — YAKEBDA_MS


Date: 2026-07-12
Project Key: YAKEBDA_MS
Status: Active — PR #14 merged; YKMS-11 planning baseline prepared


## Confirmed repository state


- Repository: AhmedFouad01/yakebda-ms
- Main baseline: 4df57964ef0dacddbbaca2b723849dd4afe055c0
- PR #14: merged and closed
- PR #14 final head: 14b1d12befeddf0700e083edd1374700366c0e53
- PR #14 final validation: CI #159 success, API 95/95, Admin build passed
- Documentation branch: docs/ykms-11-sources-finance-roadmap
- Draft documentation PR: #16
- PR #16 current confirmed head: 2686c4607694cbe8a29537b3c58deaed8448604e
- PR #16 CI: run #179 success
- PR #16 is open, Draft, mergeable, and unmerged


## Implemented baseline


- Tenant, branches, users, roles, permissions, audit
- Devices, hardware contracts, print jobs
- Menu, products, variants, modifiers, branch availability
- POS, server-side quote calculations, orders, payments, shifts
- KDS, receipts, reports, settings, CRM
- Global Light/Dark UI and legacy cleanup from PR #14


## Approved next program


1. YKMS-11 — Order Sources & Pricing Context
2. YKMS-12 — Channel Menus & External Mappings
3. YKMS-13 — Inventory & Recipes
4. YKMS-14 — Delivery & Driver Operations
5. YKMS-15 — Finance Control
6. YKMS-16 — Accounting Bridge, COGS & Profitability
7. YKMS-17 — Online / QR / Platform Connectors
8. YKMS-18 — Egyptian e-Receipt & Compliance


## Architecture decision


- Order Source is separate from order type, payment method, and delivery provider.
- One master product catalog is retained.
- Channel Menu controls availability and presentation.
- Pricelist controls pricing.
- Backend quote is authoritative and stores historical snapshots.
- Inventory and recipes precede reliable COGS.
- Delivery and driver custody precede complete driver settlements.
- Finance Control precedes the Accounting Bridge.


## Not implemented yet


No migrations, endpoints, schemas, background jobs, or UI for YKMS-11 through YKMS-18 have been implemented. All are planning targets until separate implementation PRs pass validation and are merged.


## Next action


Review Draft PR #16. After explicit approval and merge, create feature/ykms-11-order-sources from main and start with ADR refinement, ERD, API contract, migration/backfill plan, permissions, and tests.
