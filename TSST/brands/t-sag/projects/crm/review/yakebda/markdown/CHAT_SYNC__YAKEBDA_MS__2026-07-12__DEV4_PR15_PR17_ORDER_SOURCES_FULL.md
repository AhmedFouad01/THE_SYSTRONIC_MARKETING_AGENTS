# YAKEBDA_MS — FULL CHAT SYNC


Date: 2026-07-12
Trigger: احفظ كل حاجة في الميموري
Conversation: YAKEBDA MS DEV 4
Storage layer: Google Drive / Real Memory project memory


## 1. Continuity


This conversation continues YAKEBDA MS DEV 3 and DEV 4. It is not a new project. The active repository is AhmedFouad01/yakebda-ms. Arabic-first and RTL-first remain mandatory. YAKEBDA MS is separate from AKYRO.


## 2. Starting baseline


PR #14 had already been merged into main at:


- Main baseline: 4df57964ef0dacddbbaca2b723849dd4afe055c0


The next visual-consistency work was isolated in PR #15:


- PR #15
- Branch: audit/system-wide-ui-consistency
- Head: 3054e165a36487eae7cb99aff4e3bdf6682878a8
- State: Open / Draft / Mergeable / Unmerged


PR #15 contains:


- normalized legacy controls and active states;
- responsive Reports and Settings layout;
- unified RTL select geometry;
- typography rules;
- compact searchable shift-order history;
- no accepted KDS redesign changes.


## 3. Rejected QA consolidation and rollback


A broad CSS/QA consolidation pass changed the CSS cascade and broke the approved POS presentation. The user rejected the result. The branch was rolled back to the last accepted pre-consolidation state.


Confirmed decision:


- Do not use passing visual snapshots as a substitute for user visual approval.
- Do not change accepted POS product-card or KDS layout during infrastructure/QA work.
- Keep visual work targeted and reviewable.
- The rejected state is preserved only as backup/pr15-before-pos-rollback.


## 4. Approved final visual review scope on PR #15


The user approved targeted corrections:


- fix clipped Settings menu/table content;
- make Reports responsive without desktop horizontal-scroll frames;
- standardize RTL select arrows, padding, focus and sizing;
- remove the redundant POS Administration shortcut;
- minimize Shift Order History and add order-number search and one shift-total KPI;
- establish consistent typography rules.


These changes were implemented and validated. PR #15 remains Draft because final visual acceptance has not been given.


## 5. New user requirement — Sources instead of duplicate Settings Menu


After reviewing the Settings operational menu table, the user rejected keeping the duplicate Menu section in Settings and requested:


- remove Menu from Settings;
- replace it with Sources;
- allow adding a source or copying an existing source configuration;
- allow source-specific product prices;
- show sources below Takeaway / Delivery in POS;
- prevent order submission unless a source is explicitly selected;
- fix inconsistent fields without damaging accepted visual design.


The feature was intentionally separated from PR #15 because it includes schema, API, pricing and order-flow changes.


## 6. YKMS-02H implementation


New stacked branch:


- Branch: feature/order-sources-price-lists
- Base: audit/system-wide-ui-consistency
- PR: #17
- PR title: feat(order-sources): add source price lists and mandatory POS selection
- Final tested head: 3d085fb72e362b44805a4da74769777a5ff004f5
- State: Open / Draft / Mergeable / Unmerged


Implemented behavior:


### Settings > Sources


- The duplicate Settings Menu section is removed.
- Sources use responsive cards and rows instead of the failed wide operational table.
- A source can be created from scratch.
- A source can copy the product rules of another source.
- Each source can define:
  - Arabic name;
  - active state;
  - Takeaway support;
  - Delivery support;
  - sort order;
  - product availability;
  - product price override.


### Canonical menu rule


There is one canonical menu. Products, images, components and options are not duplicated per source.


A source stores only:


- availability override;
- price override.


### Pricing precedence


1. Source product price override
2. Branch product price override
3. Canonical product base price


All quote and order pricing is calculated on the server. The client cannot supply trusted prices.


### POS flow


