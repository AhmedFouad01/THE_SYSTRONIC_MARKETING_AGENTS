YAKEBDA_MS — FULL CHAT SYNC
التاريخ: 2026-07-12
نوع الحفظ: Full Chat Sync
Project Key: YAKEBDA_MS


1) مصدر الحقيقة وحالة التخزين
- Google Drive هو مصدر الذاكرة المواجه للمستخدم.
- هذا المستند يسجل التطورات منذ آخر Full Sync وحتى توقف المستخدم للمراجعة البصرية.
- الريبو: AhmedFouad01/yakebda-ms
- الفرع: audit/dependency-ui-legacy-cleanup
- PR: #14 — audit(ui): secure dependencies and rebuild legacy UI foundations
- الحالة المؤكدة: Open + Draft + Mergeable + Unmerged.
- HEAD المؤكد: d6e019733d9dd3c1a49322c93d4d7cc24ccef839
- آخر CI مؤكد: YAKEBDA MS CI run #153 — Success.


2) السياق السابق الثابت
- PR #12 مدموجة: تسعير وquote calculations مركزية.
- PR #13 مدموجة: Runtime Reliability، 401/session expiry، KDS stability، الصوت، hide-ready، auto-print، POS history states، bootstrap dedup، وإزالة workflow قديم.
- Base الحالي لـPR #14: main عند 732d862a7ee086c2f2b73b75f3cc6e8a89a19c96.


3) هدف PR #14
بدأت كـDependency Security + Legacy UI Cleanup، ثم توسعت بعد Visual QA إلى إعادة تأسيس UI foundations بدون تغيير business logic:
- Dependency security.
- إزالة flows قديمة من POS.
- Controls وألوان وحالات موحدة.
- Contrast وإمكانية قراءة أفضل.
- Responsive Cart Drawer.
- Light/Dark للنظام كله.
- إصلاح Order Detail وKDS وSettings وRoles/Permissions.
- تظل Draft حتى القبول البصري النهائي.


4) Dependency وLegacy Cleanup المكتمل
- SheetJS انتقل من xlsx@0.18.5 إلى official 0.20.3.
- Vite إلى 8.1.4، مع ترقيات React plugin وVitest.
- npm audit: 0 vulnerabilities في الـgates المؤكدة.
- API suite: 95/95 tests.
- Admin production build ناجح في آخر CI.
- إزالة Item Manager القديم من POS.
- إزالة Offers placeholder.
- إزالة OptionPicker / ProductEditor والـlegacy admin flows من POS.
- استبدال window.prompt لفتح/إغلاق الشيفت بـin-app validated form.
- استبدال AppShell glyphs بـSVG.
- إضافة Not Found route.


5) تسلسل السلايس المؤكدة
- 09690953f54f84acd59ca4db350bf3056cfaa023 — Contrast baseline + responsive cart drawer.
- dfa045e370d96cce48aefad1df7adc057c9809ef — Semantic UI foundations.
- 5c71f886ab1266cce5c9b6689a8b4f726836265d — Order Detail readability/responsive.
- 373c28860c22842b2da48ce336d3d3a1a0c9d2c9 — KDS workflow/SLA hierarchy.
- d75f93c7a4c7bb96940df6f017d3d6dd03c02feb — Settings + Roles & Permissions cleanup.
- 5082e8d467f2449493623954163adebf66abf86b — Global Light/Dark theme foundation.
- 392edb17c0b1be2e0e47548fd9f3a3348d9d893e — Legacy color reconciliation.
- 5c0a202f8f0572ae7a138711a69cd8452b07ffb5 — Broader legacy component reconciliation.
- e4b682d2461ee9170c93a8a35e0862d558b0df0f — POS hover/active/focus correction.
- d6e019733d9dd3c1a49322c93d4d7cc24ccef839 — Current head after layout polish، KDS data fixes، select styling.


6) القرار التصميمي المثبت
المستخدم طلب Light وDark للنظام كله، وليس POS فقط.
تم اعتماد:
- Theme عالمي light | dark.
- Theme toggle في AppShell بأيقونة شمس/قمر SVG.
- الحفظ في localStorage بالمفتاح yakebda-ms.theme.
- data-theme على documentElement.
- prefers-color-scheme ثم Light كـfallback لأول تشغيل.
- POS يرث الثيم المختار بدل Theme منفصل إجباري.
- الخلفية الأساسية للوضع الداكن: #182126.
- الألوان الثابتة مسموحة داخل Theme palette أو عند قرار تصميمي واضح؛ الممنوع تكرار ألوان عشوائية متعارضة داخل كل Component.


