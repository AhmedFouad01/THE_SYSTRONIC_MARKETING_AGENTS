YAKEBDA MS — MEMORY PACKET
YKMS-02E Settings Architecture + Operational Configuration
Date: 2026-07-10


Purpose
This memory packet records the approved direction for the next YAKEBDA MS milestone. YKMS-02E will convert the current POS prototype into a configurable restaurant operating system. Back Office will become the source of truth for settings, while POS, Kitchen/KDS, Reports, Shifts, and Printing will read from those settings instead of hardcoded values.


Core principle
Back Office = configuration, master data, permissions, reports
POS = fast cashier operation
Kitchen/KDS = production workflow
Reports = financial and operational truth


Final Settings Structure
Settings
- بيانات المطعم
- الفروع
- الضرائب والرسوم
- الطلبات
- المنيو
  - الأقسام
  - الأصناف
  - الأحجام / Variants
  - الإضافات / Modifier Groups
- العروض والخصومات
- المطبخ
  - KDS
  - محطات التحضير
  - أوقات التحضير
- الطباعة والأجهزة
- الشيفت والكاش
- العملاء والتوصيل
- المستخدمون والصلاحيات
- التقارير


Restaurant Basic Setup
Fields: restaurant name Arabic/English, POS display name, address, contact numbers, tax registration number, logo, brand colors black/yellow, default language Arabic, RTL, EGP currency, timezone, date/time format. These values must appear in POS header, receipts, reports, and print templates.


Branches
Every branch must support name, address, phone, active/inactive state, currency, tax profile, printer configuration, menu availability, branch-level prices, takeaway enabled, delivery enabled, and dine-in enabled/disabled. Current YAKEBDA decision: dine-in/tables exists architecturally but stays hidden and inactive for now.


Taxes and Fees
Required: VAT enabled, VAT percentage, tax-inclusive or tax-exclusive prices, service fee, default delivery fee, minimum delivery order, rounding rules, and receipt tax display. Tax/fees affect POS totals, receipts, shifts, reports, and payments.


Order Management
Order types: takeaway, delivery, dine-in hidden now, online orders placeholder. Each order type needs active flag, POS visibility, customer/address/driver requirements, kitchen dispatch, receipt printing, kitchen ticket printing, and allowed payment methods. Order numbering must support daily reset, per-branch sequence, optional prefixes, and call/queue number.


Menu
YAKEBDA category order: الكل، ساندوتشات، أطباق، وجبات، الحواوشي، البطاطس، فواتح الشهية، إضافات، مشروبات.
Product fields: name, category, base price, SKU, image, description, ingredients, prep time, availability, unavailable reason, POS visibility, report visibility, discountable flag, kitchen dispatch, prep station, sort order, branch price override, branch availability override.
Image standard: square 1:1, 800x800px, JPG/WebP, less than 400KB, object-fit cover.


Variants
Sandwich variants: لقمة فينو، هامر فينو، لقمة سياحي، هامر سياحي.
Hawawshi variants: كبسولة، رغيف.
Each variant has name, price delta, default flag, active flag, product applicability, optional extra prep time.


Modifiers
Rule: do not invent modifiers outside Ya Kebda menu. Current sandwich modifiers: طحينة، باربيكيو، شيدر، بطاطس. Modifier groups need name, min_select, max_select, required flag, allow duplicate, price, linked products, print to kitchen, show on receipt.


Offers and Discounts
Discounts: fixed amount, percentage, product-level, order-level, cashier threshold, required reason, manager PIN approval, report reason. Promotions later: bundle/combo, buy X get Y, happy hour, time-based, branch-based, order-type-based, category/product based, start/end date, days of week, stackable flag. YKMS-02D has manual discount only; YKMS-02E models the architecture gradually.


Kitchen/KDS
Required: KDS enabled, kitchen ticket printing, prep stations Grill/Fryer/Assembly/Drinks, category-to-station mapping, default prep time per category, prep time per product, hide ready orders after X minutes, new order sound, SLA thresholds warning after 7 minutes and late after 12 minutes. KDS links to operating day, shift, order type, printer routing, and kitchen performance reports.


Printing and Hardware
Printers: receipt printer, kitchen printer, station printers, paper size 58mm/80mm, copies, auto-print triggers, logo, tax, cashier, shift number, order type. Hardware: cash drawer, barcode scanner, customer display, payment terminal, KDS screen, printer status, branch/device role. Windows POS + hardware support remains core scope.


Users and Permissions
Roles: Owner, Manager, Cashier, Kitchen, Driver, Accountant, Admin. Cashier can create orders and modify quantities, but sensitive actions need manager approval. Manager controls shifts, products, prices, discounts, cancellations, reports, and users. Kitchen sees KDS and changes status, not financial data unless enabled. Driver sees assigned delivery orders only.


Shift and Cash
Required: require open shift for cash, opening cash, expected cash, actual closing cash, cash difference, paid in/out, cash drawer operations, shift report, cashier performance, payment split, force close before end of day, manager approval for cash out. Every cash-affecting action must be auditable.


Customers and Delivery
Customers: name, phone, addresses, notes, order count, total spend, last order, blocked flag. Delivery: zones, fee by zone, minimum order, drivers, active/inactive drivers, order-driver link, ETA, driver report, driver cash collection.


Reports
Required reports: today sales, shift sales, cashier sales, product/category sales, best sellers, discounts, cancellations, refunds later, taxes, payment methods, delivery, kitchen average prep time, late orders, cash reconciliation, profit later after recipe/costing.


UX/UI Direction
POS: Cairo font, RTL-first, black/yellow brand, square product images, plus/minus controls, details only when needed, cart always readable, sticky payment actions, clean scroll areas. Back Office: settings sidebar groups, tabs, edit drawers/modals, search/filter, active toggles, clear save/cancel, audit hints.


YKMS-02E Immediate Scope
1. Settings structure
2. Restaurant profile
3. Branch settings
4. Tax/service fee settings
5. Order type settings
6. Menu settings tabs
7. Product edit drawer/modal
8. Shift/cash settings
9. Kitchen/KDS settings
10. Printer placeholders
11. Permission mapping UI
12. Offers architecture placeholder


Deferred
Dine-in visual table map, online ordering, loyalty, inventory recipe costing, supplier purchasing, advanced promotions, direct image upload, payment terminal integration.


Engineering Data Model Candidates
restaurant_profile, branch_settings, tax_profiles, service_fee_profiles, order_type_settings, order_number_sequences, prep_stations, printer_devices, printer_routes, hardware_devices, discount_rules, promotion_rules, delivery_zones, driver_profiles, permission_overrides.


Conclusion
YKMS-02E converts YAKEBDA MS from a working POS prototype into a configurable restaurant operating system focused on fast cashier, clean menu management, shift/cash control, kitchen dispatch, printing, delivery, reliable reporting, and role-based permissions.
