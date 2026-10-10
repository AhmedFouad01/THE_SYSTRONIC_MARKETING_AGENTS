"""
Sorting and copy engine for TSST Photo Bank.
Subcommand: photobank.py sort <bank> --labels <json>

Copies media from read-only sources into:
- <bank>/<named_folders>/
- <bank>/_duplicates/
- <bank>/_review/
- <bank>/_before-after/
Generates:
- <bank>/INDEX.md
"""

import os
import sys
import json
import shutil

def run_sort(bank_dir, labels_path=None):
    bank_dir = os.path.abspath(bank_dir)
    work_dir = os.path.join(bank_dir, "_work")

    if not labels_path:
        labels_path = os.path.join(work_dir, "labels.json")

    if not os.path.exists(labels_path):
        print(f"[Sort] Error: Labels file '{labels_path}' not found.")
        print("  Naming folders from contact sheets is a human/agent step.")
        print(f"  Provide labels with: photobank.py sort \"{bank_dir}\" --labels <path/to/labels.json>")
        sys.exit(1)

    clusters_path = os.path.join(work_dir, "clusters.json")
    files_path = os.path.join(work_dir, "files.json")

    if not os.path.exists(clusters_path) or not os.path.exists(files_path):
        print(f"[Sort] Error: Missing clusters.json or files.json in {work_dir}. Run 'embed' and 'group' first.")
        sys.exit(1)

    with open(labels_path, "r", encoding="utf-8") as f:
        labels_data = json.load(f)
    with open(clusters_path, "r", encoding="utf-8") as f:
        clusters_data = json.load(f)
    with open(files_path, "r", encoding="utf-8") as f:
        files_data = json.load(f)

    file_info_map = {f["name"]: f for f in files_data}

    dup_dir = os.path.join(bank_dir, "_duplicates")
    review_dir = os.path.join(bank_dir, "_review")
    before_after_dir = os.path.join(bank_dir, "_before-after")

    os.makedirs(dup_dir, exist_ok=True)
    os.makedirs(review_dir, exist_ok=True)
    os.makedirs(before_after_dir, exist_ok=True)

    file_placement = {}
    before_after_copies = set()

    duplicates = set()
    for c in clusters_data:
        for d in c.get("duplicates", []):
            duplicates.add(d)
    for f in files_data:
        if f.get("is_duplicate", False):
            duplicates.add(f["name"])

    folder_descriptions = {}
    group_files_map = {g["group_id"]: g["files"] for g in clusters_data}

    for gid, linfo in labels_data.items():
        folder_name = linfo.get("folder_name")
        if not folder_name:
            continue

        if not folder_name.startswith("_"):
            folder_path = os.path.join(bank_dir, folder_name)
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

    for f_rec in files_data:
        fname = f_rec["name"]
        if fname not in file_placement:
            if fname in duplicates:
                file_placement[fname] = "_duplicates"
            else:
                file_placement[fname] = "_review"

    print(f"[Sort] Copying {len(file_placement)} files to destinations (sources are read-only)...")
    copied_counts = {}
    for fname, dest_sub in file_placement.items():
        f_info = file_info_map.get(fname, {})
        src_file = f_info.get("path")
        if not src_file or not os.path.exists(src_file):
            print(f"[Sort] Warning: Source file for {fname} not found at {src_file}")
            continue

        dest_folder = os.path.join(bank_dir, dest_sub)
        os.makedirs(dest_folder, exist_ok=True)
        dest_file = os.path.join(dest_folder, os.path.basename(fname))

        if not os.path.exists(dest_file):
            shutil.copy2(src_file, dest_file)
        copied_counts[dest_sub] = copied_counts.get(dest_sub, 0) + 1

    for fname in before_after_copies:
        f_info = file_info_map.get(fname, {})
        src_file = f_info.get("path")
        if src_file and os.path.exists(src_file):
            dest_file = os.path.join(before_after_dir, os.path.basename(fname))
            if not os.path.exists(dest_file):
                shutil.copy2(src_file, dest_file)

    print("[Sort] Copy complete. Folder summary:")
    for folder, count in sorted(copied_counts.items()):
        print(f"  {folder}: {count} files")

    # Generate INDEX.md
    index_md_path = os.path.join(bank_dir, "INDEX.md")
    print(f"[Sort] Writing {index_md_path}...")

    total_sorted = sum(cnt for fld, cnt in copied_counts.items() if not fld.startswith("_"))
    total_dup = copied_counts.get("_duplicates", 0)
    total_rev = copied_counts.get("_review", 0)
    total_all = total_sorted + total_dup + total_rev

    lines = []
    lines.append("# Photo Bank Asset Index\n")
    lines.append(f"**Total Source Files**: {len(files_data)} | **Sorted in Folders**: {total_sorted} | **Duplicates**: {total_dup} | **Review**: {total_rev}\n")
    lines.append(f"**Validation Total**: {total_sorted} + {total_dup} + {total_rev} = {total_all}\n\n")

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

    file_to_gid = {}
    for g in clusters_data:
        for fname in g["files"]:
            file_to_gid[fname] = g["group_id"]

    for f_rec in files_data:
        fname = f_rec["name"]
        fld = file_placement.get(fname, "_review")
        gid = file_to_gid.get(fname, "-")
        tag = f_rec.get("space_tag", "-")
        score = f_rec.get("space_score", 0.0)
        dt = f_rec.get("date", "-")
        dims = f"{f_rec.get('width', 0)}x{f_rec.get('height', 0)}"
        lines.append(f"| `{fname}` | `{fld}` | {gid} | {tag} ({score:.2f}) | {dt} | {dims} |")

    with open(index_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"[Sort] INDEX.md successfully generated with {len(files_data)} file entries.")
