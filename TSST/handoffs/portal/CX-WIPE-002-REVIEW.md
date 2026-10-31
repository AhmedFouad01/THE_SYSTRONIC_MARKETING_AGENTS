# CX-WIPE-002: review the all-work wipe script before it runs live (Codex)

ROLE A (team runtime, DEV_AG review). R58 rung 2 for `DASH-AG-020-WIPE-ALL-WORK.md`. The Lead runs it on the live DB after your
verdict, a named backup and Ahmed's OK. You: no server, no live DB, no deploy, no secrets. Cost rules R52; reply in 3 lines.

## Where
`C:\Work\tsst-portal-wipe2`, branch `dash-wipe-002`, commit `7ecf10a` (`scripts/wipe/002-all-work.sql`, `tests/wipe-002.test.ts`).
Owner decision: delete ALL work (old + new model, every client); keep clients, General projects, packages, payments, documents,
plans, social profiles, team accounts, client links / people / sessions, settings. Files on disk are never touched.

## Check
1. Run against the live schema shape: apply all `migrations/` to a fresh PGlite (or local Postgres), seed the real-data shape from
   `CX-SIMPLE-000-COUNT_out.md` part B (old jobs with decision_history + client_items, new jobs with items / versions / decisions /
   comments / files, requests with `credits_from_package`, `jobs.package_id`), run the script twice: first commits, second deletes 0.
2. Nothing on the keep list loses a row; no FK error; every append-only trigger is enabled again after COMMIT.
3. Package numbers after the wipe: what "Edit credits used" / Delivered show once requests and items are gone (expected 0 used,
   0 delivered); report anything that breaks or errors instead.
4. Privileges: the triggers are disabled with `ALTER TABLE`: which DB role must run it (table owner?). Say the exact command form
   for the server (`sudo -u postgres psql -d <db> -v ON_ERROR_STOP=1 -f …` or the `tsst` role), reading `scripts/server/` only.
5. Gates: `npx vitest run --no-file-parallelism tests/wipe-002.test.ts`, `npm run typecheck`, `npm run lint`.
Small fixes: commit on top. Anything bigger: report, don't fix.

## Reply (3 lines, Egyptian Arabic)
verdict (run / fix first) · gates · exact run command + anything found.
