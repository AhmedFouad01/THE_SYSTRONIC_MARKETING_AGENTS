---
name: tsst-creative-sk-019-creative-production-pipeline-export-qa
description: Move creative work from source intake to deterministic file delivery with correct naming, dimensions, codecs/formats, rights notes and QA evidence.
version: 0.2
---

# TSST-CREATIVE-SK-019 — Creative Production Pipeline & Export QA

Status: `UNVALIDATED`  
Training installed: 2026-09-24  
Owner: `CREATIVE_AG`

## Objective

Move creative work from source intake to deterministic file delivery with correct naming, dimensions, codecs/formats, rights notes and QA evidence.

## Source / provenance

Adobe Premiere/Photoshop export guidance + TSST production-state and final-asset gates.

## Required method

1. Create an asset manifest before production: source, owner, rights, format, destination and required variants.
2. Keep editable sources separate from final exports; use deterministic versioned naming.
3. Export to the requested medium/size rather than substituting a convenient preview format.
4. Preview every enabled placement/aspect ratio and inspect first/last frames for video.
5. Deliver the render together with QA notes and unresolved dependencies.

## Layered build standard (L4)

Per asset, one folder with: numbered layer PNGs (`01_photo`, `02_tone`, `03_logo`, `04_text`); `layers.json` (order, file, blend, opacity, scale); a reproducible `build.py` that flattens from the json; a contact sheet and 360 px phone previews (`tools/phone_preview.py`). To swap a source, replace one layer and rebuild. HTML screenshots are PREVIS only. Reference build: `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/assets/post-01/`.

## Failure patterns

- HTML instead of requested PNG/MP4
- one master blindly resized to every channel
- missing source/rights trail
- unclear version filenames
- final marked complete without render inspection

## References (distilled from GEM-CR-004, 2026-10-08; unvalidated)

- `ref/post-finishing.md` - AI-footage post passes, tool split, export spec, ffmpeg frame-strip QA, rights/AI-label checks.

## Practical evaluation

Take a mixed still/video mini-campaign through manifest → production states → final exports → QA log with zero format/naming omissions.

## Validation rule

Package installation and study do not validate the skill. Validation requires actual evidence appropriate to the medium. Render-dependent skills cannot pass on briefs, prompts, HTML previews or unrendered storyboards alone.

## Changelog
- 0.2 (2026-10-07): Layered build standard (L4). Status unchanged.
