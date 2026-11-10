# CRMS-TSST-012 — KDS and Dashboard plain Egyptian Arabic (same wording as POS)

Date: 2026-11-10 · Issued by: TSST Lead (Claude, R61) · Owner OK: "Yes, after 011" (chat 2026-11-10). Issued with `after: CRMS-TSST-011`, so it can only be claimed after the Lead closes 011. Bus task: `CRMS-TSST-012` · Worker: Codex (`tsst-dev`, CODE tier)
Team: build · Skills: `TSST/DEV/skills/tsst-dev-sk-011-testing-tdd-engineering`, `TSST/DEV/skills/tsst-dev-sk-015-verification-before-completion`
Follows: `CRMS-TSST-011` (branch from its accepted tip).

## Why

Feature audit v2 row 21 and handoff priority 3: POS was cleaned in #36-B, but KDS and the Dashboard still show technical or English text to staff. The kitchen tablet is in the Beta (owner decision 2026-11-10: printing out, KDS only), so the KDS wording is now part of what the Beta accepts.

## Facts at `7f28f69` (`apps/pwa/src/pages`)

| Where | Now | Problem |
|---|---|---|
| `KdsPage.tsx:51-52` | `الاتصال بـ Edge غير متاح.` / `انتهت مهلة الاتصال بـ Edge.` | "Edge" is a technical word |
| `KdsPage.tsx:54` | `${error.message} تم تحديث الطابور.` | shows the English server message |
| `KdsPage.tsx:269` | `…من Local Edge مع تحديث تلقائي كل 10 ثوانٍ.` | technical |
| `KdsPage.tsx:287` | `Edge متصل` / `Edge متدهور` / `جاري فحص Edge` / `Edge غير متاح` | POS says `النظام متصل` / `النظام غير متصل` (`PosPage.tsx:72-74`) |
| `KdsPage.tsx:325` | `طلب #{orderId.slice(0, 8)}` | a UUID fragment means nothing in the kitchen |
| `DashboardPage.tsx:36,136` | `تعذر الوصول إلى Edge…` / `Edge غير متاح حاليًا…` | technical |
| `DashboardPage.tsx:132,165` | eyebrows `OPERATIONS OVERVIEW`, `ATTENTION` | English |
| `DashboardPage.tsx:158` | `Table tabs المفتوحة حاليًا` | mixed English |

## Change (text only)

1. Use POS's connection words everywhere: `النظام متصل` / `النظام بطيء` (for degraded) / `جاري فحص الاتصال` / `النظام غير متصل`. Error text: `الاتصال بالنظام مقطوع. اتأكد من الشبكة وحاول تاني.` and `النظام اتأخر في الرد. حاول تاني.` Reuse POS's map if it can be shared cleanly. Don't refactor beyond that.
2. KDS conflict: if `CRMS-TSST-011` added a shared message→Arabic map, use it. Otherwise show `الطلب اتغير من جهاز تاني. الطابور اتحدّث.`, with no English.
3. KDS order header: show the table name, or `تيك أواي` / `دليفري`, plus a short readable order reference if the API already returns one. If only the UUID exists, show the table or service mode alone and the submit time. **Do not add API fields.**
4. Dashboard: Arabic eyebrows (`ملخص التشغيل`, `محتاج متابعة`), `الترابيزات المفتوحة دلوقتي`, and the connection text from point 1. Remove "Local Edge" from the subtitles.
5. No layout, CSS, logic or API change.

## Tests

- Update existing KDS and Dashboard tests that assert the old strings.
- Add one test per page: with the system offline, no `Edge` text is shown and the Arabic status is shown.
- Add one KDS test: the order header shows the table name and no `#` followed by a UUID fragment.

## Where / limits

Same clone `C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_E2E008`. New branch `codex/crms-kds-language-012` from the accepted `CRMS-TSST-011` tip. All `CRMS-TSST-008` isolation rules apply, and the QA clone must not be touched. No merge, PR, deploy or Actions. Push only the new branch.

## Done when

1. PWA vitest passes in full, with the new tests. PWA `typecheck`, `lint` and `build` pass.
2. `grep -n "Edge" apps/pwa/src/pages/KdsPage.tsx apps/pwa/src/pages/DashboardPage.tsx` shows no user-visible string. Imports and identifiers are fine.
3. Commit(s) end with `Co-Authored-By: Codex`, pushed, no PR.
4. Report at `TSST/bus/out/CRMS-TSST-012.md` (≤4 KB): branch + SHA, diff stat, a before→after string table, the commands run with their counts, and `skills_used`.
