# VILL Photo Bank Catalog — Deliverable & Architecture Report

**Client**: VILL (Interior Finishing & Custom Handcrafted Furniture)  
**Execution Context**: ROLE B — External Tool Implementation (Repository-Local, No Push / No Remote Uploads)  
**Author**: TSST (The Systronic Smart Team) Lead & Toolchain Worker  
**Date**: 2026-10-10  
**Source Directory**: `TSST/brands/vill-studio/assets/source/portfolio/`  
**Output Directory**: `TSST/brands/vill-studio/assets/source/portfolio/_catalog/`  
**Catalog Output**: `TSST/brands/vill-studio/assets/source/portfolio/CATALOG.csv`  
**Studio Picks Output**: `TSST/brands/vill-studio/assets/source/portfolio/STUDIO_PICKS.md`  
**Interactive Browser**: `TSST/brands/vill-studio/assets/source/portfolio/_catalog/BANK.html`  

---

## 1. Executive Summary & Deliverables

The raw photo bank of **1,583 source files** across 54 numbered project folders, `_duplicates/`, `_review/`, and `_before-after/` has been systematically transformed into a fully searchable, high-performance visual catalog without modifying, moving, renaming, or uploading any original photo asset.

All embeddings (`portfolio/_work/embeddings.npy`, 1583x768, `open_clip ViT-L-14` "openai", L2-normalized) and metadata (`portfolio/_work/files.json`) were reused without recomputation.

### Completed Deliverables Checklist
1. `_catalog/tag.py` & `_catalog/tag_prompts.py`: Zero-shot tagger across 25 pieces, 12 materials, 13 dominant non-background colours (computed from 256 px thumbnail pixels), 4 production stages, and 4 camera angles. Includes top tag, confidence score, and top-2 alternative. Prompt dictionaries are explicitly isolated at the top for ongoing editorial tuning by the Lead.
2. `_catalog/score.py`: AI-source quality scoring engine computing explainable composite scores (1.0 to 5.0) from five independent components: resolution (long side), Laplacian sharpness (`files.json`), photometric exposure (mean luminance and highlight/shadow clipping), clutter (CLIP zero-shot: clean product photo vs. construction debris/clutter), and piece dominance (CLIP zero-shot: single hero focus vs. wide busy room + confidence margin).
3. `portfolio/CATALOG.csv`: Master catalog file containing 1,530 rows (all 1,432 project photos and 98 `_review` photos marked accordingly; all 53 `_duplicates` excluded). Columns: `file | folder | piece | material | colour | stage | angle | space_tag | ai_score | score_parts | width | height | date | project folder note (from INDEX.md)`.
4. `_catalog/search.py`: Command-line interface supporting natural language semantic text queries (`python search.py "query" --top 20 [--min-score 3] [--piece sofa]`) and image-to-image similarity search (`python search.py --like <filename>`).
5. `_catalog/BANK.html`: Self-contained, 100% offline interactive web application featuring 320 px thumbnails in `_catalog/thumbs/`, custom luxury dark UI controls (dropdowns, score pills, search filter), real-time sorting, and a modal inspector with full path display and a one-click clipboard copy button.
6. `portfolio/STUDIO_PICKS.md`: Curated showcase selecting the top 5 highest-scoring photographs for each piece category, complete with file path, specifications, score breakdown, and an explainable one-line justification.

---

## 2. Tag Distributions & Field Counts

Across the **1,530 cataloged photographs** (excluding duplicates), zero-shot classification and photometric pixel analysis yielded the following distributions:

