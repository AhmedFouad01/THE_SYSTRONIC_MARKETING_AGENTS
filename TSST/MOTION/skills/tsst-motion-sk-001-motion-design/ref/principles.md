# SK-015 ref: principles (motion graphics / UI)

Distilled from GEM-CR-002 (Gemini research) + Lead review 2026-10-08. Status: UNVALIDATED. Source for the 12 principles: Thomas & Johnston, "The Illusion of Life" (1981); the UI mapping is team interpretation (Gemini cited Material 3 overview, https://m3.material.io/styles/motion/overview, page not re-checked).

## 12 principles -> motion graphics / UI

| Principle | Translation to motion graphics / UI | Typical mistake |
|---|---|---|
| Squash & stretch | Subtle scale on press/impact; stretch a shape along its motion to show speed | Deforming text or logo; over-scale |
| Anticipation | Small counter-move (pull-back, dip) 2-6 frames before the main move | Delay so long the UI feels unresponsive |
| Staging | One focal element moves; dim/hold the rest; CTA gets the clearest motion | Many unrelated elements moving at once |
| Straight-ahead vs pose-to-pose | Motion design = pose-to-pose: key start/end states, ease between | Hand-drawing frames for UI |
| Follow-through & overlap | Stagger children after parent; settle with a small overshoot | Stagger so slow the reader waits |
| Slow in / slow out | Ease every move (easing.md); decelerate (ease-out) entrances, accelerate (ease-in) exits | Linear motion on physical objects |
| Arcs | Curved paths for travelling objects (spatial bezier) | Straight diagonals feel mechanical |
| Secondary action | Supporting motion (icon tick, colour shift) that never outranks primary | Secondary overpowering the message |
| Timing | Duration = weight/meaning; small = fast, large = slower | Everything the same duration |
| Exaggeration | Overshoot/spring for energy (Back, spring) | Bounce on a serious/finance brand |
| Solid drawing | Consistent depth: shadow, elevation, 3D transform logic | Wrong shadow angle, muddled layering |
| Appeal | Motion personality matches brand (one easing family per brand) | Inconsistent curves inside one piece |

Ad example set: price tag pops with Back-out (exaggeration) after a 3-frame dip (anticipation); logo sting = one hero move + settle (staging); Arabic headline reveals by line stagger (follow-through).

## UI duration ranges (from source tokens, not Gemini prose)

| System | Tokens | Source |
|---|---|---|
| Material 3 | short 50/100/150/200 ms; medium 250/300/350/400; long 450/500/550/600; extra-long 700-1000 | https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-motion.scss |
| Carbon | fast-01 70, fast-02 110, moderate-01 150, moderate-02 240, slow-01 400, slow-02 700 ms | https://github.com/carbon-design-system/carbon/blob/main/packages/motion/src/dtcg/motion.json |
| Apple HIG | numeric ranges not confirmed (JS-rendered page, not fetched) | https://developer.apple.com/design/human-interface-guidelines/motion |

Working rule (team heuristic derived from the above): micro 100-200 ms, small transition 200-300 ms, large/page 300-400 ms, brand moment up to 700 ms. Gemini's "over 400 ms feels sluggish" is opinion, not a documented rule.

## Productive vs expressive

Correction to Gemini: in Carbon these are two EASING MODES, not duration bands. Productive = efficient, low drama; expressive = more emphasis for brand/editorial moments. Source: Carbon motion.json (above).

| Carbon easing | productive | expressive |
|---|---|---|
| standard | (0.2, 0, 0.38, 0.9) | (0.4, 0.14, 0.3, 1) |
| entrance | (0, 0, 0.38, 0.9) | (0, 0, 0.3, 1) |
| exit | (0.2, 0, 1, 0.9) | (0.4, 0.14, 1, 1) |

Material 3 curves: standard (0.2,0,0,1); standard-decelerate (0,0,0,1); standard-accelerate (0.3,0,1,1); emphasized-decelerate (0.05,0.7,0.1,1); emphasized-accelerate (0.3,0,0.8,0.15) (same Material source).

## Reduced motion

- CSS `@media (prefers-reduced-motion: reduce)`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Practice (Gemini, consistent with MDN): swap slides/scales/parallax for an opacity cross-fade; stop auto-playing decorative loops. In paid video ads avoid flashing/strobing.

## Arabic reading-time note (team heuristic, no external source)

Arabic generally needs a longer on-screen hold than Latin at the same word count (connected script, diacritics, small-screen reading). Test on a phone-sized frame; hold text beats longer than the English version; never reveal letter by letter (web.md). To be calibrated in the practical evaluation.
