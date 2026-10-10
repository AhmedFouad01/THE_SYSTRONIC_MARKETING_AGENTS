"""
Duplicate detection utility for TSST Photo Bank.
Subcommand: photobank.py dupes <folder>

Scans any folder for exact (SHA-256) and near (pHash Hamming distance <= 4) duplicates.
No bank setup required. Output is printed to stdout.
"""

import os
import sys
import hashlib
import numpy as np
from PIL import Image, ImageOps
import imagehash

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}

def get_file_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def compute_sharpness(img_gray):
    arr = np.array(img_gray, dtype=np.float32)
    if arr.shape[0] < 3 or arr.shape[1] < 3:
        return 0.0
    lap = arr[:-2, 1:-1] + arr[2:, 1:-1] + arr[1:-1, :-2] + arr[1:-1, 2:] - 4 * arr[1:-1, 1:-1]
    return float(np.var(lap))

def run_dupes(folder_path):
    folder_path = os.path.abspath(folder_path)
    if not os.path.exists(folder_path):
        print(f"[Dupes] Error: Folder '{folder_path}' does not exist.")
        sys.exit(1)

    print(f"[Dupes] Scanning folder: {folder_path}")
    files = []
    for root, _, fnames in os.walk(folder_path):
        for f in fnames:
            ext = os.path.splitext(f)[1].lower()
            if ext in SUPPORTED_EXTS:
                files.append(os.path.join(root, f))
    files.sort()

    if not files:
        print("[Dupes] No supported image files found in folder.")
        return

    print(f"[Dupes] Processing {len(files)} files for hashes and dimensions...")
    meta = []
    for p in files:
        try:
            sha = get_file_sha256(p)
            with Image.open(p) as im:
                im_t = ImageOps.exif_transpose(im)
                im_rgb = im_t.convert("RGB")
                w, h = im_rgb.size
                ph = imagehash.phash(im_rgb)
                shp = compute_sharpness(im_rgb.convert("L"))
                meta.append({
                    "path": p,
                    "rel_path": os.path.relpath(p, folder_path),
                    "sha": sha,
                    "phash": ph,
                    "width": w,
                    "height": h,
                    "sharpness": shp,
                    "size_bytes": os.path.getsize(p)
                })
        except Exception as e:
            print(f"[Dupes] Warning: Failed to process {p}: {e}")

    n = len(meta)
    adj = {i: set() for i in range(n)}

    # Connect exact
    sha_map = {}
    for idx, m in enumerate(meta):
        sha_map.setdefault(m["sha"], []).append(idx)
    for indices in sha_map.values():
        if len(indices) > 1:
            for i in indices:
                for j in indices:
                    if i != j:
                        adj[i].add(j)

    # Connect near (phash distance <= 4)
    for i in range(n):
        phi = meta[i]["phash"]
        for j in range(i + 1, n):
            dist = phi - meta[j]["phash"]
            if dist <= 4:
                adj[i].add(j)
                adj[j].add(i)

    # Connected components
    visited = set()
    dup_components = []
    for i in range(n):
        if i not in visited and len(adj[i]) > 0:
            comp = []
            queue = [i]
            visited.add(i)
            while queue:
                curr = queue.pop(0)
                comp.append(curr)
                for neighbor in adj[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
            dup_components.append(comp)

    print("\n" + "=" * 80)
    print(f"DUPLICATE DETECTION REPORT — {os.path.basename(folder_path)}")
    print("=" * 80)
    print(f"Total Scanned Files: {n}")
    print(f"Duplicate Groups:    {len(dup_components)}")

    if not dup_components:
        print("\nNo exact or near duplicates found. All files are distinct.\n")
        return

    total_dup_files = sum(len(c) - 1 for c in dup_components)
    total_savings = 0
    print(f"Redundant Files:     {total_dup_files}\n")

    for g_idx, comp in enumerate(dup_components, 1):
        # Sort by resolution, then sharpness
        comp_sorted = sorted(comp, key=lambda idx: (meta[idx]["width"] * meta[idx]["height"], meta[idx]["sharpness"]), reverse=True)
        keeper_idx = comp_sorted[0]
        k = meta[keeper_idx]
        dups = [meta[idx] for idx in comp_sorted[1:]]

        print(f"Group #{g_idx:02d} ({len(comp)} photos):")
        print(f"  [KEEPER]   {k['rel_path']} ({k['width']}x{k['height']} px, sharp: {k['sharpness']:.1f}, {k['size_bytes']/1024:.1f} KB)")
        for d in dups:
            dist = k["phash"] - d["phash"]
            match_type = "EXACT SHA256" if k["sha"] == d["sha"] else f"NEAR pHash (dist={dist})"
            total_savings += d["size_bytes"]
            print(f"  [DUPLICATE] {d['rel_path']} ({d['width']}x{d['height']} px, sharp: {d['sharpness']:.1f}, {match_type})")
        print()

    print(f"Potential Space Recovery: {total_savings / (1024*1024):.2f} MB")
    print("=" * 80 + "\n")
