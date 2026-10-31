# DASH-AG-020: wipe script for ALL work, old and new model (Antigravity)

ROLE A (team runtime, backend). Step 2 of `DASH-SIMPLE-001-PLAN.md`. Owner 2026-10-31: wipe all work (ANVIL SUPPS + Yakebda
included), start clean; work was never moved to Dash officially. Data numbers: `CX-SIMPLE-000-COUNT_out.md` part B.
Bounded: write the script and its test ONLY. Never connect to the server, never run anything on the live DB, no deploy, no push,
no secrets. The Lead runs it live after a named backup, with Ahmed's OK. Effort: High. Cost rules R52; reply in 3 lines.

## Where
`cd C:\Work\tsst-portal` → `git fetch` → `git worktree add C:\Work\tsst-portal-wipe2 -b dash-wipe-002 origin/main`.
Write only `scripts/wipe/002-all-work.sql`, add ≤ 8 lines to `scripts/wipe/README.md`, `tests/wipe-002.test.ts`.
Read: `scripts/wipe/001-old-work.sql` + `tests/wipe-001.test.ts` (same method, start from them), `migrations/` (all, for foreign
keys), `src/service/dash/jobs.ts` (`adoptDrive`).

## The script
- One transaction, schema `portal`, safe to run twice (second run deletes 0).
- **Delete (work):** everything 001 deletes, plus the job-model tables from `027_job_model.sql`: `items`, `item_versions`,
  `item_version_files`, `item_decisions`, `item_events`, `item_comments`, `job_files`, `job_release_events`, `request_jobs`;
  plus `job_requests`, `decision_history` / old decisions, `client_items`, `posts`, the `jobs` rows themselves, and every
  client_activity / milestone row that points at a job, item, campaign project or request. Any other table that only points at
  work (find it from the migrations): delete it too and name it in the reply.
- **Keep untouched:** `brands`, each brand's General project, `brand_packages`, `payments`, `payments_orphaned`, `documents`,
  `document_counters`, `document_payments`, `plans` (kept on purpose in 001, `176874a`), `social_profiles`, `user`, `account`,
  `session`, `verification`, `invites`, `client_tokens`, `client_links` / `client_codes`, `client_people`, `client_sessions`,
  `client_pin_attempts`, `settings`, `schema_migrations`.
- **Files are never touched:** no `rm`, nothing under `/srv/tsst/clients` (Drive mirror) or `/srv/tsst/dash-media`. SQL only.
- **Must not re-adopt:** after the wipe and a restart, no job comes back from the Drive mirror (same guard as 001; if anything
  else could re-register work, report it, don't change `src/`).
- Before deleting, check packages: if a package / payment row points at a job or item (credits, Delivered), report which column
  instead of deleting the package.
- At the end, `SELECT` one line with the count of every table above (kept and deleted).

## Test (`tests/wipe-002.test.ts`, PGlite like 001)
Seed 2 brands: old-model job (decisions, client item, post), new-model job (items, versions, decisions, comments, files, release
event), request → job, job + client milestones, client activity, package + payment + document, plan, client link + person.
Run it, assert: work tables = 0, kept tables unchanged, General projects kept, `adoptDrive` with a mirror folder registers
nothing, second run deletes 0. Gates: `npx vitest run --no-file-parallelism` (all pass), `npm run typecheck`, `npm run lint`.

## Reply (3 lines)
commit hash · gates · extra tables found / package links / adoption risk.

## Done `7ecf10a` (2026-10-31)
543 tests pass, typecheck + lint 0. 45 tables: 21 deleted, 2 partial, 22 kept. Packages have no job / item columns (only
`jobs.package_id`, `job_requests.credits_from_package` point outward). Drive re-adoption guarded. Lead read the SQL: OK.
Next: Codex review (`CX-WIPE-002-REVIEW.md`) → named backup → Ahmed's "run it" → Lead runs live.
