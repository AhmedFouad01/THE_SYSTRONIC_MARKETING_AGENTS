YAKEBDA MS UI W2 current status — 2026-07-16


الحالة الحالية للواجهة محفوظة.


Branch: fix/ui-feedback-batch
Final HEAD: 30049940e78afc9aa8b2b7d88b695091e060df8f


W0 وW1
- W0 مكتملة.
- W1 مكتملة.
- Commit 0de68b1: إصلاح توافق مصدر الطلب مع نوع الطلب المختار.
- Commit 97da185: إصلاح تسريب checkbox المعطلة وعدادات الصلاحيات الحقيقية.
- لا Push ولا PR للفرع حتى الآن.
- Working tree: clean حسب آخر تقرير.


W2.0 المكتملة
- Start HEAD: 97da18565d79e2b7f77c9a6855238e416bde18bb
- Final HEAD: 30049940e78afc9aa8b2b7d88b695091e060df8f
- Commit: fix(ui): stabilize responsive AppShell geometry
- التعديل محصور في apps/admin/src/theme.css.
- لا React أو API أو business logic، ولا تعديل global-colors.css.


ما أغلقه W2.0
- منع overflow في POS عند المقاسات الضيقة.
- تثبيت صفوف AppBar داخل 96px.
- إخفاء Admin sidebar ضيقًا واعتماد drawer.
- إخفاء labels الثانوية عند 560px أو أقل مع بقاء الوظائف.
- Horizontal overflow: 0.
- Viewport mismatch: 0.
- Focus-visible وRTL drawer geometry: PASS.


بوابات W2.0
- Admin tests: 11/11 PASS.
- Admin build: PASS.
- Color contract: PASS.
- git diff --check: PASS.
- new important declarations: 0.
- new raw colors: 0.
- Visual QA: 24 captures على Light/Dark والمقاسات 1920x1080 و1366x768 و728x912 و560x900.
- JavaScript page errors: 0.
- توجد 81 استجابة 404 قديمة لأصول محلية مفقودة، أغلبها صور منتجات POS، وتُسجل كدين سابق.


ترتيب W2 من هنا
- W2a: Core AppShell redesign — لم تبدأ بعد.
- W2b: Logo upload/configuration.
- W2c: POS delivery container proportions.
- W2d: Order modal clipping تحت AppShell.
- W4 مؤجلة بالكامل حتى إغلاق W2.


W2a المطلوب
- wide logo في المنتصف الحقيقي.
- زيادة ارتفاع AppShell من token مركزي.
- إعادة توزيع Dashboard وStore وHistory وSearch.
- استبدال Home بأيقونة Dashboard.
- حذف اسم المطعم النصي.
- الحفاظ على User + Shift وTheme + Logout وRTL.
- لا رفع لوجو ولا API ولا Database ولا Product Grid/KDS في نفس الموجة.


W4 backlog — مؤجل فقط
- Typography pilot لتحسين النصوص الصغيرة؛ لا استخدام Montserrat كخط عربي أساسي.
- KDS minimal redesign مع الحفاظ على ألوان الحالات.
- Kitchen pause / order hold يحتاج Backend state وصلاحيات وAudit وAPI وRealtime واختبارات؛ لا Toggle محلي فقط.
- تثبيت مساحة scrollbar ومنع flicker.
- Sticky Save/Undo تحت AppShell.
- تبسيط مصادر الطلب إلى الاسم مع semantic tags.
- تقليل استخدام الأبيض عبر semantic tokens.
- جدول عملاء أوسع مع server-side sorting وcursor مرتبط بالترتيب.


المرجع الحاكم
- Audit P0–P3 مرجع دائم للتشخيص والتنفيذ والتحقق، وليس Full Audit جديد.
- Root cause ثم أقل تغيير صحيح.
- commit مستقل لكل نطاق.
- لا Push أو Rebase أو Merge أو Reset أو Mark Ready دون إذن.
- لا اعتبار skipped أو waived اختبارات ناجحة.
- توثيق أي failure سابق بدقة وعدم نسبته للتغيير الجديد.