- The source selector is placed below Takeaway / Delivery.
- Only active sources compatible with the selected order type are loaded.
- Changing order type resets source selection.
- POS does not request a quote until a source is chosen.
- POS disables order submission and displays اختر مصدر الطلب when missing.
- source_id is submitted to quote and create-order endpoints.
- Changing the source reloads source-specific menu availability and effective prices.


### Order persistence


New database structures:


- order_sources
- source_product_rules
- orders.source_id
- orders.source_name_snapshot


New orders store both source reference and name snapshot. Order-item unit prices and line totals remain financial snapshots.


Historical orders created before the migration remain without source and display:


طلب سابق — المصدر غير مسجل


### Transition compatibility


- POS is strict: explicit source selection is mandatory.
- Legacy API clients that omit source_id temporarily map to the system direct source.
- The direct source is created idempotently for each account.


### Source visibility


Source is included in:


- Shift Order History;
- Order Detail;
- receipt preview;
- printed receipt payload;
- kitchen-ticket print payload.


## 7. Field consistency correction


Scoped field corrections were applied to:


- Settings Sources fields;
- source price controls;
- POS source selector;
- Print Queue endpoint selector and form layout.


Rules include:


- consistent height and typography;
- RTL arrow placement;
- correct padding and text alignment;
- responsive widths;
- no vertical-letter or clipped-label behavior.


This was not a global CSS cascade rewrite.


## 8. Visual safeguards


The feature CI included explicit guards:


- fail if accepted POS ProductCard code is touched;
- fail if accepted KDS files are touched.


Both guards passed.


The inspected POS diff contains only source data/state, source-aware menu/quote/order behavior, source selector, missing-source guard, and source history badge. ProductCard implementation was not changed.


KDS source files were not changed.


## 9. Tests and CI


Successful workflow:


- CI Run: #228
- Run ID: 29198902092
- Apply deterministic feature patch: Passed
- POS ProductCard guard: Passed
- KDS guard: Passed
- npm ci: Passed
- API test suite: Passed
- Admin production build: Passed
- Persist tested feature commit: Passed


The tested result was committed to branch head:


3d085fb72e362b44805a4da74769777a5ff004f5


## 10. GitHub documentation updated


- apps/api/src/db/migrations/20260712_013_order_sources_price_lists.ts
- apps/api/src/modules/orderSources.ts
- apps/api/tests/order-sources.test.ts
- apps/admin/src/pages/settings/SourcesSection.tsx
- docs/adr/ADR-002-order-sources-and-price-lists.md
- docs/YAKEBDA_MS_Diagrams_Roadmap_v1_AR_RTL.md
- docs/YAKEBDA_MS_Milestone_Log.md


## 11. Current acceptance state


Neither PR is approved for merge.


- PR #15: visual gate pending.
- PR #17: visual gate pending.
- Do not mark Ready.
- Do not merge.


Required user review:


1. Settings > Sources visual layout.
2. Create a source and copy source rules.
3. Edit product availability and price override.
4. POS source selector below Takeaway / Delivery.
5. Missing-source blocking state.
6. Effective price change by source.
7. Shift-history source badge.
8. Print Queue fields.
9. Confirm ProductCard and KDS remain unchanged.


## 12. Local checkout


Recommended local sequence:


```powershell
cd C:\Users\10\Downloads\yakebda_github_repo
git fetch origin
git switch feature/order-sources-price-lists
git reset --hard origin/feature/order-sources-price-lists
npm ci
npm run db:migrate
npm run admin:dev
```


Then use Ctrl + Shift + R in the browser.


## 13. Merge dependency


PR #17 is stacked on PR #15. The safe dependency order is:


1. Receive explicit visual approval for PR #15.
2. Merge PR #15 or otherwise establish its head as the accepted base.
3. Rebase or retarget PR #17 if required.
4. Re-run CI.
5. Receive explicit visual approval for PR #17.
6. Merge PR #17.


## 14. Source-of-truth statement


- GitHub contains the implemented and tested code.
- Google Drive contains this Full Chat Sync, a new Current Status and a Memory Packet.
- No merge has been performed.
- No PR has been marked Ready.
