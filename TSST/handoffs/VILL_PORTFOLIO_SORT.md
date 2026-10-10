# VILL portfolio sort: ticket for Antigravity

Owner request (Ahmed, 2026-10-09): sort VILL's past-work photos (finishing and furnishing) by file name and by image content, then group related photos into named folders. Method chosen by the owner: a local CLIP model on the GPU groups the photos by look + time, then Antigravity names the groups from contact sheets. Lead (Claude) reviews the result before it counts.

Status: READY for Antigravity. Env verified 2026-10-10 (torch 2.11 cu128 sees the RTX 4060 Ti; ViT-L-14 weights cached; 32-photo test OK). Estimate: about 45–60 minutes; reading files from the Drive folder is the slow part (32 photos ≈ 55 s on first read).

**Antigravity prompt (ROLE B, external tool; file work only):**
```
ROLE B — external tool. Repo: G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS. Do not commit or push.
Client: VILL (interior finishing + furnishing). Task: sort the client's past-work photos into named folders.

SOURCE (client folder, READ ONLY — never move, rename, edit or delete anything in it):
  G:\.shortcut-targets-by-id\1o5SwZqNlYdgmgCG5SIPqDmuda6ldjIR4\Vill
  One flat folder, 1,583 files (1,557 jpg + 25 png + 1 mp4). Most names are camera timestamps
  (20171128_020539.jpg = 2017-11-28 02:05:39).
OUTPUT:  TSST/brands/vill-studio/assets/source/portfolio/
WORK:    TSST/brands/vill-studio/assets/source/portfolio/_work/   (scripts, sheets, json, progress)

METHOD = local AI model (CLIP on the GPU) groups the photos, then you NAME the groups from contact sheets.
Do NOT open the 1,583 photos one by one.

PYTHON ENV (already installed by the Lead — do not pip install into the system Python):
  C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe   (Python 3.12, torch CUDA, open_clip_torch, pillow, imagehash, numpy, scikit-learn)
  GPU: RTX 4060 Ti 16 GB → use device "cuda". Run every script with this python.

Step 1 — embed + cluster (_work/cluster.py):
  - Read every image. Time = from the file name if it is a timestamp, else EXIF DateTimeOriginal, else file mtime.
  - CLIP embeddings: open_clip "ViT-L-14", pretrained "openai" (fallback "ViT-B-32" if memory errors),
    EXIF rotation applied, batch 32 on cuda, L2-normalised. Cache to _work/embeddings.npy + _work/files.json
    (so a rerun skips this).
  - Space tag per photo (zero-shot): compare with text prompts "a photo of a <space> interior/under construction"
    for: kitchen, reception-living, bedroom, bathroom, dressing, ceiling-gypsum, flooring, paint-walls, facade,
    furniture-pieces, workshop, other. Keep top tag + score.
  - Duplicates: exact (file hash) and near (imagehash phash distance ≤ 4) → keep the sharpest/biggest, list the rest.
  - Time bursts: new burst when the gap > 45 minutes or the date changes.
  - Groups = agglomerative clustering on the embeddings (cosine, average linkage, distance threshold ~0.25,
    tune so most groups are 5–40 photos). Two time bursts whose mean embeddings are very close (cosine ≥ 0.90)
    → same place → same group, even on different days. Split groups bigger than 40 into parts.
  - Save _work/clusters.json: group id (G001…), files, date range, top space tags, duplicates.
  - Print a short summary (group count, size spread, duplicates count) into _work/progress.md.

Step 2 — contact sheets (_work/sheets.py, Pillow):
  - One JPG per group: _work/sheets/G001.jpg. Grid of thumbnails (~240 px long side, EXIF rotation applied),
    each thumbnail labelled with its index + file name. Header: group id, date range, count, top space tags.
  - Max ~40 thumbnails per sheet. Thumbnails are for viewing only; never touch the originals.

Step 3 — check + name (you look at the sheets, one by one):
  The model already grouped the photos. Your job is to CHECK and NAME, not to sort from zero.
  For each sheet decide and write to _work/labels.json:
    - correct? If the sheet mixes two places, list the indexes to split off. If two sheets are the same place, merge them.
    - space type: confirm or fix the model's tag (kitchen, reception-living, bedroom, bathroom, dressing,
      ceiling-gypsum, flooring, paint, facade, furniture-pieces, workshop, other).
    - stage: before / during / after / mixed.
    - folder name: English, lowercase, hyphens, numbered, says what is inside.
      e.g. 01-villa-reception-marble-gypsum-ceiling, 02-kitchen-white-wood-island, 03-bedroom-furniture-set
    - photos that don't fit (blurry, dark, personal, unrelated) → by index to _review.
  Save labels.json after EVERY sheet (so the job can resume). _work/progress.md = last sheet done.

Step 4 — copy (_work/copy.py):
  - COPY (never move) each file into OUTPUT/<folder name>/, keeping the original file name.
  - _duplicates/  the extra copies from Step 1.
  - _review/      the photos marked in Step 3.
  - _before-after/ copies of clear before/after pairs (they also stay in their group).
  - The mp4 goes with its project if clear, else _review.

Step 5 — INDEX.md in OUTPUT:
  - per folder: file count + one line describing it + date range.
  - one table row per file: original name | folder | group id | model space tag.
  - totals: source count = sorted + _duplicates + _review (must equal 1,583).

Rules: no editing of image pixels, no compression of originals, no AI generation, no files left out.
Report: TSST/handoffs/VILL_PORTFOLIO_SORT_report.md — folder list with counts, groups you split, merged or were unsure of,
time taken, any script error.
```

## Lead review checklist (on return)
- Source folder untouched; INDEX.md totals = 1,583.
- Spot-check 10 random files + 3 contact sheets: right folder, honest name.
- Model merges (same place, different days) make sense; check what Antigravity split or merged.
- Folder names usable later for showcase posts (project / space / material).
