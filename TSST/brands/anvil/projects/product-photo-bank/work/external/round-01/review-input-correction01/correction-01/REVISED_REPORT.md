# ANVIL — ROLE B / Round 01: PhotoBank Sorting Report (Revised Post-Audit)

**ROLE**: EXTERNAL TOOL (Antigravity IDE manual bridge via Ahmed)  
**EXECUTION DATE**: 2026-10-12  
**STATUS**: Intake Checkpoint Complete — Awaiting TSST Lead Review  
**BUDGET**: 0 paid API calls, 0 white-background generations, 0 model downloads, 0 network requests. Local cached CLIP (`ViT-L-14` "openai" on CUDA) only in offline mode (`HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`).

---

## 1. Executive Summary & Granular Metric Accounting

A total of **95 source JPG images** from the read-only intake directory (`assets/Anvil products`) were audited at full resolution, classified under the native `supplements` profile, mapped into verified folder hierarchies, copied into the bank, and cataloged.

In accordance with the Round 01 correction mandate, the previous conflated metric ("95 verified variants") has been disassembled into distinct, empirically verified categories:

### Granular Metric Breakdown
$$\text{Total Source Images (95)} = \text{Verified Distinct Variants (85)} + \text{Unresolved Packaging Candidates (7)} + \text{Multi-Item Displays (3)}$$

| Metric Category | Count | Verification & Governance Details |
|---|---|---|
| **Total Source Images Ingested** | 95 | Exactly 95 JPG files in `Anvil products` (+ 1 `desktop.ini` ignored). |
| **Unique Source SHA-256 Hashes** | 95 | Zero duplicate image files; all 95 images have unique content. |
| **Source Byte-Identical Integrity** | 95 / 95 | Verified byte-identical against original intake hashes; 0 modified, 0 deleted. |
| **Verified Identity Count** | 95 | 100% of images resolved to authoritative printed brand, product, and format. |
| **Verified Distinct Products/Variants** | 85 | Distinct formulation, flavor, or pack size products across all brands. |
| **Unresolved Packaging Alternative Candidates** | 7 | SP Premium Creatine 500g Unflavored across 7 packaging colors (purple, blue, yellow, orange, black/silver, cream/white, red). Identical printed formulation and facts; preserved as distinct packaging variants pending brand direction. |
| **Multi-Item Display Images** | 3 | Physical retail displays containing multiple observed items: 4 MET-Rx shakers (`17-31`), 7 ON shakers (`17-31 2`), and 4 Sportium shakers (`17-31 4`). Logged as observed counts, not invented multi-pack sale bundles. |
| **Single Accessory Merchandise Items** | 3 | Single merchandise items: 1 MuscleTech shaker (`17-32`), 1 Shark duffle bag (`17-32 2`), and 1 Under Armour duffle bag (`17-33`). |
| **Active Primary Bank Folders** | 95 | 95 active primary destination folders under `bank/`. |
| **Active Primary Destinations Integrity** | 95 / 95 | Every mapped destination exists in `bank/`; destination SHA-256 matches source SHA-256 1:1. |
| **Near-Twin Hidden Cards in Gallery** | 0 | 0 cards collapsed or hidden; all 95 primary assets render in `BANK.html`. |
| **Preserved Prior-Run Bank Copies** | 52 | Earlier bank copies preserved under `bank/` per governance rules; reconciled separately from active primaries. |

---

## 2. Profile Vocabulary & Native Taxonomy Alignment

All assets were tagged and cataloged using the native `supplements` profile (`TSST/CREATIVE/tools/photo-bank/profiles/supplements.yaml`):

### 2.1 Native Space & Stage Tags
- **`studio_packshot` (18 assets)**: Clean white-isolated e-commerce render assets (G001: 13 TVN Beyond Elite protein bar boxes; G002: 1 EN Citrulline tub, 3 EN Crea-Power tubs; G003: 1 Farah Secrets mass gainer tub). Classified as `finished_goods`.
- **`retail_shelf` (77 assets)**: Physical brick-and-mortar retail store display photographs on store shelves. Classified as `finished_goods`.

### 2.2 Native Piece Tags (from `supplements.yaml`)
Zero-shot CLIP embeddings classified assets into native piece categories:
- **`tub`**: Supplement protein powder tubs, pre-workout tubs, creatine jars (e.g., Novogen, Nutrex, Kevin Levrone, Superior 14, Tractor).
- **`protein bar` / `box`**: Multi-pack display boxes (TVN Beyond Elite 16-bar boxes).
- **`shaker`**: Gym shaker bottles and mixing cups (MET-Rx, Optimum Nutrition, Sportium, MuscleTech).
- **`gym bag` / `accessories`**: Athletic merchandise bags (Shark, Under Armour).
- **`tablet bottle` / `capsule bottle`**: Amino acid tablet containers and fat burner capsule bottles (Nutriversum, Big Ramy Labs Red Rex, Cloma Pharma, Nutrex Lipo-6).
- **`label close-up`**: Tight macro shots and nutritional fact panels on retail displays.

