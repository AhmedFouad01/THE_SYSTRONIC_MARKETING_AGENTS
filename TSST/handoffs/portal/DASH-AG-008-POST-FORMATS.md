# DASH-AG-008 — Round 3 backend: post formats, ratios, measured media (B1–B4)

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort High. Cost rules R52: read only what is named; reply in 3 lines.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-r3` (from `main` 2dccb60). Write ONLY `src/**`, `migrations/012_*.sql`,
`tests/**`, and `package.json` / `package-lock.json` for at most ONE new runtime dependency (`pdf-lib`, MIT, for PDF page
count / size — say so in the reply). Do NOT touch `web/**` (Codex builds the UI in parallel on `dash-r3-web`).

## The contract is written — implement it exactly
`docs/DASH-API.md` v1.8: `PostFormat`, `PostRatio`, `PostInput` v1.8, the v1.8 note on `Post` (format, ratio, media
`w`/`h`/`pages`/`page_thumbs`, kind `document`), `PostFormats`, `GET /api/v1/post-formats`, rules "v1.8 post formats".
The full table and reasoning: `C:\Work\TSST\TSST\handoffs\portal\DASH-POST-FORMATS-001.md` sections 2 and 5 (numbers
only from there; Ahmed approved the defaults marked D). A contract gap → your reply, never a silent change.

## Read first
`src/service/dash/posts.ts`, `src/server/v1/posts.ts`, `src/service/dash/types.ts`, `src/service/dash/jobs.ts`
(buildDeliverables / detailOf), `src/core/kinds.ts` (classify), `src/server/thumb.ts`, `migrations/011_posts.sql`,
`tests/v1-posts.test.ts`.

## Task
1. **B1** `src/service/dash/post-formats.json` = the table (per platform × format: label, ratios, default_ratio,
   items [min,max], kinds, caption_max, caption_hard, note) + `version`. Types. Migration 012: `posts.format text NULL`,
   `posts.ratio jsonb NULL`. Old rows / Drive posts without a stored format get a derived one. `GET /api/v1/post-formats`
   (team) returns the table.
2. **B2** Validate create / edit against the table: platform × format exists; item count and kinds; document = exactly 1
   PDF ≤ 300 pages and ≤ 100 MB; ratio allowed for that platform × format; LinkedIn caption ≤ 3,000 hard; IG / FB caption
   length and crop / resolution never rejected. Plain-words 422 messages. Media max becomes 20 (by format).
3. **B3** Measure media server-side (cache by path + mtime + size, never per request from scratch): images via `sharp`
   metadata; videos via `ffprobe` when on PATH (else `w`/`h` null, no error); PDF via `pdf-lib` (page count + first page
   size); PDF page thumbnails via `pdftoppm` when on PATH (served through the existing `/thumb` guard rules — same
   job / brand / client visibility checks; else none). `classify` gets `document` for `.pdf` in posts. Client view keeps
   the v1.7 visibility rules (a document is fetchable only when its post is visible).
4. **B4** Drive inference: 1 image = single, 2+ media = multi, 1 video = video, 1 PDF = document; optional
   `**Format:** story | reel | document` line in the caption file (reel = video). Story has no caption.
5. **Tests** `tests/v1-post-formats.test.ts` with real-shape fixtures made in the test (sharp-generated 1080×1350 jpg
   ×3, 1200×627 jpg, a 3-page PDF built with pdf-lib, a tiny mp4 only if ffprobe exists — else assert `w/h` null):
   Story on LinkedIn = 422; Document on Instagram = 422; 21 slides = 422; FB multi 11 = allowed only if soft (follow the
   table) ; ratio "9:16" on IG single = 422; LinkedIn caption 3001 = 422, IG caption 2300 = OK; measured dims returned
   exactly; PDF `pages: 3`; Drive folder with `**Format:** story` → format story; old post rows load with a derived
   format; client never fetches a hidden document. Existing tests stay green (say which you had to change).

## Checks before the reply
Root: `npm run typecheck`, `npm run lint` (0 new warnings), `npx vitest run` (full suite). One commit on `dash-r3`.

## Reply (3 lines)
What changed · checks pass / fail · new dependency + contract gaps / tests changed (for the Lead).
