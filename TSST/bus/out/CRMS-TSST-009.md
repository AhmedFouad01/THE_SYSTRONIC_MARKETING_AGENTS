# CRMS-TSST-009 — PASS

استلام وتحقق `preflight` على TSST `master` عند `fbc4a12317bfe58174916b88dcad3c8940cbd077`. فرع الكافيه `codex/crms-close-kds-message-009` مبني على `3815b60f79dc87fe6d7f3dc6a07af5e38470271e`. نسخة التشغيل والريموت `2be3e6e78d68c369a101dccc9e2a6abdc532958c`. اترفع الفرع المحدد، والاستعلام عن GitHub Actions بعد الرفع رجّع صفر تشغيلات للنسخة دي.

التعديل ٦ ملفات، ٦٧ سطر مضاف و٤ محذوفة. اتعدّل تحويل خطأَي المطبخ في `billing.controller.ts`، وعرض رسالة الإغلاق في `PosPage.tsx` و`BillingPage.tsx`، مع اختبار لكل شاشة وتعديل الحالة B في `crms-002w-runtime-verify.mjs`. اختبارا الشاشتين فشلوا على السلوك القديم عند التحقق من النص العربي، ونجحوا بعد التعديل بالنص المطلوب:

> لسه فيه أصناف في المطبخ ما اتسلمتش. سلّمها أو الغيها الأول، وبعدين اقفل الفاتورة.

## التشغيل الفعلي

`pnpm verify:crms-002w:local` نجح مرتين على نفس النسخة النظيفة. في المرتين، `POST /api/v1/billing/bills/{id}/close` مع `{"expectedVersion":3}` رجّع HTTP `409` والرد:

`{"message":"Kitchen items are still in progress; serve or cancel them before closing the bill","error":"Conflict","statusCode":409}`

الفاتورة فضلت `SETTLED` على الإصدار 3، والطلب `SUBMITTED` على الإصدار 3، والصنف `QUEUED` على الإصدار 0. بعد التقديم، نفس الطلب رجّع `201` والفاتورة بقت `CLOSED` على الإصدار 4. كل تشغيل طابق ١٦ سجل تدقيق في A، ونتائج `201/400/409` للنقل في C، و`403/403` للصلاحيات في D.

## الفحوصات

- `pnpm --filter @crms/pwa test` نجح 183/183 في 23 ملف، منهم 50/50 في `PosPage.test.tsx`.
- `pnpm --filter @crms/testing test` نجح 8/8.
- `pnpm --filter @crms/pwa --filter @crms/edge-api typecheck` ونفس النطاق لـ`lint` نجحوا.
- `pnpm --filter @crms/pwa build` نجح مع تنبيهات حجم الحزمة وتوقيت الإضافات. `pnpm --filter @crms/edge-api... build` نجح داخل كل تشغيل. `git diff --check 3815b60 HEAD` نجح.

## الأدلة والعزل

`runtime.log` و`summary.json` لكل تشغيل تحت `C:/Users/Do7a/Projects/CAFE_RESTAURANT_MS_E2E008/tmp/crms-002w-evidence/`.

- `crms002w-verify-205a91fda6c8`، بورتات 49532–49534، فاتورة `01a1c52f-0f41-7217-8667-0eea7491507b`. بصمة السجل `c252ec1cac147f4eee100067b983165804f4e34b61302944fe1c59d19b30c028`.
- `crms002w-verify-2820695ad873`، بورتات 49710–49712، فاتورة `01a1c532-8728-7bd6-b319-3abe2b41a032`. بصمة السجل `97891ca4b36b318a25ee5e61c16f5072aa7f624a8f68b0ee1be2a7a5d57ed3ad`.

تنظيف التشغيلين اتأكد من إزالة الحاويات ووحدات التخزين والشبكات ووقف بورتات الاختبار وحذف مفاتيح TLS المؤقتة. معرّفات حاويات QA وAndroid وعمليات البورتات المحجوزة طابقت الحالة قبل التشغيل. مفيش عوائق.

Skills used: `TSST-DEV-SK-005` لعقد الخطأ بين الـAPI والشاشتين، `TSST-DEV-SK-011` لاختبارات الشاشتين والتشغيل الفعلي، و`TSST-DEV-SK-015` للتحقق من النسخة والعزل والتنظيف. Skill friction: none.
