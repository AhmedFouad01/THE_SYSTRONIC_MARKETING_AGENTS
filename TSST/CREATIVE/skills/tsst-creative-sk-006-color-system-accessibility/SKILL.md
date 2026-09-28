---
name: tsst-creative-sk-006-color-system-accessibility
description: Build semantic, theme-aware color systems and verify text, interface, and data-visualization contrast without relying on color alone.
---

# TSST-CREATIVE-SK-006 Color System & Accessibility

Status: `UNVALIDATED`

## Objective

Turn an approved palette into role-based colors for light and dark contexts, states, content, and data while verifying accessible contrast and non-color cues.

## Triggers

Use when defining or auditing palettes, semantic color tokens, themes, state colors, chart palettes, contrast, or color-accessibility behavior.

## Reusable principles

- Separate raw palette values from semantic roles such as foreground, surface, border, accent, success, warning, and danger.
- Evaluate resolved foreground/background pairs in each theme and state.
- Meet at least WCAG AA where applicable: 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful non-text boundaries and states.
- Never use color as the only carrier of status, validation, or category meaning.
- Provide high-contrast or adaptive behavior where the product and audience require it.
- Treat data-visualization differentiation separately from brand decoration.

## Workflow

1. Confirm approved brand colors, surfaces, themes, platforms, content types, and accessibility target.
2. Build a base palette, then map values to semantic roles.
3. Define light/dark and interaction-state mappings with aliases.
4. Test text, icon, control, border, focus, validation, and disabled-state pairs.
5. Add labels, shapes, patterns, icons, or position so meaning survives reduced color perception.
6. Test representative charts and creative compositions, including grayscale and color-vision simulations when available.
7. Resolve failures by changing role assignments or values, not by hiding the check.
8. Document passed pairs, exceptions, and revalidation triggers.

## Output contract

- base palette and semantic role map;
- theme and state mappings;
- contrast matrix with measured ratios and pass/fail criteria;
- non-color cue rules;
- data-visualization guidance;
- exceptions, remediation, and QA record.

## Guardrails

- Do not use Primer's palette as the target brand palette.
- Do not infer accessibility from a color name or token category.
- Do not use color for decoration when it creates hierarchy or state ambiguity.
- Do not accept a passing text ratio while controls, focus, validation, or charts remain unreadable.

## Completion checklist

- [ ] Semantic roles are distinct from raw values.
- [ ] Every required theme and state is mapped.
- [ ] Required contrast pairs were measured.
- [ ] Meaning has a non-color cue.
- [ ] Charts and representative compositions were tested.
- [ ] Failures and exceptions are explicit.

## Practical evaluation

Build a light/dark semantic palette for a fictional brand, document role tokens, and produce a contrast matrix covering text, controls, validation, and a categorical chart. Fix all required failures and explain any approved exception.

## Common failure modes

- palette presented without role assignments;
- one theme passes while another fails;
- disabled or muted text becomes illegible;
- success/error meaning is color-only;
- contrast checked on isolated swatches rather than actual pairs;
- charts reuse indistinguishable brand colors.

## Sources

- [Primer Primitives](https://github.com/primer/primitives)
- [Primer color considerations](https://primer.style/accessibility/design-guidance/color-considerations/)

Source use: semantic-token and accessibility method reference, not palette copying.
