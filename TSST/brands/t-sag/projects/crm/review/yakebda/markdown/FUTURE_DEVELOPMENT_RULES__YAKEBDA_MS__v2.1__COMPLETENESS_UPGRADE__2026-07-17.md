YAKEBDA MS — Future Development Rules v2.0
قواعد التطوير المستقبلية المستخلصة من مراجعات P0–P3


التاريخ: 2026-07-16
Project Key: YAKEBDA_MS
الحالة: Canonical Engineering Policy
النطاق: كل Feature، Module، Migration، API، UI، Integration، Refactor، أو Production Change لاحق.


==================================================
1. الغرض والسلطة
==================================================


هذا المستند يحدّث شيت التوجيه البرمجي السابق ويحوّل نتائج مراجعات P0 وP1 وP2 وP3 إلى قواعد تطوير دائمة.


الترتيب عند التعارض:
1. GitHub live state لحالة الكود والفروع والـPR والـCI.
2. أحدث Project Work Instructions.
3. هذا المستند لقواعد التنفيذ والهندسة المستقبلية.
4. الـADRs المقبولة لعقود الدومين.
5. الوثائق التاريخية لا تتغلب على التنفيذ الحالي.


ممنوع اعتبار نجاح محلي أو نتيجة أداة AI دليلًا كافيًا على الدمج أو الجاهزية للإنتاج.


==================================================
2. تصنيف المخاطر المستمر — P0 إلى P3
==================================================


P0 — Integrity / Security / Financial Critical
يشمل: تجاوز Tenant أو Account، تجاوز صلاحيات، فساد أو فقد بيانات، دفع زائد أو مكرر، قيد مالي غير متوازن، تسريب Credentials، ضعف Authentication، تعديل سجل مالي منشور، أو Migration مدمرة.
الحكم: يوقف الدمج والإصدار وكل Feature أخرى حتى الإصلاح والتحقق.


P1 — Operational Reliability
يشمل: طباعة تضيع أو تتكرر، Jobs عالقة، Retry غير محدود، Refund أو Cancellation غير آمن، Shift totals غير دقيقة، Race conditions، أو عملية تشغيلية تنجح جزئيًا وتترك النظام في حالة غير قابلة للاستعادة.
الحكم: يمنع الإصدار. يجب توفير State machine، Idempotency، Retry/Recovery، وAudit.


P2 — Maintainability / UI Safety / Testability
يشمل: CSS متصارع، !important debt، تكرار Contracts، Component ضخم، Coupling يمنع الاختبار، نقص Frontend tests، RTL أو Accessibility regression، أو تغيير بصري واسع بلا Baseline.
الحكم: لا يُعالج بإضافة طبقة مؤقتة جديدة. يلزم إصلاح المصدر المشترك، اختبارات، وVisual baseline.


P3 — Platform Hardening / Scale / Observability / Documentation Truth
يشمل: غياب Request correlation، Logs غير منظمة، Health checks سطحية، Lists غير قابلة للتوسع، Offset pagination الخطرة، Node/CI drift، DTO drift، أو Docs تخالف الكود.
الحكم: مطلوب قبل Production readiness والتوسع التشغيلي.


أي Finding جديدة يجب أن تُصنف P0/P1/P2/P3 قبل تنفيذها.


==================================================
3. Revalidation Gate قبل أي تعديل
==================================================


كل Bug أو Audit finding أو طلب Refactor يمر أولًا بالخطوات التالية:
1. إعادة إنتاج Focused test أو دليل واضح.
2. فحص الكود الحالي والـmigrations والـtests والـconsumers.
3. التصنيف: Confirmed / Already Fixed / Partially Fixed / Invalid.
4. تحديد Root cause والملفات المتأثرة والعقد الذي يجب الحفاظ عليه.
5. تنفيذ Confirmed وPartially Fixed فقط.


ممنوع تنفيذ Brief قديم بالحرف إذا كان الكود الحالي تغير.
ممنوع إنشاء Lock أو Permission أو Migration ثانية قبل إثبات أن الموجودة غير كافية.


