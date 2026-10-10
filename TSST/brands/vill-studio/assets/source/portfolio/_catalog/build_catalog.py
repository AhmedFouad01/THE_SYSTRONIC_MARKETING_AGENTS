"""
VILL Portfolio - Catalog Builder
Step 3: Builds portfolio/CATALOG.csv combining:
  file | folder | piece | material | colour | stage | angle |
  space_tag | ai_score | score_parts | width | height | date | project folder note (from INDEX.md) | twin_group

Skips _duplicates/, includes _review/ marked as such.
Includes twin_group column (blank if none).
"""

import os
import sys
import csv
import json

REPO_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
PORTFOLIO_DIR = os.path.join(REPO_DIR, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
WORK_DIR = os.path.join(PORTFOLIO_DIR, "_work")
CATALOG_DIR = os.path.join(PORTFOLIO_DIR, "_catalog")

def build_catalog():
    index_path = os.path.join(PORTFOLIO_DIR, "INDEX.md")
    tags_path = os.path.join(CATALOG_DIR, "tags.json")
    scores_path = os.path.join(CATALOG_DIR, "scores.json")
    files_path = os.path.join(WORK_DIR, "files.json")
    twins_path = os.path.join(CATALOG_DIR, "twin_groups.json")

    # Load tags, scores, files, twins
    with open(tags_path, "r", encoding="utf-8") as f:
        tags_data = json.load(f)
    with open(scores_path, "r", encoding="utf-8") as f:
        scores_data = json.load(f)
    with open(files_path, "r", encoding="utf-8") as f:
        files_data = json.load(f)
    
    twin_file_map = {}
    if os.path.exists(twins_path):
        with open(twins_path, "r", encoding="utf-8") as f:
            twins_data = json.load(f)
        twin_file_map = twins_data.get("file_map", {})

    # Parse INDEX.md
    with open(index_path, "r", encoding="utf-8") as f:
        text = f.read()

    overview_sec, detailed_sec = text.split("## Detailed File Index")

    folder_notes = {}
    for line in overview_sec.splitlines():
        line = line.strip()
        if line.startswith("| `"):
            parts = [p.strip().replace("`", "") for p in line.split("|")[1:-1]]
            if len(parts) >= 5 and parts[0] != "Folder Name":
                folder_notes[parts[0]] = parts[4]

    file_to_folder = {}
    for line in detailed_sec.splitlines():
        line = line.strip()
        if line.startswith("| `"):
            parts = [p.strip().replace("`", "") for p in line.split("|")[1:-1]]
            if len(parts) >= 2 and parts[0] != "Original File Name":
                file_to_folder[parts[0]] = parts[1]

    # Generate rows
    headers = [
        "file",
        "folder",
        "piece",
        "material",
        "colour",
        "stage",
        "angle",
        "space_tag",
        "ai_score",
        "score_parts",
        "width",
        "height",
        "date",
        "project folder note (from INDEX.md)",
        "twin_group"
    ]

    out_csv_path = os.path.join(PORTFOLIO_DIR, "CATALOG.csv")
    rows = []
    json_rows = []
    skipped_duplicates = 0

    for f_rec in files_data:
        fname = f_rec["name"]
        folder = file_to_folder.get(fname, "_review")

        # Skip duplicates
        if folder == "_duplicates":
            skipped_duplicates += 1
            continue

        tag = tags_data.get(fname, {})
        score = scores_data.get(fname, {})
        note = folder_notes.get(folder, "")
        tw_info = twin_file_map.get(fname, {})
        tw_group = tw_info.get("twin_group", "")

        row = [
            fname,
            folder,
            tag.get("piece", "none"),
            tag.get("material", "unknown"),
            tag.get("colour", "grey"),
            tag.get("stage", "finished/handover"),
            tag.get("angle", "three-quarter"),
            f_rec.get("space_tag", "other"),
            score.get("ai_score", 3.0),
            score.get("score_parts", ""),
            f_rec.get("width", 0),
            f_rec.get("height", 0),
            f_rec.get("date", ""),
            note,
            tw_group
        ]
        rows.append(row)

        json_item = dict(zip(headers, row))
        json_item["is_twin_primary"] = tw_info.get("is_primary", True)
        json_item["twin_count"] = tw_info.get("twin_count", 0)
        json_item["twins"] = tw_info.get("twins", [])
        json_rows.append(json_item)

    print(f"Total rows in catalog: {len(rows)} (Skipped duplicates: {skipped_duplicates})")
    tw_assigned = sum(1 for r in rows if r[-1])
    print(f"Rows assigned to a twin group: {tw_assigned}")

    with open(out_csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"CATALOG.csv successfully created at {out_csv_path}!")

    # Save catalog_data.json
    json_path = os.path.join(CATALOG_DIR, "catalog_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_rows, f, indent=2, ensure_ascii=False)
    print(f"Catalog JSON cache saved to {json_path}")

if __name__ == "__main__":
    build_catalog()
