# Dash evaluation, re-run 2026-11-23 (evaluator's file)

Subject: `next` at `e758f9a`. First evaluation: `6290115`, 4 of 10. Sources: six reader reports (R1 server, R2 database, R3 web, R4 product, R5 docs, R6 deploy/quality) and my own read-only git checks of the live commit `6a28ba3` (12 Nov). Nothing was run.

**A correction to the readers.** R1 says no fix is live. That is wrong for several. `6a28ba3` already has `shared/routes.json` read by `spa.ts:8`, `src/core/day.ts`, 14 topic-named files in `src/server/v1/`, "a read never writes" (`jobs.ts`), migration 034, `ConfirmDelete` in `Team.tsx`, the Overview tab, `SetupLinkResult`, and a 410 on `/api/decision` (`app.ts:462`). It lacks the Requests menu button, the generated route table, `INDEX.md`, `RUNBOOK.md` and migrations 036-038. That `6a28ba3` is what runs is taken from the brief and the board; no server was checked.

## A. The fourteen problems of 5 Nov

| # | Problem | Now | Evidence (reader) | Where |
|---|---|---|---|---|
| H1 | 404 on refresh of new pages | FIXED | One list `routes.json`; `tests/spa.test.ts:63-95` compares it with `App.tsx` (R4, R6). All five paths listed (R4; I confirmed 4 of them plus `/client/requests` on live). | LIVE |
| H2 | 3 decision paths; new model writes the old table | PARTLY | Old paths answer 410 (`approvals.ts:421-433`, `app.ts:470`, R1). The writer still inserts `decision_history` then `item_decisions` (`job-model.ts:325-330`, R1, R2); trigger still installed (R2). 3 other writers leave `bridged` NULL (R2). | 410s live (`app.ts:462`); the double write is live too |
| H3 | No CI, no pre-deploy check, no monitoring | PARTLY on paper, open in effect | `ci.yml` (80 lines) exists (R6) but jobs are refused since 17 Nov (BOARD:27, 39, R6); about 30 PRs merged on local checks. `deploy.sh` byte-identical, no typecheck/tests (R6). No monitoring (R6). | File on live; no gate anywhere |
| H4 | Server files split by permission | PARTLY | 22 to 14 files, topic names (R1). Topics still scattered: `client-view/*` in 6 files; `work.ts` 1457 lines (R1). | LIVE (14 files at `6a28ba3`, my check) |
| H5 | 5 hide/delete ways; 12 hard-deleted tables; deletes without confirm | PARTLY | 12 to 11 tables; packages, payments, bonuses, milestones now `deleted_at` (034) (R2). Hide mechanisms still 5, with `deleted_at` on 9 tables (R2). Confirms: 23 of 23 reachable DELETE callers in files using `ConfirmDelete` (R4, counted by files, not buttons). | LIVE for 034 and confirms (my check) |
| H6 | API contract at v1.24; JOB-MODEL spec and design-gate missing | PARTLY | Generated route table plus `tests/api-docs.test.ts` (R1, R5). 2000+ lines of v1.24 prose remain (R1). No `*JOB-MODEL*` spec (R5). Design-gate: not verified (nobody looked). 4 routes only in prose (R1). | `next` only (live file has 1905 lines, no api-docs test) |
| M1 | Team client page = old hub in tabs; no Requests button; Access/Visibility twice | PARTLY | Tabs Overview/Plan/Posts/Settings (`ClientDetail.tsx:109`); Requests button owner-only (`AppShell.tsx:36`); Visibility left the owner menu; Access still in both places (R4). | Tabs LIVE; Requests button `next` only |
| M2 | Reads write; `loadWorld` rebuilds everything | PARTLY | 0 writes in GET route bodies (scan of route bodies only, R1). `loadWorld` still 10 queries, no cache, 70 call sites (R1). | Write fix LIVE (my check); cost open |
| M3 | Client links: new link hidden, key not on server, AI mark gone, shared files missing | PARTLY | Invite shows setup URL (`ClientPeople.tsx:18`, R4). AI mark still unreachable; "AI factor" setting now dead (R4). Shared files: notice removed, gap not verified. Link-key decision: not verified. | Link display LIVE; rest open |
| M4 | "Today" in UTC | FIXED | `src/core/day.ts` used by 21 files; one `toISOString().slice(0,10)` left, date arithmetic (R1). Web uses its own Cairo `day.ts`; the UTC helpers R1 flagged (`format.ts:54`, `home-week.ts:89`) only add days to plain dates, so not a defect (my check). | LIVE |
| M5 | Dead web code; mock repeats server | OPEN, mock WORSE | 18 dead components (was 20), 11 unused API methods (was 10) (R3). Mock 3,764 to 5,485 lines (R3). | `next` and live |
| M6 | CSS and copy without system | PARTLY, mostly OPEN | Round names gone, Arabic "Home" fixed (R3). `!important` 62 unchanged; CSS files 31 to 48; translation ways 5 to 6; other English words remain in the Arabic file (R3). | Names LIVE (0 round-named CSS on live, my check) |
| M7 | Paperwork in two places; about 50 round files, no index | PARTLY | Product repo `docs/INDEX.md` (106 rows) (R5). Owner side unchanged: 53 loose files, no index, no DECISIONS (R5). Plan still in a third place outside git (R5). | Docs; INDEX not on live repo |
| M8 | Windows-only deploy/backup tools; backup outside repo, untested; no tags; 43 merged branches | OPEN | `deploy.sh`, `pull-backup.py` unchanged (`git diff` empty, R6). 1 tag (R6). 119 remote refs, 105 merged into `next` (R6, local refs). Restore drill 6 Nov: board claim only (R2, R6); 036-038 never rehearsed (RUNBOOK:136-138, R6). | n/a |

