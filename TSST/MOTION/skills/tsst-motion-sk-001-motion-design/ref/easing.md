# SK-015 ref: easing master table

Sources: easings.net https://easings.net/ ; CSS Easing spec https://www.w3.org/TR/css-easing-1/ ; GSAP https://gsap.com/docs/v3/Eases/ ; Motion source (below). Bezier values come from GEM-CR-002 (easings.net values). They are APPROXIMATIONS of the Penner formulas (error figures below).

## Master table (CSS cubic-bezier x1,y1,x2,y2)

| Curve | Feel / use | CSS In | CSS Out | CSS InOut | GSAP |
|---|---|---|---|---|---|
| Linear | Constant speed: loops, progress, colour fades | 0,0,1,1 | | | `none` |
| Sine | Softest; ambient/idle | .12,0,.39,0 | .61,1,.88,1 | .37,0,.63,1 | `sine.in/out/inOut` |
| Quad | Subtle UI default | .11,0,.5,0 | .5,1,.89,1 | .45,0,.55,1 | `power1.*` |
| Cubic | Standard entrances/exits | .32,0,.67,0 | .33,1,.68,1 | .65,0,.35,1 | `power2.*` |
| Quart | Dramatic entries | .5,0,.75,0 | .25,1,.5,1 | .76,0,.24,1 | `power3.*` |
| Quint | Snappy stops | .64,0,.78,0 | .22,1,.36,1 | .83,0,.17,1 | `power4.*` |
| Expo | Near-instant start, long tail; hero reveals | .7,0,.84,0 | .16,1,.3,1 | .87,0,.13,1 | `expo.*` |
| Circ | Sudden accel/decel | .55,0,1,.45 | 0,.55,.45,1 | .85,0,.15,1 | `circ.*` |
| Back | Overshoot; playful pops | .36,0,.66,-.56 | .34,1.56,.64,1 | .68,-.6,.32,1.6 | `back.in(1.7)` / `back.out(1.7)` / `back.inOut(1.7)` |

- Motion (motion.dev) column: Motion accepts a cubic-bezier array directly, `ease: [x1, y1, x2, y2]`, so use the SAME four numbers as CSS. Gemini's mapping (Sine->circIn, Quad..Expo->easeIn) was wrong: Motion's named easings are different curves (table below). Doc https://motion.dev/docs/easing (array form per Lead review; page not re-fetched).
- After Effects column: derive, do not look up. Method in after-effects.md ("AE from cubic-bezier"). Adobe does not document influence % per named curve (GEM-CR-002_out_fix); Gemini's influence % values were unsourced and are dropped.
- GSAP `power1..4` = quad..quint per GSAP docs (page not re-fetched).

## Spot test (scratch Python, 2026-10-08): bezier vs Penner formula at t=.25/.5/.75

| Curve | max abs error |
|---|---|
| easeOutCubic (.33,1,.68,1) | 0.0028 |
| easeInOutQuart (.76,0,.24,1) | 0.0216 (at .25 and .75) |
| easeOutBack (.34,1.56,.64,1) | 0.0045 |
| extra: sineIn .0075, quadOut .0013, quintInOut .0286, expoOut .0032, circOut .0018, backIn .0045 | |

Reading: Out/low-power curves match within ~0.5% of range; high-power InOut (Quart/Quint) deviate 2-3%. Fine for design; for frame-exact parity use the GSAP/Penner function, not the bezier.

## Motion named easings (verified in source)

Base: https://github.com/motiondivision/motion/tree/main/packages/motion-utils/src/easing (files ease.ts, circ.ts, back.ts, anticipate.ts, modifiers/)

| Name | Definition |
|---|---|
| easeIn / easeOut / easeInOut | cubicBezier(.42,0,1,1) / (0,0,.58,1) / (.42,0,.58,1) = the CSS keywords |
| circIn | `1 - sin(acos(p))`; circOut = reverse(circIn); circInOut = mirror(circIn) |
| backOut | cubicBezier(.33, 1.53, .69, .99); backIn = reverse(backOut); backInOut = mirror(backIn) |
| anticipate | p>=1 -> 1; p*=2; p<1 -> .5*backIn(p); else .5*(2 - 2^(-10(p-1))) |
| reverse(e) / mirror(e) | `1 - e(1-p)` (in->out) / `p<=.5 ? e(2p)/2 : (2 - e(2(1-p)))/2` (in->inOut) |

Note: Motion backOut peak (1.53) differs slightly from CSS Back-out (1.56).

## Elastic and Bounce

Cannot be one cubic-bezier (several direction changes; a cubic has only 2 control points).

| Tool | How |
|---|---|
| GSAP | `elastic.out(1, 0.3)`, `bounce.out` (https://gsap.com/docs/v3/Eases/) |
| CSS | `linear(0, .5, 1.2, .9, 1, ...)` piecewise points, or keyframes (https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear); generate points with a tool, do not hand-write |
| AE | expression (damped sine overshoot / bounce), see after-effects.md |

## CSS keywords (https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function)

ease (.25,.1,.25,1); ease-in (.42,0,1,1); ease-out (0,0,.58,1); ease-in-out (.42,0,.58,1); linear (0,0,1,1). `steps(n, jump-end|jump-start|...)` = n discrete jumps (flipbook, typewriter, sprite sheet).

## Springs

| Idea | Note |
|---|---|
| Physics: stiffness (speed), damping (bounce vs settle), mass (inertia) | No fixed duration; settles by physics; interruptible while keeping velocity |
| Motion | `transition={{ type: "spring", stiffness, damping, mass }}` (Gemini / motion.dev; not re-fetched) |
| GSAP | No native spring ease; Gemini suggests CustomEase/InertiaPlugin: not confirmed |
| Use | Interactive UI and playful pops; for fixed-length video/AE use duration-based curves |
