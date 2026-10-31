# DASH — مراجعة تجربة العميل وفق مبادئ UX الـ12

**النوع:** مراجعة UX + مواصفات إعادة ترتيب منخفضة التكلفة (تصور، لا تنفيذ إنتاجي)
**التاريخ:** 31 أكتوبر 2026
**المنتج:** DASH — Client Portal & Team Client Profile
**المراجع:** `AhmedFouad01/tsst-portal` (main)، شاشات Kemet Living المرفقة، R9/R95/R99؛ قواعد R49–R53

## إطار التقييم

مبادئ الاستخدام الـ12 من Stanford University (هي إطار مراجعة يجمع عدة مدارس، وليس «قانونًا وحيدًا»):
https://improvement.stanford.edu/resources/usability-principles

| # | المبدأ | حكم المراجعة الحالية | مستوى الأثر | قرار الرسم الأقل تكلفة |
|---|---|---|---|---|
| 01 | User Control and Freedom | تنقل العميل متشعب بين Project/Job/Files؛ الرجوع للسياق غير مضمون | عالٍ | أربع وجهات رئيسية مع بقاء الروابط العميقة |
| 02 | Recognition vs Recall | العميل مضطر يفتكر أي Job يحتوي على ملفه | عالٍ | تبويب «الملفات» يختصر الملفات المشتركة دون إظهار الداخلية |
| 03 | Mental Model | مصطلح Plan مستخدم للخطة التسويقية ومستندات التخطيط والباقة | عالٍ | «الخطة التسويقية» و«باقتي» مع فصل Plan Jobs كنوع عمل |
| 04 | Clarity | مشروع/Job/Item وReview/Approved/Delivered متقاربة المعنى | عالٍ | العميل يرى مهمة: «مطلوب رأيك»، «ملف جاهز»، «الخطوة القادمة» |
| 05 | Simplicity & Aesthetic Integrity | بروفايل الفريق تكدس فيه التشغيل والحسابات والإدارة | عالٍ | ملخص إجراءات أولًا، وبقية المكونات في تبويبات قصيرة دون إعادة بناء |
| 06 | Accuracy | `Files` في شريط العميل يذهب إلى anchor غير مثبت بالصفحة؛ تاريخ الطلب لا يرسل ضمن payload في المكون الحالي | عالٍ | رابط موثوق، وعدم عرض حقول غير محفوظة على أنها تعمل |
| 07 | Error Handling & Prevention | تعدد مسارات المراجعة قد يخلط المراجعة القديمة بالـItem versions | عالٍ | نقطة دخول واحدة إلى `/client/for-your-review` وحماية v1 من اعتماد بالخطأ |
| 08 | Consistency & Predictability | Home ما زالت تبني مراجعات من Jobs بينما Review Queue تستخدم Items | عالٍ | مراجعات الصفحة الرئيسية تشير إلى قائمة الـItems الحديثة لا قرار آخر |
| 09 | User Support | الصفحة تفتقر إلى توضيح موجز «ماذا يحدث بعد الموافقة؟» | متوسط | وصف ثابت قصير عند الفعل، بلا شروحات طويلة أو مكونات جديدة |
| 10 | Forgiveness | مراجعة إصدار قديم يجب أن تكون read-only؛ مراجعات العميل تحتاج سبب تغييرات | عالٍ | إظهار رقم الإصدار وأزرار disabled عند عرض إصدار قديم، حوار تأكيد ملائم |
| 11 | Feedback | أفعال الملفات والطلب أحيانًا لا تعطي حالة مكتملة مرتبطة بـAPI | عالٍ | نجاح/خطأ مرئي، وعدم الإيحاء بتنزيل ملفات في النموذج فقط |
| 12 | Accessibility Compliant | 390px كثيف؛ خليط عربي/إنجليزي يحتاج عزل واتساع لمناطق اللمس | عالٍ | أزرار واضحة، عزل bidi، keyboard focus، رحلة قرار بلا تمرير طويل |

**مهم:** التقييم خبراء على الكود والشاشات، وليس نتيجة اختبار مستخدمين أو تدقيق WCAG AA رسمي.

## الفحص الوظيفي للموجود في الكود

| المنطقة | المسار الحالي | الاستنتاج |
|---|---|---|
| Team client | `web/src/pages/ClientDetail.tsx` | header + tabs + `ReadyToBill` + `ClientOverview` + `ClientPackages` + People + Visibility + Activity؛ عرض مركب طويل. |
| Client home | `web/src/pages/client/ClientHome.tsx` | `ClientHeader` + `ClientOverview` + legacy review derived from jobs؛ تحتاج نقطة دخول واحدة للمراجعة الحديثة. |
| Review | `/client/for-your-review` | `ClientReviewQueue` ينفذ قرارًا مرتبطًا بالإصدار وتعليقات؛ نعتمده وجهة المراجعة الأساسية. |
| Client plans | `/client/plan` | `PlanBoard` + `PackageDetails` + `MyRequests` في صفحة واحدة؛ تغيير الترتيب/التبويبات وليس Backend. |
| Files | `/client#client-files` + `/client/job` | قائمة الملفات الحالية متفرقة؛ لا يفترض أن جميع ملفات Job عامة للعميل. |
| Request | `/client/requests` | شاشة الطلب الجديدة تحفظ `output_types` و`title` و`details`. في الكود المقروء عنصر رفع المرفقات شكلي، والتاريخ المحلي لا يدخل body؛ يحتاجان معالجة وظيفية مستقلة. |
| Team packages | `/clients/view?view=packages` | باقات + دفعات + فواتير + jobs؛ تحتاج تبويب مستقل عن عمليات الإنتاج. |

