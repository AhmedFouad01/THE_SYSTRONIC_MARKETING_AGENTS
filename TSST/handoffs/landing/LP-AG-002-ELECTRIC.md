# LP-AG-002: v2 "electric" redesign of the the-systronic.com landing page (Antigravity, step 2 round 2)

ROLE A (team runtime, CREATIVE_AG work). Same Skill Plan as LP-AG-001: TEAM studio · SKILLS TSST-CREATIVE-SK-008,
TSST-CREATIVE-SK-004, TSST-CREATIVE-SK-010 · NOT_SELECTED SK-014, SK-027. R58: Antigravity builds → Lead judges → Ahmed.
Cost rules R52: read only what is named, reply in 3 lines, plain Egyptian Arabic. Effort: High.

## Where (strict)
Job folder `C:\Work\TSST\TSST\brands\t-sag\projects\landing-page\`. Edit only `work\site\` (your v1 build). No commit, no deploy.
Keep the `FORM_ACCESS_KEY` value already in `main.js` exactly as it is. Never send a real form submission: mock fetch in every test.

## Read
- `brief.md`: "Owner decisions" (last bullet = this round).
- `final\copy.md`: sections 1–8 and "v2 changes" (word for word).

## Ahmed's v2 direction
1. **One dark, continuous page.** Deep dark background from the measured navy family; no colour bands between sections (hero, IMAGINE,
   contact, footer share one surface). Sections are separated by space, rhythm and the shared grid, at most a thin glowing line.
   On dark the bolt core turns light; its cyan and red edges stay.
2. **All text UPPERCASE** (CSS). Long lines get a lighter weight and wider tracking so they stay readable.
3. **Electrified logo in the top section.** A charge loop (~4–6 s): energy builds up the bolt, crackles, discharges, repeats.
   Plasma glow around it. Sparks: procedural lightning arcs (canvas 2D, branching) jump from the bolt to nearby text (headline words,
   `CHARGE YOUR DREAMS`, `CLIENT LOGIN`) at random 1.5–4 s intervals; the hit word flashes brighter ~120 ms.
   Slogan `CHARGE YOUR DREAMS` sits under the logo. Keep the split (cyan/red) pointer effect.
4. **Strike intro**: keep it, but it now ends on the dark page (no white end state).
5. **IMAGINE.** When it first scrolls into view: a wave from I to E, letters turn cyan / red alternately with a slight scale-up, then
   return. Fix the v1 defect: letters never move; the open word + line shows in one fixed area under the row (no reflow).
6. **Contact = one sentence form** (copy "v2 changes"): inline blanks inside the sentence; each valid blank charges one third of a bolt;
   `CHARGE IT` grows brighter as it charges; on success the bolt strikes and the sentence crackles before the success line.
   The idea blank grows with its text. At 390 the sentence wraps cleanly, blanks full width. Keep v1 validation messages.
7. **Fixes from v1 review:** footer `©` is broken (`Â©` in the file); focus ring must reach 3:1 on its background.

## Limits
Vanilla JS + canvas/SVG/CSS, no libraries; whole page under 1 MB. Canvas pauses when off screen or the tab is hidden; cap device
pixel ratio at 2; aim 60 fps at 1440 and on a mid phone. Reduced motion = no intro, no loop, no sparks, no wave (static charged look).
No horizontal scroll at 1440 / 1024 / 390; text contrast AA.

## Done when
- `work\site\shots\v2\`: top section 1440 / 1024 / 390 with one spark hitting text; IMAGINE wave mid-frame + one letter open
  (1440, 390); form empty, 2/3 charged and success (mocked) at 1440 and 390; reduced-motion top section.
- `work\site\DESIGN.md` updated (≤30 lines, UTF-8 without broken characters).
- Reply 3 lines: what changed · shots path · open questions · `Skills used:` · `skill_friction:`.
