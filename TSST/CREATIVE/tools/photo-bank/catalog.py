"""
Master catalog generation engine for TSST Photo Bank.
Subcommand: photobank.py catalog <bank> [--profile <name>]

Executes:
1. Thumbnails (320px) & pixel stats (luminance, clipping, dominant color)
2. Zero-shot tagging (piece, material, stage, angle) with profile prompts
3. Explainable AI-source score (1-5 composite) with profile weights
4. Near-twin take detection (folder, <= 120s, cosine >= 0.93)
5. CATALOG.csv and catalog_data.json
6. BANK.html (luxury offline visual browser)
7. STUDIO_PICKS.md (top 5 photos per piece category)
"""

import os
import sys
import csv
import json
import datetime
import concurrent.futures
import numpy as np
import torch
import open_clip
from PIL import Image, ImageOps
from collections import defaultdict

try:
    from .profiles import load_profile
    from .html_template import generate_bank_html_content
except (ImportError, ValueError):
    from profiles import load_profile
    from html_template import generate_bank_html_content

def encode_prompt_dict(prompt_dict, model, tokenizer, device):
    keys = list(prompt_dict.keys())
    features = []
    with torch.no_grad():
        for k in keys:
            prompts = prompt_dict[k]
            tokens = tokenizer(prompts).to(device)
            f = model.encode_text(tokens)
            f /= f.norm(dim=-1, keepdim=True)
            mean_f = f.mean(dim=0, keepdim=True)
            mean_f /= mean_f.norm(dim=-1, keepdim=True)
            features.append(mean_f.cpu().numpy())
    return keys, np.vstack(features)

def classify_zero_shot(embeddings, keys, text_features):
    sims = np.dot(embeddings, text_features.T)
    results = []
    for i in range(len(embeddings)):
        row = sims[i]
        top_idx = int(np.argmax(row))
        top_tag = keys[top_idx]
        top_score = float(row[top_idx])
        
        sorted_indices = np.argsort(row)[::-1]
        top2_idx = int(sorted_indices[1]) if len(sorted_indices) > 1 else top_idx
        top2_tag = keys[top2_idx]
        top2_score = float(row[top2_idx])
        
        results.append({
            "top_tag": top_tag,
            "top_score": top_score,
            "top2_tag": top2_tag,
            "top2_score": top2_score
        })
    return results

