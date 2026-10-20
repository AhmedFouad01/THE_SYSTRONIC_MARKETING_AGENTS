# DASH-AG-002 — Edit job + Archive / Restore — Antigravity request

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort Medium. Cost rules R52: read only what the task needs; reply in 3 lines.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-jobs` (already checked out; it starts from Codex's `dash-web` c2c1a5e).
Work and commit ONLY there. Never touch `C:\Work\tsst-portal`, `C:\Work\tsst-portal-web` or any client folder.

## Task (X3 S2.1)
1. Migration `migrations/007_job_edit.sql` (007 is reserved for you; never edit 001–006): on `portal.job_meta` add
   `title text` (display title, null = keep the folder/manifest title), `client_description text NOT NULL DEFAULT ''`,
   `archived_at timestamptz`, `archived_by text`.
2. Backend: `PATCH /api/v1/job/meta` also accepts `title` (1–120 chars or null) and `client_description` (≤ 600).
   `POST /api/v1/job/archive?brand=&job=` and `POST /api/v1/job/restore?brand=&job=` (owner or team).
   Archived jobs leave Home (KPIs, milestones, campaigns), `/jobs` (unless `archived=1`), `/review`, reports, and
   every client-view endpoint, client file / thumb access and client link job pickers. The Drive folder never changes.
   `JobCard` gets `archived: boolean`. Files: `src/service/dash/jobs.ts`, `src/service/dash/client-scope.ts`,
   `src/service/dash/reports.ts`, `src/server/v1/team-write.ts`, `src/server/v1/team-read.ts`; tests in
   `tests/v1-job-edit.test.ts` (title / description saved, archive hides everywhere incl. the client view, restore
   brings it back, client never sees an archived job).
3. Front end: Job page header gets **Edit job** (HeroUI modal: title, client description, type, status, platforms,
   start / end, ads; milestones stay in their editor) and **Archive** (confirm dialog; Danger action button per rule
   R51) / **Restore** when archived. Jobs list gets an **Archived** filter (segmented control, R51: not a filled
   button). Client view shows `client_description` under the job title when set. Rules R39, R50, R51
   (`C:/Work/TSST/TSST/core/rules.md`).

## Checks before the reply
Root: `npm run typecheck`, `npm run lint`, `npx vitest run tests/v1-job-edit.test.ts tests/v1-meta-milestones.test.ts tests/v1-client-view.test.ts`.
`web/`: `npm run typecheck`, `VITE_API=live npm run build`. One commit on `dash-jobs`. Two screenshots max
(Job page with Edit modal, 1536 light + dark) in `web/qa/X3/S2.1/`.

## Reply (3 lines)
What changed · checks pass / fail · contract changes (for the Lead to write into DASH-API).
