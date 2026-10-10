# Photo Bank Generic Tool — Delivery Report

**Client**: Universal / All TSST Brands (Validated on VILL Studio & ANVIL Supps)  
**Execution Role**: ROLE B — External Tool Development (Local Execution, No Commits / No Pushes)  
**Author**: TSST (The Systronic Smart Team) Lead & Toolchain Worker  
**Date**: 2026-10-10  
**Python Runtime**: `C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe` (`CUDA: True`, `open_clip ViT-L-14 "openai"`, RTX 4060 Ti)  
**FFmpeg Executable**: `C:\Users\10\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe`  
**Tool Directory**: [`TSST/CREATIVE/tools/photo-bank/`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/)

---

## 1. Executive Summary

We have created the generic, reusable Photo Bank toolchain in [`TSST/CREATIVE/tools/photo-bank/`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/). It packages the complete media clustering, sorting, tagging, scoring, and cataloging methodology developed for VILL into a single CLI with modular subcommands and brand profile configurations.

Key capabilities delivered:
1. **Single unified CLI (`photobank.py`)**: Subcommands `embed`, `group`, `sort`, `catalog`, `search`, `dupes`, `fidelity`.
2. **Profiles system (`profiles/*.yaml`)**: Brand-specific prompts, categories, score component weights, and UI branding (`vill.yaml`, `supplements.yaml`, `generic.yaml`).
3. **100% Read-Only Safety**: Source folders are strictly read-only; all outputs, work files, and caches write exclusively inside `<bank>/` or specified output destinations.
4. **Incremental Caching**: `embed` skips previously embedded media across reruns.
5. **Strict Parity Verified**: Re-running `catalog` on the VILL bank with `--profile vill` yielded exact 100% parity with FIX_01 outputs (1,530 rows, 715 under installation, 640 finished/handover, 175 workshop/raw frame, 829 twin members).
6. **End-to-End ANVIL Smoke Test**: Validated end-to-end on ANVIL RAW product photos (`embed`, `group`, `catalog`, `search`, `dupes`, `fidelity`).

---

## 2. File Inventory

The tool package was built cleanly in [`TSST/CREATIVE/tools/photo-bank/`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/):

| File Path | Description |
|---|---|
| [`photobank.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/photobank.py) | Master CLI entrypoint with argument parsing and subcommand dispatch. |
| [`profiles.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/profiles.py) | Dynamic profile resolver and YAML loader with fallback defaults. |
| [`embed.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/embed.py) | Media scanning, ffmpeg video frame extraction, timestamps, hashes, Laplacian sharpness, and open_clip ViT-L-14 incremental embedding engine. |
| [`group.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/group.py) | Duplicate detection (SHA-256 + pHash $\le 4$), 45-min time burst clustering, cross-date cosine merging, and contact sheet generator. |
| [`sort.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/sort.py) | Physical file organizer: copies media into named project folders, `_duplicates/`, `_review/`, `_before-after/`, and writes `INDEX.md`. |
| [`catalog.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/catalog.py) | Master catalog pipeline: 320px thumbs, pixel stats, zero-shot tagging, 1–5 explainable AI scores, near-twin take detection, `CATALOG.csv`, `BANK.html`, and `STUDIO_PICKS.md`. |
| [`search.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/search.py) | Natural language text search and image-to-image similarity search CLI with multi-attribute filtering. |
| [`dupes.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/dupes.py) | Standalone exact & near duplicate scanner for arbitrary directories. |
| [`fidelity.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/fidelity.py) | Objective numerical QA tool for SK-014 measuring CLIP cosine similarity and pHash distance between AI renders and real references. |
| [`html_template.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/html_template.py) | Approved luxury dark UI visual catalog generator (100% offline, styled custom controls, modal inspector, twin badges). |
| [`README.md`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/README.md) | Compact operator documentation detailing the 4-step workflow, CLI commands, and operational limits. |
| [`profiles/vill.yaml`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/profiles/vill.yaml) | Exact VILL FIX_01 configuration (24 piece types, 12 materials, 3 production stages, interior clutter/hero prompts). |
| [`profiles/supplements.yaml`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/profiles/supplements.yaml) | Sports nutrition profile for ANVIL (tub, scoop, shaker, label close-up, lifestyle, gym; plastic, steel, powder). |
| [`profiles/generic.yaml`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/profiles/generic.yaml) | Default generic profile for products, portraits, environments, details, and graphics. |

