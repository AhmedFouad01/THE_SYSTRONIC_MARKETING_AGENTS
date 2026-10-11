CHAT HANDOFF — YAKEBDA_MS


Date: 2026-07-13
Active target: PR #34 / P2 Maintainability


Do not restart the project or reopen P0/P1.


Startup order
1. Read latest Project Work Instructions.
2. Read latest Current Status.
3. Read this Handoff.
4. Verify GitHub live state for PR #34 before any code change.
5. Check exact head, recent commits, changed files, branch comparison, and workflow runs.


Live anchor at sync
- Repository: AhmedFouad01/yakebda-ms
- main baseline: 26bafdced9faa126a120cbdf8a564a84725aa2dd
- PR #34: Open / Draft / Mergeable / Unmerged
- Branch: refactor/p2-maintainability
- Head: 2ddf9a5d6d090b4d64cb4012c1898154f08b5894
- 58 commits / 60 changed files


Important warning
The PR body says the next gate is .posx-head consolidation, but the branch statistics indicate substantial additional work may already exist. Do not trust the PR body alone. Audit the current head and update the status before continuing.


P2 completed checkpoints
- CSS/Pos.tsx inventory baseline.
- R10 Admin frontend test harness and behavioral coverage.
- Shared Drawer/Modal focus trap.
- Visual baseline pack: 24 screenshots plus manifest.
- Internal PR #37 merged into P2 only.


Visual baseline location
- docs/engineering/visual-baseline/p2-before/


Baseline matrix
- POS, KDS, Orders Detail, Menu, Customers, Users
- 1366×768 Light/Dark
- 1920×1080 Light/Dark


P2 intended order
1. Reconcile actual current head with documented status.
2. .posx-head consolidation.
3. .posx-grid consolidation.
4. .posx-card consolidation.
5. CSS layer collapse to at most three files.
6. !important reduction by at least 90%.
7. RTL drawer/logical properties.
8. Split Pos.tsx into focused components.
9. Final CI and visual parity.


Guardrails
- No API or migration changes.
- No new feature work.
- No business-logic changes.
- No Product Grid or KDS redesign.
- Preserve Arabic RTL.
- Backend quote remains final pricing authority.
- Keep global-colors.css as final color authority until the planned layer-collapse checkpoint.
- PR #34 remains Draft and unmerged.


Immediate next action
Verify the actual branch state and latest CI. Continue only from the latest confirmed checkpoint. If .posx-head is still the next gate, make the narrowest possible change and compare against the committed baseline screenshots before proceeding.
