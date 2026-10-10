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

with open(os.path.join(CATALOG_DIR, "catalog_data.json"), "r", encoding="utf-8") as f:
    catalog_items = json.load(f)

with open(os.path.join(WORK_DIR, "files.json"), "r", encoding="utf-8") as f:
    files_data = json.load(f)

embeddings = np.load(os.path.join(WORK_DIR, "embeddings.npy"))

file_info = {}
for f in files_data:
    ts_str = f.get("timestamp")
    try:
        ts = datetime.datetime.fromisoformat(ts_str)
    except:
        ts = None
    file_info[f["name"]] = {
        "index": f["index"],
        "ts": ts
    }

# Group catalog items by folder
by_folder = defaultdict(list)
for item in catalog_items:
    by_folder[item["folder"]].append(item)

# Build graph of near-twins
adj = defaultdict(set)
pairs_count = 0

for fld, items in by_folder.items():
    n = len(items)
    for i in range(n):
        f1 = items[i]["file"]
        inf1 = file_info[f1]
        t1 = inf1["ts"]
        idx1 = inf1["index"]
        if t1 is None:
            continue
        
        for j in range(i + 1, n):
            f2 = items[j]["file"]
            inf2 = file_info[f2]
            t2 = inf2["ts"]
            idx2 = inf2["index"]
            if t2 is None:
                continue
            
            delta_sec = abs((t1 - t2).total_seconds())
            if delta_sec <= 120.0:
                sim = float(np.dot(embeddings[idx1], embeddings[idx2]))
                if sim >= 0.93:
                    adj[f1].add(f2)
                    adj[f2].add(f1)
                    pairs_count += 1

# Connected components
visited = set()
groups = []
# Sort files for deterministic group order
for f in sorted(adj.keys()):
    if f not in visited:
        comp = []
        q = [f]
        visited.add(f)
        while q:
            curr = q.pop(0)
            comp.append(curr)
            for neighbor in sorted(adj[curr]):
                if neighbor not in visited:
                    visited.add(neighbor)
                    q.append(neighbor)
        groups.append(sorted(comp))

print(f"Total near-twin pairs found: {pairs_count}")
print(f"Total twin groups formed: {len(groups)}")
total_in_groups = sum(len(g) for g in groups)
print(f"Total photos in twin groups: {total_in_groups}")
hidden_count = sum(len(g) - 1 for g in groups)
print(f"Total hidden cards from twins: {hidden_count}")

# Print first 5 groups
for i, g in enumerate(groups[:5], 1):
    fld = next(item["folder"] for item in catalog_items if item["file"] == g[0])
    print(f"\nGroup {i} ({len(g)} photos) in {fld}:")
    for fname in g:
        it = next(item for item in catalog_items if item["file"] == fname)
        print(f"   {fname} | Score: {it['ai_score']} | Time: {file_info[fname]['ts']}")
