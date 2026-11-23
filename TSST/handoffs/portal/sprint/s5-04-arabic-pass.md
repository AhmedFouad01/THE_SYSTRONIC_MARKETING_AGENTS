# S5-04 e2: the Arabic pass, for the owner's reading (Q4)

Copy only. File: `web/src/copy/ar/copy.ts`. No English string changed, no layout changed, no key added or removed in this step (both dictionaries keep the same shape; the copy parity test is part of `npm run test:api`, green).
Rule used: the wording drawn in the Arabic frames of `DASH-SPRINT0/mockups/s5-r2/07` and `08` wins. Where a key is not drawn there, the builder proposes and marks it **proposed** (needs your reading before any deploy).

## 1. Changed strings (the keys of ticket section 6)

| Key (`cv.`) | Old Arabic | New Arabic | Source | Where it shows |
|---|---|---|---|---|
| home.approveAll(n) | الموافقة على الكل (n) | وافق على الكل (n) | drawn 07 | Home, button of "Waiting for your review" (approver only) |
| home.reviewDetail | المراجعة بالتفصيل | راجع بالتفصيل | drawn 07 | Home, second button of that card |
| home.confirmText(n) | هل تريد الموافقة على n عناصر دفعة واحدة؟ ستُسجَّل موافقتك على كل عنصر. | هتوافق على n عناصر مرة واحدة؟ موافقتك هتتسجّل على كل عنصر. | drawn 07 (inset d) | Home, confirm step of Approve all |
| home.confirm | تأكيد الموافقة | أكّد الموافقة | drawn 07 | Home, confirm button |
| home.approving | جارٍ الاعتماد… | بنوافق دلوقتي… | **proposed** (not drawn) | Home, confirm button while it works |
| home.someFailed | لم تتم الموافقة على بعض العناصر: | في عناصر ما اتوافقش عليها: | **proposed** (not drawn) | Home, error line after Approve all when some items failed |
| home.caughtTitle | لا شيء معلّق | مفيش حاجة معلّقة | drawn 07 (inset e) | Home, empty state of the review card |
| home.caughtBody | لا توجد عناصر بانتظار موافقتك. | مفيش عناصر مستنية موافقتك. | drawn 07 (inset e) | same |
| home.ready(n) | أحدث الأعمال الجاهزة (n) | آخر شغل جاهز (n) | drawn 07 | Home, title of "Latest ready work" |
| home.readyEmpty | ستظهر هنا الأعمال التي تمت الموافقة عليها. | الشغل اللي اتوافق عليه هيظهر هنا. | **proposed** (not drawn) | Home, empty state of that card |
| home.focus | التركيز الحالي في الخطة التسويقية | التركيز الحالي في الخطة | drawn 07 | Home, heading of the focus boxes |
| review.approve | الموافقة على هذا الإصدار | وافق على النسخة دي | drawn 08 | For your review, Approve button |
| review.locked | تمت جدولة هذا العنصر أو نشره، لذلك لا يمكن تغيير الموافقة. | العنصر ده اتجدول أو اتنشر، فمش هينفع نغيّر الموافقة. | **proposed** (not drawn) | For your review, line shown when a request for changes is refused because the item is scheduled or posted |
| review.changed | تغيّر هذا العنصر أثناء اطلاعك عليه. يُرجى مراجعة أحدث إصدار واتخاذ القرار من جديد. | العنصر ده اتغيّر وانت بتشوفه. راجع آخر نسخة وخد قرارك من جديد. | **proposed** (not drawn) | For your review, line shown when a newer version appeared |
| review.vCurrent(v) | v1 (الحالي) | v1 (الحالية) | **proposed** (the frames say "النسخة", feminine) | For your review, version list |
| review.vApproved(v) | v1 (معتمد) | v1 (معتمدة) | **proposed** | same |
| plan.viewPlan | اعرض الخطة | شوف الخطة | drawn 07 | Home, button of the focus box and of "Coming up"; Plan links |
| review.current(v) | الحالي: v1 | الحالية: v1 | **proposed** (agrees with "النسخة" of the drawn 08, review fix 4) | For your review, current-version label |
| review.versions | الإصدارات | النسخ | **proposed** (same reason) | For your review, version list heading |
| review.pastView | الإصدارات السابقة للعرض فقط | النسخ القديمة للعرض بس | **proposed** (same reason; not named in ticket section 6, changed to agree with the rows around it) | For your review, note under the version list |
| review.oldVersion | هذا إصدار قديم. افتح الإصدار الحالي لاتخاذ القرار. | دي نسخة قديمة. افتح النسخة الحالية عشان تاخد قرارك. | **proposed** (same reason) | For your review, notice when an old version is open |
| review.caughtTitle | لا شيء معلّق | مفيش حاجة معلّقة | same words as the Home empty state (review fix 4) | For your review, empty state |
| review.caughtBody | لا توجد عناصر بانتظار موافقتك الآن. | مفيش عناصر مستنية موافقتك دلوقتي. | same words as the Home empty state, keeps "now" | same |

