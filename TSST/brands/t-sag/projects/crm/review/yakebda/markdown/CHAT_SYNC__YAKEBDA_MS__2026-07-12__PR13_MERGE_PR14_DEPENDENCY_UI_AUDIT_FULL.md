FULL CHAT SYNC — YAKEBDA MS


Project Key: YAKEBDA_MS
Date: 2026-07-12
Memory System: REAL_MEMORY v0.6.3
Sync Type: Full Chat Sync
Storage Layer: Google Drive / Real Memory project memory
Sync Scope: كل ما تم منذ آخر حفظ مؤكد بعد بوابة PR #10 وPR #11 وحتى نقطة الـVisual QA الحالية في PR #14.


1. نقطة البداية من آخر حفظ مؤكد


آخر ملف ذاكرة سابق مؤكد كان MEMORY_PACKET__YAKEBDA_MS__2026-07-12__PR10_PR11_FINAL_LOCAL_QA_GATE. منذ هذه النقطة استمر العمل في Order Integrity، Runtime Reliability، Dependency Security، وUI / Legacy Cleanup.


2. الحالة المؤكدة على main


الفرع الرئيسي main مستقر عند merge commit:
732d862a7ee086c2f2b73b75f3cc6e8a89a19c96


هذا الـcommit هو نتيجة Squash Merge لـPR #13 بعنوان:
fix(runtime): harden sessions, KDS, printing, and POS reliability


PR #13 تم دمجها وإغلاقها رسميًا. آخر تحقق محلي قبل الدمج:
API tests: 95/95
Admin production build: Passed
git diff --check: Clean


3. PR #12 — Order Integrity / Pricing


تم دمج PR #12 بعنوان:
refactor(orders): centralize pricing and quote calculations


الـcommit المؤكد:
0b27dcc


أهم النتائج:
- توحيد حساب السعر والـquote في مصدر مركزي.
- تثبيت قواعد order integrity وatomic numbering.
- اختبارات pricing وorder numbering وsecurity scope أصبحت جزءًا من البوابة.
- الـAPI test suite ارتفعت إلى 95 اختبارًا ناجحًا.


4. PR #13 — Runtime Reliability


تم تنفيذ ودمج:
- انتهاء جلسات Admin مركزيًا عند 401.
- تثبيت إعدادات KDS في state ثابت بدل render-local objects.
- احترام kds_enabled ومنع polling غير المطلوب.
- إزالة الطلبات المنتهية من KDS بعد مدة الإخفاء المحددة.
- إعادة استخدام AudioContext لتقليل أخطاء الصوت.
- Auto Print عند إنشاء طلب مدفوع مع تفعيل الطباعة.
- Loading/Error handling لتفاصيل سجل طلبات الشيفت.
- منع ضغطات وطلبات POS المكررة.
- حذف Workflow قديم كان يسبب Failure كاذب.
- استعادة YAKEBDA MS CI القياسي.


Smoke Test اليدوي المؤكد:
- سجل طلبات الشيفت ظاهر ويعمل.
- تفاصيل الطلب تُفتح بدون duplicate request.
- الشيفت والـKDS والـPOS أصبحوا أكثر استقرارًا.
- PR #13 تم تحويلها Ready ثم Squash Merge.


5. PR #14 — Dependency Security + UI Legacy Cleanup


PR #14 ما زالت Draft وغير مدموجة.
Branch:
audit/dependency-ui-legacy-cleanup


الحالة المؤكدة قبل آخر Visual QA:
Head confirmed after Shift Dialog:
dc2bbeb67de76c3ccdb1dcc127dd691b572bdc99
CI run #131: Success


تم بعد ذلك إضافة Patch scaffold على نفس الفرع:
4592c2ccfa569a6fa0b886098726d33882888c43
الـpatch خاص بـContrast وResponsive Cart Drawer، لكن تطبيقه النهائي وcommit/push النهائي لم يتم تأكيدهما بعد في الذاكرة.


6. Dependency Security — الحالة الحالية


تمت ترقية SheetJS من xlsx@0.18.5 إلى الإصدار الرسمي الآمن 0.20.3.
Production audit:
0 vulnerabilities


تمت ترقية أدوات التطوير:
- Vite إلى 8.1.4
- @vitejs/plugin-react إلى 6.0.3
- Vitest إلى 4.1.0


بيئة المستخدم:
Node 24.18.0
npm 11.16.0


التحقق بعد الترقية:
npm audit: 0 vulnerabilities
API tests: 95/95
Admin build: Passed
git diff --check: Clean


ممنوع استخدام npm audit fix --force.


7. UI / Legacy Cleanup المكتمل


