# CRMS-TSST-001 — POS + UX Merge Readiness Audit

Date: 2026-10-24
Status: `AUDIT_COMPLETE / MERGE_NOT_AUTHORIZED`
Decision: `POS_PR34_CONDITIONALLY_READY_FOR_REVIEW; UX_MAIN_MERGE_NOT_READY`
Scope: Read-only source/ref, historical evidence, risk and governance review; no local Windows tests or production verification executed.
Owner instruction: `CRMS-TSST-001 — POS + UX Merge Readiness Audit`
Project: `CAFE_RESTAURANT_MS` | TSST Lead -> manual DEV review workflow using `TSST-DEV-SK-011/012/015` methods (packages remain UNVALIDATED; no autonomous agent activation).

## 1. Immutable review snapshot / authoritative sources

- Repository: https://github.com/Do7a193/CAFE_RESTAURANT_MS
- `main` `5cb20959b35e17620d799e0026d09d881f2c6ad8` (observed 2026-10-24; 2026-10-12 operational workstream merge).
- UX branch `feat/crms-ux-final-visual-system` `d069073cc17959dbd3e46fffb1ff51d70fe0c332`. Compare to main: **39 ahead / 0 behind**, **17 changed paths**, including 14 CSS, AppLayout TSX and test, BillingPage test and UX gate document; no backend or DB paths.
- POS branch `fix/crms-pos-readd-after-empty-cancel` `ca01c872a0c84039ead2713e102f4cf14a7c863f`.
- https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34 **OPEN / DRAFT / mergeable** to UX base; **7 ahead / 0 behind**, **2 files** `apps/pwa/src/pages/PosPage.tsx` and `PosPage.test.tsx`; +195/-20. No review submissions / review threads recorded at audit time. `mergeable` is mechanical, not an acceptance decision.
- Combined POS+UX to main **46 ahead / 0 behind**, **19 changed paths**. All changed paths are PWA UI, PWA tests, CSS or UX documentation, no direct Edge/financial/migration/authorization changes.
- GitHub open/closed pull collection includes **no PR targeting main from the UX branch** as of this audit; a separate reviewed UX->main PR is required for the staged sequence. Do not mistake an existing branch for a reviewed PR.
- GitHub `main` and UX branch API list `protected:false`; branch protection endpoint returned 403 integration forbidden. Thus formal protection requirements and rulesets were **not inspected**; manual governance must not be inferred from GitHub technical guards.
- PR #34 exact commit combined commit statuses [] and check-runs total_count=0; this means no reported GitHub CI checks, **not** CI failure, since local Windows verification is the project's default policy.
- Separate workstreams: https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/31 (PRINT03, DRAFT, physical hardware gate pending), https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/23 (Settings/Printer, DRAFT, not mergeable at observed snapshot). Neither is part of POS+UX merge.

## 2. Historical local QA / acceptance-evidence boundary

Source: https://github.com/AhmedFouad01/real-memory-os/blob/main/01_PROJECTS/CAFE_RESTAURANT_MS/01_CURRENT_STATUS/CURRENT_STATUS.md and PR #34 2026-10-20 owner-evidence comments. Verified remotely against unchanged POS HEAD on 2026-10-24; **not rerun** on auditor environment.

| Claim | Supporting observation | Audit result / limit |
| --- | --- | --- |
| exact POS candidate and clean working tree | Owner PowerShell `git rev-parse HEAD` = `ca01c872...`, `git status --short` empty (2026-10-20 18:46 local) | Historical exact-head evidence recorded; latest GitHub HEAD unchanged |
| PWA full regression | 22/22 test files, **150/150 PASS**, 0 failures, local owner 2026-10-20 18:08; matching candidate branch; later exact-head verification | Historical PASS; no fresh run in this audit |
| static gates | PWA lint, typecheck, production build PASS following fast-forward to `ca01c872` (2026-10-20 18:04) | Historical PASS; no new source change since |
| targeted POS | 30/30 PASS on preceding `a4fa94a`; later `ca01c872` changed only Error cause preservation and full suite passed | Do not call old 30/30 an exact final-head focused rerun |
| cashier UX safety | Operator screenshot showed actionable conflict warning in ticket; cashier A empty ticket, EGP 0, submit disabled; cashier B had active QA table/item | Manual UI PASS only; does **not** directly prove HTTP 409 trace or DB count |
| responsive UI | Sampled 1366x768, 390x844, 844x390; RTL drawer/backdrop, POS and Billing sample gates per PR/RM | Sampled viewports passed, not accessibility lab or every device |
| printer | PRINT03 physical paper/cash-drawer checks missing | DEFERRED, separate workstream |
| warnings | Gaming test React `act(...)`, Vite JS chunk >500kB | Existing nonblocking technical debt; do not call clean/warning-free |

