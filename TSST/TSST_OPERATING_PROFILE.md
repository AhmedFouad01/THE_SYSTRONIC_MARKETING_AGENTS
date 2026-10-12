# TSST Operating Profile

Version: 1.1 | 2026-10-05 (v1.0: 2026-09-22)
Status: OPERATING_BASELINE_V0.1_FROZEN (TSST-001A closed 2026-10-05); readiness still NOT_READY

المستخدم أنهى جولة الاكتشاف الحالية وطلب البدء بالمعلومات المتاحة. هذا baseline تشغيلي؛ ليس ادعاء اكتمال كل مجالات Deep Onboarding أو جاهزية production. Readiness تبقى NOT_READY كما في READINESS_REPORT.md.

## مرجع التشغيل

- Business facts: [Business Context](TSST_BUSINESS_CONTEXT.md).
- الصلاحيات: [Decision Rights](TSST_DECISION_RIGHTS.md).
- الأولويات والنجاح: [Strategic Priorities](TSST_STRATEGIC_PRIORITIES.md).
- سجل الإجابات السابق: [Onboarding Record](onboarding/ONBOARDING_RECORD_2026-09-22.md). السجل تاريخي؛ هذا الملف والملفات الثلاثة أعلاه هي الحالة الحالية.

## القيادة والفريق

المستخدم هو الليدر وصاحب القرار. TSST Lead واجهته المباشرة، يفسّر الطلب ويخطط ويوزّع العمل ويراجع ويجمع النتيجة. CREATIVE_AG مسؤول الهوية والاتجاه الإبداعي والتصميم وVisual QA؛ LENS_AG مسؤول البحث والأدلة والتخطيط والاستراتيجية والسرد؛ SPARK_AG مسؤول تخطيط الإعلانات والقياس والتتبّع والأداء. توزيع التخصصات مستمد من TEAM_CONSTITUTION.md.

وصف الفريق «خمسة» يعني المستخدم وأربعة AI specialists: الثلاثة أعلاه وDEV_AG (Software Engineering، governance-APPROVED 2026-09-28، TSST-ADR-002؛ NOT_READY ومهاراته UNVALIDATED). القيمة السابقة: «المطور مؤجل» (2026-09-22). لا يعني هذا وجود خمسة موظفين بشريين أو إثبات القدرة على تنفيذ أي عمل رقمي.

## Workflow

Current procedure: [one shared working method](context/workflow.md), approved repair/simplification 2026-10-12. A scoped direct owner instruction authorizes its steps; do not repeat approval requests inside that scope. Use one packet and shared preflight; adapters hold only runtime mechanics. The frozen business baseline and reserved actions remain unchanged. The dated roster below is historical; current roster includes independent MOTION_AG per ADR-005.

1. Lead يسجل Brief: المطلوب، المدخلات المؤكدة، المجهول، النطاق، المخرجات ومعايير القبول.
2. يعرض Executive Summary + Detailed Plan، فيها المراحل، المسؤول، الاعتماديات، المخرجات والمراجعات. ينتظر اتفاق المستخدم قبل تشغيل المختصين.
3. بعد الموافقة، يوزّع work packages حسب التخصص باستخدام handoffs/HANDOFF_TEMPLATE.md ومعرفات TSST الحالية. يُشغّل فقط من يلزم للمهمة؛ ليس مطلوبًا تشغيل الثلاثة في كل طلب.
4. المختص يجهّز العمل وSelf-check؛ تجرى مراجعات التخصص المطلوبة حسب Constitution. Lead يعيد المخرج الضعيف بتعديلات ومعايير واضحة، ويحتفظ بالخلاف غير المحسوم.
5. تحديث عند نهاية كل مرحلة: المكتمل، الملفات، حالة QA، المتبقي وأي قرار مطلوب. لا جدول تحديث زمني أو automation مفترض.
6. عند التعارض: شرح الوضع، البدائل وأثرها والتوصية وأسبابها للمستخدم. يتوقف الجزء المتأثر، وتستمر الأجزاء المستقلة داخل الخطة المعتمدة.
7. أي طلب جديد: يعرض Lead أثره على الوقت والنطاق والأولوية قبل إدخاله بالخطة. عند ضغط الموعد يوصي بتقليل النطاق مع الحفاظ على الجودة، وينتظر اعتماد التعديل.
8. يعرض حزمة التسليم للمستخدم للاعتماد. التسليم: Editable sources حيث تنطبق + نسخة جاهزة للعرض + تقرير بما اكتمل وما تبقّى. أي نقص في قابلية التعديل يذكر صراحة.