UI/CSS contract
- theme.css مصدر structural وsemantic tokens.
- global-colors.css سلطة الألوان النهائية وآخر import.
- Screen CSS للـgeometry، والطبقة العامة للألوان.
- ممنوع raw colors جديدة أو important declarations جديدة.
- الحفاظ على RTL وعقود AppShell وPOS.
- hover داخل media hover، وfocus-visible واضح.
- فحص CSSOM عند selectors مجمعة أو specificity غير واضحة.


Skills Advisory
- UI/UX Pro Max، Emil/Design Engineer، Apple Design، frontend-design، accessibility، visual-regression، React best practices تستخدم كمرجع Advisory فقط.
- متطلبات المستخدم وعقود YAKEBDA MS وAudit P0–P3 أعلى أولوية من أي Skill.


الخطوة التالية
- البدء من HEAD: 30049940e78afc9aa8b2b7d88b695091e060df8f
- تنفيذ W2a فقط.
- Commit مقترح: refactor(app-shell): center brand and rebalance operational controls
- لا Push ولا PR ولا بدء W2b قبل إرسال screenshots ونتائج البوابات.


حالة GitHub المنفصلة
- main: 17413499288a458224d874a24e61561ca9fb90a3.
- PR #38: P3 Draft، لا Merge دون إذن.
- PR #39: Inventory/Accounting P0 Draft، Head 14aaedeab881952d8cac00a2ea3d18025c73af9d، CI SUCCESS.
- فرع UI مستقل ولا يلمس Inventory/Accounting.




UPDATE 2026-07-16
Current HEAD: d2ecf84f32a217f95b884c8ee1fdc9ecd5988bdf
W2a وW2b مكتملتان محليًا. لا Push ولا PR.


W2a — Core AppShell + RTL alignment
- Start HEAD: 30049940e78afc9aa8b2b7d88b695091e060df8f
- Core commit: 5cfcb8b4b8d66e86f6af7bed192fad5e36b5b168
- Final W2a HEAD: bc9a24ed321b7a0f20b367b1d7b7586b5a25c8a0
- AppShell تحول إلى three-zone grid بأعمدة جانبية متساوية.
- اللوجو انحرافه 0px عن المركز.
- أدوات التشغيل والبحث أقصى اليمين.
- User/Shift/Theme/Logout أقصى اليسار.
- Dashboard icon بدل Home، وإزالة اسم المطعم النصي.
- Horizontal overflow: 0.
- Admin tests: 11/11 PASS.
- Build، color contract، diff-check: PASS.
- JavaScript errors: 0.
- Asset 404s القديمة تبقى pre-existing fixture/data debt.


W2b — Logo upload/configuration
- Start HEAD: bc9a24ed321b7a0f20b367b1d7b7586b5a25c8a0
- Final HEAD: d2ecf84f32a217f95b884c8ee1fdc9ecd5988bdf
- Migration غير مطلوبة؛ logo_url موجود بالفعل في settings.
- Commits: 42065c6 وd2ecf84.
- رفع صور الشعار مع قيود النوع والحجم، صلاحية settings.manage، وعزل حسب الحساب.
- Preview قبل الحفظ، حالات loading/error، إزالة الشعار، وfallback آمن داخل AppShell.
- اختبارات النطاق: 7/7 PASS.
- Admin tests: 18/18 PASS.
- Admin build، color contract، git diff --check: PASS.
- لا raw colors أو important declarations جديدة.
- Visual QA: 27 صورة، Light/Dark على المقاسات الأربعة.
- Center offset، horizontal overflow، drawer right-gap: 0.
- JavaScript errors: 0.


Inherited repository failures
- API typecheck ما زال غير أخضر بسبب ثلاثة أخطاء TypeScript سابقة خارج نطاق W2b.
- Full API suite ما زالت 131/132 بسبب اختبار صلاحيات قديم خارج نطاق W2b.
- لا تعتبر هذه البوابات PASS.


