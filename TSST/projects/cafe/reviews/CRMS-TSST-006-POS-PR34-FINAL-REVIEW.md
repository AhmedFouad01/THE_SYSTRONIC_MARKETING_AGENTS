# CRMS-TSST-006 — POS PR #34 final review checkpoint (pre-merge)

Date: 2026-10-25
Project: `CAFE_RESTAURANT_MS`
PR: https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34
Review method: supervised manual GitHub diff/source examination and reconciliation of owner Windows QA. No independent CI, Docker, production or dev server execution by the reviewer.

## Current disposition

**`FINAL_DIFF_REVIEWED / ADDITIONAL_SAFETY_FIX_APPLIED / EXACT_HEAD_QA_PENDING / NO_MERGE`.**

The 2026-10-25 owner Windows PASS for the 35 focused tests, PWA typecheck, lint and build pertains to **`febc7e75e3539a89531365d2b0161bd7be474e59`**. Review found one further concrete post-commit/cancelled-order state-reconciliation defect in existing code, which was fixed in two narrowly scoped commits. The latest **`5688007cb89fda0444908cbec2bb70ef43302c25` has not been independently tested**. The 35/35 and build PASS must **not** be carried forward to it.

## Exact change refs and scope

- Before review: POS branch HEAD `febc7e75e3539a89531365d2b0161bd7be474e59`.
- Source safe fallback commit `ef0dcc737842ea5dc83581c44dcdc43714bc314e`.
- Added two Vitest parameterized cases commit `5688007cb89fda0444908cbec2bb70ef43302c25` — **new HEAD**.
- Files touched: `apps/pwa/src/pages/PosPage.tsx`, `apps/pwa/src/pages/PosPage.test.tsx` only, +23/-10 code lines and +41 test lines versus former HEAD; no Edge API/DB/finance, KDS or printing edits.
- New total expected focused POS tests: **37** (previously passing 35 + 2 new cases). `37/37` is only an expected count, **not a claimed PASS**.
- Branch comparison versus UX tip `1bcb7cf62318d324b9bf26364d5cff240f9b2420`: **11 commits ahead, 1 behind**, with one non-code UX gate-doc commit absent from POS branch. Current PR target is the UX branch. UX->main PR #35 remains independent and DRAFT.

## Review findings

| ID | Severity | Source and evidence | Decision |
| --- | --- | --- | --- |
| F01 | RESOLVED IN SOURCE — pending tests | Removing last item cancels the draft on Edge, but a later `refreshOccupancy()` failure could leave cancelled order on screen. TSST-005 fix at `febc7e75`, owner 35/35 focused PASS, typecheck/lint/build PASS for that SHA. | No rework required for this path; **new HEAD not yet tested** |
| F02 | IMPORTANT — FIXED IN SOURCE / new test pending | In `changeQty`, when `orderCancelled=true`, `tableReleased=false`, an asynchronous `listPosOrders` or subsequent `getPosOrder` failure occurred *after* Edge committed cancellation; the catch in `runMutation` showed a generic error but retained the already-cancelled order state. UI could display a stale active ticket. | Wrapped remaining-order reconciliation in a fail-safe catch: discard cancelled `order`, clear `selectedTableId`, open chooser, provide manual refresh warning. Two distinct negative tests cover list failure and detail failure. **Not runtime-verified yet** |
| F03 | HISTORICAL SCOPED E2E PASS | Old SHA `ca01c872`: owner observed A stale-choice real HTTP 409 and actionable warning/disabled send; QA-T03 post-action DB `1 live tab / 1 order / 1 item` matching B draft. Both sessions showed `System Owner`. | Useful source-behavior precedent, **not new current SHA E2E**; no two-distinct-identity stress PASS |
| F04 | NONBLOCKING PERFORMANCE | Previous PWA build on `febc7e75` emitted Vite chunk > 500 KB warning, without error. | Defer code splitting to performance issue; not part of POS functional fix |
| F05 | MERGE GOVERNANCE | PR #34 `OPEN/DRAFT`, no submitted reviews on GitHub, mechanically mergeable in previous metadata check. UX branch doc-only one-commit drift, and UX->main PR #35 separate DRAFT. | Cannot merge or mark approved without explicit owner authorization, and cannot claim current HEAD verified |

## Minimum correct next step

With owner local clean working tree on `fix/crms-pos-readd-after-empty-cancel` and any running PWA/Edge watchers stopped, do `git pull --ff-only origin fix/crms-pos-readd-after-empty-cancel`, confirm HEAD is `5688007cb89fda0444908cbec2bb70ef43302c25`, and run only `PosPage.test.tsx` Vitest once. If it passes, run PWA typecheck, lint and build at the *same exact new SHA*; record evidence. Do not indiscriminately rerun historic full suite.

After new exact-head checks PASS, perform formal source review disposition (with optional focused browser cancellation case if owner requires) and separately obtain owner's explicit permission for POS PR34 -> UX branch merge. After that, re-evaluate combined UX draft PR35 with its exact integrated HEAD and a separate owner merge decision into main. No automatic execution of either merge.

## Rules and audit trail

- Task [CRMS-TSST-006](../tasks/CRMS-TSST-006-POS-PR34-FINAL-REVIEW.md) registered before new source edits.
- TSST skill packs remain UNVALIDATED, DEV_AG NOT_READY; review was manual supervised and does not qualify as activating agents/skills.
- No GitHub Actions, PR merge/rebase, deployment, production writes, financial/permissions changes or canonical Real Memory promotion.