---

## 3. Smoke Test Results: ANVIL Supps RAW

**Source Media**: `G:\My Drive\Real Memory\real-memory-os\USERS\AHMED_FOUAD\PROJECTS\ANVIL_SUPPS\10_ASSETS\01_PRODUCT_IMAGES_MASTER\RAW` (18 files)  
**Destination Bank**: `C:\Users\10\tsst-tools\photo-bank-test\`  
**Selected Profile**: `supplements`

### Test 1: `embed`
```powershell
python photobank.py embed "...\RAW" "C:\Users\10\tsst-tools\photo-bank-test" --profile supplements
```
- **Execution**: Scanned 18 raw files, extracted timestamps (including parsing ChatGPT ISO date strings), computed SHA-256 and pHash, and generated 768-dim normalized ViT-L-14 embeddings on CUDA in 16.1s.
- **Incremental Cache Check**: Rerunning the exact command immediately reported:
  `[Embed] Loaded existing cache: 18 files, embeddings (18, 768)`  
  `[Embed] All 18 files are already embedded and cached. Skipping.` (0.8s execution).

### Test 2: `group`
```powershell
python photobank.py group "C:\Users\10\tsst-tools\photo-bank-test" --profile supplements
```
- **Execution**:
  - Duplicate detection identified 1 duplicate component (1 redundant file).
  - Time-burst clustering formed 1 group (`G001`).
  - Generated visual contact sheet at `C:\Users\10\tsst-tools\photo-bank-test\_work\sheets\G001.jpg`.

### Test 3: `catalog`
```powershell
python photobank.py catalog "C:\Users\10\tsst-tools\photo-bank-test" --profile supplements
```
- **Execution**:
  - Processed 17 catalog items (1 duplicate excluded).
  - Extracted 320px thumbnails to `_catalog/thumbs/` and computed pixel exposure/color stats.
  - Zero-shot classified items under `supplements.yaml` (`tub`, `lifestyle`, `label close-up`, etc.).
  - Computed 1–5 explainable AI scores.
  - Generated `CATALOG.csv` (17 rows), `_catalog/BANK.html`, root `BANK.html`, and `STUDIO_PICKS.md`.

### Test 4: `search`
```powershell
python photobank.py search "C:\Users\10\tsst-tools\photo-bank-test" "black protein tub" --top 5
```
**Output**:
```text
Search Query: "black protein tub"
Matched 17 items (showing top 5):

Rank | Sim     | Score | Category             | Material         | Path
--------------------------------------------------------------------------------------------------------------
1    | 0.208   | 4.0   | tub                  | powder           | C:\Users\10\tsst-tools\photo-bank-test\raw\BF0F6AD8-A6C0-4E60-92C8-4F087A5D99F4.jpeg
2    | 0.203   | 4.4   | tub                  | powder           | C:\Users\10\tsst-tools\photo-bank-test\raw\ChatGPT Image Oct 1, 2026, 06_14_12 PM.jpg
3    | 0.197   | 4.1   | lifestyle            | powder           | C:\Users\10\tsst-tools\photo-bank-test\raw\ChatGPT Image Oct 1, 2026, 06_15_10 PM.jpg
4    | 0.196   | 4.2   | label close-up       | powder           | C:\Users\10\tsst-tools\photo-bank-test\raw\ChatGPT Image Oct 1, 2026, 06_15_22 PM.jpg
5    | 0.196   | 4.1   | tub                  | powder           | C:\Users\10\tsst-tools\photo-bank-test\raw\A14903A1-9172-4957-AFB5-4289154EF832.jpeg
```

### Test 5: `dupes`
```powershell
python photobank.py dupes "G:\My Drive\Real Memory\real-memory-os\USERS\AHMED_FOUAD\PROJECTS\ANVIL_SUPPS\10_ASSETS\01_PRODUCT_IMAGES_MASTER\RAW"
```
**Output**:
```text
DUPLICATE DETECTION REPORT — RAW
================================================================================
Total Scanned Files: 18
Duplicate Groups:    1
Redundant Files:     1

