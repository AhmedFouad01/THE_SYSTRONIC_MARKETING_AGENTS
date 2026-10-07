# SK-015 ref: web motion

Source: GEM-CR-002 (Gemini) + Lead review 2026-10-08. Licences/prices change: re-check at point of use. Sizes are approximate (Gemini, unverified) and RTL notes are partly team inference.

## Libraries

| Tech | Best use | Licence / cost | Size (approx.) | RTL note | URL |
|---|---|---|---|---|---|
| CSS transitions / @keyframes | Hovers, state changes | Built-in, free | 0 | Use logical properties (`margin-inline-start`); mirror translateX manually | https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations |
| Web Animations API | JS control without a lib | Built-in | 0 | Handle translate direction yourself | https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API |
| View Transitions API | Page/state transitions | Built-in | 0 | Inherits document direction | https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API |
| Scroll-driven (`animation-timeline`) | Parallax/reveals w/o JS | Built-in (browser support varies, check) | 0 | Logical props | https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline |
| GSAP (+ScrollTrigger, SplitText, MorphSVG) | Complex sequences, scroll, text | Free incl. commercial. Only restriction: no use in tools that compete with Webflow's visual animation builder (Standard License) | ~60 KB core (unverified) | No auto-flip of x; negate manually | https://gsap.com/pricing , https://gsap.com/standard-license/ |
| Motion (motion.dev) | React/vanilla UI, layout anims, springs | MIT (per Gemini; confirm in repo) | ~30 KB (unverified) | No auto-flip | https://motion.dev |
| Anime.js | Light sequencing, SVG | MIT (per Gemini) | ~17 KB (unverified) | Manual | https://animejs.com |
| Lottie (lottie-web, dotLottie) | AE vector anims in web/app | MIT (per Gemini) | web ~250 KB, dotLottie smaller (unverified) | Baked; keep container `dir="ltr"` if text baked in | https://lottiefiles.com/lottie-web |
| Rive | Interactive state-machine vector | Runtimes open source; editor freemium/paid | ~50 KB (unverified) | Via inputs | https://rive.app/pricing |
| Theatre.js | 3D/WebGL choreography | MIT/Apache (per Gemini) | ~100 KB+ (unverified) | Manual | https://www.theatrejs.com |
| Remotion | Video from React | See below | build tool | Text via React/CSS | https://www.remotion.dev/docs/license-pricing |

### Remotion licence (verified)

Source https://github.com/remotion-dev/remotion/blob/main/LICENSE.md (2026 copyright line): free for individuals, for-profit orgs with up to 3 employees, non-profits, and evaluation. Larger for-profit companies need a paid Company License (Gemini's "$25/mo, $100 minimum" prices: not confirmed). TSST rule: if the team is 4+ people, treat Remotion as paid; free alternatives = HTML + GSAP capture to video, or After Effects.

## Performance rules

| Rule | Why | Source |
|---|---|---|
| Animate `transform` and `opacity` only | Compositor-only, no layout/paint | https://web.dev/articles/animations-guide |
| Never animate width/height/top/left/margin | Triggers layout every frame | same |
| `will-change` only just before/while animating, then remove | Overuse wastes memory | https://developer.mozilla.org/en-US/docs/Web/CSS/will-change |
| Honour `prefers-reduced-motion` | Accessibility | principles.md |

## Arabic text animation rule

- NEVER split Arabic per letter: each letter in its own span/element breaks contextual joining (initial/medial/final forms) and ligatures, producing isolated glyphs. (Gemini; consistent with how shaping works across inline boundaries, no single official source: treat as team rule.)
- Split by WORD or LINE only; container `dir="rtl"`; stagger direction right-to-left (first word at the right).
- Keep `letter-spacing: 0` on Arabic (tracking also breaks joining).
- Test every Arabic reveal in the actual render (SK-010: inspect shaping on frames).
