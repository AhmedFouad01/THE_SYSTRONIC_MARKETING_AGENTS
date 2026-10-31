# DASH-SIMPLE-001: continue on the Mac (Lead handoff, 2026-10-31)

Work moves from the Windows PC to Ahmed's Mac. Start as usual (`AGENTS.md` → `TSST/core/rules.md`), then read
`DASH-SIMPLE-001-PLAN.md` (the plan + R60 table + step status). Reply to Ahmed in plain Egyptian Arabic.

## Where things are
- **TSST system:** this repo, branch `master`. It was pushed at `0c12b38`.
- **Dash code:** `AhmedFouad01/tsst-portal`, branch `main` = `2d9c851`. That is PR #25 (UX12 fixes, live) + PR #26 (the wipe script).
- **Live:** `https://dash.the-systronic.com`, release `644206b4b`. All work was wiped on 2026-10-31. Clients, packages, links and accounts were kept.

## State
- Steps 0–2 are done.
- **Step 3 is waiting for Ahmed's OK:** the screens in `simple-001/` (8 pages, Lead R55 accepted; see the R1 sections of
  `DASH-AG-021-SIMPLE-DESIGN.md`).
- **Next, step 4 (build):**
  - Write `DASH-AG-022` for Antigravity. It builds `simple-001` into `web/`; Codex reviews; the Lead compares live with design (R57).
  - Inputs:
    - The R60 table and its 2 guardrails (owner OK).
    - The Codex old-path list (`CX-SIMPLE-000-COUNT_out.md` part A). Post screens still write via the old path, so that is step 5.
    - The duplicate item count on the job page.

## Windows-only (not on the Mac yet)
- **SSH key for the server** (`tsst-portal-key-fra.pem`): needed for deploy / DB.
  - Ahmed copies it by hand to `~/.ssh/` (`chmod 600`). Never put it in the repo.
  - `scripts/deploy.sh` reads `TSST_KEY`.
- **Google Drive:** backups (`TSST-Backups/dash/db`) and the `TSST/brands` junction (clients). Add Drive for desktop if needed.
- **Old worktrees** (`C:\Work\tsst-portal-*`) and Claude's memory stay on Windows. Rules live in `rules.md`, so nothing is lost.

## One machine at a time
Pull before you start, and commit + push when you stop. The Windows copy still has other sessions' uncommitted files
(Motion, ANVIL, design-gate…): they are not part of this work.
