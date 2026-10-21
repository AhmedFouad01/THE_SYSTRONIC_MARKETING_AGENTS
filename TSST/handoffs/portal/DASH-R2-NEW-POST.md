# DASH-R2 — rebuild the New post / Edit post screen as 3 steps (Codex)

ROLE A (team runtime, front end). Bounded: no deploy, no push, no secrets. Cost rules R52: read only what is named; one
commit; reply in 3 lines. Effort: Medium.

## Where
Folder `C:\Work\tsst-portal-web`, branch `dash-r2-newpost` (from `main` 6f9a831 = live). `web/` only. No backend or
contract change: build on `docs/DASH-API.md` v1.7 (`PostInput`, `/posts`) as it is.

## Why (Ahmed, live screenshot)
The current `PostEditor` (1) does not scroll, so captions and platform tabs are cut off below the fold; (2) shows every
file of the job at once (logos, raw videos, contact sheets, file codes like `bce9394f-…png`); (3) never asks first which
platform and which kind of post. Ahmed approved this 3-step flow.

## Read first (only these)
`web/src/components/ds/PostEditor.tsx`, `PostFrame.tsx`, `MediaCarousel.tsx`, `CreateJobModal.tsx` (stepper + modal
pattern to reuse), `web/src/components/ds/index.ts`, `web/src/components/ds/titles.ts` (clean titles), `web/src/api/types.ts`,
`C:/Work/TSST/TSST/core/rules.md` R50–R53.

## The screen
- A large sheet (≥ 1024: centred, max 1200 × 90vh; < 1024: full screen). Fixed header (title + stepper "1 Where and
  what · 2 Media · 3 Caption", steps clickable once valid) and fixed footer (Back · Next · Save post, right-aligned,
  always visible). ONLY the body scrolls. Rule note: sheets / modals are the one place a body may scroll (R-DS "no inner
  scroll boxes" is about cards on pages) — add that exception to `ds:check` if it flags it.
- **Step 1 — Where and what:** platform cards Instagram / Facebook / LinkedIn (multi-select, ≥ 1); post type Single
  image · Carousel (2–10) · Video / Reel (1 video); title (prefilled "Post N", editable).
- **Step 2 — Media:** left column = the job's folders (from deliverables' paths; folder name + count of usable files;
  `ref` / `qa` / `old` zones and non-media hidden; "All files" last). Right = the selected folder only: filter Images /
  Videos (preset by the post type), search by clean name, grid of 4:5 thumbs with clean titles (never raw codes as the
  main line; file name muted on hover). Selection shows a number badge; a selected tray at the bottom of the body shows
  the order (drag to reorder + arrow buttons for keyboard). Limits follow the type (single = 1, carousel 2–10, video = 1
  video); Next stays possible but shows the plain-words reason when the count is wrong.
- **Step 3 — Caption:** one tab per chosen platform + "Same text for all" switch (writes the same text into each chosen
  platform's caption, not `all`); counter /2200, `dir="auto"`. Live preview on the right (below on < 1024) = the real
  `PostFrame` for the ACTIVE tab, with the chosen media and the media's own ratio (all 4:5 → 4:5, else 1:1).
- **Edit** opens on step 3 with everything prefilled (steps 1–2 reachable). Edit on a Drive post keeps "Reset to Drive
  version". Errors in plain words.

## Checks
`npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`. Playwright (mock) at 1536 and
390, light + dark: the body scrolls and the footer stays visible; a folder click shows only that folder; carousel with
3 images → reorder → Instagram + LinkedIn captions → preview follows the tab → save → frame shows 1/3; Reel type shows
videos only. Mock: give the content job 3 folders (final, post-01, reels) + a few raw / logo files so the folder list is
real. Screenshots `web/qa/R2/` (5 max): steps 1, 2, 3 at 1536 light; step 2 at 390; step 3 dark.

## Reply (3 lines)
What changed · checks pass / fail · anything not done.
