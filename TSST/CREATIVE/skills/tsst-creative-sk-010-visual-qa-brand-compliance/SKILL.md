---
name: tsst-creative-sk-010-visual-qa-brand-compliance
description: Detect and correct visual defects before any creative is accepted for user/media review.
version: 0.3
---

# TSST-CREATIVE-SK-010 — Visual QA & Brand Compliance

Status: `UNVALIDATED`  
Training installed: 2026-09-24  
Owner: `CREATIVE_AG`

## Objective

Detect and correct visual defects before any creative is accepted for user/media review.

## Source / provenance

Approved brand guideline masters + platform preview/safe-zone evidence + WCAG/brand-specific readability rules where applicable.

## Required method

1. Inspect the actual render, never only the source brief or CSS/layout code.
2. Review logo geometry/clear space, font, Arabic shaping, color roles, crop, safe zones, hierarchy, image quality, claims and rights.
3. Preview at real delivery sizes and inspect edge/crop behavior per format.
4. Record each defect with severity, evidence and required correction; re-inspect after fix.
5. Downgrade to PREVIS/PRODUCTION_DRAFT when the final medium is not actually rendered.

## Added rules (2026-10-07)

- Open or sample every asset before writing a usage rule; never infer from file names (see `FINAL_ASSET_GATE.md`, L2).
- Before handover run the scored self-review in `FINAL_ASSET_GATE.md` (L7); use `tools/contrast.py` for contrast.

## Failure patterns

- self-certifying an unrendered design
- checking only brand colors while missing weak composition
- accepting broken Arabic or distorted product/logo
- calling a browser preview a final post

## Practical evaluation

Red-team a mixed pack of 12 assets containing deliberate and subtle failures; achieve high defect recall without false production-readiness claims.

## Validation rule

Package installation and study do not validate the skill. Validation requires actual evidence appropriate to the medium. Render-dependent skills cannot pass on briefs, prompts, HTML previews or unrendered storyboards alone.

## Changelog
- 0.2 (2026-10-07): Open-before-rule (L2); pointer to scored self-review (L7). Status unchanged.
- 0.3 (2026-10-07): Never mark a product feature as "invented" unless every source view was checked and the owner confirmed it; a feature hidden in one view may be real (dresser-01: the slab seam was real, judged invented from 3/4 views). Status unchanged.