Fixed: 2 (H1, M4). Partly: 10. Open: 2. Worse: none outright, but the mock (M5) and translation count (M6) grew.

## B. Area scores (out of 5)

| Area | 5 Nov | Now | Reason |
|---|---|---|---|
| Server and API | 2 | 3 (R1 kept) | One live decision path, topic files, no write on read, Cairo day. Held back by the double write, 3 error shapes, `loadWorld` cost. |
| Database | 2 | **2.5** (R2 gave 3) | Rollback text in headers, guarded trigger swap, 4 tables to hide. But the 7 new foreign keys are `NOT VALID` and never validated, the job id is not a key, 5 hide ways remain, and new hard deletes sit under client-facing growth data. R2's own list does not support a full point. |
| Web structure | 2 | 2 (R3 kept) | Dead code and `!important` unchanged; mock +46%, CSS files 31 to 48. |
| Product as users see it | 3 | 3.5 (R4 kept) | Three real fixes with evidence. Confidence is limited: Home, Work, Review and Job pages were never opened (R4). |
| Docs and handoffs | 2 | 3 (R5 kept) | Honest INDEX, runbook, route table, board with decisions table. Owner side unchanged; restore section has a wrong step number. |
| Deploy and quality | 3 | **2.5** (R6 gave 3) | R6 splits it: code and tests 4 (140 server test files, 20 gates), release safety 2.5. This area is about release safety, and CI is refused while the largest release ever waits. |

Sum 16.5 of 30, against 14 of 30 on 5 Nov.

## C. Overall

**5 of 10 for `next` at `e758f9a`** (was 4).
- The code and test base improved clearly: one live decision path, topic files, Cairo day, hide-not-delete on the named tables, 1324 server test cases (R6).
- None of the 3 migrations 036-038 has run on production, and none was rehearsed on a restored copy (R6).
- CI does not run; about 30 PRs went in on one person's local run (R6, BOARD:15, not re-run by me).
- `deploy.sh` is unchanged, with six documented hazards (R6).
- The decision model is still two tables, and the web side got bigger, not simpler.

