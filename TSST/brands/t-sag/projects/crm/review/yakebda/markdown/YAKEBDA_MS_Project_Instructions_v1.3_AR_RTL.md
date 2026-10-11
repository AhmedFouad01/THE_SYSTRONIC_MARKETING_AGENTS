<div dir="rtl" align="right">


# YAKEBDA MS — Project Instructions v1.3


## الحالة


- `main` يحتوي PR #14 عند `4df57964ef0dacddbbaca2b723849dd4afe055c0`.
- Draft PR #16 يوثق YKMS-11 إلى YKMS-18.
- لا يوجد تنفيذ Runtime أو Schema للموديولات الجديدة.


## ترتيب مصادر الحقيقة


1. Project Master v1.3
2. Execution Roadmap v2.1
3. SRS v2
4. Diagrams Roadmap v2.1
5. Current Implementation
6. ADR-002 وADR-003
7. Planning Decision Log v1.1
8. Milestone Log
9. AGENTS.md
10. README.md


نسخ v1.2/v2.0 تاريخية ولا تستخدم كبداية تنفيذ.


## الترتيب الإجباري


```text
Sources & Pricing
→ Channel Menus
→ Inventory & Recipes
→ Delivery & Drivers
→ Finance Control
→ Accounting Bridge / COGS
→ Online Connectors
→ e-Receipt
```


## قواعد التشغيل


- Backend Quote هو السعر النهائي.
- Source مستقل عن order type/payment/delivery provider.
- Master product واحد.
- Channel Menu للإتاحة، Pricelist للسعر.
- تغيير المصدر يعيد Quote كاملًا.
- المخزون يعتمد على movements والوصفات.
- COD عهدة حتى التسوية.
- Finance Control يسبق Accounting Bridge.
- القيود المرحّلة immutable والتصحيح بعكس.


## قبل الكود


ADR، Scope، ERD، Sequence/State، API contract، migration/backfill، permissions، tests، rollback.


## بوابات الجودة


```bash
npm audit
npm run api:migrate
npm run api:test
npm run admin:build
git diff --check
```


## Git


- فرع مركز من main لكل مرحلة.
- PR تبقى Draft حتى الاختبارات والـQA.
- لا Merge دون موافقة صريحة.
- لا خلط UI cleanup مع Core schema/pricing.
- لا ادعاء حفظ أو نجاح دون تأكيد.


</div>
