---
name: tsst-creative-sk-005-typography-system
description: Define readable Arabic and Latin typography systems with role-based scales, pairing logic, line metrics, fallbacks, licensing, and cross-channel tests.
---

# TSST-CREATIVE-SK-005 Typography System

Status: `UNVALIDATED`

## Objective

Create a bilingual typography system that establishes hierarchy, readability, brand character, and predictable behavior across social creative, presentations, and web interfaces.

## Triggers

Use when selecting or auditing fonts, building a type scale, pairing Arabic and Latin families, defining text roles, or checking cross-channel readability.

## Reusable principles

- Select for language coverage, legibility, available weights, licensing, and delivery constraints before style preference.
- Define typography by semantic roles with size, weight, line height, tracking, and case behavior.
- Pair scripts by comparable visual color, proportion, weight, and hierarchy rather than forcing identical metrics.
- Keep the scale restrained and make small-text differences deliberate.
- Test real words, numerals, punctuation, mixed-script strings, and fallback behavior.
- Adapt values by surface while preserving role relationships.

## Workflow

1. Confirm languages, scripts, audience, surfaces, technical formats, font-delivery method, and licensing.
2. Test candidate families for glyph coverage, Arabic shaping, numerals, punctuation, weights, and rendering.
3. Define display, heading, body, label, caption, data, and code roles as applicable.
4. Set scale, weight, line height, measure, tracking, alignment, and emphasis rules for each script.
5. Define mixed-script pairing and fallback stacks.
6. Map roles to social, deck, and web contexts without inventing unrelated scales.
7. Test smallest sizes, long Arabic strings, mixed numerals, dense charts, and export/render behavior.
8. Document approved and prohibited uses and record QA evidence.

## Output contract

- font inventory with license and delivery status;
- Arabic/Latin pairing rationale;
- semantic type roles and tokens;
- surface mapping and fallback stacks;
- usage rules and prohibited treatments;
- readability and rendering test results.

## Guardrails

- Use GitHub's production typography as a usage reference, not a typeface prescription.
- Do not select a font without verifying Arabic coverage and license when Arabic is required.
- Do not use artificial bold, stretched type, or arbitrary tracking to force a match.
- Do not claim readability from a type scale alone; test actual content at final size.

## Completion checklist

- [ ] Licensing and distribution constraints are documented.
- [ ] Required glyphs, weights, numerals, and punctuation were tested.
- [ ] Roles define size, weight, line height, and spacing.
- [ ] Arabic/Latin pairing and mixed-script behavior are explicit.
- [ ] Social, deck, and web tests pass at actual size.
- [ ] Fallback behavior is acceptable.

## Practical evaluation

Build an Arabic/English type system for a fictional brand and demonstrate it in a social post, a data-heavy slide, and a responsive web page. Include the type tokens, usage rules, fallbacks, and a readability test log.

## Common failure modes

- stylistic pairing with mismatched hierarchy;
- missing glyph or weight coverage;
- too many sizes and weights;
- identical line-height rules imposed on both scripts;
- social-only testing;
- unlicensed or unavailable fonts.

## Sources

- [GitHub Brand Guidelines 2026](https://brand.github.com/GitHub-BrandGuidelines-2026.pdf)
- [GitHub Brand Toolkit foundations](https://brand.github.com/foundations)

Source use: example of a production type system and hierarchy. Typeface choices are not to be copied by default.
