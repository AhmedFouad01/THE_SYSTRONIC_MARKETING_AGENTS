# CRMS-TSST-003 — POS PR #34 Formal Source Review / Release Signoff Gate

Date: 2026-10-24
Project: `CAFE_RESTAURANT_MS`
Method: TSST Lead-supervised **manual static code review** using practices from SK-011 (test mapping), SK-012 (change-risk review), and SK-015 (verify-before-completion). Skill packs remain `UNVALIDATED`, DEV_AG `NOT_READY`; this is **not** autonomous execution or skill certification.

**Decision: `CONDITIONAL SOURCE REVIEW PASS / RELEASE SIGNOFF PENDING / NO MERGE`.** Scoped change appears correct against the stated POS recovery acceptance criteria; no new blocking defect was confirmed in the inspected two-file diff. This report is not a GitHub `APPROVED` review, a fresh test result, or owner merge authorization.

## Scope and frozen refs

- [POS PR #34](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34): `fix/crms-pos-readd-after-empty-cancel` at `ca01c872a0c84039ead2713e102f4cf14a7c863f`, OPEN/DRAFT/UNMERGED, +7 commits, exactly 2 changed paths, 195 additions/20 deletions compared to merge base:
  - `apps/pwa/src/pages/PosPage.tsx`
  - `apps/pwa/src/pages/PosPage.test.tsx`
- UX target branch `feat/crms-ux-final-visual-system` at `1bcb7cf62318d324b9bf26364d5cff240f9b2420`, after documentation-only TSST-002 commit, yielding **POS ahead 7 / behind 1**; merge base remains `d069073cc17959dbd3e46fffb1ff51d70fe0c332`. Behind commit is only updated UX gate doc. No source rebase or merges were performed.
- [UX draft PR #35](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/35) targets `main`, OPEN/DRAFT/UNMERGED, and has no POS PR #34 implementation yet.
- At latest check GitHub PR #34 reported technically mergeable, but is still DRAFT and has no submitted GitHub reviews/review threads. Zero GitHub check-runs are recorded. Project uses manually captured local Windows gates and `workflow_dispatch` workflows.
- [Original acceptance issue #33](https://github.com/Do7a193/CAFE_RESTAURANT_MS/issues/33) remains open.

## Review coverage — traced actual changed code against contracts

| Behavior | Source-level check and result |
| --- | --- |
| Missing table selected | `PosPage.ensureOrder` sets chooser open and throws precise Arabic error; bottom cashier-ticket `role="alert"` introduced so operator sees it. `PosPage.test.tsx` verifies no tab/order API called. **PASS** |
| Cancel last item | Existing Edge `removeOrderItem` cancels empty draft inside transaction; response includes `orderCancelled/tableReleased/releasedTableId/tableTabId`. PWA now re-reads occupancy; selection retained only when exact `releasedTableId===selectedTableId`, table active/AVAILABLE, and no live tab. Source matches API type and backend response. **PASS** |
| Re-add new item, no resurrected order | Code resets `order` and old intent IDs on cancellation. Subsequent product click opens a fresh tab and creates new order; tests check separate tab and order IDs with different product. **PASS for mocked frontend contract**, not runtime E2E |
| Another cashier claims table | Real `openTableTab` obtains `SELECT ... FOR UPDATE`, checks live tabs/table availability and returns conflict mapped by `pos.controller` to HTTP 409; PWA `edge-api/client.ts` maps 409 to `EdgeApiError.code==="conflict"`. New catch path refreshes tables/tabs, clears stale selection and tab request intent and shows actionable Arabic ticket alert when claimed. Test simulates 409 and asserts no order/item added. **SOURCE/API MAPPING PASS** |
| Occupied table after observed release | Fresh occupancy gating prevents automatic retention if occupied on the first refresh; later claim between refresh and new open is blocked by backend + UI 409 recovery. **PASS as source design** |
| Accessibility/error placement | Error moved from off-screen global alert to ticket summary for dine-in with no current order; no duplicated global alert in that state; role alert preserved. User browser screenshot on 2026-10-20 confirms visible notice and disabled send. **SAMPLING PASS** |
| State and permissions | `canOpenTable` and `canManageOrder` checks untouched, backend guards authoritative. No direct changes to KDS, Billing, DB, financial/pricing logic, printing or security policy. **SCOPE PASS** |

## Historical test evidence (not rerun in this task)

- Owner's local Windows on exact `ca01c872...` candidate: **PWA 150/150**, **22/22 test files**, 0 failures on 2026-10-20; PWA typecheck, lint and production build PASS; clean `git status --short` and exact `git rev-parse HEAD` recorded at 18:46. Canonical [Real Memory status](https://github.com/AhmedFouad01/real-memory-os/blob/main/01_PROJECTS/CAFE_RESTAURANT_MS/01_CURRENT_STATUS/CURRENT_STATUS.md) and PR #34 historical comments contain details.
- Focused POS **30/30** PASS was measured on predecessor `a4fa94a`; final `ca01c872` only preserved error `cause`, with full 150/150 re-run. Do not attribute the 30/30 isolated run to newer commit.
- Browser A/B manual UX screenshot: cashier A alert at ticket, 0.00 EGP total, send disabled, cashier B had an active table/item. **Browser-facing UX verified**, **HTTP 409 trace / PostgreSQL live-tab cardinality not directly captured**.
- No TSST runner / Windows local build / fresh PWA tests, actual two-browser QA session, DB query or physical printer test was run here. GitHub commit check-runs reported none; don't call this a CI failure.

## Findings / risk disposition

### R-01 — IMPORTANT / formal release-evidence gate (NOT a confirmed code defect)
**Location:** table claim recovery across PWA <-> Edge <-> PostgreSQL.
**Trigger:** two cashiers attempt to open the newly released table nearly simultaneously, or cashier A has stale AVAILABLE data while B has already claimed it.
**Risk:** actual live conflict/DB uniqueness is supported by source/previous manual UI, but 409 Network response and one-live-tab DB query were not independently recorded as real concurrent E2E outcome. Mocks don't verify transaction serialization.
**Recommended release condition:** one narrowly scoped QA-only A/B contention scenario; capture sanitized Network POST `/pos/table-tabs` status 409 (no Authorization headers/tokens), confirm single active tab using safe read-only query if available, and no second cashier order/items, visible alert. If owner chooses to defer, record explicit risk acceptance. No need to rerun all 150 tests for this read-only evidence.

### R-02 — IMPORTANT / negative-path test coverage
**Location:** `apps/pwa/src/pages/PosPage.test.tsx` re-add tests, changeQty branch.
**Finding:** New tests prove successful released/available case and mocked 409; they **do not directly assert** the negative retention cases `tableReleased=false`, mismatched `releasedTableId`, table marked `OCCUPIED` on fresh occupancy, and failed occupancy refresh after cancellation. Other existing tests use `tableReleased:false` for different cleanup operations, not this exact remove-last-item branch.
**Risk:** future regressions could retain stale table choice or show outdated canceled draft on a refresh failure. The refresh-failure-after-cancel handling existed before this PR; do not mischaracterize it as a new confirmed defect.
**Remedy:** add a small data-driven negative-path Vitest test slice under a **separately authorized** follow-up if mandatory for release; if not mandatory, log focused test debt. No code was changed by review.

### R-03 — MINOR / known UX residual
When PWA catches a conflict but the subsequent occupancy read fails or returns no occupied indication, it preserves and rethrows the original error. User sees generic conflict rather than the more actionable "other cashier" text. Deliberate conservative behavior; avoid clearing a selection without authoritative evidence. Test fallback behavior later if desired.

### R-04 — PROCESS BLOCKER / owner approval, not a code defect
- PR #34 remains DRAFT, no formal GitHub `APPROVED` reviews on record, and explicit authorization to merge PR #34 -> UX is not provided.
- PR #35 UX->main remains separately DRAFT. A combined final review cannot occur until a separately approved POS integration advances UX. Since latest UX tip has one doc-only commit not in POS branch, reconcile exact merged candidate SHA and perform targeted post-integration smoke under authorized change.
- Do not declare fresh final-merged-HEAD suite PASS on current historical test screenshots.
- The related Issue #33 should not close until PR acceptance; issue #32 is separate responsive CSS work. Printing #31 and hardware remains separate/DEFERRED.

## Reviewer decision / release gates

| Gate | Decision |
| --- | --- |
| Changed source contract and immediate POS fix behavior | `PASS — reviewed source diff` |
| Backend 409 mapping, transaction lock and authoritative occupancy | `PASS — inspected code (not a fresh live race)` |
| Added unit tests and scope | `PASS WITH GAP — nominal paths covered; negative path not direct` |
| Historical owner full regression | `150/150 PASS` on original HEAD, **not rerun by TSST** |
| New runtime HTTP409 / DB uniqueness end-to-end | `NOT VERIFIED` — targeted acceptance decision |
| Formal source reviewer disposition | `CONDITIONAL CODE REVIEW PASS` in TSST report + informational PR comment; **no GitHub review approval submitted** |
| PR #34 readiness for unsupervised merge | `NO` — remains DRAFT and owner approval missing |
| UX PR #35 main merge | `NO` — still separate and pending integrated review |

**Recommended next:** record one targeted real QA two-cashier contention test as `CRMS-TSST-004` only if release signoff requires it, or obtain explicit owner deferral; then owner may approve POS merge separately. Do not run CI, merge, rebase or modify app from this review's authority. Keep branch-specific and QA evidence traceable.

## Change-accounting and boundaries
Task assignment was registered first at [CRMS-TSST-003 task](https://github.com/AhmedFouad01/THE_SYSTRONIC_MARKETING_AGENTS/blob/master/TSST/projects/cafe/tasks/CRMS-TSST-003-POS-PR34-FORMAL-REVIEW.md), preceding this review and PR commentary. Source inspection used GitHub connector over current files/ref and historical owner evidence. No autonomous AI agents executed or skill packs promoted. No POS/source, DB, finance, printing, CI, merge, deployment or canonical Real Memory changes.
