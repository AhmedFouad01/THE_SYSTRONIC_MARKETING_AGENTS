# ROLLUP_SPEC · Premium Pre-Hell roll-up 80x200 cm · one-round production
Status: PREVIS/spec (SK-013/014/019). Nothing rendered. Readiness NOT_READY. Exception (fire/glow allowed) = this job only, see project.md.

## 1. Layout (cm, origin top-left, 80 wide x 200 tall)
| zone | x | y | notes |
|---|---|---|---|
| Top bar safe | 0-80 | 0-6 | background only, no logo/detail (clip hides it) |
| Beam (horizontal, concrete) | 4-76 | 8-32 | face blank/flat for logo; lit from below by orange |
| Logo on beam | 16-64 | 9.4-30.7 | 48 w x 21.3 h (mark ratio 587:260); centred; composited |
| Pillars (2) | L 4-20, R 60-76 | 32-140 | 16 cm wide, concrete, bases at y~140 |
| Energy zone (tub to beam) | 24-56 | 32-76 | 3-5 arcs from tub lid to beam underside |
| Main tub (real cutout) | 23-57 | 76-114 | 34 w x 38 h, centred x=40, hovering between pillars |
| Chains | pillar sides to tub | y 70-100 | 2 chains per side anchored to pillars, 1 across tub front |
| Ground plane | 0-80 | 124-200 | continues to bottom edge |
| Back-row cells (4, real tubs) | centres x=13, 29, 51, 67 | feet y=142 | 12 w x 14 h each |
| Front-row cells (3, real tubs) | centres x=20, 40, 60 | feet y=159 | 15 w x 17 h each |
| Text block | 8-72 | 163-177 | tagline y 163-166.5, URL y 169-177 |
| Roll-up base safe | 0-80 | 178-200 | background/ground only, NOTHING important (confirm 22 cm with printer/cassette) |

Energy paths: ground conduits from each of the 7 cells to the nearest pillar base, then up the pillar faces to the beam. Hierarchy: logo (top) > main tub (centre) > ANVIL-SUPPS.COM > cells.

## 2. Print resolution
Viewed at 1-3 m. Target 100 dpi = 3150 x 7874 px (800 x 2000 mm). Stretch 150 dpi = 4724 x 11811 px if file size allows. Raster layers never below 100 dpi at final size; logo stays vector. Tubs: main tub needs a source >= 1500 px tall (38 cm at 100 dpi), cells >= 800 px tall. Below that, ask owner for better packshots (never AI re-render).

## 3. Magnific plate plan (plate = background + structure only)
Reference uploads: ref-headshot.webp (pillars + chains idea ONLY; ignore its label, tub, fog, figure), ref-go.webp (crisp sharpness, warm orange/yellow glow). No tubs, no logo, no text in the plate.
Aspect: 2:5 (0.4) if offered; else 1:2 or 9:21, then outpaint vertically to 2:5. Ground continues to the bottom edge. 2 variants, same prompt, different energy styling.

PROMPT (variant A, base):
"Vertical ultra-sharp photographic composite, sci-fi industrial monument. Two massive weathered concrete pillars stand left and right, joined at the top by a thick horizontal concrete beam with a perfectly flat, blank, empty smooth face (no markings, no text, no logo). Heavy steel chains hang and tension from the pillar sides toward the empty centre space between the pillars, ending in open steel anchor rings; the centre space between the pillars is empty, dark and clear for a product. Seven empty circular steel power-cell pads on a dark polished concrete ground in two rows (four behind, three in front), each pad with a glowing orange conduit line running across the ground to the pillar bases and up the pillar faces to the beam. Crisp warm orange and yellow rim light, controlled glowing orange energy veins, small bright sparks and a few embers, strong clean contrast, deep charcoal and black background with concrete grey and ANVIL orange (#FF6A00) accents, hard crisp edges, dry clean air, premium product-advertising photography, tack-sharp, 8k detail."

Variant B: base + "orange energy arcs rising from the empty centre space up to the underside of the beam, subtle controlled flames licking only the pillar tops and beam ends".

NEGATIVE: "fog, haze, mist, smoke clouds, atmospheric perspective, muddy, dull, desaturated, low contrast, blur, soft focus, noise, text, letters, logo, watermark, brand names, people, figure, product, tub, can, bottle, packaging, skull, red-black horror mood, lightning bolts in sky, floating rocks, extra objects, extra pillars, mountains, cartoon, illustration, warped geometry".