## 3. Source review of changed behavior

**PR #34 PWA path:** `ensureOrder` requires a selected dine-in table and exposes the missing-table error inside cashier ticket. On 409 `EdgeApiError.code==="conflict"`, it fetches fresh table/tab occupancy; if claimed, it clears stale selection, opens chooser, and displays an actionable Arabic error while preserving the cause. After last-item removal, retaining `selectedTableId` requires removal's authoritative `tableReleased`, exact `releasedTableId`, and fresh `AVAILABLE` table with no live tab. The next item issues a new tab/create-order instead of resurrecting cancelled draft. Source: https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34/files

**Test coverage:** `PosPage.test.tsx` adds mocked-409 display/no duplicate-add, missing-selection visibility, same-table newly opened draft and *different* product re-add cases. Mocks validate PWA behavior; they do not run real concurrent Edge/PostgreSQL operations.

**Backend existing guarantee (source review only):** `apps/edge-api/src/modules/pos/pos.service.ts` `openTableTab` obtains `SELECT ... FROM orders.tables ... FOR UPDATE`, verifies availability/live tab, creates the new tab, and flips table occupancy in one transaction. PWA HTTP client maps actual 409 responses to `conflict`. Real Memory's prior audit additionally notes DB partial unique live-tab constraint, not independently rerun against an actual QA DB in this audit. Do not replace source review with an E2E PASS.

**RESP01 / issue #32:** The UX branch's `apps/pwa/src/styles/pos.css` ends with a trailing `@media(max-width:1050px)` override setting `.pos-workspace { grid-template-columns: minmax(0,1fr) }`, addressing original later-unscoped desktop cascade conflict. https://github.com/Do7a193/CAFE_RESTAURANT_MS/issues/32 is still OPEN; source fix exists and historical viewport smoke passed, but issue disposition needs reconciliation (not evidence the CSS fix is absent).

**UX gate documentation:** https://github.com/Do7a193/CAFE_RESTAURANT_MS/blob/feat/crms-ux-final-visual-system/docs/gates/CRMS-UX-FINAL-GLOBAL-VISUAL-SYSTEM.md starts `IN PROGRESS — FOUNDATION / AUDIT` and its latest observed sections are from 2026-10-17, while Real Memory has later responsive closure/150-pass evidence dated 2026-10-20. No UX->main PR exists. Require a reconciled final gate document / reviewed PR before main acceptance; do not silently promote this workstream to CLOSED.

## 4. Severity-ranked findings

### F-01 — BLOCKING (UX->main release administration)
**Location:** UX branch and UX gate documentation.
**Trigger:** Attempt to merge global UX into main based only on historical PASS screenshot or comparison.
**Consequence:** No integrated scoped PR review/approval and no current self-consistent workstream closure record.
**Remedy:** reconcile final UX acceptance matrix and specific deferrals, update gate doc on UX candidate with source refs, open **UX->main PR**, inspect that exact final diff, record required approvals. Any changes to tested source invalidate affected test evidence; documentation-only changes should be explicitly identified.

### F-02 — BLOCKING (approval gate, not code defect)
**Location:** PR #34, TSST/owner decision rights.
**Trigger:** Mark ready and merge draft PR without owner approval or formal review disposition.
**Consequence:** Unauthorized merge of source despite green historic tests.
**Remedy:** Review PR #34 formally, record scoped residuals and owner approval; then un-draft/merge only by a separate authorized action. No review submissions exist at audit time. Do not confuse the PR's `mergeable=true` or `protected=false` with approval.

### F-03 — IMPORTANT (evidence gap, policy-dependent for standalone POS merge)
**Location:** Cashier two-session concurrency QA.
**Trigger:** Claim fully certified simultaneous occupancy/runtime uniqueness from UI screenshots or mocked Vitest.
**Consequence:** Overstates cashier race proof; backend controls appear sound from source, but the observed real DB/API outcome is narrower.
**Remedy:** If production concurrency E2E signoff is required, perform ONE isolated two-browser cashier contention smoke on QA data, record sanitized HTTP 409 and/or read-only SQL count of active tabs, ensure other cashier has the sole live tab. No writes in production. If explicitly deferred for source/UX-only merge, document the precise accepted risk.