==================================================
4. عزل الفروع والـWorktrees
==================================================


- كل Module أو Audit phase كبيرة في Branch وWorktree منفصلة.
- لا يتم خلط UI cleanup مع Business feature أو Accounting أو Migration غير مرتبطة.
- قبل التنفيذ: تحقق من branch، exact HEAD، working tree، base ancestry.
- Staging انتقائي فقط. ممنوع git add . أو git add -A في الأعمال الحساسة.
- ممنوع reset --hard، clean، force push، أو rebase تلقائي دون موافقة صريحة.
- لا يتم نقل WIP قديم بـcherry-pick أعمى؛ تُراجع migrations والعقود أولًا.
- كل PR تبقى Draft حتى اكتمال الاختبارات والمراجعة المطلوبة.
- لا Merge أو Mark Ready أو Auto-merge بدون موافقة المستخدم وExact SHA verification.


==================================================
5. قواعد API والأمان والعزل
==================================================


كل Endpoint جديد أو متغير يجب أن يثبت:
- Authentication واضح.
- Permission صريحة في API، وليس في الواجهة فقط.
- account_id / tenant scope إلزامي.
- branch scope حتمي ومختبر.
- المستخدم لا يرسل Scope موثوقًا عبر cursor أو body أو headers عادية.
- Cross-account access مرفوض دائمًا.
- Cross-branch behavior يتبع Contract موثق، وليس توقع Test قديم.
- العمليات الحساسة تسجل Audit منفصلًا عن Application logs.
- Responses لا تكشف stack traces أو أسرارًا أو Internal IDs بلا حاجة.


ممنوع توسيع صلاحية Role فقط لجعل Test خضراء.


==================================================
6. Authentication وSecrets
==================================================


- Rate limiting وattempt tracking يجب أن يعملوا عبر أكثر من Process ويستمروا بعد restart.
- PIN failures تُربط بالفرع وسياق IP/device؛ لا يُفترض أن PIN فاشلة تحدد مستخدمًا بعينه.
- Password/PIN/token/authorization/cookies/request bodies الحساسة لا تُسجل.
- لا Credentials في Seed output أو CI artifacts أو PR descriptions.
- JWT secrets وDB credentials وproduction config خارج Git.


==================================================
7. المال والمدفوعات والاسترداد
==================================================


- كل Money arithmetic يمر عبر helper موحد ودقة العملة المعتمدة.
- لا Float arithmetic عشوائية.
- Payment validation، order lock، net-paid calculation، insert، وAudit داخل Transaction واحدة.
- Print enqueue بعد Commit وبمسار recoverable.
- ممنوع overpayment، duplicate payment، zero/negative capture، أو payment على order غير صالح.
- Unpaid حالة طلب، وليست Payment row.
- Refund سجل immutable مرتبط بالدفعة الأصلية.
- Cancellation لطلب مدفوع تتطلب Refund صريح أولًا حسب العقد التشغيلي.
- السجلات المالية المنشورة لا تعدل ولا تحذف؛ التصحيح Reversal.
- القيد المحاسبي يجب أن يحقق Debit = Credit ويحتفظ بالمصدر والأبعاد.
- لا Best-effort journal بعد الدفع؛ المطلوب Financial Event Outbox durable وidempotent.
- Revenue/VAT/partial-payment/multi-tender/refund rules تُعتمد قبل Production.


==================================================
8. أرقام الطلبات والتزامن
==================================================


- Database هي السلطة النهائية لأرقام الطلبات.
- لا MAX+1 في التطبيق إذا كان Trigger/lock authoritative موجودًا.
- أي allocation أو claim أو completion حساس للتزامن يحتاج Concurrent tests حقيقية.
- اختبار النجاح الفردي لا يثبت سلامة التزامن.


==================================================
9. Jobs والطباعة والـBridge
==================================================


