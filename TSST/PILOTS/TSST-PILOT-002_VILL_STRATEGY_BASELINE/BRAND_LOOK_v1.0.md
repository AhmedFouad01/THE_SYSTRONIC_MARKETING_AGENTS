# VILL Studio — Brand Look v1.0

2026-10-05 · C7-VILL-10 · RECOMMENDATION / production specification for independent review.

## Authority and character

FACT: Phase 2b of [BRIEF.md](BRIEF.md) makes `inputs/Logo.png` the only identity authority; navy #040136, orange #EE8C01, white #F3F4F6 are Lead-sampled. VI and v0.3 are superseded. Strategic containment and proof/RTL rules come from v0.2 §§4,7,8 and current BRIEF.

RECOMMENDATION: Read the angular cut V, heavy italic silhouette and advancing baseline as decisive, structured and energetic. Translate the cut into a diagonal image aperture, not decorative luxury trims. Keep interiors truthful; use orange to identify a decision or next action. Typography is assertive, photography remains calm. Never turn the logo into a font wordmark.

## Palette

Only identity colours and their derived mixtures are design tokens (photographic material colours are not brand tokens). Mix each sRGB channel as `round((1-t)*A + t*B)`; no added black or unrelated neutral.

| Token | Hex | Formula / role |
|---|---|---|
| Navy | #040136 | Primary canvas / text |
| Orange | #EE8C01 | ≤10% of graphic area; CTA, index, diagonal edge |
| White | #F3F4F6 | Light canvas / reversed text |
| Navy tint 20 | #34325C | 80% navy + 20% white; secondary dark surface |
| Navy tint 80 | #C3C3D0 | 20% navy + 80% white; light panel |
| Orange tint 40 | #F0B663 | 60% orange + 40% white; decorative only |
| Orange shade 20 | #BF700C | 80% orange + 20% navy; decorative only |

FACT: opaque sRGB WCAG relative-luminance pair calculations, reproducible in `assets/build.py`:

| Foreground / background | Ratio |
|---|---|
| white / navy | 17.95:1 |
| orange / navy | 7.89:1 |
| navy / orange | 7.89:1 |
| white / orange | 2.28:1 |
| navy / white | 17.95:1 |
| navy-tint-20 / white | 10.86:1 |
| orange-shade-20 / white | 3.45:1 |

Use white or orange on solid navy; navy on orange/white. White on orange fails normal text: never use. All photo text sits on solid navy/white panels. The logo is an image, never recoloured to improve contrast. No whole-design WCAG certification claimed.

## Typography

RECOMMENDATION: Barlow Condensed Bold 700 / Bold Italic 700 for Latin display, Cairo 700 for Arabic display and Cairo 500 for supporting Arabic. Heavy condensed Latin relates to the logo's forward geometry; Cairo's Kufi construction offers firm horizontal rhythm without distorting Arabic. Body Latin uses Cairo 500. Raleway is excluded.

FACT: Both fonts are SIL Open Font License 1.1. Full fonts and unmodified licence texts are bundled in `assets/fonts/`. Primary sources: [Barlow Condensed](https://github.com/google/fonts/tree/main/ofl/barlowcondensed), [Cairo](https://github.com/google/fonts/tree/main/ofl/cairo). Fonts were downloaded 2026-10-05; hashes are in QA inventory. Font files are not a logo substitute.

| Role at 1080-wide export | Latin | Arabic |
|---|---|---|
| Display | 100–124 px / 1.0 / 700 italic | 72–88 px / 1.35 / 700 |
| Heading | 64–80 px / 1.05 / 700 | 56–68 px / 1.4 / 700 |
| Support | 38–44 px / 1.35 / 500 | 40–44 px / 1.5 / 500 |
| Disclosure / label | 34–36 px / 1.3 / 700 | 34–36 px / 1.5 / 600 |

Arabic RTL, right alignment, zero tracking; no tatweel, fake italic, stretch or faux-bold. Isolate complete English/number runs with `bdi dir=ltr`. Primary and secondary languages are grouped, never interleaved line by line. Western digits are an ASSUMPTION. Never mirror logo/photos. Local bundled fonts are required for fidelity; Arial/Tahoma fallbacks are for emergency viewing, not certified substitutes.

## Grid and image grammar

RECOMMENDATION: 1080×1350 feed, 1080×1920 cover. 12-column mental grid; 72 px margins, 24 px gutters, 12 px base spacing. Common gaps 24/36/48/72. A single slanted aperture echoes the V cut; preserve a clear subject and use distinct photo crops, scales and layouts across a sequence. Solid panels hold copy. Carousel narrative: whole-home view → material/detail question → kitchen as optional entry. Kitchen ad remains kitchen-specific and offers Project Assessment; it implies no whole-home obligation.

Reel cover is a still PNG, not a video. Important cover content lies centrally; included central-square and 4:5 crop simulations are internal checks, not verified current-platform overlays. Keep release pending placement-specific review.

## Logo usage

Use the real `inputs/Logo.png` intact. No retyping, recolour, shear, outline, crop of mark, or regeneration. On navy: place its original square at matching navy. On white: retain its navy holding square; do not extract or recolour a white-background variant. Define V height H from its visible V; exclusion zone ≥H around the visible mark. The delivered original-square placements plus surrounding empty canvas meet this optically (QA measurements). Minimum visible mark width recommended 140 px on 1080 exports / 44 px at 360 preview; smaller labels inside the logo are secondary. For print recommend ≥30 mm visible mark width, proof required. Never overlay busy imagery.

## Imagery and evidence

FACT: supplied profile pages contain kitchen/living/detail visuals; screenshot provenance alone does not prove they are photographs or completed projects. Crops in `assets/images/` have recorded coordinates and no material retouching. No generated imagery is used. ASSUMPTION: source visuals may be used for this private review mockup only. Since image type, original resolution and release rights are unverified, every relevant layout is explicitly labelled CONCEPT and every export remains PRODUCTION_DRAFT. No completion, QC, dimensional, warranty, location, date or testimonial claims are carried into creative.

## ملخص بالعربي

الشكل الجديد مبني على اللوجو فقط: كحلي وبرتقالي وأبيض، مع درجات مشتقة منهم. القطع المائل في حرف V يتحول لإطار للصورة، والخط العربي Cairo مع Barlow Condensed للإنجليزي. العربي RTL بدون مط أو تباعد للحروف، واللوجو والصور لا تُعكس. إعلان المطبخ يركز على المطبخ وProject Assessment، والبيت كله امتداد اختياري. الصور الموجودة في البروفايل مصدر للمراجعة فقط؛ نوعها وحقوق نشرها غير موثقين، لذلك مكتوب عليها CONCEPT. الملفات مسودات إنتاج للمراجعة، ولا يوجد إذن نشر.

## Assumptions and review dependencies

- Conservative use of profile crops for private mockups; no execution-proof claims.
- Numerals 0–9; copy is proposed, no user-only decision blocks the run.
- Independent review after overnight run remains required; production approval and source release records are outstanding.
- Actual exports, phone previews and inspection findings: `assets/README.md`, `assets/qa/`.
