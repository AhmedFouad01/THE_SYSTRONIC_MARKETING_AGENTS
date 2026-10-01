# Systronic CRM — Engineering Foundation

Version: v0.2 | Date: 2026-10-01 | Status: M0 READY FOR CUSTOM-BUILD FOUNDATION SPIKE

CRM Engineering Blueprint v0.2 — M0 READY. Pre-implementation documentation readiness only: M0 has not run and no product or operational readiness is claimed. **Owner decision 2026-10-01: the product foundation is Custom Build.** The unchanged engineering meeting output is preserved in v0.1 commit `bb89734f30522532e720111c90c76095db00405f`; the v0.2 audit remediation is preserved in commit `e09446c54ae202a7415006fd61b891242b0e7f7f`.

## الهدف
منتج CRM يربط الحملات برحلة المشتري والليدز والمبيعات، تستخدمه سيسترونك وعملاؤها، وقابل للتقديم كـSaaS. أول تطبيقات: الوكالة، المكملات أونلاين، المطابخ والتشطيبات.

دي حزمة تصميم قابلة للمراجعة، وليست نظامًا منفذًا أو تكاملًا فعليًا. لا يوجد كود منتج أو تقدير تكلفة نهائي. القرارات المؤكدة تُفصل عن الافتراضات والمتطلبات التي ما زالت تحتاج إثباتًا في M0 أو مراحل لاحقة.

## اقرأ بالترتيب
1. [Product scope](01_PRODUCT_SCOPE.md): الرؤية، الحدود، الافتراضات، مراحل المنتج.
2. [SRS](02_SRS.md): متطلبات مرقمة ومعايير قبول قابلة للاختبار.
3. [Architecture](03_ARCHITECTURE.md): المكونات، تدفق البيانات، حدود الحسابات.
4. [Data model](04_DATA_MODEL.md): ERD منطقي، قاموس البيانات، القيود.
5. [Tracking and integrations](05_TRACKING_INTEGRATIONS.md): الهوية، الأحداث، Meta وGoogle والقياس.
6. [API contracts](06_API_CONTRACTS.md): العقود الداخلية والخارجية وسلوك الفشل.
7. [Security and operations](07_SECURITY_OPERATIONS.md): الصلاحيات والتشغيل والاستعادة.
8. [Delivery and verification](08_DELIVERY_PLAN.md): مراحل التنفيذ والاختبارات وتتبع المتطلبات.
9. [Decision log](09_DECISIONS_RISKS.md): ADRs والمخاطر والقرارات المفتوحة.
10. [Sources](10_SOURCES.md): مصادر التكاملات وحدود التحقق.

## طريقة استخدام الحزمة
- النص الهندسي بالإنجليزية لضبط أسماء العقود والكيانات، والملخصات بالعربية.
- مخططات Mermaid موجودة داخل الملفات وقابلة للتحرير؛ لم يتم تصدير صور منها.
- Requirement IDs هي مرجع التنفيذ والاختبار. أي تغيير يؤثر على السلوك يحدّث SRS والعقد والاختبار المرتبط.
- نبدأ بـM0 لإثبات أساس الـCustom Build، ثم شريحة كاملة من استقبال الليد إلى نتيجة البيع. لا نبدأ بتنفيذ كل الوحدات دفعة واحدة.
- التقديرات والسعة والاحتفاظ بالبيانات في هذه النسخة أهداف مقترحة وليست حقائق عن حجم نشاط العملاء.

## القرارات المؤكدة قبل M0
- **Foundation:** Custom Build؛ Twenty/Frappe لم يعودا مرشحين للتنفيذ الأساسي.
- **Architecture direction:** modular monolith + relational database + durable background jobs + provider adapters.
- **Tenant isolation:** `tenant_id` + tenant-equal composite references + application authorization + PostgreSQL RLS؛ العزل يُثبت بالاختبارات ولا يعتمد على middleware فقط.
- **Authorization:** fixed RBAC/action catalogue + scoped grants؛ deny by default؛ object/field/export checks server-side؛ workers re-check current authority.
- **Idempotency/dedup:** API retry cache منفصل عن source/business identity وprovider-delivery idempotency؛ انتهاء retry cache لا يلغي business dedup truth.
- **Tenant portability:** complete authorized tenant export كـP0 workflow مستقل عن privacy subject export/delete، مع manifest/versioning واستبعاد الأسرار/بيانات tenants أخرى.
- **Attribution baseline:** versioned deterministic First Touch + Last Non-Direct Touch، default lookback 30 days configurable؛ internal attribution منفصل عن provider-reported attribution.
- **Conversion truth:** service/agency uses `deal_won` as commercial outcome; commerce keeps ordered/paid/delivered separate and uses `payment_captured` as the default revenue truth unless an owner-approved business profile overrides mapping. No double-counting across milestones.

## Delivery gates
- **M0 Custom-Build Foundation Spike:** freeze the actual TypeScript/PostgreSQL/queue/storage libraries and versions, prove tenant isolation/RBAC, one CRM transition, business event + outbox/worker idempotency, audit, RTL/LTR, migrations, backup/restore and evidence capture using synthetic data.
- **Foundation / Vertical Slice gate:** M1 proves manual lead → contact/deal → controlled stage outcome → task/audit/outbox with RBAC and tenant isolation. Only this slice's fixtures are required for M1.
- **Pilot Completion gate:** M2–M4 complete every P0 requirement, including tracking, attribution, eligible providers, segmentation, domain profiles, subject privacy and tenant portability. Provider blockers remain visible; they cannot silently waive pilot scope.

Status does not certify provider integrations, security isolation, load targets, backup/restore or external APIs. Remaining OQs are verification/configuration inputs unless explicitly marked as owner decisions in `09_DECISIONS_RISKS.md`.
