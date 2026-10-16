# s06-stonewall - RECIPE_STILL (Magnific web app, by hand)
Status: PREVIS recipe (nothing generated yet). Author CREATIVE_AG 2026-10-08. Skills: SK-008 (light leads the eye), SK-010 (fidelity QA), SK-015 (move language, see video recipe). UNVALIDATED.
Goal: 9:16 hero still, target 1080x1920 then upscale. Real bedroom form kept, pro lighting, no text/logo/people.
Menu names follow the tool names (expand, relight, retouch, reimagine, change camera, upscale). If a button is labelled differently in the app, use the closest one and keep the ORDER.

## What to upload
- PRIMARY: `refs/ref1_PRIMARY_bedroom_still8.png` (1086x1448, 3:4). It is already clean: NO red sign on this wall.
- NOTE: the red plates (the "sign") are on the LIVING-ROOM stone wall (ref2 / ref4), not the bedroom wall. If a red plate shows up in your bedroom result, remove it in step 3. Do not upload ref2/ref4 into the bedroom still (it would import the bench + marble).
- Secondary, only for a texture rescue in round 3: ref2 as a texture/style reference.

## Order (edit the real photo, never text-to-image)
1. EXPAND to 9:16. Upload ref1. Expand the canvas to 9:16 (1086 wide -> about 1931 tall, i.e. add about 480 px): about 300 px on top (more ceiling + cove line) and about 180 px at the bottom (more floor). Do NOT expand the sides (keeps window/pendant positions). Expand prompt:
   `Continue the same room: smooth white ceiling with a warm recessed LED cove line at the top, and light oak-grey wood floor at the bottom. Same lighting, same materials, no new objects.`
   Pick the variant whose cove line continues straight and unbroken; reject any with new lamps/furniture.
2. CHANGE CAMERA: skip in round 1 (only a round-3 option, see below).
3. RETOUCH (only if needed): paint over any stray red plate/sign or artefact on the stone. Optional: also remove the wall socket at right (not a hero element). Prompt: `Plain rough cream limestone texture continuing seamlessly, same lighting.`
4. RELIGHT (the key step, "light leads the eye"). Prompt:
   `Warm golden glow leading the eye to the rough limestone wall: the LED cove reveal around the stone glows soft amber and grazes the stone, deepening every crack and shadow; gentle warm lamplight from the two woven rattan pendants; bed linen and walls stay soft and quiet; subtle dark falloff at the room edges; premium, calm, refined. Keep all objects and positions exactly as in the photo.`
   Strength: medium (about 40-60 percent). Light colour about 2700-3000 K. The stone must be the brightest, most textured area.
5. UPSCALE to 1080x1920 or higher (2x is fine; downscale to 1080x1920 later in AE). Creative/precision slider on the most PRECISE end: we want fidelity, not new detail. If it asks for a prompt: `Photorealistic interior photograph, natural limestone texture, fine fabric, sharp.`
Save as `out/still_v1.png` (later rounds `still_v1_r2.png`, `_r3`).

## Prompt master (if a tool has a single text box, e.g. Reimagine)
`Luxury residential bedroom at night, quiet premium mood. A tall rough-hewn cream limestone feature wall framed by a continuous warm LED cove reveal; channel-tufted taupe upholstered headboard and matching channel-tufted bed base; white linen bedding with two pillows; a white-and-walnut bedside table with a round metal ring pull; two woven rattan pendant lamps with warm bulbs; recessed ceiling LED cove line; dark glass window at left reflecting warm light; light oak wood floor. Warm directional light, the stone is the brightest area, soft shadows, 35 mm architectural photography, photorealistic, no people.`

## Negative / avoid
text, letters, logos, watermark, sign, red plate, red box, extra lamps, extra pendants, extra furniture, people, hands, clutter, bags, boxes, plastic wrap on the mattress, brick or tile pattern on the wall, smooth plaster instead of rough stone, wavy/warped lines, duplicated headboard, extra windows, over-saturated orange, blown-out highlights, HDR halo, cartoon/CGI look.

## Fidelity checklist (Ahmed ticks before accepting; compare to ref1)
- [ ] Stone wall: one tall rough cream limestone panel, same irregular crack pattern/shape (about 95 percent OK), clear 3D relief, NOT smooth, NOT brick.
- [ ] LED cove: one continuous warm line along the stone's sloped top edge and down both sides, no breaks, no extra lines.
- [ ] Headboard: ONE channel-tufted taupe headboard with rounded top roll; bed base with vertical channel panels (about 6 visible).
- [ ] Bedding: white, 2 pillows with soft floral print (print not readable as text/logo).
- [ ] Bedside table: ONE, walnut top and side, cream front, round metal ring pull.
- [ ] Pendants: EXACTLY 2 woven rattan lamps (small at left, large at right), cords straight from the ceiling.
- [ ] Ceiling: recessed LED cove line top-left.
- [ ] Window/dark glass at left, same position, warm reflections.
- [ ] Colours: stone cream/amber, walls warm white, taupe headboard, walnut brown, oak floor. Not neon orange, not grey.
- [ ] NO text, logo, red sign, people, clutter; no plastic on the mattress.
- [ ] Stone is the brightest, most textured area; the eye goes there first.
- [ ] 9:16, no seams at the expanded top/bottom bands.

## Max 3 rounds (after round 3, hand back to Lead)
- Round 1: steps 1, 4, 5 as above.
- Round 2 (stone/headboard/lamps drift, or the expansion looks fake): lower Relight strength by about 15 points, upscale to the most precise setting, redo Expand with a smaller add (top 200 px + bottom 100 px; accept slightly wider than 9:16 and crop later). Append to the prompt: `Do not change any object; only change light.`
- Round 3 (still off): Relight FIRST on the original 3:4 photo (no expand), then expand the relit image; or use CHANGE CAMERA only to lower/level the camera slightly; or add ref2 as a texture reference for the stone. Otherwise take the best of rounds 1-3 and fix the single defect with Retouch.
