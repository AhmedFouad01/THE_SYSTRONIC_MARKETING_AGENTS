GEMINI REQUEST GEM-CR-002 · TSST (team-level, no brand) · CREATIVE capability · motion knowledge bank · from CREATIVE_AG (MOTION_AG) via Lead · 2026-10-08
(Team-level request, so it lives under TSST/CREATIVE/gemini/ instead of a brand project.)

ROLE:         EXTERNAL TOOL — research. You are NOT a TSST agent: do not claim TSST roles, teams, agents, skills or tiers, and do not run the TSST boot.
              WRITE: only TSST/CREATIVE/gemini/GEM-CR-002_out.md (or reply with text only).
              DO NOT: edit, move or delete any other file; create bus tasks; commit.
              Your output is INPUT for CREATIVE_AG; the Lead reviews it before anything enters TSST.
OBJECTIVE:    Gather a sourced reference on animation principles, easing, web motion libraries and After Effects expressions/tools, so CREATIVE can distil it into SK-015 references.
CONTEXT:      TSST is a marketing agency, production house and media buyer (Egypt; Arabic + English, RTL). Motion is used for social ads/Reels, logo stings, kinetic Arabic type, web/product UI. Platform sizes/safe zones are already covered by GEM-CR-001, so leave them out. Public info only, no client data.
FILES/ASSETS: none
REFERENCES:   Prefer official docs: MDN (CSS/Web Animations), W3C CSS Easing spec, GSAP docs, Motion (motion.dev) docs, Lottie/Bodymovin (Airbnb/LottieFiles), Rive docs, Adobe After Effects Help (expressions reference), each plugin's own site. Classic sources: Thomas & Johnston "The Illusion of Life" (12 principles), Robert Penner easing equations, easings.net, Material Design motion, Apple HIG motion, IBM Carbon motion. Note the date of each source.
PROMPT:
  Build a reference document in 6 parts. Cite a URL (and date where shown) for every factual claim. Summarise in your own words; code snippets only when short and publicly documented.

  PART 1 — Principles
  The 12 animation principles (squash & stretch, anticipation, staging, straight-ahead vs pose-to-pose, follow-through & overlapping action, slow in/slow out, arcs, secondary action, timing, exaggeration, solid drawing, appeal). For each: one-line definition | how it translates to MOTION GRAPHICS / UI (not character animation) | one ad/UI example | common mistake.
  Then the UI/brand motion principles from Material, Apple HIG and IBM Carbon: typical duration ranges (ms) for micro-interactions, small/large transitions; "productive vs expressive" motion; reduced-motion accessibility (prefers-reduced-motion).

  PART 2 — Easing master table (most important)
  One row per curve: Linear, Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back — each In / Out / InOut.
  Columns: name | feel / when to use | CSS cubic-bezier() values | GSAP ease string | Motion (Framer) equivalent | After Effects approach (keyframe influence % or expression).
  Then Elastic and Bounce separately: explain they cannot be a single cubic-bezier, and give how each tool does them (GSAP ease, CSS linear() function, AE expression).
  Also: CSS keywords (ease, ease-in, ease-out, ease-in-out) with their bezier values; steps(); spring physics (stiffness/damping/mass) in Motion and GSAP and how it differs from duration-based easing.

  PART 3 — Web motion
  For each: what it is | best use | licence/cost in 2026 | size | RTL notes | official URL.
  CSS transitions & @keyframes, Web Animations API, View Transitions API, scroll-driven animations (animation-timeline), GSAP (+ ScrollTrigger, SplitText, MorphSVG — confirm licence after the Webflow acquisition), Motion (motion.dev / Framer Motion), Anime.js, Lottie (lottie-web, dotLottie), Rive, Theatre.js, Remotion (video from React — note its company licence terms).
  Add: performance rules (animate transform/opacity, will-change), and how to animate Arabic text without breaking letter joining (why per-letter splitting breaks Arabic; use word/line splitting).

  PART 4 — After Effects expressions
  The standard, widely used expressions with: name | what it does | short code | where to apply | gotchas.
  At least: wiggle, loopOut/loopIn (cycle, pingpong, offset, continue), time*n, valueAtTime, linear()/ease()/easeIn()/easeOut() interpolation, inertial bounce / overshoot, sourceRectAtTime (auto-sizing box behind text), index-based offset/delay, toComp/fromComp, posterizeTime, Text animator expression selector basics, linking to sliders/controls.
  Note the JavaScript vs Legacy ExtendScript expression engine difference.

  PART 5 — After Effects plugins / scripts / tools
  For each: what it does | free/paid + approximate price | still maintained in 2026? | official URL.
  Flow, Motion Tools Pro, Ease and Wizz, Duik (Angela), RubberHose, Overlord, Explode Shape Layers, Motion 4/Motion Bro, Bodymovin/LottieFiles for AE, Joysticks 'n Sliders, Newton, plus any other tool that is now standard for easing/rigging/export. Mark anything you could not confirm as "not confirmed".

  PART 6 — Cross-tool translation
  How to move one motion spec between tools: AE graph (speed/value) ↔ cubic-bezier ↔ CSS/GSAP ↔ Lottie export. What survives Lottie export and what does not (expressions, effects, blend modes).
CONSTRAINTS:  Sources required; say "not documented" / "not confirmed" instead of guessing. No full copying of books, courses or paid scripts. No platform size specs (GEM-CR-001 covers them). English output; Arabic only where explaining Arabic-text behaviour.
OUTPUT:       One Markdown file GEM-CR-002_out.md beside this file, with the 6 parts as headings, tables where asked, and a final "Sources" list (URL + date). If it is too long for one reply, split as GEM-CR-002_out_part1.md, _part2.md … in order.
ACCEPTANCE:   CREATIVE checks that every easing value and code snippet has a source and spot-tests 3 bezier values + 3 expressions; licence/price claims are re-checked before use; Lead accepts; CREATIVE then distils it into skills/tsst-creative-sk-015-motion-design/ref/ (principles, easing, web, after-effects).
