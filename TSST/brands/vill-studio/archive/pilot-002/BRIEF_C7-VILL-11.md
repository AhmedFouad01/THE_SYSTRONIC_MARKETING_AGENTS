# C7-VILL-11 — Studio review + final brand identity from the logo colours

Brand: vill-studio · Issued by: Lead (claude) 2026-10-05 · User priority: finish the brand identity.

## Skill Plan
```
TEAM: studio
AGENT: tsst-creative            (Codex: spawn .codex/agents/tsst-creative.toml — gpt-6.1-sol · medium)
SKILLS: TSST-CREATIVE-SK-006 (colour system + contrast) · TSST-CREATIVE-SK-001 (brand system, VALIDATED) · TSST-CREATIVE-SK-010 (visual QA)
NOT_SELECTED: SK-003 tokens (fold into SK-006 roles), SK-005 typography (keep v1.0 type unless review finds a defect), SK-014 generative imagery (no generation)
TIER: WORK
ALSO LOAD: TSST/CREATIVE/CREATIVE_PRODUCTION_STANDARD.md · TSST/CREATIVE/FINAL_ASSET_GATE.md
SKILL_GAP: none
```
Find skill paths with `python TSST/skills/build_index.py --id <ID>`. Open all three before work.

## Authority (only this)
`TSST/brands/vill-studio/assets/final/Logo.png` (+ `Logo.psd`), approved by the user 2026-10-05.
Sampled: navy `#040136` · orange `#EE8C01` · white `#F3F4F6` (`assets/ASSETS.yaml`).
`TSST/brands/vill-studio/assets/proposals/*` = history only, never authority. The VI deck colours
(Obsidian, Ink Blue, Ivory, Bronze, Oak, Stone) and Raleway are the **outdated look**.

## Steps
1. **Review the whole Studio output** in this pilot (`BRAND_LOOK_DIRECTION_v0.1–v0.3`,
   `BRAND_LOOK_v1.0.md`, `REVIEW_*`, `LEAD_NOTES_v0.3.md`, `assets/README.md`, `assets/qa/`):
   per file — consistent with the logo palette? which colours/elements must change? visual
   defects (SK-010)? → `REVIEW_STUDIO_C7-VILL-11.md` (≤1 page, table).
2. **Final identity** → `BRAND_LOOK_v1.1.md` (supersedes v1.0): palette = navy, orange, white +
   only tints/shades derived from them (state formula + hex); semantic roles (background,
   surface, text, muted text, accent, CTA, border, on-orange text); usage proportions; full
   WCAG contrast table for every text/background pair actually used, with pass/fail and the fix;
   logo usage (on navy / on white, clear space, min size, never recolour). Old VI colours listed
   once as "retired". Arabic summary at the end.
3. **Apply** the v1.1 palette to the existing editable masters in `assets/` (tokens, not one-off
   hex), re-render PNGs and phone/RTL QA renders through the render pipeline already in
   `assets/` (`build.py`, `render.cjs`, `preview.py`). Keep CONCEPT labels. Update
   `assets/README.md` (what changed, QA result per asset).

## Boundaries
No publication, spend or client contact. Never edit `TSST/brands/vill-studio/assets/final/`, never
recolour or retype the logo, no new hues. No image generation. Write only inside this pilot folder.

## Done when
`REVIEW_STUDIO_C7-VILL-11.md` + `BRAND_LOOK_v1.1.md` exist; all masters re-rendered with v1.1 and
QA'd; `assets/README.md` updated; `done --skills-used` lists the three skills; packet includes
`Skills used / Skills skipped / skill_friction`.
