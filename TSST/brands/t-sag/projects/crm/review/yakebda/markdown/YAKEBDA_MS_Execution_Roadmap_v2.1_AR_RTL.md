<div dir="rtl" align="right">


# YAKEBDA MS — Execution Roadmap v2.1


**الحالة:** Canonical Planning Baseline  
**Baseline:** PR #14 مدموجة في `main`


## YKMS-11 — Order Sources & Pricing Context


- Source taxonomy وفصل الأبعاد.
- order_sources/source_branch_configs/price_lists/price_list_rules.
- snapshots على orders/order items.
- توسيع Backend Quote مع deterministic precedence.
- POS source selector وإعادة التسعير.
- تقارير حسب المصدر.
- Gate: migrations، pricing tests، scope/security، manual POS QA.


## YKMS-12 — Channel Menus & External Mappings


- channel menus/categories/items/modifier availability.
- source/branch binding.
- draft/publish/versioning.
- external mappings وsync logs.
- admin editor وpreview.


## YKMS-13 — Inventory & Recipes


- items/UOM/conversions/locations.
- recipes/yield/version snapshots.
- purchases/receipts/transfers/waste/counts/adjustments.
- idempotent deduction and reversal.
- valuation policy foundation.


## YKMS-14 — Delivery & Driver Operations


- delivery ownership/provider.
- dispatch and assignment state machine.
- timestamps/failure reasons.
- COD custody and settlements.
- zones/fees/performance/permissions.


## YKMS-15 — Finance Control


- daily finance dashboard.
- expenses and approvals.
- cash in/out and shift reconciliation.
- payment/source/driver settlements.
- closing/lock/exceptions/export.


## YKMS-16 — Accounting Bridge, COGS & Profitability


- financial event outbox.
- chart/journal mappings.
- balanced immutable entries and reversals.
- inventory valuation/COGS/profitability.
- external adapter/dry run/backfill.


## YKMS-17 — Online / QR / Platform Connectors


Published channel menus، required source context، adapters، webhooks، retry، deduplication، logs.


## YKMS-18 — Egyptian e-Receipt & Compliance


Isolated compliance adapter، device/branch mapping، versioned payload، submission/retry/status، legal validation.


## Branches


```text
feature/ykms-11-order-sources
feature/ykms-12-channel-menus
feature/ykms-13-inventory
feature/ykms-14-delivery-drivers
feature/ykms-15-finance-control
feature/ykms-16-accounting-bridge
```


كل مرحلة تبدأ من main بعد دمج السابقة.


</div>
