# CRMS-TSST-007A — Cashier-first POS interaction pilot (isolated)

Date: 2026-10-25
Owner input: Current interface complexity remains unacceptable for ordinary cafe staff.
Status: **PROTOTYPE_SOURCE_DELIVERED / OWNER_USABILITY_REVIEW_PENDING / TESTS_NOT_RUN**.

## Branch and revision integrity

- Repository: `Do7a193/CAFE_RESTAURANT_MS`.
- Isolated new pilot branch: `feat/crms-cashier-first-ux-pilot`, forked from POS PR #34 head `5688007cb89fda0444908cbec2bb70ef43302c25`. **No PR34, PR35 or main merge**.
- Pilot last authored commit `b88f1ba43b31b3c90f32b6a88281d041b9521246`. Five pilot commits total, 5 ahead / 0 behind the exact base snapshot.
- Changed exactly 3 frontend paths vs pilot base: `apps/pwa/src/pages/PosPage.tsx` (+47/-30), `apps/pwa/src/pages/PosPage.test.tsx` (+16/-1), `apps/pwa/src/styles/pos.css` (+59).
- Original POS branch remains untouched (GitHub PR #34 open/draft); UX PR #35 stays open/draft/unmerged; no backend/domain/DB changes.

## Behavior of the first, deliberately narrow slice

The problem in source: the dine-in ticket's operational action bar permanently shows `بلايستيشن`, `نقل الترابيزة`, (when eligible) `إضافة طلب للترابيزة`, and `فتح ترابيزة أخرى`, which competes with order/cart actions for limited viewport space. This is a **source-confirmed density hazard**, not an independently observed novice user failure for each button.

Pilot behavior:
1. **Keep "فتح ترابيزة أخرى" visible** as common cashier workflow, preserving exact `parkCurrentTableOrder` handler and disabled state.
2. Provide **"إجراءات إضافية"** button, default collapsed, with native keyboard-operable button and `aria-expanded`; conditionally reveal unchanged gaming, transfer and additional-batch buttons. The toggle becomes `إخفاء الإجراءات` on expand; aria-controls only references mounted target.
3. Add dedicated responsive CSS for clearly spaced quick and advanced actions at desktop and two-column touch-ready minimum-42px buttons below 700px.
4. Reset advanced disclosure when order ID changes to avoid leaking expanded state across table switches.
5. Update existing unit tests to assert no optional actions on initial load, toggle expansion/collapse and preservation of base quick action; adapt existing tests for additional batch, gaming and table transfer to first expand the advanced controls.

## Deliberate non-changes / safety

- No mutation handler, Edge API, idempotency, permission guard, finance/payment/billing, kitchen status, table release, printing or DB behavior modified.
- No other screens redesigned, no overall novice flow acceptance claimed. This is **PILOT 1 of many**, not closure of UX P0 Issue #36.
- **No Vitest/typecheck/lint/build or responsive browser smoke was executed at the new pilot HEAD by the assistant**. Prior 37/37 etc succeeded on its parent, not this branch. Do not claim new test PASS or merge readiness.
- TSST Lead supervised; DEV_AG NOT_READY / skills UNVALIDATED; no autonomous agent activation, Core modifications, GitHub Actions, deployments or DB writes.

## Manual gate on owner Windows

After ensuring a clean local working tree and stopping any PWA/Edge dev watchers which could confuse results:

```powershell
cd C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS
git status --short
git fetch origin feat/crms-cashier-first-ux-pilot
git switch -c feat/crms-cashier-first-ux-pilot --track origin/feat/crms-cashier-first-ux-pilot
git rev-parse HEAD
```

Expected SHA `b88f1ba43b31b3c90f32b6a88281d041b9521246` at time of this checkpoint. If local branch already exists, use `git switch feat/crms-cashier-first-ux-pilot` and fast-forward; never force reset user work.

Then run the **focused POS tests**: `pnpm.cmd --dir apps/pwa exec vitest run src/pages/PosPage.test.tsx --config vitest.config.ts --pool=threads --maxWorkers=1 --no-file-parallelism`. Expected count **37**, but PASS is NOT yet observed. If verified, next typecheck, lint, build. Finally capture owner browser screenshots desktop 1366×768 and mobile 390×844, showing regular ticket and expandable actions (no real payment/mutation without QA fixtures). Test when changing table/order ID, and the four advanced paths already covered in updated unit tests.

## Decision and next work

- Request owner review of actual simplified pilot and feedback on what is still confusing.
- Do not combine with PR #35 or merge PR #34 without distinct approvals. After owner review, prioritize step-guided first-order flow, terminology, large touch targets, quick access to products/ticket, kitchen/payment handoff and onboarding trial in separate bounded slices.
- Gate remains **OPEN P0**, not product-finished.

Links: [GitHub Issue #36](https://github.com/Do7a193/CAFE_RESTAURANT_MS/issues/36) · [TSST-007 task](../tasks/CRMS-TSST-007-CASHIER-FIRST-USABILITY-GATE.md) · [POS PR34](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34) · [UX PR35](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/35).