7) طبقات CSS الحالية
- theme.css: السلطة النهائية للألوان والأسطح والنصوص والحدود والحالات Light/Dark.
- theme-interactions.css: hover/active/focus النهائي لمنع legacy CSS من كسر الثيم.
- ui-polish.css وcorrection layer: sizing، spacing، alignment، density، boxed layouts.
- Legacy CSS ما زالت موجودة تدريجيًا لكن الطبقات النهائية محملة بعدها.


8) المشاكل البصرية المعالجة
- نصوص داكنة فوق Dark surfaces في POS/Dashboard/History/Settings/KDS.
- أرقام Dashboard سوداء بسبب legacy selector.
- Menu inputs/buttons بخلفيات Light ثابتة.
- Receipt actions وClose buttons كانت تبدو فارغة.
- Shift History كانت Light وبداخلها Dark islands.
- POS Light hover كان يرجع خلفية Dark ويخفي النص.
- تمت معالجة cards، toolbars، history، modals، drawers، overlays، scrollbars، disabled/focus states.


9) Order Detail
- Header ثابت وClose SVG.
- Summary grid للإجمالي والدفع والنوع والفرع والكاشير.
- StatusChip دلالي.
- Light/Dark حسب الثيم والسياق.
- Desktop table يتحول cards تحت 640px.
- Timeline completed/current/future/cancelled.
- Scroll container رأسي واحد.
- ما زال مطلوبًا Smoke Test للأسماء الطويلة، modifiers الكثيرة، حد 640/641px، وactions sidebar الطويل.


10) KDS
- فصل Workflow: submitted / in_kitchen / ready عن SLA: normal / warning / late.
- Workflow badge/indicator مستقل.
- SLA timer chip مستقل مع label/icon/aria-label/tabular numbers.
- Ready تعرض «تم التجهيز» ولا تتحول Late.
- البطاقة محايدة، والـSLA يؤثر على timer/indicator فقط.
- Stats Neutral مع استخدام محدود للأخضر/الأحمر.
- Notes warning-neutral.
- Layout pass قلل padding/gaps/font sizes/metadata/action لتقليل ارتفاع الطلب الكبير.
- Responsive 3 columns ثم stacking حسب العرض.


11) نوع العيش والإضافات في KDS
المستخدم لاحظ أن فينو/سياحي تظهر تحت الإضافات.
تم تعديل Render من البيانات نفسها:
- Variant الأساسي يظهر كالحجم عند الحاجة.
- modifiers المطابقة لقيم العيش المعروفة مثل فينو/سياحي تظهر تحت «نوع العيش».
- باقي modifiers فقط تظهر تحت «الإضافات».
- لم يتم الاكتفاء بتغيير Label بالـCSS.


12) Settings
- Boxed layout متمركز بدل عرض الصفحة كله.
- Sidebar أقسام + body بعرض محدود.
- content max-width يقارب 860px.
- cards وsticky save bar داخل نفس النظام البصري.
- image URL rows: صورة + field في Grid.
- القيم الإنجليزية تحافظ على bidi الصحيح مع محاذاة بصرية من اليمين حسب طلب المستخدم.
- شريط الحفظ لم يعد شريطًا أبيض منفصلًا.


13) Roles & Permissions
- تم إلغاء شكل الشرطات/الفجوات غير المقروءة.
- Summary count ملون حسب عدد الصلاحيات:
  قليل = Red/Danger.
  متوسط = Orange/Warning.
  كثير = Green/Success.
  المالك/كل الصلاحيات = Success badge.
- Controls/toggles touch-safe.
- لا تغيير في permission logic أو API.


14) Menu / Forms / Buttons
- توحيد control heights مع small size موحد.
- Menu toolbar: Import/Template/Export/New/Filters بنفس الارتفاع والمحاذاة.
- Row actions تعديل/نسخ/حذف في Grid متساوية.
- form-row fields والأزرار أقرب في الارتفاع والbaseline.
- image URL inputs والصور مصطفة.
- Selects بسهم SVG وشكل حديث.
- customizable select styling للمتصفحات الداعمة؛ المتصفحات الأقدم قد تعرض native popup كـfallback.


