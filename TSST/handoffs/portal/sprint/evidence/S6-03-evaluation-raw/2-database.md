# Database re-evaluation, 2026-11-23

Evidence is about `next` = `e758f9a` in /Users/fouad/Work/tsst-portal-s603 only. Live `main` = `6a28ba3` was not read. Paths are relative to that checkout. Nothing was run against a database. All statements below are read from files.

## 1. Findings of 5 Nov

**Decisions pass through the old `decision_history` table and a trigger: PARTLY.**
- `decideItem` is now the one application writer. It sets `bridged=true`, so the trigger returns at once (`migrations/033_decision_bridged.sql:6-9`, trigger body line `IF NEW.bridged THEN RETURN NEW`; `src/service/dash/job-model.ts:323-328`).
- It still writes two tables per decision: `decision_history` (job-model.ts:326) and `item_decisions` (job-model.ts:330). The old table is not archive-only yet.
- The trigger `decision_history_item_bridge` (`migrations/027_job_model.sql:157`) and its function are still installed. 033 line 12 says they are dropped "in a later migration"; none of 034-038 does it.
- Writers that leave `bridged` NULL, so the trigger still runs: `src/server/v1/publishing.ts:355` ("Edited after review"), `src/db/repo.ts:62` (`insertDecision`, old route and import), `src/service/review-mirror.ts` (import).
- Readers of the old table: `packages.ts:424,460,547`, `jobs.ts:773`, `repo.ts:117`.
- Command: `grep -rnE "decision_history" src --include='*.ts' --exclude='*.test.ts'` gave 9 code hits.

**Five different ways to hide or delete: OPEN (one more column family added).**
- `ADD COLUMN deleted_at` now sits on 9 tables: five in 030, four in 034, plus `posts` from 011. `archived_at` (007, 027), `disabled` (003), `revoked_at` (001:71, 016:162) and invoice void remain.
- 034 widens the `deleted_at` pattern (`migrations/034_soft_delete_more.sql:1-17`) but does not merge the others.
- Command: `grep -noE "ADD COLUMN (IF NOT EXISTS )?(deleted_at|revoked_at|archived_at|disabled)" migrations/*.sql`.

**Twelve tables still hard-deleted (packages, payments, ledger): PARTLY, better on the named ones, worse in count.**
- Command: `grep -rhioE "delete +from +(portal\.)?[a-z_]+" src --include='*.ts' --exclude='*.test.ts' | sed ... | sort | uniq -c`.
- At `6290115` (same command with `git grep`): 12 tables, 15 statements.
- Now: 11 tables, 14 statements:
  - 2 each: `invites`, `client_pin_attempts`, `client_codes`.
  - 1 each: `time_entries`, `social_profiles`, `projects`, `job_requests`, `documents` (drafts only, `documents.ts:629`), `campaign_goals`, `result_entries`, `result_notes`.
- Gone: `brand_packages`, `bonuses`, `document_payments`, `milestones`. They now use `deleted_at` (034). `payments` is reachable only through its package (034 header).
- Still hard: `projects` (`src/service/dash/projects.ts:526`), `time_entries` (`src/server/v1/work.ts:1372`), `job_requests` (`requests.ts:482`).
- Cascades are not counted by this command. `projects` delete cascades the three new growth tables (038 lines 21,34,48).
- Some of these are sensible (pin attempts, open invites). The list is not classified in the repo; I did not find a written rule that does it.

**A job is identified by free text, not a stable id: PARTLY.**
- 031 adds `portal.job_projects.id uuid NOT NULL DEFAULT gen_random_uuid()` with a UNIQUE constraint (`031_job_id.sql:5-6`). Its own header says "every table still names a job by (brand, job)".
- 032 adds seven foreign keys on `(brand, job)` to `job_projects`, all `NOT VALID` (032:25-31). No migration validates them: `grep -rn "VALIDATE" migrations` finds nothing. Rows from before may still name unknown jobs; `scripts/checks/unregistered-job-rows.sql` exists to list them. Whether any exist in production is not verified from the repo.
- Nothing references `job_projects(id)` (`grep -rn "job_projects *(id)" migrations` finds nothing). The id is exposed as a field (`src/service/dash/jobs.ts:107`) but is not yet a key. The key is still two texts.

**Migrations forward-only, no written way back: FIXED for the file format, PARTLY in practice.**
- Every migration 032-038 has a written by-hand rollback in its header: 032:15, 033:11, 034:10, 035:9, 036:22, 037:10, 038:15 (`grep -nE "Rollback" migrations/03[1-8]*.sql`).
- 031 has none, and it is the simplest case (`DROP CONSTRAINT job_projects_id_key; DROP COLUMN id`).
- Rollbacks are text, not tested. The runner still has no down step (`src/db/migrate.ts` reads `schema_migrations` and applies forward only).
- 034 and 036 state honestly that rolling back the code alone un-hides rows or leaves columns unread.
- Additive check: 031, 034, 037, 038 add only (037 widens one CHECK). 035 adds a table and backfills it. 036 adds columns, replaces a view, replaces an action CHECK and runs one `UPDATE items SET maker_user_id` backfill. 032 adds constraints that restrict writes. 033 replaces a trigger function (guarded by an md5 check of the old body, 033:19-26).
- All use `SET LOCAL lock_timeout = '5s'` except 031, which has no lock timeout.

**The backup was never restored: NOT VERIFIED from the repo.**
- `docs/RUNBOOK.md:308` says "The restore drill of 2026-11-06 (as the ticket records it, not repeated for this file) did not cover media, secrets or a server rebuild". That is a claim in a document. The ticket, the dump and the result are not in the repo.
- RUNBOOK section 6 now has a written restore sequence. Section 7 says the nightly dump format "is not verified from the repo" (`RUNBOOK.md:260`).
- Production backups, the real dump and any restore log: not verified.

## 2. New problems

- **medium:** two job registers. `portal.jobs` (the indexer table, 031 from R1) and `portal.job_projects` (the register with the new id) coexist. I did not trace which one each reader uses.
- **medium:** hard deletes of new team-typed data. `result_entries`, `result_notes` and `campaign_goals` are hard-deleted (`src/service/dash/growth.ts:289,323,352`), and `projects` cascades them away. They will feed a client-facing growth report. This goes against the "hide, don't delete" rule that 034 applies elsewhere.
- **medium:** decisions are written twice (`decision_history` plus `item_decisions`) in one transaction. The two can drift if the first is edited by another writer. The old table is still the source for package counts (`packages.ts:424,460`).
- **low:** 031 has no rollback note and no lock timeout.
- **low:** 036 backfill guesses the maker from a name. It is documented, only for exactly one matching user, and not read until a client has a reviewer.

## 3. Score

5 Nov: 2 of 5. Now: **3 of 5**.
Reason: the sprint wrote rollback text in headers, guarded the trigger-function replacement with a hash, moved four tables to hide, added a stable job id and a foreign key. The old decision table and trigger, five hide mechanisms, unvalidated foreign keys, a job id that is not a key yet, and an unverified restore remain.

## 4. Not looked at

- The live database. Whether migrations 031-038 ran on production. Row counts.
- Whether the by-hand rollbacks work (not run).
- Query performance and indexes beyond the headers.
- `migrations/001-030` beyond the greps above.
- Services that read the new tables, other than the grep hits quoted.
- Server backup files and `SERVER.md` (not opened by rule).
