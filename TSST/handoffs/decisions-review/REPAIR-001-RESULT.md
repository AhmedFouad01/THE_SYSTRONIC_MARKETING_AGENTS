# إصلاح طريقة شغل TSST — REPAIR-001

2026-10-12، Africa/Cairo. النطاق: طلب أحمد الصريح لتنفيذ إصلاحات REVIEW-001 ومراجعة تعقيد العمل الأخير عبر البيئات. التنفيذ في الريبو الأصلية على G: وفرع `tsst-core/owner-rules`. حفظ الإصلاحات ثم العودة إلى `vill-studio` هو ترتيب أحمد الصريح. لا دمج master أو نشر أو صرف أو تعديل جاهزية.

## ما اتصلح

- مرجع عملي واحد: `context/workflow.md`؛ خطة واحدة في التكليف الحالي، أقل سياق لازم، استكمال نفس الوكيل، نتيجة ونقطة استكمال واحدة. boot وAGENTS وLead والـ adapters والـ router تشير إليه. تصحيح Motion، أسماء tiers، تعريف Lead المباشر وصلاحيات Git.
- `preflight.py`: التحقق من الريبو الأصلية ومسار Git الفعلي والبرانش والنطاق ومرجع الموافقة وحقول الخطة السبعة والمهارات وعقد الوكيل. لا إعادة طلب موافقة داخل إصلاح محدد مأذون به. الهاش هو تعريف مصدر، وليس إثبات فهم أو استخدام مهارة أو هوية أو تسجيل native.
- hook: رفض الخطط الناقصة وJSON/الفهرس التالف وأخطاء تحميل المدقق؛ TEAM lead محجوز لليد في الجلسة الرئيسية، فلا يخرج المختص من تخصصه بهذه الحيلة. لا ادعاء بأن hook يعترض كل أوامر الكتابة.
- bus/scopes: توحيد شرطات Windows، منع traversal/absolute/device paths وحيلة بادئة اسم ملف مجاور، رفض توسيع نطاق glob لا يمكن إثبات احتوائه. السجل التاريخي لم يُعد كتابته.
- friction: استعادة ثمانية سجلات كان الفاحص يتجاهلها. 67 صفًا نشطًا في working tree (65 في commit؛ ملاحظتا studio غير المملوكتين مستبعدتان) والنصوص الأصلية محفوظة حرفيًا في تاريخ fenced؛ التكرار من نفس المهمة ليس دليلًا مستقلًا. مرشح Git يجمع أربع مهام، بلا ترقية درس تلقائية.
- delivery: `DELIVERY.json` مصدر الحالة الوحيد؛ تعليقات `TSST_JOB_SYNC` مشتقة تربط الحالة وهوية المهمة وSHA256 في project/status/portfolio. normal sync يحدثها، والفاحص يرفض الغياب والتكرار والتعارض والتقادم والتلف. `STRUCTURE_PASS` القديم يعلن `SEMANTIC_SYNC_UNVERIFIED`. النصوص والصور والموافقة الفعلية تحتاج مراجعتها الخاصة. لا مزامنة حية للبراندات في هذا الإصلاح.

## مراجعة الفترة 6–12 أكتوبر

الأدلة المحدودة من الريبو وأربع محادثات حديثة والسجل التاريخي TSD-016 تشير إلى تكرار السياق والتكليف وإعادة تشغيل وكلاء وإنشاء طبقات متشابهة للتحقق. رقم نحو17M cache-read يخص حالة تاريخية، وليس متوسط الاستخدام الحالي. سجل Claude الكامل وغيره غير متاح؛ لم نستنتج نسبة توفير. خطوات cleanup عالية المخاطرة لها فحوص مبررة، ولا تُختصر لمجرد عددها.

الحل المطبق: تكليف واحد يشار إليه بدل نسخه؛ الموافقة الحالية تسري على نطاقها؛ الـbus للتنسيق الحقيقي وليس لإثبات هوية Lead؛ بدء لوحة اليوم فقط بطلبها؛ checkpoint حالي واحد بدل إعادة السجلات؛ adapters للقدرات فقط. السطح اليدوي بلا shell يجهز التكليف، والـhost القادر على الكتابة ينفذ نفس الفحص قبل التطبيق. الإجابة القرائية السريعة لا تحتاج ملف JSON جديدًا أو mutation gate.

