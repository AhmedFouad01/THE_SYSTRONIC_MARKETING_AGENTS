# Dash sprint board (S0–S6)

The only source of truth for sprint progress. Every session reads this first and updates it in the same turn a ticket moves.
A ticket is never written as merged without its PR and its checks next to it.

- Plan (each ticket's `what` and `acceptance`): `~/Work/DASH-SPRINT0/sprint0-final.json` → `sprint_plan` (on this Mac, outside git).
- Report with Ahmed's approvals table: `~/Work/DASH-SPRINT0/SPRINT0-REPORT-AR.md`. Evaluation: `~/Work/DASH-EVALUATION-2026-11-05.md`.
- Mockups: `~/Work/DASH-SPRINT0/mockups/01..09`. Ticket files: `tickets/<id>.md` (written when a ticket starts).
- Product repo: `~/Work/tsst-portal` (GitHub `AhmedFouad01/tsst-portal`, branch `main`). Live: https://dash.the-systronic.com.

## Now
- Live release: `6290115` (PR #27), since 2026-11-04. `main` is at `8915d14` (S0-01 merged, **not deployed**).
- Approved to run: **S0 only** (Ahmed, 2026-11-05). S1–S6 are not started and not approved.
- **Stopped at the S0 deploy gate**, waiting for Ahmed:
  1. this Mac's public IP in the AWS SSH rule. The IP changed three times on 2026-11-05 (`154.190.156.141` →
     `196.133.118.237` → `154.181.11.190`) and port 22 did not answer from this Mac, so read the IP at deploy time,
     Ahmed puts that one in the rule, and the deploy starts right after;
  2. deploy now, or in quiet hours (Cairo 01:00–06:00).
- After the deploy: live smoke, write the release in the Deploy table, mark S0 deployed, then ask Ahmed about S1
  (S1-02 needs access for the restore drill, S1-03 needs his OK for branch protection).

## Operating rules
1. **One ticket = one branch = one PR.** The branch is cut from `origin/main` in its own worktree. Never work on `main` directly.
2. **Checks before a PR is merged:** `npm ci`, root typecheck, lint, `npx vitest run --no-file-parallelism`; plus the web typecheck
   and build when `web/` changes. The repo has no CI until S1-03, so the checks run on this Mac and their result is written on the ticket.
3. **Independent reviewer on every PR:** a team agent (R1, `tsst-dev`) that sees only the diff and the acceptance list. Its findings
   are fixed or answered before the merge. Merge only when the checks are green and the reviewer says pass.
4. **The loop stops only at owner gates:** a design approval (R57), a migration on money or decision tables, every deploy, and a
   decision a ticket depends on. It also stops on a failed restore drill, red checks on `main` or a failed live smoke.
5. **Deploys only with Ahmed's OK in chat**, at the end of a part, in quiet hours (see Deploy below).
6. **Never touched by the loop:** `/etc/tsst-portal/portal.env`, `.env` files, `*.pem` contents, `~/.ssh`, AWS, DNS, mail or
   WhatsApp providers. Email sign-in returning 503 is expected (no mail provider on purpose).
7. Status words: `todo` · `in progress` · `in review` · `merged` · `deployed` · `blocked (<gate>)`.

## Approvals (Ahmed, in chat)
| Date | Approved | Meaning |
|---|---|---|
| 2026-11-05 | Mockups 01–03 (client page) as drawn | Design gate G2 is open for S3. Settles decisions 1, 2, 3, 7 (below). |
| 2026-11-05 | "Start S0" | S0-01 may be built and merged. The S0 deploy still needs its own OK. |

## Decisions (numbers = `decisions_needed` in the plan)
| # | Decision | State | Answer or recommendation |
|---|---|---|---|
| 1 | Client page = 3 tabs (Overview / Plan / Settings), Settings in 5 sections | settled 2026-11-05 | Approved as drawn. |
| 2 | Package lines | settled 2026-11-05 | Keep the real lines: campaigns / ads / edit credits / hours. No new package model. |
| 3 | Account manager per client | settled 2026-11-05 | One "Account manager" line in Settings; needs a new column in S2-05. |
| 7 | Archive and Delete only in Settings > Danger | settled 2026-11-05 | Approved. |
| 4 | Requests per month on the client Home | open, before S2-05 (G0) | Recommended: drop the line unless packages really sell a number of requests. |
| 5 | Growth report link rule | open, before S2-05 (G0) | Recommended: shown when the switch is on and one result is recorded. |
| 6 | "Approve all" on the client Home | open, before S2-05 (G0) | Recommended: remove; the client approves on the item. |
| 8 | Arabic words: 5 stage names and "milestone" | open | Recommended: keep the current Arabic words; Ahmed confirms. |
| 9 | Who records a result | open | Recommended: any team member, name recorded, each field saves alone. |
| 10 | Metric list for v1 | open | Recommended: acquisition = reach; activation = visits or leads; revenue = orders; retention and referral optional. |
| 11 | Quiet hours for deploys | open, asked at the S0 deploy gate | Proposed: Cairo 01:00–06:00. Ahmed picks the day of the first migration deploy. |
| 12 | Restore-drill access and branch protection | open, before S1-02 and S1-03 | From Ahmed: backup location, a scratch database, and OK for CI to be required on `main`. |
| 13 | What a team member sees on Home and the job page | open | Recommended: own items only. |
| 14 | Bulk team approval | open | Recommended: moves items to the client queue only. |
| 15 | Sprint boundary | open, before G5 | Recommended: baselines, next move, ad spend, Meta import, profitability, Remind and the client calendar go to a second sprint. |

## Gates
- **G0** Decisions 1–6 before S2-05 and before redrawing 01 / 02 / 07. Open: 4, 5, 6.
- **G1** Restore drill passed (S1-02) before any migration ticket.
- **G2** Design gate per set: 01–03 before S3 (**approved 2026-11-05**), 04–06 before S4, 07–09 before S5. Ahmed approves the drawn files.
- **G3** Migration gate: S2-02, S2-03, S2-04, S5-01 each need Ahmed's OK and a fresh backup the same day.
- **G4** Deploy gate: end of every part, quiet hours, Ahmed's OK, live smoke green.
- **G5** Sprint end: S0–S6 demos accepted here; anything else goes to the second sprint.

## Tickets

### S0 Hotfix: stop the live 404s on client links
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S0-01 | Add missing SPA routes | deploy | — | merged, waiting at the deploy gate | [#28](https://github.com/AhmedFouad01/tsst-portal/pull/28) → `8915d14` | pass (2 passes, final head `d8d089a`) | 10 routes, not the plan's 5. Checks at `d8d089a`: typecheck 0, lint 0 errors, vitest 603/603. Evidence: `tickets/S0-01.md`. |

Go / no-go (Ahmed): —

### S1 Safety (not approved to start)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S1-01 | Tag the live release and write the rollback | none | — | todo | — | — | |
| S1-02 | Backup and restore drill | decision | — | todo | — | — | Needs decision 12 (access). |
| S1-03 | CI workflow | none | — | todo | — | — | Branch protection needs Ahmed's OK (decision 12). |
| S1-04 | Cairo today helper everywhere | none | S1-03 | todo | — | — | |
| S1-05 | Evaluation "high" live fixes | deploy | S1-03 | todo | — | — | |

Go / no-go (Ahmed): —

### S2 Foundation (not approved to start)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S2-01 | `shared/routes.json` | none | S1-03 | todo | — | — | Replaces the S0-01 guard test with one route list. |
| S2-02 | `jobs.id` uuid | migration | S1-02, S2-01 | todo | — | — | |
| S2-03 | One approvals service | migration | S2-02 | todo | — | — | |
| S2-04 | Soft delete and confirm everywhere | migration | S2-02 | todo | — | — | |
| S2-05 | `client_settings` row | decision | S2-01 | todo | — | — | Needs decisions 4, 5, 6 (G0). Carries decision 3's column. |
| S2-06 | Server split by domain | none | S2-03 | todo | — | — | |
| S2-07 | Delete dead code and rename rounds | none | S2-06 | todo | — | — | |

Go / no-go (Ahmed): —

### S3 Client page (not approved to start; design gate 01–03 open)
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
4. Rollback (same env): `bash scripts/deploy.sh --rollback`.

| Date | Part | Release | Smoke | Rollback | Note |
|---|---|---|---|---|---|
| 2026-11-04 | before the sprint | `6290115` | — | — | PR #27, migrations 028–030. Detail: `../DASH-AG-022-SIMPLE-BUILD.md`. |
