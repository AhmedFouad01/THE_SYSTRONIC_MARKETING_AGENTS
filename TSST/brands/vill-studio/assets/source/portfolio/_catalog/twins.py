"""
VILL Portfolio - Near-Twin Detection Module
Step 3 Fix: Identifies near-identical photo takes within each folder:
  - Same folder
  - Taken <= 2 minutes apart (<= 120 seconds)
  - AND open_clip embedding cosine similarity >= 0.93

Outputs:
  twin_groups.json: detailed grouping metadata with primary selection (highest ai_score)
"""

import os
import sys
import json
import datetime
import numpy as np
from collections import defaultdict

REPO_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
PORTFOLIO_DIR = os.path.join(REPO_DIR, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
WORK_DIR = os.path.join(PORTFOLIO_DIR, "_work")
CATALOG_DIR = os.path.join(PORTFOLIO_DIR, "_catalog")

def compute_twins():
    # Load files.json and scores.json
    with open(os.path.join(WORK_DIR, "files.json"), "r", encoding="utf-8") as f:
        files_data = json.load(f)
    with open(os.path.join(CATALOG_DIR, "scores.json"), "r", encoding="utf-8") as f:
        scores_data = json.load(f)

    # Load file to folder mapping from INDEX.md
    index_path = os.path.join(PORTFOLIO_DIR, "INDEX.md")
    with open(index_path, "r", encoding="utf-8") as f:
        text = f.read()
    _, detailed = text.split("## Detailed File Index")

    file_to_folder = {}
    for line in detailed.splitlines():
        line = line.strip()
        if line.startswith("| `"):
            parts = [p.strip().replace("`", "") for p in line.split("|")[1:-1]]
            if len(parts) >= 2 and parts[0] != "Original File Name":
                file_to_folder[parts[0]] = parts[1]

    # Filter out _duplicates
    catalog_files = [f for f in files_data if file_to_folder.get(f["name"]) != "_duplicates"]

    embeddings = np.load(os.path.join(WORK_DIR, "embeddings.npy"))

    file_info = {}
    for f in catalog_files:
        fname = f["name"]
        ts_str = f.get("timestamp")
        try:
            ts = datetime.datetime.fromisoformat(ts_str)
        except Exception:
            ts = None
        file_info[fname] = {
            "index": f["index"],
            "ts": ts,
            "folder": file_to_folder.get(fname),
            "score": scores_data.get(fname, {}).get("ai_score", 0.0),
            "sharpness": f.get("sharpness", 0.0)
        }

    # Group files by folder
    by_folder = defaultdict(list)
    for fname, inf in file_info.items():
        by_folder[inf["folder"]].append(fname)

    # Find twin pairs
    adj = defaultdict(set)
    pairs_count = 0

    for fld, fnames in by_folder.items():
        n = len(fnames)
        for i in range(n):
            fn1 = fnames[i]
            inf1 = file_info[fn1]
            t1, idx1 = inf1["ts"], inf1["index"]
            if t1 is None:
                continue
            for j in range(i + 1, n):
                fn2 = fnames[j]
                inf2 = file_info[fn2]
                t2, idx2 = inf2["ts"], inf2["index"]
                if t2 is None:
                    continue
                if abs((t1 - t2).total_seconds()) <= 120.0:
                    sim = float(np.dot(embeddings[idx1], embeddings[idx2]))
                    if sim >= 0.93:
                        adj[fn1].add(fn2)
                        adj[fn2].add(fn1)
                        pairs_count += 1

    # Form connected components
    visited = set()
    raw_groups = []
    for fname in sorted(adj.keys()):
        if fname not in visited:
            comp = []
            q = [fname]
            visited.add(fname)
            while q:
                curr = q.pop(0)
                comp.append(curr)
                for neigh in sorted(adj[curr]):
                    if neigh not in visited:
                        visited.add(neigh)
                        q.append(neigh)
            raw_groups.append(comp)

    # Sort groups deterministically by earliest timestamp
    raw_groups.sort(key=lambda g: min(file_info[fn]["ts"] for fn in g))

    twin_map = {}
    group_summaries = []

    for g_idx, comp in enumerate(raw_groups, 1):
        gid = f"TWIN_{g_idx:03d}"
        fld = file_info[comp[0]]["folder"]
        
        # Sort members: highest ai_score first, tie break with sharpness, then filename
        comp.sort(key=lambda fn: (file_info[fn]["score"], file_info[fn]["sharpness"], fn), reverse=True)
        primary = comp[0]
        
        group_summaries.append({
            "group_id": gid,
            "folder": fld,
            "size": len(comp),
            "primary": primary,
            "primary_score": file_info[primary]["score"],
            "members": comp
        })

        for fn in comp:
            twin_map[fn] = {
                "twin_group": gid,
                "is_primary": (fn == primary),
                "primary": primary,
                "group_size": len(comp),
                "twin_count": len(comp) - 1,
                "twins": [x for x in comp if x != fn]
            }

    print(f"Twin detection complete:")
    print(f"  Pairs found: {pairs_count}")
    print(f"  Groups formed: {len(raw_groups)}")
    print(f"  Total photos in twin groups: {len(twin_map)}")
    print(f"  Total hidden twin cards: {sum(len(g) - 1 for g in raw_groups)}")

    # Save to JSON
    out_data = {
        "summary": {
            "total_pairs": pairs_count,
            "total_groups": len(raw_groups),
            "total_photos_in_groups": len(twin_map),
            "total_hidden_cards": sum(len(g) - 1 for g in raw_groups)
        },
        "groups": group_summaries,
        "file_map": twin_map
    }

    out_path = os.path.join(CATALOG_DIR, "twin_groups.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_data, f, indent=2)
    print(f"Saved twin groups data to {out_path}")
    return out_data

if __name__ == "__main__":
    compute_twins()