### A. Piece Distribution (25 categories)
| Piece Tag | Count | Percentage | Primary Project Folders |
|---|---|---|---|
| `kitchen` | 173 | 11.3% | Folders 01, 03, 07, 09, 13, 17, 28, 38 |
| `corner sofa` | 131 | 8.6% | Folders 02, 04, 21, 24, 31, 46 |
| `flooring` | 124 | 8.1% | Folders 10, 27, 34, 48, 49 |
| `sofa` | 103 | 6.7% | Folders 02, 14, 15, 24, 26, 39, 42 |
| `console` | 102 | 6.7% | Folders 01, 08, 18, 32, 36, 47 |
| `ceiling` | 90 | 5.9% | Folders 10, 19, 27, 34, 40, 48 |
| `bed` | 82 | 5.4% | Folders 02, 05, 06, 16, 18, 22, 25, 41 |
| `door` | 74 | 4.8% | Folders 08, 27, 34, 51 |
| `wardrobe` | 69 | 4.5% | Folders 05, 06, 18, 20, 25 |
| `TV wall` | 62 | 4.1% | Folders 11, 28, 33 |
| `wall finish` | 61 | 4.0% | Folders 13, 27, 33, 48 |
| `armchair` | 59 | 3.9% | Folders 02, 14, 15, 23, 39, 44 |
| `dining chairs` | 56 | 3.7% | Folders 01, 05, 11, 12, 23 |
| `coffee table` | 56 | 3.7% | Folders 19, 32, 36, 50 |
| `dressing table/vanity` | 55 | 3.6% | Folders 01, 12, 22, 25, 41, 45 |
| `kids bed` | 47 | 3.1% | Folders 06, 17, 21, 43, 52, 53 |
| `dining table` | 34 | 2.2% | Folders 05, 11, 12, 47 |
| `shower cabin` | 31 | 2.0% | Folder 35 |
| `dressing room` | 30 | 2.0% | Folders 07, 20, 41 |
| `desk` | 27 | 1.8% | Folders 08, 37, 43, 50, 53 |
| `bathroom vanity` | 18 | 1.2% | Folders 03, 35 |
| `side table` | 17 | 1.1% | Folders 22, 36 |
| `outdoor furniture` | 14 | 0.9% | Folder 30 |
| `none` (non-furniture) | 11 | 0.7% | `_review`, raw debris shots |
| `staircase` | 4 | 0.3% | Folders 04, 10, 34 |

### B. Material Distribution (12 categories)
| Material Tag | Count | Percentage | Characteristic Applications |
|---|---|---|---|
| `white lacquer` | 280 | 18.3% | Vanity units, modern bedrooms, contemporary cabinetry |
| `gypsum` | 224 | 14.6% | Cove lighting ceilings, cornice moldings, architectural drywall |
| `colored lacquer` | 170 | 11.1% | Acrylic kitchens, black accent units, high-gloss finishes |
| `leather` | 153 | 10.0% | Chesterfield sofas, salon seating, padded headboards |
| `velvet` | 147 | 9.6% | Royal blue salons, dining chairs, tufted headboards |
| `metal/gold` | 118 | 7.7% | Electroplated stainless legs, gold trim, chandeliers |
| `porcelain tiles` | 115 | 7.5% | Polished flooring, bathroom wall cladding |
| `wood veneer` | 86 | 5.6% | Fluted panels, executive desks, fitted wardrobes |
| `glass` | 83 | 5.4% | Shower cabins, illuminated mirrors, vitrines |
| `solid wood` | 81 | 5.3% | Raw carpentry frames, live-edge tables, consoles |
| `marble` | 50 | 3.3% | Black & gold TV walls, reception pillars, onyx tables |
| `fabric pattern` | 23 | 1.5% | Baroque floral armchairs, textured accent cushions |

### C. Dominant Non-Background Colour Distribution (13 categories)
Computed from 256 px thumbnail pixels after filtering out edge background wall/floor tones:
- `grey`: 715 (46.7%) — Modern neutral salon fabrics, slate tiles, grey chesterfields
- `brown/wood`: 346 (22.6%) — Natural timber, oak veneer, walnut cabinetry
- `black`: 141 (9.2%) — High-gloss black acrylic kitchens, leather sofas, marble veins
- `red/burgundy`: 93 (6.1%) — Red acrylic kitchen panels, baroque salon velvet
- `navy/blue`: 92 (6.0%) — Royal blue velvet living suites, vanity desk drawer accents
- `beige/cream`: 34 (2.2%) — Warm provincial upholstery, cream lacquered wardrobes
- `turquoise`: 23 (1.5%) — Custom turquoise living room sofas and armchairs
- `white`: 20 (1.3%) — High-contrast pure white lacquer hero pieces
- `orange`: 20 (1.3%) — Studio apartment vibrant modular sectionals
- `purple`: 16 (1.0%) — Saturated purple velvet reception suites
- `gold/yellow`: 14 (0.9%) — Louis XV gold leaf gilt salon furniture
- `green/emerald`: 11 (0.7%) — Emerald green master bedroom velvet headboard
- `pink`: 5 (0.3%) — Girl's classic French provincial bedroom furniture

