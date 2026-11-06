# Dash sprint board (S0–S6)

The only source of truth for sprint progress. Every session reads this first and updates it in the same turn a ticket moves.
A ticket is never written as merged without its PR and its checks next to it.

- Plan (each ticket's `what` and `acceptance`): `~/Work/DASH-SPRINT0/sprint0-final.json` → `sprint_plan` (on this Mac, outside git).
- Report with Ahmed's approvals table: `~/Work/DASH-SPRINT0/SPRINT0-REPORT-AR.md`. Evaluation: `~/Work/DASH-EVALUATION-2026-11-05.md`.
- Mockups: `~/Work/DASH-SPRINT0/mockups/01..09`. Ticket files: `tickets/<id>.md` (written when a ticket starts).
- Product repo: `~/Work/tsst-portal` (GitHub `AhmedFouad01/tsst-portal`, branch `main`). Live: https://dash.the-systronic.com.

## Now
- Live release: `6290115` (PR #27), since 2026-11-04. `main` is at `8915d14` (S0-01 merged, **not deployed**).
- **Ahmed, 2026-11-06: build first, deploy later.** No deploy yet, not even S0. `main` stays as it is (deployable with
  S0 alone); all new work goes to the integration branch `next`.
- Approved to build now: **S1-01, S1-03, S1-04, S1-05, all of S2, then S3** (mockups 01–03). Not approved: S1-02
  (needs Ahmed's access), S4–S6 (mockups 04–09 not approved), any deploy, any migration on production.
- Runs as a self-paced loop in one session. Current ticket: see the first row below that is not `merged`.
- Next owner stops: the S3 preview (Ahmed sees the built client page next to mockups 01–03), then the deploy plan.
  Proposed deploy order: S0 alone → S1 → S2 (migrations, after the restore drill) → S3, each in quiet hours.
- Deploy facts kept for later: this Mac's public IP changes within hours (three values on 2026-11-05) and port 22 did
  not answer from it, so read the IP at deploy time, Ahmed puts that one in the AWS SSH rule, and the deploy starts right after.

## Operating rules
1. **One ticket = one branch = one PR into `next`.** The branch is cut from `origin/next` in its own worktree. Never work
   on `main` or `next` directly, and no ticket PR targets `main` (since 2026-11-06): `main` must stay deployable with S0 alone,
   and `scripts/deploy.sh` refuses to run while a ready PR into `main` is open. `next` goes to `main` only at a deploy gate.
2. **Checks before a PR is merged:** `npm ci`, root typecheck, lint, `npx vitest run --no-file-parallelism`; plus the web typecheck,
   build and tests when `web/` changes. Until S1-03 is merged the checks run on this Mac and are written on the ticket; after it,
   CI must be green on the PR too.
3. **Independent reviewer on every PR:** a team agent (R1, `tsst-dev`) that sees only the diff and the acceptance list. Its findings
   are fixed or answered before the merge. Merge only when the checks are green and the reviewer says pass.
4. **The loop stops only at owner gates:** a decision a ticket needs, the S3 preview for Ahmed's approval, a Postgres install,
   restore-drill access, every deploy and every migration on production. It also stops on red checks on `next` or `main`.
5. **Deploys only with Ahmed's OK in chat**, in quiet hours (see Deploy below).
8. **Migrations are written and tested on a local database only.** Nothing touches production before a deploy gate, and the
   restore drill (S1-02) comes before any deploy that carries a migration.
9. **Preview before a deploy:** Ahmed sees the built pages, not only mockups: the real server and web from `next` on a local
   database seeded like `mockups/SAMPLE-STATE.md`, with EN 1440 light and AR 390 dark screenshots next to the mockups.
6. **Never touched by the loop:** `/etc/tsst-portal/portal.env`, `.env` files, `*.pem` contents, `~/.ssh`, AWS, DNS, mail or
   WhatsApp providers. Email sign-in returning 503 is expected (no mail provider on purpose).
7. Status words: `todo` · `in progress` · `in review` · `merged` · `deployed` · `blocked (<gate>)`.

## Approvals (Ahmed, in chat)
| Date | Approved | Meaning |
|---|---|---|
| 2026-11-05 | Mockups 01–03 (client page) as drawn | Design gate G2 is open for S3. Settles decisions 1, 2, 3, 7 (below). |
| 2026-11-05 | "Start S0" | S0-01 may be built and merged. The S0 deploy still needs its own OK. |
| 2026-11-06 | "طيب ابدأ ف تنفيذ الشكل والهيكلة الجديدة قبل النشر" (said in the Lead's main session, relayed to the sprint session) | Build the new structure and the new look before any deploy. Scope: S1-01, S1-03, S1-04, S1-05, all of S2, S3. Not S1-02, not S4–S6. Integration branch `next`; migrations on a local database only; decisions 4, 5, 6 run on the recommended defaults until he confirms them at the deploy gate. |

## Decisions (numbers = `decisions_needed` in the plan)
| # | Decision | State | Answer or recommendation |
|---|---|---|---|
| 1 | Client page = 3 tabs (Overview / Plan / Settings), Settings in 5 sections | settled 2026-11-05 | Approved as drawn. |
| 2 | Package lines | settled 2026-11-05 | Keep the real lines: campaigns / ads / edit credits / hours. No new package model. |
| 3 | Account manager per client | settled 2026-11-05 | One "Account manager" line in Settings; needs a new column in S2-05. |
| 7 | Archive and Delete only in Settings > Danger | settled 2026-11-05 | Approved. |
| 4 | Requests per month on the client Home | default since 2026-11-06, Ahmed confirms at the deploy gate | No requests-per-month field (S2-05 does not add one). |
| 5 | Growth report link rule | default since 2026-11-06, Ahmed confirms at the deploy gate | The client's "This month's result" link shows only when the switch is on and a result exists. |
| 6 | "Approve all" on the client Home | default since 2026-11-06, Ahmed confirms at the deploy gate | Removed; the client approves on the item (built in S5, not now). |
| 8 | Arabic words: 5 stage names and "milestone" | open | Recommended: keep the current Arabic words; Ahmed confirms. |
| 9 | Who records a result | open | Recommended: any team member, name recorded, each field saves alone. |
| 10 | Metric list for v1 | open | Recommended: acquisition = reach; activation = visits or leads; revenue = orders; retention and referral optional. |
| 11 | Quiet hours for deploys | open, asked at the S0 deploy gate | Proposed: Cairo 01:00–06:00. Ahmed picks the day of the first migration deploy. |
| 12 | Restore-drill access and branch protection | open, before S1-02 and S1-03 | From Ahmed: backup location, a scratch database, and OK for CI to be required on `main`. |
| 13 | What a team member sees on Home and the job page | open | Recommended: own items only. |
| 14 | Bulk team approval | open | Recommended: moves items to the client queue only. |
| 16 | Shared files in the client's "My work" (found in S1-05) | open, asked 2026-11-06 | Today the page always says "Shared files are not listed here yet". Choose: list the files the team marked as shared (read only), or keep them out and remove the notice. R60: a new list needs Ahmed's read / edit / delete answer. |
| 15 | Sprint boundary | open, before G5 | Recommended: baselines, next move, ad spend, Meta import, profitability, Remind and the client calendar go to a second sprint. |

## Gates
- **G0** Decisions 1–6 before S2-05 and before redrawing 01 / 02 / 07. 4, 5, 6 run on defaults since 2026-11-06 (confirmed at the deploy gate).
- **G1** Restore drill passed (S1-02) before any deploy that carries a migration (since 2026-11-06: migrations are built and
  tested locally first, so the drill gates the deploy, not the ticket).
- **G2** Design gate per set: 01–03 before S3 (**approved 2026-11-05**), 04–06 before S4, 07–09 before S5. Ahmed approves the drawn files.
- **G3** Migration gate: S2-02, S2-03, S2-04, S5-01 each need Ahmed's OK and a fresh backup the same day before they run on
  production. Building and testing them on a local database is approved (2026-11-06).
- **G4** Deploy gate: end of every part, quiet hours, Ahmed's OK, live smoke green.
- **G5** Sprint end: S0–S6 demos accepted here; anything else goes to the second sprint.

## Tickets

### S0 Hotfix: stop the live 404s on client links
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S0-01 | Add missing SPA routes | deploy | — | merged; deploy postponed by Ahmed (2026-11-06) | [#28](https://github.com/AhmedFouad01/tsst-portal/pull/28) → `8915d14` | pass (2 passes, final head `d8d089a`) | 10 routes, not the plan's 5. Checks at `d8d089a`: typecheck 0, lint 0 errors, vitest 603/603. Evidence: `tickets/S0-01.md`. |

Go / no-go (Ahmed): —

### S1 Safety (approved 2026-11-06, except S1-02)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S1-01 | Tag the live release and write the rollback | none | — | done 2026-11-06 (no code, no PR) | — | — | Tag `v-before-sprint` → `6290115` pushed. Rollback written below (Deploy). Tested: the local half of a deploy of the tag. Not tested: the switch on the server (needs Ahmed's OK). `tickets/S1-01.md`. |
| S1-02 | Backup and restore drill | decision | — | blocked (Ahmed's access, decision 12) | — | — | Not in the approved scope. Must pass before any deploy that carries a migration. |
| S1-03 | CI workflow | none | — | merged into `next` 2026-11-06 | [#29](https://github.com/AhmedFouad01/tsst-portal/pull/29) → `49e2847` | pass (2 passes) | CI green at `118cff4`: Server 1/2, Server 2/2, Web. About 7.5 minutes and 18 billed minutes per run. Branch protection waits for Ahmed's OK (decision 12). `tickets/S1-03.md`. |
| S1-04 | Cairo today helper everywhere | none | S1-03 | in review | [#31](https://github.com/AhmedFouad01/tsst-portal/pull/31) | running | Server + web + docs; 7 server tests at 00:30 Cairo. `tickets/S1-04.md`. |
| S1-05 | Evaluation "high" live fixes | deploy | S1-03 | in progress | — | — | 409 wording, Arabic "Home", confirm before 3 deletes. The shared-files notice needs Ahmed's answer (decision 16). |

Go / no-go (Ahmed): —

### S2 Foundation (approved 2026-11-06; migrations on a local database only)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S2-01 | `shared/routes.json` | none | S1-03 | todo | — | — | Replaces the S0-01 guard test with one route list. |
| S2-02 | `jobs.id` uuid | migration | S2-01 (S1-02 gates its deploy) | todo | — | — | Built and tested on a local database (2026-11-06). |
| S2-03 | One approvals service | migration | S2-02 | todo | — | — | |
| S2-04 | Soft delete and confirm everywhere | migration | S2-02 | todo | — | — | |
| S2-05 | `client_settings` row | decision | S2-01 | todo | — | — | Decisions 4, 5, 6 on defaults. Carries decision 3's column (account manager). |
| S2-06 | Server split by domain | none | S2-03 | todo | — | — | |
| S2-07 | Delete dead code and rename rounds | none | S2-06 | todo | — | — | |

Go / no-go (Ahmed): —

### S3 Client page (approved 2026-11-06; mockups 01–03 approved)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S3-01 | Health word read model | none | S1-04 | todo | — | — | |
| S3-02 | Overview tab | design | S2-02, S2-05, S3-01 | todo | — | — | Mockup 01. |
| S3-03 | Settings tab | design | S2-04, S2-05 | todo | — | — | Mockup 02. |
| S3-04 | Plan tab and campaign page | design | S2-02 | todo | — | — | Mockup 03, without the calendar. |
| S3-05 | Clients list cards | none | S3-01 | todo | — | — | |

Go / no-go (Ahmed): —

### S4 Team daily (not approved to start; mockups 04–06 not approved)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S4-01 | Home needs-action list | design | S2-02, S3-01 | todo | — | — | Mockup 04. |
| S4-02 | Work page with one New job modal | none | S2-02 | todo | — | — | |
| S4-03 | Job page | design | S2-03, S4-02 | todo | — | — | Mockup 05. |
| S4-04 | Review queues | design | S2-03 | todo | — | — | Mockup 06. |
| S4-05 | Requests in owner nav | none | S2-06 | todo | — | — | |
| S4-06 | Global settings pages | none | S3-03 | todo | — | — | |

Go / no-go (Ahmed): —

### S5 Growth (not approved to start; mockups 07–09 not approved)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S5-01 | Goals and results migration | migration | S2-02, S3-04 | todo | — | — | |
| S5-02 | Campaign page goal and result entry | none | S5-01 | todo | — | — | |
| S5-03 | Growth report (owner + client) | design | S5-02, S2-05 | todo | — | — | Mockup 09. |
| S5-04 | Client Home and review | design | S2-03, S5-03 | todo | — | — | Mockups 07 and 08. |

Go / no-go (Ahmed): —

### S6 Polish and docs (not approved to start)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S6-01 | Calendar view on Work | none | S4-02 | todo | — | — | |
| S6-02 | WhatsApp deep link to an item | none | S5-04 | todo | — | — | No sending, no provider. |
| S6-03 | Docs and rules | deploy | S6-01, S6-02 | todo | — | — | |

Go / no-go (Ahmed): —

## Deploy (only after Ahmed's explicit OK in chat)
1. Ahmed puts this Mac's public IP (`curl -s https://api.ipify.org`) in the AWS security-group SSH rule. The loop never touches AWS.
2. From a clean checkout at `origin/main`, with GNU tar and GNU grep first on `PATH`
   (`/opt/homebrew/opt/gnu-tar/libexec/gnubin`, `/opt/homebrew/opt/grep/libexec/gnubin`):
   `TSST_KEY=~/.ssh/tsst-portal-key-fra.pem TSST_PORTFOLIO=/Users/fouad/Work/TSST/TSST/core/portfolio.yaml bash scripts/deploy.sh`
3. Live smoke for the part (the list is on the part's deploy ticket).
4. Rollback: see below.

### Rollback (written by S1-01; the server half is not exercised yet, see `tickets/S1-01.md`)
Same env as the deploy command in every case.
- **One step back, code only:** `bash scripts/deploy.sh --rollback`. It swaps the server's `current` and `previous`
  releases and restarts. Running it twice returns to the newer release. The database is not touched.
- **Back to the release from before the sprint** (tag `v-before-sprint` = `6290115`), when more than one deploy has
  happened: in `~/Work/tsst-portal` run `git fetch origin --tags && git checkout --detach v-before-sprint`, then the
  deploy command with `TSST_ALLOW_OPEN_PRS=1` in front (the script refuses a checkout that is not `origin/main` without it).
- **After a deploy that carried a migration:** code alone cannot go back, migrations only go forward. The deploy wrote
  `/srv/tsst/backups/pre-deploy-<release>.sql.gz` before migrating; going back means restoring that dump, then
  redeploying the older release. The restore procedure is S1-02 (needs Ahmed's access) and must be drilled first.

| Date | Part | Release | Smoke | Rollback | Note |
|---|---|---|---|---|---|
| 2026-11-04 | before the sprint | `6290115` | — | — | PR #27, migrations 028–030. Detail: `../DASH-AG-022-SIMPLE-BUILD.md`. |