15) AppShell / Navigation
- menu/home/back/theme/close أصبحت 40×40 ومحاذاة SVG موحدة.
- Nav drawer close مضبوط.
- Theme toggle keyboard accessible.
- Drawer يحتاج مراجعة يدوية على widths ضيقة.


16) POS Mobile / Cart Drawer
- Cart Drawer scaffold تحت 900px: toggle/backdrop/close/Escape وإغلاق بعد نجاح الطلب.
- Desktop cart تظل Sidebar.
- Mobile toolbar hierarchy لم تحصل على قبول بصري نهائي بعد.


17) CI history المهمة
- CI #149 نجحت بعد Layout pass الأساسي.
- CI #151 فشلت في Admin build بسبب String.replaceAll غير المتوافق مع TypeScript target.
- تم استبداله بـsplit/join دون تغيير السلوك.
- CI #152 نجحت.
- بعد تحسين select styling، CI #153 نجحت وهي آخر Gate مؤكدة.


18) الملفات الأهم في المرحلة الأخيرة
- apps/admin/src/main.tsx
- apps/admin/src/theme.css
- apps/admin/src/theme-interactions.css
- apps/admin/src/ui-polish.css
- correction CSS layer المرتبطة بالـpolish
- apps/admin/src/pages/Kitchen.tsx
- apps/admin/src/components/ui/AppShell.tsx
- apps/admin/src/components/ui/primitives.tsx
- apps/admin/src/pages/Users.tsx
- apps/admin/src/pages/settings/SettingsLayout.tsx
- apps/admin/src/pages/settings/shared.tsx
- apps/admin/src/pages/settings/crudSections.tsx


19) الوضع الحالي عند توقف المستخدم
- المستخدم سيعمل Local Visual Review على آخر head.
- لا تبدأ Slice جديدة قبل ملاحظاته.
- لا تحول PR إلى Ready.
- لا تعمل Merge.
- لا تعتبر UI مقبولة نهائيًا حتى يقول المستخدم ذلك صراحة.
- المستخدم غالبًا سيبدأ شات جديد بعد المراجعة.


20) Checklist المراجعة
- Menu toolbar ومقاسات controls.
- Menu row actions.
- Branch select في Windows/Chromium.
- App drawer close.
- Users/Roles permission summary colors.
- API Clients inline form.
- Settings boxed layout، English alignment، image rows، sticky save.
- KDS density مع طلب كبير.
- KDS bread vs extras.
- Theme toggle وDark background #182126.
- POS Light/Dark hover.
- Mobile Cart Drawer والtoolbar.


21) مخاطر المتابعة
- Native select popup قد يظل OS-native على متصفح لا يدعم customizable selects.
- CSS :has في permission-count يحتاج متصفح حديث؛ Chromium الحديث يدعمه.
- أسماء/modifiers طويلة جدًا تحتاج Smoke Test.
- KDS metrics على 360px تحتاج مراجعة.
- Settings tables قد تستخدم local horizontal scroll على الموبايل.
- PR body ما زال يحتوي Visual QA findings قديمة ويحتاج تحديثًا عند الإغلاق النهائي.
- PR كبيرة نسبيًا؛ لا تضف نطاقات جديدة غير لازمة قبل الدمج.


22) تشغيل آخر نسخة محليًا
cd C:\Users\10\Downloads\yakebda_github_repo
git switch audit/dependency-ui-legacy-cleanup
git pull --ff-only origin audit/dependency-ui-legacy-cleanup
Remove-Item -Recurse -Force apps/admin/node_modules/.vite -ErrorAction SilentlyContinue
npm run admin:dev
ثم Ctrl + Shift + R


23) Boot للشات الجديد
- اقرأ هذا المستند وMemory Packet المرتبطة به.
- تحقق من PR #14 وHEAD والـCI على GitHub لأن الحالة mutable.
- الحالة المتوقعة عند الحفظ: head d6e0197، CI #153 success، Draft، unmerged.
- ابدأ من ملاحظات المستخدم البصرية الجديدة فقط.
- لا تعيد فتح backend/business logic.
- نفّذ التعديلات بنفسك على نفس الفرع عندما يطلب المستخدم.
- لا تدّع حفظ/رفع/نجاح إلا بعد تأكيد الأداة أو CI.


END OF FULL CHAT SYNC
