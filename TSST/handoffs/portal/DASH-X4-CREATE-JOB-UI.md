# DASH-X4 — Create job + post frames (UI on DS1) — Codex request

ROLE A (team runtime, front end). Bounded: no deploy, no push, no secrets, no new paid tools. Cost rules R52: read only
what is named; one step at a time; reply in 5 lines. Effort: Medium (High only if a phase gets stuck).

## Where
Folder `C:\Work\tsst-portal-web`, branch `dash-x4` (already checked out = your DS1 + the new backend, all green).
`web/` only. The backend and `docs/DASH-API.md` are done; a mismatch goes into your reply, never into backend files.

## Read first (only these)
1. `C:/Work/TSST/TSST/core/rules.md` R49–R53 only.
2. `docs/DASH-API.md` v1.6: types `Post`, `FolderEntry`, `JobDetail.posts`; team endpoints `GET /folders`,
   `POST /jobs`; the v1.6 server rule line.
3. `web/src/components/ds/index.ts` (use these components; add new ones there, not in pages), `web/src/api/*`,
   `web/src/pages/Jobs.tsx`, `Job.tsx`, `ClientDetail.tsx`, `client/ClientJob.tsx`, `client/ClientDeliverables.tsx`.

## Ahmed's decisions (final)
- Ahmed puts a job's material in ONE folder on Drive, inside the client's `projects/`, any layout. In the Dash:
  Create job → pick the client → pick a folder from THAT client's tree only → title → the Dash reads and sorts it.
- Copy is linked to images by sub-folder (one sub-folder = one post). Facebook / Instagram posts show to the client
  in post frames.
- Everything on DS1 tokens / components; R50 HeroUI only, R51 buttons, R53 no borders, no green.

## Phase 1 — API + Create job (one commit)
- `web/src/api`: types `Post`, `FolderEntry`; endpoints `folders(brand, path?)`, `createJob({brand,title,folder})`;
  mock: a client tree under `projects/` (some free folders with counts, one taken by an `@` job, one classic job) and
  one `@` job with 3 posts (FB only, IG only, both; one post with 3 images, one with a video).
- "Create job" primary `ActionButton` on Jobs (top right) and on Client detail (client pre-selected).
- One modal, 3 steps: **Client** (select) → **Folder** (tree of that client's `projects/` only: breadcrumb at top,
  each row = folder icon + name + small count chips "12 images · 2 videos · 3 copy · 1 plan" (zero counts hidden),
  click a row to open it, "Use this folder" on the current level; a taken row is muted with "Already a job: <name>"
  and cannot be chosen) → **Title** (prefilled from the folder name, editable). Create → go to the new job.
  409 / 404 show inline in the modal (plain words), never a raw code. Empty folder level = compact EmptyState.

## Phase 2 — Post frames (one commit)
- New ds components: `PostFrame` (variants `instagram` | `facebook`) + `MediaCarousel` (4:5 area, `object-fit:
  contain` on a neutral tile, dots + arrows, video play mark). Generic social layout only: client logo (Logo) + client
  name in the frame header, no Meta logos, no fake likes / comments / counts. Caption = markdown, `dir="auto"`,
  Arabic and English never break; long captions clamp to 4 lines + "more".
- Instagram frame: header, media, caption below. Facebook frame: header, caption above, media below.
  A post with both platforms: one frame + a `Segmented` FB / IG switch on it.
- **Team Job page:** a "Posts" section (or tab) when `posts.length > 0`: grid of frames (Grid 320–420).
- **Client job page:** "Posts" section above the other deliverables when `posts.length > 0`. Each frame has one pair
  Request edit · Approve (R51 order) that decides every item of that post (its media + its copy card(s) = the
  deliverables of the same `folder`), via the existing `client-view/decisions` calls one by one; Request edit asks for
  one note used for all. Show one status chip per post (all approved → Approved; any changes → Changes requested;
  else Pending). Per-item review elsewhere on the page stays as it is.

## Phase 3 — DS polish from the Lead review (one commit)
1. Visibility page title has a blue left bar → remove (R53); title block starts on the same left edge as the tabs.
2. Home "Approvals trend" with no data = a big empty box → compact EmptyState (one line + icon).
3. Client header at 390: package name cut to "Growth P…" → allow 2 lines (or one step smaller type) below 640.
4. Check the same three on every screen that uses those components.

## Checks before the reply
`npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`; root `npm test` green.
Playwright (mock): the full Create job flow (client → folder → taken row refused → title → new job opens); no inner
scrollbars / `scrollWidth <= clientWidth` on the new screens at 390 / 1536. Screenshots in `web/qa/X4/` (6 max):
Create job folder step 1536 dark; team Job posts 1536 dark; client job posts 1536 light + 390 light; IG frame and FB
frame close-ups.

## Reply (5 lines)
Phases done · gates pass / fail · contract mismatches (if any) · packages added (if any) · screenshot folder.
