# s06-stonewall - RECIPE_VIDEO (image-to-video, Magnific web app)
Status: PREVIS recipe. Start frame = accepted `out/still_v1.png` (9:16). Model facts from the Magnific video catalog (read 2026-10-08).

## Model choice (from the catalog)
- PRIMARY: **Seedance 2.5** (rank 1, tier sota: best overall, directed camera work, realistic). 9:16 supported; durations 4-30 s (pick 6); up to 1080p (pick 1080p); start + end frame supported; aspect auto-detected from the start frame; prompt up to 10000 chars; sound/music can be switched off. CAUTION: with start/end frames you cannot also add image references (catalog: references are prohibited with keyframes), so fidelity comes only from the start frame. It also has camera-motion presets (pushIn, superDollyIn, tiltUp...): if the UI shows a camera selector choose `pushIn` (slow); otherwise rely on the prompt.
- FALLBACK: **Kling 2.5** (rank 2, best value, silent). 9:16 supported; ONLY 5 or 10 s (pick 5); 720p/1080p; an end frame is allowed ONLY at 1080p. No references, no audio. Use it if Seedance warps the stone, or as a cheap second opinion.
- Not chosen: Kling 3.0 and Seedance 2.0 variants (not needed for a one-shot pilot).

## Settings
Aspect 9:16 (auto from the still). Duration 6 s (Seedance) / 5 s (Kling). Resolution 1080p. Sound/music OFF. Note the seed for retries.

## Camera move (plain words)
Very slow dolly-in of about 6-8 percent with a faint upward tilt that drifts from the bed up toward the lit stone and its glowing cove edge. Easing: starts almost still, gentle acceleration, soft settle at the end (ease-in-out; no sudden stop, no shake, not handheld). The light warms by about 10 percent over the shot. Nothing else moves except a barely visible bulb glow.

## Prompt (paste)
`Slow cinematic dolly-in on a luxury bedroom at night, locked architectural camera, smooth ease-in-out, a very gentle upward tilt that rises from the bed toward the rough limestone feature wall and its glowing amber LED cove edge. The warm light slowly grows slightly warmer and richer across the stone, deepening the shadows in the stone relief. Everything else is perfectly still: the tufted headboard, the bed, the bedside table; the two woven rattan pendant lamps hang motionless with only a faint soft glow in the bulbs. Photorealistic, premium, quiet, calm, 35 mm architectural film look. Keep the room exactly as in the first frame.`

## Avoid / negative (negative field, or append "Avoid: ...")
warping or melting stone, stone texture crawling or changing, wavy walls, extra lamps, extra pendants, swinging lamps, moving furniture, bed or pillows changing shape, curtains or bedding blowing, people, hands, pets, text, logo, subtitles, flicker, flashing, strobing light, fast zoom, shake, handheld wobble, lens flare, fog or haze, colour shift to blue, morphing, jump cuts.

## Start / end frame
- Start frame: `out/still_v1.png` (always).
- End frame: OPTIONAL. Not needed on try 1 (Seedance, start frame only). Recommended as try 2 if the move is too timid or the room drifts (an end frame pins it). Make it from the same still: crop about 8 percent tighter, anchored slightly up toward the stone (keep the stone corner and the right pendant), resize back to 1080x1920 (any editor), optionally Relight a bit warmer (+10 percent). Save `out/end_v1.png`. Same pixels, so geometry is guaranteed. On Kling use 1080p.
- Plan: try 1 = Seedance 6 s start frame only. Try 2 = Seedance + end frame, or Kling 2.5 1080p + end frame. Max 3 tries.

## Result QA (SK-010; scrub the real file, check first / middle / last frames)
- [ ] Geometry stable: stone crack pattern, headboard, bed base, bedside table, window stay put; no melting or shifting texture between first, middle and last frames.
- [ ] Lamp count stays 2, no swinging, cords straight.
- [ ] LED cove line continuous, no flicker, no pulsing, no broken segments.
- [ ] Move slow and smooth, no shake; ease-in at start, soft settle at end.
- [ ] Light warms slightly; no flash, no shift to grey/blue.
- [ ] No people, text, logo, ghost objects.
- [ ] 9:16, 1080x1920, about 6 s, no sound.
- [ ] Last frame matches the hero still to about 95 percent.
Save as `out/video_v1.mp4`. Reject on any failed item; do not "fix in AE" melted stone, regenerate.
