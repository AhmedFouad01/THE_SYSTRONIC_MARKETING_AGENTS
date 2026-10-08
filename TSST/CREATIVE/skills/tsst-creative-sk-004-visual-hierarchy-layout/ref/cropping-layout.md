# Cropping, text space, layout (UNVALIDATED; distilled from GEM-CR-005 with Lead overrides applied)

## Overrides that win over the source
No overlays/scrims/colour veils on project photos (SK-011 / SK-008 v0.3). Upscale cap <= 1.25x (not 120-150 %). Safe zones come from `TOOLCHAIN.md`, not this file. "Uppercase titles >30 pt" is a slide rule, not social. The source's [VISME p.N] tags are unverified; do not cite them.

## Reframing to a target ratio
Source 3:4 to 4:5 is a light top/bottom trim; to 1:1 moderate; to 9:16 heavy top/bottom trim with the subject near centre; to 1.91:1 extreme (usually frame instead). Check the scale: output width / crop width must be <= 1.25.

## Crop priority (decide in this order)
1. Subject integrity (no awkward amputations).
2. Text plane preserved: run `tools/text_space.py` on the candidate crop before committing.
3. Leading lines kept.
4. Distracting light removed from edges.

## Finding text space (method)
1. Candidate crop at the real canvas size; measure with `tools/text_space.py --box WxH` (add `--subject` to fence the subject, hero stone or label/logo zones).
2. Quiet = edge density < 5 %, low luminance std, plane >= 1.5x text-box area, box clear of the subject.
3. Pick text colour from the measured plane (brand set only); require >= 4.5:1 on the box mean AND worst-case p5/p95 (`contrast.py`).
4. Ranking is quietness only. Reading order, thirds and light direction remain your call; tool picks are candidates.

No quiet plane, in order: (a) re-crop / shift to bring one in; (b) frame the photo on a solid brand field and set type on the field; (c) move the words to a type-only slide. Never add a scrim or overlay.

## Layout types (use per SK-011 showcase grammar)
Full-bleed, framed on a solid field (passe-partout; frame when a crop would drop the subject), split 2-up (photo + solid field), grid 3-up, type-only, detail crop. Collage only sparingly; no tiny floating images.

## Grid, spacing, alignment (defaults, not facts)
4- or 6-column grid on 1080 px; spacing in multiples of 8 (8/16/24/32/48/64); margin 50-64 px on 1080x1350, plus TOOLCHAIN.md safe zones for 9:16. Left-align paragraphs; centre only 3 lines or fewer. Logo anchors a margin corner, small, never competing with the focal point and never on the hero feature.

## Carousel rhythm and cover
- Vary layout type across 6-10 slides (at least 3 types); repeat only solid, non-photo devices (same label corner, margin, type face) to tie the set together.
- Cover: one clear focal point, best After photo, short high-contrast title in its own quiet plane.
- Panoramic carousel: canvas width = slides x 1080; slice at 1080 px; no face, text or logo on a seam; run a large line or shape across seams to invite the swipe.
