# CRMS-TSST-012 — PASS (done by Lead; Codex was out of usage)

Owner OK to send it after 011: "Yes, after 011". Codex then hit its limit, and Ahmed asked the Lead to continue in its place. The bus task was cancelled and reassigned to the Lead (see log). Branch `claude/crms-kds-language-012` from `d32b94e` (accepted 011). Head `8f46c25c472ef84beaab63e8f489f4e7578d4125`, pushed, no PR. 4 files, +30/−23. Text and tests only: no layout, CSS, logic or API change.

## Before → after

| Where | Before | After |
|---|---|---|
| KDS network / timeout error | `الاتصال بـ Edge غير متاح.` / `انتهت مهلة الاتصال بـ Edge.` | `الاتصال بالنظام مقطوع. اتأكد من الشبكة وحاول تاني.` / `النظام اتأخر في الرد. حاول تاني.` (same as POS) |
| KDS stale-version conflict | `<English server message> تم تحديث الطابور.` | `الطلب اتغير من جهاز تاني. الطابور اتحدّث.` |
| KDS eyebrow / subtitle | `KDS` / `…من Local Edge مع تحديث تلقائي كل 10 ثوانٍ.` | `تشغيل مباشر` / `الطلبات اللي محتاجة تتجهز، وبتتحدّث لوحدها كل 10 ثواني.` |
| KDS connection badge | `Edge متصل / متدهور / جاري فحص Edge / Edge غير متاح` | `النظام متصل / النظام بطيء / جاري فحص الاتصال / النظام غير متصل` |
| KDS card | `طلب #12345678` line + aria `طلب 12345678` | line removed (table name, table code, item count, time and mode stay); aria `طلب <table or mode> <time>` |
| Dashboard eyebrows | `OPERATIONS OVERVIEW`, `ATTENTION` | `ملخص التشغيل`, `محتاج متابعة` |
| Dashboard subtitle / offline alert | `…Local Edge المعتمدة…` / `Edge غير متاح حاليًا…` | `صورة سريعة عن الشغل دلوقتي، حسب صلاحياتك.` / `النظام غير متصل دلوقتي. الأرقام اللي قدامك مش مباشرة لحد ما الاتصال يرجع.` |
| Dashboard card hint / section error | `Table tabs المفتوحة حاليًا` / `تعذر الوصول إلى Edge لهذا الجزء.` | `الترابيزات المفتوحة دلوقتي` / `الجزء ده مش متاح دلوقتي لأن الاتصال بالنظام مقطوع.` |

The API has no short order number, so none was invented (spec: no new API fields).

## Gates (on `8f46c25`)

- PWA vitest: 25 files, 205/205. KDS and Dashboard tests: 16/16. They assert no `Edge` text when offline, no `طلب #` or id fragment on the KDS card, and the Arabic conflict message.
- PWA `typecheck`, `lint` and `build` PASS.
- `grep "Edge"` in `KdsPage.tsx` and `DashboardPage.tsx`: only the `useEdgeHealth` import and identifiers, with no user-visible string.
- No runtime 002w rerun was needed: no Edge or API change since `d32b94e`, which passed 002w twice.

Skills applied: TSST-DEV-SK-011 (tests updated and added), TSST-DEV-SK-015 (gates and evidence).
