<div dir="rtl" align="right">


# YAKEBDA MS — ملف المشروع الرئيسي v1.3


**التاريخ:** 2026-07-12  
**الحالة:** Canonical / Active Development  
**Baseline الحالي:** `main` بعد دمج PR #14  
**Merge commit:** `4df57964ef0dacddbbaca2b723849dd4afe055c0`


## 1. الحالة المؤكدة


- PR #14 مدموجة ومغلقة.
- Final UI head: `14b1d12befeddf0700e083edd1374700366c0e53`.
- CI #159 نجحت، API 95/95، وAdmin production build نجح.
- برنامج التوثيق الجديد موجود في Draft PR #16؛ لم يبدأ تنفيذ Schema أو Runtime للمراحل الجديدة بعد.


## 2. تعريف المنصة


YAKEBDA MS منصة تشغيل مطاعم Arabic-first وRTL-first تربط POS، الطلبات، KDS، المنيو، CRM، المستخدمين والصلاحيات، الشيفتات، المدفوعات، التقارير، الأجهزة والطباعة، ثم تتوسع إلى مصادر الطلب، التسعير حسب القناة، المخزون، السائقين، الحسابات التشغيلية والربط المحاسبي.


## 3. القرار المعماري


- مصدر الطلب مستقل عن نوع الطلب وطريقة الدفع ومقدم التوصيل.
- يوجد Master Catalog واحد ووصفة واحدة لكل منتج.
- Channel Menu تتحكم في العرض والإتاحة والمحتوى الخارجي.
- Pricelist تتحكم في السعر والقواعد فقط.
- Backend Quote هو السلطة النهائية.
- الطلبات تحفظ snapshots للمصدر والمنيو وقائمة السعر والقواعد والأسعار.


## 4. نموذج الحسابات


المعتمد هو Restaurant Finance Control + Accounting Bridge.


### Finance Control


- الشيفتات والخزنة.
- المصروفات والاعتمادات.
- تسوية الكروت والمحافظ والبنك.
- عمولات ومستحقات المصادر.
- تسويات السائقين وCOD.
- الضرائب والاستردادات والإغلاق والاستثناءات.


### Accounting Bridge


- Financial event outbox.
- Journals وbalanced entries.
- Reversals بدل تعديل القيود.
- COGS وتقييم المخزون.
- ربحية المنتج والمصدر والفرع.
- Export/API لبرنامج محاسبي خارجي.


## 5. ترتيب التنفيذ


```text
YKMS-11 — Order Sources & Pricing Context
YKMS-12 — Channel Menus & External Mappings
YKMS-13 — Inventory & Recipes
YKMS-14 — Delivery & Driver Operations
YKMS-15 — Finance Control
YKMS-16 — Accounting Bridge, COGS & Profitability
YKMS-17 — Online / QR / Platform Connectors
YKMS-18 — Egyptian e-Receipt & Compliance
```


## 6. قواعد ثابتة


- لا سعر نهائي من Frontend.
- لا fallback إلى سعر صفر.
- تغيير المصدر يعيد Quote كاملًا.
- Channel Menu للإتاحة؛ Pricelist للسعر.
- المخزون نتيجة حركات موثقة.
- كل حدث مالي له مرجع وIdempotency وAudit.
- القيود المرحّلة تصحح بعكس.
- كل مرحلة تحتاج ADR وERD وSequences وMigration وTests وRollback.


## 7. خارج النطاق الأول


Payroll، fixed assets، bank sync، multi-currency، route optimization، والمعالجة الضريبية النهائية دون اعتماد مهني.


</div>
