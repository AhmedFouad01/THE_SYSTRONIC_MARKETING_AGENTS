# DASH-AG-006 — Create job from a client folder + posts (BACKEND ONLY) — Antigravity request

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort Medium. Cost rules R52: read only what is named; reply in 3 lines.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-jobsrc` (from `main` 5b6862c). Write ONLY `src/**`, `migrations/010_*.sql`,
`tests/**`. Do NOT touch `web/**` (Codex is rebuilding the whole front end in another branch); the UI comes later.

## Why (Ahmed 2026-10-20)
Client work is mixed up on Drive. Ahmed makes a folder on Drive himself, then in the Dash: Create job → pick the client →
pick a folder from THAT client's folder tree only → the Dash reads it and sorts it (images, video, copy, plans) and shows
Facebook / Instagram posts to the client as post frames. The Drive mirror stays read-only; the Dash never writes to Drive.

## Task
Read first: `src/service/dash/jobs.ts`, `src/core/scan.ts`, `src/core/kinds.ts`, `src/core/doc.ts`, `src/core/paths.ts`,
`src/service/dash/client-view.ts`, `src/server/v1/team-read.ts`, `src/server/v1/team-write.ts`, `docs/DASH-API.md`
("Types", "Server rules").
1. **Migration `010_job_sources.sql`** (010 reserved; never edit 001–009): `portal.job_sources (brand, job, folder,
   created_at, created_by)`, PK `(brand, job)`, unique `(brand, folder)`. `job` = `@` + a slug of the title (unique per
   brand, add `-2`, `-3` on clash); `folder` = path relative to the brand's own folder.
2. **One resolver** `jobDir(env, world, brand, job)`: `@…` jobs → `job_sources.folder` inside the brand folder; other
   jobs → today's `projects/<job>` (old jobs keep working untouched). Every endpoint, `/file`, `/thumb`, client view and
   reports use it. Guard: realpath must stay inside that brand's folder (no `..`, no symlink escape, no other brand).
3. **Folder tree** `GET /api/v1/folders?brand=&path=` (owner / team): sub-folders of `path` inside that brand's folder
   only, each with counts by kind (`image`, `video`, `copy`, `plan`, `other`) and `job` if already linked. Hide dot /
   system folders. Unknown brand or a path outside → 404.
4. **Create** `POST /api/v1/jobs` `{ brand; title; folder }` (owner / team): folder must exist inside the brand, not
   already linked; returns `JobCard` (201). Job meta defaults as today; Edit job / Archive work on it.
5. **Arbitrary layout:** an `@` job scans its folder recursively (no `work/` / `final/` needed); `ref` / `qa` / `old`
   zones and notes rules stay as today.
6. **Posts:** inside one job, files in the SAME sub-folder = one post: its images / videos + the copy card(s) from that
   sub-folder's copy file (`COPY*.md` / `caption*`, platform labels like `**Facebook — كابشن:**`,
   `**Instagram — كابشن:**`). Add to `JobDetail`:
   `posts: { key; title; folder; platforms: ("facebook" | "instagram")[]; media: { path; kind; thumb }[];
   captions: { platform; md }[] }[]`. Client view: a post shows only if its copy card is visible to the client
   (team-approved + shown); its media list keeps only visible items; never internal sections.
7. **Tests** `tests/v1-job-sources.test.ts`: folder tree stays inside the brand (other brand, `..`, symlink → 404); create
   → appears in `/jobs` and `/job`; duplicate folder → 409; `/file` works for an `@` job and refuses outside paths;
   posts group image + caption by sub-folder; client sees a post only when its copy card is shown; old `projects/` jobs
   unchanged (existing tests stay green).

## Checks before the reply
Root: `npm run typecheck`, `npm run lint`, `npx vitest run` (full suite). One commit on `dash-jobsrc`. No screenshots.

## Reply (3 lines)
What changed · checks pass / fail · contract changes (types + endpoints, for the Lead to write into DASH-API).
