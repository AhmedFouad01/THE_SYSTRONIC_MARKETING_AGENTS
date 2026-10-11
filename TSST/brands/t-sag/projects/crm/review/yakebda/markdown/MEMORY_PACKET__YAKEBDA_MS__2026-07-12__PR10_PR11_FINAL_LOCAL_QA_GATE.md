YAKEBDA MS — PR #10 + PR #11 Final Checkpoint
التاريخ: 12 يوليو 2026
الحالة: تم إيقاف أي تطوير جديد عند بوابة الاختبار المحلي للمستخدم.
الحالة المؤكدة على GitHub
* PR #10 — fix(security): enforce permissions and branch scope.
* تم الدمج في main عند commit: 91c69d70e45e009c25963a96e1822ff2140fd4fd.
* PR #11 — fix(orders): enforce configuration integrity and atomic numbering.
* تم الدمج في main عند commit: 4a0d20777f4867d36d64ebd66f23794af8dc4482.
* Final CI لـ PR #11: GitHub Actions run #98 نجح؛ API tests وAdmin build نجحا.
نطاق PR #10
* فرض الصلاحيات قبل تنفيذ أو كشف تفاصيل العمليات.
* تثبيت نطاق الحساب والفرع ومنع الوصول خارج النطاق المسموح.
* إضافة اختبارات Regression لسلوك الصلاحيات والـbranch scope.
نطاق PR #11
* التحقق من المنتج والـvariant والـmodifiers من الخادم وقاعدة البيانات.
* رفض الاختيارات المكررة أو غير النشطة أو التابعة لمنتج آخر.
* فرض required modifier groups وقواعد min_select وmax_select.
* إضافة database triggers مؤجلة لحماية سلامة تكوين الطلب داخل transaction.
* إضافة numbering_key للترقيم حسب الفرع أو الحساب، يومي أو مستمر.
* إسناد رقم الطلب في PostgreSQL BEFORE INSERT trigger مع advisory transaction lock.
* تسجيل migrations 011 و012 داخل Knex migration source.
* تغطية الترقيم المتزامن داخل فرع واحد وبين فرعين على مستوى الحساب.
بوابة الاختبار المحلي
* لا يبدأ Runtime Reliability أو أي إصلاح جديد قبل اعتماد المستخدم للاختبار المحلي.
* لاختبار PR #10 وPR #11 فقط، استخدم commit 4a0d20777f4867d36d64ebd66f23794af8dc4482.
* تنبيه: latest main يحتوي أيضًا على PR #12؛ لذلك pull على main لن يعزل اختبار 10 و11.
قرار الاستكمال
بعد نجاح الاختبار المحلي واعتماد المستخدم، يتم استئناف العمل من Runtime Reliability. هذا الـpacket يسجل PR #10 وPR #11 فقط.