## الهيكل المقترح للعميل

- **الرئيسية:** أولًا قائمة ما يحتاج قرارًا؛ ثم آخر الأعمال المتاحة؛ ثم الجاي من الخطة؛ ملخص الباقة؛ رابط طلب جديد.
- **محتاج رأيك:** صفحة المراجعة الحديثة الحالية؛ نسخة واحدة فقط ذات صلاحية؛ إصدارات سابقة للعرض فقط.
- **شغلي وملفاتي:** تبويب «الملفات المشتركة» + «كل الشغل». يفتح Job/Item موجودًا، لا ينشئ نظام وثائق جديد.
- **الخطة والباقة:** تبويبان داخل المسار الموجود؛ Marketing Plan وPackage Details بلا خلط، ومعاد النشر/التسليم واضح.
- **الطلبات:** يبقى مسار قائم مع رابط رئيسي واضح وسجل متابعة.

## الهيكل المقترح للفريق

- **ملخص العميل:** العناصر التي تحتاج إجراء وروابطها + معلومات العميل الأساسية.
- **الشغل والخطة:** Projects، Running Jobs، Posts، Plan Jobs، Milestones.
- **الباقة والحسابات:** Packages، Bonus، Billing، Ready to Bill، Payments.
- **إدارة العميل:** People، Visibility، Language، Client Activity.

## عقد البيانات: ما هو معروف وما هو ناقص

- بيانات Kemet Living المرجعية: `Fall Collection Launch 2026` و`Summer Campaign 2026` و`REQ-104` و3 عناصر مراجعة، وصيغ ملفات ظاهرة في الموكابس.
- **لا توجد أرقام باقة Kemet Living موثوقة في الصور**؛ النموذج يعرض «—» بدل اختراع أرقام أو أسعار.
- في Job Files المصورة: `Organic_Linen_Moodboard_Deck.pdf` و`HighRes_Clean_Exports_Pack.zip` مشتركان مع العميل، بينما ملفات Source/Raw خاصة بالفريق.
- لا يتم إنشاء أحداث مراجعة حقيقية، ولا روابط تنزيل مزيفة، ولا تواريخ نشر جديدة.

## خطة تنفيذ منخفضة التكلفة

| حزمة | المحتوى | التغيير المطلوب | الخطر |
|---|---|---|---|
| P0 | ترتيب الفريق والعميل + تقليل nav + unified review entry | mostly Frontend، استخدام المكونات والـAPI الحالية | منخفض–متوسط |
| P0 | إصلاح رابط Files والمرفقات في Review | Frontend مع تحقق من API file access | متوسط |
| P1 | تجميع الملفات المشتركة في قسم واحد | استخدام Job details الحالية؛ اختبار pagination والأداء | متوسط؛ Endpoint خاص فقط إذا أثبتت القياسات الحاجة |
| P1 | فصل Plan / Package / MyRequests | إعادة تركيب المكونات الحالية | منخفض |
| P2 | إكمال upload وtarget date في طلبات العميل | يقتضي فحص عقد API/Backend والتخزين | منفصل؛ ليس ضمن إعادة ترتيب العرض |

## Acceptance gates

1. المستخدم ينتقل إلى المراجعة الحديثة من الرئيسية بضغطة واحدة؛ ليس هناك نسختان من approve.
2. 390px: لا يوجد overflow أفقي؛ قرار «موافق/اطلب تعديلات» متاح دون النزول لقائمة 20 عنصرًا.
3. كلا الدورين يرى فقط الملفات والصلاحيات المسموحة؛ لا Source/Raw لواجهة العميل.
4. لا يُعرض file download باعتباره يعمل في النموذج المحلي؛ عند التنفيذ يستخدم endpoint المصادق.
5. العربي/الإنجليزي RTL/LTR مع عناوين طويلة؛ حالات loading/empty/error محسوبة.
6. باقة وبيانات مالية تظهر فقط عندما `viewer.sections.package` و`billing` تسمحان.
7. روابط `/client/job` و`/client/project` والقديمة لا تُكسر.
8. HeroUI 3.2.6 وDS tokens وR49–R53 بدون border أو مكونات UI مخصصة تحاكيها.
9. تجربة Keyboard/Screen reader وتحقق WCAG AA في النسخة التنفيذية؛ mock ليس شهادة مطابقة.
10. no backend changes/no merge/no deploy من هذه المراجعة أو prototype.

## مصادر أساسية

- Stanford 12 principles: https://improvement.stanford.edu/resources/usability-principles
- UX rules R49–R53: https://github.com/AhmedFouad01/tsst-portal/blob/main/docs/r9/RULES-R49-R53.md
- User flow: https://github.com/AhmedFouad01/tsst-portal/blob/main/web/src/pages/client/ClientShell.tsx
- Team client page: https://github.com/AhmedFouad01/tsst-portal/blob/main/web/src/pages/ClientDetail.tsx
- Client homepage: https://github.com/AhmedFouad01/tsst-portal/blob/main/web/src/pages/client/ClientHome.tsx
- Review v2: https://github.com/AhmedFouad01/tsst-portal/blob/main/web/src/pages/client/ClientReviewQueue.tsx
- Packages: https://github.com/AhmedFouad01/tsst-portal/blob/main/web/src/components/ClientPackageDetails.tsx
- Marketing plan: https://github.com/AhmedFouad01/tsst-portal/blob/main/web/src/components/MarketingPlan.tsx
