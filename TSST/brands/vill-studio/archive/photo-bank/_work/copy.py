import os
import sys
import json
import shutil

sys.stdout.reconfigure(encoding='utf-8')

SOURCE_DIR = r"G:\.shortcut-targets-by-id\1o5SwZqNlYdgmgCG5SIPqDmuda6ldjIR4\Vill"
OUTPUT_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\vill-studio\assets\source\portfolio"
WORK_DIR = os.path.join(OUTPUT_DIR, "_work")

def main():
    labels_path = os.path.join(WORK_DIR, "labels.json")
    clusters_path = os.path.join(WORK_DIR, "clusters.json")
    files_path = os.path.join(WORK_DIR, "files.json")

    if not os.path.exists(labels_path):
        print(f"Error: {labels_path} does not exist yet. Complete Step 3 labeling first.")
        sys.exit(1)

    with open(labels_path, "r", encoding="utf-8") as f:
        labels_data = json.load(f)
    with open(clusters_path, "r", encoding="utf-8") as f:
        clusters_data = json.load(f)
    with open(files_path, "r", encoding="utf-8") as f:
        files_data = json.load(f)

    file_info_map = {f["name"]: f for f in files_data}
    raw_source_files = sorted(os.listdir(SOURCE_DIR))
    assert len(raw_source_files) == 1583, f"Expected 1583 source files, found {len(raw_source_files)}"

    # Target folders
    dup_dir = os.path.join(OUTPUT_DIR, "_duplicates")
    review_dir = os.path.join(OUTPUT_DIR, "_review")
    before_after_dir = os.path.join(OUTPUT_DIR, "_before-after")

    os.makedirs(dup_dir, exist_ok=True)
    os.makedirs(review_dir, exist_ok=True)
    os.makedirs(before_after_dir, exist_ok=True)

    # Track placement of each file: filename -> folder_name
    file_placement = {}
    before_after_copies = set()

    # 1. Identify duplicates from clusters_data and files_data
    duplicates = set()
    for c in clusters_data:
        for d in c.get("duplicates", []):
            duplicates.add(d)
    for f in files_data:
        if f.get("is_duplicate", False):
            duplicates.add(f["name"])

    assert len(duplicates) == 53, f"Expected 53 duplicates, got {len(duplicates)}"

    folder_descriptions = {} # folder_name -> dict

    # Group files map
    group_files_map = {g["group_id"]: g["files"] for g in clusters_data}

    for gid, linfo in labels_data.items():
        folder_name = linfo.get("folder_name")
        if not folder_name:
            continue
        
        if not folder_name.startswith("_"):
            folder_path = os.path.join(OUTPUT_DIR, folder_name)
            os.makedirs(folder_path, exist_ok=True)
            if folder_name not in folder_descriptions:
                folder_descriptions[folder_name] = {
                    "description": linfo.get("description", ""),
                    "space_type": linfo.get("space_type", ""),
                    "stage": linfo.get("stage", ""),
                    "dates": set(),
                    "count": 0,
                    "gid": gid
                }

        # Files to include in this folder
        g_files = linfo.get("include_files", group_files_map.get(gid, []))
        rev_files = set(linfo.get("review_files", []))
        ba_pairs = linfo.get("before_after_pairs", [])

        for f in g_files:
            if f in duplicates:
                file_placement[f] = "_duplicates"
            elif f in rev_files or folder_name == "_review":
                file_placement[f] = "_review"
            else:
                file_placement[f] = folder_name
                if folder_name in folder_descriptions:
                    folder_descriptions[folder_name]["count"] += 1
                    f_date = file_info_map.get(f, {}).get("date")
                    if f_date:
                        folder_descriptions[folder_name]["dates"].add(f_date)

        for pair in ba_pairs:
            for bf in pair:
                before_after_copies.add(bf)

    # Any file from raw_source_files not yet placed:
    for f in raw_source_files:
        if f not in file_placement:
            if f in duplicates:
                file_placement[f] = "_duplicates"
            else:
                file_placement[f] = "_review"

    assert len(file_placement) == 1583, f"Expected 1583 placed files, got {len(file_placement)}"

    # Now execute COPY (never move)
    print(f"Copying files into destination folders...")
    copied_counts = {}
    for f, dest_sub in file_placement.items():
        src_file = os.path.join(SOURCE_DIR, f)
        dest_folder = os.path.join(OUTPUT_DIR, dest_sub)
        dest_file = os.path.join(dest_folder, f)
        
        if not os.path.exists(dest_file):
            shutil.copy2(src_file, dest_file)
        copied_counts[dest_sub] = copied_counts.get(dest_sub, 0) + 1

    # Before-after extra copies
    for f in before_after_copies:
        src_file = os.path.join(SOURCE_DIR, f)
        dest_file = os.path.join(before_after_dir, f)
        if os.path.exists(src_file) and not os.path.exists(dest_file):
            shutil.copy2(src_file, dest_file)

    print("Copy complete. Summary:")
    for folder, count in sorted(copied_counts.items()):
        print(f"  {folder}: {count} files")

    # Step 5 — INDEX.md
    index_md_path = os.path.join(OUTPUT_DIR, "INDEX.md")
    print(f"Writing {index_md_path}...")

    total_sorted = sum(cnt for fld, cnt in copied_counts.items() if not fld.startswith("_"))
    total_dup = copied_counts.get("_duplicates", 0)
    total_rev = copied_counts.get("_review", 0)
    total_all = total_sorted + total_dup + total_rev

    assert total_all == 1583, f"Total files mismatch: {total_all} != 1583"

    lines = []
    lines.append("# VILL Portfolio Image Index\n")
    lines.append(f"**Total Source Files**: {len(raw_source_files)} | **Sorted in Folders**: {total_sorted} | **Duplicates**: {total_dup} | **Review**: {total_rev}\n")
    lines.append(f"**Validation Total**: {total_sorted} + {total_dup} + {total_rev} = {total_all} (Exact match: 1583/1583)\n\n")

    lines.append("## Folders Overview\n")
    lines.append("| Folder Name | Count | Space / Stage | Date Range | Description |")
    lines.append("|---|---|---|---|---|")

    for fld_name in sorted([f for f in copied_counts if not f.startswith("_")]):
        info = folder_descriptions.get(fld_name, {})
        cnt = copied_counts.get(fld_name, 0)
        desc = info.get("description", "-")
        space_stage = f"{info.get('space_type', '-')}, {info.get('stage', '-')}"
        dates = sorted(list(info.get("dates", [])))
        date_range = f"{dates[0]} to {dates[-1]}" if len(dates) > 1 else (dates[0] if dates else "-")
        lines.append(f"| `{fld_name}` | {cnt} | {space_stage} | {date_range} | {desc} |")

    lines.append(f"| `_duplicates` | {total_dup} | Duplicates | - | Exact & near duplicates separated by hash/pHash |")
    lines.append(f"| `_review` | {total_rev} | Review | - | Screenshots, web downloads, catalog renders, and flyers |")
    lines.append(f"| `_before-after` | {len(before_after_copies)} | Pairs | - | Copies of clear before/after transformation pairs |")
    lines.append("\n")

    lines.append("## Detailed File Index\n")
    lines.append("| Original File Name | Assigned Folder | Group ID | Model Space Tag | Date | Dimensions |")
    lines.append("|---|---|---|---|---|---|")

    # Map file to group_id
    file_to_gid = {}
    for g in clusters_data:
        for fname in g["files"]:
            file_to_gid[fname] = g["group_id"]

    for fname in raw_source_files:
        fld = file_placement.get(fname, "_review")
        finfo = file_info_map.get(fname, {})
        gid = file_to_gid.get(fname, "-")
        tag = finfo.get("space_tag", "-")
        score = finfo.get("space_score", 0.0)
        dt = finfo.get("date", "-")
        dims = f"{finfo.get('width', 0)}x{finfo.get('height', 0)}"
        lines.append(f"| `{fname}` | `{fld}` | {gid} | {tag} ({score:.2f}) | {dt} | {dims} |")

    with open(index_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"INDEX.md successfully created with {len(raw_source_files)} file rows.")

if __name__ == "__main__":
    main()
