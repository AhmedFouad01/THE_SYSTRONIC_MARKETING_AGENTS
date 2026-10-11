<div dir="rtl" align="right">


# YAKEBDA MS — Deep Research: Order Sources, Inventory, Drivers, and Finance


**التاريخ:** 2026-07-12  
**الطبقة:** Google Drive / Product Strategy & Architecture Research  
**الحالة:** Research completed — translated into approved planning documents


---


## 1. النتيجة الرئيسية


الأنسب لـYAKEBDA MS هو:


## Restaurant Finance Control + Accounting Bridge


وليس ERP محاسبي كامل من البداية.


النظام يحتفظ بالتفاصيل التشغيلية: الطلب، المصدر، الدفع، الشيفت، العمولة، السائق، المصروف، المخزون، والوصفة. ثم يحولها إلى Financial Events وقيود أو Export إلى نظام محاسبي لاحقًا.


---


## 2. أفضل نموذج لمصادر الطلب


### فصل أربعة أبعاد


- Order Source: من أين جاء الطلب؟
- Order Type: تيك أواي/دليفري/صالة.
- Payment Method: كاش/كارت/محفظة/منصة.
- Delivery Provider: سائق المطعم/سائق المنصة/استلام.


### لا تكرار للمنتجات


Master Product واحد، ثم:


- Channel Menu للإتاحة والعرض.
- Pricelist للسعر.
- External Mapping للمنصة.
- Snapshot على الطلب.


### Quote من الخادم


كل تسعير يمر عبر الخادم، لأن السعر قد يعتمد على المصدر والفرع والوقت والـVariant والإضافات والضريبة.


---


## 3. ترتيب التنفيذ الأفضل


1. Sources and pricing context.
2. Channel menus and external mappings.
3. Inventory and recipes.
4. Drivers and delivery.
5. Finance control.
6. Accounting bridge, COGS, profitability.
7. Online/platform connectors.
8. Egyptian e-receipt.


### السبب


- عمولة المصدر تحتاج source.
- COGS يحتاج inventory.
- COD settlement يحتاج driver flow.
- الربحية الحقيقية تحتاج sales + commissions + COGS.
- التكاملات تحتاج published channel menu ومappings.


---


## 4. عناصر Finance Control


- Daily financial dashboard.
- Shift and cash reconciliation.
- Expenses and approval workflow.
- Payment clearing.
- Platform/source settlements.
- Driver COD settlements.
- Refund and reversal tracking.
- Period closing.
- Exceptions queue.
- Exports.


## 5. عناصر Accounting Bridge


- Chart of accounts mapping.
- Journals.
- Financial event outbox.
- Balanced entries.
- Reversals.
- Inventory valuation and COGS.
- Profitability by branch/source/product.
- External accounting adapter.
- Dry-run and backfill.


---


## 6. الإعدادات المطلوبة


### Sources


- الاسم والنوع والحالة.
- الفروع المتاحة.
- default order/payment/delivery behavior.
- commission and settlement cycle.
- external store/platform IDs.


### Pricelists


- fixed/percent/formula rule.
- product/variant scope.
- branch/source scope.
- start/end dates.
- priority and rounding.


### Channel Menus


- products/categories.
- variants/modifiers.
- display names.
- availability schedule.
- mappings.
- publish state.


### Inventory


- UOM and conversion.
- locations.
- negative stock.
- costing policy.
- recipe deduction event.
- waste/count approvals.


### Drivers


- internal/platform.
- assignment permissions.
- COD custody.
- settlement tolerance.
- failure reasons.


### Finance


- journals/accounts mapping.
- expense categories and approvals.
- shift difference tolerance.
- source settlement rules.
- period lock.
- posting mode.
- export adapter.


---


## 7. مصادر البحث الرسمية


- Odoo POS Pricelists: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/pricing/pricelists.html
- Odoo Online Food Delivery: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/online_food_delivery.html
- Odoo Chart of Accounts: https://www.odoo.com/documentation/19.0/applications/finance/accounting/get_started/chart_of_accounts.html
- Odoo Journals: https://www.odoo.com/documentation/19.0/applications/finance/accounting/get_started/journals.html
- Odoo Analytic Accounting: https://www.odoo.com/documentation/19.0/applications/finance/accounting/reporting/analytic_accounting.html
- Odoo Expense Approval: https://www.odoo.com/documentation/19.0/applications/finance/expenses/approve_expenses.html
- Odoo Bill of Materials: https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/basic_setup/bill_configuration.html
- Egyptian Tax Authority e-Receipt Services: https://www.eta.gov.eg/ar/content/e-receipt-services


هذه المراجع استخدمت لاستخلاص أنماط عامة، ولا تعني اعتماد Odoo أو أي منتج خارجي كجزء من النظام.


</div>