Current W2 order
- W2.0 Responsive stabilization: COMPLETE.
- W2a Core AppShell + RTL alignment: COMPLETE.
- W2b Logo upload/configuration: COMPLETE.
- W2c+d Combined wave: NEXT.
- W4: DEFERRED حتى إغلاق W2.


W2c+d — الموجة التالية مجمعة مع Commitين مستقلين
1. fix(pos): rebalance delivery details layout
2. fix(overlays): keep order details below the app shell


W2c scope
- إصلاح نسب قسم بيانات التوصيل في POS.
- توحيد الحقول والأزرار ومنع قص النصوص.
- RTL صحيح وresponsive stacking وhorizontal overflow = 0.
- لا تعديل validation أو business logic أو API.


W2d scope
- Order Details modal يبدأ أسفل AppShell وفق overlay contract.
- لا margin أو z-index عشوائي.
- modal body هو منطقة التمرير الأساسية.
- header/footer قابلان للوصول.
- منع تمرير الخلفية أثناء فتح المودال.
- focus وEscape وسلوك الإغلاق محفوظ.
- لا double scrollbars أو horizontal overflow.


بوابات W2c+d
- Reproduction قبل التعديل.
- Light/Dark على 1920x1080 و1366x768 و728x912 و560x900.
- Admin tests/build/color contract/git diff --check.
- CSS import order محفوظ.
- لا raw colors أو important declarations جديدة.
- JavaScript errors = 0.
- selective staging فقط.
- لا Push ولا PR ولا بدء W4.


مرجع التنفيذ المستمر
- Audit P0–P3 هو المرجع الحاكم للتشخيص والتنفيذ والتحقق.
- Skills UI المثبتة تستخدم Advisory فقط.
- emil-design-eng وapple-design استُخدما استشاريًا.
- UI/UX Pro Max غير مثبت محليًا؛ لا يوقف العمل ولا يتم تثبيته تلقائيًا.
- W4 backlog يظل مؤجلًا كما هو: typography readability، KDS minimal redesign، kitchen pause/order hold، scrollbar stability، sticky Save/Undo، source tags، تقليل الأبيض، وcustomers server-side sorting.




UPDATE 2026-07-17
W4a إلى W4d مكتملة محليًا.
UI branch: fix/ui-feedback-w4
Final HEAD: 4a6e489
Working tree clean حسب التقرير.
لا Push ولا PR.
W4 closure evidence:
- KDS metadata: التوقيت بدل ورد، label 13px، الوقت 14px، رقم الأصناف 16px، ونفس حساب qty-sum محفوظ.
- Minimum operational font size أصبح 13px داخل النطاق.
- Scrollbar layout delta 0، double scroll 0، وSticky actions ثابتة تحت AppShell.
- uif-no-scroll سليم في جلسة نظيفة بلا HMR.
- Permissions تستخدم semantic secondary surface.
- KDS borders 18 إلى 9، surfaces 20 إلى 11، status badge داخل الكارت 1 إلى 0.
- Admin tests 19/19، build PASS، colors PASS، diff check PASS، لا important أو raw colors جديدة، console errors 0.
- Skills المستخدمة Advisory: emil-design-eng وapple-design. UI/UX Pro Max غير مثبت.


Inventory and Accounting verification:
- Branch fix/inventory-accounting-p0-integrity at 14aaedeab881952d8cac00a2ea3d18025c73af9d.
- Isolated database ykms_inventory_accounting_review.
- Migrations through 026 and seed passed.
- Inventory idempotency passed with one movement on replay.
- Verified on hand 16 and stock value 2880.
- Accounting journals balanced and trial balance was 8100.00 on both sides.
- Reversal idempotency and period lock guard passed.
- Fresh tests: typecheck passed، P0 integrity 21/21، focused 32/32، full API 207/207، contracts 13/13، migrations passed.
- No new commits on the Inventory and Accounting branch.
- ADR-004 remains Proposed and requires accountant approval.


