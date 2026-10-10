"""
Grouping, burst clustering, duplicate separation, and contact sheet generation.
Subcommand: photobank.py group <bank> [--profile <name>]

Generates:
- <bank>/_work/clusters.json
- <bank>/_work/progress.md
- <bank>/_work/sheets/G001.jpg, G002.jpg, ...
"""

import os
import sys
import json
import datetime
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
import imagehash
from sklearn.cluster import AgglomerativeClustering

try:
    from .profiles import load_profile
except (ImportError, ValueError):
    from profiles import load_profile

def get_fonts():
    font_paths = [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibri.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                title_font = ImageFont.truetype(p, 26)
                body_font = ImageFont.truetype(p, 14)
                sub_font = ImageFont.truetype(p, 12)
                return title_font, body_font, sub_font
            except Exception:
                pass
    def_font = ImageFont.load_default()
    return def_font, def_font, def_font

def create_contact_sheet(group_info, files_dict, output_path, fonts, bank_dir):
    title_font, body_font, sub_font = fonts
    group_id = group_info["group_id"]
    file_names = group_info["files"]
    date_range = group_info["date_range"]
    top_tags = ", ".join(group_info.get("top_space_tags", []))
    dup_count = len(group_info.get("duplicates", []))

    num_files = len(file_names)
    cols = 6 if num_files > 15 else (5 if num_files > 8 else 4)
    rows = (num_files + cols - 1) // cols
    if rows == 0:
        rows = 1

    cell_w = 260
    cell_h = 280
    header_h = 100
    margin = 20

    sheet_w = margin * 2 + cols * cell_w
    sheet_h = header_h + rows * cell_h + margin

    sheet = Image.new("RGB", (sheet_w, sheet_h), color=(30, 32, 35))
    draw = ImageDraw.Draw(sheet)

    # Draw header banner
    draw.rectangle([(0, 0), (sheet_w, header_h)], fill=(20, 22, 25))
    header_text = f"Group: {group_id}  |  Count: {num_files} photos  |  Date Range: {date_range}"
    if dup_count > 0:
        header_text += f"  |  Duplicates: {dup_count}"
    draw.text((margin, 18), header_text, font=title_font, fill=(255, 255, 255))

    sub_header = f"Top Categories: {top_tags}" if top_tags else ""
    if sub_header:
        draw.text((margin, 58), sub_header, font=body_font, fill=(200, 210, 225))
    draw.line([(margin, header_h - 10), (sheet_w - margin, header_h - 10)], fill=(60, 65, 75), width=1)

    work_dir = os.path.join(bank_dir, "_work")
    frames_dir = os.path.join(work_dir, "video_frames")

    for i, fname in enumerate(file_names):
        r = i // cols
        c = i % cols
        x0 = margin + c * cell_w
        y0 = header_h + r * cell_h

        thumb_box_w = cell_w - 20
        thumb_box_h = 200

        f_info = files_dict.get(fname, {})
        img_path = f_info.get("path")
        if fname.lower().endswith('.mp4'):
            safe_frame_name = fname.replace('/', '_').replace('\\', '_') + ".jpg"
            alt_frame = os.path.join(frames_dir, safe_frame_name)
            if os.path.exists(alt_frame):
                img_path = alt_frame

        try:
            with Image.open(img_path) as im:
                im_t = ImageOps.exif_transpose(im)
                im_rgb = im_t.convert("RGB")
                im_rgb.thumbnail((thumb_box_w, thumb_box_h), Image.Resampling.LANCZOS)
                tw, th = im_rgb.size
                tx = x0 + 10 + (thumb_box_w - tw) // 2
                ty = y0 + 10 + (thumb_box_h - th) // 2
                sheet.paste(im_rgb, (tx, ty))
                draw.rectangle([(tx - 1, ty - 1), (tx + tw, ty + th)], outline=(70, 75, 85), width=1)
        except Exception as e:
            draw.rectangle([(x0 + 10, y0 + 10), (x0 + 10 + thumb_box_w, y0 + 10 + thumb_box_h)], fill=(50, 20, 20))
            draw.text((x0 + 20, y0 + 50), f"Error loading:\n{e}", font=sub_font, fill=(255, 150, 150))

        tag = f_info.get("space_tag", "")
        score = f_info.get("space_score", 0.0)
        is_dup = f_info.get("is_duplicate", False)

        lbl_idx = f"[{i}] {fname}"
        if len(lbl_idx) > 28:
            lbl_idx = lbl_idx[:25] + "..."
        draw.text((x0 + 10, y0 + thumb_box_h + 15), lbl_idx, font=body_font, fill=(255, 230, 100) if not is_dup else (180, 180, 180))

        tag_str = f"Tag: {tag} ({score:.2f})" if tag else ""
        if is_dup:
            tag_str += " [DUP]"
        draw.text((x0 + 10, y0 + thumb_box_h + 38), tag_str, font=sub_font, fill=(160, 200, 255))

    sheet.save(output_path, quality=90)

def run_group(bank_dir, profile_name="generic"):
    bank_dir = os.path.abspath(bank_dir)
    work_dir = os.path.join(bank_dir, "_work")
    sheets_dir = os.path.join(work_dir, "sheets")
    os.makedirs(sheets_dir, exist_ok=True)

    files_cache_path = os.path.join(work_dir, "files.json")
    emb_cache_path = os.path.join(work_dir, "embeddings.npy")

    if not os.path.exists(files_cache_path) or not os.path.exists(emb_cache_path):
        print(f"[Group] Error: Missing {files_cache_path} or {emb_cache_path}. Run 'embed' first.")
        sys.exit(1)

    with open(files_cache_path, "r", encoding="utf-8") as f:
        files_data = json.load(f)
    embeddings = np.load(emb_cache_path)

    print(f"[Group] Loaded {len(files_data)} files and embeddings {embeddings.shape}")

    # 1. Duplicate Detection
    print("[Group] Detecting exact and near duplicates...")
    n = len(files_data)
    sha_map = {}
    for idx, f in enumerate(files_data):
        sha_map.setdefault(f.get("sha256", ""), []).append(idx)

    phashes = [imagehash.hex_to_hash(f.get("phash", "0"*16)) for f in files_data]
    adj = {i: set() for i in range(n)}

    # Connect exact hash
    for sha, indices in sha_map.items():
        if sha and len(indices) > 1:
            for i in indices:
                for j in indices:
                    if i != j:
                        adj[i].add(j)

    # Connect near duplicates (phash <= 4)
    for i in range(n):
        phi = phashes[i]
        for j in range(i + 1, n):
            dist = phi - phashes[j]
            if dist <= 4:
                adj[i].add(j)
                adj[j].add(i)

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

    duplicate_files = set()
    for comp in dup_components:
        comp_sorted = sorted(comp, key=lambda idx: (files_data[idx].get("width", 0) * files_data[idx].get("height", 0), files_data[idx].get("sharpness", 0)), reverse=True)
        keeper_idx = comp_sorted[0]
        keeper_name = files_data[keeper_idx]["name"]
        dups = [files_data[idx]["name"] for idx in comp_sorted[1:]]

        for idx in comp_sorted[1:]:
            duplicate_files.add(files_data[idx]["name"])
            files_data[idx]["is_duplicate"] = True
            files_data[idx]["duplicate_of"] = keeper_name

        files_data[keeper_idx]["is_duplicate"] = False
        files_data[keeper_idx]["duplicates_of_this"] = dups

    print(f"[Group] Duplicate components: {len(dup_components)}, duplicate files identified: {len(duplicate_files)}")

    # 2. Time bursts & clustering
    print("[Group] Building time bursts...")
    sorted_files = sorted(files_data, key=lambda x: x["timestamp"])

    bursts = []
    curr_burst = [sorted_files[0]]
    for item in sorted_files[1:]:
        prev_item = curr_burst[-1]
        prev_dt = datetime.datetime.fromisoformat(prev_item["timestamp"])
        curr_dt = datetime.datetime.fromisoformat(item["timestamp"])
        if curr_dt.date() != prev_dt.date() or (curr_dt - prev_dt).total_seconds() > 45 * 60:
            bursts.append(curr_burst)
            curr_burst = [item]
        else:
            curr_burst.append(item)
    if curr_burst:
        bursts.append(curr_burst)

    groups = [[f for f in b] for b in bursts]

    def get_mean(g):
        idx = [f['index'] for f in g]
        m = np.mean(embeddings[idx], axis=0)
        norm = np.linalg.norm(m)
        return m / (norm if norm > 1e-6 else 1.0)

    # Merge same-date bursts if close
    i = 0
    while i < len(groups):
        g1 = groups[i]
        m1 = get_mean(g1)
        d1 = g1[0]['date']
        j = i + 1
        while j < len(groups):
            g2 = groups[j]
            d2 = g2[0]['date']
            if d1 == d2:
                m2 = get_mean(g2)
                sim = float(np.dot(m1, m2))
                if sim >= 0.75 and len(g1) + len(g2) <= 38:
                    g1.extend(g2)
                    groups.pop(j)
                    m1 = get_mean(g1)
                    continue
            j += 1
        i += 1

    # Merge cross-date bursts if very close (cosine >= 0.88)
    i = 0
    while i < len(groups):
        g1 = groups[i]
        m1 = get_mean(g1)
        best_j = None
        best_sim = 0.88
        for j in range(i + 1, len(groups)):
            g2 = groups[j]
            if len(g1) + len(g2) <= 38:
                m2 = get_mean(g2)
                sim = float(np.dot(m1, m2))
                if sim >= best_sim:
                    best_sim = sim
                    best_j = j
        if best_j is not None:
            groups[i].extend(groups[best_j])
            groups.pop(best_j)
        else:
            i += 1

    # Merge small groups (< 5 photos)
    for pass_num in range(3):
        i = 0
        while i < len(groups):
            if len(groups[i]) < 5:
                g1 = groups[i]
                m1 = get_mean(g1)
                dt1 = datetime.datetime.fromisoformat(g1[0]['timestamp'])
                best_j = None
                best_score = 0.72
                for j in range(len(groups)):
                    if i == j: continue
                    g2 = groups[j]
                    if len(g1) + len(g2) <= 38:
                        m2 = get_mean(g2)
                        sim = float(np.dot(m1, m2))
                        dt2 = datetime.datetime.fromisoformat(g2[0]['timestamp'])
                        days_diff = abs((dt1 - dt2).days)
                        time_bonus = 0.12 if days_diff <= 1 else (0.06 if days_diff <= 7 else (0.02 if days_diff <= 30 else 0.0))
                        score = sim + time_bonus
                        if score > best_score:
                            best_score = score
                            best_j = j
                if best_j is not None:
                    groups[best_j].extend(groups[i])
                    groups.pop(i)
                    continue
            i += 1

    # Split groups > 40
    final_groups = []
    def split_recursive(g):
        if len(g) <= 40:
            final_groups.append(g)
        else:
            num_parts = int(np.ceil(len(g) / 35.0))
            g_idx = [f['index'] for f in g]
            ac = AgglomerativeClustering(n_clusters=num_parts, metric='cosine', linkage='average')
            lbls = ac.fit_predict(embeddings[g_idx])
            for p in range(num_parts):
                p_files = [g[k] for k in range(len(g)) if lbls[k] == p]
                if p_files:
                    split_recursive(p_files)

    for g in groups:
        split_recursive(g)

    final_groups.sort(key=lambda g: g[0]["timestamp"])

    clusters_json = []
    group_sizes = []
    for g_num, g in enumerate(final_groups, 1):
        gid = f"G{g_num:03d}"
        g_files = [f["name"] for f in g]
        dates = [f["date"] for f in g]
        min_date = min(dates)
        max_date = max(dates)
        date_range = min_date if min_date == max_date else f"{min_date} to {max_date}"

        space_counts = {}
        for f in g:
            st = f.get("space_tag", "other")
            space_counts[st] = space_counts.get(st, 0) + 1
        sorted_spaces = sorted(space_counts.items(), key=lambda x: x[1], reverse=True)
        top_space_tags = [f"{st} ({cnt})" for st, cnt in sorted_spaces[:3]]

        g_dups = []
        for f in g:
            if f.get("is_duplicate", False):
                g_dups.append(f["name"])
            elif "duplicates_of_this" in f:
                g_dups.extend(f["duplicates_of_this"])

        clusters_json.append({
            "group_id": gid,
            "count": len(g),
            "date_range": date_range,
            "min_date": min_date,
            "max_date": max_date,
            "top_space_tags": top_space_tags,
            "files": g_files,
            "duplicates": sorted(list(set(g_dups)))
        })
        group_sizes.append(len(g))

    clusters_path = os.path.join(work_dir, "clusters.json")
    with open(clusters_path, "w", encoding="utf-8") as f:
        json.dump(clusters_json, f, indent=2, ensure_ascii=False)

    # Update files.json with duplicate flags
    with open(files_cache_path, "w", encoding="utf-8") as f:
        json.dump(files_data, f, indent=2, ensure_ascii=False)

    # Progress markdown
    progress_path = os.path.join(work_dir, "progress.md")
    size_5_40 = sum(1 for s in group_sizes if 5 <= s <= 40)
    size_under_5 = sum(1 for s in group_sizes if s < 5)
    size_over_40 = sum(1 for s in group_sizes if s > 40)
    total_g = len(final_groups)

    summary_content = f"""# Photo Bank Clustering Progress

## Summary
- **Total Files**: {len(files_data)}
- **Duplicates Identified**: {len(duplicate_files)}
- **Groups Created**: {total_g}
- **Group Size Distribution**:
  - 5 to 40 photos: {size_5_40} ({size_5_40/total_g*100:.1f}%)
  - Under 5 photos: {size_under_5} ({size_under_5/total_g*100:.1f}%)
  - Over 40 photos: {size_over_40} ({size_over_40/total_g*100:.1f}%)
  - Min size: {min(group_sizes) if group_sizes else 0}
  - Max size: {max(group_sizes) if group_sizes else 0}
  - Median size: {sorted(group_sizes)[len(group_sizes)//2] if group_sizes else 0}

## Status
- `clusters.json`: Ready ({total_g} groups)
- Contact sheets: Generating...
"""
    with open(progress_path, "w", encoding="utf-8") as f:
        f.write(summary_content)

    print(f"[Group] Saved {total_g} clusters to {clusters_path}")

    # Generate Contact Sheets
    print(f"[Group] Generating contact sheets for {total_g} groups...")
    files_dict = {f["name"]: f for f in files_data}
    fonts = get_fonts()

    for idx, g in enumerate(clusters_json):
        gid = g["group_id"]
        out_sheet = os.path.join(sheets_dir, f"{gid}.jpg")
        create_contact_sheet(g, files_dict, out_sheet, fonts, bank_dir)
        if (idx + 1) % 10 == 0 or idx == len(clusters_json) - 1:
            print(f"[Group] Sheets: {idx + 1}/{len(clusters_json)} generated...")

    print(f"[Group] All contact sheets generated in {sheets_dir}")