Upscale route: pick 1 variant, Magnific upscale to ~3150 px wide (about 3x), Creativity low, HDR low, Resemblance high; optional 2nd pass 1.5x to 4724 px. Check the beam face and pad spots stayed blank; reject and re-run if any glyph or texture appears. Invariant tail on every recipe: "do not change geometry, materials, built elements; no text/logo/people; keep ratio".

## 4. Compositing plan (layered per SK-019)
Layers: 01_plate, 02_energy_back, 03_cells, 04_main_tub, 05_chains_front, 06_energy_front, 07_logo, 08_text; plus layers.json, contact sheet, phone preview.
- Cutouts: real packshots, non-destructive masks, edges refined at 100%, defringe halos. Never regenerate label or logo; only light/colour grade on top.
- Perspective: tubs match the plate camera (slight low angle); front row larger, back row smaller (sizes in section 1); feet on pad centres.
- Contact shadows and polished-ground reflection under each cell; ambient occlusion; orange bounce light on tub sides from conduits; pad glow at tub base.
- Light wrap: orange rim onto tub edges; keep label legible (no glow over label text).
- Main tub: between pillars; chains pass IN FRONT of the tub (chain mask over tub body, one chain across the front, chain shadow on tub); chains attach to plate anchor rings; bright energy contact point at the lid.
- Energy lines: built by hand (shape + glow layers, orange to yellow core) from each cell to pillar base, up the pillars to the beam, plus arcs from tub lid to beam underside. Lines start at the tub or cell, never float. No fog layers.
- Logo: official vector mark placed flat on the beam face; only outer effects (subtle inner shadow, orange underglow); geometry untouched; white (reverse) or black version chosen by contrast on the beam face.
- Grade: unify black point, warm highlights, local contrast; output sharpen.

## 5. Text and type
- Line 1 (hero): ANVIL-SUPPS.COM. Inter SemiBold caps (production substitute; Monument Extended not installed), ~5 cm size, tracking +40, #FFFFFF with a thin #FF6A00 bar below, centred x=40, y 169-177.
- Line 2: AUTHORIZED DISTRIBUTOR · PREMIUM PRE-HELL. Inter SemiBold caps, ~2.0 cm size, tracking +80, #D9D9D4, width <= 64 cm, y 163-166.5.
- Dark gradient under the block if the plate is bright. EN only; no price, claims or phone. Wording to be confirmed against the distributor agreement. Check font licence before sending editable files out.

## 6. Export
- Master: layered PSD. Final: CMYK PDF 800 x 2000 mm, 1 page, images 100-150 dpi, fonts outlined, ICC embedded (FOGRA39 until the printer says otherwise). Name: anvil_rollup-pre-hell_800x2000_v01.pdf.
- Bleed: SAME AS SAMPLE (sample has none). Build the master with 20 mm extra per side so a bleed version is a re-export, not a rebuild.
- FLAG, confirm with printer: bleed (often 3-5 cm), cassette height/safe zone, required dpi, ICC/CMYK profile, ink limit, PDF/X standard, matte vs gloss. ANVIL orange #FF6A00 and glow gradients shift in CMYK: soft-proof and request a proof.
- Also export a 1600 px RGB preview PNG for owner approval (label PRODUCTION_DRAFT until QA passes).

## 7. QA checklist (FINAL_ASSET_GATE)
- [ ] real PDF at 800 x 2000 mm, 1 page, CMYK; px/dpi per section 2
- [ ] official logo geometry untouched (side by side with source); tubs are real packshots, labels undistorted
- [ ] focal point works at thumbnail scale and at 2-3 m (print a 1:10 sheet, 3 m eye test)
- [ ] masks/edges/halos clean at 100%; contact shadows, light direction, perspective consistent; chains over main tub
- [ ] energy lines connect cells to structure; no fog/haze/mud; no stray objects or plate artifacts
- [ ] text spelled exactly, aligned, legible; nothing important in top 6 cm or bottom 22 cm
- [ ] CMYK soft-proof reviewed (orange, glows); no banding on gradients
- [ ] rights: tub images as distributor (owner confirms), font licence, AI-plate provenance noted; fire exception recorded
- [ ] CREATIVE_AG visually inspected the actual render; owner approval before print