Remaining gates:
- W4e Kitchen Pause and Order Hold require an independent implementation branch with state machine، permissions، audit، branch scope، API، migration، realtime، tests and RTL QA.
- W4f Customers must be implemented above P3 because customer cursor pagination already exists there.
- Product image 404s remain fixture and data debt.




UPDATE 2026-07-17: Main QA and Inventory UI gap review completed. Full details are recorded in the new source package.


GitHub at save time: main 58d60152d4b0eba43a0a4c3a521b9a2a44f16f7a; open PRs none; no deployment. PR #39 merged Inventory/Accounting backend and P0 integrity. PR #41 merged the UI and operational consolidation. Accounting remains Pilot and ADR-004 remains Proposed.


Frontend discovery: current main has no Inventory page, no /inventory route and no Inventory navigation entry. It also has no operational Accounting admin UI. Backend foundations are present, but the operational frontend modules remain incomplete.


Recovered old UI reference: local branch feature/inventory-accounting at commit 5e514c44c96b9b183afdf16ace5103b4b1207943. It added Inventory.tsx and modified App.tsx and AppShell.tsx. A rescue copy was extracted for compatibility review against the current contracts.


Compatibility review: the old UI uses legacy payloads. Current units require symbol; items use base_unit_id; movements require location_id, quantity, source_type and idempotency_key; levels return quantity_on_hand and stock_value per location; waste, transfers and stock counts use dedicated endpoints; view and manage permissions must be separated.


QA database status: the isolated clone remains at migrations 001-019. Migration 021 fails because a partial legacy inventory table already exists. The original database remains untouched. Preserved inventory totals are quantity 21, value 3630 and weighted average about 172.8571 for the existing stocked item; the second item has zero balance.


Next scope A: adapt the recovered Inventory UI to the current location-based APIs, permissions and tests. Next scope B: create a formal legacy 019-to-latest migration path that preserves data and verifies both fresh and legacy database fixtures.


Durable lessons: backend completion is not commercial module completion; customer upgrade paths must be tested in addition to fresh migrations; local branches and worktrees must be audited for unique work before cleanup; mixed legacy commits should be adapted selectively to current contracts.


Readiness at save time: backend foundations present; Inventory frontend missing; Accounting frontend missing; legacy upgrade failing; Accounting approval pending; Paid Pilot Ready blocked; no deployment.


AUTHORITATIVE CONSOLIDATION REPORT RECEIVED — 2026-07-17
PR #41 was merged with head 257cb4ce099e43692f3c1c8dd6e65aa051016b2e and merge commit 58d60152d4b0eba43a0a4c3a521b9a2a44f16f7a. CI run 29563238245 completed successfully on the exact PR head.
Final consolidated validation: contracts 13/13; API TypeScript zero errors; full API 239/239 across 33 files; Admin 25/25; Admin build PASS; color contract PASS; diff check PASS; no new skipped tests. Fresh isolated database applied migrations 001-027, second latest was a no-op, and migration 027 down/up passed. Local migration testing used Node 24.18 because Node 22 was unavailable; CI remained the Node-contract authority.
Cleanup was completed only after ancestry, clean-worktree and archive checks. Remote integration, P3, inventory-accounting-v2 and P0-integrity branches were removed after merge verification. Graphify was archived as tag archive/graphify-integration-2026-07-17 before branch deletion. Several merged worktrees and local branches were removed; the inventory-accounting-v2, inventory-accounting-review and P2 worktrees remained outside the cleanup candidate list.
This report does not close the Inventory Admin UI gap. PR #41 consolidated W2/W4 UI, Customers and Kitchen controls, while current main still lacks the operational Inventory and Accounting admin pages. The old minimal Inventory UI remains reference-only at local commit 5e514c44c96b9b183afdf16ace5103b4b1207943.
No deployment. Accounting remains Pilot. Legacy 019-to-latest adoption remains a separate blocker.