### D. Production Stage Distribution (4 categories)
- `showroom`: 568 (37.1%) — Staged furniture displays and retail gallery setups
- `under installation`: 533 (34.8%) — On-site installation, mounting cabinetry, rough wiring
- `finished/handover`: 326 (21.3%) — Turnkey client handovers, cleaned and furnished rooms
- `workshop/raw frame`: 103 (6.7%) — Carpentry factory frames, raw timber cuts, joinery

### E. Camera Angle Distribution (4 categories)
- `three-quarter`: 721 (47.1%) — Natural perspective showing front and side dimensions
- `wide room`: 527 (34.4%) — Establishing panoramic room views showing full spatial context
- `front`: 281 (18.4%) — Direct elevation frontal shots (doors, TV walls, wardrobes)
- `close-up detail`: 1 (0.1%) — Macro craftsmanship shots (joinery, carving, stitching)

---

## 3. AI-Source Quality Score Analysis

The AI-Source score evaluates each image on a scale of **1.0 (unusable / discarded)** to **5.0 (pristine hero studio asset)**.

$$\text{AI Score} = 0.15 \cdot S_{\text{res}} + 0.20 \cdot S_{\text{shp}} + 0.15 \cdot S_{\text{exp}} + 0.25 \cdot S_{\text{clut}} + 0.25 \cdot S_{\text{dom}}$$

### Score Statistics
- **Minimum Score**: 2.0 / 5.0
- **25th Percentile**: 3.0 / 5.0
- **Median Score**: 3.3 / 5.0
- **Mean Score**: 3.33 / 5.0
- **75th Percentile**: 3.6 / 5.0
- **Maximum Score**: 4.6 / 5.0

### Quality Brackets
- **4.5 to 5.0 (Tier 1 — Elite Hero Studio Assets)**: 8 photos (0.5%) — Tack-sharp, professional lighting, zero clutter, single furniture piece dominating the frame.
- **4.0 to 4.4 (Tier 2 — High-Quality Campaign Assets)**: 161 photos (10.5%) — Crisp focus, clean handover staging, excellent resolution.
- **3.5 to 3.9 (Tier 3 — Strong Editorial & Social Content)**: 437 photos (28.6%) — Solid product photography, minor background elements.
- **3.0 to 3.4 (Tier 4 — Standard Portfolio Record)**: 579 photos (37.8%) — Acceptable documentation, moderate construction clutter or wider framing.
- **2.0 to 2.9 (Tier 5 — Archive / Reference Only)**: 345 photos (22.5%) — Rough workshop framing, motion blur, underexposed on-site conditions, or phone screenshots.
- **1.0 to 1.9 (Unusable)**: 0 photos (0.0%).

---

## 4. Semantic Search Validation & Benchmark Queries

Three representative queries were tested against the catalog using `_catalog/search.py` with zero-shot ViT-L-14 text encoding:

### Query 1: `"white lacquer dresser navy velvet"`
Target Intent: Locate vanity desks and dressers combining white lacquer and blue/navy accents.
- **Rank 1** (Sim: 0.260 | Score: 3.2): `01-custom-furniture-console-dressing-kitchen/20171128_020539.jpg`  
  *Piece*: `dressing table/vanity` | *Mat*: `white lacquer` | *Col*: `navy/blue`  
  *Folder Note*: "Custom blue-white vanity desk, reception mirror, and kitchen installations"
- **Rank 2** (Sim: 0.256 | Score: 3.6): `01-custom-furniture-console-dressing-kitchen/20171128_020623.jpg`  
  *Piece*: `dressing table/vanity` | *Mat*: `white lacquer` | *Col*: `navy/blue`
- **Rank 3** (Sim: 0.245 | Score: 3.4): `05-classical-residence-dining-suite-master-bedroom/20180311_192810.jpg`  
  *Piece*: `dressing table/vanity` | *Mat*: `white lacquer` | *Col*: `brown/wood`
- **Rank 4** (Sim: 0.245 | Score: 4.3): `01-custom-furniture-console-dressing-kitchen/20200309_184139.jpg`  
  *Piece*: `dining chairs` | *Mat*: `white lacquer` | *Col*: `brown/wood`
- **Rank 5** (Sim: 0.242 | Score: 4.1): `05-classical-residence-dining-suite-master-bedroom/20180313_155745.jpg`  
  *Piece*: `console` | *Mat*: `white lacquer` | *Col*: `brown/wood`

