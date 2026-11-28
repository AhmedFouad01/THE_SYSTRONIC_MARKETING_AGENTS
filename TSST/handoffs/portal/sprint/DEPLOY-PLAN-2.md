# Dash sprint: release plan 2 (proposal, 2026-11-28)

Status: **proposal. Nothing is deployed.** Every step below needs Ahmed's own word in chat, on its day, naming the commit.
Live = `6a28ba3` (`main`, migrations up to 035; as recorded on the board). Everything built sits on `next` = `7a9a7ee` (348 commits ahead; migrations 036, 037, 038; the new deploy script of F-09).
How a deploy and a rollback run is `docs/RUNBOOK.md` in the product repo, sections 4 and 5. This file says only what is specific to this release.
Reviewed once by an independent reader against the script, the runbook and git (2026-11-28): three blockers and a list of wrong statements, all taken in below.

## Where the gate of `tickets/S6-03.md` section 4 stands
| Gate item | State |
|---|---|
| 1 Ahmed's word that day | open, per step |
| 2 a same-day backup | open. **The off-server copy is from 2026-11-20; the pull has not run since 2026-11-21 00:01** |
| 3 the rehearsal of 036 to 038 | **partly met** (`evidence/S6-03-rehearsal-036-038.md`). Done: restore, the three migrations, the counts, the schema, the old release on the migrated database (reads). **Not done, though the ticket asks for them:** the pages walked in a browser (Work, a job, the Week, a campaign page, the client home and report), the first-start timing, and any write through `next` followed by a read with the old code. See "Second rehearsal" below |
| 4 runbook read-through, evaluation attached | the evaluation is attached (`evidence/S6-03-evaluation.md`, 5 of 10, at `e758f9a`). The runbook was rewritten by F-09 after its read-through; F-09's two review rounds covered the changed parts, a whole read-through of the new text is **open** and goes with work item 2 |
| 5 checks green on the exact commit | open, per step (each step's merge commit is new) |
| 6 `main` at that commit by pull request | open, per step |
| 7 SSH from the Mac | open, per night |
| 8 rollback written for this deploy | this file |

## The recommendation: four nights
One part per night in the quiet hours (Cairo 01:00 to 06:00, decision 11), a day between parts, as plan 1 did.

| Step | `main` becomes | Carries | Migrations | Database after |
|---|---|---|---|---|
| **0** | `main` + the 8 files of F-09 (a small new branch from `main`) | the new deploy script, the read-only migration status, the runbook. **Nothing a user sees.** | none | 035 |
| **E** | a new merge of `next` at `244edfc` (where PR #88 landed in `next`) | F-06, F-07, all of S4 (Home, Week, Tasks, the job page, Review, makers and review order, Settings, the new-job dialog), F-08 (the client header band) | **036, 037** | 037 |
| **F** | a new merge of `next` at `ff2add3` (where PR #94 landed) | all of S5: goal and results on the campaign page, the client report (switch off for every client), My requests and the billing facts on the client Home | **038** | 038 |
| **G** | a new merge of `next`'s tip at that time (today `7a9a7ee`) | S6: the Work calendar, the WhatsApp share link and the sign-in return, the docs | none | 038 |

Checked today by a dry run in a throwaway local worktree (nothing pushed; the worktree is removed): step 0's tree passes typecheck and 72 tests in three files (the deploy script's, the status mode's, the migration runner's); the three merges that follow are clean; after E and after F the tree differs from that `next` commit only in the 8 F-09 files; after G the tree is identical to `7a9a7ee`. If `next` moves before G (work item 2 moves it), the dry run of G is repeated on the new tip.
The pull requests into `main` are opened **one at a time**: the script stops while a ready pull request into `main` is open.

### Why step 0 exists
The new deploy script has never run on the real server (F-09's build record lists what a test cannot prove: the server's `sudo`, `systemctl`, `timeout`, GNU tools, the status call on the production database). Without step 0 its first run would carry three migrations. Step 0 lets it run once with no migration and no visible change. It also puts the status mode into the release that E's rollback returns to.

### Shorter options (Ahmed's choice)
- **Two nights:** step 0, then everything (`next`'s tip) in one night. Fewer nights; a problem is harder to place, and the first night with a migration is also the night with all the new screens.
- **One night, everything, no step 0:** not recommended. It is the case the evaluation named as the highest risk, with the untested script on top.

## Before each night
1. Ahmed's word that day, naming the step and the commit.
2. The same-day backup (gate item 2). After step 0 the pull script needs the key, the host and the target passed to it (F-09 removed the defaults); the scheduled job on the Windows machine is Ahmed's to change. It must work before step E at the latest; recommended before step 0.
3. `main` at the step's commit by a pull request (his word for the merge too). GitHub CI is blocked by billing, so **the local run on that exact merge commit is the record**: the runbook's section 3 list in full. If a check fails after the merge, the night is off: `main` is then ahead of live with an unchecked commit, nothing is deployed, and the fix is a new commit.
4. The machine (runbook section 2): a clean checkout detached at `origin/main`; root `npm ci` done; GNU `tar` and `grep` first on `PATH`; `gh` signed in (without it the open-PR check only warns); Node on the Mac is 22.23.1 while the project pins 24.18.0 (the script does not check; the earlier deploys ran the same way).
5. SSH from the Mac answers (`nc -z` on port 22). If not, Ahmed updates his address in the cloud rule; the session never touches the cloud account.
6. The portfolio file to upload is named. Every deploy installs it again and keeps the old one as `portfolio.yaml.previous`; every rollback puts the previous one back. `TSST/core/portfolio.yaml` in the owner repo has uncommitted changes today: Ahmed says whether that version ships.
7. For E and F: nobody is working in the Dash at that hour (036, 037 and 038 need short exclusive locks and each stops after 5 seconds if it cannot get them).

## What each failure looks like, and the way back
The script's exact words are in the runbook (section 4 steps 4 to 9, section 5).

**If the migration itself fails ("MIGRATION FAILED - deploy aborted"): do NOT run `--rollback`.** Nothing was switched and the site is still on the release that was running. But the script has not written `last-failed` in this case, so `--rollback` is not refused: it would swap to the release **before** the one that was running, swap the portfolio file, and start still older code, on a database where an earlier migration file of the same deploy may already be applied. The right moves: read the printed error, leave the site as it is, fix forward with a new commit. The same commit cannot be run again (its pre-deploy dump exists and is kept; runbook section 4, "The same commit after a transient failure"). A lock timeout is the likely form; it leaves nothing behind for that file.

| Step | If the health check fails after the switch (the script rolls back by itself) | A rollback by hand after a healthy deploy (`--rollback`) |
|---|---|---|
| 0 | Links back to `6a28ba3`, service restarted, "no migration ran": the site is as before. | Goes to `6a28ba3` and **ends "health check FAILED ... check by hand", exit 1, with the links swapped**: that release has no status mode. Truthful, not a broken rollback: smoke by hand. Its last printed line ("If a migration ran in the deploy being undone ...") does not apply to step 0: no migration ran. |
| E | Links back to step 0's release, and the block "THE DATABASE WAS MIGRATED AND THE CODE WAS ROLLED BACK" naming 036 and 037. What the rehearsal showed: the live release's code (`6a28ba3`) started on a database holding 036 to 038; no status changed in 1,272 reads; all 892 client answers were identical; 51 team answers gained the new field names. Not run: step 0's own release (same app code, changed migration runner) and the state with 036 and 037 only. So the site should serve: do the smoke, do not restore in a hurry. | Goes to step 0's release. The health check **fails by design** ("the database does not hold exactly this release's migrations", exit 1) while the site serves. Expected; smoke by hand. |
| F | Links back to E's release, the block naming 038. 038 only adds three tables that E's code does not read. Not rehearsed for E's code (the rehearsal's old code was the live release); reasoned from the migration being additive. | Goes to E's release; fails by design (038 unknown to it) while the site serves. |
| G | Links back to F's release, "no migration ran". | Goes to F's release; the health check should pass (same migrations). |

After **every** automatic rollback: the script does not ask the health check again (it says "do the smoke list"): do the smoke. `--rollback` is refused until a new commit deploys healthy (that clears `last-failed`). The fix-forward deploy after a failed E will list 036 and 037 again under "NEW MIGRATION FILES" although they are applied; its migrate line then says `applied: none`.
Retention: the script keeps the 5 newest release folders (plus current and previous) and the 10 newest pre-deploy dumps, pruned only after a healthy deploy. Four healthy deploys prune nothing this plan relies on. Failed attempts leave their folders and count toward the 5: after two or more failures, check that the release a restore would need is still there before the next attempt.

### The stop point (after which code alone is not a clean way back)
**On `next`'s code every new decision is written with the new "who decided" fields**, and the schedule can write a new event kind. So the clean window after step E ends with the **first decision anyone makes** (the team or a client), which in practice is the night itself; the smoke's own test approval crosses it. After that:
- A decision row with the new fields: the old code reads rows whole and ignores fields it does not know, and builds a client's answer field by field. Reasoned from the code and from the rehearsal's reads; **not rehearsed with such rows present**.
- A new event kind (`submitted`, `recalled`, `maker_changed`, `schedule_exception`), a maker, a reviewer on a client, a week setting; after F a goal, a result or a note: what the old code shows for these is **not known**.
Past the stop point the choices are: stay on the new code and fix forward (preferred), run the old code and accept what it cannot show, or restore the pre-deploy dump (runbook section 6), which loses everything written since the dump. Only Ahmed decides the restore.
This is why the second rehearsal below is recommended before step E: it would turn "not known" into an answer.

## Second rehearsal (recommended before step E; needs Ahmed's approval again)
On a fresh restored copy (a newer dump than 20 Nov, once the pull works), same terms as today's:
1. What the ticket asked for and today's run did not do: the built web app opened against the copy and walked (Work, a job, the Week, a campaign page with goal and results, the client home and report); the first-start time after the migration.
2. Writes through `next` on the copy: submit and recall an item, a team decision and a client decision, a maker change, a goal and a result; then start the **old** code on that database and read the same pages and client answers. This is the stop point's question.
3. Step 0's release (not only `6a28ba3`) as the old code, and the state with 036 and 037 only.
Also carried from today's rehearsal, outside this release: the live code wrote 44 item versions when it started on an empty brand folder root (finding 3). It does not block these steps (the server's brand folder is in place), but it is a reason never to start a release on the server while that folder is missing.

## What changes for people, per step (say it to the team before each night)
- **0:** nothing.
- **E, the team:** a new Home (today, mine and everyone), a Week page, Tasks, a new job page and Review page, the new-job dialog, client Settings with the review order. **Every item starts with no maker** (decided 2026-11-28: the backfill stays; on real data it assigns nobody); the first person to submit an item becomes its maker, or an owner sets it. No client has a reviewer, so review behaves as today until an owner sets one.
- **E, clients:** the header band replaces the welcome line (drawn when the Package switch is on).
- **F, the team:** goal, results and the monthly note on a campaign page.
- **F, clients:** a "My requests" card for every client that has a request; the "Need something?" card at the bottom is gone ("New request" stays at the top); the billing facts **at once for a client whose Billing and Package switches are both on and who has a main package**; a "What it produced" line only with the growth switch. The report page stays hidden: that switch is off for all five clients. **Before F: look at the switches of each of the five clients** (Settings) so nobody gets a billing card by surprise.
- **G, the team:** the calendar on Work, "Share on WhatsApp" on an item.
- **G, clients:** a link to one item returns to that item after sign-in or PIN; old links open as before.

## Live smoke per step (after `healthy: <name>`)
What the deploy output shows on success is `healthy: <name>` and the sentence about its limits; the migration status itself is printed only on a failure. The visible proof of the migrations is the migrate line.
The runbook's signed-out list is written for the final release: **`/week` answers 404 at step 0, and `/api/v1/calendar` answers 404 (not 401) at steps 0, E and F. That is correct there, not a failure.** Expected per step:

| Step | Migrate line | Prompt before upload | Signed out | Signed in |
|---|---|---|---|---|
| 0 | `applied: none; already applied: 35` | `no new migration files since the live release <name>` | `/login` 200; `/jobs`, `/clients` 200; `/week` 404; `/api/v1/me` 401 JSON; `/api/v1/calendar` 404 | one client page and one job open, as before |
| E | `applied: 036_makers_review_order.sql, 037_week_setting.sql; already applied: 35` | `NEW MIGRATION FILES ...` naming 036 and 037 | as 0, and `/week` 200 | Home, Week, Tasks, one job, Review open; an item shows no maker. A client link on a real phone: the header band, one item opens. A test approval on a test brand only, **knowing it crosses the stop point** |
| F | `applied: 038_goals_results.sql; already applied: 37` | naming 038 | as E | a campaign page shows the goal card (save and delete on a test campaign only). A client Home with Billing off and one with it on. `/client/report` not reachable for a client |
| G | `applied: none; already applied: 38` | `no new migration files ...` | as E, and `/api/v1/calendar` 401 | the calendar opens on Work; the share link of one item opens signed out and returns to the item after the PIN; one old PIN link and one password link still land on Home |

Not provable by any of this: Safari and other phones than the one used; nothing in the sprint was tested on a real phone before these nights.
After each night, the same day: the release name, the pre-deploy dump's name, the smoke result and what the first start cost go on the board (`BOARD.md`, Deploy table).

## Work that must be done before step 0 (each needs Ahmed's word)
1. **Write the rehearsal's answer into the runbook** (section 5, "Decide first", item 3 still says "not verified ... assume it does not and use form (b)"), add the warning about `--rollback` after a failed migration (section 4 and section 9 do not have it), then a whole read-through of the runbook. A docs pull request into `next`. **First**, because step 0 ships the runbook and the nights should not run on a runbook that contradicts this plan.
2. **Build step 0**: a branch from `main` with the 8 F-09 files (the runbook from `next`'s tip after item 1), the full check list on it, a pull request into `main`. Small; the code is reviewed (two rounds, PR #99).
3. **The off-server pull works again** (Ahmed's machine, or run from the Mac with his word).
4. **The second rehearsal**, before step E.

## Questions for Ahmed (the defaults are the recommendation)
1. Four nights, two, or one? [Four.]
2. Which nights? [He names them; a day between parts.]
3. Who types the deploy command? F-09 removed the host from the script, and this session has never held the host or opened `SERVER.md`. [Ahmed runs the one command in his own terminal and types `deploy`; the session prepares `main`, runs the checks, reads the output he shows, and does the smoke. Alternative: he gives the values to the session for that night in a way he chooses.]
4. Step 0 as its own night? [Yes. It is code only and could run outside the quiet hours at his word, as step A did.]
5. The second rehearsal before step E? [Yes.]

## Not in this plan
The second sprint. Any fix found by the smoke (a new commit and its own small step). Monitoring between deploys. A staging server. Changing the script so that a failed migration also blocks `--rollback` (a small follow-up to F-09 if Ahmed wants it; until then the warning above stands).
