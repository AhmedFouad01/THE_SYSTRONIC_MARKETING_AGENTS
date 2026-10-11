# CHAT HANDOFF — YAKEBDA_MS


Date: 2026-07-13
Next phase: P2 Maintainability
Repository: AhmedFouad01/yakebda-ms
Verified main: `26bafdced9faa126a120cbdf8a564a84725aa2dd`
Open PRs at handoff: none


## Read first


1. PROJECT_WORK_INSTRUCTIONS v1.5 dated 2026-07-13.
2. CURRENT_STATUS dated 2026-07-13 for P0/P1 merged and P2 ready.
3. Latest FULL CHAT SYNC for P0/P1 merged and P2 ready.
4. YKMS-P2-MAINTAINABILITY-FIXES.md.


## Confirmed completion


- P0 PR #20 merged to main.
- P1 PR #28 merged to main.
- Final P1 CI Run #288 passed.
- main is exactly the P1 merge SHA above.
- P2 has not started; no P2 branch or PR exists.


## Start here


Live-verify main and open PRs, then create branch `refactor/p2-maintainability` from current main only.


The first commit must be Inventory and Visual Freeze, not code refactoring.


## First checkpoint deliverables


- CSS import inventory from apps/admin/src/main.tsx.
- Per-file CSS line count and important-rule count.
- Duplicate-selector map for posx-head, posx-grid, and posx-card.
- Current LOC of apps/admin/src/pages/Pos.tsx.
- docs/engineering/CSS_CONSOLIDATION_PLAN.md.
- Reference screenshots at 1366x768 and 1920x1080 for POS, KDS, Orders detail, Menu, Customers, and Users.




## Execution order


1. Inventory and screenshots.
2. R10 frontend test safety net and CI wiring.
3. R8 CSS consolidation incrementally with parity checks.
4. R9 POS extraction one component per checkpoint.
5. Final visual and CI gate.


## Constraints


- No redesign; rendered output must stay identical except the specified RTL drawer direction and focus behavior.
- Preserve accepted POS AppShell, Product Grid, KDS, and Arabic RTL.
- Keep semantic color ownership; do not replace the global layer with raw color literals.
- Do not bulk-delete CSS files. Move rules, verify, then delete emptied files.
- Keep shared POS state in the orchestrator; no duplicate state.
- No API or migration changes in P2.
- No new feature work.
- No Ready, merge, rebase, or retarget without explicit user approval and exact live SHA verification.


## P2 target state


- No more than three CSS files.
- Important-rule usage reduced by at least 90 percent.
- One authoritative rule per component.
- RTL drawer enters from the right; focus trap active.
- Pos.tsx under roughly 300 LOC as orchestrator.
- Frontend tests run in CI and are green.
- Final report contains before/after metrics and screenshot parity evidence.