Review-fix notes: `review.vCurrent` and `review.vApproved` (the "(الحالية)" and "(معتمدة)" labels above) now agree in gender with `review.current`, `review.versions` and `review.oldVersion`, all using "النسخة" as drawn in 08. Gate follow-ups: `web/qa/F-04/gate.mjs` named the old word for `plan.viewPlan`, and `web/qa/F-03/gate.mjs` the old review empty-state word; both now name the new words.

## 2. Named in ticket section 6 and already as drawn (not changed)

| Key | Arabic today | Why unchanged |
|---|---|---|
| home.waiting(n) | محتاج رأيك (n) | equals the drawn title |
| review.doneApproved | وافقت على: | equals the drawn line |
| review.doneRequested | طلب التعديل اتبعت: | not drawn; already plain Egyptian |
| review.addNote | أضف ملاحظة… | equals the drawn placeholder |
| review.vPlain(v) | v1 | version number only |
| plan.comingUp | المواعيد الجاية | equals the drawn title |
| plan.focusMilestones(done, total) | 4 من 7 محطات | equals the drawn chip |

## 3. Seen, not changed (section 6 does not name them)

- home.viewAll: عرض كل الأعمال (drawn: شوف كل الشغل).
- review.request: طلب تعديلات (drawn: اطلب تعديلات); review.approveTight, review.requestTight, review.approvedNote, review.reason, review.reasonHint, review.sendRequest and the rest of `cv.review`.
- review.team: "The Systronic" is English in the Arabic dictionary (a brand name; the drawn frame also shows it that way, SPEC section 5).
- The F-08 band words (نشطة، متوقفة مؤقتًا، +N كمان، مفيش باقة شهرية) still wait for the owner's reading, as the ticket says.

## 4. New Arabic words (parts b, c, e1 and S5-03): new, needs the owner's reading

| Key | Arabic | Source | Where it shows |
|---|---|---|---|
| cv.home.myRequests(n) | طلباتي (n) | drawn 07 | Home, "My requests" card title (only when the client has a request) |
| cv.home.allRequests | كل الطلبات | drawn 07 | Home, button of that card |
| cv.home.billing | الدفع | drawn 07 | Home, Billing card title |
| cv.home.perMonth | شهريًا | drawn 07 | Home, Billing card, after the price |
| cv.home.priceOnce | مرة واحدة | **proposed** (one-time package not drawn) | Home, Billing card of a one-time package |
| cv.home.platformsLabel | المنصات | drawn 07 | Home, Billing card |
| cv.home.nextPayment | الدفعة الجاية | drawn 07 | Home, Billing card |
| cv.report.produced | إيه اللي الشغل عمله | S5-03 (09) | Home "What it produced" line; the report page |
| cv.report.reportedByTeam | مسجّلة من الفريق | S5-03 (09) | same |
| cv.report.nav | نتيجة الشهر | S5-03 (09) | Home, button of the "What it produced" line; the bar link |
| cv.report.next | اللي جاي | S5-03 (09) | report page, "Coming up" block |
| cv.report.stages | الاستقطاب، التفعيل، الإيراد، الاحتفاظ، الإحالة | S5-03 (09) | report page and the Home line (note: the Plan page uses other stage names, e.g. جذب عملاء) |
| cv.report.metrics.leads | العملاء المحتملين | S5-03 | report page, a stage's metric |
| cv.report.noteTitle | كلمة من مديرة حسابك | S5-03 (09) | report page, note block |

The milestones strip has no new word: its text alternative is the existing chip text (`cv.plan.focusMilestones`).
