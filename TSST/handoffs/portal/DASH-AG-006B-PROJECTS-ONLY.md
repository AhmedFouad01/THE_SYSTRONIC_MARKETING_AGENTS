# DASH-AG-006B — Create job: projects/ only, no double jobs (BACKEND, small fix on AG-006) — Antigravity request

ROLE B (external tool via Ahmed, R41): bounded code fix, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort Medium. Cost rules R52: read only what is named; reply in 3 lines.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-jobsrc` (on top of your commit 1533fdd). Write ONLY `src/**`, `tests/**`.
No new migration. Do NOT touch `web/**`.

## Why (Ahmed 2026-10-20)
The server's Drive mirror syncs only `projects/`, `approved/`, `photos/` of each client (unchanged). Ahmed decided: new
job folders always go inside `projects/`, any layout inside. Today `discoverJobs` makes EVERY top-level folder of
`projects/` a classic job, so a folder linked by Create job would show twice (the empty classic job + the `@` job).

## Task
Read first: `src/core/discovery.ts` (`discoverJobs`), `src/service/dash/jobs.ts` (`scanAll`, `jobLoc`),
`src/server/v1/team-read.ts` (`folders`), `src/server/v1/team-write.ts` (`POST jobs`), `src/server/v1/access.ts`
(`checkJobs`), `tests/v1-job-sources.test.ts`.
1. **projects/ only:** `POST /api/v1/jobs` accepts a `folder` only under `projects/` (`projects/<x>` or deeper; never
   `projects` itself) → otherwise 404 like any unknown folder. `GET /api/v1/folders`: no `path` = the children of
   `projects/`; a `path` outside `projects/` → 404. Returned `path` values stay relative to the brand folder.
2. **No double jobs:** a classic job whose folder (`projects/<job>`) is linked in `job_sources` disappears from the
   classic side everywhere (`scanAll` / `/jobs`, `/job` by its classic name → 404, client-link job checks). One folder =
   one job.
3. **Do not swallow real jobs:** refuse (409 `this folder is already a job`) a folder that is a classic job with
   content (has `work/` or `final/` or a brief), and a folder that contains or sits inside another linked folder.
   An empty or loose-files folder is fine. In `/folders`, `job` = the linked `@` name, or the classic job name when the
   folder is a classic job with content (so the UI can grey it out).
4. **Tests** (add to `tests/v1-job-sources.test.ts`): folder outside `projects/` → 404; link `projects/new` (loose
   images) → exactly ONE job in `/jobs`; classic job with `work/` → 409; nested / parent of a linked folder → 409;
   `/folders` with no path lists `projects/` children with the right `job` marks. Existing tests stay green.

## Checks before the reply
Root: `npm run typecheck`, `npm run lint`, `npx vitest run` (full suite). One commit on `dash-jobsrc`. No screenshots.

## Reply (3 lines)
What changed · checks pass / fail · contract changes (for the Lead to write into DASH-API).
