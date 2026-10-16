# VILL Studio — Logo-only Brand Look + production pack

2026-10-05 · C7-VILL-10 · Phase 2b steps 1–3 complete for independent review.

**Asset state: PRODUCTION_DRAFT.** Seven actual PNGs and seven editable HTML sources are delivered. CONCEPT is an on-asset content disclosure; the production state remains PRODUCTION_DRAFT because imagery provenance/rights and original quality are pending. No generated imagery was used. HTML is an editable master / PREVIS source, never a final PNG substitute.

[Brand Look v1.0](../BRAND_LOOK_v1.0.md) derives identity only from `../inputs/Logo.png`. VI/Raleway/v0.3 were excluded. The real logo is referenced by every master, never retyped. [Phone contact sheet](qa/contact-sheet.png) · [Self-QA](qa/SELF_QA.md).

## Deliverables and image provenance

| Editable master | Actual export | Phone preview | Source crop | Composition / QA |
|---|---|---|---|---|
| [carousel-01.html](sources/carousel-01.html) | [carousel-01.png](renders/carousel-01.png) | [carousel-01-phone.png](qa/carousel-01-phone.png) | living | Whole-home aperture; couch/window focal point, large italic Latin then RTL Arabic. |
| [carousel-02.html](sources/carousel-02.html) | [carousel-02.png](renders/carousel-02.png) | [carousel-02-phone.png](qa/carousel-02-phone.png) | joinery | Detail crop and question column; vertical divider. Small-source softness visible at 100%. |
| [carousel-03.html](sources/carousel-03.html) | [carousel-03.png](renders/carousel-03.png) | [carousel-03-phone.png](qa/carousel-03-phone.png) | kitchen | Tall kitchen crop and stacked Latin; optional whole-home line, no purchase obligation. |
| [reel-cover.html](sources/reel-cover.html) | [reel-cover.png](renders/reel-cover.png) | [reel-cover-phone.png](qa/reel-cover-phone.png) | kitchen | Native tall crop and overlapping solid headline panel. Central square/4:5 retains headline and CONCEPT; top logo excluded from those simulations, placement review required. |
| [single-post.html](sources/single-post.html) | [single-post.png](renders/single-post.png) | [single-post-phone.png](qa/single-post-phone.png) | joinery + dining | White editorial offset diptych. Footer contrast and panel boundary corrected and re-inspected. |
| [kitchen-ad.html](sources/kitchen-ad.html) | [kitchen-ad.png](renders/kitchen-ad.png) | [kitchen-ad-phone.png](qa/kitchen-ad-phone.png) | kitchen | Kitchen-only hero; clear Project Assessment CTA, no price, guaranteed outcome or whole-home condition. |
| [whole-home.html](sources/whole-home.html) | [whole-home.png](renders/whole-home.png) | [whole-home-phone.png](qa/whole-home-phone.png) | living + dining + kitchen + joinery | Living hero plus room sequence; entire company scope, visually distinct from ad. |

Carousel slides, single post, kitchen ad and whole-home post are 1080×1350 (4:5). Cover is 1080×1920 (9:16), a still, not video. Every PNG was visually inspected; phone/Arabic/contrast results in Self-QA. Full image resolution inspection found screenshot softness, recorded rather than certified as final photography.

Crops contain imagery only, not the obsolete profile typography/palette or project claims. `crop-manifest.json` records exact pixel boxes (left,top,right,bottom). Source files:

- `images/kitchen.png`: `../inputs/company-profile/Port_ (1).png`, [457,38,1084,753], 627×715.
- `images/joinery.png`: same page, [748,781,1083,1106], 335×325.
- `images/living.png`: `../inputs/company-profile/CP (4).png`, [763,39,1640,580], 877×541.
- `images/dining.png`: same page, [763,595,1188,900], 425×305.
- Logo: `../inputs/Logo.png` (1080 square) unchanged, navy holding field intact. No profile claims such as history/date/location copied.

## Assumptions

1. Supplied profile imagery is authorised for private design review; original rights and image type are unverified. It may be photography or rendering. Therefore CONCEPT appears on all assets and no completed-project or QC proof is claimed.
2. Source screenshots are accepted as a private mockup input; original high-resolution photography must replace small crops for release.
3. Proposed copy and Western numerals are conservative choices; no user input was awaited. Kitchen entry is optional, with Project Assessment CTA; whole-home scope is present in the separate post/carousel.
4. Current platform overlays are not verified. Cover central-crop simulations retain headline/disclosure but exclude top logo; release needs placement review and possible logo repositioning.
5. Exact executing runtime model metadata is unavailable in this worker. Claim truthfully recorded `unavailable`; bus expected WORK / gpt-6.1-sol medium. No invented model identity or skill-validation promotion.