### F-04 — IMPORTANT (stale issue / scope bookkeeping)
**Location:** https://github.com/Do7a193/CAFE_RESTAURANT_MS/issues/32 and UX gate; https://github.com/Do7a193/CAFE_RESTAURANT_MS/issues/33 remains OPEN pending PR #34 acceptance.
**Consequence:** Open issue and stale gate wording can lead to duplicated work or unsupported closure.
**Remedy:** Relate corrected CSS and latest 390x844 evidence to issue #32; close only after owner-approved resolution. Keep #33 open until PR #34 is accepted/merged according to project policy.

### F-05 — SUGGESTION (technical debt, post-merge)
Document Gaming React `act(...)` warning, Vite >500kB chunk, future automated contrast/accessibility and session-refresh recurrence only if issue recurs. No basis from this audit for changing finance authorization or redoing previously successful operational gates.

## 5. Explicit decision matrix

| Gate | Decision |
| --- | --- |
| Source compatibility POS->UX / ancestry | `PASS`: +7/-0, 2 isolated files, GitHub says mergeable |
| POS local historical PWA regression | `HISTORICAL PASS`: 150/150 at matching current HEAD per owner evidence; not rerun |
| POS UI cashier conflict notice | `PASS_WITH_LIMIT`: browser-visible warning + safe empty basket; HTTP409/DB not evidenced |
| POS PR #34 technical review | `CONDITIONALLY READY TO ENTER FORMAL REVIEW` (no blocking source defect confirmed in inspected diff) |
| Formal PR review and owner approval | `PENDING`; **NO MERGE** |
| UX feature branch scope check | `PASS` UI/tests/CSS/doc only, +39/-0, but this is not UX acceptance |
| UX final gate document/issue reconciliation | `NOT COMPLETE` |
| UX->main PR | `MISSING`; **NOT READY FOR MAIN MERGE** |
| Local CI / GitHub check-runs | `NONE REPORTED` by design; local verification is authoritative |
| Strict concurrent Edge/Postgres race E2E | `NOT VERIFIED`; assess requirement rather than asserting FAIL |
| Thermal printer/drawer | `DEFERRED / OUT OF THIS MERGE SCOPE` |
| Production deployment | `NOT ASSESSED / NOT AUTHORIZED` |

## 6. Recommended bounded next actions

1. Reconcile the UX gate's `IN PROGRESS` text with the 2026-10-20 150/150 evidence and responsive closure; list explicit deferrals rather than reopening completed checks.
2. Prepare a UX->main PR (separate authorized workflow), while preserving PR #34's base as UX; no automatic merge.
3. Record PR #34 review disposition, especially requirements: new order not resurrected, cashier 409 feedback, stale occupancy handling, and no backend/finance change.
4. Decide whether strict HTTP409/DB QA evidence is required for this release gate. If required, perform only the focused QA-data test; do not rerun 150-suite gratuitously.
5. After owner approval, planned order: POS PR #34 -> UX branch; refresh/review UX->main PR; UX -> main; perform targeted post-merge POS/dashboard/nav smoke and inspect final HEAD. Printing remains a different gate.
6. Update Real Memory via separate pending `rm-sync` intake and reviewed write-plan/controlled apply; never overwrite canonical RM status just because audit report exists.

## 7. Execution accounting / provenance

Verified read-only via connected GitHub API on 2026-10-24: repo branch heads; PR #34/#31/#23, PR #34 2-file diff; main/UX/POS compare; PR reviews/review threads; 0 GitHub check-runs and 0 commit statuses; issue #32/#33; `pos.service.ts`, `PosPage`, `PosPage.test.tsx`, `pos.css`, `EdgeApiError`, and UX gate. Read historical source: Real Memory CAFE status and owner PR #34 comment. Branch protection policy access denied (403). No local runtime, fresh Windows build, physical devices, PostgreSQL query, GitHub Actions, PR mutation, branch mutation, merge, customer data mutation, or deployment performed.

**Final recommendation:** `HOLD GLOBAL UX MERGE`. POS #34 has a strong, isolated candidate and matching historical gates, but remains draft and unreviewed in GitHub. Complete the narrow governance/evidence closure without reopening the finished implementation.
