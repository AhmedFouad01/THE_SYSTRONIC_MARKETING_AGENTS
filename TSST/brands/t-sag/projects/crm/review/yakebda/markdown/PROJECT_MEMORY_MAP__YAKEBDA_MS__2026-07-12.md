PROJECT_MEMORY_MAP — YAKEBDA_MS


Project Key: YAKEBDA_MS
Project Name: YAKEBDA MS — Restaurant Management System
Portfolio: YAKEBDA
Track: Track 1 — Restaurant Management System / POS / Orders / Delivery / Online
Owner: Ahmed Fouad
Status: Active Development / YKMS-02G merged / YKMS-02G-E local QA checkpoint
Last Updated: 2026-07-12


1. Project Identity
YAKEBDA_MS هو تراك السيستم البرمجي داخل Portfolio يا كبدة، ومسؤول عن نظام إدارة المطعم، نقطة البيع، الطلبات، المطبخ، العملاء، المستخدمين، الدليفري، الأونلاين، التقارير، وتشغيل الهاردوير. Foodics مرجع وظيفي فقط وليس نسخة حرفية.


2. Scope Ownership
يمتلك المشروع: POS، Takeaway / Delivery / Dine-in / Online Orders، Menu Management، Kitchen / KDS، Payments / Shifts، CRM، Users / Roles / Permissions، Inventory، Reports، Public API / QR / Website integrations، وWindows POS / hardware support.
لا يمتلك الهوية البصرية النهائية (مرجعها YAKEBDA_BRAND) أو الحملات والإعلانات (مرجعها YAKEBDA_MARKETING).


3. Repository Map
Local working repository:
C:\Users\10\Downloads\yakebda_github_repo


GitHub:
AhmedFouad01/yakebda-ms


Main merged state:
PR #8 — YKMS-02G: Product, CRM, Orders, and RBAC Refinement
Merge commit: ec2e2835a97f01d738a1da6efce131efadecfd5a


Current local branch:
ykms-02g-e-pos-operational-qa-fixes


Push state:
Not yet confirmed on GitHub


4. Milestone Status
Completed and merged:
- YKMS-01 Foundation
- YKMS-01H Windows / Hardware Foundation
- YKMS-01-CLEANUP Naming & Security Alignment
- YKMS-02 Menu / POS baseline
- YKMS-02C rebase and settings alignment
- YKMS-02D Menu/POS operating layer
- YKMS-02E Settings Architecture
- YKMS-02F UI/UX Operational Completion
- YKMS-02G Product / CRM / Orders / RBAC Refinement


Current local checkpoint:
- YKMS-02G-E POS Operational QA Fixes


Validated locally:
- API tests: 75/75 passed
- Admin production build: passed


Gate:
- Commit and push current 02G-E checkpoint before continuing


5. Current YKMS-02G-E Local Scope
Implemented locally: single طلب الآن CTA، current-shift order history، API-aware image URL resolution، /uploads Vite proxy، product image DB update، cashier self-shift read، optional payment inside order creation، وVite TypeScript environment declaration.


Current source set:
- apps/admin/src/lib/api.ts
- apps/admin/src/pages/Menu.tsx
- apps/admin/src/pages/Pos.tsx
- apps/admin/src/pages/menu/ImageUpload.tsx
- apps/admin/src/ykms-02f.css
- apps/admin/vite.config.ts
- apps/admin/src/vite-env.d.ts
- apps/api/src/modules/menu.ts
- apps/api/src/modules/orders.ts
- apps/api/src/modules/shifts.ts


6. Open POS Problems Confirmed by User
1. شريط الشيفت وسجل الطلبات ما زال تحت/خلف الهيدر بدل ما يكون مباشرة تحته وعلى top.
2. عدد الكروت في الصف ما زال كبيرًا والواجهة مزدحمة.
3. شكل كارت الصنف الحالي غير معتمد.
4. سجل الطلبات يحتاج صور الأصناف وعرضًا أقرب لخانة الطلب الحالية.
5. بيانات الطلبات السابقة تحتاج Audit شامل للحالات، الدفع، المطبخ، التوقيتات، الإجماليات، والصور.


7. Approved POS Product Card Direction
- الكارت للطلب فقط؛ لا تعديل للصنف داخله.
- التعديل من زر الإدارة العلوي.
- صورة كبيرة، اسم عربي كبير ومتمركز، سعر واضح، Dark surface مع Yellow accent، صف للحجم، صف لنوع العيش، وQuantity control أسفل الكارت.
- Responsive grid: 4 Large، 3 Medium، 2 Small، 1 Narrow.
- Vertical scrolling وبدون horizontal overflow.


8. Approved Product Card Interaction
- Left click: إضافة / زيادة عنصر واحد.
- Right click: تقليل / إزالة عنصر واحد.
- منع Browser Context Menu داخل الكارت.
- Required options لا يمكن تجاوزها.
- يظل التحكم التقليدي بالكمية واضحًا وقابلًا للاستخدام.


9. Approved POS Top Layout
AppShell Header
→ Branch Selector
→ Cashier / Shift State
→ Open / Close Shift
→ Search
→ Order History
→ Admin
→ Categories
→ Product Grid


المعالجة Structural في layout rows، sticky offsets، stacking context، top padding، وAppShell content sizing. ممنوع negative margins أو إخفاء بصري فقط.


10. Approved Order History Direction
- Current cashier / branch / account only.
- Since actual active-shift opening time.
- Show item/product images similar to active cart.
- Reuse OrderDetail.
- Audit authoritative mapping for order number/prefix، type، order status، kitchen status، payment status/paid amount، totals، item count/quantities، image per item، variants/modifiers/bread/notes، وكل timestamps التشغيلية.


11. GitHub Workflow Decision
- GitHub branches، focused commits، وPRs هي workflow الدائم.
- Current local checkpoint يجب commit + push قبل استكمال الشغل.
- Temporary patches/helper scripts ليست source code.
- ممنوع ادعاء push/merge بدون تأكيد.


12. Windows Desktop Direction
Future direction — not implemented:
WinUI 3 / Windows App SDK native shell
→ WebView2 hosts React/Vite UI
→ .NET hardware bridge
→ printers / cash drawer / scanner / kiosk / device identity / customer display
React يظل الواجهة التشغيلية الرئيسية؛ لا توجد خطة لإعادة كتابة كاملة بـ XAML.


13. Immediate Backlog
1. Commit and push current ykms-02g-e-pos-operational-qa-fixes.
2. Fix POS top-toolbar structure.
3. Rebuild product card from approved sample.
4. Enforce max 4 responsive columns.
5. Add left-click increment / right-click decrement.
6. Remove edit operations from cards.
7. Redesign shift order history with item images.
8. Audit previous-order data mapping.
9. Run tests/build/manual QA.
10. Open a new PR to main.


14. Next RM Commands
- RM validate YKMS-02G-E GitHub branch after push
- RM update YAKEBDA_MS mapping after POS card/history checkpoint
- RM create Windows shell handoff only after current POS QA closes
