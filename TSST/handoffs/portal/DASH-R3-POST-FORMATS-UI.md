# DASH-R3 — Round 3 UI: post formats, ratios, platform frames (U1–U6) (Codex)

ROLE A (team runtime, front end). Bounded: no deploy, no push, no secrets, no new paid tools. Cost rules R52: read only
what is named; commit per phase (3 commits); reply in 5 lines. Effort: High.

## Where
Folder `C:\Work\tsst-portal-web`, branch `dash-r3-web` (from `main` 2dccb60 = live + contract v1.8). `web/` only. The
backend is built in parallel on another branch against the SAME contract: build against `docs/DASH-API.md` v1.8 with
the mock. A contract gap goes into your reply, never into backend files.

## Read first (only these)
1. `C:\Work\TSST\TSST\handoffs\portal\DASH-POST-FORMATS-001.md` — the whole spec (sections 2 format model, 3 editor, 4
   frames, 6 U1–U6). Ahmed approved it and the defaults marked D. Numbers only from there; keep "?" items soft.
2. `docs/DASH-API.md` v1.8: `PostFormat`, `PostRatio`, `PostInput`, the v1.8 `Post` note, `PostFormats`,
   `GET /api/v1/post-formats`, rules "v1.8 post formats".
3. `C:/Work/TSST/TSST/core/rules.md` R50–R53. Code: `web/src/components/ds/PostEditor.tsx`, `PostFrame.tsx`,
   `MediaCarousel.tsx`, `PostGrid.tsx`, `web/src/api/**`.

## Ahmed's words
"It's one standard thing across 3 channels — wrong. Carousel isn't handled, post sizes aren't there." Each platform and
each post type must look and behave like the real thing. Never crop silently.

## Phase 1 — Data + editor (commit) — U1, U2, U3
- API + mock to v1.8: `getPostFormats()`; mock table = the same numbers as the spec (add a `contract.test.mjs` check
  that every platform × format in the mock table matches the spec table rows). Mock media carry real `w`/`h`/`pages`.
- `postFormats.ts` reader + `ratioFit(w, h, target)` helper with unit tests (4:3 → 4:5 = "cut 40% of the width";
  4:5 → 4:5 fits; 9:16 video in a feed ratio warns).
- Step 1: platforms first, then ONE format list = formats on every chosen platform; others disabled with the reason
  ("LinkedIn has no Stories"); each format card shows its rule line.
- Step 2: picker filtered by format (document = PDFs only); ratio chips PER chosen platform with the default selected;
  per-item status line in the tray from `w`/`h` (fits / crop % / outside range / not 9:16 / looks soft) — warnings
  never block; hard blocks only for count, kind, PDF limits. Carousel: slide 1 labelled "Cover · sets the ratio", last
  "Closing", counter "n / 20" (FB soft 10).

## Phase 2 — Frames + step 3 (commit) — U4, U5
- Frames per section 4: ratio-aware IG / FB / LinkedIn feed (no square forcing, never letterbox in-range media);
  IG profile-grid 3:4 tile ("Feed | Profile grid" switch on IG); 9:16 phone frame for IG / FB Reel and Story with a
  "Show safe zones" switch (marked "guide"); FB and LinkedIn multi-image collage 2 / 3 / 4 / 5+ (+N scrim); LinkedIn
  Document with page swipe "Page n / N"; video poster rules. DS tokens only, no platform logos, no fake numbers, R53.
- Step 3: caption counter per platform (LinkedIn 3,000 hard; IG / FB 2,200 soft warning); Story = "Stories have no
  caption"; preview = the active platform's frame at its ratio. `PostGrid` and the client job page use the stored
  `format` / `ratio`. Save → reopen round-trips format and ratio.

## Phase 3 — Proof (commit) — U6
- Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`; root `npm test`.
- Mock fixtures with REAL shapes (generate real files, not SVG placeholders): 4:5 carousel 1080×1350 ×3, 9:16 reel mp4
  1080×1920 (a short generated clip is fine), 1.91:1 landscape 1200×627 jpg, 3-page PDF with page thumbs.
- Playwright at 1536 and 390, light + dark: each fixture in its frame; LinkedIn ticked → Story disabled with reason;
  1.91:1 jpg in IG 4:5 shows the crop %; 21st slide blocked; Reel opens the phone frame; IG grid tile is 3:4.
- Screenshots `web/qa/R3/` (10 max): step 1 with a disabled format; step 2 with warnings; IG carousel + grid tile;
  FB collage 4; LinkedIn document; IG Reel phone frame + safe zones; step 3 LinkedIn 3,000 counter; client job posts
  1536 light; 390 light; one dark.
- `web/qa/R3/REPORT.md` (≤ 1 page): U1–U6 → done / not done.

## Reply (5 lines)
Phases done · gates pass / fail · U items open · contract gaps (if any) · screenshot folder.
