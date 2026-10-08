# Scored critique sheet + exercises (UNVALIDATED; from GEM-CR-005 with overrides)
This sheet is the composition/layout half. The delivery gate (crop limits, file checks, brand compliance, readiness) lives in `TSST/CREATIVE/FINAL_ASSET_GATE.md` and SK-010; run both and do not copy the gate here.

## Score 0-3 each (0 fail, 1 weak, 2 pass, 3 exceptional); pass >= 20/30
1. Focal point: one, found instantly (squint test).
2. Text contrast: >= 4.5:1 on mean AND worst-case pixels (`contrast.py`).
3. Quiet space: text sits in a measured quiet plane (`text_space.py`, edge < 5 %); NOT on an overlay (not allowed on project photos).
4. Hierarchy: title > subtitle > body by size/weight/position.
5. Safe zones: inside the platform zones in `TOOLCHAIN.md`.
6. Grid/alignment: elements sit on margins/columns.
7. Crop: intentional, subject intact, upscale <= 1.25x.
8. Colour: 3-4 colours max, brand set only.
9. Verticals (interior): within 1 deg.
10. Carousel consistency: repeated solid devices, varied layouts.

Any score of 0 fails the asset regardless of total.

## Exercises (each ends Pass/Fail)
1. Grid check: crop a 3:4 interior to 4:5 with the main furniture on a thirds intersection.
2. Fix verticals: keystone-correct a converging shot; guides match the walls.
3. Find the quiet plane: run `text_space.py` on a busy scene; the chosen box is in the quietest 10 % of positions (`pct_of_positions_quieter` in the v2 block, or compare picks to the heat-map).
4. Contrast: set text colour from the brand set to reach 4.5:1 on mean and worst pixels.
5. Margin/safe crop: nothing crosses a 50 px margin (4:5) or the TOOLCHAIN safe zone (9:16).
6. 9:16 stretch: convert a 16:9 photo to 9:16 without losing the subject and within 1.25x; use a frame or a different crop, not a bigger zoom.
7. Z-pattern: arrange logo, title, image, CTA so a Z path hits them in order.
8. Seam alignment: on a 2160x1350 canvas, an object crosses x=1080 while faces/text/logo avoid the seam.
9. Visual weight: balance a heavy left subject with a text block or secondary element on the right.
10. No quiet plane (replaces the scrim exercise): input is a highly textured photo with no plane under 5 % edge density. Target: apply the ladder re-crop, then frame on a solid field, then type-only slide, in that order. Check: re-crop was tried first (show the `text_space.py` numbers before/after), and the final text sits on a measured plane or solid field with no overlay on the photo.
