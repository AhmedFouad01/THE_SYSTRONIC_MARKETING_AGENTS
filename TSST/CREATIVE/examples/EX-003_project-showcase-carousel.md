# EX-003 Project showcase carousel, 9 slides, real photos (interior fit-out brand, PILOT-002)
Brand-neutral. Evidence: `TSST/brands/vill-studio/projects/showcase-01/` (INTAKE.md, build/build.py, build/slide-0N/layers.json). First full run of INTAKE_GATE + L5/L6/L4/L7.
## Asked
9-slide 4:5 organic carousel from 7 client photos (3:4, 1086x1448) + approved copy, no CTA; also exported as PNG set and PDF.
## What the rules helped with
- INTAKE_GATE: all 12 fields filled from approved inputs in minutes; "no CTA" is a valid answer, so no blocker.
- L5 crop limit: crop boxes planned as 4:5 windows (864-1086 px wide); the build asserts scale <=1.25 and writes `scale` to layers.json; zero soft slides.
- L6 + matrix: white+orange transparent wordmark sampled on a petrol quiet zone; contrast measured on the rendered background (p95 brightest pixel), white >=6.2 on all 9.
- L4 layers: one `build.py` re-flattens from layers.json; a text edit or crop change is one line; retouch lives only in the photo layer.
## Where they fell short
- Quiet-zone rule assumes a dark patch exists; bright rooms had none, so a local petrol ellipse behind the logo and a bottom band were needed (tone layer carries two jobs). The rule should name this fallback.
- Orange part of a fixed logo can drop below 3:1 on bright backgrounds (2.6 on slides 6-7); no rule says whether that is acceptable for an unalterable mark.
- Crop notes can conflict with the 1.25x cap (stone + bench + glow edge span >1080 px source); the note should rank priorities.
- A "sign to crop out" was two real wall plates, too central to crop; check what an element is before deciding crop vs retouch.
- phone_preview.py only finds layers.json beside the slide, so previews must run on the slide folder, not export/.
## Type
Wide logo vs condensed face: Cairo 800 (humanist, medium width) sits calmly next to it; weakness: Latin is neutral, not angular like the mark.

## v1 REJECTED by the owner (2026-10-08) and v2 lesson
Owner: "level not acceptable at all". Measured causes (Lead, `showcase-01/REVIEW_v1.md`): three stacked petrol alpha layers (band 0.84, ellipse behind logo 0.74, vignette) turned warm light into grey-teal haze (#3A484A, L26, hue 188 behind the logo; brand petrol is L15); same layout on all 9 slides = template; Cairo 800 read heavy; logo + text on every slide.
v2 (`showcase-01/build-v2/`, UNVALIDATED rules in SK-011/008/006): 7 slides, zero colour layers over photos, 4 layout types, text on 4 slides in the photo's own plane, logo on slides 1 and 7 only, Cairo 300-400 + Barlow Condensed labels.
Lessons:
- Fix by deleting layers, not tuning them. Contrast came from placement plus colour choice per photo (white on the dark soffit, dark petrol on one light ceiling).
- Lens's "light walls" were judged by eye; the measured ceilings were mid-dark (p50 #7C624B). Always measure p5/p50/p95 under the text box and search boxes programmatically before committing; probe script found placements in minutes.
- Fixed corner labels need a canvas-consistent position; framed slides put the label in the margin.
- Gap in the L6 logo rule: the logo-variant choice is by measured background, and here the white variant sat on a dark floor corner (5.45:1), not on the "light" wall.
- Retouching real sockets/switch plates alters a built element: still needs the owner OK; unretouched alternate kept.

**Outcome 2026-10-08:** v3 APPROVED by the owner. What fixed it: zero overlays, placement in the photo's quiet plane (measured), solid dark-petrol type slide, logo on 2 slides only, 4 layout types, the brand font (Inter, not Cairo), and one script accent word per slide (Alex Brush) on at most 2 slides.
