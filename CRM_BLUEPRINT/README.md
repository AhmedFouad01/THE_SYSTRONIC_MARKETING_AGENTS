# Systronic CRM — Engineering Foundation

Version: v0.2 | Date: 2026-10-01 | Status: M0 READY FOR FOUNDATION SPIKE

CRM Engineering Blueprint v0.2 — M0 READY. Pre-implementation documentation readiness only: M0 has not run, no foundation is selected, and no product or operational readiness is claimed. The unchanged engineering meeting output is preserved in v0.1 commit `bb89734f30522532e720111c90c76095db00405f`.

## الهدف
منتج CRM يربط الحملات برحلة المشتري والليدز والمبيعات، تستخدمه سيسترونك وعملاؤها، وقابل للتقديم كـSaaS. أول تطبيقات: الوكالة، المكملات أونلاين، المطابخ والتشطيبات.

دي حزمة تصميم قابلة للمراجعة، وليست نظامًا منفذًا أو قرارات معتمدة من DEV_AG. لا يوجد كود منتج أو تكامل فعلي أو تقدير تكلفة نهائي. القرارات المقترحة منفصلة عن المتطلبات المؤكدة.

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
- نبدأ بـM0 لإثبات الأساس، ثم شريحة كاملة من استقبال الليد إلى نتيجة البيع. لا نبدأ بتنفيذ كل الوحدات دفعة واحدة.
- التقديرات والسعة والاحتفاظ بالبيانات في هذه النسخة أهداف مقترحة وليست حقائق عن حجم نشاط العملاء.

## القرار المقترح
Modular monolith + relational database + durable background jobs + provider adapters، مع tenant isolation من أول migration. Framework أو CRM upstream لم يُحسم؛ Twenty وFrappe مرشحان للتجربة، والبناء المخصص خيار إذا لم يلبيا الشروط.

## Delivery gates
- **Foundation / Vertical Slice gate:** M0 is a bounded foundation spike; M1 proves manual lead → contact/deal → controlled stage outcome → task/audit/outbox with RBAC and tenant isolation. Only this slice's fixtures are required for M1.
- **Pilot Completion gate:** M2–M4 complete every P0 requirement, including tracking, attribution, eligible providers, segmentation, domain profiles, subject privacy and tenant portability. These remain required but do not block starting M1. Provider blockers remain visible; they cannot silently waive pilot scope.

See the SRS gate allocation and delivery traceability matrix. Status does not certify provider integrations, security isolation, load targets, licensing, backup/restore or external APIs. Open business decisions require owner approval; see OQ-01–OQ-12.
