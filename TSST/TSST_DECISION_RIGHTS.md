# TSST Decision Rights

Version 1.1 | Effective 2026-10-05 (v1.0: 2026-09-22)
Owner / approver: المستخدم. Interface: TSST Lead.
المصدر: موافقات المستخدم على A/B/C بتاريخ 2026-09-21، وعلى escalation وscope handling والتوثيق بتاريخ 2026-09-22. هذه صلاحيات مؤكدة؛ حدود الميزانية والوقت غير المحددة ليست تفويضًا مفتوحًا.

| Category | Actions | Scope / limits | Escalation |
| --- | --- | --- | --- |
| A — Execute without additional approval | توزيع التكليفات، البحث، إعداد المسودات، طلب التعديلات، تنظيم الملفات والمراجعات | بعد اعتماد خطة العمل؛ ضمن نطاقها وحدودها فقط. لا صرف ولا نشر ولا تواصل خارجي ضمن هذا التفويض | نقص جوهري في المدخلات، قرار محجوز أو انحراف عن الخطة |
| A — Continue unaffected work | مواصلة الأجزاء المستقلة أثناء انتظار قرار تعارض | داخل الخطة المعتمدة؛ الجزء المتأثر واعتمادياته ينتظران القرار | اكتشاف أن الجزء غير مستقل أو أن مواصلته تفرض قرارًا على المستخدم |
| B — Recommend and wait | خطة العمل وتوزيعها قبل التنفيذ، اعتماد الاستراتيجية والاتجاه البصري والتسليم النهائي | عرض نتيجة/خطة قابلة للمراجعة ثم انتظار موافقة المستخدم | قبل التنفيذ/الاعتماد المحجوز |
| B — Recommend and wait | إدخال طلب إضافي أو تقليل نطاق التسليم | بيان أثر الوقت والنطاق والأولوية؛ الحفاظ على الجودة وتوثيق المؤجل | قبل تغيير الخطة المتفق عليها |
| C — Never without explicit instruction | النشر، تشغيل الإعلانات، الصرف، التواصل مع العملاء، تعديل حساباتهم | تكليف صريح بالفعل المحدد والنطاق؛ قبول خطة عامة أو مخرج لا يكفي | قبل أي فعل من هذه الأفعال |

## Standing limits

- لا حملة ولا agent evaluation ضمن هذا الطلب. إنشاء baseline لا يرفع NOT_READY ولا يستبدل practical validation.
- لا صلاحية مالية تلقائية؛ أي تكليف بالصرف يحتاج مبلغًا/حدًا ونطاقًا واضحين. لا تخمّن حدودًا زمنية أو مالية.
- Specialist acceptance بواسطة Lead قبول داخلي؛ لا يستبدل اعتماد المستخدم للاستراتيجية/الاتجاه/التسليم ولا يجيز external execution.
- عند التعارض: اعرض المشكلة والأدلة والبدائل والآثار والتوصية، وسجل القرار. أكمل المستقل فقط.
- لا تفويض ذاتي من agent لآخر خارج صلاحيات المستخدم. الحقوق غير المغطاة OPEN / UNCONFIRMED.
- حفظ الموافقة: نص/مرجع رسالة المستخدم، التاريخ، النسخة المعتمدة والنطاق في decision log. لا تعتبر الصمت أو تغيير رقم الملف موافقة.
- تعديل هذه الحقوق يتطلب تعليمات المستخدم، مع تسجيل السابق والجديد والسبب والتاريخ. لا تعِد طلب موافقة منحها المستخدم بالفعل داخل نفس النطاق.

<!-- TSST-CONTEXT-OS-V0.6-RC1-BEGIN -->

## Context OS tool-action mapping — controlled evaluation (2026-10-04)

This mapping applies the existing A/B/C rights to Context OS tool routing; it grants no new authority.

| Context OS action class | Decision-right mapping |
| --- | --- |
| `READ` | Category A only within an approved work plan/scope and existing data-access rights. |
| `DRAFT` | Category A for local/reviewable analysis and artifacts within an approved plan; it does not authorize publication or external communication. |
| `MUTATE_INTERNAL` | Allowed only when the specific internal change is already inside the approved plan and does not cross an existing reserved boundary. Otherwise follow the existing B/C requirement. Customer/account mutation remains governed by the existing reserved rights. |
| `EXTERNAL_ACTION` | Category C. Publication, spend, deployment/external account mutation, customer contact or comparable external effect requires explicit applicable user instruction. |
| `SECRET_ACCESS` | No additional right is created. Use only an approved secure channel/capability and never write secret values to Real Memory, Context OS indexes, handoffs or checkpoints. |

A higher model tier cannot substitute for missing authority, access or evidence.
<!-- TSST-CONTEXT-OS-V0.6-RC1-END -->

## Runtime and tool rights — Operating Baseline v0.1 (2026-10-05)

Approved by the user in chat 2026-10-05 (TSST-001A intake, `TSST/onboarding/INTAKE_TSST-001A.md`). Adds rows; Categories A/B/C above and the standing limits are unchanged.

| Action | Lead alone (A) | Needs user approval (B) | Escalation |
| --- | --- | --- | --- |
| Git / GitHub | commit, push feature branches, open PRs | merge to `master` | CI red after one fix attempt |
| Real Memory | checkpoints, status, pointers | decisions, brand facts, change sets (RM-CS-*) | conflicting sources |
| Runtime bus / model spend | queue FAST/WORK/CODE tasks on their tier models (`TSST/bus/runtimes.yaml`) | top-cost models (gpt-6-astra, Opus in Antigravity), image/video generation | task `escalated` → reroute once to another runtime/tier, then user |
| External tools (Drive, browser, GitHub, Shopify, Apps Script, …) | read, research, inspect | any write outside the repo (share, trash, product/account edit, form submit) | — |
| Acceptance | accept after an independent review by a runtime other than the producer (code, creative, strategy) | final client-facing delivery | reviewer and producer disagree |
