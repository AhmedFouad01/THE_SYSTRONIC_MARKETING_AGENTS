# YAKEBDA MS — MEMORY PACKET


Date: 2026-07-12
Project Key: YAKEBDA_MS
Packet: YKMS-02H / Order Sources / PR #17


## GitHub


Repository: AhmedFouad01/yakebda-ms


PR #15
- Branch: audit/system-wide-ui-consistency
- Head: 3054e165a36487eae7cb99aff4e3bdf6682878a8
- Open, Draft, Mergeable, Unmerged


PR #17
- Branch: feature/order-sources-price-lists
- Base: audit/system-wide-ui-consistency
- Head: 3d085fb72e362b44805a4da74769777a5ff004f5
- Open, Draft, Mergeable, Unmerged
- CI Run #228 passed
- API tests passed
- Admin production build passed


## Decision


YAKEBDA MS keeps one canonical menu. Order sources store only product availability and price overrides. Pricing priority is source price, then branch price, then base price.


POS requires choosing a source before quote and order submission. The server validates source compatibility, availability and pricing. New orders store the source reference and source name snapshot. Historical orders without a source remain unchanged.


## UI


- Settings Menu section was replaced by Sources.
- Sources can be created or copied from another source.
- Source prices and availability use responsive rows.
- POS source selection appears below Takeaway and Delivery.
- Shift history, order details and receipts show the source.
- Print Queue fields received scoped consistency fixes.


## Visual protection


Accepted POS product cards were not changed. Accepted KDS files were not changed. Both CI guards passed.


## Current gate


Visual review is pending. Do not mark either PR Ready and do not merge until explicit approval.
