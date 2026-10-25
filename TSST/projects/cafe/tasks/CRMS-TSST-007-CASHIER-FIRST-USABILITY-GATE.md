# CRMS-TSST-007 — Cashier-first usability acceptance and UX restructuring gate

Date: 2026-10-25
Owner report: "بس كا برنامح فى لسه حاجات ف الوجهه محتاجه تتظبط و فى حاجات صعبه مش اى حد هيقعد ع البرنامج هيشتغل عليه هيستسهله و ده مش اللى اتفقنا عليه"
Scope: `CAFE_RESTAURANT_MS`, UX PR #35; POS fix PR #34 separate
Priority: **P0 before release/UX merge acceptance**
Status: `OPEN / USER_USABILITY_ACCEPTANCE_NOT_MET / AUDIT_AND_DESIGN_REQUIRED`

## Binding product commitment

The agreed target is a simple, Arabic-first, RTL day-to-day cafe/restaurant POS that a new, nontechnical cashier or waiter can learn with **minimal training**, with the business rules, permissions, financial correctness, Edge authority, table concurrency and KDS/printing preserved. A green Vitest/typecheck/lint/build gate is necessary but **not sufficient** for finished-product acceptance. Owner explicitly reports the current experience remains awkward/complex, so the user-facing usability gate must be reopened even though scoped technical POS tests passed.

## Source and evidence (not fabricated browser observation)

- UX PR #35 is open/draft and unmerged. Gate doc `docs/gates/CRMS-UX-FINAL-GLOBAL-VISUAL-SYSTEM.md` is labeled `IMPLEMENTATION QA EVIDENCE RECONCILED`, not user acceptance.
- At POS PR #34 HEAD `5688007cb89fda0444908cb70ef43302c25`, `PosPage.tsx` is ~2305 lines; currently renders table management, dine-in/takeaway/delivery mode, table chooser, search/category chooser, products, order items, transfer, another table, extra batch, gaming setup, KDS state, bill/payment/close behavior within one route. Source complexity is **a risk signal**, not direct proof of any specific confusion.
- `AppLayout.tsx` contains 11 top-level navigation destinations, role-filtered, split into daily and management. Navigation is present; discoverability to a new employee must be tested rather than assumed.
- Historical UX acceptance checkpoints emphasized 1366×768 visibility of products/cart/total/next action without page scrolling, searchable compact table chooser, one primary CTA per stage, Arabic/RTL, distinguish order creation/sending/payment, and 390×844 usable workflows. PR35 evidence describes responsive layout samples and keyboard/backdrop tests, not live new-cashier first-use task completion.
- Prior agreed use cases include multi-table parked orders, kitchen started/not started, "فتح ترابيزة أخرى", easy visibility of current order and kitchen progress, permission-integrity and Edge-authoritative state. PIN-based fast login is in SRS and should be reviewed as an independently gated auth/user journey item; do not weaken authentication.

## P0 operator workflow audit — staged and testable

1. **First-use orientation** — cashier must immediately distinguish "طلب جديد", "طلب شغال", "مطبخ", "تحصيل" and "إقفال". Avoid exposing back-office functions without matching permission.
2. **Create order** — dine-in: choose table, choose item, adjust quantity, see total, send order. Takeaway/delivery flows equally clear without hidden mandatory fields. Critical controls must be visible at standard 1366×768, no dependent scroll scavenger hunt.
3. **Multiple tables and draft recovery** — park ticket/open another table/return to original while keeping one live tab per table; no visible ghost or duplicate after cancel and re-add.
4. **Kitchen feedback** — accurate human-readable "لم يُرسل / جاري التجهيز / جاهز" with one clear next action; don't infer KDS status from an optimistic client.
5. **Payment and close** — separate "إرسال الطلب", "فتح الفاتورة", "تحصيل", "إغلاق نهائي"; show amount due and reversible/non-reversible states; no unintended final close or double payment.
6. **Unusual operations** — table transfer, extra order batch, gaming panel, and settings/tools should be discoverable **when needed**, secondary to everyday sale. Use disclosure/actions grouping based on evidence, not hide required paths.
7. **Errors / offline / denied permissions** — actionable Egyptian Arabic messages near the affected task, not generic error/code identifiers. Show exact safe next step; no fake successful mutations.
8. **Layout / readability** — Arabic RTL throughout, meaningful font/contrast, touch targets, unclipped category/products/cart/CTA on 1366×768 desktop, 390×844 portrait, and 844×390 landscape. No horizontal overflow. No forced navigation to unrelated sections for one basic sale.

