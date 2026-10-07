# dresser-01 — GEOMETRY_QA v3 (thresholds per Ahmed 2026-10-07; run on every returned file; any product change = REJECT, re-run)
v3 (2026-10-07): the product round is the FRONT VIEW (INTAKE "Decisions after P1"). ROUND CAP: max 3 rounds per stage; after round 3 accept the best result or escalate to Ahmed. Product stage: P1 = round 1, P1-front (P1f_v1..v3) = round 2. Thresholds below unchanged (v2).
FRONT-VIEW TARGETS (PRODUCT_CARD; tolerance +-10%, hue +-12 deg; the 3/4 targets in the P1 table are superseded):
| Metric | Front target | P1_v1 measured (defect) |
|---|---|---|
| piece alone w:h | 1.76 | 1.70 (-3%, ok) |
| mirror w:h | 0.92 | 0.78 (-15%, fix) |
| mirror width / piece width | 0.57 | - |
| mirror height / piece height | 1.08 | - |
| mirror gap above wing top (of piece h) | 0.07 | - |
| pedestal width / piece width (each) | 0.29 | - |
| centre drawer width / piece width | 0.45 | - |
| kneehole height / piece height | 0.65 | - |
| pedestal tops above slab (of piece h) | 0.04 | - |
| stool w:h | 0.62 | 0.69 (+11%, fix) |
| stool width / kneehole width | 0.60 | 0.81 (+35%, fix) |
| stool height / pedestal height | 0.68 | - |
| right/left pedestal | 1.00 (straight front) | - |
Also check (the "no lift-lid seam" check is VOID, see QA ERROR line):  no box behind the mirror edge (both seen in P1).
THRESHOLDS v2 (Ahmed decision 2026-10-07, INTAKE "Decisions after Gate 1"; replaces the +-8% rule): outputs are judged as a hyper-real 3D render. STRUCTURE = zero tolerance (parts, 3+3+1 drawers, mirror present and positioned, stool present, colours/materials). PROPORTIONS (mirror w:h, piece w:h, pedestal/stool ratios from PRODUCT_CARD.md) within +-10%. Navy hue within +-12 deg. STOOL present, unwrapped, matches the card spec (round navy velvet, flat top, no legs, w:h 0.62, sits just under the slab). Items 1-12 below apply with these tolerances; in item 8 the stool is NOT removed any more (it must be present, no plastic); "stool gone" is withdrawn.
Compare each output to its original (EXIF-rotated) side by side, then as a 50% overlay registered on the dresser bounding box (scale+translate only).
1. Silhouette: overlay outline of tabletop, both pedestals and the navy wing matches; no bulge, shrink or lean.
2. Navy wing: same sweep (left side, across the back, right side), same height vs the pedestal tops; edge curve identical.
3. Drawers: 3 on the left pedestal, 3 on the right, 1 long centre drawer; same heights, same curved fronts and seams; no handles added.
4. Tops: two white round pedestal tops stand proud of the centre slab; slab thickness and edge unchanged.
5. Base: pedestals sit on the same inset base; kneehole stays open; same height from floor.
6. Mirror: same size, aspect (taller than wide), position (centred over the table), gap above the table; frameless, LED edge strip kept (warm white).
7. Colour (numeric, not by eye): sample the same patches (navy side, white drawer, white top) in original and output; navy hue within +-12 deg of the original (~218), white stays white; report hex+hue. Light may brighten, never retint.
8. Removed items gone: stool, floor debris, switch/socket on the wall, bits of plastic, person or camera in the mirror, blue light anywhere.
9. Nothing invented: no handles, legs, logos, text, extra pieces, props, plants.
10. Artifacts at 100% on edges, drawer seams, mirror edge; no warped lines; vertical lines vertical.
11. Light (Step B): one shaft only, lands on navy side + drawer fronts, shadows warm not black, no glow, no colour cast on the product.
12. Detail crops at 1080x1350: sharp, no AI mush on seams; if soft, re-run upscale with lower creativity.
Verdict per file: PASS / REJECT + which item. Record in this file's bottom line. Readiness stays NOT_READY until Ahmed approves.

