---
name: tsst-motion-sk-007-code-motion-arabic-text-overlays
description: Use when Arabic or mixed AR/EN on-screen text, prices, captions, logos or CTA must be built in code (Remotion kit) and kept inside the platform safe box.
id: TSST-MOTION-SK-007
team: motion
owner: MOTION_AG
status: UNVALIDATED
version: 0.3
trigger: Use when Arabic or mixed AR/EN on-screen text, prices, captions, logos or CTA must be built in code (Remotion kit) and kept inside the platform safe box.
---

# TSST-MOTION-SK-007 - Code-motion Arabic Text Overlays

Status: `UNVALIDATED` | Version 0.3 (2026-11-05) | Owner: `MOTION_AG` | Sources: LENS-MO-001 sections 2-3, SPARK-MO-001 sections 1 and 4, R53 (2026-11-05); v0.2 field evidence EX-MO-001 (`TSST/MOTION/examples/EX-MO-001_sale-offers-40s.md`). Tool: `TSST/MOTION/tools/remotion-kit/README.md`. Animation craft: TSST-MOTION-SK-001.

## Objective
Build all on-screen text, numbers, logos and the CTA in code with the Remotion kit, in the same render as the picture and the audio, and check it. Arabic, numbers and logos are never baked into generated frames (R53).

## Method
1. **Text sheet:** every line with id, text, start/end, language, role (hook / title / caption / CTA). One hook variant = one text sheet. Captions follow the VO lines (SK-002).
2. **Numbers come from data, never typed:** snapshot the client's source (offers file, landing data) into `src/job/`, record its sha256, compute prices, savings and percentages with the client page's own math (e.g. `toLocaleString('en-US')`, `Math.round(save / was * 100)`), and check every on-screen number with a script before render.
3. **Arabic in the kit:** `Ar` keeps every digit run LTR (`<bdi dir="ltr">`) so "48%" and "3,300" never flip; `Words` animates per word in reading order (never per letter); no `letter-spacing` on Arabic. Fonts load through `lib/fonts.tsx`, which holds every frame until the weights are ready (no fallback-font frame). Proven faces: Alexandria (OFL, ships with the kit), Cairo.
4. **Safe box:** kit default = SPARK Meta Reels 14/35/6 (top 269, bottom 672, sides 65 px at 1080x1920; `SAFE` and `CAPTION` in `src/job/brand.ts`). A brief may set another box for one placement: write it in `brand.ts` and the job notes, and tell SPARK. EX-MO-001's brief used top 250 / bottom 350 / right rail 140, which puts its captions (y 1390–1550) inside Meta's bottom 35%: check against the placement before Meta Reels delivery. TikTok: caption max 4 lines; check the RTL safe zone in the Ads Manager preview.
5. **Logo:** the approved file, composited as an image from `LOGOS` in `brand.ts`; never regenerated or retyped. Pending client facts (contact number, vector logos) live once in `brand.ts` (`CONTACT`, `LOGOS`) so one edit + a re-render swaps them.
6. **Printed prices on product photos (cover method):** measure the printed sticker's centre and radius on each image once; draw the new sticker in code exactly over it so the base disc never moves and nothing printed shows through; every move happens in layers above the disc. Prove it with a debug render that paints the disc magenta and count leaking pixels (EX-MO-001: 17/17 frames, 0 pixels).
7. **Text never moves with the picture:** zoomed or shaken containers hold only the picture; text sits outside or in `<Steady>` (SK-001).
8. **Render** in the kit (`README.md`): one composition per variant, one H.264 render with audio. HTML capture (`TSST/CREATIVE/tools/code-motion/`) is only for quick single-overlay tests; no alpha overlays, no drawtext for text.
9. **Render QA (mandatory):** stills with the safe-box overlay (`scripts/stills.mjs`, `safe = 1`) at 1 s, 3 s, every scene (its start + 15 f), mid and the end card; view at phone scale. Text that looks close to an edge is measured, not judged by eye: find its outermost light pixel in the frame (EX-MO-001's legal line ends at x = 942 against a 940 edge, inherited by the 15 s cutdown). Check: letters joined, right-to-left order, digits and mixed AR/EN in order, punctuation on the correct side, nothing outside the box, no collision with captions/UI, text equals the sheet, numbers equal the data. Then `qa/check_video.py` on the final file. Any fail returns to the step that caused it.

## Failure patterns
Disjoined or reversed letters; Latin or digits jumping inside an Arabic line; a price typed by hand; text outside the placement's safe box; letter-spacing on Arabic; per-letter Arabic animation; text inside a zooming container; generated Arabic or logo; a printed price showing around the new sticker; a fallback font in any frame; text too brief to read; a preview called the final render; frames or renders committed to the repo.

## Output contract
`text_sheet.md`, the job's `src/job/` (brand, data snapshot + sha256, timeline, scenes, sfx), QA stills with a verdict per still, cover-debug count when stickers are covered, final MP4 path + `check_video.py` output. Readiness `NOT_READY` until the CREATIVE brand check.

## Acceptance checks
- Every on-screen number traced to the data snapshot by a script.
- Every text block inside the placement's safe box in all QA stills.
- Arabic joined and RTL; digits and mixed AR/EN verified on the real strings.
- Text matches the sheet character by character.
- Logo is the approved file; pending facts only in `brand.ts`.
- Cover debug at 0 leaking pixels when printed prices are covered.
- QA stills exist and were viewed, not assumed.

## Changelog
- 0.3 (2026-11-05): stills at scene start + 15 f; measure text near an edge. From MOTION-TRAIN-001 review. Stays `UNVALIDATED`.
- 0.2 (2026-11-05): R53 change: full builds in the Remotion kit (text + picture + audio in one render, no alpha overlays); numbers from data; `Ar`/`Words`; font gate; cover method; pending facts in one place; EX-MO-001 safe-box finding. Material change: stays `UNVALIDATED`.
- 0.1 (2026-10-10): installed (HTML capture + ffmpeg mux).
