# VILL Brand Guidelines v1.0

24-page 1920×1080 guide with editable HTML, page PNGs, actual browser PDF, native educational applications and render QA. See [index](../BRAND_GUIDELINES_v1.0.md), [BRAND.md](BRAND.md), [AGENT_GUIDE.md](AGENT_GUIDE.md), [per-page QA](qa/PER_PAGE_QA.md) and [self-critique](qa/SELF_CRITIQUE.md). Approved logo/palette unchanged. Strategy accepted; LENS verbal and this execution remain drafts. No publication, contact or release approval.

Reproduce from canonical repository root: `python TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0/build.py`, then `node .../BRAND_GUIDELINES_v1.0/render.cjs`, then `python .../BRAND_GUIDELINES_v1.0/preview.py`. Run `verify_pdf.py` with bundled workspace Python (see script) for actual PDF raster checks. Keep qa/before unchanged as first-pass evidence. All new text uses UTF-8 LF.

Pipeline copied/adapted inside this new scope; previous assets/specs untouched. Edge/Playwright awaits font and image decoding; applications render before guide pages that embed them. Cairo and Barlow reference existing bundled OFL files. PDF created by browser to preserve Arabic/vector typography; bundled pypdfium2 rasterized all24 pages. No font/assets downloaded or generated.

Skills used: TSST-CREATIVE-SK-002 (BRAND/agent/version/source rules); TSST-CREATIVE-SK-008 (two directions, measured Decision cut, native guidance); TSST-CREATIVE-SK-005 (Arabic-first Cairo roles, bidi and fallback); TSST-CREATIVE-SK-010 (actual render defects/fixes, phones/crops/all-page PDF QA). PDF skill loaded and operation marker run once before first authoring. SK002/008 LAB_VALIDATED; SK005/010 remain UNVALIDATED, task QA is not skill validation.

Skills skipped:006 approved palette;014 no generation;001 prior audit. Agent/runtime: canonical tsst-creative role executed through collaboration task tsst_creative, Codex WORK dispatch/claim gpt-6.1-sol medium; no claim of native role auto-loading or model introspection. skill_friction: four skills justified by brief; Poppler/fitz absent, available bundled PDFium used; no wider Latin font available/installed, Barlow limited to labels. Skill gap none in bounded deliverable.

Next: independent Lead/user review of guide craft and draft verbal; confirm contact channel, image rights/high-res/proof and platform overlays before any release. No self Lead close.
