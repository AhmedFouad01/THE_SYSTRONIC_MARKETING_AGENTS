# BRIEF — CRM v3 build tracks (Codex)

The task ID is the bus task (for example `CRM-N1` = task **N1** in `specs/BUILD_PLAN_v3.md` §3). The plan is the spec. UI tasks also follow `specs/NAV_AND_SCREENS.md`.

## Tracks: one worktree and one branch per track, one commit per task
| Track | Worktree | Branch | Tasks, in order |
|---|---|---|---|
| A: nav + import | `C:\Work\tsst-crm-codex` | `feat/crm-v3-nav-import` (already checked out) | N1 → N2 → I1 → I2 → I3 |
| B: dashboard | `C:\Work\tsst-crm-lanes\dash` | `feat/crm-v3-dashboard` (already checked out) | D3 → D0 → D1 → D2 → D4 → D5 → D6 |

- Both branches start at `feat/crm-mvp-ui` d95a1ed. Stay on your track's branch. Never touch other worktrees.
- The app lives in `CRM_APP/`. Run `npm ci` once per worktree.
- Commit each task with `feat(crm): <ID> — <goal>`. Never push, merge or rebase.
- **Re-issued IDs (2026-10-07):** the remaining tasks carry an `R` suffix (`CRM-N2R` = plan task N2). The bus no longer gates them, so **claim strictly in the track order above**: the title shows `k/n`. Do not wait for the Lead to close a task; the Lead reviews afterwards.
- **One session = one track.** After `bus done`, claim the next `*` task of the SAME track and continue.
- If the context gets heavy, `bus release <ID> --note "<resume point>"` and stop.

## Rules
- Never read or print `.env`, secrets or connection strings. Port 4317 is the user's: never kill it.
- **Checks:** run the plan's C (lint, typecheck, test:unit, build) or D (C + test:db).
  - Do NOT run the UI suite (playwright) and do NOT do manual visual smoke. Ahmed does the visual review after this batch.
  - Write unit tests for pure state and adapters, as the plan says.
- **D tasks, DB isolation:** use your own database, `crm_lane_dash`.
  - Write a small wrapper outside the repo. It loads `CRM_APP/.env` (branch-only) through `node --env-file`, swaps only the database name in `ADMIN_DATABASE_URL`, `DATABASE_URL` and `AUTH_DATABASE_URL` (if set), then runs migrate and test:db.
  - Print nothing secret. Never use the default DB.
- **Dependencies:**
  - Chart.js 4.5.1 + react-chartjs-2 5.3.1, exact pins, are approved (D0).
  - No other new dependency. If one seems needed, use `bus block` and ask.
- **AR/EN:**
  - Arabic is full RTL and English is equally first-class.
  - Use logical CSS, bidi-isolate mixed names, IDs and URLs, localise digits, and add keys to both locale files.
- **Week start and time zone:** weeks start on Saturday and the time zone is the browser's (CHARTS_CONTRACTS §6). D3 adds the server `week_start`.
- **TOTP is deferred:** "manager + MFA" means the manager role for now.
- **If a check fails twice:** commit WIP as `wip(crm): <ID> …`, then `bus block` with one question. Do not loop.

## Report: write `TSST/brands/t-sag/projects/crm/codex/reports/<ID>.md` (≤ 25 lines)
Include:
- the commit hash and the files changed;
- each check with its counts;
- done_when evidence (one line per clause);
- any deviation from the plan;
- `Skills used:`.

Then run `bus done <ID> --skills-used ...` with the result set to that report file.