## Reproduce / edit

Edit HTML masters in `sources/`; local `@font-face` assets are bundled. Keep the original relative image paths. Open in a browser to edit/preview; actual deliverables are `renders/*.png`. `build.py` regenerates all masters and Brand Look, so edit it if regenerating. `render.cjs` uses locally bundled Playwright and installed Edge headless; waits for font/image decode. `preview.py` writes phone/crop previews and checks visible logo pixels. Run scripts from the repository root. Renderer paths are local environment choices, not required font installation. No uploads or publishing occur.

Fonts: Barlow Condensed Bold/Bold Italic and Cairo variable; SIL OFL 1.1 files included. Sources: [Barlow Condensed official Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/barlowcondensed), [Cairo official repository entry](https://github.com/google/fonts/tree/main/ofl/cairo). Fonts downloaded 2026-10-05. Supporting hashes in `qa/inventory.json`.

## File inventory

- [build.py](build.py)
- [crop-manifest.json](crop-manifest.json)
- [desktop.ini](desktop.ini)
- [fonts/barlow-condensed-bold-italic.ttf](fonts/barlow-condensed-bold-italic.ttf)
- [fonts/barlow-condensed-bold.ttf](fonts/barlow-condensed-bold.ttf)
- [fonts/barlow-OFL.txt](fonts/barlow-OFL.txt)
- [fonts/cairo-OFL.txt](fonts/cairo-OFL.txt)
- [fonts/cairo.ttf](fonts/cairo.ttf)
- [fonts/desktop.ini](fonts/desktop.ini)
- [images/desktop.ini](images/desktop.ini)
- [images/dining.png](images/dining.png)
- [images/joinery.png](images/joinery.png)
- [images/kitchen.png](images/kitchen.png)
- [images/living.png](images/living.png)
- [preview.py](preview.py)
- [qa/bidi-test.png](qa/bidi-test.png)
- [qa/carousel-01-phone.png](qa/carousel-01-phone.png)
- [qa/carousel-02-phone.png](qa/carousel-02-phone.png)
- [qa/carousel-03-phone.png](qa/carousel-03-phone.png)
- [qa/contact-sheet.png](qa/contact-sheet.png)
- [qa/desktop.ini](qa/desktop.ini)
- [qa/kitchen-ad-phone.png](qa/kitchen-ad-phone.png)
- [qa/pixel-checks.json](qa/pixel-checks.json)
- [qa/reel-cover-feed-crop.png](qa/reel-cover-feed-crop.png)
- [qa/reel-cover-phone.png](qa/reel-cover-phone.png)
- [qa/reel-cover-square-crop.png](qa/reel-cover-square-crop.png)
- [qa/render-checks.json](qa/render-checks.json)
- [qa/SELF_QA.md](qa/SELF_QA.md)
- [qa/single-post-phone.png](qa/single-post-phone.png)
- [qa/whole-home-phone.png](qa/whole-home-phone.png)
- [render.cjs](render.cjs)
- [renders/carousel-01.png](renders/carousel-01.png)
- [renders/carousel-02.png](renders/carousel-02.png)
- [renders/carousel-03.png](renders/carousel-03.png)
- [renders/desktop.ini](renders/desktop.ini)
- [renders/kitchen-ad.png](renders/kitchen-ad.png)
- [renders/reel-cover.png](renders/reel-cover.png)
- [renders/single-post.png](renders/single-post.png)
- [renders/whole-home.png](renders/whole-home.png)
- [source-contact-sheet.png](source-contact-sheet.png)
- [sources/carousel-01.html](sources/carousel-01.html)
- [sources/carousel-02.html](sources/carousel-02.html)
- [sources/carousel-03.html](sources/carousel-03.html)
- [sources/desktop.ini](sources/desktop.ini)
- [sources/kitchen-ad.html](sources/kitchen-ad.html)
- [sources/reel-cover.html](sources/reel-cover.html)
- [sources/single-post.html](sources/single-post.html)
- [sources/whole-home.html](sources/whole-home.html)
- [tokens.json](tokens.json)
- [qa/inventory.json](qa/inventory.json) — path, byte size and SHA-256 for every delivered file except this inventory itself.
- [README.md](README.md) — this handoff.
