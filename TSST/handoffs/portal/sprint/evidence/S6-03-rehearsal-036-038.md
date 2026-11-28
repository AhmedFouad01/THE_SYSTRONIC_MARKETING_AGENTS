# Rehearsal of migrations 036, 037, 038 on a restored production copy (2026-11-28)

**Verdict: passed.** The three migrations apply on real data in under a second, change no existing row count, and the live release keeps answering the same on the migrated database (the rollback case). Two findings for Ahmed below.

Approval: Ahmed, 2026-11-28, "أيوه اعمل البروفة" (to: rehearse migrations 036 to 038 on a restored production copy). Terms as S1-02 (`tickets/S1-02.md`): one locked folder on the Mac, a throwaway PostgreSQL 16 on a Unix socket, counts and names only, no row value in chat or in any file here, same-day clean-up (Ahmed deletes the folder by hand). Nothing on the server was read or written; no ssh, no fresh dump.

## Source and set-up
- Source: the Drive copy `TSST-Backups/dash/db/2026-11-20.sql.gz` (nightly `pg_dumpall`), copied into the folder. 807,504 bytes, sha256 `994ad929df786b3b0da9f48465ca331a2949d1328198fe19280d0753d0b58cea`, `gzip -t` ok. Dumped from and by PostgreSQL 16.15 (Ubuntu); the Mac ran 16.15 (Homebrew).
- **The copy is eight days old.** `LAST_RUN.txt` reads 2026-11-21 00:01:05, status OK, newest daily dump `2026-11-20.sql.gz`: the off-server pull has not run since. Reported to Ahmed.
- Folder `~/tsst-rehearsal-2026-11-28.noindex`, mode 700, FileVault on. Cluster: socket only, no TCP listener. App processes ran with a clean environment (`env -i`: PATH, a HOME inside the folder, the socket URL, empty brand / media / thumbnail folders inside the folder, 127.0.0.1:3199). No `.env`, no `portal.env`, no production secret, no mail provider.
- Code: `git archive` of the live release `6a28ba3` and of `next` `7a9a7ee` into the folder (root dependencies are the same lock file on both). Node 22.23.1 on the Mac (production pins 24).
- Migrations and the app connected as role `tsst` (not a superuser; owner of the database), as in production.

