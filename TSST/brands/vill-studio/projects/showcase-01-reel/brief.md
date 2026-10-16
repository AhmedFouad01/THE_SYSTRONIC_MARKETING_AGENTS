v1 = technical test only (script works); creative REJECTED 2026-10-08 — see shots/
# showcase-01 Reel v1 — STORYBOARD (CREATIVE_AG, 2026-10-08)
Status: PREVIS (storyboard + script, not rendered). Skills: SK-015 (motion), SK-008 (direction B), SK-010 (QA). All UNVALIDATED.
Spec: 9:16, 1080x1920, 30 fps, **19.6 s (588 frames)**. Message = approved hook, verbatim from `../showcase-01/COPY_DECK.md`: **Empty shell. Sea view. Finished.** (3 beats, 5 words). Key frames: `storyboard_frames.png` (built from the real sources; magenta lines = safe-zone limits y250 / y1250; flash and dissolves not shown).

**Direction B, "light leads the eye":** sunlight in the empty shell (before) -> a warm-white light flash on the cut -> the lit stone wall (after) -> sea -> logo. No petrol bands, no haze, no vignette: photos are clean; text sits on the photo's own plain surface in dark petrol #011C2C. The only veil is the 0.5 s light flash, a full-frame transition, not a static overlay. Orange only inside the logo.

## Easing (ref/easing.md; AE influence/speed DERIVED per ref/after-effects.md "AE from cubic-bezier", verify in Graph Editor)
| Name | cubic-bezier | AE out influence / out speed | AE in influence / in speed | Use |
|---|---|---|---|---|
| easeOutCubic | .33,1,.68,1 | 33 % / 3.03 x avg | 32 % / 0 | entrances, dissolves |
| easeInCubic | .32,0,.67,0 | 32 % / 0 | 33 % / 3.03 x avg | exits, flash build-up |
| easeInOutSine | .37,0,.63,1 | 37 % / 0 | 37 % / 0 | slow camera push/pull |

avg = |delta value| / segment duration (px/s or %/s). One easing family for the whole piece.

## Shot list
Times = when the shot is fully visible. Layer in-point is 0.33 s earlier where a 10-frame dissolve (opacity 0->100, easeOutCubic) brings it in. Stills (1086x1448, 3:4) are filled to height (133 %) and cropped to 9:16; scale % is relative to the 1448 px height; position = layer centre in the comp. Source stills are in `TSST/brands/vill-studio/photos/products/` as `ChatGPT Image Oct 7, 2026, 06_29_NN AM-K.png` (script finds them by the `-K.png` suffix).

