---
name: tsst-creative-sk-014-generative-visual-production-reference-fidelity
description: Use generative imagery to create useful production material while preserving product/logo geometry, reference intent, rights boundaries and visual consistency.
version: 0.7
---

# TSST-CREATIVE-SK-014 — Generative Visual Production & Reference Fidelity

Status: `UNVALIDATED`  
Training installed: 2026-09-24  
Owner: `CREATIVE_AG`

## Objective

Use generative imagery to create useful production material while preserving product/logo geometry, reference intent, rights boundaries and visual consistency.

## Source / provenance

Current image-generation/editing tool guidance + client-approved reference/brand rules; generation is a source-asset workflow, not brand authority.

## Required method

1. Separate immutable brand/product truth from generatable scene attributes before prompting.
2. Generate backgrounds/people/material/lighting separately when exact logos/products must remain untouched.
3. Use reference images for composition/style guidance only within allowed rights; do not clone distinctive third-party brand identity.
4. Inspect anatomy, hands, product geometry, labels, reflections, shadows and repeated artifacts before use.
5. Composite authorized logos/text/products after generation whenever exact fidelity matters.

## Manual image bridge (L8)

Creative writes one recipe per image for a user-run tool (ChatGPT image edit, Magnific; flow `TSST/context/adapters/gemini-desktop.md`); Ahmed runs it. Each recipe: names the source file; states the single change (light, set or upscale); ends with the invariant tail: "do not change geometry, materials, built elements; no text/logo/people; keep ratio". Creative then QAs output vs original side by side. Any change to the product/built element = reject and re-run. A re-staged product is presented as the brand's work only if geometry is unchanged. Blender deferred (see `TOOLCHAIN.md`).

## Product fidelity protocol (v0.4, from dresser-01)
1. Write a PRODUCT_CARD first (parts, counts, measured ratios, materials, colours, never-list) from the originals.
2. Give the tool several reference angles (hero, detail, straight front), by Drive path.
3. Put the structure counts and ratios into the prompt text, not only in the images.
4. Lock the camera (position, height, lens feel, no flattening). Flattened yaw was dresser-01's root defect.
5. Stage the rounds: product alone on a neutral backdrop, then other angles, then the studio set. Never restage the whole image in one step; the Lead did, and product and set both drifted. Split the tasks.
6. On a re-run, name the measured defect and its number.
7. Run numeric QA with `TSST/CREATIVE/tools/geometry_compare.py` (ratios, hue), not by eye.
8. Acceptance: structure exact, proportions within the user-set tolerance (dresser-01: +-10%). A generated re-render is a "hyper-real render" and is labelled internally as a render, never as the physical product photo.
9. Max 3 rounds per stage (user rule); after round 3 accept the best result or escalate. When the tool keeps pulling to one view, re-target to that view if the stage allows it, rather than fighting it.
10. Product card captures the signature FORM first (silhouette, taper, curvature of seams, how parts join), numbers second; the owner confirms the card before round 1. Owner acceptance can override the numeric gate; record it with the known differences.

## Failure patterns

- asking the generator to redraw an exact logo/product then accepting distortions
- uninspected hands/text/artifacts
- copying a reference brand rather than abstracting principles
- using generated documentary-looking scenes as proof of real operations

## Practical evaluation

Create three source-image options from a constrained reference brief; reject defective generations and deliver one compositable, provenance-labeled result.

## Validation rule

Package installation and study do not validate the skill. Validation requires actual evidence appropriate to the medium. Render-dependent skills cannot pass on briefs, prompts, HTML previews or unrendered storyboards alone.

## Changelog
- 0.2 (2026-10-07): Manual image bridge (L8). Status unchanged.
- 0.3 (2026-10-07): Product fidelity protocol (dresser-01 live training: card, staged rounds, camera lock, numeric QA, hyper-real-render acceptance). Status unchanged.
- 0.4 (2026-10-07): round cap (max 3 per stage) and re-target-the-pulled-view rule. Status unchanged.
- 0.5 (2026-10-07): owner-acceptance lesson (form-first card, owner confirms card, acceptance may override numeric gate). Status unchanged.
- 0.6 (2026-10-07): When text specs drift, give the generator a measured STRUCTURE GUIDE image (front-elevation line drawing traced from the real photo) as the primary reference; QA against the original via overlay, not against an earlier approved render. Status unchanged.
- 0.7 (2026-10-07): Manual-bridge rounds for one product run in ONE continuous chat; each step edits the tool's previous output. Start from the REAL photo as the edit base: editing preserves form, while generating from references regresses to the tool's generic archetype (evidence: dresser-01 Step A vs P1/P3). Status unchanged.
