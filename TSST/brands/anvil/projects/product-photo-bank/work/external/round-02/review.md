# Round 02 actual-render review — correction required

2026-10-12 · CREATIVE_AG · SK-013 / SK-019 / SK-010 · NOT_READY. The batch is not accepted as finished white-background product photography.

Reviewed all 10 paired sheets covering 95 outputs, plus nine full 1600-pixel PNGs directly from canonical Drive. Reused prior original-source observations and opened original TVN Creatine again to check a report claim. No image generation, processing or rerun executed by this reviewer. Lead independently passed source/output hashes, 1600-square dimensions, opacity and white corners for all 95; those checks do not establish segmentation or label fidelity. Color-profile certification remains with technical review.

## Decisive visual failures

All filenames below share prefix `PHOTO-2026-10-04-01-`; output suffix is `__white_v01.png`.

| Source stem | Submitted status | Actual rendered defect |
|---|---|---|
| 17-31 | COMPLETED | MET-Rx display: blue shaker side/body and black/red bases erased; brown retail background survives between/around objects; jagged edges. |
| 17-31 2 | COMPLETED | Seven ON display: far-right shaker largely erased, multiple lids/edges lost; brown background and shelf strip retained. The source's seven intact items are not preserved. |
| 17-31 4 | COMPLETED | SPORTSIUM display: large white holes through pink lid and green body/lid; brown background survives between shakers; cut bases and ragged contours. |
| 17-30 2 | REVIEW | One Raw blue Creatine: enormous white hole erases the central printed shark graphic and lower label; foreign background fragments remain. This is mask damage, not source hand occlusion. |
| 17-12 | REVIEW | Muscle Show Creatine: large black backdrop slab retained, parts of printed serving label/body erased, lid contour damaged. |
| 17-07 2 | REVIEW | Red Premium Creatine: main printed area mostly intact, but detached red/blue shelf pieces and skin fragments remain. This looks potentially repairable with a source-based contour mask; not inherently impossible because it was hand-held. |

All six were opened as actual full-size PNGs. Other sheets show repeated severe mask holes through black tubs, destroyed lids, source shelf fragments and disembodied hand patches. The source label may not have been regenerated, yet deleting its pixels still violates product truth. `100% faithful`, PASS_WITH_RESERVATIONS and high edge/quality scores are unsupported. Shadows under damaged cutouts do not repair them.

## Useful work and qualified counts

- **18 REUSED_CANVAS candidates:** all screened on sheets; full examples checked were TVN Pistachio bar (14-33 2), TVN Creatine (16-56) and Cream of Rice (16-57). Their main product art looks retained and useful. TVN bar shadow shows a hard crop/canvas transition at its left edge; inspect/blend outside product pixels before final acceptance. The 18 are a reusable subset, not all individually approved at 100% by this review.
- **3 claimed COMPLETED displays:** all three independently fail. Reclassify REVIEW until source-contour masks preserve every item and visible print.
- **74 already REVIEW:** retain this honest unfinished status; many are algorithmic mask failures, not just hand/watermark limitations. They are not all proven unfixable. Separate recoverable segmentation defects from actual hidden product regions requiring better source photos.
- **95 processed/rendered ≠ 95 usable.** Current defensible screening: 18 reuse candidates plus 77 retail/other outputs requiring corrective assessment. No accepted final-ready total established here; no release/delivery approval.

## Reporting contradictions

Original `PHOTO-2026-10-04-01-16-56.jpg` visibly prints **“THE ULTIMATE RECOVERY FOR ATHLETES”**. REPORT calls that phrase hallucinated by the rejected native editor, which is false as stated. The current final PNG also contains it faithfully. Preserve any genuinely rejected native artifact as separate evidence and report actual differences; do not use an existing source phrase as proof of invention. This review neither validates nor disproves other native-editor changes without that rejected artifact comparison.

White canvas adaptation necessarily resamples/places art; “byte/pixel-faithful” needs qualification rather than literal byte equality for resized output. Source hashes prove source immutability, not preservation of every output product pixel. Camera watermark provenance/removal claims must be checked against source and mask, rather than automatically attributed to every accessory defect.

Reader's script audit found studio alpha computed globally as `clip((254 - luminance) / 6)`, which can fade near-white packaging details as well as background. The 18 reuse candidates therefore need source-interior protection checks, not automatic acceptance. Status categories were assigned by fixed filenames rather than actual visual QA; verification covered technical properties and corners, not labels/contours or ICC evidence. Lead found no embedded ICC profiles in95outputs; an sRGB chunk/explicit color conversion still needs technical confirmation before claiming sRGB compliance.

## Next action

Preserve all v01 work. Correct affected images from originals with product-boundary masks and explicit solid foreground protection for packaging interiors; do not retry global color-cluster deletion. Start with the six concrete failures above to demonstrate a sound local workflow, then assess the remaining affected retail sources individually. Restore erased visible parts from the exact original, remove only genuine exterior clutter, keep wrapping and displays intact, and flag genuinely occluded regions without reconstruction. Audit the 18 reuse candidates for canvas/shadow seams. v02 only where changed; all final acceptance needs actual per-image render QA, not script-generated PASS labels.
