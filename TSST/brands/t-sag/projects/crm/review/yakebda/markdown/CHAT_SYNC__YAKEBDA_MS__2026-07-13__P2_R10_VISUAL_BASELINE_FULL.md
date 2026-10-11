YAKEBDA_MS — FULL CHAT SYNC


Date: 2026-07-13
Project Key: YAKEBDA_MS
Memory System: REAL_MEMORY v0.6.3
Scope: From final PR #19 visual acceptance through P0/P1 remediation, merge, and P2 maintainability kickoff with automated visual baseline capture.


1. User decisions and operating rules


- Arabic-first / RTL-first.
- GitHub is the source of truth for code, branches, PRs, CI, and merge state.
- Google Drive is the user-facing Real Memory source of truth.
- Each remediation phase uses a separate PR: P0, P1, P2, and P3 are not combined.
- P2 is maintainability-only: no new feature, API change, migration, or visual redesign.
- Preserve accepted POS Product Grid and KDS geometry.
- CSS deletion/consolidation is blocked until a before-refactor visual baseline exists.
- PRs remain Draft until tests and visual parity are complete. No Ready or merge without explicit approval.


2. Historical GitHub sequence confirmed during this chat


PR #19
- User accepted the final POS cart visually.
- Final validation CI passed on the reviewed head.
- PR #19 was squash-merged into main.
- Merge commit recorded in chat: d52ab28c928e57a75aff249f57032f18f379f27f.


P0 — Security & Finance
- Branch: fix/p0-security-finance
- PR: #20
- Implemented payment integrity, order-number regression coverage, PIN/login rate limiting and lockout, and settings/customer read scoping.
- CI Run #278 was recorded as successful.
- PR #20 was merged.
- Merge commit recorded in chat: ecb0705ccbea4f375d27ed7481f6041b03461ee8.


P1 — Operational Reliability
- Branch: fix/p1-reliability
- PR: #28
- Implemented print-job reliability, refunds/reversals and shift variance, and payment/audit transaction atomicity.
- Final CI after retargeting to main was recorded as successful.
- PR #28 was squash-merged.
- Main after P1: 26bafdced9faa126a120cbdf8a564a84725aa2dd.


3. P2 branch and PR


- Branch: refactor/p2-maintainability
- Base at creation: main @ 26bafdced9faa126a120cbdf8a564a84725aa2dd
- Main P2 PR: #34
- State at this sync: Open / Draft / Mergeable / Unmerged.


4. P2 inventory baseline


- 18 imported CSS files.
- 9,501 CSS lines.
- 1,483 occurrences of !important.
- 7 occurrences of .posx-head.
- 22 occurrences of .posx-grid.
- 6 occurrences of .posx-card.
- 11 physical directional declarations requiring logical properties.
- Pos.tsx: 1,503 lines.


Process files:
- docs/engineering/CSS_CONSOLIDATION_PLAN.md
- docs/engineering/P2_EXECUTION_STATUS.md
- docs/engineering/visual-baseline/p2-before/README.md
- scripts/p2-css-inventory.mjs


5. R10 frontend safety net


Implemented before splitting Pos.tsx:
- Vitest, Testing Library, and jsdom.
- npm run admin:test and normal CI integration.
- Tests for cart totals, quantity, variants, bread deltas, required bread selection, structured variant mapping, payment gating, loading, success-only reset, failure preservation, resolveAssetUrl, Drawer/Modal focus trapping, Escape close, and focus restoration.
- Shared useFocusTrap applied to Drawer and Modal.
- CI Run #297 passed on the R10 validation head before squash into P2.
- CI Run #299 was recorded as passing on the then-current P2 checkpoint.


6. Visual baseline freeze


The user delegated screenshot capture while away. Automated Playwright/GitHub Actions capture was created and corrected until successful.


Screens:
- POS
- KDS
- Orders Detail
- Menu
- Customers
- Users


Viewports/themes:
- 1366×768 Light
- 1366×768 Dark
- 1920×1080 Light
- 1920×1080 Dark


Output:
- 24 PNG screenshots plus manifest.json.
- Stored under docs/engineering/visual-baseline/p2-before/.
- POS fixture contains four cart lines.
- KDS and Orders Detail use a real submitted fixture order.


Internal PR #37:
- Branch: work/p2-visual-baseline
- Closed and merged into refactor/p2-maintainability only.
- Validated head: 00f5147162efbe1d7ce4b6cdc415d1044d530b98.
- Merge commit: 9e85fd18b8a75f3624314b3b38109616dc341244.
- Visual Baseline Run #6 generated and committed the pack.
- Run #8 published the complete artifact successfully.


7. Live GitHub snapshot at this sync


PR #34:
- Open / Draft / Mergeable / Unmerged.
- Base: main.
- Head branch: refactor/p2-maintainability.
- Head SHA: 2ddf9a5d6d090b4d64cb4012c1898154f08b5894.
- 58 commits.
- 60 changed files.
- 10,715 additions.
- 9,071 deletions.


The PR body records the visual baseline as completed and says the next permitted change is incremental .posx-head consolidation.


Important contradiction/risk:
- The PR statistics show the branch advanced materially beyond the earlier checkpoint.
- The PR body may not describe every change on the current head.
- GitHub returned no combined status checks for head 2ddf9a5d6d090b4d64cb4012c1898154f08b5894 during this sync.
- A new chat must verify recent commits, changed files, and workflow runs before continuing, approving, or merging.


8. Planned P2 order


1. Verify the actual current P2 head and reconcile it with the PR body.
2. Consolidate .posx-head incrementally.
3. Consolidate .posx-grid.
4. Consolidate .posx-card.
5. Collapse CSS layers to at most three.
6. Reduce !important by at least 90%.
7. Fix RTL drawer entry direction and remaining physical properties.
8. Split Pos.tsx into focused children while keeping shared state centralized.
9. Run final tests, build, CI, inventory metrics, and screenshot parity.


9. Non-negotiable P2 guardrails


- No API or migration changes.
- No business-logic change.
- No frontend final pricing.
- No Product Grid redesign.
- No KDS redesign.
- theme.css remains the semantic token source.
- global-colors.css remains the final color authority until controlled CSS-layer collapse.
- Screen CSS owns layout and geometry.
- Any visual regression is fixed in the narrowest responsible layer.
- PR #34 stays Draft and unmerged until final visual parity and explicit approval.


10. Immediate handoff


Live-verify PR #34, exact head SHA, latest commits, branch comparison, and workflow runs. If the current head still matches the documented gate, continue with the narrowest .posx-head consolidation checkpoint and compare against the committed before screenshots. If the branch already contains later P2 work, audit and document that work before adding changes.