---

## 3. Contact Sheet Audit & Cluster Evidence

Contact sheets generated during initial grouping (`bank/_work/sheets/`) were audited against full-resolution source files. Image index permutations were completely eliminated:

| Sheet / Cluster | Filenames (Prefix: `PHOTO-2026-10-04-01-`) | Count | Verified Content & Discovered Permutations |
|---|---|---|---|
| **`G001_sheet.jpg`** | `14-33` to `14-35 3` | 13 | **TVN Beyond Elite Protein Bar 16-Packs**: Full permutation resolved across all 13 flavors (Caramel, Pistachio White Choc, Cheesecake Strawberry, Chunky Choc, Mochashot Cookies, Vanilla Biscuits, Dark Choc Cookies & Cream, Strawberry, Vanilla Ice Cream, Hazelnut, Peanut Butter, Cookies N Cream White Choc, Birthday Cake). |
| **`G002_sheet.jpg`** | `16-57 2`, `17-21`, `17-22`, `17-22 2`, `17-22 3` | 5 | **EN Sports Nutrition & Pureganic**: EN L-Citrulline 150g verified as Orange Flavour; EN Crea-Power sizes corrected (`17-22` = 400g, `17-22 2` = 250g, `17-22 3` = 150g); Pureganic Creatine 500g verified. |
| **`G003_sheet.jpg`** | `16-53 2` | 1 | **Farah Secrets**: Gainsecret 5kg Chocolate (studio packshot render). |
| **`G004_sheet.jpg`** | `16-54 2`, `16-55 3`, `16-56 2` | 3 | **Mass Gainers**: Farah Secrets Gainsecret 5kg Chocolate, Novogen Mass Gainer 5.4kg Double Chocolate, TVN The Gainer 5kg Chocolate. |
| **`G005_sheet.jpg`** | `16-56`, `16-56 3` | 2 | **TVN Powders**: Corrected inverted labels (`16-56` = TVN 100% Pure Creatine Monohydrate 300g; `16-56 3` = TVN Carbofit Complex Carbs 1.5kg Tropical Fruits). |
| **`G006_sheet.jpg`** | `16-57` | 1 | **TVN Specialty Nutrition**: TVN Cream of Rice 500g verified as Cinnamon flavor from label text. |
| **`G007_sheet.jpg`** | `17-02`, `17-25` | 2 | **Amino Acid Tablets**: Big Ramy Labs Red Rex Beef Aminos 300 tabs; Nutriversum Amino Tablet 641g (350 tabs) Orange Flavor. |
| **`G008_sheet.jpg`** | `17-00`, `17-10 2`, `17-11`, `17-12 4` | 4 | **Ultimate Nutrition Powders**: Carbo Release 2kg Orange; Furiux Mass 3kg Vanilla (`17-10 2`) and Strawberry (`17-11`) corrected; Ultimate Whey 2kg Chocolate. |
| **`G009_sheet.jpg`** | `17-02 2`, `17-08`, `17-09`, `17-09 2`, `17-09 3` | 5 | **Pre-Workouts**: SP Pre-Hell 30serv (Moonster Energy, Pink Lemonade, Sour Strips, Tequille); Redcon1 Total War 435g Primetime Punch. |
| **`G010_sheet.jpg`** | `17-13`, `17-13 2` | 2 | **Nutrex Fat Burners**: Lipo-6 Hers Ultra Concentrate 60 Caps (`17-13`) and Lipo-6 Black Ultra Concentrate 60 Caps (`17-13 2`). |
| **`G011_sheet.jpg`** | `17-14`, `17-23`, `17-23 2`, `17-23 3`, `17-24`, `17-24 2`, `17-31 3` | 7 | **Tractor Brand Complete Permutation Fix**: Crea Red 180g (`17-14`), Creatine 480g (`17-23`), Creatine 120g (`17-23 2`), Creatine 240g (`17-23 3`), Beta Alanine 120g (`17-24`), Citrulline Malate Blueberry 130g (`17-24 2`), Carb Lemon Mint 2250g (`17-31 3`). |
| **`G012_sheet.jpg`** | `17-16 2` | 1 | **Nutrex Protein**: Isofit 969g Vanilla Bean Ice Cream. |
| **`G013_sheet.jpg`** | `17-17`, `17-17 2`, `17-19`, `17-19 2` | 4 | **Take It Send It Unified Architecture**: Spooky EAA+BCAA 300g (`17-17`), Grap'N'Go Whey 245g (`17-17 2`), Signature Creatine CGT 400g (`17-19`), Signature Mad Fuelgen V2 660g (`17-19 2`). |
| **`G014_sheet.jpg`** | `17-20` | 1 | **Cloma Pharma**: Black Spider 25 Ephedra 100 Caps. |
| **`G015_sheet.jpg`** | `17-31`, `17-31 2`, `17-31 4`, `17-32`, `17-32 2`, `17-33` | 6 | **Accessories & Displays**: 4 MET-Rx shakers (`17-31`), 7 ON shakers (`17-31 2`), 4 Sportium shakers (`17-31 4`), 1 MT shaker (`17-32`), 1 Shark bag (`17-32 2`), 1 Under Armour bag (`17-33`). |