وجدنا سببًا عمليًا إضافيًا: شاتان يستخدمان نفس checkout. سجل Git أثبت التحويل 04:06:29 إلى فرع TSST ثم04:10:09 إلى vill-studio؛ قراءة «اعرض حالة VILL-STUDIO» أكدت أن التحويل الثاني جاء بطلب أحمد، وليس تصرفًا غير مأذون. تغيير الفرع عام لكل الشاتات في المجلد؛ أُضيفت قاعدة تنسيق الترتيب وإعادة التحقق قبل الكتابة/commit. الفاحص أوقف خطوة DEV على البرانش المختلف ثم نجح بعد التصحيح.

## دليل التحقق

- RED قبل الإصلاح: سبع assertions فاشلة في خمس حالات enforcement؛ خمس friction و11 delivery assertions كشفت العيوب القديمة. مراجعة مستقلة كشفت TEAMlead وglob، ثم أضيفت regressions. غياب/تلف module الخاص بالـhook خرج1 قبل الإصلاح ثم2 بعده.
- GREEN: preflight21 tests؛ enforcement13 tests؛ delivery21 tests دون الاعتماد على hub WIP؛ friction24 assertions. complete isolated bus protocol suite ناجح؛ affected guard/index/runtime routing/comment checks ناجحة. generated contracts الاثنا عشر متسقة مع المصدر (`gen_runtime_agents.py --check`).
- استُبعدت وظائف الاختبارات القديمة التي تتعمد تغيير الفهرس الحي أو tamper/prune للـgenerated files؛ الاختبارات المتأثرة المعزولة والتحقق من الاتساق استُخدمت بدلًا منها. لا إعادة للتقييمات التاريخية.
- 13 ملف WIP محميًا تطابقت SHA256 مع baseline. renderer وbrand assets/status/pointers وportfolio لم تُعدل ضمن الإصلاح. hub/navigation WIP القديم منفصل عن commit الإصلاح.
- whole-tree `git diff --check` أظهر whitespace/CRLF في brand WIP المحمي؛ لم يُعاد تنسيقه. بوابة الحفظ تستخدم staged-only check لتغييرات الإصلاح.
- quick_validate الخاص بـskill-creator لم يعمل: PyYAML غير موجود في Python الافتراضي أو المرفق. لم نثبت dependency. الـfrontmatter البسيط والاسم والوصف والروابط تمت مراجعتها؛ هذا ليس practical skill validation.

## حدود الإغلاق وما بعده

هذه مراجعة هندسية محدودة للكود وfixtures، ولا تثبت أن native agents محملة تلقائيًا في كل بيئة أو أن دورة Claude كاملة منفذة. preflight لا يعترض أوامر shell اللاحقة ولا يصادق على المرجع البشري. المسارات المعلنة ليست OS sandbox. المراجعة المستقلة عبر Claude خاضعة لموافقة إرسال الملفات المحددة؛ إن لم تنفذ تبقى acceptance عبر runtime آخر غير متحققة.

الـfeature commit لا يصل تلقائيًا إلى master أو checkout آخر. عودة vill-studio تعيد نسخته المسجلة؛ لا يصح وصفه بأنه تبنى الإصلاحات قبل الدمج. دمج master يحتاج موافقة منفصلة حسب `TSST_DECISION_RIGHTS.md`، ثم توزيع التغيير للفروع النشطة في جولة محددة. jobs القديمة ستحتاج sync مأذونًا لنيل strict PASS؛ PASS التاريخي لا يتحول إلى اعتماد جديد.

Next: راجع commit الإصلاح، أكمل المراجعة العابرة للبيئات، ثم ادمجه بإذن أحمد. do_not_repeat: لا تعاد أعمال البراندات أو التقييمات أو onboarding ولا تمس WIP غير المملوك.

Skills used: Lead TSST-LEAD-SK-029 / TSST-CTX-SK-005؛ DEV010/011/015؛ skill-creator لتبسيط router wrapper؛ reader utility بلا مهارات. Skills/readiness كما هي UNVALIDATED/NOT_READY. skill_friction: none for routed TSST skills. External skill-creator tooling limit: missing PyYAML, recorded above; no validator PASS claimed.