تم إنهاء البنود التالية:
- إزالة Item Manager القديم والمكرر من داخل POS.
- تحويل إدارة الأصناف إلى شاشة /menu الرسمية.
- إخفاء زر إدارة العروض الـplaceholder.
- إزالة OptionPicker وProductEditor والـdead flows غير المستخدمة من POS.
- استبدال رموز AppShell الكلاسيكية بأيقونات SVG.
- إضافة صفحة Not Found للمسارات غير الصحيحة.
- استبدال window.prompt الخاص بفتح وإغلاق الشيفت بواجهة Modal داخل النظام.
- إضافة إدخال رقمي، validation، loading state، ومنع الضغط المتكرر للشيفت.
- Smoke Test يدوي أكد اختفاء نافذة localhost says ونجاح الـShift Modal.


8. البنود غير المقبولة بصريًا حتى الآن


المستخدم أكد بالصور أن النظام ما زال يحتوي على مشاكل UI/UX واسعة، لذلك لا يُعتبر UI Cleanup مكتملًا بعد.


المشاكل المسجلة:
- ألوان نصوص وحدود منخفضة الـcontrast، خصوصًا داخل Order Detail والـtimeline.
- خلط غير متناسق بين خلفيات بيضاء وداكنة وأصفر وأخضر وبرتقالي وأحمر دون hierarchy ثابت.
- أزرار تبدو كلاسيكية أو Browser-default في عدة شاشات.
- selects وcheckboxes وinputs قديمة بصريًا.
- أزرار KDS وحالات الوقت لا تتبع نظام ألوان موحد.
- تنسيق Settings / Roles & Permissions باهت ويحتوي عناصر تبدو غير مكتملة.
- أزرار Menu Builder مثل إضافة مجموعة وإضافة إضافة لا تتبع Component System موحد.
- قائمة اختيار الفرع تحمل مظهرًا browser-native غير متناسق.
- في الوضع الضيق، السلة تختفي ويظهر زر السلة، لكن ترتيب شريط الأدوات وتوزيع الأزرار غير مقبول بعد.
- Cart Drawer تعتبر قيد الـQA وليست منتهية أو مقبولة نهائيًا.
- لا يجب اعتبار Contrast fix منتهيًا لمجرد وجود ملف CSS override.


9. الصور المرفوعة كدليل Visual QA


تم تسجيل الصور التالية من الشات الحالي كمرجع للمشاكل:
- 63bc8afc-b5ab-4711-8451-578e30d38af4.png
- 41874954-d642-4bd6-bd22-3b14dace31aa.png
- 3ec07f33-55dd-42fc-9fdc-9cd70ea48e12.png
- 0ba7e0a5-0da1-41c3-86db-e02e39adf3e8.png
- Screenshot 2026-07-12 101124.png
- Screenshot 2026-07-12 101114.png
- 7ab95f3e-9d45-48e3-ae0c-81d165771fee.png


المعاني المسجلة من الصور:
- Order details mobile/drawer readability issue.
- KDS timer/status/action color inconsistency.
- Settings permissions controls and low-contrast placeholders.
- Native select appearance.
- Classic yellow rectangular buttons in menu editing.
- POS mobile toolbar and cart trigger layout needing redesign.


10. القرار الحالي


قبل أي تعديل بصري إضافي:
- إجراء بحث أونلاين من مصادر UI/UX وAccessibility موثوقة.
- بناء Color Roles واضحة بدل توزيع ألوان حسب كل صفحة.
- تحديد neutral surfaces، text hierarchy، border hierarchy، primary accent، semantic success/warning/error/info.
- قياس contrast وفق WCAG بدل التقدير البصري فقط.
- توحيد Button، Select، Checkbox، Input، Badge، Status، Drawer، Modal، وMobile Toolbar كـcomponents.
- عدم إصلاح كل صفحة بoverride مستقل جديد؛ الأولوية لتقليل طبقات CSS وبناء مصدر واحد نهائي للـtokens.


11. بوابة الإغلاق لـPR #14


لا يتم تحويل PR #14 إلى Ready ولا دمجها قبل:
- مراجعة البحث وتثبيت UI color strategy.
- إصلاح Contrast الحقيقي في الشاشات المرفوعة.
- إعادة تصميم أزرار وعناصر form الكلاسيكية.
- تثبيت ترتيب Mobile POS toolbar وزر السلة.
- اختبار Cart Drawer على عرض أقل من 900px.
- اختبار Desktop وعدم حدوث regression.
- npm audit = 0 vulnerabilities.
- API tests = 95/95.
- Admin build = Passed.
- git diff --check = Clean.
- CI قياسي ناجح على آخر head.
- Smoke Test يدوي وقبول المستخدم بصريًا.


12. حالة المصدر والحقيقة


Google Drive هو مصدر الذاكرة المعتمد.
main مؤكد عند PR #13 merge commit 732d862.
PR #14 Draft وغير مدموجة.
أي تغييرات Contrast / Cart Drawer بعد patch scaffold تعتبر Local QA حتى يتم تأكيد commit وpush وCI.
لا يتم الادعاء بأن UI Cleanup اكتملت قبل قبول المستخدم النهائي.
