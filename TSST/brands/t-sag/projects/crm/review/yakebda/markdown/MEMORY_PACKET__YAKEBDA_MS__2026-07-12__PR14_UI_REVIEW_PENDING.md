YAKEBDA_MS — MEMORY PACKET
التاريخ: 2026-07-12
الحالة: USER VISUAL REVIEW PENDING


PROJECT
- Repo: AhmedFouad01/yakebda-ms
- Branch: audit/dependency-ui-legacy-cleanup
- PR: #14
- PR state: Open, Draft, Mergeable, Unmerged
- Current confirmed HEAD: d6e019733d9dd3c1a49322c93d4d7cc24ccef839
- Latest confirmed CI: run #153 Success
- Base main: 732d862a7ee086c2f2b73b75f3cc6e8a89a19c96


DO NOT
- لا تعمل Merge.
- لا تحول PR إلى Ready.
- لا تبدأ Slice جديدة قبل ملاحظات المستخدم البصرية.
- لا تغيّر backend أو business logic إلا بسبب regression مباشر ومؤكد.


COMPLETED
- Dependency audit: 0 vulnerabilities.
- API tests: 95/95.
- Admin build: passed.
- Legacy Item Manager/Offers/OptionPicker/ProductEditor removed from POS.
- Shift prompts replaced by in-app validated controls.
- Global Light/Dark theme with AppShell toggle.
- Theme storage key: yakebda-ms.theme.
- Dark base background: #182126.
- Order Detail responsive redesign.
- KDS workflow/SLA separation and compact cards.
- Settings boxed layout.
- Roles/permissions summary badges by permission count.
- Shared button/input/select geometry normalized.
- POS hover states fixed in Light/Dark.
- Cart Drawer scaffold under 900px.
- KDS bread separated from real extras during rendering.


CURRENT UI ARCHITECTURE
- theme.css = color authority.
- theme-interactions.css = hover/active/focus authority.
- ui-polish.css + correction layer = layout/sizing/density.
- Legacy CSS still exists underneath and is being retired incrementally.


USER REVIEW TARGETS
- Menu toolbar/action button sizing.
- Native/custom select appearance on Windows Chromium.
- App drawer close button.
- API Clients form alignment.
- Settings boxed width, English value alignment, image URL rows, sticky save.
- Permission-count colors.
- KDS density with large order.
- KDS «نوع العيش» vs «الإضافات».
- POS Light/Dark hover.
- Mobile POS toolbar + Cart Drawer.


KNOWN RISKS
- Unsupported browsers may still show OS-native select popup.
- Very long item/modifier names.
- KDS metrics density at 360px.
- PR body is stale and needs final update before Ready.


NEXT CHAT START
1. Verify PR #14 head and latest CI on GitHub.
2. Ask for / read the user’s new screenshots and notes.
3. Apply only the reported visual corrections on the same branch.
4. Keep PR Draft until explicit visual approval.


FULL SYNC FILE
CHAT_SYNC__YAKEBDA_MS__2026-07-12__PR14_UI_THEME_LAYOUT_QA_FULL


REGRESSION PREVENTION RULE — قاعدة منع تكرار الأخطاء
- التعديلات الجديدة مسموحة ومطلوبة عند الحاجة؛ هذه القاعدة لا تجمّد النظام ولا تمنع تطويره.
- قبل تعديل أي جزء، يجب مراجعة الإصلاحات والقرارات السابقة المرتبطة به وفهم سببها وتأثيرها على باقي التطبيق.
- ممنوع إعادة إدخال مشكلة سبق إصلاحها، أو تكرار نفس الخطأ البنيوي بطريقة جديدة.
- مثال مهم: لا نبني طبقة CSS جديدة فوق طبقات قديمة متعارضة لمجرد إخفاء المشكلة؛ الأفضل تحديد مصدر التعارض، تنظيفه أو توحيده، ثم جعل مصدر السلطة واضحًا.
- أي تعديل جديد يجب أن يحافظ على الإصلاحات المقبولة سابقًا ما لم يكن هناك قرار صريح باستبدالها بتحسين أفضل.
- عند تعديل Component أو Workflow أو Style مشترك، يجب مراجعة كل الشاشات والسياقات التي تعتمد عليه، وليس الشاشة الحالية فقط.
- التحقق بعد التعديل يجب أن يشمل الحالات التي سبق أن فشلت، مع Regression check أو test كلما كان ذلك عمليًا.
- المطلوب هو التطوير بدون نسيان تاريخ الإصلاحات، وليس منع التغيير.