def compute_color_and_stats(im_rgb):
    # Exposure stats
    im_256 = im_rgb.resize((256, 256), Image.Resampling.BILINEAR)
    arr = np.array(im_256)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    mean_lum = float(np.mean(lum))
    clip_ratio = float(np.mean((lum < 12) | (lum > 245)))

    # Color extraction
    hsv = np.array(im_256.convert("HSV"))
    h = hsv[:, :, 0] * (360.0 / 255.0)
    s = hsv[:, :, 1] / 255.0
    v = hsv[:, :, 2] / 255.0

    m_y, m_x = int(256 * 0.15), int(256 * 0.15)
    center = np.zeros((256, 256), dtype=bool)
    center[m_y:-m_y, m_x:-m_x] = True
    border = ~center

    ch, cs, cv = h[center], s[center], v[center]
    bh, bs, bv = h[border], s[border], v[border]

    def bin_pixels(ph, ps, pv):
        counts = {}
        n = len(ph)
        for i in range(n):
            h_val, s_val, v_val = ph[i], ps[i], pv[i]
            if v_val < 0.22 or (s_val < 0.20 and v_val < 0.26):
                cname = "black"
            elif s_val < 0.14 and v_val >= 0.80:
                cname = "white"
            elif s_val < 0.16:
                cname = "grey"
            elif 25 <= h_val < 55 and s_val < 0.38 and v_val >= 0.65:
                cname = "beige/cream"
            elif 15 <= h_val < 45 and s_val >= 0.22 and 0.18 <= v_val < 0.68:
                cname = "brown/wood"
            elif 165 <= h_val < 200 and s_val >= 0.20 and v_val >= 0.22:
                cname = "turquoise"
            elif 200 <= h_val < 255 and s_val >= 0.22:
                cname = "navy/blue"
            elif 75 <= h_val < 165 and s_val >= 0.20 and v_val >= 0.20:
                cname = "green/emerald"
            elif 45 <= h_val < 70 and s_val >= 0.40 and v_val >= 0.50:
                cname = "gold/yellow"
            elif (h_val >= 345 or h_val < 15) and s_val >= 0.30:
                cname = "red/burgundy"
            elif (315 <= h_val < 345 and s_val >= 0.20 and v_val >= 0.55) or ((h_val >= 345 or h_val < 15) and s_val < 0.40 and v_val >= 0.72):
                cname = "pink"
            elif 255 <= h_val < 315 and s_val >= 0.22:
                cname = "purple"
            elif 15 <= h_val < 40 and s_val >= 0.45 and v_val >= 0.65:
                cname = "orange"
            else:
                cname = "grey" if s_val < 0.25 else "brown/wood"
            counts[cname] = counts.get(cname, 0) + 1
        return {k: v / n for k, v in counts.items()}

    c_freqs = bin_pixels(ch, cs, cv)
    b_freqs = bin_pixels(bh, bs, bv)

    excess = {col: cf - 0.7 * b_freqs.get(col, 0.0) for col, cf in c_freqs.items()}
    chromatic_cols = ["turquoise", "navy/blue", "green/emerald", "gold/yellow", "red/burgundy", "pink", "purple", "orange"]
    strong_chromatic = [(c, c_freqs[c]) for c in chromatic_cols if c_freqs.get(c, 0.0) >= 0.08 and excess.get(c, 0.0) > 0.03]

    if strong_chromatic:
        dom_color = max(strong_chromatic, key=lambda x: x[1])[0]
    else:
        candidates = [(c, cf) for c, cf in c_freqs.items() if b_freqs.get(c, 0.0) < 0.65 or cf > 0.40]
        if candidates:
            dom_color = max(candidates, key=lambda x: x[1])[0]
        else:
            dom_color = max(c_freqs.items(), key=lambda x: x[1])[0]

    return {
        "color": dom_color,
        "mean_lum": mean_lum,
        "clip_ratio": clip_ratio
    }

def make_studio_pick_why(item):
    p = item.get("parts", {})
    shp_val = p.get("sharpness", 3.0)
    exp_val = p.get("exposure", 3.0)
    clut_val = p.get("clutter", 3.0)
    dom_val = p.get("dominance", 3.0)
    mat = item.get("m", "product")
    col = item.get("c", "neutral")
    piece = item.get("p", "item")
    stage = item.get("s", "finished")
    angle = item.get("a", "three-quarter")

    reasons = []
    if dom_val >= 4.0:
        reasons.append("prominent hero framing dominating the shot")
    elif angle in ["three-quarter", "front"]:
        reasons.append(f"clean {angle} perspective")

    if clut_val >= 4.0:
        reasons.append("clutter-free background staging")
    elif "finished" in stage or "handover" in stage:
        reasons.append("completed final presentation")
    elif "installation" in stage:
        reasons.append("on-site installation craftsmanship")
    elif "workshop" in stage or "raw" in stage:
        reasons.append("raw fabrication details")

    if shp_val >= 4.0:
        reasons.append("tack-sharp craftsmanship details")
    elif shp_val >= 3.0:
        reasons.append("crisp edge definition")

    if exp_val >= 4.0:
        reasons.append("balanced studio lighting")

    why_str = f"High-resolution {mat} {piece} in {col} with " + ", and ".join(reasons[:2]) + "."
    return why_str