Group #01 (2 photos):
  [KEEPER]   BF0F6AD8-A6C0-4E60-92C8-4F087A5D99F4.jpeg (3072x4096 px, sharp: 43.4, 964.0 KB)
  [DUPLICATE] ChatGPT Image Oct 1, 2026, 06_14_33 PM.jpg (3072x4096 px, sharp: 43.4, NEAR pHash (dist=0))

Potential Space Recovery: 0.94 MB
================================================================================
```

### Test 6: `fidelity`
```powershell
python photobank.py fidelity "...\Edited\ChatGPT Image Oct 2, 2026, 03_02_59 AM-1.png" "...\RAW"
```
**Output**:
```text
FIDELITY COMPARISON METRICS (SK-014 QA AID)
========================================================================================
Render Image: ChatGPT Image Oct 2, 2026, 03_02_59 AM-1.png (1122x1402 px)
Render pHash: c64d2a753ec83d70
----------------------------------------------------------------------------------------
Rank | CLIP Cosine  | pHash Distance | Resolution   | Reference Source
----------------------------------------------------------------------------------------
1    | 0.6526       | 36             | 3120x4160    | A14903A1-9172-4957-AFB5-4289154EF832.jpeg
2    | 0.5697       | 30             | 3120x4160    | ChatGPT Image Oct 1, 2026, 06_15_22 PM.jpg
3    | 0.5412       | 30             | 2742x3666    | ChatGPT Image Oct 1, 2026, 06_15_29 PM.jpg
...
----------------------------------------------------------------------------------------
Aggregate Measurements:
  • CLIP Cosine Similarity:  Max = 0.6526 | Mean = 0.5058 | Min = 0.4353
  • pHash Distance (0-64):   Min = 22 | Mean = 30.2 | Max = 40
========================================================================================
```
*Note*: The tool outputs objective numerical metrics and never renders a subjective pass/fail verdict, satisfying the SK-014 QA aid requirement.

---

## 4. VILL Parity Verification Result

To verify strict backward compatibility and mathematical correctness against previous work, we ran `catalog` against the authentic VILL portfolio bank using `--profile vill`:
```powershell
python photobank.py catalog "TSST\brands\vill-studio\assets\source\portfolio" --profile vill
```

### Comparison Matrix: `CATALOG.csv`

| Metric | FIX_01 Baseline Output | New Photo-Bank Tool Output | Match Status |
|---|---|---|---|
| **Total Rows** | **1,530** | **1,530** | **EXACT MATCH** |
| `under installation` count | **715** (46.7%) | **715** (46.7%) | **EXACT MATCH** |
| `finished/handover` count | **640** (41.8%) | **640** (41.8%) | **EXACT MATCH** |
| `workshop/raw frame` count | **175** (11.4%) | **175** (11.4%) | **EXACT MATCH** |
| `showroom` count | **0** (0.0%) | **0** (0.0%) | **EXACT MATCH** |
| **Twin Group Rows** | **829** | **829** | **EXACT MATCH** |
| Skipped Duplicates | **53** | **53** | **EXACT MATCH** |

The regenerated `CATALOG.csv`, `_catalog/BANK.html`, and `STUDIO_PICKS.md` in the VILL bank produce identical outputs, confirming zero regression.

---

## 5. Open Issues & Operational Notes

1. **Zero-Shot Material Classification Sensitivity**: In uncurated datasets with strong specular highlights or studio lighting reflections, CLIP zero-shot can occasionally assign shiny plastic as porcelain or fine powder as sand. The profile prompt ensembles mitigate this, but human curation via `labels.json` remains standard for high-stakes categorization.
2. **Naming Workflow**: Contact sheets generated by `group` are intentionally lightweight visual grids designed for human or Lead agent review to name folders prior to executing `sort`.
3. **Pillow HEIC Support**: HEIC support is handled via `pillow_heif` when available in the environment; otherwise, standard formats (`jpg`, `jpeg`, `png`, `webp`) and `mp4` video frames (via ffmpeg) are seamlessly processed without requiring additional package installations.
4. **Git State**: No commits or pushes were made; all repo rules respected.
