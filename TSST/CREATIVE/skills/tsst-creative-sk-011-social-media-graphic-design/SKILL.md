---
name: tsst-creative-sk-011-social-media-graphic-design
description: Produce professional feed, Story, carousel and ad-static compositions with a strong focal hierarchy and brand-specific craft.
version: 0.3
---

# TSST-CREATIVE-SK-011 — Social Media Graphic Design

Status: `UNVALIDATED`  
Training installed: 2026-09-24  
Owner: `CREATIVE_AG`

## Objective

Produce professional feed, Story, carousel and ad-static compositions with a strong focal hierarchy and brand-specific craft.

## Source / provenance

Professional editorial/advertising composition principles + platform format requirements + approved client brand systems.

## Required method

1. Start with a thumbnail composition and dominant focal event before writing detailed copy.
2. Use scale, crop, alignment, negative space, overlap and depth to create visual tension.
3. Integrate imagery and typography as one composition; never treat type as a caption pasted onto a photo.
4. Adapt layouts natively to 4:5, 1:1 and 9:16; recomposition is preferred over auto-resize.
5. Inspect actual feed/mobile size before final handoff.

## Added rules (2026-10-07)

**Real-photo crop (L5):** max upscale 1.25x, else wider crop or retouch request; 3:4 survives 4:5, check 9:16 per photo; report softness honestly.

**Logo on photos (L6):** pick the variant by sampled brightness behind it (contrast >=4.5 on a 40x40 sample, `tools/contrast.py`) or the brand's tile variant. Never recolour. No quiet zone = logo on hero slide only, and say so. Small and premium, never oversized.

**Social design types (L7):**
| Type | Rule |
|---|---|
| single post | one focal point, H1 <=6 words |
| carousel | cover (hook) / inner slide (one detail) / last slide (CTA); grammar: hero first, then one detail per slide |
| story | H1 <=5 in top third, outside UI zones |
| reel cover | must survive the profile-grid crop |
| ad static | SPARK owns setup; Creative owns the art |
| educational/quote | one idea, 12-20 words |
| proof/case | proof asset visible, claim sourced |
| before/after | matched crop and light |
| avatar/highlight | reads at 64 px |

Self-review: `FINAL_ASSET_GATE.md` (L7). Worked example: `TSST/CREATIVE/examples/EX-001_real-photo-layered-carousel.md`.

## Project showcase grammar (v0.3, UNVALIDATED; source: GEM-CR-003 patterns + owner rejection of v1, 2026-10-08)
- Cover = the best After photo, full-bleed. No colour overlay, band, haze or vignette on project photos, ever.
- Text on 3-4 slides max, <=6 words, placed in the photo's own empty plane (ceiling, wall). Measure the plane first (`tools/contrast.py` on the p5/p50/p95 pixels under the box); if it fails, move the text or flip text colour, never add a layer. Photos shot in warm low light often have mid-dark ceilings: expect white text there, dark text only on genuinely light planes.
- Small BEFORE/AFTER corner labels, same corner on every slide that carries one (label face, tracked caps, no stamp).
- Logo small on the cover and the last slide only, never on every slide; pick the variant by the measured background; never on the hero stone/feature.
- Layout variety: at least 3 layout types per carousel (full-bleed / framed on a solid field / detail crop / type-only). Before = framed "document", After = full-bleed.
- Brand colour as SOLID fields only (type-only slide, passe-partout). Type grounds use dark petrol #011C2C as a solid.
- Real-photo retouch that touches built elements (sockets, signs) needs the owner's OK; keep an unretouched alternate.
Worked example: `TSST/CREATIVE/examples/EX-003_project-showcase-carousel.md` (v1 rejected, v2).

## Failure patterns

- logo + headline + line only
- copy swapped into the same template across a full campaign
- center-everything layouts with no focal decision
- oversized decorative shapes replacing meaningful composition

## Practical evaluation

Create a 5-piece social mini-campaign with one visual grammar but clearly different compositions; score hierarchy, originality, brand fit and mobile readability.

## Validation rule

Package installation and study do not validate the skill. Validation requires actual evidence appropriate to the medium. Render-dependent skills cannot pass on briefs, prompts, HTML previews or unrendered storyboards alone.

## Changelog
- 0.2 (2026-10-07): Crop limits (L5), logo-on-photo (L6), social types table + carousel grammar (L7), EX-001 pointer. Status unchanged.
- 0.3 (2026-10-08): Project showcase grammar (UNVALIDATED), from GEM-CR-003 + owner rejection of v1. Status unchanged.
