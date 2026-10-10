# Photo Bank Tool

Universal visual asset sorting, tagging, and cataloging engine for any brand, powered by local CLIP embeddings (`ViT-L-14` "openai") and perceptual hashing. Source media is always read-only.

Method: `TSST/CREATIVE/skills/tsst-creative-sk-019-product-pipeline/`  
QA metric aid: `TSST/CREATIVE/skills/tsst-creative-sk-014-final-asset-qa/`

Python runtime:
```powershell
C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe photobank.py <command>
```

---

## 4-Step Operating Flow

1. **`embed <src> <bank> [--profile <name>]`**  
   Reads media (jpg, png, webp, heic, and mp4 video frames via ffmpeg), extracts hashes, timestamps, sharpness, and unit-normalized CLIP embeddings into `<bank>/_work/` (incremental cache).
   ```powershell
   python photobank.py embed "G:\RawPhotos" "C:\Banks\BrandBank" --profile generic
   ```

2. **`group <bank> [--profile <name>]`**  
   Detects exact/near duplicates, clusters time bursts (45m gaps, date transitions, cosine merge $\ge 0.88$, split $> 40$), and renders visual contact sheets to `<bank>/_work/sheets/`.
   ```powershell
   python photobank.py group "C:\Banks\BrandBank"
   ```

3. **Name groups from sheets & `sort <bank> --labels <json>`**  
   Human or agent inspects contact sheets and writes `labels.json`. The sort command copies files into named folders, `_duplicates/`, `_review/`, `_before-after/`, and generates `INDEX.md`.
   ```powershell
   python photobank.py sort "C:\Banks\BrandBank" --labels "C:\Banks\BrandBank\_work\labels.json"
   ```

4. **`catalog <bank> [--profile <name>]`**  
   Zero-shot classifies piece/material/stage/angle, computes explainable AI-source scores (1–5), collapses near-twin takes ($\le 120\text{s}, \cos \ge 0.93$), and generates `CATALOG.csv`, offline `BANK.html`, and `STUDIO_PICKS.md`.
   ```powershell
   python photobank.py catalog "C:\Banks\BrandBank" --profile generic
   ```

---

## Standalone Commands

- **Semantic Search**: Text or image-to-image similarity across catalog:
  ```powershell
  python photobank.py search "C:\Banks\BrandBank" "matte black powder tub" --top 10 --min-score 3.5
  python photobank.py search "C:\Banks\BrandBank" --like "IMG_0042.jpg" --top 5
  ```

- **Duplicates Scanner**: Fast standalone duplicate report for any folder (no bank required):
  ```powershell
  python photobank.py dupes "G:\My Drive\UnsortedPhotos"
  ```

- **Fidelity QA**: Compares an AI render against real product references via CLIP cosine & pHash distance:
  ```powershell
  python photobank.py fidelity "C:\Renders\creatine_ad.png" "G:\RawPhotos\Tub_Angle.jpg" "G:\RawPhotos\Tub_Front.jpg"
  ```

---

## Brand Profiles

Profiles live in `profiles/<name>.yaml` and configure tag prompts, score weights, and UI header branding:
- `vill.yaml`: Interior finishing, custom carpentry, and furniture handover.
- `supplements.yaml`: Sports nutrition tubs, scoops, shakers, labels, lifestyle, and gym.
- `generic.yaml`: Default profile for general products, people, places, and details.

---

## Limits

- **Material tags are weak**: Zero-shot CLIP can confuse subtle textures (e.g. natural veneer vs high-pressure laminate, or matte vs satin plastic) when reflections or lighting interfere.
- **Naming needs eyes**: Automated clustering groups bursts accurately, but folder naming and curation of before/after pairs requires human or Lead inspection of the contact sheets.
- **Video sampling**: Only extracts a single representative 1-second preview frame per `.mp4` for embedding.
