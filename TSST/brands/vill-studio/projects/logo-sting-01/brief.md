# VILL Studio logo sting — STORYBOARD (step 1 gate, PREVIS, NOT_READY)

Status: concept A APPROVED by owner 2026-10-08 (PNG cut OK, sweep left to right, #011C2C + #01304A pool OK, 3.8 s OK). STEP 2 BUILD done: renders exist, readiness stays NOT_READY (owner review of renders pending).
Skills: TSST-CREATIVE-SK-015 (motion), -001 (brand system), -008 (art direction), -010 (compliance).
Method: `TSST/MOTION/skills/tsst-motion-sk-001-motion-design/ref/code-motion.md` (one HTML, GSAP paused timeline, `window.seek(t)`, capture with `TSST/CREATIVE/tools/code-motion/`).

## 1. Verified brand facts (measured from current files, 2026-10-08)

| Item | Value | Source file |
|---|---|---|
| Logo format | PNG only, 1080x1080 RGBA. **No SVG exists** under `TSST/brands/vill-studio/` or the pilot assets. A PSD exists (layered raster; not opened, no PSD tool installed) | `approved/brand/logo/*.png`, `approved/brand/Logo.psd` |
| Logo for dark ground | `Wordmark Dark Transparent.png` (light letters #F3F4F6 + orange #F58021, transparent bg). Pixel count: #F3F4F6 123,168 px, #F58021 17,523 px | `approved/brand/logo/Wordmark Dark Transparent.png` |
| Same lockup on petrol | `Wordmark Dark.png` (opaque #01304A bg). Use as the end-frame reference | `approved/brand/logo/Wordmark Dark.png` |
| Logo content bbox (1080 canvas) | x106–974, y356–691 = 868 x 335 px, centre (540, 523.5) | measured, Wordmark Dark Transparent |
| Separable parts | Not as SVG groups. As raster the lockup is 6 visually disjoint shapes: orange V-wedge (~x105–233, y463–673), light V-slab (~x193–415, y356–691), light "I" (~x336–518, y412–634), light "L" (~x460–720), light "L" (~x714–974), orange "STUDIO" (~x690–938, y656–691). Bboxes overlap (slanted shapes), so separation needs per-shape alpha masks cut from the approved PNG (connected components), never rectangle crops. Pixels untouched, nothing redrawn. Component bboxes read by eye from the render; re-measure in the build step | visual read of the PNG |
| Palette (logo = main palette) | petrol #01304A, white #F4F4F4 (the wordmark file measures #F3F4F6), orange #F58021 | `approved/ASSETS.yaml` (Lead pixel count 2026-10-07), pixel count above |
| Supporting dark | Owner allows a darker petrol shade. **#011C2C is not stored in any file I read**; it is a derived shade proposed here and needs owner OK (Q3) | `ASSETS.yaml` palette_rule |
| Orange use | Inside the logo only (V-wedge, STUDIO). The sting adds no other orange | brief + logo measurement |
| Fonts | **Alexandria (AR) + Inter (EN)**, installed on the PC. Cairo/Barlow in `BRAND_GUIDELINES_v1.0` is WRONG (the file's own header says stale), so the brief's "Cairo" is superseded. The sting needs no live type (logo only), so no font loads | `approved/ASSETS.yaml`, `status.md` 2026-10-08 |
| Superseded colours | #040136 navy, #EE8C01, `palette-v1.1.json`, `Logo.png` master colours: do not use | `ASSETS.yaml` |
| Clear space / min size | H = visible V height; exclusion >= H; visible mark >= 140 px on 1080 export. From the guidelines draft page 08 (draft is stale on colour/fonts; clear-space rule not contradicted elsewhere, treat as provisional) | `BRAND_GUIDELINES_v1.0/sources/08-clear-space.html` |
| Slant angle | 19.26 degrees off vertical (guideline geometry; consistent with the slab edges in the render) | `BRAND_GUIDELINES_v1.0/geometry.json` |
| Motion/voice cues | Direction B "light leads the eye"; Lugar Nefertiti benchmark; logo small; minimal text; English. Tone: "precise structure, calm truthful interiors" | `brands/vill-studio/status.md`, `VERBAL_IDENTITY_v1.0.md` |

Gap: no source defines logo-animation rules or a sound identity for VILL. Sections 2–7 are proposal.

## 2. Concept A (recommended), in one sentence

**"Light finds the mark":** a soft slanted edge of light, cut at the logo's own 19.26 degree angle, crosses a dark petrol frame and reveals the approved lockup behind it in order: light letters first, orange V-wedge next, orange STUDIO last.

Why it fits VILL: the brand rule is "light leads the eye". Here light literally leads the eye through the logo and orange (the accent) is where the eye lands last. Nothing moves except the reveal (Lugar Nefertiti restraint). One motion family: a slanted light-edge mask. The light is neutral white, never orange, so orange stays inside the logo.

## 3. Alternatives

- **A (recommended):** slanted light-edge mask reveal, staggered by shape, 3.8 s.
- **B "Lights come up":** whole lockup brought up like a room light: opacity 0 -> 1, brightness 0.4 -> 1, scale 1.03 -> 1 on the petrol frame. Simplest and safest, least ownable. Fallback if the logo cannot be cut into parts.

Rejected clichés: shockwave ring, particle burst, glitch, lens flare, bouncing/elastic logo, glow pulse.

## 4. Format plan (concept A)

| Variant | Size / fps | Duration | Layout |
|---|---|---|---|
| Master | 1080x1920, 30 fps | 3.8 s (114 frames) | logo width 760 px (scale 0.876, height ~293), centred x=540, optical centre y~900 (slightly above 960). Side margins 160 px |
| Wide | 1920x1080, 30 fps | same timeline | logo width 900 px, centred; sweep travels the full width at the same angle and times |
| Square | 1080x1080, 30 fps | same timeline | logo width 760 px, centred |
| Safe zone (master) | Reels/TikTok UI-safe: logo inside x 90–990, y 250–1500 | | logo is well inside |

Same timeline in all three: only layout constants (logo scale, sweep travel distance, pool size) change; times and easings are identical. Background flat #011C2C (proposed) with a soft #01304A light pool behind the logo; no photo, no text. Minimum visible mark of 140 px is exceeded everywhere.

## 5. Scene table (concept A, master; seconds)

Easings from `ref/easing.md` (CSS cubic-bezier; GSAP name in brackets). Everything is a pure function of t via `window.seek(t)`.

| Time in–out | On screen | Property animated (from -> to) | Easing (name + bezier) | Sound cue |
|---|---|---|---|---|
| 0.00–0.50 | Empty #011C2C frame; soft petrol pool fades in behind the logo position | pool opacity 0 -> 0.45; pool scale 0.92 -> 1.0 | Sine Out `.61,1,.88,1` (sine.out) | 0.00 quiet room-tone / air bed fades in |
| 0.30–1.50 | Slanted light edge (60 px feather, 19.26 deg) sweeps left to right; the 4 light shapes (V-slab, I, L, L) show as the edge passes | mask edge x -260 -> 1340 px along the slant; each shape translateX +28 -> 0 px and opacity 0 -> 1, stagger 0.10 s | edge: Quart InOut `.76,0,.24,1` (power3.inOut); settle: Quart Out `.25,1,.5,1` (power3.out) | 0.30 soft airy swell, low-passed, rising under the sweep (no whoosh hit) |
| 1.40–2.10 | Orange V-wedge appears: a second slanted edge moves top to bottom along the wedge | wedge mask edge 0 -> 100 % along the slant; opacity 0 -> 1; translateY -16 -> 0 px | Expo Out `.16,1,.3,1` (expo.out) | 1.50 one warm soft note, short tail (the "landing") |
| 2.00–2.60 | "STUDIO" (orange) revealed left to right by the same slanted edge | mask edge 0 -> 100 %; opacity 0 -> 1 | Cubic Out `.33,1,.68,1` (power2.out) | 2.00 very soft tick, quieter than the note |
| 2.60–3.80 | HOLD: complete approved lockup, static, centred; only the background pool dims slowly | logo transform fixed (scale 1, no drift); pool opacity 0.45 -> 0.30 | Sine InOut `.37,0,.63,1` (sine.inOut) | 2.60 note tail rings out to 3.80; room tone fades 3.4–3.8 |

Baked-in rules: approved pixels used as delivered; no recolour, outline, glow, blur or overshoot on the mark. The final frame must equal `Wordmark Dark.png` at the layout scale (pixel-compare in QA). Silent-safe: the piece reads fully with sound off.

## 6. Hold, clear space, safe zone

- Final hold 1.2 s (2.60–3.80), above the 1.0 s minimum; no motion on the logo during the hold.
- Clear space: provisional H = V height (~293 px in master); nothing but background inside it. Frame edges are exempt.
- Safe zone: logo stays inside the platform UI-safe area (section 4).

## 7. QA plan

Render master + two variants twice and compare frames (determinism). Frame strip at 30 fps, checked full size and at 360 px phone width:

| Frame time | Check |
|---|---|
| 0.00 | clean #011C2C, no stray pixels |
| 0.45 | pool in, nothing else visible |
| 0.70, 1.00, 1.30 | sweep angle 19.26 deg, soft feather, shapes cut cleanly (no halo, no jagged alpha) |
| 1.55, 1.85 | wedge mid-reveal; edge clean, gap to V-slab preserved |
| 2.30 | STUDIO mid-reveal, legible at phone size |
| 2.60, 3.20, 3.79 | final lockup identical to the approved file (pixel diff); #F3F4F6 / #F58021 within tolerance; no banding in the pool (subtle noise); clear space and safe zone overlays pass |
| Whole clip | normal-speed phone playback, no easing pops, no first/last-frame flash, same timing in 1920x1080 and 1080x1080, `seek` repeatable |

SK-010 checks: logo untouched, orange only in logo, no banned clichés, min size, contrast of light letters on #011C2C.

## 8. Open questions for the owner (max 3)

1. **Logo file:** there is no SVG. May we cut the approved `Wordmark Dark Transparent.png` into its 6 shapes by alpha masks (pixels unchanged) so they reveal separately? If you have an SVG/AI of the logo, send it: cleaner and sharp at 1920 wide. Otherwise we fall back to concept B (whole-mark reveal).
2. **Sweep direction:** the logo is Latin, so I plan left to right. Do you want right to left to match the Arabic-first feel of other work?
3. **Background and length:** OK to use #011C2C (derived darker petrol, not yet in the palette files) with a #01304A light pool, and is 3.8 s acceptable?

## 9. BUILD NOTES (step 2, 2026-10-08)

Files: `cut_parts.py`, `parts/*.png` + `parts.json`, `index.html`, `render/sting_{1080x1920,1920x1080,1080x1080}.mp4`, `qa/strip_*.png`. Frames are scratch in `C:\Users\10\tsst-tools\code-motion\` (not on Drive).
- Cut: 11 raw alpha components -> 6 parts (4 light shapes, V-wedge, STUDIO; STUDIO letters merged by 14 px bbox gap, light slabs never merged because slanted bboxes overlap). Recomposed parts vs source: max RGBA diff 0, no pixel in two parts, none unassigned. Measured logo bbox x106–973, y356–690.
- index.html: canvas drawing, GSAP 3.12.5 (jsDelivr, pinned) paused timeline over a proxy object, `window.seek(t)`. Format via `?format=WxH` or, if absent, the viewport size (the capture tool cannot pass a query string). `?native=1` = logo 1:1 for the pixel check. Easings are cubic-bezier solved in code from `ref/easing.md` values.
- Light shapes: the 28 px settle is tied to the sweep edge reaching each shape (natural stagger) instead of a fixed 0.10 s stagger; the mask replaces the opacity ramp. Orange wedge uses a second edge (same 19.26 deg family, top to bottom). Seeded static noise tile against banding.
- QA: native 1:1 end frame vs source opaque pixels (140,691 px) max diff 0; master 1080x1920 end frame vs PIL-resampled source (105,637 px) mean diff 0.0; determinism: frames 20, 60, 110 of two separate renders hash-identical; strips viewed for 1080x1920 and 1920x1080.
- Fix round 1 (of 2): the sweep end value left the trailing corner of the last L slightly faded in the final frame (found by the native diff = 32); end value raised so the mask opens fully. Also trimmed the dead lead-in of the sweep.
- Sound cues in section 5 are not rendered (silent video).
- Limits: no human playback review yet; not tested on a phone; the pixel checks ran on PNG frames, not the yuv420p crf16 mp4.
