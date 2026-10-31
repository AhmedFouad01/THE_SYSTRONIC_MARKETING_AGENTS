# LP-AG-003: v2 polish round + new form effect (Antigravity, step 2 round 3)

ROLE A (team runtime, CREATIVE_AG work). Same Skill Plan as LP-AG-001: TEAM studio · SKILLS TSST-CREATIVE-SK-008,
TSST-CREATIVE-SK-004, TSST-CREATIVE-SK-010 · NOT_SELECTED SK-014, SK-027. R58: Antigravity builds → Lead judges → Ahmed.
Cost rules R52: read only what is named, reply in 3 lines, plain Egyptian Arabic. Effort: High.

## Where (strict)
Job folder `C:\Work\TSST\TSST\brands\t-sag\projects\landing-page\`. Edit only `work\site\` (your v2). No commit, no deploy.
Keep the `FORM_ACCESS_KEY` value in `main.js` as it is. Never send a real form submission: mock fetch in every test.
Everything else in v2 stays as it is (Ahmed likes the direction).

## Lead review of v2 → fix
1. **Sparks are not visible.** The hit word glows, but the arc lives ~8 frames and is too thin to see. Make the arc thicker with a
   glow (cyan core, red fringe), ~250 ms life, so the eye sees the bolt grab the word.
2. **Sentence form still looks like a plain form.** Blanks become underlines inside the sentence (no filled boxes), each as wide as
   its text (with a min width), the full stop touches its blank, no orphan word on its own line ("BUILD"). `CHARGE IT` sits under
   the sentence on the sentence's left edge. At 390 no dangling full stops at the right edge.
3. **IMAGINE open panel.** The word sits at the far left and its line in the middle, far from the letter. Show word + line together,
   centred under the row, close to it.
4. **Console error** `<rect> attribute height: A negative value` from the charge loop (`main.js` ~line 246): clamp to ≥ 0.

## New form effect (Ahmed's pick, replaces the v2 one)
Remove: the small bolt meter, the sentence "crackle" jitter, the success box.
- **Big bolt behind the contact section.** The logo bolt, huge and translucent behind the whole sentence. Empty = faint ghost.
  Each valid blank fills one third with energy, bottom to top (smooth, cyan core, red edge glow). Text stays AA readable over it.
- **On success:** real branching lightning (reuse the hero arc generator, thicker) strikes from the top of the section down to
  `CHARGE IT` (~350 ms) with one soft flash (never more than 2 flashes, no full white screen); the big bolt lights fully, then
  settles. `MESSAGE SENT. THANK YOU.` types in letter by letter in place of the button row.
- **On error:** the bolt drains once with one flicker; the error line shows inline (no box).
- Reduced motion: the bolt fills without animation, no strike or flash, the success line appears at once. Same at 390.

## Done when
- `work\site\shots\v3\`: top 1440 with a visible arc on a word; form empty / 2-of-3 / success mid-strike / success end at 1440
  and 390; IMAGINE one letter open at 1440; console has 0 errors.
- `DESIGN.md` updated (≤30 lines).
- Reply 3 lines: what changed · shots path · open questions · `Skills used:` · `skill_friction:`.
