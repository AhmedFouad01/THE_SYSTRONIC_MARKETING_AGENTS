# VILL-Studio New Alamein reel v2 - SHOT LIST (CREATIVE_AG, 2026-10-08)
Skills: TSST-CREATIVE-SK-016 (ref/shot-grammar.md, ref/cuts-rhythm.md), SK-014 (ref/ai-video-pipeline.md, ref/models.md), SK-015 (ref/easing.md, principles.md), SK-010 (QA). Status: PREVIS recipe, NOT_READY, UNVALIDATED. Nothing generated.
Input: v2/BEAT_SHEET.md (LENS, approved). Format 9:16, 1080x1920, 18 s, 25 fps (set AE comp to match the owner's music/export; if 30 fps, snap the same seconds to frames), sound-off safe, EN text only.

## Owner decisions applied (2026-10-08)
1. Story = "empty shell -> finished home". Beats 1-2 (empty parquet rooms) and 3-5 (finished rooms) are NOT presented as the same room. No match-cut between them, no "same framing" before/after. Existing references used as they are.
2. Hook split over three cards ("Empty shell." / "Sea view." / "Finished.") is OK. END CARD = LOGO ONLY, no line (beat 6 line "One team, start to finish." is dropped).
3. Beat 5 REGENERATED with a clearer move (s06 v1 motion too subtle). Start frame = the already accepted upscaled `shots/s06-stonewall/out/still_v1.jpg` -> 0 still credits.

## Note on s06 recipe files (stale, not edited)
`shots/s06-stonewall/RECIPE_STILL.md` and `RECIPE_VIDEO.md` describe Relight (medium) and Seedance 2.5 as primary. What actually ran: Relight skipped, Upscale creative 2x subtle (FilmAndPhotography, resemblance 6, creativity -2), Kling 2.5. The recipes also ask for a 6-8% move: that is the move that proved too subtle. Use the MEASURED pipeline below, not those files.

## Pipeline per shot (measured, s06)
Upload real still (reference only, 0 cr) -> Expand 9:16, top/bottom only (50) -> [Retouch only if red plates or artefacts] -> Upscale creative 2x subtle, FilmAndPhotography, resemblance 6, creativity -2 (90) -> Kling 2.5 i2v, 5 s, 1080p, 9:16, start frame only, no end frame (325). Same upscale settings on every still (avoids texture jumps). Re-quote with `simulate_cost` before any MCP run; web app = 0 credits on the unlimited plan.

Common negative prompt (all shots, append shot-specific items): `morphing, warping or melting walls, wavy lines, texture crawling, flicker, flashing, strobing light, added objects, extra furniture, extra lamps, people, hands, pets, text, logo, subtitles, watermark, handheld shake, fast zoom, orbit, lens flare, fog, haze, colour shift to blue, saturated orange`

Common grade words (put in every prompt for one look): `warm natural light, calm, quiet premium, photorealistic 35 mm architectural film look, keep the room exactly as in the first frame`.

Camera wording rule: one move, "clearly visible but slow", named distance, camera level. Target push = about 15-20% closer (about 1 m) over 5 s, ease-in-out (Kling has no ease control: ask for "smooth steady, gentle start and soft settle"). Never fast, no stacked moves.

## Shot table

Reference files are in `TSST/brands/vill-studio/photos/products/` ("reference only", no raw pixel reaches the final). Numbers follow images_contact.png.

### S1 | Beat 1 | reel 0.0-3.0 | gen 5 s -> use 3.0 s (src 0.0-3.0)
- Source: #3 `ChatGPT Image Oct 7, 2026, 06_29_45 AM-3.png` (primary; #1 as light/colour ref only)
- Still steps: Expand 9:16 top/bottom (50). Prompt: `Continue the same empty room: plain bare plaster walls up to a plain ceiling at the top, and dark parquet floor with the same long warm sun streaks at the bottom. Same light, same materials, no new objects.` Retouch: n (y only if the expand adds objects). Upscale creative 2x subtle (90).
- Kling prompt: `Slow steady dolly-in toward the glazed door and sea window at the far end of an empty room, camera level at eye height, moving about one metre forward over the shot, gentle start and soft settle, no pan. Late-afternoon sun from the window side lays warm streaks on the dark parquet, the light patch slowly creeps forward across the floor. Bare plaster walls, the sea strip behind the glass stays modest and unchanged. Everything else perfectly still. [common grade words]`
- Negative: common + `furniture, curtains, plants, enlarged sea, boats, islands, new doors or windows`
- Text: "Empty shell." EN, upper-middle band (y about 380-620 px of 1920, x within central 80%), in 0.5 s, out by 2.7 s. Safe zone: off bottom third, off top 250 px (platform UI margins: check current spec, not confirmed).
- Transition in: fade up from #011C2C 0.2 s (or hard start); out: HARD CUT mid-move (clip ends still pushing) into S2.
- Est. credits: 50 + 90 + 325 = **465**

### S2 | Beat 2 | reel 3.0-6.0 | gen 5 s -> use 3.0 s (src 1.0-4.0)
- Source: #1 `ChatGPT Image Oct 7, 2026, 06_29_43 AM-1.png` (primary; #3 light ref only)
- Still steps: same as S1 with this expand prompt: `Continue the same empty room: bare plaster walls and plain ceiling at the top, dark parquet floor at the bottom, same sun streaks. Same light, no new objects.` Retouch n. Upscale same settings.
- Kling prompt: `Slow steady dolly-in toward the window glass, camera level, moving about one metre forward over the shot (clearly visible, never fast), ending close to the glass frame; the sea and horizon behind the glass stay as in the first frame, horizon in the upper third; the same warm low sun patch slowly crosses the parquet. Everything else perfectly still. [common grade words]`
- Negative: common + `bigger sea, panoramic view, yachts, islands, new horizon, wrap-around windows, boosted water colour`
- Text: "Sea view." in 3.3 s, out by 5.7 s, same position as S1 (position lock = no jitter between cards).
- Transition in: HARD CUT from S1 mid-move, same push direction (cuts-rhythm AI note). Out: HARD CUT to S3 (contrast: window light to warm macro, different rooms; a dissolve is NOT used, it would blend two AI textures and imply one space).
- Est. credits: **465**

### S3 | Beat 3 | reel 6.0-8.5 | gen 5 s -> use 2.5 s (src 1.0-3.5)
- Source: #9 `ChatGPT Image Oct 7, 2026, 06_29_54 AM-9.png` (stone detail + bench)
- Still steps: Expand 9:16 (50), prompt `Continue the same stone wall upward to the ceiling edge with the warm glow line, and the floor below the bench. Same lighting, same materials, no new objects.` Retouch **y** (red wall plates; prompt `Plain rough natural limestone texture continuing seamlessly, same lighting`; add no fixtures). Retouch credits not measured: not confirmed, quote with `simulate_cost` (assume 0-90 reserved). Upscale same settings (90).
- Kling prompt: `Slow steady lateral slide to the right (a truck, camera moves sideways about 40 cm, parallel to the wall, no rotation, no zoom), shallow depth of field, along a rough carved natural-stone wall lit by a warm wall-wash glow along its top edge, a wooden bench beneath; the light grazes the carved relief so every ridge and shadow stays crisp and unchanged. Everything else perfectly still. [common grade words]`
- Negative: common + `smooth plaster, brick pattern, tile pattern, flattened relief, red plates, switches, sockets, new fixtures, cushions on the bench`
- Text: none. Centre clean.
- Transition in: HARD CUT. Out: HARD CUT into S4 on the same screen direction (S4 also slides right) so the lateral motion carries across.
- Est. credits: 50 + 90 + 325 = **465** (+ retouch, not measured)

### S4 | Beat 4 | reel 8.5-11.5 | gen 5 s -> use 3.0 s (src 1.0-4.0)
- Source: #7 `ChatGPT Image Oct 7, 2026, 06_29_51 AM-7.png` (primary; #6 `...06_29_50 AM-6.png` marble/floor texture ref only)
- Still steps: Expand 9:16 (50), prompt `Continue the same room: smooth ceiling with warm recessed cove light at the top, same polished marble floor at the bottom. Same lighting, no new objects.` Retouch: n by default, **check the expand output for red plates; if present y**. Upscale same settings (90).
- Kling prompt: `Slow steady lateral slide to the right at low camera height, camera moves sideways about 50 cm without rotation, past a living and dining corner: sofa, round coffee table and dining set stay exactly as in the first frame; polished marble floor with soft reflections of the warm ceiling cove light, soft daylight from the left. Only the parallax of the room changes. [common grade words]`
- Negative: common + `new furniture, rearranged furniture, sea view through windows, plants, decor, changed marble veining`
- Text: none, no logo.
- Transition in: HARD CUT from S3 (same slide direction). Out: HARD CUT into S5 (push-in vs slide: change of move type and size, MS to MS-CU).
- Est. credits: **465** (+ retouch if needed)

### S5 | Beat 5 | reel 11.5-16.5 | gen 5 s -> use 5.0 s (src 0.0-5.0, no trim handle; see risk 3)
- Source: accepted still `shots/s06-stonewall/out/still_v1.jpg` (derived from #8 `...06_29_52 AM-8.png`). NO new still. Check it is 9:16 1472x2624 and unchanged.
- Kling prompt (regenerate, clearer move): `Smooth steady dolly-in toward the rough natural-stone feature wall of a luxury bedroom at dusk, camera level at bed height, moving clearly forward about 1 to 1.2 metres over the shot (about 18% closer), gentle start and soft settle, no tilt, no pan. The amber wall-wash glow along the stone edge slowly grows a little stronger, deepening the shadows in the stone relief. The tufted headboard, bed, bedding and the two woven pendant lamps stay exactly as in the first frame, pendants hang motionless with a faint warm bulb glow. [common grade words]`
- Negative: common + `swinging pendants, extra pendants, moving bedding, curtains blowing, smoothed stone, brick pattern, bluish cast`
- Text: "Finished." in 12.5 s, out by 15.6 s, on a plain upper wall area, off the glow edge and pendant cords, off bottom third; contrast check against the lit wall (SK-010, WCAG-style, text colour #F4F4F4, soft shadow only if needed).
- Transition in: HARD CUT from S4. Out: ease-in-out fade to #011C2C over 16.0-16.5 (the dark colour is reached exactly at 16.5), then the end card.
- Retry plan: if the move is still too timid, run a 10 s gen and use the first 5 s? NO (10 s moves slower per second). Instead raise the ask to "about 1.5 metres / 25%".
- Est. credits: **325**

### S6 | Beat 6 | reel 16.5-18.0 | no generation
- End card: solid #011C2C, approved logo `TSST/brands/vill-studio/approved/brand/logo/Wordmark Dark Transparent.png` (1080x1080), composited as-is (never regenerated), centred horizontally and vertically within the safe zone, about 55-65% of frame width (check clear space per brand guide), orange only inside the logo, NO text line, no CTA, no contact.
- Est. credits: **0**

## Totals
| Item | Credits (MCP) | Web app |
|---|---|---|
| S1 | 465 | 0 |
| S2 | 465 | 0 |
| S3 | 465 + retouch (not measured) | 0 |
| S4 | 465 (+ retouch only if needed) | 0 |
| S5 | 325 | 0 |
| S6 | 0 | 0 |
| **Total, one pass, no retries, no retouch** | **2,185** | **0** |
| Reserve: retouch on S3 (+ S4 maybe), unmeasured | not confirmed | 0 |
| Worst case, every video re-run once (5 x 325) | +1,625 = 3,810 | 0 |
Recommendation: run everything in the Magnific web app (0 credits); use MCP only for a single re-run if the owner approves a `simulate_cost` quote. Max 3 rounds per stage, name the defect on each re-run.

## Edit plan (AE assembly; timecodes at 25 fps)
Cut points (seconds): 3.0 | 6.0 | 8.5 | 11.5 | 16.5. Lengths 3 / 3 / 2.5 / 3 / 5 / 1.5: long-short-long rhythm is partial; S5 is the "breath" and reveal (cuts-rhythm: release = wider and longer). All cuts hard, on motion (S1-S2 push, S3-S4 right slide). Music is added later by the owner: once BPM is known, nudge cut points to the nearest frame of a 2 or 4-beat grid (frames = fps x 60 / BPM) and re-check the last cut against the track end. Colour: one grade pass across all five clips (SK-019 post-finishing) before text.
Per-shot trim = the src windows above (cut mid-move, avoid the first 0.5 s start-up and the final settle where stated). Scale to 1080x1920 from the 1080p Kling output (no up-crop needed).

Text motion (SK-015 ref/easing.md; durations per principles.md heuristic: small transition 200-300 ms):
| Cue | Text | In | Out |
|---|---|---|---|
| 0.5-2.7 | Empty shell. | 0.4 s, opacity 0-100 + rise 16 px, Cubic Out (.33,1,.68,1); in AE: Easy Ease Out on position/opacity keys with high-influence out-handle, verify by speed graph per after-effects.md | 0.3 s opacity fade, Cubic In (.32,0,.67,0) |
| 3.3-5.7 | Sea view. | same | same |
| 12.5-15.6 | Finished. | 0.5 s, same curve (reveal moment, slightly slower, Expo Out (.16,1,.3,1) allowed) | 0.3 s Cubic In |
Rules: same font, size, position band and colour on all three cards (one family of motion); never a card over a cut (each card fully out before the next cut); hold at least 1.5 s each (all three satisfy it: 2.2 / 2.4 / 3.1 s, 0.5 s eased in/out inside).
End card: S5 fades to #011C2C over 16.0-16.5 (Sine InOut .37,0,.63,1); logo fades in 16.5-17.0 (Cubic Out, scale 96-100% optional), holds to 18.0 (about 1.0 s of full logo). No line.

## QA checklist (per shot; SK-010, scrub the real file)
Extract a frame strip: `ffmpeg -i shotN.mp4 -vf "fps=2,scale=270:-1,tile=5x2" strip_sN.png` (ffmpeg at `C:\Users\10\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\`), then view first / middle / last frames at full size.
Per shot (S1-S5):
- [ ] Geometry stable: walls, window/door frames, furniture, stone cracks and bench stay put; verticals straight; no melting.
- [ ] No morph or texture crawl between first, middle, last frame (stone relief, parquet grain, marble veining).
- [ ] No flicker or pulsing in glow lines / cove light (step-through 10 frames at the cut windows).
- [ ] Move is slow, visibly present (about 15-20% push or the stated slide), no shake, soft settle, direction as specified.
- [ ] No people, text, logo, ghost objects, no new fixtures or decor; red plates absent (S3, S4).
- [ ] Honesty: S1-S2 sea strip not enlarged and no boats/islands; S3-S5 no sea; empty and finished rooms never read as one room.
- [ ] 9:16, 1080x1920, 5.0 s, silent; trim window (src range above) is clean.
- [ ] Stone matches across S3 and S5 (rough carved natural stone, not smoothed); warm tone of S3-S5 consistent after grade.
Assembly: text inside safe zone and off glow edges; contrast OK; end card colour exactly #011C2C; logo not distorted, clear space kept; muted test reads; final render reviewed muted and with the owner's sound. Final export QA per FINAL_ASSET_GATE; AI-content labelling rules not confirmed (SPARK/Lead check Meta rules before posting). Max 3 rounds per stage.
