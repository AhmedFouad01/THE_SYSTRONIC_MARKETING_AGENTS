---
name: tsst-motion-sk-007-code-motion-arabic-text-overlays
description: Use when Arabic or mixed AR/EN on-screen text, captions or CTA must be drawn in code (HTML to MP4) and kept inside the platform safe box.
id: TSST-MOTION-SK-007
team: motion
owner: MOTION_AG
status: UNVALIDATED
version: 0.1
trigger: Use when Arabic or mixed AR/EN on-screen text, captions or CTA must be drawn in code (HTML to MP4) and kept inside the platform safe box.
---

# TSST-MOTION-SK-007 - Code-motion Arabic Text Overlays

Status: `UNVALIDATED` | Owner: `MOTION_AG` | Sources: LENS-MO-001 sections 2-3, SPARK-MO-001 sections 1 and 4, `TSST/CREATIVE/tools/code-motion/README.md`. Animation craft: TSST-MOTION-SK-001 (`ref/code-motion.md`).

## Objective
Draw all on-screen text in HTML, render it with the code-motion tool, check it, and combine it with the video using ffmpeg. Arabic is never baked into generated frames.

## Method
1. **Text sheet:** every line with id, text, start/end s, language, role (hook / caption / CTA). One hook variant = one text sheet.
2. **HTML page** 1080x1920 defining `window.seek(t)` (the tool requires it). `dir="rtl" lang="ar"` on Arabic blocks; each English or number run in its own `<bdi>` or `<span dir="ltr">`; `dir="auto"` for user-entered text. Use an installed Arabic face (Cairo proven). No `letter-spacing` on Arabic (breaks joining); no per-letter animation on Arabic, animate by line or word; Arabic motion enters from the right.
3. **Safe box** (SPARK, Meta Reels 14/35/6): at 1080x1920 keep 269 px top, 672 px bottom, 65 px each side, a 950x979 px box. All text, logo and CTA inside. Use CSS variables `--top:269px; --bottom:672px; --side:65px` so one value moves everything. TikTok: caption max 4 lines (about 100 chars); check its Arabic RTL safe-zone file in the Ads Manager preview (pixel values not published).
4. **Logo:** the approved file, composited as an image; never regenerated or retyped.
5. **Render** per the README: copy `capture.mjs` to `C:\Users\10\tsst-tools\code-motion`, run `node capture.mjs --html ... --out ... --fps 30 --duration N --width 1080 --height 1920 --mp4 ... --ffmpeg <path>`. Frames and MP4 are scratch, never committed. Text readable muted at phone scale; no static still over 50% of runtime.
6. **Alpha overlay:** current `capture.mjs` writes opaque PNG frames and an H.264 MP4 (no `omitBackground`, no alpha codec). Alpha needs a tool change (DEV_AG task); do not claim alpha until it exists. Interim: render the text over a clean background for AE compositing, or request the alpha flag.
7. **ffmpeg only for concat and mux:** join clips, add the audio track, lay a ready overlay file. drawtext does shape Arabic (HarfBuzz/FriBidi, local test OK) but has no layout control, so it is not used for text.
8. **Render QA (mandatory):** export frames of the final cut at 1 s, mid and end (plus the end card) and view them at phone scale with the safe-box guide overlaid. Check: letters joined, right-to-left order, mixed AR/EN and digits in order, punctuation on the correct side, nothing outside the box, no collision with caption/UI zones, text equals the approved sheet. Any fail returns to step 2.

## Failure patterns
Disjoined or reversed letters; Latin text jumping inside an Arabic line; text in the bottom 672 px; letter-spacing on Arabic; per-letter Arabic animation; generated Arabic or logo; text too brief to read; HTML preview called the final render; frames committed to the repo.

## Output contract
`text_sheet.md`, `overlay.html`, rendered overlay MP4 (scratch path), QA frames (1 s, mid, end) with a verdict per frame, final muxed MP4 path. Readiness `NOT_READY` until the CREATIVE brand check.

## Acceptance checks
- Every text block sits inside the 269/672/65 margins in all QA frames.
- Arabic joined and RTL; mixed AR/EN verified on the real strings.
- Text matches the sheet character by character.
- Logo is the approved file.
- QA frames exist and were viewed, not assumed.
- Alpha claimed only if the tool supports it.
