---
name: tsst-motion-sk-004-color-grading-visual-finishing
description: Create consistent exposure, white balance, skin/product color and a deliberate final look across a sequence or campaign image set.
version: 0.2
---

# TSST-MOTION-SK-004 — Color Grading & Visual Finishing

Status: `UNVALIDATED` | Version 0.2 (2026-11-05, field lessons from EX-MO-001)  
Training installed: 2026-09-24  
Owner: `MOTION_AG`  
Formerly TSST-CREATIVE-SK-018 (moved to the Motion AG team, TSST-ADR-005, 2026-10-11)

## Objective

Create consistent exposure, white balance, skin/product color and a deliberate final look across a sequence or campaign image set.

## Source / provenance

Adobe Premiere official color correction/grading guidance; scopes-first correction and shot matching principles. v0.2: EX-MO-001 (`TSST/MOTION/examples/EX-MO-001_sale-offers-40s.md`).

## Required method

1. Correct exposure/white balance/contrast before creative look development.
2. Match shots/images so blacks, whites, saturation and skin/product colors feel continuous.
3. **Match AI shots at the source, not in the grade:** build the image model's style reference from the campaign's own pixels (its background colour and textures, no product, no text). EX-MO-001's AI studio matched the campaign blue and marble with no grade at all.
4. Use scopes/technical checks when available; protect skin tones and brand/product colors. **Product pixels are never graded or regenerated**: the client's real product images go in untouched.
5. **Readability over a shot = a scrim, not a darker grade:** a soft brand-colour gradient behind the text area keeps the shot's look and gives the text contrast.
6. Apply the creative grade consistently and avoid clipping/crushed detail.
7. Review on the final delivery color space/output where possible (H.264 yuv420p BT.709; check flat brand colours for banding on the phone).

## Failure patterns

- LUT/preset applied before correction
- every shot graded differently
- orange/teal cast altering product truth; any grade on product pixels
- crushed blacks used to hide poor footage
- skin tones sacrificed for brand colors
- AI shot darkened to make text readable

## Practical evaluation

Match three mismatched clips/images, then apply one restrained branded look and document before/after correction decisions.

## Validation rule

Package installation and study do not validate the skill. Validation requires actual evidence appropriate to the medium. Render-dependent skills cannot pass on briefs, prompts, HTML previews or unrendered storyboards alone.

## Changelog

- 0.2 (2026-11-05): match AI at the source (style reference from campaign pixels), product pixels untouched, scrim for readability, delivery colour note. Material change: stays `UNVALIDATED`.
- 0.1 (2026-09-24): installed.
