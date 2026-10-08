# showcase-01 — v1 review (build/ 9 slides) · 2026-10-08

**Owner verdict (Ahmed): REJECTED — "المستوى مش مقبول خالص".** Research how showcases are presented well first, then rebuild.

## Owner points
1. Petrol reads too light. For type grounds and shades use the dark petrol (deep petrol #011C2C), not #01304A at partial alpha.
2. Overuse of the petrol overlay behind the logo and behind the text. The level is weak.

## Measured (Lead, export PNGs)
| slide | zone | result | note |
|---|---|---|---|
| s01 | logo zone | #3A484A, hue 188°, L 26 | grey-teal haze: 74% petrol over a warm photo |
| s05 | logo zone | #28363C, hue 198°, L 20 | same haze |
| s08 | logo zone | #114A70, hue 204°, L 25 | lighter than the brand petrol (L 15) |
| s01/05/08 | text band | L 14–16 | ≈ #01304A; 84% band over the whole lower third |

Cause (`build/build.py` tone_layer): three stacked petrol alpha layers on every photo slide (lower-third band 0.84, ellipse behind the logo 0.74, vignette). Partial-alpha brand colour over warm photos makes a cold grey film, not a brand colour.

## Lead self-review (same round)
- One layout on every slide (photo + bottom band + top-left logo) reads as a template.
- The overlays dull the warm light, which is the whole story (direction B, "light leads the eye").
- s09 type-only slide is empty; s03/s06 have a weak focal point.
- Cairo is not the brand's Latin face.

## Owner decisions after GEM-CR-003 (2026-10-08)
- **Logo + text = middle ground:** a small logo on the cover and the last slide only. Short text on 3–4 slides only, placed in the photo's own empty space, with no colour layer. Every other slide is a clean photo. (This replaces "logo + text on every image" from the brief.) LENS picks which COPY_DECK lines stay on images and which move to the caption.
- ~~Evidence: Ahmed saves 8–10 screenshots.~~ **Dropped the same day (Ahmed: "let the team make the right call itself").** The team adopts the GEM-CR-003 patterns as UNVALIDATED rules. The owner's review of v2 is the validation.

## v2 Lead review (2026-10-08) → sent to Ahmed
build-v2/: 0 overlay layers, 4 layout types, logo on 2 slides, text on 4. Gate 18.3/24 (PRODUCTION_DRAFT). Lead looked at the contact sheet, s01 and s03: the warm light is intact and the result no longer reads as a template.
Open for Ahmed: s05 socket/switch clone-out (the ALT is exported); typeface (Cairo 300/400 + Barlow labels); Lens CHANGED lines; new AR caption lines.
**Lead catch:** the LinkedIn v2 opening "Most clients hand us a shell and a long list of separate suppliers…" is an unverified claim about clients. Confirm it with Ahmed or cut it.

## Ahmed on v2 (2026-10-08)
- **Direction APPROVED.** Slide 5 retouch (socket/switch removed) is APPROVED.
- Fonts: NOT Cairo. Arabic = Alexandria, English = Inter (both installed; recorded in ASSETS.yaml). v2 must be re-set in these fonts.
- The team needs real skill in typography (e.g. a handwritten/script word layered with a bold word; text should look designer-made) and in photo composition/layout. Research: GEM-CR-004 (typography), GEM-CR-005 (composition/layout) → CREATIVE distils them into skills → re-set v2 as the test.
- Still open: Lens's CHANGED lines, the AR caption lines, and the unverified LinkedIn opening claim.

## Next
GEM-CR-003 research (how interior/fit-out project showcases are presented) → Lens + Creative distil it into rules/skills → v2 rebuild. No v2 before the research is reviewed.
