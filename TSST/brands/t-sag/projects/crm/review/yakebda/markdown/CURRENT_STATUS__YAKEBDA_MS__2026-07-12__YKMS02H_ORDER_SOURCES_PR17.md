# CURRENT STATUS — YAKEBDA_MS


Date: 2026-07-12
Project Key: YAKEBDA_MS
Memory System: REAL_MEMORY v0.6.3
Status: Active — PR #15 visual gate + PR #17 YKMS-02H visual gate


## Confirmed GitHub state


- Repository: AhmedFouad01/yakebda-ms
- Main baseline: 4df57964ef0dacddbbaca2b723849dd4afe055c0
- PR #15: fix(ui): normalize legacy controls and responsive admin layouts
  - Branch: audit/system-wide-ui-consistency
  - Head: 3054e165a36487eae7cb99aff4e3bdf6682878a8
  - State: Open / Draft / Mergeable / Unmerged
  - Scope: visual consistency, responsive Reports, Settings layout, RTL selects, typography, compact shift history.
- PR #17: feat(order-sources): add source price lists and mandatory POS selection
  - Branch: feature/order-sources-price-lists
  - Base: audit/system-wide-ui-consistency (stacked on PR #15)
  - Head: 3d085fb72e362b44805a4da74769777a5ff004f5
  - State: Open / Draft / Mergeable / Unmerged
  - CI Run #228: Passed
  - npm ci: Passed
  - API tests: Passed
  - Admin production build: Passed


## YKMS-02H — Order Sources and Price Lists


Implemented on PR #17:


- Removed the duplicated Menu section from Settings and replaced it with Sources.
- Added source creation from scratch or copying an existing source’s rules.
- Kept one canonical menu; sources store only product availability and price overrides.
- Added source configuration for active state, takeaway support, delivery support, and ordering.
- Added source-aware branch menu and server-side quote pricing.
- POS requires an explicit source before quote or order submission.
- New orders store source_id and source_name_snapshot.
- Source is displayed in shift history, Order Detail, receipt preview, receipt print payload, and kitchen ticket payload.
- Scoped field/select cleanup was applied to Sources and Print Queue without redesigning accepted POS product cards or KDS.


## Architecture decision


Pricing precedence:


1. Source product override
2. Branch product override
3. Canonical product base price


Data model:


- order_sources
- source_product_rules
- orders.source_id
- orders.source_name_snapshot


Orders retain financial snapshots in order_items so later price changes do not affect historical orders.


Transition rule:


- POS is strict and cannot submit without choosing a source.
- Legacy API clients that omit source_id temporarily resolve to the system source direct.
- Orders created before the migration remain without a source and display as: طلب سابق — المصدر غير مسجل.


## Visual safety gate


- Accepted ProductCard code was protected by a CI diff guard and was not changed.
- Accepted KDS files were protected by a CI diff guard and were not changed.
- CI Run #228 confirmed both guards passed.
- Visual acceptance is still required for:
  - Settings > Sources
  - POS source selector below Takeaway / Delivery
  - Source-specific prices and availability
  - Print Queue field layout
  - Shift history source badge


## Documentation updated in GitHub


- docs/adr/ADR-002-order-sources-and-price-lists.md
- docs/YAKEBDA_MS_Diagrams_Roadmap_v1_AR_RTL.md
- docs/YAKEBDA_MS_Milestone_Log.md


## Acceptance gate


Do not merge PR #15 or PR #17 and do not mark either Ready until Ahmed Fouad gives explicit visual approval.


## Next operational step


1. Update the local repository to feature/order-sources-price-lists.
2. Run migrations.
3. Open Settings > Sources and create/copy a source.
4. Verify source-specific availability and prices.
5. Verify POS blocks ordering until a source is selected.
6. Confirm POS product cards and KDS remain visually unchanged.
7. After explicit approval: close PR #15 first, then rebase/retarget PR #17 as required and merge in dependency order.
