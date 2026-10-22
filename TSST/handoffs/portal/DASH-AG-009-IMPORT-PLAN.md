# DASH-AG-009 — Import plan backend: Dash-only jobs, plan.md parser, server media (B1–B4)

**ON HOLD until R6 (DASH-AG-010 + DASH-R6-WEB) is merged into main.** Then the Lead resets `dash-r5` to that main
(contract v1.10); the migration number is 014 (013 = R6).

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort High. Cost rules R52: read only what is named; reply in 3 lines, in plain Egyptian Arabic.

## Where
Folder `C:\Work\tsst-portal-ag`. First: `git switch dash-r5` (= `main` 9f0f7f5, contract v1.9). Write ONLY `src/**`,
`migrations/014_*.sql`, `tests/**`, `scripts/server/*.env.example` if one exists. No new dependency. Do NOT touch
`web/**` (Codex builds the UI on `dash-r5-web`) or `docs/**` (a contract gap goes into your reply).

## Read first (only these)
1. `docs/DASH-API.md` v1.9: `JobCard.source`, `PlanIssue`, `PlanPreview`, `PlanImport`, `MediaUpload`, the 4 new team
   endpoints, rules "v1.9 Import plan".
2. `docs/IMPORT-PLAN.md` sections "The format" and "Rules" = the parser spec, exactly. `docs/examples/anvil-plan.md`
   must import with zero errors and zero warnings.
3. Code: `migrations/010_job_sources.sql`, `src/service/dash/jobs.ts` (loadSources, jobLoc, scanJob, detailOf,
   cardOf), `src/service/dash/posts.ts`, `src/server/v1/posts.ts`, `src/server/v1/index.ts`, `src/server/app.ts`
   (/file, /thumb), `src/service/dash/media-info.ts`.

## Task
1. **B1 data** Migration 014: `job_sources.kind text NOT NULL DEFAULT 'drive' CHECK (kind IN ('drive','dash'))`;
   `portal.plan_imports (id, brand, title, text, jobs text[], created_at, created_by)`. Env `DASH_MEDIA_ROOT` (default
   `/srv/tsst/dash-media`; must not be inside BRANDS_ROOT; created on first use, mode 750). A `dash` job's folder =
   `<brand>/<job without @>` under DASH_MEDIA_ROOT. `jobLoc` / scan / detail / /file / /thumb / measurement / client
   view resolve it there; everything else treats it as an `@` job. `JobCard.source` = "dash" | "drive".
2. **B2 parser** `src/service/dash/plan.ts`: pure function `parsePlan(text, ctx)` → `PlanPreview`; ctx = client ids,
   existing job titles of the brand, post-formats table. Every rule in IMPORT-PLAN.md → `{ line, message }`, plain
   English, what is wrong + how to fix ("Line 14: Story posts have no captions. Remove the #### Instagram section.").
   Format words map feed→single, carousel→multi, reel→video, story→story, document→document. A wrapping ``` fence
   is ignored. Captions keep their text exactly (trim only the ends). `All` = caption for every platform of the post.
3. **B3 endpoints** `POST /plans/preview` (no writes), `POST /plans/import` (one transaction: job_sources kind dash +
   job_meta + milestones + posts with `media: []` + plan_imports; 422 with the PlanPreview when errors), team only,
   body ≤ 300 KB. Posts may have `media: []` only when made by an import on a Dash job; such a post is never visible
   to the client until it has media; PATCH /posts then applies the v1.8 rules as today.
4. **B4 media** `PUT /media?brand=&job=&name=` raw body streamed to a temp file in the job folder, type from magic
   bytes (JPEG / PNG / WebP / MP4 / MOV / PDF), caps image 25 MB, video 300 MB, PDF 100 MB, 2 GB per job, 507 when
   free disk < 3 GB, safe file name (`-2`… on clash), then rename → `media/<name>`; returns `MediaUpload` measured by
   media-info. `DELETE /media` (409 while a post uses it). Dash jobs only (a Drive job → 409 "This job lives on Drive").
   Same origin / session / role guards as the other team writes.
5. **Tests** `tests/v1-import-plan.test.ts`: the ANVIL example imports (3 jobs, 4 milestones, 5 posts, story has no
   captions); one test per rule with the exact line number; import is all-or-nothing (inject a failure after the
   first job → nothing written); duplicate job title vs an existing job → error; upload: a real 1080×1350 JPEG is
   measured, a renamed .txt → 422, over-cap → 413, Drive job → 409, client cannot fetch media of a hidden post, a post
   with media from PUT then passes PATCH with format carousel. Existing tests stay green (say which you changed).

## Checks before the reply
Root: `npm run typecheck`, `npm run lint` (0 new warnings), `npx vitest run` (full suite). One commit on `dash-r5`.

## Reply (3 lines, Egyptian Arabic)
What changed · checks pass / fail · contract gaps / tests changed (for the Lead).