## Gate 1 results 2026-10-07 (tool: `TSST/CREATIVE/tools/geometry_compare.py`; evidence in `products-rendered/_qa/`)
Gate 1 was run with the old rule (superseded by v2 above, +-10%; under v2 hero_A_v2 and detail-master_A_v3 pass the mirror check, hero_A_v2 piece +13% is 3 pts over): mirror w:h and whole-piece w:h within +-8% of the original; hue +-12 deg. Originals: 623 mirror 0.67, piece 0.60; 539 mirror 0.72, piece 0.65.
| File (source inferred from framing) | Mirror w:h | Piece w:h | Navy hue drift | Verdict |
|---|---|---|---|---|
| hero_A_v1 (623) | 0.75 (+12%) | 0.67 (+12%) | +0.0 | REJECT item 6, 1 |
| hero_A_v2 (623) | 0.72 (+7%) | 0.68 (+13%) | -0.8 | REJECT item 1 (closest) |
| hero_A_v3 (623) | 0.81 (+21%) | 0.70 (+17%) | +2.4 | REJECT item 6, 1 |
| detail-master_A_v1 (539) | 0.82 (+14%) | 0.72 (+10%) | -8.1 | REJECT item 6, 1 |
| detail-master_A_v2 (539) | 0.80 (+11%) | 0.71 (+9%) | -6.1 | REJECT item 6, 1 |
| detail-master_A_v3 (539) | 0.79 (+10%) | 0.70 (+8%) | -4.5 | REJECT item 6 (closest) |
Passed on all six: drawers 3+3+1 centre, no handles, pedestal tops above slab, wing sweep/wrap, inset base + open kneehole, LED warm white, reflection clean (no person/stool), no invented objects, no stool/debris/switch, hue.
Defect: camera yaw was flattened (right pedestal now as large as the left; original 623 right/left = 0.87), so the mirror and piece read wider/squarer. Result: none passes. Closest: hero v2, detail-master v3. Re-run A2 in RECIPES.md. Readiness NOT_READY.

## P1 gate results 2026-10-07 (P1_v1..v3, 1024x1536; v2 thresholds; targets from PRODUCT_CARD 3/4 view)
NOTE: the shell tool was unavailable (auto-mode classifier error), so these are visual px estimates (+-3%) from the opened images, NOT geometry_compare.py output; hue not measured. Verdicts are far outside tolerance, so they hold. Re-run the tool to confirm: `geometry_compare.py 623 P1_vN _qa/P1_vN`.
Structure (all 3): PASS 3+3+1 drawers, no handles/legs, tops proud of slab, plinth, wing wrap, frameless mirror (LED visible v1, faint v3, not seen v2), stool unwrapped. Extras (invented): split lift-lid seam on slab, box behind mirror left edge.
| Metric (target) | v1 | v2 | v3 |
|---|---|---|---|
| piece+mirror w:h (0.60) | 0.78 (+30%) | 0.84 (+40%) | 0.84 (+40%) |
| mirror w:h (0.67) | 0.78 (+16%) | 0.77 (+15%) | 0.80 (+19%) |
| piece alone w:h (1.17) | 1.70 (+45%) | 1.92 (+64%) | 1.87 (+60%) |
| right/left pedestal (0.87) | 0.83 (-5%) | 0.85 (-3%) | 0.80 (-8%) |
| stool w:h (0.62) | 0.69 (+11%) | 0.95 (+53%) | 0.98 (+58%) |
| stool/kneehole (0.60) | 0.81 (+35%) | 0.75 (+25%) | 0.80 (+33%) |
Lead verification (geometry_compare.py, auto-detected boxes): result bbox w:h 0.67 / 0.72 / 0.71 (v1/v2/v3) against 0.50 for 623 (+34% to +44%); navy hue drift -0.3 / -0.6 / 0.0 deg: hue PASS. REJECTs stand.
Camera: all near-frontal (v1 piece 1.70 is close to the FRONT ratio 1.76), higher and wider than 623. Verdict: all REJECT (proportions + camera, items 1, 6). Best: v1 (closest piece, stool). Re-run P1b in RECIPES.md. NOT_READY.

## P1-front gate results (round 2) 2026-10-07 (geometry_compare.py with explicit boxes; edges by gradient; outputs `_qa/P1f_vN/`; +-3 px)
Boxes (px, 1024x1536): piece = wing outer edges x wing top to plinth bottom; v1 38,725,987,1202; v2 33,755,990,1217; v3 30,767,994,1218. Mirror v1 253,194,771,719; v2 226,180,795,738; v3 285,214,740,755. Original 233621 piece 266,1567,1431,2244, mirror 495,844,1162,1563 (px of the 1836x3264 file).
Structure (all 3): PASS 3+3+1, no handles/legs, stool present unwrapped, no slab seam, no box behind mirror. Invented: v1 thin metal frame on mirror; v2 slot/dimple on pedestal tops; v3 gold seam lines and bright LED frame. Camera: front YES all (pedestal widths L/R 0.99, 1.00, 1.03; wing margins equal); Lead's "v1 3/4" not confirmed. Hue vs card 219: v1 216.2 (-2.8), v2 222.1 (+3.1), v3 218.9 (-0.1) PASS (tool drift -22/-17/-20 is vs the purple-LED original 238.7, not meaningful).
| Ratio (target) | v1 | v2 | v3 |
|---|---|---|---|
| piece w:h (1.76) | 1.99 +13% | 2.07 +18% | 2.14 +21% |
| mirror w:h (0.92) | 0.99 +7% | 1.02 +11% | 0.84 -9% |
| mirror w / piece w (0.57) | 0.55 -4% | 0.59 +4% | 0.47 -17% |
| mirror h / piece h (1.08) | 1.10 +2% | 1.21 +12% | 1.20 +11% |
| pedestal w / piece w (0.29) | 0.23 -20% | 0.23 -21% | 0.23 -22% |
| centre drawer w / piece w (0.45) | 0.48 +8% | 0.46 +2% | 0.49 +9% |
| kneehole h / piece h (0.65) | 0.65 +1% | 0.69 +7% | 0.69 +7% |
| stool w:h (0.62) | 0.71 +14% | 0.83 +33% | 0.84 +35% |
| stool w / kneehole w (0.60) | 0.47 -21% | 0.57 -5% | 0.53 -12% |
| stool h / pedestal h (0.68) | 0.68 0% | 0.68 0% | 0.68 0% |
Verdict: v1 REJECT (4 ratios out: piece, pedestal, stool w:h, stool/kneehole), v2 REJECT (5), v3 REJECT (6). No file within one ratio. Common root: pedestals 0.23 not 0.29, which makes the piece 13-21% too wide. Best = v1. All renamed `_REJECT`. Round 3 (LAST) in RECIPES.md. NOT_READY.