Live site: it runs `main`, so it holds only part of this (the 404 fix, Cairo day, read-without-write, topic files, 034, confirms); my own estimate from reading `6a28ba3` is about 4.5 of 10, not scored by any reader.

For one more point (6): migrations 036-038 rehearsed on a restored copy; CI green on the head, or `deploy.sh` runs the checks itself; the `deploy.sh` hazards fixed; `next` deployed in stages and seen on a real server and phone; and `decision_history` no longer written by the new model.

## D. New problems from the sprint

**High**
1. Next deploy is one huge step: 327 commits, 326 files, 3 forward-only migrations, never run by CI at its head (R6). A failed health check rolls code back onto the migrated schema (RUNBOOK:173, R6), and the real recovery is a restore that loses data since the dump.
2. `deploy.sh` hazards confirmed and unfixed (R6, R5): portfolio file replaced before the dump (`:110`), `rm -rf "$R"` without a guard (`:111`), rollback pointing `current` and `previous` at the same release (`:139`, `:158`), dump taken while the app runs (`:125-131`), `--rollback` checks `/login` only (`:31`).
3. Gate-free merging: PRs #68 to #97 merged on local runs while CI jobs are refused (R6, BOARD:13-39); branch protection is unavailable on the plan (BOARD:149).

**Medium**
4. Hard deletes of `campaign_goals`, `result_entries`, `result_notes` (`growth.ts:289,323,352`), and a `projects` delete cascades them; they feed a client-facing report (R2).
5. Each decision is written twice in one transaction; package counts still read the old table (`packages.ts:424,460`, R2, R1).
6. All 20 browser gates run Chromium against the mock; none on WebKit or a real phone; the mock-to-server join is by hand (R6).
7. Two review lists, `GET /review` and `GET /review/queues`, can drift (`approvals.ts:362-408`, R1).
8. Client growth read is safe only by caller convention (`growth-report.ts:168`, `reports.ts:46-62`, R1).
9. Round tags in web comments 38 to 506; copy files +24%; sizes of `copy.ts` and mock (R3).
10. RUNBOOK restore section says "step 1" is the dump, but step 1 is "Stop the app" (`RUNBOOK.md:256-257`, R5).
11. Hard-coded English in the shell (`AppShell.tsx:39,115,139`) and a dead "AI factor" setting (R4).
12. Board "Now" is 5,075 words; no ten-line summary (R5).
13. Two job registers, `jobs` and `job_projects`: not traced (R2, not verified).

**Low**: migration 031 without rollback note or lock timeout; twin `safeNext` (tested); mixed route declaration styles; 9 dead 410 handlers and the bridge shim; dead files `ClientSummary.tsx`, `ClientJobCards.tsx`; board duplication; team pages English-only by rule (R1, R2, R3, R4, R5).

## E. Not evaluated

- Nothing was run: no test, build, server, migration or browser. Every verdict is from reading code, git and counts. The 1419-pass local result (BOARD:15) is the board's claim.
- No real server, no production database (whether 031-035 ran, row counts, backups, the nightly job, whether `6a28ba3` is what runs), no real phone or Safari.
- GitHub itself: CI state and branch list are local refs, not fetched.
- Pages not opened (R4): Home, Work calendar, Review, Job, campaign goal/results, WhatsApp share, Reports for an empty month, Documents, client Home/Plan/Report bodies, viewer comment box, mobile layout.
- Arabic wording (R3 counted words only); auth and session code beyond quoted lines; the 410 logging window; query speed.
- Design-gate document; owner `DECISIONS.md` content; the other 40 tickets; every `docs/r9*` file; whether INDEX marks are right per file; whether runbook commands work.
- `SERVER.md`, secrets and key files (not opened by rule).
- My live comparison used file-level greps on `6a28ba3`, not a full diff.
