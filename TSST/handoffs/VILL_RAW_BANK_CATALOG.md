# VILL raw bank catalog: ticket for Antigravity

Owner request (Ahmed, 2026-10-10): the sorted portfolio is our RAW BANK. When we need studio images we pick from it, upgrade them with AI and use them per campaign. So every photo needs pointers: what it shows, and how usable it is as an AI source. Lead (Claude) reviews a sample on return.

Status: READY. Estimate: about 30 minutes. Builds on VILL_PORTFOLIO_SORT (done, Lead-accepted).

**Antigravity prompt (ROLE B, external tool; file work only):**
```
ROLE B — external tool. Repo: G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS. Do not commit or push.
Client: VILL (interior finishing + custom furniture). Task: turn the sorted photo bank into a searchable catalog.

BANK (read only, do not move/rename/edit photos): TSST/brands/vill-studio/assets/source/portfolio/
  54 numbered project folders + _duplicates/ _review/ _before-after/. INDEX.md maps every file.
REUSE (do not recompute): portfolio/_work/embeddings.npy (1583x768, open_clip ViT-L-14 "openai", L2-normalised,
  row = files.json "index"), portfolio/_work/files.json (name, path, width, height, sharpness, space_tag...).
PYTHON: C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe (cuda). Same model for any text query.
WRITE: portfolio/_catalog/  (scripts + outputs). Skip _duplicates/ in the catalog; include _review/ marked as such.

Step 1 — tags (_catalog/tag.py), zero-shot on the saved embeddings, keep top tag + score, and top-2 where useful:
  - piece: dressing table/vanity, sofa, corner sofa, armchair, bed, wardrobe, dressing room, kitchen, dining table,
    dining chairs, coffee table, side table, console, TV wall, desk, kids bed, bathroom vanity, shower cabin,
    door, staircase, ceiling, flooring, wall finish, outdoor furniture, none.
  - material: white lacquer, colored lacquer, wood veneer, solid wood, velvet, leather, fabric pattern, marble,
    gypsum, glass, metal/gold, porcelain tiles.
  - main colour: name from the dominant non-background colour (compute from pixels on a 256 px thumbnail).
  - stage: workshop/raw frame, under installation, finished/handover, showroom.
  - angle: front, three-quarter, close-up detail, wide room.
  Write prompt lists in tag.py so the Lead can edit them.

Step 2 — AI-source score 1–5 (_catalog/score.py), from: resolution (long side), sharpness (files.json),
  exposure (mean/clipped pixels), clutter (CLIP: "a clean product photo" vs "a cluttered messy room with people
  and objects"), and whether ONE piece dominates the frame. 5 = clean, sharp, one clear piece; 1 = unusable.
  Store the parts too, so the score is explainable.

Step 3 — CATALOG.csv in portfolio/: one row per file: file | folder | piece | material | colour | stage | angle |
  space_tag | ai_score | score_parts | width | height | date | project folder note (from INDEX.md).

Step 4 — text search CLI (_catalog/search.py):
  python search.py "white lacquer dresser navy velvet" --top 20 [--min-score 3] [--piece sofa]
  → prints rank, similarity, ai_score, path. Also --like <file> (find photos similar to a photo).

Step 5 — browse page portfolio/_catalog/BANK.html (one self-contained file, opens locally):
  thumbnails (make 320 px thumbs in _catalog/thumbs/, never touch originals), filters by piece / material / colour /
  stage / angle / folder / min score, sort by score, click = show full path + copy-path button.
  Use styled custom controls only (no raw browser file inputs or unstyled selects). Works offline.

Step 6 — STUDIO_PICKS.md in portfolio/: for each piece type, the top 5 photos by ai_score (path + one-line why).

Rules: originals untouched; no AI generation; no uploads. Report: TSST/handoffs/VILL_RAW_BANK_CATALOG_report.md —
tag counts per field, score distribution, 3 sample searches with their top 5, anything that tagged badly.
```

## Lead review checklist (on return)
- 15 random rows: tags honest; ai_score matches what the photo looks like.
- search.py "white lacquer dresser navy velvet" finds the dresser source photos (20171209_2336xx, 20171128_0205xx/0206xx).
- BANK.html opens offline, filters work, no native unstyled controls.
- CATALOG row count = bank files minus _duplicates.
