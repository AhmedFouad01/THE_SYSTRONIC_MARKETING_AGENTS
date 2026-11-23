# Area 5: Documents and handoffs (re-run 2026-11-23)

Evidence is about `next` `e758f9a` (checkout `/Users/fouad/Work/tsst-portal-s603`) and the owner's handoffs at `TSST/handoffs/portal/`. Nothing here is on the live site (`main` `6a28ba3`) except where said. `SERVER.md` was not opened.

## 1. Findings of 5 Nov

| Finding | State | Evidence |
|---|---|---|
| About 50 old round files, same weight, no index | PARTLY | Product repo: `docs/INDEX.md` now lists all files (106 rows = 106 tracked files besides itself, `comm` of both lists is empty), marks: 1 current, 3 reference, 102 history (`grep -c "\| history \|"`). Owner repo: still 53 top-level `.md` plus 6 folders in `handoffs/portal/` (`ls -p`), 269 files outside `sprint/` (`find`), no `INDEX.md`, no archive folder (`ls`). Nothing was moved (INDEX says so). Old files have the same weight as before there. |
| Only 6 to 8 files with a status line | OPEN | Status line in the first 12 lines: 7 of 70 `docs/*.md`; 5 of 53 owner top-level `.md`; 13 of 43 tickets (loop over `head -12 \| grep`). The mark now lives in INDEX, not in the files. |
| Paperwork in two repositories | OPEN | Plans, tickets, board, decisions, runbook server facts in the owner repo; code and runbook in the product repo; the sprint plan and report are in a third place, `~/Work/DASH-SPRINT0` "on this Mac, outside git" (`BOARD.md:6-8`). 6 file names exist in both trees (`comm`); `s5-04-arabic-pass.md` is byte-identical in both (`cmp`). |
| `DASH-API.md` stopped at v1.24 | FIXED in substance | 2375 lines (1507 at `6290115`). Sections run to S6-01; "Scope of this file" (lines 3-24) says table = generated and current, text = record. Title is now "Dash API contract" (v1.24 kept as history). Weak spots: field lists not checked; the route check was a one-off script not in the repo (`DASH-API.md:13-15`). Route table: generator prints 190 lines, test enforces it (`tests/api-docs.test.ts`, not run by me). |
| JOB-MODEL-001 spec missing | OPEN | `find` for `*JOB-MODEL*` in the owner repo: no result. Only `docs/audits/JOB-MODEL-B1.md` (audit) and `DASH-API.md:1496` (v1.24 section). Not recorded as a decision to leave it. |
| Owner's decisions scattered | PARTLY | `BOARD.md` has a Decisions table (20 rows, lines 135-157) and Approvals table (lines 121-133), a real gain. But decisions 8-12 and 15 still read "open" since 5-6 Nov, decision 12 is half resolved, and Ahmed's answers also sit as prose in "Now" (lines 84-95) and in tickets (`S6-03.md` section 7, `S6-03-rules-proposal.md`). |
| No INDEX, no DECISIONS file, no runbook | INDEX FIXED (product repo only), RUNBOOK FIXED, DECISIONS OPEN | `docs/INDEX.md` (121 lines), `docs/RUNBOOK.md` (377 lines, 10 sections). `ls handoffs/portal/DECISIONS.md` and `INDEX.md`: both "No such file". |

## Questions of the brief

- **One place for the state?** Yes: `sprint/BOARD.md`, and its first "Now" entry (line 12) is the newest. Not obvious from the owner folder: nothing at `handoffs/portal/` points to it except its path.
- **Readable or too long?** Too long. 294 lines, 10,789 words (`wc -lw`). "Now" is lines 11-100: 90 lines, 5,075 words, 31,568 bytes (`awk NR>=11&&NR<=100 \| wc`). It mixes the newest entries (lines 12-45, newest first, two out of order at 38-39) with history back to 6 Nov (lines 46-100). "What is live" (`6a28ba3`) is only at line 42. A newcomer needs a 10-line summary on top; it does not exist.
- **Decisions findable?** In the board table, yes; not in one place (see above).
- **Is `docs/INDEX.md` honest?** Yes. It says marks come from titles and folders, that round files were not read one by one, and that nothing moved. Weakness: 31 of 106 rows are single screenshots with repeated text; it lists itself as neither row nor mark, and there is no index on the owner side.
- **Is the runbook usable?** Mostly, for someone who also holds `SERVER.md` (it says so openly, lines 44-66, and marks about 20 statements "not verified from the repo"). It records real hazards (old code on a migrated database, restore order). Not run end to end; first-day run (ticket acceptance 4) not done (`S6-03.md` build record).
- **Tickets consistent with build records?** Mostly. 42 of 43 tickets have a result/evidence heading; the 19 tickets I checked from S4 to S6 all have a "Build record". `S6-03.md` is honest (says the ticket was wrong about DASH-API, lists what was not done). Faults: the "Review" column of the board holds merge hashes instead of review verdicts (`BOARD.md:199-213`, S6-01 and S6-02 both show `bb2d782`); `S6-03.md` build record still says "Not merged" with a one-line merge note below it; the ticket's section 1.1 still describes the README as stale (it is a "today" snapshot, not updated).

## 2. New problems

1. **RUNBOOK step numbers wrong in the restore section (medium).** The warning says "keep the fresh dump of step 1" and "Never skip step 1" (`RUNBOOK.md:256-257`, also `:304`), but step 1 is "Stop the app"; the dump is step 2 (`:270`, and `:250` says step 2). A hurried reader may skip the dump. Doc only; `next`.
2. **Runbook documents script hazards, script unchanged (medium).** Defaults for key path and host remain in `scripts/deploy.sh:16-17` and `scripts/pull-backup.py:29-30` (file and line only); automatic rollback leaves old code on a migrated database (`RUNBOOK.md:205-209`). Board line 14 says a ticket is open for Ahmed.
3. **Board and ticket duplication (low).** The same fact (merge, hash, "exception covers only") is repeated in "Now", the ticket table and the ticket file for each PR; the "Now" bloat comes from this.
4. **Public-repo hygiene (low, verified clean).** README/RUNBOOK/INDEX hold no key path (`grep` empty); README lines 35, 46, 47 are loopback addresses and `you@example.org`.

## 3. Score

**3 of 5** (5 Nov: 2). The product repo now has an honest INDEX, a long and careful runbook and a corrected API contract, and the board is a real single source with decisions and approvals tables. It loses points because the owner side is unchanged (53 loose files, no index, no archive, no DECISIONS), the JOB-MODEL spec is still missing, the board's "Now" is 5,075 words, and the runbook has a wrong step reference in its most dangerous section.

## 4. Not looked at

`SERVER.md` (forbidden), the other 40 tickets' bodies, every round file under `docs/r9*`, the `~/Work/DASH-SPRINT0` plan, `.github`, whether INDEX marks are right per file, whether the runbook's commands work (not run), the 14-finding table of the 5 Nov plan.
