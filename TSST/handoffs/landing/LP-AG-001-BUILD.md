# LP-AG-001: design + build the the-systronic.com temporary landing page (Antigravity, step 2)

ROLE A (team runtime, CREATIVE_AG work), step 2 of the job brief. R58: Antigravity builds → Lead judges → Ahmed.
TEAM studio · SKILLS TSST-CREATIVE-SK-008, TSST-CREATIVE-SK-004, TSST-CREATIVE-SK-010 (open each with
`python TSST/skills/build_index.py --id <ID>`, then the SKILL.md it points to) · NOT_SELECTED SK-014 (no AI imagery), SK-027 (few states).
Cost rules R52: read only what is named, reply in 3 lines, plain Egyptian Arabic. Effort: High.

## Where (strict)
Job folder `C:\Work\TSST\TSST\brands\t-sag\projects\landing-page\`. Write only in `work\site\`. No commit, no deploy, no server access.
Playwright lives in `C:\Users\10\tsst-tools\code-motion`.

## Read
- `brief.md`: sections "Page concept" and "Access levels".
- `final\copy.md`: use it word for word. The "Maps to" column is internal and never shown on the page.
- Look: `work\ref\owner-logo-artwork.png` (Ahmed's artwork: white page, huge pale ghost bolt behind, navy bolt with a thin cyan edge
  on its upper-left sides and a red edge on its lower-right sides, heavy italic "THE SYSTRONIC", wide-spaced "IMAGINE").
  Bolt vector: `C:\Work\TSST\TSST\brands\t-sag\approved\brand\logo\systronic_mark_vector.svg` (one polygon, recolour it).
  Measure the navy from the artwork, never guess it. Accents: cyan #00BEF6, red #FF003C, royal #00338D.

## Build: one static page, no framework, no build step
`index.html`, `styles.css`, `main.js`, `assets\` (self-hosted OFL fonts as woff2, close to the wordmark; no third-party font calls).
1. **Strike intro (≤2.5 s).** Dark screen → the bolt draws as a strike → flash to white → "IMAGINE" at the flash → logo settles into the hero.
   Click / any key skips. Shown once per visitor (localStorage in try/catch), never with prefers-reduced-motion.
2. **Header.** Logo; "Client login" button → https://dash.the-systronic.com
3. **Hero (split).** White page, pale ghost bolt behind. The cyan and red layers separate a few px with the pointer (desktop),
   with touch drag or a slow idle drift (mobile), and return to rest. Headline, subline, CTA scrolls to the form.
   Charging bar from one constant `READY_PERCENT` at the top of `main.js` (Ahmed edits it).
4. **IMAGINE.** The 7 letters wide-spaced like the logo. Hover / focus / tap opens a letter into its word + line; one open at a time;
   keyboard reachable. At 390 the letters become a vertical list.
5. **Contact.** Form (name, email, message) sent with fetch to Web3Forms (check the API on its official docs page first), key from one
   constant `FORM_ACCESS_KEY = "PASTE_KEY_HERE"` (Ahmed gets the key himself), honeypot `botcheck`. Inline messages, loading,
   success and error states from copy.md; no page reload. Every field styled: no browser-native unstyled controls.
6. **Footer.**
Also: meta title + description, Open Graph image 1200×630, favicon from the bolt.

## Quality
1440 / 1024 / 390 with no horizontal scroll. Text contrast AA, visible keyboard focus ring #00BEF6, alt texts.
Reduced motion = no intro and no split motion. Vanilla JS + SVG/CSS only (no three.js); whole page under 1 MB.

## Done when
- `work\site\shots\`: hero 1440 / 1024 / 390; IMAGINE with one letter open at 1440 and 390; form errors + success (mocked) at 390;
  intro frames start / strike / flash.
- `work\site\DESIGN.md` (≤30 lines): font + licence, measured navy, decisions, open questions.
- Reply 3 lines: page path · shots path · open questions · `Skills used:` · `skill_friction:`.