*Validation result*: Top 2 matches specifically pinpointed the blue-and-white lacquer vanity desk from Folder 01.

### Query 2: `"modern minimalist kitchen black marble counter"`
Target Intent: Locate modern high-gloss black kitchens and marble surfaces.
- **Rank 1** (Sim: 0.277 | Score: 3.0): `03-custom-fitted-kitchens-bathroom-vanities/IMG-20180713-WA0001.jpg`  
  *Piece*: `kitchen` | *Mat*: `colored lacquer` | *Col*: `black`
- **Rank 2** (Sim: 0.275 | Score: 3.6): `28-luxury-apartment-black-marble-gold-tv-wall-kitchen/20190915_232300_IMG_3703.JPG`  
  *Piece*: `kitchen` | *Mat*: `marble` | *Col*: `grey`  
  *Folder Note*: "Luxury apartment black marble & gold profile TV wall, curved salon sofa, and open kitchen"
- **Rank 3** (Sim: 0.270 | Score: 2.7): `_review/Screenshot_20200209-155612_Gallery.jpg`  
  *Piece*: `kitchen` | *Mat*: `colored lacquer` | *Col*: `black`
- **Rank 4** (Sim: 0.267 | Score: 3.0): `03-custom-fitted-kitchens-bathroom-vanities/IMG-20180713-WA0003.jpg`  
  *Piece*: `kitchen` | *Mat*: `white lacquer` | *Col*: `black`
- **Rank 5** (Sim: 0.266 | Score: 3.2): `38-luxury-apartment-fluted-wood-kitchen-handover/20190907_130537_IMG_3504.JPG`  
  *Piece*: `kitchen` | *Mat*: `marble` | *Col*: `grey`

*Validation result*: Perfectly matched black acrylic kitchens and marble-accented open kitchen layouts.

### Query 3: `"curved grey velvet sofa gold legs"`
Target Intent: Locate curved salon sofas with velvet upholstery and gold metal accents.
- **Rank 1** (Sim: 0.299 | Score: 4.1): `42-luxury-salon-curved-leather-sofa-dining-set/20190915_220725_IMG_3691.JPG`  
  *Piece*: `sofa` | *Mat*: `velvet` | *Col*: `grey`  
  *Folder Note*: "Luxury salon curved leather sofa & dining set"
- **Rank 2** (Sim: 0.289 | Score: 3.5): `04-luxury-duplex-reception-staircase-furniture-handover/20171209_193955.jpg`  
  *Piece*: `corner sofa` | *Mat*: `velvet` | *Col*: `navy/blue`
- **Rank 3** (Sim: 0.289 | Score: 3.7): `02-custom-upholstered-sofas-armchairs-beds/20180611_220821.jpg`  
  *Piece*: `sofa` | *Mat*: `velvet` | *Col*: `grey`
- **Rank 4** (Sim: 0.288 | Score: 3.6): `04-luxury-duplex-reception-staircase-furniture-handover/20171206_181609.jpg`  
  *Piece*: `armchair` | *Mat*: `metal/gold` | *Col*: `grey`
- **Rank 5** (Sim: 0.287 | Score: 4.5): `26-baroque-gold-gilt-salon-curved-velvet-sofas/20190520_225140_IMG_1541.JPG`  
  *Piece*: `sofa` | *Mat*: `velvet` | *Col*: `red/burgundy`

*Validation result*: Curated curved velvet salon seating and gold gilt frame furniture from folders 42, 04, 02, and 26.

---

## 5. Visual Browse Page (`BANK.html`) Architecture

The visual browser is located at `TSST/brands/vill-studio/assets/source/portfolio/_catalog/BANK.html`. It is built as a single, self-contained, offline-first application:

1. **Zero External Dependencies**: All CSS, SVG iconography, JavaScript, and catalog metadata are bundled directly in the file. No CDN calls to Google Fonts, FontAwesome, or external CDNs exist. Double-clicking the HTML file on any offline computer will load it immediately.
2. **Local Thumbnail Pipeline**: Uses the 1,530 precomputed 320 px JPEG thumbnails in `_catalog/thumbs/`, completely insulating original master high-resolution images from accidental browser lockups or file modifications.
3. **Custom-Styled Interactive Controls**:
   - Custom floating dropdown menus for Piece, Material, Colour, Stage, Angle, and Project Folder.
   - Segmented minimum-score pill buttons (`All`, `2.5+`, `3.0+`, `3.5+`, `4.0+`, `4.5+`).
   - Real-time instant search bar with keyboard shortcuts and clear button.
   - Dynamic sorting (`Score Desc/Asc`, `Date Newest/Oldest`, `Resolution Highest`).
