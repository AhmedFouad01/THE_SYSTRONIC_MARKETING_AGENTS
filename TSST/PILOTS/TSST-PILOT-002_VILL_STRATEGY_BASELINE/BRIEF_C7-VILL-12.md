# C7-VILL-12 — VILL Brand Guidelines v1.0 (visual + verbal), higher craft

Brand: vill-studio · Issued by: Lead (claude) 2026-10-05 · User: "the design level is not good, but the
direction is right — now we want brand guidelines."

## Skill Plan
```
TEAM: studio
AGENT: tsst-creative            (Codex: .codex/agents/tsst-creative.toml)
SKILLS: TSST-CREATIVE-SK-002 (brand guidelines as versioned guidance) · TSST-CREATIVE-SK-008 (art direction — the quality lift; LAB_VALIDATED 88/100) · TSST-CREATIVE-SK-005 (Arabic/Latin type system) · TSST-CREATIVE-SK-010 (render QA)
JUSTIFICATION (>3, rule R4): a guidelines book needs the guidance format (002), a stronger visual idea (008), a re-judged type system (005) and actual-render QA (010); colour is already decided (v1.1) so SK-006 is not loaded again.
NOT_SELECTED: SK-006 (palette approved), SK-014 (no image generation), SK-001 (system audit done in C7-VILL-11)
TIER: WORK
ALSO LOAD: TSST/CREATIVE/CREATIVE_PRODUCTION_STANDARD.md · TSST/CREATIVE/FINAL_ASSET_GATE.md
SKILL_GAP: none
```

## Authority
- Logo: `TSST/brands/vill-studio/assets/final/Logo.png` (+psd) — never recolour/retype/regenerate.
- Colour: `TSST/brands/vill-studio/assets/final/palette-v1.1.json` (= BRAND_LOOK_v1.1) — approved by the user.
  **Approved = direction and colours. NOT approved = the template execution** (user: level not good).
- Strategy: `STRATEGY_BASELINE_v0.2.md` + `ACCEPTANCE.md`. Verbal identity: `VERBAL_IDENTITY_v1.0.md` (LENS_AG) — lay it out, do not rewrite it.
- Critique to fix: `REVIEW_TEAM_2026-10-05.md` (HIGH: generic concept, soft imagery, type, copy, separated languages), `LEAD_REVIEW_C7-VILL-11.md` (reel-cover strip/empty third, carousel-02 typo).

## Quality bar (the reason for this task)
1. **One ownable visual idea first** (SK-008): 2 written directions → pick 1 with reasons; derived from the logo's
   cut "V" / angle and "navy organizes, white clarifies, orange points to a decision". No generic "ONE HOME. ONE VISION."
2. Type: re-judge the pairing against the logo's heavy angular italic (SK-005); use only bundled OFL fonts in `assets/fonts/`
   (no downloads — propose alternatives in text if needed). Real hierarchy scale, Arabic-first bilingual pairing.
3. Layout: a real grid with intent (asymmetry/tension from the V angle), generous whitespace, one focal point per page.
4. Photography direction page: what VILL photos must look like (light, verticals, materials, people/no people), with the
   current photos shown as "CONCEPT — below standard" examples, never as the standard.
5. **Self-critique round before handoff**: render → compare against the quality bar → fix → re-render; include a
   before/after strip of the 3 weakest pages in QA.

## Deliverable — `BRAND_GUIDELINES_v1.0/` in this pilot folder
16:9 pages (1920×1080) as editable HTML sources + PNG per page + one PDF, rendered through the existing pipeline
(`assets/build.py`, `render.cjs`, `preview.py`). Sections (~20–26 pages):
cover · brand essence & personality · message house · voice & tone · Arabic/English language rules · logo (versions,
clear space, min size, on navy/white, misuse) · colour (roles, proportions, contrast, prohibited pairs) · typography
(scale, AR/EN pairing, bidi) · grid & layout · graphic device (the V angle) · photography direction · iconography/
labels (CONCEPT, status) · applications: kitchen ad 4:5, carousel cover 4:5, story/reel cover 9:16, WhatsApp/profile
avatar — redone at the new bar · do/don't · contacts & version.
Plus `BRAND_GUIDELINES_v1.0.md` (index of pages, decisions, open items) and QA in `BRAND_GUIDELINES_v1.0/qa/`.

## Boundaries
No publication, spend, client contact or downloads. Never edit `assets/final/`. Photos stay CONCEPT (rights unknown).
Write only inside this pilot folder.

## Done when
PDF + page PNGs + sources exist; self-critique round recorded; render QA (SK-010) per page; `done --skills-used`
lists the 4 skills; packet has `Skills used / Skills skipped / skill_friction`.