## Proposed user acceptance gate (thresholds to validate with owner, not previously measured)

- Pilot with **at least one cashier/staff unfamiliar with the app**, without developer coaching. Observe completion, hesitation, recovery and misunderstandings for dine-in sale, quick second-table switch, kitchen status, collection, and conflict.
- Proposed goals (not passed/not pre-approved): first order within about **3 minutes** after simple orientation; no critical error or accidental financial operation; common next action self-explanatory; new staff should not need a technical walkthrough.
- Record per scenario: `PASS / BLOCKED / FAIL`, screenshots or recording from permitted QA data, problem, severity, proposed UI patch, owner feedback.
- P0 blockers must be resolved before UX release acceptance. Technical/regression static tests and prior E2E proofs stay valid *for their code versions* but never replace this acceptance.

## Execution plan and boundaries

A. **Audit** existing desktop/portrait flow using existing repo and owner screenshots; inventory screens by role; file individual reproducible P0/P1 usability gaps. Do not mark any visual defect as reproduced solely from code shape.

B. **Prototype** one cashier-first POS interaction first (table → item → ticket → send → settlement), review with owner before broad restyling. Use separate UX implementation branch/slice, not a silent change to passing PR34. Preserve backend and domain contracts.

C. **Implement and check** focused UI interactions, error/loading/recovery, role gating, responsive RTL, and no regression to other tables/KDS/Billing. No automatic Github Actions; stage manual QA and source/static checks on exact commit only.

D. **Pilot and sign off** with real first-time user scenarios; record actual observations and owner usability acceptance **separately** from technical QA. Only then request owner decisions on PR #34 and UX PR #35 merge/integration sequence.

**Explicit restrictions**: no app merge, deployment, migrations, DB resets, financial/security/backend changes, hardware assumptions, or autonomous agent activation. Existing PR #34 and #35 remain DRAFT. TSST Core remains frozen; skills UNVALIDATED/DEV_AG NOT_READY. Real Memory only via pending governed intake and controlled apply.

## Evidence inventory / baseline

