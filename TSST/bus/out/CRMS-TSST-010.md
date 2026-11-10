# CRMS-TSST-010 — PASS

اتسجّل الاستلام وفحص `preflight` على TSST `master` عند `aa674c25e50f3a4b7f0f9602ab5d42f4c7893a34`. فرع الكافيه `codex/crms-cashier-close-010` مبني على `2be3e6e78d68c369a101dccc9e2a6abdc532958c`. النسخة المختبرة والمتحقق منها على الريموت `7f28f6951d5b5aaaf0f0fef40a1b626fd4091d7b`. عدد تشغيلات GitHub Actions للنسخة بعد الرفع صفر.

٥ ملفات، ٣٤ سطر مضاف و٩ محذوفة. ترحيل جديد، تحديث عدّاد الترحيلات في اختبار الأساس والفحص الثابت، وتعديل اختبار `002w`. اختبار التكامل `packages/testing/integration/billing-payments.test.ts:205` كان بيقارن قائمة صلاحيات الكاشير كاملة. اتبلّغ عنه قبل التعديل حسب التكليف، واتضاف سطر واحد للتوقع.

`infra/db/migrations/0032_cashier_bill_close.sql`

```sql
BEGIN;

INSERT INTO identity.role_permissions(role_id,permission_id)
SELECT r.id,p.id
FROM identity.roles r
CROSS JOIN identity.permissions p
WHERE r.code='CASH_CUSTODIAN'
  AND p.code='billing.bill.close'
ON CONFLICT DO NOTHING;

COMMIT;
```

## الفحوصات

- `pnpm verify:crms-002w:local` نجح مرتين من نفس النسخة النظيفة. الكاشير أخد `409` قبل السداد، والفاتورة فضلت `OPEN` بإصدار 3 ومبلغ 100.00 مستحق. بعد السداد أخد `201` والفاتورة اتقفلت والترابيزة بقت متاحة. ١٦ سجل تدقيق في كل تشغيل، منها إغلاق من حساب الكاشير. النادل اتمنع من الإغلاق والكاشير اتمنع من تأكيد الدفع الإلكتروني بـ`403`. سيناريو المطبخ والنقل نجحوا.
- `pnpm verify:crms-002s:local` نجح على قاعدة مؤقتة جديدة بـ٣٢ ترحيل. الفواتير والتحصيل والخزنة 15/15 (6+5+4)، وتطبيق الويب 183/183 في 23 ملف، منهم الكاشير 50/50. خطوات `typecheck` و`lint` للـEdge API و`testing` والويب، وبناء الويب، نجحت ضمن نفس التشغيل.
- `node scripts/static-verify.mjs` نجح. `pnpm --filter @crms/testing test` نجح 8/8. `git diff --check 2be3e6e HEAD` نجح.

## الأدلة

مجلد الأساس `C:/Users/Do7a/Projects/CAFE_RESTAURANT_MS_E2E008/tmp/`.

- `crms-002w-evidence/crms002w-verify-9b4ea519a7f3/`، بورتات 50121–50123. بصمة `runtime.log` هي `da97f16bb0e0fcf411ee67af888359a9718222fd11259b04dff65c2a6b6bc66e`.
- `crms-002w-evidence/crms002w-verify-7b8d8b5aad98/`، بورتات 50184–50186. بصمة `runtime.log` هي `eb60280add226a7367be953a0cd8ad82b45182521d03cad87c2361bbaa78246c`.
- `crms-002s-evidence/2026-11-10T11-52-43-509Z/summary.json`، مشروع `crms002s-verify-3580` وبورت 50266. الاستدعاء استخدم بيئة PowerShell محدودة ومتغيرات محلية.

اتأكد تنظيف المشاريع الثلاثة من الحاويات ووحدات التخزين والشبكات والبورتات. حاويات الـQA وAndroid وعمليات البورتات المحجوزة طابقت حالة البداية.

Skills used: `TSST-DEV-SK-006` للترحيل الإضافي، `TSST-DEV-SK-007` لحدود الصلاحيات، `TSST-DEV-SK-011` لاختبارات الرفض والإغلاق، و`TSST-DEV-SK-015` للنسخة والعزل والتنظيف. Skill friction: none.
