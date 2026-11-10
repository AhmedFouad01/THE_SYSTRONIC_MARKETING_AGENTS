# CRMS-TSST-008

## CASE_B_RESULT

نجح `pnpm verify:crms-002w:local --case-b` مرتين ورا بعض من نسخة نظيفة، في بيئتين محليتين منفصلتين. في المرتين، `POST /api/v1/billing/bills/{id}/close` بالحمولة `{"expectedVersion":3}` رجّع `409` بينما الصنف لسه في المطبخ. الرد الفعلي كان `{"message":"Bill lifecycle does not allow this operation","error":"Conflict","statusCode":409}`. الاختبار بيشترط الحالة وبيسجّل الرد من غير مقارنة نص الرسالة أو اشتراط كود داخلي.

بعد الرفض، الفاتورة فضلت `SETTLED` على الإصدار 3 وتاريخ الإغلاق فارغ. المدفوع 40 جنيه والمتبقي صفر. الطلب فضل `SUBMITTED` على الإصدار 3 والصنف فضل `QUEUED` على الإصدار 0. بعد تقديم الصنف، نفس الطلب رجّع `201`. اتأكد إغلاق الفاتورة والطلب وإتاحة الترابيزة.

## REGRESSION

نجح فحص صياغة ملفّي الاختبار، ورفض خيار تشغيل غير صالح، ونجح `git diff --check`. حالات A/C/D ونتيجة 8/8 و`typecheck` و`lint` من الجولة الأولى محفوظة في `5faf79d:TSST/bus/out/CRMS-TSST-008.md`. تشغيل `--case-b` تجاوز الحالات دي. التغيير في الجولة دي اقتصر على `scripts/crms-002w-local-verify.mjs` و`scripts/crms-002w-runtime-verify.mjs`.

## EVIDENCE

آخر `master` في TSST وقت الاستئناف هو `5faf79d42176608c0c849132136dbafb106d695e`. فحص `preflight` نجح. فرع الكافيه `codex/crms-beta-e2e-008` مبني على `545f595c792e2c33f24c41f7c02d87347b106644`. النسخة المختبرة والمتحقق منها على الريموت هي `3815b60f79dc87fe6d7f3dc6a07af5e38470271e`. عدد تشغيلات GitHub Actions للفرع بعد الرفع صفر.

سجل `runtime.log` وملخص `summary.json` لكل تشغيل تحت `C:/Users/Do7a/Projects/CAFE_RESTAURANT_MS_E2E008/tmp/crms-002w-evidence/`.

- `crms002w-verify-4c31305342dd` على بورتات محلية 65502–65504. الفاتورة `01a1c50d-039a-7597-83e3-516687871d7a`. بصمة السجل `8f40aeb70901c108abfc4ae4af0348a3409ab9ee7179930ec6e102a5719ee5ca`.
- `crms002w-verify-7f2b380c5afb` على بورتات محلية 49192–49194. الفاتورة `01a1c50e-19d7-7d37-b792-3cc5ca4e03c7`. بصمة السجل `0cbbb1096a220aeb577d9a82cf3e901290afdf9f8a2df190a51dc1f119806e77`.

بعد التشغيلين اتأكد إن موارد الاختبار والبورتات ومفاتيح TLS المؤقتة اتنضفت. معرّفات حاويات QA وAndroid وعمليات البورتات المحجوزة طابقت الحالة قبل التشغيل.

## BLOCKERS

مفيش عوائق في النطاق المعتمد.

Skills used: `TSST-DEV-SK-011` لاختبار الرفض وحالة البيانات وإعادة الإغلاق، و`TSST-DEV-SK-015` للتحقق من النسخة والعزل والنتائج والتنظيف. Skill friction: none.