## OWNER ACCEPTANCE 2026-10-07 (Lead record)
Ahmed reviewed P1f_v1 side by side with 233621 and APPROVED it ("راجعت وتمام موافق") under the 95% hyper-real-render standard. The numeric REJECT is overridden by the owner. File: `dresser-01_P1f_v1_APPROVED.png`. Product stage CLOSED after round 2 of 3.
Known differences, accepted: pedestals rendered as straight cylinders, while the real ones look tapered (wider at top) with curved drawer seams; pedestals about 20% narrower; stool slightly wider; the mirror has a lit edge frame where the real one has a halo behind.
QA ERROR 2026-10-07: the slab seam was real; it was judged "invented" from 3/4 views where the top was not visible.
Lesson: the product card had numbers but missed the signature FORM (taper and curved seams). Capture silhouette first, and get the owner to confirm the card before round 1.

## Studio gate v1 (P3 files; run on each; any product change = REJECT; round cap 3 per stage)
Reference = `dresser-01_P1f_v1_APPROVED.png`. Tool: `geometry_compare.py` with explicit boxes, plus side-by-side and 50% overlay (scale+translate only).
1. Product drift: structure exact (3+3+1 drawers, no handles/legs, stool unwrapped, mirror as approved); navy hue within +-12 deg of the reference (report hex+hue); visible proportions unchanged by eye AND by the tool (use the approved render's own ratios as target, not the card; the known accepted differences stay). Camera still dead front.
2. Set: seamless cove (floor curves into backdrop), no corner line, skirting or horizon; cream sampled near #EFE6D6 in the lit-free area (report hex); no props, text or people.
3. Light: ONE hard-edged shaft only, edges visible on floor and backdrop, lands on the navy wing and drawer fronts (brightest parts); no glow, haze, flare, leaf pattern; shadows warm, soft, grounded under pedestals and stool, not black; no colour cast on the product.
4. 4:5 crop test: centred 1080x1350 crop (from 1024x1536 scale to fit width, crop height) keeps the whole piece, mirror top and stool with margins on all sides; note any clipping.
5. Phone-size check: view at 360 px wide; piece, shaft and navy/white contrast still read; no mush on seams.
Verdict per file: PASS / REJECT + which item. Readiness stays NOT_READY until Ahmed approves (owner acceptance may override numbers; record the known differences).

## Studio gate v2 (P3r2 files; reference = ORIGINAL 233621 via blueprint, not P1f_v1)
Method: scale+translate `blueprint_front.png` (or overlay the result on 233621 crop) onto each result; lines must sit on the edges.
1. Five signature features, ZERO tolerance (any miss = REJECT): 3-panel slab top; drawers on outer part only with curved vertical seam and slanted seams (3 per pedestal); tapered pedestals; dark-rim glass top; warm-white LED ring at each base.
2. Also zero tolerance: frameless mirror (warm-white halo, no lit frame); stool tall narrow navy drum, unwrapped; no handles/legs/props/people/text.
3. Proportions within +-10% of the blueprint: piece w:h, mirror w:h 0.93, pedestal widths (0.24 base / 0.31 top of piece w), centre drawer 0.45, stool w:h 0.65; camera as blueprint (front, slightly top-down). Navy hue 219 +-12.
4. Set: cream cove, no corner/horizon line; lit-free cream near #EFE6D6.
5. Light: ONE hard warm shaft from upper left landing on left-pedestal drawer fronts + navy wing = brightest area; rest falls off; no other shafts on wall/floor; LED ring and halo warm white and subtle.
6. 4:5 crop (1080x1350) keeps piece + mirror top + stool with margin; phone check at 360 px. Verdict per file PASS/REJECT + item; cap 3 rounds, then owner decides. NOT_READY until Ahmed approves.

- Studio round 2: REJECT — blueprint ignored; generation regresses to a generic archetype. (P3r2 v1-v3 renamed _REJECT, 2026-10-07)