- [UX PR #35](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/35)
- [POS PR #34](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34)
- [UX gate doc](https://github.com/Do7a193/CAFE_RESTAURANT_MS/blob/feat/crms-ux-final-visual-system/docs/gates/CRMS-UX-FINAL-GLOBAL-VISUAL-SYSTEM.md)
- [TSST project status](../status.md)

**Decision:** Owner's explicit first-use usability rejection overrides any earlier phrasing of "UX complete" or "program ready". Do not progress to UX product acceptance or merge solely on green automated tests.

## Implementation slice 007-A — active source ownership and exact base (2026-10-25)

- New independent UX pilot branch: `Do7a193/CAFE_RESTAURANT_MS:feat/crms-cashier-first-ux-pilot`, forked from already-tested POS candidate `5688007cb89fda0444908cbec2bb70ef43302c25`. **This does not merge PR #34** and is not the UX PR #35 branch.
- Active human-supervised owner: TSST Lead. Exclusive scoped paths for this slice: `apps/pwa/src/pages/PosPage.tsx`, `apps/pwa/src/pages/PosPage.test.tsx` and `apps/pwa/src/styles/pos.css`. Do not concurrently edit the same paths from unrelated agents or developers until this pilot is reviewed/handed off.
- Single low-risk operational simplification: keep one-click `فتح ترابيزة أخرى` always available in occupied dine-in ticket; group `بلايستيشن`, `نقل الترابيزة`, and `إضافة طلب للترابيزة` behind an explicit and keyboard-accessible `إجراءات إضافية` disclosure. Preserve all permission guards, current financial/KDS/Edge mutations and backend authority.
- Update targeted component tests to verify default collapsed visibility, expansion, and existing gaming/transfer/additional-order flows. No claim of first-time cashier acceptance until owner reviews actual UI screenshots and newcomer task trial.
- No app production/main/UX base/PR34 merges, financial/DB changes, GitHub Actions or deployment. New code will require owner-local focused Vitest/static gates at exact pilot SHA.

## Implementation slice 007-A delivered — isolated pilot awaiting QA (2026-10-25)

- Separate GitHub branch `feat/crms-cashier-first-ux-pilot` latest commit `b88f1ba43b31b3c90f32b6a88281d041b9521246` based on POS PR34 head `5688007c` (not a merge).
- First operational clutter reduction completed in `PosPage.tsx`, `PosPage.test.tsx`, `styles/pos.css`; direct new-table action exposed, advanced 3 actions grouped behind accessible toggle, close on order switch; current purchase/payment/Edge state logic unchanged. Updated existing tests to cover disclosure, gaming, transfer and additional batch paths.
- [Report and exact Windows QA/handoff](../reviews/CRMS-TSST-007A-CASHIER-FIRST-POS-PILOT.md).
- Pilot tests **NOT RUN**, local UI first-time novice acceptance **NOT MEASURED**. Historical 37/37 POS at base commit cannot be asserted for new SHA.
- PR #34 and PR #35 remain drafts/unmerged; Issue #36 stays P0 OPEN, no release acceptance. No GitHub Actions, app deployment, DB changes, merge or Real Memory canonical apply.

## Owner pilot Vitest failure — initial 35/37 and targeted test synchronization correction (2026-10-25)

- Owner ran exact local pilot branch `feat/crms-cashier-first-ux-pilot` from previously confirmed `b88f1ba43b31b3c90f32b6a88281d041b9521246`; PowerShell screenshot shows **Test Files 1 failed**, **Tests 2 failed / 35 passed (37 total)**. The screenshot error stack points to `PosPage.test.tsx:1176:28` immediately after an occupied-table click and an immediate `getByRole('button', { name: 'إجراءات إضافية' })` lookup. The top portions naming both failed cases are not visible in the supplied image.
- Code review identified two occupied-table regression tests attempting to access the new advanced-actions control synchronously before asynchronous `resumeOccupiedTable` loads the active order, at the corresponding additional-batch cases. **Probable test timing issue**; do not assert proof of resolution without rerun or infer that production business logic failed.
- Minimal **test-only** correction committed to pilot branch: `cfce849b2c52313761c817355fa997669829205f`. Both affected cases now `await screen.findByRole(...'إجراءات إضافية')` after selecting the occupied table before clicking. No change to `PosPage.tsx`, CSS, persistence, financial flows, Edge API or POS PR #34.
- **State: `35_PASS_2_FAIL_ON_PREVIOUS_PILOT / TEST_SYNC_CORRECTION_PUSHED / CURRENT_HEAD_NOT_TESTED`**. Next owner check: clean checkout on pilot branch, `git pull --ff-only`, confirm HEAD `cfce849...`, rerun targeted 37 PosPage tests. If remaining failure occurs, capture test case name and first assertion error instead of only DOM dump. No lint/build/UX signoff until focused tests pass.
- PR #34 and PR #35 remain DRAFT/unmerged; P0 usability acceptance Issue #36 still OPEN; no GitHub Actions, deployment, DB writes or merge.
