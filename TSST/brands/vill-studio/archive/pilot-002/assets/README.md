# VILL Studio — v1.1 identity and rendered template pack

2026-10-05 · C7-VILL-11 · [Brand Look v1.1](../BRAND_LOOK_v1.1.md) · [one-page Studio review](../REVIEW_STUDIO_C7-VILL-11.md).

**Creative state: PREVIS.** Seven actual rendered PNG template drafts and seven editable HTML masters complete the bounded identity/token revision. `REVIEW_TEAM_2026-10-05.md` campaign-quality rejection remains open; actual PNG format alone does not promote the gate. Historical C7-VILL-10 PRODUCTION_DRAFT provenance remains in [history](history/c7-vill-10/README.md). CONCEPT / SOURCE VISUAL stays on every asset per the newer brief. Unknown image type/rights and soft screenshot crops prevent final-production claims. No generated imagery or release approval.

The palette uses only approved navy #040136, orange #EE8C01, white #F3F4F6 and derived mixtures; [tokens](tokens.json) separates palette/semantic aliases. Every master references `TSST/brands/vill-studio/assets/final/Logo.png` unchanged (1080×1080). Its SHA-256 matches the historical input: `F743A268847ED6E278274B43FD3DDB0B02BEAD64662F45BE57CDA4FE7AE697C7`. PSD read-only; no logo retyping/recolouring. Barlow Condensed/Cairo and bundled OFL licences retained without new downloads.

## Per-asset change and actual QA

| Editable master | Actual export / phone | Image crop | v1.1 changes and result |
|---|---|---|---|
| [carousel-01](sources/carousel-01.html) | [PNG](renders/carousel-01.png) / [phone](qa/carousel-01-phone.png) | living | All dark text/index/aperture rules now aliases; logo authority fixed. AA/RTL/native/360 pass. Generic slogan and AC distraction remain. |
| [carousel-02](sources/carousel-02.html) | [PNG](renders/carousel-02.png) / [phone](qa/carousel-02-phone.png) | joinery | Muted support uses navy-tint-80; all colour aliases. AA/RTL/native/360 pass. Low-resolution joinery and weak copy remain. |
| [carousel-03](sources/carousel-03.html) | [PNG](renders/carousel-03.png) / [phone](qa/carousel-03-phone.png) | kitchen | Navy/white/index/disclosure aliases; approved logo. AA/RTL/native/360 pass. English-first/internal optional-step line remains. |
| [reel-cover](sources/reel-cover.html) | [PNG](renders/reel-cover.png) / [phone](qa/reel-cover-phone.png) | kitchen | Continuous tall hero; original logo and index integrated above headline in one navy panel. Native/360/square/feed pass; logo/headline/CONCEPT retained. Softness/weak concept remain. |
| [single-post](sources/single-post.html) | [PNG](renders/single-post.png) / [phone](qa/single-post-phone.png) | joinery + dining | Light panel navy text and navy-tint-20 muted support; footer remains navy/white. AA/RTL/native/360 pass. Decorative orange bar has no semantic boundary role; soft imagery remains. |
| [kitchen-ad](sources/kitchen-ad.html) | [PNG](renders/kitchen-ad.png) / [phone](qa/kitchen-ad-phone.png) | kitchen | CTA orange/navy and muted Arabic role mapped. AA/RTL/native/360 pass; kitchen-only scope retained. Contact channel/proof pending. |
| [whole-home](sources/whole-home.html) | [PNG](renders/whole-home.png) / [phone](qa/whole-home-phone.png) | living + dining + kitchen + joinery | Shared semantic tokens and approved logo applied. AA/RTL/native/360 pass. Montage and small soft thumbs remain. |

Six feed PNGs are 1080×1350; cover is 1080×1920 still (no video). Actual PNGs inspected at native size and the 360px phone board. Every logo is unchanged and visible; Arabic joining/line breaks are intact. Labels are supporting ~10–12px at phone scale; fine STUDIO descriptor is secondary. Cover simulations: [square](qa/reel-cover-square-crop.png), [4:5](qa/reel-cover-feed-crop.png) retain logo/title/CONCEPT. These are internal crop checks, not current-platform overlay certification.

