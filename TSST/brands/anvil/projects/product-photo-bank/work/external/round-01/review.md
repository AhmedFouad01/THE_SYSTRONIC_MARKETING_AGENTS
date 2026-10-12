# Round 01 review — corrections required

Date: 2026-10-12. CREATIVE_AG / SK-019 pipeline QA and SK-013 product truth. NOT_READY. Sorting infrastructure ran; product taxonomy and metadata are not accepted for white-background production.

## Evidence and limits

Visually inspected ALL 15 contact sheets G001–G015 (95 thumbnails) and compared cluster file order to PRODUCTS rows. Opened 16 exact canonical source images at full resolution to confirm the contradictions below and inspect the TVN Gainer background. Sheet cells follow `clusters.json` file order (`group.py` enumerates `group_info["files"]`); the truncated captions must not be used as filename identification. Full-size source evidence confirms the errors independently of sheet order.

Lead independently verified all 95 current source/destination hashes against the manifest; execution logs show 95 embeddings and catalog rows, zero twin groups. Reader checked complete row/file/label sets and found 32 listed brands. These establish file accounting, not identity correctness. QuickGELU model warning was noted by Lead; no model change/re-embedding requested. This reviewer ran no CLIP, sort, catalog or production.

## Confirmed full-source contradictions

All filenames below have prefix `PHOTO-2026-10-04-01-` and suffix `.jpg`, under the canonical `Anvil products` source folder. Values in the observed column are printed/visible facts, not medical advice or inferred serving sizes.

| Filename stem | Submitted association | Full-source observation |
|---|---|---|
| 17-17 | Grap'N'Go Whey 245g; servings unknown | Red SPOOKY EAA+BCAA; TAKE/SEND-style branding; **300g, 40 servings** |
| 17-17 2 | Spooky EAA+BCAA 300g; servings unknown | White GRAP'N'GO WHEY PROTEIN, TAKE IT SEND IT branding; **245g, 07 servings** |
| 17-19 | Mad Fuelgen 660g; servings unknown | White/black TAKE IT SEND IT **CREATINE CGT, 400g, 80 servings** |
| 17-19 2 | CGT Creatine 400g; servings unknown | White/green TAKE IT SEND IT **MAD FUELGEN V2, 660g, 20 servings** |
| 17-24 | Creatine 480g /160 servings | **Beta Alanine, 120 GM, 40 servings**, unflavored |
| 17-23 3 | Beta Alanine; size unknown /40 servings | **Creatine, 240 GM, 80 servings**, unflavored |
| 17-24 2 | Creatine 120g /40 servings | **Citrulline Malate, 130 GM, 40 servings, Blueberry** |
| 17-23 | Citrulline Malate 130g /40 servings | **Creatine, 480 GM, 160 servings**, unflavored |
| 17-23 2 | Creatine 240g /80 servings | **Creatine, 120 GM, 40 servings**, unflavored |
| 17-31 | Optimum Nutrition single shaker | **Four MET-Rx shakers**, different colors |
| 17-31 2 | MET-Rx single shaker | **Seven ON-branded shakers**, different color combinations |
| 17-31 4 | Under Armour duffle | **Four SPORTSIUM-printed shakers**, different colors |
| 17-33 | Sportium 3-pack | **UNDER ARMOUR-printed bag** |

Thus **at least 13 of 95 source associations are demonstrably wrong**. The reviewed MuscleTech shaker (17-32) and SHARK SUPPLEMENTS-printed bag (17-32 2) match their broad submitted identities. Printed marks do not authenticate brand provenance or prove an authorized bundle. The four/seven objects above are observed image counts, not sale pack sizes. Capacities, leak-proof/heavy-duty attributes and actual bundle status require independent visible/supplied evidence.

These swaps affect labels/folder taxonomy, manifest destination identity, PRODUCTS and FIELD_EVIDENCE together. A successful byte-copy hash does not fix a wrong destination's meaning. G013 also treats product names (Grap'N'Go, Mad, CGT) as separate brands despite common TAKE IT SEND IT branding; re-evaluate brand versus product-line fields without inventing manufacturer provenance.

## Claims and variant confidence

- Submitted TVN protein-bar `goal_tags=muscle building; recovery` are marked verified/high, but supporting text only lists protein/sugar/box/flavor facts. Those snippets do not substantiate the goals. EN Citrulline `pump; blood flow; endurance` likewise has only an identity/weight snippet. Remove unsupported tags or mark unknown/unverified; this review does not assert the products lack those effects.
- FIELD_EVIDENCE reuses one snippet across unrelated fields; source paths and `high` labels are insufficient. Reader found 210 unverified evidence rows still assigned high confidence. Require field-specific readings and distinguish confident absence from confident extracted value.
- Full-source `16-56 2` (TVN The Gainer) clearly states **CHOCOLATE FLAVOR**, but PRODUCTS records flavor `unknown`. Its white isolation has very narrow margins/tight framing, so it still needs production-readiness QA.
- Reader found unknown pack size in 8 products, serving count in 33, serving size in 45 and suggested use in 94, while all 95 product rows are marked verified. Missing optional text need not invalidate identity, but the report's blanket verification must disclose field completeness and confirmed identity mismatches.
- Seven SP Premium Creatine records have the same listed product/formulation/flavor/500g/servings, separated by packaging color. Different packaging may represent different variants, but SKU uniqueness is unproven. Preserve all images and record packaging-color differences separately; verify flavor/formula/size before merging or declaring distinct SKUs.
- **95 images does not establish 95 unique verified variants.** Three accessory photos contain 7 ON, 4 MET-Rx and 4 SPORTSIUM objects respectively. A multi-item display is not automatically a bundle or one SKU. Source-photo count, observed items, verified variants and unresolved identity groups require separate metrics. Final unique-variant count remains unresolved.
- REPORT's claimed native tags `bottle/bar`, `foil_wrap`, etc. do not match the audited supplements profile vocabulary (tub/scoop/shaker/label close-up/lifestyle/gym; material names use spaces). Correct the description to actual generated values. Native filter existence is not proven by prose.

## Source background and production implications

At contact-sheet scale, **18/95 appear already isolated on white**: G001's 13 TVN boxes, G004's TVN Gainer, both G005 tubs, G006 Cream of Rice and G007 Beef Aminos. **77/95 show retail/shelf/hand/other surroundings**. These are visual intake classes, not pixel-level white-background acceptance; inspect full sources before deciding which need work.

Retail photographs have hands/occlusion, tilt, glare, plastic wrapping, small/curved label text and occasional camera/time watermarks; accessory displays contain multiple items. Removing wrappers or reconstructing hidden printing would require separate approved handling and product-truth QA. Already-white assets should be preserved and assessed before unnecessary regeneration. No white-background outputs have been produced or accepted here.

## Acceptance decision for Lead

Accept file-integrity/accounting evidence provisionally as independently checked by Lead. Return taxonomy/field verification for correction. Require a complete 95-image association re-audit, not only repairs to these 13 examples, because permutations occur across three clusters. Keep all original images, embeddings and execution evidence. No production or delivery until corrected associations and unknowns are reviewed.