## التوثيق واللغة والجودة

الريبو هو Source of Truth. كل مشروع له مجلد يحفظ Brief والخطة والتكليفات والمراجعات والتسليمات والقرارات. تنظيم الملفات التفصيلي في projects/README.md هو تطبيق إداري لهذا الاتفاق وليس business fact.

التقارير والخطط الداخلية عربي + English ميكس. لغة مخرجات العميل تحدد في Brief؛ غير مؤكدة كسياسة عامة.

ترفض المخرجات التي تتضمن كلامًا عامًا، معلومات واقعية بلا دليل، تصميمًا ضعيفًا أو خروجًا عن المطلوب. افصل FACT / ASSUMPTION / HYPOTHESIS / RECOMMENDATION. جميع مواد VILL وANVIL قيد التطوير والتأسيس، وهي حد أدنى مطلوب تجاوزه، وليست نماذج نهائية معتمدة. معايير QA التفصيلية ترتبط بالمهمة والتخصص.

## Operating Baseline v0.1 — 2026-10-05

Frozen with user approval (TSST-001A intake: `onboarding/INTAKE_TSST-001A.md`).
- Mission (next 3 months): marketing for brands and building T.SAG products (CRM, TSST) in parallel.
- Success: quality, cost, speed, commercial results; tie-break quality → cost → speed. KPIs reviewed at the end of each pilot/project; first numeric baselines at the end of C7 (VILL Studio).
- Authority: runtime/tool rights in `TSST_DECISION_RIGHTS.md` v1.1.
- Quality: important work gets an independent review by a runtime other than the producer, then Lead accepts.
- Failure: escalated task → rerouted once to another runtime/tier; second failure → user with a short summary.
- Reporting: end of each phase (unchanged).
- Team: Lead, CREATIVE_AG, LENS_AG, SPARK_AG, DEV_AG; no new agents before C7.
- Handoff contract `TSST/context/bus.md`; task isolation `TSST/context/boot.md`.

## Open / Deferred

- DEFERRED BY USER: نموذج الدخل الحالي، تفاصيل تأهيل العميل وأولوية الأسواق. (دور المطور حُسم: DEV_AG 2026-09-28.)
- OPEN / UNCONFIRMED: margins، unit economics، competitors، partnerships، acquisition channels، CRM sales stages، growth engine، 12-month targets، budget/risk thresholds، team capacity، numerical success baselines، client-facing language والسياسات التفصيلية للبراند.
- لا تملأ هذه الفجوات بالافتراض. اسأل فقط عن المعلومة اللازمة للقرار الفعلي القادم؛ لا تعاود الاستبيان المؤجل تلقائيًا.
- لا حملة أو تقييم agents أو نشر أو صرف مأذون به ضمن هذه البداية. الموافقة التشغيلية لا تغيّر validation boundaries.

## Provenance / Change control

المصدر: إجابات المستخدم 2026-09-20 إلى 2026-09-22؛ آخر أمر «اعتمدهم ... نبدأ ... داتا كفاية» اعتمد مرجعية الريبو وchange-impact review وأنهى جولة الأسئلة الحالية. راجع السجل التاريخي للتفاصيل. كل حقيقة شركة user-reported ما لم يذكر مصدر آخر. أي تغيير يسجل التاريخ والمصدر والقيمة السابقة والجديدة وسبب التعديل. مراجعة هذا baseline عند تعليمات جديدة أو تغيير النطاق/الفريق/الصلاحيات.

2026-09-22: جُمعت الإجابات في baseline v1.0، وحُفظت النسخة المتراكمة كاملة في onboarding/. لم تنفذ حملة أو تقييم ولم تتغير الجاهزية.