## Evidence and limitations

- [Actual contact sheet](qa/contact-sheet.png), [grayscale](qa/contact-sheet-grayscale.png), [logo regions](qa/logo-evidence.png), [RTL specimen](qa/bidi-test.png), [QA record](qa/SELF_QA.md).
- [Render checks](qa/render-checks.json): seven masters, all bundled fonts/images loaded, zero text canvas overflow; image decode/two-frame safeguard preserved.
- [Contrast checks](qa/contrast-checks.json): 40 actual text elements, six resolved foreground/background pairs all normal AA ≥4.5:1; failed reserve pairs and fixes documented in v1.1.
- [Pixel checks](qa/pixel-checks.json): visible logo light pixels ≥6492 in every export, including corrected cover-specific region.
- [Inventory](qa/inventory.json): SHA-256/bytes for active files; [history manifest](qa/history-manifest.json) separately preserves prior sources/renders/QA/build/tokens/README. BRAND_LOOK_v1.0.md unchanged.
- Coordinator internally inspected v1.1 and integrated cover square crop on this run; this is bounded QA feedback, not formal user/Lead acceptance. Campaign key visual, Arabic-first art direction/type criticism, proof, original hi-res image records/rights, contact CTA, live placement overlays and strategic review remain open.
- Grayscale inspected: headline/CTA shape/index/disclosure stay readable; full colour-vision simulation unavailable in existing pipeline. No chart/interactive UI delivered, so those aliases require later actual UI testing.

## Source provenance

Crops from supplied profile screenshots, unretouched and unchanged: kitchen `inputs/company-profile/Port_ (1).png` [457,38,1084,753] 627×715; joinery same page [748,781,1083,1106] 335×325; living `inputs/company-profile/CP (4).png` [763,39,1640,580] 877×541; dining same page [763,595,1188,900] 425×305. [Crop manifest](crop-manifest.json). Supplied pages do not prove completed-project status or permission for external release. Private review use is an assumption. Replace screenshot crops with original licensed photo/render evidence before production acceptance; no fabricated execution/QC/price/location claims.

## Reproduce

Run from repository root: `python .../assets/build.py`, `node .../assets/render.cjs`, `python .../assets/preview.py`, then `python .../assets/document_v11.py` and `python .../assets/handoff_v11.py` (the prefix is `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE`). Build regenerates only crop files/token JSON/seven HTML masters, never historical v1.0. Edit build for durable layout changes; renderer injects token aliases from tokens.json, waits for actual fonts/decode and writes PNGs. Preview creates actual phone/crop/colour QA; document refreshes measured contrast/grayscale/spec; handoff refreshes review/README/inventory. Renderer uses installed local Playwright/Edge; no install, upload or publishing. Before recreating output, retain required new evidence under history; existing C7-VILL-10 snapshot is immutable.

## Skill packet

Agent: CREATIVE_AG / runtime role `tsst-creative` (canonical generated instructions loaded; collaboration label tsst_creative). Runtime/model: Codex child worker; routed/claimed gpt-6.1-sol medium, no independent runtime introspection beyond inherited session configuration. Skills used: TSST-CREATIVE-SK-006 — logo-only palette, semantic roles, actual contrast/grayscale; TSST-CREATIVE-SK-001 — historical audit/authority/logo/system rules; TSST-CREATIVE-SK-010 — actual PNG/native/phone/RTL/logo/crop inspection, fix/recheck and gate dispositions. Skills skipped: SK-003 folded into SK-006; SK-005 typography retained and unresolved direction defect recorded; SK-014 no generation. skill_friction: SK-006 has no concrete colour-vision simulator; limitation disclosed. Next: Lead independently inspects scoped outputs and judges identity acceptance; separate evidence-backed key-visual production needed before final campaign review. Readiness NOT_READY; no publication, spend, contacts, Real Memory or git changes.
