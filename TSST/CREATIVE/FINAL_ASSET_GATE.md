# CREATIVE Final Asset Gate

## Purpose

Prevent placeholder, browser-preview or technically-exported but visually weak work from being mislabeled as final creative.

## Gate states

### PREVIS
May include: HTML/CSS canvas, SVG preview, storyboard, wireframe, prompt, low-fidelity keyframe, template exploration.

### PRODUCTION_DRAFT
Rendered PNG/JPG/MP4/MOV with the intended composition and content, but unresolved QA, rights, typography, source-master or approval issues remain.

### FINAL_FOR_USER_REVIEW
All required conditions below pass.

## Mandatory checks for stills

- requested output format and dimensions exist;
- no browser/HTML interface is part of the creative;
- official logo/product geometry is preserved;
- focal point works at thumbnail/feed scale;
- image integration, masks, edge quality, light and shadow are credible;
- Arabic/Latin type is shaped, aligned and line-broken correctly;
- hierarchy remains legible on a physical/mobile-size preview;
- no unexplained dead zones, accidental crops or safe-zone conflicts;
- design is not a repeated template with copy swapped only;
- asset rights/provenance are known or explicitly pending;
- CREATIVE_AG has visually inspected the actual render.

## Mandatory checks for motion/video

- actual MP4/MOV rendered when tool support exists;
- first 1–3 seconds contain an intentional visual/message hook;
- no accidental static-slideshow behavior unless approved by concept;
- subtitles are legible and UI-safe;
- motion timing/easing and transitions support the narrative;
- audio levels do not bury speech;
- shot color/exposure continuity is acceptable;
- end card is readable;
- final video was reviewed at phone size and at least three representative frames were inspected;
- rights for music/footage/talent are confirmed or the asset remains a draft.

## Open before you write a rule (L2)

Sample or open every asset file before writing usage rules about it; never infer from names. (VILL logo matrix was inferred from names: "Dark/Light" named the background theme, so navy marks landed on dark photos.)

## Real-photo crop limits (L5)

- Maximum upscale 1.25x. If the subject needs more: wider crop, or raise a retouch/upscale request.
- 3:4 sources survive a 4:5 crop; check 9:16 per photo. Report softness honestly.
- `python TSST/CREATIVE/tools/phone_preview.py` warns on layers above 1.25x.

## Scored self-review before handover (L7)

Score 0-3 each: 1 thumb-stop at 300-360 px; 2 message/focal point in 1 s; 3 subject realism and image quality; 4 safe zones clean; 5 CTA visible and specific (n/a for organic brand posts); 6 hierarchy and legibility, AR/EN correct; 7 native to placement (recomposed, not stretched); 8 real variation, one named dimension per variant.
A score <=2 on 1, 2, 3 or 8 blocks handover unless explained with a fix path. Total >=18/24 (proportional when an item is n/a). Contrast checks: `tools/contrast.py`.

## Automatic downgrade to PREVIS

- HTML/browser preview used as final social post;
- storyboard/keyframe sequence used as final video;
- no final render was inspected;
- dominant visual is a generic background + logo + text with no justified key-visual mechanism;
- repeated same-image/same-layout cards across a campaign without meaningful variation;
- focal generative artifacts, distorted products/logos or broken Arabic.

## Release authority

`FINAL_FOR_USER_REVIEW` is not permission to publish. Only explicit user/TSST Lead release authority can produce `APPROVED_FOR_RELEASE`.