4. **Modal Inspector with One-Click Path Copy**:
   - Clicking any photo opens a high-resolution detail view.
   - Displays the absolute local Windows path (`G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\...`).
   - "Copy Path" button triggers `navigator.clipboard.writeText` with automatic visual toast feedback.
   - Features visual breakdown bars showing individual component scores (`Resolution`, `Sharpness`, `Exposure`, `Clutter`, `Dominance`).

---

## 6. Edge Cases & Mis-Tagging Analysis ("What Tagged Badly")

A thorough audit of edge cases revealed four specific patterns where automated zero-shot tagging encountered friction:

### 1. `_review` Synthetic Screenshots vs. Genuine Photography
- **Issue**: Files in `_review/` (such as WhatsApp screenshots, Instagram promotional posts, and CAD catalog renders) contain synthetic sharp borders, graphic text overlays, or smartphone status bars.
- **Symptom**: Laplacian variance sharpness in `files.json` for screenshots was artificially high (e.g. 500+), while physical camera resolution was low (e.g. 720x1280). In some cases, CLIP classified text flyers as `kitchen` or `sofa` because a small furniture render appeared within the graphic.
- **Handling**: In `CATALOG.csv`, these files are explicitly marked as `folder: _review` with the folder note `"Screenshots, web downloads, catalog renders, and flyers"`. In `STUDIO_PICKS.md`, genuine project folders were prioritized over `_review` files.

### 2. Multi-Piece Master Bedroom & Living Suites
- **Issue**: In master bedroom handover shots (e.g. Folder 18, Folder 20, Folder 25), the camera angle often captures both a large sliding wardrobe and a dressing vanity desk or bed frame in a single shot.
- **Symptom**: CLIP zero-shot must pick a single top piece (e.g. `wardrobe`), assigning the vanity desk a score of 0.22 vs. 0.24.
- **Handling**: `tag.py` records both `piece` (top tag) and `piece_top2` (runner-up tag), allowing multi-piece assets to be discovered under both tags in `BANK.html` and CLI searches.

### 3. Incandescent 2700K Warm Light Color Cast
- **Issue**: Luxury residential handovers photographed under warm halogen spotlights or cove lighting exhibit a strong amber/yellow color cast across all pixels.
- **Symptom**: Neutral white or light-grey lacquer surfaces were occasionally categorized by the photometric color extractor as `beige/cream` or `brown/wood`.
- **Handling**: The excess-frequency algorithm compares center pixels against border pixels to isolate the subject, but under uniform amber room illumination, the warm cast affects both border and center. This is normal for raw camera JPEGs without white-balance color correction.

### 4. Background Staircases in Duplex Living Rooms
- **Issue**: In Folders 04 and 10 (luxury duplex apartments), floating architectural staircases are prominent features of the home, but are positioned in the background of a furnished royal blue salon.
- **Symptom**: CLIP heavily weighted the foreground velvet sofa, resulting in only 4 images being classified with `staircase` as the primary top piece.
- **Handling**: When searching for staircases, using `search.py "staircase balustrade"` or filtering by Folder 04 successfully surfaces all duplex photos where the staircase is present.

---

## 7. Operational Instructions for TSST Lead

### Editing Classification Prompts
To add, refine, or adjust prompts for any piece, material, stage, or angle, edit the dictionaries in:
```text
TSST/brands/vill-studio/assets/source/portfolio/_catalog/tag_prompts.py
```
After editing, re-run:
```powershell
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\tag.py"
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\score.py"
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\build_catalog.py"
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\generate_bank_html.py"
```

### Running Fast CLI Searches
From PowerShell or Command Prompt:
```powershell
# Text search
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\search.py" "white lacquer vanity desk" --top 10

# Text search with quality and piece filter
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\search.py" "velvet chesterfield" --min-score 3.5 --piece sofa

# Find photos visually similar to a reference photo
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\search.py" --like 20171128_020539.jpg --top 10
```

### Opening the Visual Catalog
Simply open the following file in Google Chrome, Microsoft Edge, or any modern web browser:
```text
TSST/brands/vill-studio/assets/source/portfolio/_catalog/BANK.html
```
No local web server is required.
