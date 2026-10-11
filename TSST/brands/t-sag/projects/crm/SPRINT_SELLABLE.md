# CRM sprint — sellable release (user-authorised 2026-10-07 07:55, valid until 2026-10-09 10:00 +03:00)

The user (Ahmed) is asleep. They said: run the sprint in other sessions, don't waste tokens, be flexible in review, save time and tokens.

You are the TSST Lead. Rules, environment and boundaries are in `NIGHT_RUN.md` §1 and §6 (same folder): read those two sections only. The decisions you need are already recorded, so do not re-read the ADR or the plans unless the brief for a slice needs them.

## Gates (exit quietly if any fails)
1. If the time is after 2026-10-09 10:00 +03:00, stop.
2. If `C:\Work\crm-night.lock` was modified less than 45 minutes ago, another run is active. Stop.
   - Otherwise write the current ISO time into it.
   - Refresh it after every agent return.
3. If weekly usage is ≥ 99%, write the morning note and stop.
   - If the 5-hour usage is ≥ 90%, update the checkpoint and stop.

## Economy rules (user, binding)
- **One roadmap item per run** (server half, then UI half). Then commit, update the checkpoint and the report, and EXIT. A fresh run takes the next item; small sessions are cheap.
- **Briefs:** one agent per half, narrow brief. Point it at files; do not paste file contents.
  - If an agent hits its turn limit, resume it once. If it fails twice, record it and move on.
- **Lead verification:**
  - Run `lint`, `typecheck` and `test:unit`, plus the item's own db/ui spec.
  - Do not re-run what the agent just ran green unless something looks off.
  - Run the full UI suite once per item, at the end, before commit.
- **CREATIVE gate:** only for a NEW screen. Use 3 shots: EN-light-1440, AR-light-1440 and AR-light-375. Fix only must-fix items; everything else goes in the report as "later".
- **Dependencies:** none beyond those approved in `NIGHT_RUN.md` §6.
- **Commits:** on `feat/crm-mvp-ui` only. No push, no merge into master, no deploy, no AWS or SSH.

## Items (in order; find the first one that is not done)
Find the state from `git log --oneline -15` in `C:\Work\tsst-crm-mvp` and the checkpoint's top lines.

1. **P1b B4.** At handoff (2026-10-07 ~08:00) the day session STOPPED a B4-server agent mid-work, so partial uncommitted changes may be in `src/`, `tests/` and `P1B_CONTRACTS.md`. Have `tsst-dev` assess them, then finish them or stash them (never discard). The B4 server brief is in the checkpoint history; its scope is the B4 row of P1B_PLAN plus the compiler rules in the B0 spike doc. Filter and sort by custom properties.
   - The server half may already be committed. If it is uncommitted in the tree, have `tsst-dev` assess and finish it.
   - UI half: custom columns in the grids (column picker), typed filter rows (in-house, flat; no React Aria), sort by custom columns, and saved views that include them.
   - Also fix gate `audits/2026-10-07/GATE_RECORD_PROPERTIES.md` M1: the "Custom fields" heading takes the panel's section-heading size. M2 (native number inputs) is ACCEPTED as an exception.
2. **Real sign-in — ON HOLD (user, 2026-10-07 16:10):** the user is deciding whether to use an auth library (Better Auth) or a managed service instead of building from scratch. Do NOT build any more auth slices (A2+). Skip to item 3 until this file says otherwise. (Old plan: NIGHT_RUN §5.2.)
   - Server, with a security review by `tsst-dev` SK-007/008 before commit.
   - Then the UI: login page, users and invite page, password reset.
3. **Import** (NIGHT_RUN §5.3).
   - CSV in-house, plus `.xlsx` via `read-excel-file` (approved).
   - Column mapping, preview, duplicate handling, idempotent job.
4. **Dashboard charts** (NIGHT_RUN §5.4).
   - Server aggregate endpoints, then the UI with Chart.js 4.5.1 + react-chartjs-2 5.3.1 (approved).
   - Design reference: MagicPath design-system sections 10–12.
5. **EC2 hosting package** (NIGHT_RUN §5.5). Prepare only; never deploy.

## End of every run
- Append to `NIGHT_RUN_REPORT.md`, **in plain Egyptian Arabic** with English only for file names and commit IDs, 3–6 lines:
  - what was done, with commits;
  - check counts;
  - what is next;
  - anything that needs the user.
- Update the checkpoint's top STATUS line, in English and briefly.
