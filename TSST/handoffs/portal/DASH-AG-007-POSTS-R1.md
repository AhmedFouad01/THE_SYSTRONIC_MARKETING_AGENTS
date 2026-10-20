# DASH-AG-007 — Round 1 backend: posts as review items, Dash-written posts, LinkedIn, SVG logos, no overdue for clients

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort High (security-sensitive parts: keys, client visibility, SVG). Cost rules R52: read only
what is named; reply in 3 lines.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-r1` (from `main` 8eeea23). Write ONLY `src/**`, `migrations/011_*.sql`,
`tests/**`. Do NOT touch `web/**` (Codex builds the UI in parallel on `dash-r1-web` against the same contract).

## The contract is written — implement it exactly
`docs/DASH-API.md` v1.7: types `PostPlatform`, `Post`, `PostInput`, `Deliverable.post`; endpoints `POST /posts`,
`PATCH /posts/:id`, `DELETE /posts/:id`, the v1.7 line on `PATCH /job/items`; rules "v1.7 posts", "v1.7 logos",
"v1.7 client billing". A contract gap → your reply, never a silent change.

## Read first
`src/service/dash/posts.ts`, `jobs.ts` (detailOf, buildDeliverables), `client-view.ts`, `client-items.ts`,
`src/core/decision.ts`, `src/server/v1/team-write.ts`, `client` decision route (find `client-view/decisions`),
`src/service/dash/branding.ts`, `src/server/v1/branding.ts`, `tests/v1-job-sources.test.ts` (fixtures style).

## Task
1. **Migration 011** `portal.posts`: `id bigserial PK, brand, job, folder text NULL, title, media text[] NOT NULL,
   captions jsonb NOT NULL, created_at, created_by, updated_at, updated_by, deleted_at NULL`; unique `(brand, job,
   folder)` where `folder IS NOT NULL AND deleted_at IS NULL`. Never edit 001–010.
2. **Drive post rule** (`posts.ts`): one folder (job folder included) with ≥ 1 image/video AND a caption file with
   Instagram / Facebook / LinkedIn / All labels (Arabic label forms as today). No caption file → no post, on BOTH team
   and client. Zones never. Max 10 media. Add `linkedin` (`لينكد`, `linkedin`, `li` as a whole word) and `all`
   (`all`, `الكل`, `كل المنصات`) labels; expand `all` per the contract.
3. **Dash posts**: CRUD endpoints (team / owner). Validate: media = 1–10 existing image/video files of that job
   (through the job resolver, realpath guard); captions ≥ 1 non-empty, each ≤ 2200; title 1–120; `folder` must be a
   current Drive post of that job (409 when that folder already has a live Dash row). Soft delete. Merge into
   `JobDetail.posts` per the contract (override keeps `folder:` key).
4. **Posts = review items**: keys `folder:<path>` / `post:<id>` accepted by team decisions (single + batch), client
   decisions (only keys of posts the client can see → else 404) and `PATCH /job/items` (`shown` only; other fields →
   422). `Post.team` / `Post.client` / `Post.shown` filled. Client view: a post shows only when team-`approved` AND
   `shown`; client `deliverables` leave out files that belong to any post; `Deliverable.post` on the team side.
   Client `JobCard.counts` computed from exactly what the client sees (post = 1 item).
5. **Logos**: accept SVG in `normalizeLogo`: reject if it contains `<script`, `foreignObject`, `on*=` attributes or
   any `href`/`xlink:href` that is not `#…` or `data:image/…`; rasterise with sharp (`density` so the output is sharp,
   `limitInputPixels`), store PNG only. All logos fit inside 1600 × 1600 (was 512). Update the error text.
6. **Client billing**: client `next_payment` = first unpaid due ≥ today (UTC); past unpaid dues never reach a client.
7. **Tests** `tests/v1-posts.test.ts`: Identity-style folder (13 images, no caption) → 0 posts both sides; caption file
   with IG/FB/LinkedIn/All → right captions + platforms; Dash post create/edit/delete + validation (other job's file,
   `..`, text file, 11 media, empty captions → 4xx); Drive override keeps the key and delete restores the Drive post;
   post decisions team + client, client 404 on a hidden post; client sees post only when approved + shown, never post
   files as separate items; client counts; SVG with `<script>` / external href refused, clean SVG → PNG; wide PNG keeps
   width up to 1600; client never gets an overdue `next_payment`. Existing tests stay green (update only what v1.7
   changes, e.g. the v1.6 post key shape, and say which).

## Checks before the reply
Root: `npm run typecheck`, `npm run lint` (0 new warnings), `npx vitest run` (full suite). One commit on `dash-r1`.

## Reply (3 lines)
What changed · checks pass / fail · contract gaps or tests you had to change (for the Lead).