كل Job queue يجب أن تدعم:
- Atomic claim.
- attempt count.
- bounded retry/backoff.
- terminal dead state.
- stuck processing recovery.
- idempotent requeue.
- account/device scope.
- Audit للحالات الحساسة.


إضافة job type جديدة لا تُعتبر مدعومة لأن claim لا يفلتر type فقط؛ يجب فحص dispatch، payload decoding، retry، dead، requeue، وbridge contract end-to-end.


==================================================
10. Order lifecycle وInventory
==================================================


- كل طرق تغيير Status تُراجع، وليس Endpoint واحدًا.
- Inventory balance مشتق من append-only movements.
- Consumption يحتاج event durable، idempotency، branch/location، وreference للطلب.
- ممنوع failure صامت يترك Order completed بدون Consumption قابل للاستعادة.
- Negative stock policy قرار موثق ومختبر.
- Recipe version/snapshot أو semantics واضحة لإعادة المعالجة.
- Cancellation/refund بعد الاستهلاك يحتاج reversal movement.
- Unit conversion والrounding جزء من العقد.
- Inventory valuation تستقر قبل COGS والربحية.


==================================================
11. Migrations
==================================================


قبل إنشاء Migration:
- افحص القائمة الفعلية وحدد الرقم التالي المتاح.
- Migration names لا يعاد استخدامها بين الفروع.
- Schema truth داخل migrations وليس runtime patches.
- up() محددة وdown() تحذف فقط ما أضافته حيث يكون rollback عمليًا.
- لا تعديل Migration مدموجة إلا لسبب استثنائي موثق.
- Fresh migrate من 001 إلى latest إلزامي.
- migrate latest مرة ثانية يجب ألا يترك pending.
- down/up للmigration الجديدة مطلوب.
- لا تستخدم Production DB في التطوير أو الاختبار.
- كل Worktree ذات migration stack مختلف تستخدم Database منفصلة لتجنب corrupt migration directory.


==================================================
12. Pagination والقوائم الكبيرة
==================================================


- لا تحميل غير محدود ولا silent truncation.
- Keyset cursor opaque، versioned، endpoint/sort-bound.
- ترتيب حتمي مع unique ID tie-breaker.
- Scope والفلاتر تطبق قبل cursor predicate.
- limit bounded، واكتشاف has_more عبر limit + 1.
- لا COUNT(*) تلقائي لكل request.
- لا Offset للlists الكبيرة إلا بعقد مبرر.
- Consumers التي تحتاج كل البيانات تمر على كل الصفحات صراحة أو تستخدم lookup/export path مناسبًا.
- عدم وجود Snapshot isolation يُوثق كـsemantic risk.
- Indexes تُبنى على queries المثبتة، ولا يُدعى planner usage بدون EXPLAIN.


==================================================
13. Shared Contracts وTypeScript
==================================================


- API وAdmin يستخدمان Shared Zod contracts للـwire DTOs عالية الانحراف.
- Internal DB rows وtransaction models لا تتحول تلقائيًا إلى public contracts.
- Runtime validation عند boundaries عالية المخاطر، لا parse عشوائي لكل row.
- ممنوع any، as any، @ts-ignore، @ts-expect-error كحل سريع.
- لا Path alias يعمل في IDE فقط ويفشل Runtime.
- Shared packages بلا Express/Knex/React/environment imports إذا كانت browser-consumed.
- Wire formats لا تتغير ضمن Refactor إلا بعقد Versioned وموافقة.


==================================================
14. Observability وHealth
==================================================


- كل Request لها correlation ID محدود وآمن.
- Structured JSON logs مع redaction recursive.
- Business audit منفصل عن operational logs.
- Unexpected errors ترجع response آمنة مع request reference.
- /health/live لسلامة العملية.
- /health/ready يفحص dependencies بTimeout محدود.
- Production transport، rotation، retention، aggregation، alerting يجب تحديدها قبل Production.
- لا Logging للـrequest body افتراضيًا.


==================================================
15. Node وDependencies وCI
==================================================