## Restore
- Exit 0, 1 second. `restore.err`: one line, "role postgres already exists" (expected).
- Database `portal`, roles `postgres` and `tsst`. 48 tables, 1,084 rows; every table's `count(*)` equals the dump's. `schema_migrations`: 35 rows, `001_init.sql` to `035_client_settings.sql` (the live release's set). User triggers not enabled: 0. Not-validated constraints: 7 (the seven deferred references of 032, as before).
- Working copies were made with `CREATE DATABASE ... TEMPLATE portal`; the restored database itself was never booted against or migrated.

## The migrations (copy 1: nothing else touched it)
- `next`'s `npm run migrate`: "applied: 036_makers_review_order.sql, 037_week_setting.sql, 038_goals_results.sql; already applied: 35", exit 0, 0.8 s with start-up, nothing on stderr.
- `migrate.ts --status` (the check F-09's health function runs): applied 38, pending 0, unknown 0, "migration status: OK", exit 0.
- Tables 48 to 51. The only counts that changed: `schema_migrations` 35 to 38, and three new empty tables (`campaign_goals`, `result_entries`, `result_notes`, all owned by `tsst`). No row added to or removed from any other table.
- Schema against a fresh database built by `next` (001 to 038): 1,411 lines each; 4 lines differ, the same two CHECK constraints as in S1-02 (`job_requests_output_types_check`, `plans_bill_every_days_check`) printed with different parentheses; with parentheses ignored, no difference.
- Not-validated constraints still 7; triggers not enabled 0; `client_settings`: 5 rows, 0 with a reviewer, 5 with `approver_kind = client`; decisions with `self_decided` or `stand_in`: 0; `settings` rows with key `week`: 0.

## Finding 1: the maker backfill of 036 assigns nobody
- 74 live items; after 036, **0 have a maker**.
- Why (counts only): all 74 carry one creator name (50 made by "Drive sync", each with a post; 24 direct). That name belongs to **two** users: one active owner and one disabled team user. The backfill only assigns when exactly one user has the name, and it counts disabled users by design, so every item is "ambiguous".
- Effect after a release: every item is "no maker" (the design covers it: `unassigned`, the owner's line "N items have no maker", the first submitter becomes the maker). Nothing a client sees changes. A wrong guess was the risk the reviewer named; on real data there is no guess at all.
- **Decided 2026-11-28: Ahmed, "سيبه زي ما هو" (leave it). 036 is not changed.**
- The choice that was put to him: leave it (set makers by hand or let the first submit set them), or change the rule to ignore disabled users (all 74 would go to the one active owner). 036 is not deployed, so the rule can still change; it would need a new review and a new rehearsal run.

## The live release on the migrated database (copies 3 and 4)
Method: a throwaway owner made with the live release's own `user:add` (a generated password in a 600 file in the folder); the live release started on the copy; a script signed in and read a fixed list of team GET routes, and client GET routes through the owner's "view as client" for each of the 5 brands. It stored the status and a hash of each answer, and the field names (never a value). Two runs before the migration were identical, so a later difference is the migration's.
- **1,272 reads** (380 team, 892 client). Before the migration: team 332 × 200, the rest 400 / 404 / 409 / 410 by route shape (missing parameter, another brand's item, closed routes); client 127 × 200, the rest 400 / 404.
- `next`'s migrate ran **while the live release was serving** the copy: exit 0, 0.2 s, no lock wait (the server was idle: real traffic was not simulated).
- The live release, still running, after the migration: **no status changed. All 892 client answers are byte-identical.** 51 team answers differ, each only by added field names: the new columns appear in `review`, `job`, `items` and `items/:id/versions` (`maker_user_id`, `submitted_*`, and on decisions and events `by_user_id`, `by_person_id`, `self_decided`, `stand_in`, `from_user_id`, `to_user_id`), because the live code reads those rows with `*`. All values are NULL / false at that point.
- **The rollback case:** the live release stopped and started again on the migrated database (its own boot-time migrate sees 38 names, 3 of them unknown to it): it starts, nothing on stderr, `schema_migrations` still 38, and all 1,272 answers are identical to the ones before the restart.
- Old-shaped inserts (the live code's column lists) into `item_decisions` and `item_events` on the new schema, in a transaction that was rolled back: accepted, no error.
- Read by the Lead in the live code, not provable by this run: the two client item reads build decisions field by field (`clientModelItem`), which is why the new columns do not reach a client. **Finding 2:** after a rollback that comes later, when `next` has already written makers and "who decided", the live code would show those new fields to the **team** (not to a client, by this run and that reading). It is extra JSON the old web ignores; worth knowing, not a blocker.

## `next` on the migrated database (copy 4)
- Starts; `/api/ping` 200, `/api/v1/me` 401; `--status` OK; nothing on stderr before or after the reads.
- 1,379 reads (472 team with the new routes: calendar, review queues, week, share, growth; 907 client): **no 5xx, no failed call**; no status differs from the live release on the routes both have. The team growth read per project: 3 × 200, 5 × 404. `client-view/growth` 404 for all 5 brands (the switch is off everywhere).

## Seen on the way (not from `next`)
- **Finding 3:** the first start of the live release on a copy with an **empty brand folder root** added 44 rows to `item_versions` (44 items, 21 of them made by Drive sync; none with zero files). A later restart added none. This is the live code's folder sync meeting an empty root: a local artefact here, cause not investigated. It says a server that starts while its brand folder is missing may write versions; worth a look before a server move, outside this rehearsal.
- The cluster log holds 3 error lines, all from the Lead's own probing (two wrong ad-hoc queries, and the expected "role exists"). None from a migration or from the app.

## What this does not cover
- The real server, its Node 24, its permissions and its data since 2026-11-20 (eight days).
- Real traffic during the migration (lock waits), and any write through `next` on real data (the reads only; writes are covered by the test suite on an empty database).
- The web pages themselves (a stub was served as the shell), a real phone, Safari.
- Brand folders and media (empty here), so reads that open files were not exercised.
- The deploy script: F-09's script has still never run on a server.

## Clean-up
- The server and the cluster were stopped: no postgres process, nothing listening on 3199, no socket file. The folder (351 MB: the cluster, the dump, two unpacked releases, logs, answer hashes) is for Ahmed to delete by hand the same day: `rm -rf ~/tsst-rehearsal-2026-11-28.noindex`. The session checks afterwards that it is gone.
- Nothing from the copy was written outside that folder: this file holds counts, table names, column names and route shapes only.
- **Checked at 17:04 EET, after Ahmed ran the `rm -rf` himself:** the folder is gone, no folder of that name pattern is left in the home folder, no postgres process, nothing listens on 3199, no dump, count or answer file in the session's scratch folder. Still installed by his earlier choice: Homebrew's `postgresql@16`.