---

## 4. Evidence Discipline & Claims Rigor

Every non-unknown field across all 95 items was re-audited and documented in [FIELD_EVIDENCE.csv](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/FIELD_EVIDENCE.csv) (1,045 total rows):

1. **Strict Tri-State Evidence Classification**:
   - `VERIFIED_VISIBLE`: Verifiable text is directly readable in the source image. Location on container (front label banner, neck band, nutrition panel) and literal quotes are recorded.
   - `UNVERIFIED_NOT_VISIBLE`: Information is absent from camera view (e.g. rear nutrition table on front shelf shot). No external inference or web filling permitted.
   - `N/A`: Property is inapplicable to the product type (e.g. flavor on shaker bottles, tablet counts on drink powders).
2. **Stripping of Unsupported Claims**:
   - Removed unverified benefit claims (e.g., muscle recovery on TVN bars, nitric oxide blood flow on EN Citrulline) where not printed on the visible packaging facing the lens.
3. **Serving Size Integrity**:
   - Zero serving sizes calculated from net weight divided by serving count. Only explicitly printed manufacturer serving sizes (e.g., "1 scoop (5g)", "1 bar (65g)") are accepted as verified.

---

## 5. Twin Group & Visual Browser Audit

The native PhotoBank cataloging engine executed its near-twin take detection pass (`bank/_catalog/twin_groups.json`):
- **Criterion**: Same destination folder, timestamp difference $\le 120$ seconds, CLIP cosine similarity $\ge 0.93$.
- **Result**:
  - **Total pairs detected**: `0`
  - **Total twin groups**: `0`
  - **Total hidden cards**: `0`
- **Visual Browser Verification**:
  - [bank/BANK.html](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/bank/BANK.html) displays all **95 primary asset cards** without any collapsed duplicates or hidden variants.
  - Every verified product and packaging variant has an independent, fully interactive card with metadata filters, pixel stats, and full-resolution zoom.

---

## 6. Bank File Reconciliation & Integrity Verification

The reconciliation audit script (`correction-01/scripts/verify_bank_integrity.py`) confirmed:
- **Total active primaries**: 95 files matching intake hashes byte-for-byte.
- **Preserved historical copies**: 52 files from the initial sorting pass are preserved in historical paths under `bank/` as governance evidence.
- **Deleted or modified source files**: 0.

Full audit results are persisted in [correction-01/bank_integrity_audit.json](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/correction-01/bank_integrity_audit.json).

---

## 7. Authoritative Deliverable Links

All deliverable artifacts are strictly bounded within the round-01 directory:
`G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/`

- **Correction Change Log**: [correction-01/CORRECTION_LOG.md](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/correction-01/CORRECTION_LOG.md)
- **Old to New Mapping**: [correction-01/old_to_new_mapping.json](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/correction-01/old_to_new_mapping.json)
- **Products Catalog**: [PRODUCTS.csv](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/PRODUCTS.csv)
- **Source Manifest**: [SOURCE_MANIFEST.csv](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/SOURCE_MANIFEST.csv)
- **Field Evidence**: [FIELD_EVIDENCE.csv](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/FIELD_EVIDENCE.csv)
- **Labels Configuration**: [labels.json](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/labels.json)
- **Native Bank Index**: [bank/INDEX.md](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/bank/INDEX.md)
- **Native Bank Catalog**: [bank/CATALOG.csv](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/bank/CATALOG.csv)
- **Visual Browser (Offline Gallery)**: [bank/BANK.html](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/bank/BANK.html)
- **Studio Picks**: [bank/STUDIO_PICKS.md](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/bank/STUDIO_PICKS.md)

---

Awaiting Ahmed/TSST Lead review. White-background production and delivery have not started.
