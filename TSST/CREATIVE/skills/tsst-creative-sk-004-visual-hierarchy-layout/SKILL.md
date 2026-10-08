---
name: tsst-creative-sk-004-visual-hierarchy-layout
version: 0.2
description: Design or review visual hierarchy and layout using reading order, grid, spacing, alignment, rhythm, responsive behavior, and task-focused composition.
---

# TSST-CREATIVE-SK-004 Visual Hierarchy & Layout

Status: `UNVALIDATED`

## Objective

Create layouts that direct attention in the intended order, reduce cognitive friction, remain coherent across sizes, and support the content's decision or action.

## Triggers

Use for layout design, hierarchy critique, grid definition, spacing systems, responsive adaptation, or visual-composition QA across social, deck, and web formats.

## Reusable principles

- Start with the reader's task and intended reading order.
- Establish hierarchy through position, scale, contrast, spacing, and grouping before decoration.
- Use a consistent grid and spacing scale; break them only for a stated purpose.
- Group related elements and separate unrelated elements.
- Design responsive behavior, not just a desktop shrink.
- Reuse familiar patterns when they reduce friction, while preserving brand character.

## Workflow

1. Identify the primary action or message, content inventory, reading direction, surface, and constraints.
2. Rank content into primary, secondary, supporting, and optional layers.
3. Choose a grid, margins, alignment logic, spacing scale, and content regions.
4. Compose the primary path before adding secondary detail.
5. Test grouping, rhythm, balance, scan path, line length, and focal competition.
6. Adapt for target breakpoints, aspect ratios, and Arabic/Latin directionality.
7. Review at actual output size and with realistic content lengths.
8. Document issues by severity, rule, evidence, and correction.

## Photo composition & layout for social (v0.2, UNVALIDATED; source GEM-CR-005, Lead overrides applied)

Use when a photo carries type or must be cropped to a social format. Read only what you need:
- `ref/composition.md` - principles + interior specifics, each with a measurable test.
- `ref/cropping-layout.md` - crop priority, finding text space, layout types, grid, carousel rhythm. No overlays on project photos; upscale <= 1.25x; safe zones from `TOOLCHAIN.md`.
- `ref/critique.md` - scored sheet (points to FINAL_ASSET_GATE, no duplication) + 10 exercises.
- Tool: `python TSST/CREATIVE/tools/text_space.py --slide DIR | --photo P --box WxH [--subject x0,y0,x1,y1] --out OUT` ranks the 3 quietest text planes with brand text colour + contrast. Ranking is quietness only; judge reading order and light yourself.

## Output contract

- intended reading order and priority map;
- grid, spacing, alignment, and region rules;
- layouts for required sizes or breakpoints;
- annotated hierarchy review;
- issue list with severity and corrective action;
- visual QA result.

## Guardrails

- Learn principles from Primer; do not imitate GitHub's visual style.
- Do not use size or color as the only signal of structure when labels or order are required.
- Do not optimize an isolated screenshot while breaking responsive behavior.
- Do not hide essential content merely to make a composition cleaner.

## Completion checklist

- [ ] The primary message/action is unmistakable.
- [ ] Reading order matches the intended narrative and language direction.
- [ ] Grid, alignment, spacing, and grouping are consistent.
- [ ] Responsive and realistic-content tests pass.
- [ ] Issues are specific and actionable.
- [ ] CREATIVE_AG visual QA is recorded.

## Practical evaluation

Review three intentionally flawed creatives across social, deck, and web. Identify hierarchy and layout defects, explain their effect, prioritize them, and propose corrected layouts. The reviewer checks whether corrections improve the intended reading order without copying Primer's appearance.

## Common failure modes

- every element competes at the same level;
- alignment and spacing decisions vary without purpose;
- grid used as decoration rather than structure;
- mobile version is a scaled desktop;
- critique uses taste words instead of observable issues;
- corrections erase necessary content.

## Sources

- [GitHub Primer](https://github.com/primer)
- [Primer layout foundations](https://primer.style/product/getting-started/foundations/layout/)

Source use: design-system and layout principles, not visual imitation.

## Changelog
- 0.2 (2026-10-08): Photo composition and layout section, ref/ (composition, cropping-layout, critique), tools/text_space.py; from GEM-CR-005 with Lead overrides. Status unchanged (UNVALIDATED).