- Node contract الحالي: >=22 <23 حتى قرار Version جديد موثق.
- CI وlocal declarations وDocker/deployment لا تتعارض.
- npm ci هو مسار التثبيت القابل للتكرار.
- لا تغيير package manager عرضيًا.
- Dependency جديدة تحتاج مبرر، license/security review، وعدم تكرار نسخة موجودة.
- Normal CI يجب أن تشمل: contracts، API typecheck، migrations، API tests، color contract، Admin tests، Admin build.
- Temporary workflows لا تصبح مسارًا دائمًا.
- CI PASS يجب أن تكون على Exact head SHA الحالي.


==================================================
16. قواعد UI/CSS/RTL
==================================================


- Arabic-first / RTL-first.
- theme.css هو semantic token/shared theme source.
- global-colors.css هو final color authority وآخر import.
- global-colors.css يستخدم variables semantic فقط؛ لا raw HEX/RGB/HSL.
- Screen CSS مسؤول عن layout/geometry.
- المشكلات النظامية تُصلح في shared layer، لا شاشة بشاشة.
- لا طبقات CSS جديدة للهروب من legacy debt.
- لا !important جديد إلا استثناء موثق ومختبر.
- Logical CSS properties مفضلة؛ الاستثناءات الاتجاهية توثق.
- لا تغيير Product Grid أو KDS workflow أو POS geometry المقبولة دون طلب صريح.
- كل تغيير بصري واسع يبدأ Before baseline وينتهي After matrix.
- المراجعة تشمل Light/Dark، 1920×1080، 1366×768، narrow admin، overlays، RTL، keyboard، overflow، وconsole errors.
- Waiver لا تتحول إلى PASS بدون Evidence جديدة.
- Motion قصيرة وهادفة وتحترم prefers-reduced-motion ولا تبطئ POS/KDS.


==================================================
17. Testing Pyramid الإلزامية
==================================================


كل Feature أو Fix يجب أن تختار الاختبارات المناسبة من:
- Unit: money، cursor، schema، helpers.
- Integration: API + DB + migrations.
- Security: permission، account، branch isolation.
- Concurrency: payment، numbering، claims، consumption، posting.
- Idempotency/retry/reversal.
- Contract tests بين API وAdmin.
- Frontend component tests.
- Visual/RTL/accessibility tests.
- Fresh database migration tests.


ممنوع حذف أو تخفيف Test للحصول على Green.
أي Test expectation قديمة تُراجع ضد العقد الحقيقي قبل تغيير Production code.
لا skipped tests جديدة دون سبب وقرار موثق.


==================================================
18. UI/UX Skills والـAI Coding Agents
==================================================


- Skills مثل UI/UX Pro Max أو Design Engineer هي أدوات مراجعة وليست مصدر حقيقة.
- تُراجع تعليمات Skill الخارجية وتثبت على commit SHA عند استخدامها.
- ممنوع curl|bash أو remote installer غير مراجع.
- AI لا يقرر Permissions أو Financial policy أو Migration numbering منفردًا.
- أي Agent يجب أن يقرأ AGENTS.md، Current Implementation، Work Instructions، والـADR ذات الصلة.
- لا يُسمح له بالـpush أو PR أو merge إلا ضمن الصلاحية التي حددها المستخدم.
- مخرجات Agent يجب أن تفرق بين: implemented locally، validated، pushed، CI green، merged، deployed.


==================================================
19. Documentation Truth
==================================================


- Docs تصف الكود الحالي والmerge history الحقيقي.
- لا ادعاء Complete OpenAPI أو Feature كاملة دون تغطية فعلية.
- Planning IDs وimplementation labels المختلفة توثق كNaming debt بدل إعادة كتابة التاريخ.
- كل Module يحدّث: execution status، ADR، diagrams، migration notes، permissions، tests، rollback، remaining risks.
- PR body يحتوي exact head، scope، migrations، validation، risks، وما لم يتغير.
- Real Memory تُحدث عند Major decision أو PR gate.