| # | Time | Source | Framing / crop | Motion | On-screen text | Transition in |
|---|---|---|---|---|---|---|
| S1 | 0.0–2.8 | still K=1 (06_29_43) | Empty room, sea window upper-centre, parquet lower half | Scale 134->142 %, pos (560,960)->(470,1010) over 0.0–2.9, easeInOutSine (37/0) | "Empty shell." (0.5–2.6) | opens on image |
| S2 | 2.8–5.0 | still K=3 (06_29_45) | Window with sea at centre, open door right | Scale 134->144 %, pos (540,960)->(500,1010), easeInOutSine | "Sea view." (3.0–5.0) | 10-frame dissolve |
| S3 | 5.0–7.0 | still K=6 (06_29_50) | Empty marble corridor, vanishing point centre-left | Scale 134->140 %, pos x 540->600, easeInOutSine | none | 10-frame dissolve |
| T | 6.5–7.5 | solid #F4F4F4 (LIGHT_FLASH) | full frame | Opacity 0->100 (6.5–7.0, easeInCubic) then 100->0 (7.0–7.5, easeOutCubic) | none | **light-driven cut**: hard cut sits under 100 % white at 7.0 |
| S4 | 7.0–10.5 | video `WhatsApp Video 2026-10-07 at 2.27.00 AM.mp4`, **src 10.0–13.6 s** (1:1 speed, audio off) | 576x1024 portrait: lit stone wall + bench left, curtains + sofa right, marble floor | Scale 188->196 %, easeInOutSine (camera move is in the footage) | "Finished." (7.6–10.5), lower-left on bright marble | hard cut under flash |
| S5 | 10.5–12.5 | still K=7 (06_29_51) | Living/dining: sofa, coffee table, dining set, stone wall behind | Scale 134->140 %, pos (560,960)->(500,960), easeInOutSine | none | 10-frame dissolve |
| S6 | 12.5–14.3 | still K=8 (06_29_52) | Bedroom: lit stone wall + headboard, glow edge top-left | Scale 138->146 %, pos (480,990)->(420,1040) (tilts up toward the glow), easeInOutSine | none | 10-frame dissolve |
| S7 | 14.3–15.6 | still K=9 (06_29_54) | Tight on stone texture + bench; red wall sign visible (see risks) | Scale 136->146 %, pos (540,960)->(520,990), easeInOutSine | none | 10-frame dissolve |
| S8 | 15.6–17.6 | still K=10 (06_29_55) | Sea aerial, horizon upper-middle third | Pull-back: scale 146->134 %, pos y 1020->960 (callback "the view stayed"), easeInOutSine | none | 10-frame dissolve |
| S9 | 17.6–19.6 | solid #011C2C + `brands/vill-studio/approved/brand/logo/Wordmark Dark Transparent.png` | Wordmark centred (540,900), 62 % of file = 538 px wide, as-is, never redrawn | BG opacity 0->100 over 17.1–17.7 (easeInOutSine); logo opacity 0->100 over 17.8–18.3 and scale 59->62 % over 17.8–18.4 (easeOutCubic) | none (logo only; no CTA, contact removed per Ahmed) | fade from sea to dark petrol |

Dropped stills: K=2 (near-duplicate of 1), K=4 and K=5 (marble before shots, duplicate of 6).
Text: rise 28 px + opacity 0->100 over 0.4 s (easeOutCubic); exit opacity 100->0 over 0.27 s (easeInCubic). One element moves at a time; no per-character animation.

## Checks
- **Duration:** 19.6 s (spec 15–20).
- **Text reading time** (>= ~0.3 s/word): 5 words = 1.5 s minimum. Fully visible holds: "Empty shell." 1.4 s (2 words); "Sea view." 1.3 s (2 words); "Finished." 2.2 s (1 word). Pass with >= 2x margin. Arabic: n/a.
- **Safe zones** (keep y 250–1250): text baselines y=470 and y=1190 (spans ~396–492 and ~1116–1192); logo ~796–1004; left margin x=80, right icon column (x > ~950) unused. Photos run full-bleed beneath the UI zones.
- **Contrast** (dark petrol text vs the photo pixels under it, measured on the key frames with the real font, mean of the text box): S1 3.7:1 (weakest; 104 px bold counts as large text, passes 3:1 but not 4.5:1), S2 4.0:1, S4 5.6:1. If S1 reads weak in the render, switch only that line to #F4F4F4 (4.25:1 measured) at the cost of colour consistency. Decide on the render.
- **Brand:** #01304A not used as a layer; #011C2C only as end-card ground and text; #F4F4F4 only in the flash; Cairo 800 (`assets/fonts/cairo.ttf`, variable); orange only inside the logo.
- **Template check:** 8 beats, 3 different camera framings, 2 text positions, one video move; no repeated layout.

## Music / SFX
None supplied. Comp markers at 0.0 s (MUSIC placeholder), 7.0 s (flash peak, optional SFX hit), 17.8 s (end card, music resolve). Ahmed adds a licensed track.

## Footage notes
Video used: only `...2.27.00 AM.mp4` (58.5 s clean finished walkthrough), segment 10.0–13.6 s; frames at 10.0 / 11.75 / 13.5 inspected: no people, no debris, no boxes. EXCLUDED: `2.27.01 AM (1)` (night balcony, workers), `2.27.01 AM (2)` (construction mess, workers), `2.27.01 AM` (unneeded). Native 576x1024; comp scale 188–196 % is a ~1.9–2.0x upscale (softer than the stills). No AI upscaling (out of scope). The red wall sign is visible in the video segment and in still K=9; it needs the retouch already flagged in COPY_DECK before publication.