def run_catalog(bank_dir, profile_name="generic"):
    bank_dir = os.path.abspath(bank_dir)
    work_dir = os.path.join(bank_dir, "_work")
    catalog_dir = os.path.join(bank_dir, "_catalog")
    thumbs_dir = os.path.join(catalog_dir, "thumbs")
    frames_dir = os.path.join(work_dir, "video_frames")

    os.makedirs(catalog_dir, exist_ok=True)
    os.makedirs(thumbs_dir, exist_ok=True)

    profile = load_profile(profile_name)
    print(f"[Catalog] Bank folder: {bank_dir}")
    print(f"[Catalog] Profile:     {profile['_profile_name']} ({profile['brand_name']})")

    files_path = os.path.join(work_dir, "files.json")
    emb_path = os.path.join(work_dir, "embeddings.npy")

    if not os.path.exists(files_path) or not os.path.exists(emb_path):
        print(f"[Catalog] Error: Missing files.json or embeddings.npy in {work_dir}. Run 'embed' first.")
        sys.exit(1)

    with open(files_path, "r", encoding="utf-8") as f:
        files_data = json.load(f)
    embeddings = np.load(emb_path)

    # 1. Resolve folder placement (from INDEX.md or fallback)
    index_path = os.path.join(bank_dir, "INDEX.md")
    folder_notes = {}
    file_to_folder = {}

    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            index_text = f.read()
        if "## Detailed File Index" in index_text:
            overview_sec, detailed_sec = index_text.split("## Detailed File Index")
            for line in overview_sec.splitlines():
                line = line.strip()
                if line.startswith("| `"):
                    parts = [p.strip().replace("`", "") for p in line.split("|")[1:-1]]
                    if len(parts) >= 5 and parts[0] != "Folder Name":
                        folder_notes[parts[0]] = parts[4]

            for line in detailed_sec.splitlines():
                line = line.strip()
                if line.startswith("| `"):
                    parts = [p.strip().replace("`", "") for p in line.split("|")[1:-1]]
                    if len(parts) >= 2 and parts[0] != "Original File Name":
                        file_to_folder[parts[0]] = parts[1]

    # Fallback if INDEX.md was not present or some files unmapped
    for f in files_data:
        fname = f["name"]
        if fname not in file_to_folder:
            if f.get("is_duplicate", False):
                file_to_folder[fname] = "_duplicates"
            else:
                file_to_folder[fname] = "raw"

    # Catalog files: skip _duplicates
    catalog_files = [f for f in files_data if file_to_folder.get(f["name"]) != "_duplicates"]
    print(f"[Catalog] Total catalog files to process: {len(catalog_files)} (skipping {len(files_data) - len(catalog_files)} duplicates)")

    # 2. Extract thumbnails and pixel stats
    print("[Catalog] Checking thumbnails and pixel stats...")
    pixel_cache_path = os.path.join(catalog_dir, "image_pixel_stats.json")
    pixel_stats = {}
    if os.path.exists(pixel_cache_path):
        try:
            with open(pixel_cache_path, "r", encoding="utf-8") as f:
                pixel_stats = json.load(f)
        except Exception:
            pixel_stats = {}

    def process_thumb_and_pixels(f_rec):
        fname = f_rec["name"]
        stem = os.path.splitext(os.path.basename(fname))[0]
        thumb_path = os.path.join(thumbs_dir, f"{stem}.jpg")

        # Resolve image source on disk
        folder = file_to_folder.get(fname, "")
        local_cand1 = os.path.join(bank_dir, folder, os.path.basename(fname))
        local_cand2 = os.path.join(bank_dir, folder, fname)
        src_cand = f_rec.get("path")

        resolved_img = None
        if os.path.exists(local_cand1):
            resolved_img = local_cand1
        elif os.path.exists(local_cand2):
            resolved_img = local_cand2
        elif src_cand and os.path.exists(src_cand):
            resolved_img = src_cand

        if fname.lower().endswith(".mp4"):
            safe_frame_name = fname.replace('/', '_').replace('\\', '_') + ".jpg"
            alt_frame = os.path.join(frames_dir, safe_frame_name)
            if os.path.exists(alt_frame):
                resolved_img = alt_frame

        cached_stat = pixel_stats.get(fname)
        if cached_stat and os.path.exists(thumb_path):
            return fname, cached_stat

        if not resolved_img or not os.path.exists(resolved_img):
            return fname, {"color": "grey", "mean_lum": 128.0, "clip_ratio": 0.0}

        try:
            with Image.open(resolved_img) as im:
                im = ImageOps.exif_transpose(im).convert("RGB")
                if not os.path.exists(thumb_path):
                    im_thumb = im.copy()
                    im_thumb.thumbnail((320, 320), Image.Resampling.LANCZOS)
                    im_thumb.save(thumb_path, "JPEG", quality=85)
                stats = compute_color_and_stats(im)
                return fname, stats
        except Exception as e:
            print(f"[Catalog] Warning: Error processing pixels for {fname}: {e}")
            return fname, {"color": "grey", "mean_lum": 128.0, "clip_ratio": 0.0}

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        for fname, stats in executor.map(process_thumb_and_pixels, catalog_files):
            pixel_stats[fname] = stats

    with open(pixel_cache_path, "w", encoding="utf-8") as f:
        json.dump(pixel_stats, f, indent=2)

    # 3. Zero-shot Tagging (piece, material, stage, angle)
    print(f"[Catalog] Zero-shot tagging using profile '{profile['_profile_name']}'...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, _ = open_clip.create_model_and_transforms("ViT-L-14", pretrained="openai", device=device)
    tokenizer = open_clip.get_tokenizer("ViT-L-14")
    model.eval()

    p_keys, p_feats = encode_prompt_dict(profile["piece_prompts"], model, tokenizer, device)
    m_keys, m_feats = encode_prompt_dict(profile["material_prompts"], model, tokenizer, device)
    s_keys, s_feats = encode_prompt_dict(profile["stage_prompts"], model, tokenizer, device)
    a_keys, a_feats = encode_prompt_dict(profile["angle_prompts"], model, tokenizer, device)

    # Save prompt embeddings cache
    prompt_cache = {
        "p_keys": p_keys, "p_feats": p_feats.tolist(),
        "m_keys": m_keys, "m_feats": m_feats.tolist(),
        "s_keys": s_keys, "s_feats": s_feats.tolist(),
        "a_keys": a_keys, "a_feats": a_feats.tolist(),
    }
    with open(os.path.join(catalog_dir, "prompt_features.json"), "w", encoding="utf-8") as f:
        json.dump(prompt_cache, f)

    p_res = classify_zero_shot(embeddings, p_keys, p_feats)
    m_res = classify_zero_shot(embeddings, m_keys, m_feats)
    s_res = classify_zero_shot(embeddings, s_keys, s_feats)
    a_res = classify_zero_shot(embeddings, a_keys, a_feats)

    tags_data = {}
    for i, file_rec in enumerate(files_data):
        fname = file_rec["name"]
        pix = pixel_stats.get(fname, {})
        color = pix.get("color", "grey")
        tags_data[fname] = {
            "piece": p_res[i]["top_tag"],
            "piece_score": round(p_res[i]["top_score"], 4),
            "piece_top2": p_res[i]["top2_tag"],
            "piece_top2_score": round(p_res[i]["top2_score"], 4),
            "material": m_res[i]["top_tag"],
            "material_score": round(m_res[i]["top_score"], 4),
            "material_top2": m_res[i]["top2_tag"],
            "material_top2_score": round(m_res[i]["top2_score"], 4),
            "colour": color,
            "stage": s_res[i]["top_tag"],
            "stage_score": round(s_res[i]["top_score"], 4),
            "angle": a_res[i]["top_tag"],
            "angle_score": round(a_res[i]["top_score"], 4),
        }

    with open(os.path.join(catalog_dir, "tags.json"), "w", encoding="utf-8") as f:
        json.dump(tags_data, f, indent=2)

    # 4. Explainable AI-Source Scoring
    print("[Catalog] Computing AI-source score features...")
    def encode_prompts(prompts):
        tokens = tokenizer(prompts).to(device)
        with torch.no_grad():
            feat = model.encode_text(tokens)
            feat /= feat.norm(dim=-1, keepdim=True)
            mean_feat = feat.mean(dim=0, keepdim=True)
            mean_feat /= mean_feat.norm(dim=-1, keepdim=True)
            return mean_feat.cpu().numpy()

    clean_prompts = profile.get("clean_prompts", ["clean professional photo"])
    clutter_prompts = profile.get("clutter_prompts", ["cluttered messy photo"])
    hero_prompts = profile.get("hero_prompts", ["hero dominant subject photo"])
    busy_prompts = profile.get("busy_prompts", ["busy chaotic photo"])

    e_clean = encode_prompts(clean_prompts)
    e_clutter = encode_prompts(clutter_prompts)
    e_hero = encode_prompts(hero_prompts)
    e_busy = encode_prompts(busy_prompts)

    sim_clean = np.dot(embeddings, e_clean.T).flatten()
    sim_clutter = np.dot(embeddings, e_clutter.T).flatten()
    clut_diff = sim_clean - sim_clutter

    sim_hero = np.dot(embeddings, e_hero.T).flatten()
    sim_busy = np.dot(embeddings, e_busy.T).flatten()
    dom_diff = sim_hero - sim_busy

    with open(os.path.join(catalog_dir, "clip_score_features.json"), "w", encoding="utf-8") as f:
        json.dump({
            "clut_diff": clut_diff.tolist(),
            "dom_diff": dom_diff.tolist()
        }, f)

    weights = profile.get("score_weights", {
        "resolution": 0.15,
        "sharpness": 0.20,
        "exposure": 0.15,
        "clutter": 0.25,
        "dominance": 0.25
    })

    scores_dict = {}
    for i, file_rec in enumerate(files_data):
        fname = file_rec["name"]
        w = file_rec.get("width", 0)
        h = file_rec.get("height", 0)
        long_side = max(w, h)
        sharpness = file_rec.get("sharpness", 0.0)

        pix = pixel_stats.get(fname, {})
        mean_lum = pix.get("mean_lum", 128.0)
        clip_ratio = pix.get("clip_ratio", 0.0)

        tag = tags_data.get(fname, {})
        piece = tag.get("piece", "none")
        p_score = tag.get("piece_score", 0.2)
        p_top2_score = tag.get("piece_top2_score", 0.2)
        p_margin = p_score - p_top2_score

        res_score = float(np.clip(1.0 + 4.0 * (long_side - 800) / 2200.0, 1.0, 5.0))
        shp_score = float(np.clip(1.0 + 4.0 * (np.sqrt(max(0, sharpness)) - np.sqrt(15)) / (np.sqrt(150) - np.sqrt(15)), 1.0, 5.0))
        lum_diff = abs(mean_lum - 125.0)
        exp_penalty = (lum_diff / 75.0) * 2.0 + (clip_ratio / 0.15) * 2.5
        exp_score = float(np.clip(5.0 - exp_penalty, 1.0, 5.0))
        clut_score = float(np.clip(1.0 + 4.0 * (clut_diff[i] - (-0.06)) / 0.18, 1.0, 5.0))

        dom_base = float(np.clip(1.0 + 4.0 * (dom_diff[i] - (-0.05)) / 0.15, 1.0, 5.0))
        if piece == "none":
            dom_score = float(np.clip(dom_base - 2.0, 1.0, 5.0))
        else:
            margin_bonus = min(0.4, max(0.0, p_margin * 5.0))
            dom_score = float(np.clip(dom_base + margin_bonus, 1.0, 5.0))

        total = (
            weights.get("resolution", 0.15) * res_score +
            weights.get("sharpness", 0.20) * shp_score +
            weights.get("exposure", 0.15) * exp_score +
            weights.get("clutter", 0.25) * clut_score +
            weights.get("dominance", 0.25) * dom_score
        )
        total = float(np.clip(total, 1.0, 5.0))
        score_parts_str = f"res:{res_score:.1f},shp:{shp_score:.1f},exp:{exp_score:.1f},clut:{clut_score:.1f},dom:{dom_score:.1f}"

        scores_dict[fname] = {
            "ai_score": round(total, 1),
            "ai_score_raw": round(total, 3),
            "score_parts": score_parts_str,
            "parts": {
                "resolution": round(res_score, 2),
                "sharpness": round(shp_score, 2),
                "exposure": round(exp_score, 2),
                "clutter": round(clut_score, 2),
                "dominance": round(dom_score, 2),
            }
        }

    with open(os.path.join(catalog_dir, "scores.json"), "w", encoding="utf-8") as f:
        json.dump(scores_dict, f, indent=2)

    # 5. Near-Twin Detection
    print("[Catalog] Detecting near-twin photo takes...")
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
            "folder": file_to_folder.get(fname, "raw"),
            "score": scores_dict.get(fname, {}).get("ai_score", 0.0),
            "sharpness": f.get("sharpness", 0.0)
        }

    by_folder = defaultdict(list)
    for fname, inf in file_info.items():
        by_folder[inf["folder"]].append(fname)

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

    raw_groups.sort(key=lambda g: min(file_info[fn]["ts"] for fn in g))

    twin_map = {}
    group_summaries = []
    for g_idx, comp in enumerate(raw_groups, 1):
        gid = f"TWIN_{g_idx:03d}"
        fld = file_info[comp[0]]["folder"]
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

    twin_data = {
        "summary": {
            "total_pairs": pairs_count,
            "total_groups": len(raw_groups),
            "total_photos_in_groups": len(twin_map),
            "total_hidden_cards": sum(len(g) - 1 for g in raw_groups)
        },
        "groups": group_summaries,
        "file_map": twin_map
    }
    with open(os.path.join(catalog_dir, "twin_groups.json"), "w", encoding="utf-8") as f:
        json.dump(twin_data, f, indent=2)

    # 6. Build CATALOG.csv and catalog_data.json
    print("[Catalog] Writing CATALOG.csv and catalog_data.json...")
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

    csv_rows = []
    json_rows = []
    enriched_items = []

    for f_rec in files_data:
        fname = f_rec["name"]
        folder = file_to_folder.get(fname, "raw")
        if folder == "_duplicates":
            continue

        tag = tags_data.get(fname, {})
        sc = scores_dict.get(fname, {})
        note = folder_notes.get(folder, "")
        tw_info = twin_map.get(fname, {})
        tw_group = tw_info.get("twin_group", "")

        row = [
            fname,
            folder,
            tag.get("piece", "none"),
            tag.get("material", "unknown"),
            tag.get("colour", "grey"),
            tag.get("stage", "finished"),
            tag.get("angle", "three-quarter"),
            f_rec.get("space_tag", "other"),
            sc.get("ai_score", 3.0),
            sc.get("score_parts", ""),
            f_rec.get("width", 0),
            f_rec.get("height", 0),
            f_rec.get("date", ""),
            note,
            tw_group
        ]
        csv_rows.append(row)

        json_item = dict(zip(headers, row))
        json_item["is_twin_primary"] = tw_info.get("is_primary", True)
        json_item["twin_count"] = tw_info.get("twin_count", 0)
        json_item["twins"] = tw_info.get("twins", [])
        json_rows.append(json_item)

        stem = os.path.splitext(os.path.basename(fname))[0]
        # Resolve full disk path
        local_cand = os.path.join(bank_dir, folder, os.path.basename(fname))
        fp = local_cand if os.path.exists(local_cand) else f_rec.get("path", local_cand)

        enriched_items.append({
            "f": fname,
            "d": folder,
            "p": tag.get("piece", "none"),
            "m": tag.get("material", "unknown"),
            "c": tag.get("colour", "grey"),
            "s": tag.get("stage", "finished"),
            "a": tag.get("angle", "three-quarter"),
            "st": f_rec.get("space_tag", "other"),
            "sc": float(sc.get("ai_score", 3.0)),
            "sp": sc.get("score_parts", ""),
            "parts": sc.get("parts", {}),
            "w": f_rec.get("width", 0),
            "h": f_rec.get("height", 0),
            "dt": f_rec.get("date", ""),
            "n": note,
            "t": f"thumbs/{stem}.jpg",
            "fp": fp,
            "p2": tag.get("piece_top2", ""),
            "m2": tag.get("material_top2", ""),
            "tg": tw_group,
            "is_twin_primary": tw_info.get("is_primary", True),
            "twin_count": tw_info.get("twin_count", 0),
            "twins": tw_info.get("twins", [])
        })

    out_csv_path = os.path.join(bank_dir, "CATALOG.csv")
    with open(out_csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(csv_rows)

    with open(os.path.join(catalog_dir, "catalog_data.json"), "w", encoding="utf-8") as f:
        json.dump(json_rows, f, indent=2, ensure_ascii=False)

    print(f"[Catalog] Saved {len(csv_rows)} rows to {out_csv_path}")

    # 7. Generate BANK.html
    print("[Catalog] Generating visual browser BANK.html...")
    html_content = generate_bank_html_content(enriched_items, profile)
    out_html_path = os.path.join(catalog_dir, "BANK.html")
    with open(out_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[Catalog] Saved BANK.html to {out_html_path}")

    # Also place/update a root pointer or copy to bank_dir/BANK.html
    root_html_path = os.path.join(bank_dir, "BANK.html")
    # For root HTML, adjust thumbnail path to _catalog/thumbs/
    root_items = []
    for it in enriched_items:
        it_copy = dict(it)
        it_copy["t"] = f"_catalog/{it_copy['t']}"
        root_items.append(it_copy)
    root_html_content = generate_bank_html_content(root_items, profile)
    with open(root_html_path, "w", encoding="utf-8") as f:
        f.write(root_html_content)
    print(f"[Catalog] Saved root BANK.html to {root_html_path}")

    # 8. Generate STUDIO_PICKS.md
    print("[Catalog] Generating STUDIO_PICKS.md...")
    piece_order = profile.get("piece_order", list(set(it["p"] for it in enriched_items)))
    by_piece = {p: [] for p in piece_order}

    for it in enriched_items:
        p_name = it["p"]
        if p_name in by_piece:
            by_piece[p_name].append(it)

    picks = {}
    seen_twin_groups = set()
    for p in piece_order:
        group = by_piece[p]
        group.sort(key=lambda x: (x["d"] != "_review", x["is_twin_primary"], x["sc"], x.get("parts", {}).get("dominance", 0)), reverse=True)
        selected = []
        for item in group:
            if not item["is_twin_primary"]:
                continue
            tg = item.get("tg", "")
            if tg:
                if tg in seen_twin_groups:
                    continue
                seen_twin_groups.add(tg)
            selected.append(item)
            if len(selected) == 5:
                break
        picks[p] = selected

    md_lines = []
    md_lines.append(f"# {profile['brand_name']} — Curated Top Photo Picks\n")
    md_lines.append(f"**Brand**: {profile['brand_name']} ({profile['brand_subtitle']})")
    md_lines.append(f"**Catalog Source**: `{bank_dir}`")
    md_lines.append("**Selection Criteria**: Top 5 photographs per category ranked by AI-Source Score (1–5 composite of resolution, sharpness, balanced exposure, clutter-free staging, and single-piece dominance).")
    md_lines.append("**Diversity Guardrail**: Maximum one photograph per near-twin take group (near-duplicates filtered out).\n")
    md_lines.append("---\n")

    for p in piece_order:
        top_list = picks.get(p, [])
        md_lines.append(f"## {p.title()} ({len(top_list)} Top Picks)\n")
        if not top_list:
            md_lines.append("*No photos matched this category in the catalog.*\n")
            continue

        for rank, item in enumerate(top_list, 1):
            rel_p = f"{item['d']}/{item['f']}"
            why = make_studio_pick_why(item)
            tg_label = f" | Twin Group: `{item['tg']}`" if item.get("tg") else ""
            md_lines.append(f"### {rank}. `{item['f']}` — Score {item['sc']:.1f}/5.0")
            md_lines.append(f"- **Path**: `{item['fp']}`")
            md_lines.append(f"- **Specifications**: {item['m'].title()} | {item['c'].title()} | {item['s'].title()} | {item['a'].title()} ({item['w']}x{item['h']} px){tg_label}")
            md_lines.append(f"- **Score Parts**: `{item['sp']}`")
            md_lines.append(f"- **Why Selected**: {why}")
            if item.get("n"):
                md_lines.append(f"- **Project Note**: {item['n']}")
            md_lines.append("")
        md_lines.append("---\n")

    out_picks_path = os.path.join(bank_dir, "STUDIO_PICKS.md")
    with open(out_picks_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))
    print(f"[Catalog] Saved STUDIO_PICKS.md to {out_picks_path}")
    print("[Catalog] Catalog build complete!")