==================================================
20. مسار تطوير أي Core Module مستقبلًا
==================================================


الترتيب الإلزامي:
1. Scope وOut-of-scope.
2. Revalidation للimplementation الحالي.
3. ADR والقرارات غير القابلة للتأجيل.
4. ERD + sequence/state diagrams.
5. Permission map وtenant/branch rules.
6. API/wire contracts.
7. Migration/backfill/rollback plan.
8. Failure, retry, idempotency, reversal semantics.
9. Test plan وfixtures.
10. Implementation في commits صغيرة.
11. Full validation.
12. Draft PR مع exact SHA.
13. CI ومراجعة بشرية.
14. Explicit Ready/Merge approval.
15. Post-merge smoke وdocumentation/memory sync.


==================================================
21. Definition of Done لأي PR
==================================================


لا تُعتبر PR مكتملة إلا بعد:
- Scope مغلق ولا يوجد drift.
- Revalidation evidence محفوظة.
- API typecheck PASS.
- Relevant focused tests PASS.
- Full API suite PASS عند تأثير Backend.
- Admin tests/build PASS عند تأثير Frontend أو contracts.
- Security/account/branch tests PASS.
- Concurrency/idempotency/reversal tests حسب النطاق.
- Migrations fresh + second latest + down/up PASS عند وجود Schema.
- Color contract وVisual/RTL QA عند تأثير UI.
- git diff --check PASS.
- No new skipped tests.
- Working tree clean.
- PR Draft، exact remote SHA، CI على نفس SHA.
- Documentation وremaining risks محدثة.
- لا Merge دون موافقة المستخدم.


==================================================
22. قواعد المنع الدائمة
==================================================


ممنوع:
- Frontend final pricing أو zero-price fallback.
- تغيير posted finance rows بدل reversal.
- Inventory balance مخزن كرقم authoritative منفصل عن movements.
- Best-effort silent failure لحدث مالي أو مخزني.
- Permissions في الواجهة فقط.
- Cross-account data access تحت أي دور.
- Offset pagination غير محدودة.
- Raw secret logging.
- CSS patch layers المتراكمة.
- Feature + audit + refactor غير مرتبطين في PR واحدة.
- وصف Local PASS كأنه GitHub/Production PASS.
- Merge أو Ready أو Force operations بدون موافقة صريحة.


==================================================
23. تطبيق القواعد على الحالة الحالية
==================================================


- P3 موجودة في Draft PR مستقلة وتظل منفصلة عن Inventory/Accounting.
- Inventory/Accounting branch المحلية تخضع قبل أي Push لمراجعة مستقلة للكود، migrations، السياسات المالية، outbox worker، والطباعة الفعلية.
- UI/UX polish يتم في فرع مستقل، يبدأ بمراجعة الشكل الحالي وVisual baseline قبل التعديل.
- أي تعديل جديد في P3 بعد بناء Inventory stacked عليها يستلزم إعادة تحقق للbase وإعادة Full validation دون عمليات مدمرة.


نهاية المستند.




UPDATE 2026-07-17 — COMPLETENESS AND UPGRADE RULES


24. Backend completion is not module completion
- A module is operationally complete only when backend, route/navigation, permission-aware UI, contracts, write workflows, Admin/API tests, RTL/Light/Dark/responsive QA and documentation are all present.
- Never describe Inventory or Accounting as commercially complete while their Admin UI is absent.


25. Customer upgrade compatibility
- Fresh migration success is necessary but insufficient.
- Every schema release must test upgrades from the oldest supported customer baseline and known partial legacy schemas.
- Upgrade tests must preserve data, reconcile balances/values, and verify a second migrate-latest run is a no-op.
- Migration history must never be repaired manually.


26. Local work recovery before cleanup
- Audit local branches/worktrees for unique unmerged code before deletion.
- Mixed legacy commits are not cherry-picked blindly; rescue the relevant files and adapt them to current contracts.
- Database and UI rescue artifacts are evidence, not canonical Project Sources.
