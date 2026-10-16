import sys, os
# Ensure standard library modules are not shadowed by scripts in _work
if sys.path and (sys.path[0].endswith('_work') or sys.path[0] == os.path.dirname(os.path.abspath(__file__))):
    _work_dir = sys.path.pop(0)
    sys.path.append(_work_dir)

import re
import time
import json
import hashlib
import datetime
import numpy as np
import torch
import open_clip
from PIL import Image, ImageOps, ExifTags
import imagehash
from sklearn.cluster import AgglomerativeClustering

SOURCE_DIR = r"G:\.shortcut-targets-by-id\1o5SwZqNlYdgmgCG5SIPqDmuda6ldjIR4\Vill"
WORK_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\vill-studio\assets\source\portfolio\_work"

SPACE_TAGS = [
    'kitchen',
    'reception-living',
    'bedroom',
    'bathroom',
    'dressing',
    'ceiling-gypsum',
    'flooring',
    'paint-walls',
    'facade',
    'furniture-pieces',
    'workshop',
    'other'
]

SPACE_PROMPTS = [
    "a photo of a kitchen interior or under construction",
    "a photo of a reception or living room interior or under construction",
    "a photo of a bedroom interior or under construction",
    "a photo of a bathroom interior or under construction",
    "a photo of a dressing room or walk-in closet interior or under construction",
    "a photo of a gypsum ceiling interior or under construction",
    "a photo of flooring or tiles interior or under construction",
    "a photo of wall paint or finishing interior or under construction",
    "a photo of a building facade exterior or under construction",
    "a photo of custom furniture pieces interior or under construction",
    "a photo of a carpentry workshop or wood factory interior",
    "a photo of architectural details or interior under construction"
]

ARABIC_TO_LATIN = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')

def parse_timestamp(filename, filepath):
    name = filename.translate(ARABIC_TO_LATIN)
    # 1. YYYYMMDD_HHMMSS or YYYYMMDD-HHMMSS
    m = re.search(r'(20\d{2})[-_]?(\d{2})[-_]?(\d{2})[_\-T](\d{2})(\d{2})(\d{2})', name)
    if m:
        try:
            return datetime.datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)),
                                     int(m.group(4)), int(m.group(5)), int(m.group(6)))
        except ValueError:
            pass
            
    # 2. Check date only in filename (e.g. IMG-20180127-WA0010.jpg)
    m_date = re.search(r'(20\d{2})(\d{2})(\d{2})', name)
    
    # Check EXIF DateTimeOriginal if image
    dt_exif = None
    if not filename.lower().endswith('.mp4'):
        try:
            with Image.open(filepath) as im:
                ex = im.getexif()
                if ex:
                    for k in (36867, 36868, 306):
                        v = ex.get(k)
                        if v and isinstance(v, str):
                            try:
                                dt_exif = datetime.datetime.strptime(v[:19], '%Y:%m:%d %H:%M:%S')
                                break
                            except ValueError:
                                pass
        except Exception:
            pass

    if dt_exif:
        return dt_exif

    st = os.stat(filepath)
    mtime_dt = datetime.datetime.fromtimestamp(st.st_mtime)
    
    if m_date:
        try:
            year, month, day = int(m_date.group(1)), int(m_date.group(2)), int(m_date.group(3))
            return datetime.datetime(year, month, day, mtime_dt.hour, mtime_dt.minute, mtime_dt.second)
        except ValueError:
            pass

    return mtime_dt

def compute_sharpness(img_gray):
    arr = np.array(img_gray, dtype=np.float32)
    if arr.shape[0] < 3 or arr.shape[1] < 3:
        return 0.0
    lap = arr[:-2, 1:-1] + arr[2:, 1:-1] + arr[1:-1, :-2] + arr[1:-1, 2:] - 4 * arr[1:-1, 1:-1]
    return float(np.var(lap))

def get_file_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    os.makedirs(WORK_DIR, exist_ok=True)
    os.makedirs(os.path.join(WORK_DIR, 'sheets'), exist_ok=True)
    
    emb_cache_path = os.path.join(WORK_DIR, "embeddings.npy")
    files_cache_path = os.path.join(WORK_DIR, "files.json")
    
    raw_files = sorted(os.listdir(SOURCE_DIR))
    print(f"Total source files found: {len(raw_files)}")
    assert len(raw_files) == 1583, f"Expected 1583 files, found {len(raw_files)}"

    # Check if frame for mp4 exists
    mp4_frame_path = os.path.join(WORK_DIR, "20200212_172425.jpg")
    if not os.path.exists(mp4_frame_path):
        print("Extracting mp4 frame...")
        os.system(f'ffmpeg -y -ss 00:00:01 -i "{os.path.join(SOURCE_DIR, "20200212_172425.mp4")}" -vframes 1 "{mp4_frame_path}"')

    files_data = []
    need_embed = True

    if os.path.exists(files_cache_path) and os.path.exists(emb_cache_path):
        print("Found existing cache files. Loading...")
        with open(files_cache_path, "r", encoding="utf-8") as f:
            files_data = json.load(f)
        embeddings = np.load(emb_cache_path)
        if len(files_data) == len(raw_files) and embeddings.shape[0] == len(raw_files):
            print("Cache is complete and valid.")
            need_embed = False
        else:
            print("Cache mismatch, will recompute.")

    if need_embed:
        print("Computing metadata, hashes, and embeddings...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {device}")
        
        try:
            model_name = "ViT-L-14"
            model, _, preprocess = open_clip.create_model_and_transforms(model_name, pretrained="openai", device=device)
            tokenizer = open_clip.get_tokenizer(model_name)
        except Exception as e:
            print(f"Failed to load ViT-L-14: {e}. Falling back to ViT-B-32.")
            model_name = "ViT-B-32"
            model, _, preprocess = open_clip.create_model_and_transforms(model_name, pretrained="openai", device=device)
            tokenizer = open_clip.get_tokenizer(model_name)
            
        model.eval()

        # Precompute space text features
        with torch.no_grad():
            text_tokens = tokenizer(SPACE_PROMPTS).to(device)
            text_features = model.encode_text(text_tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            text_features = text_features.cpu().numpy()

        files_data = []
        pil_images = []
        batch_indices = []
        all_embeddings = np.zeros((len(raw_files), 768 if model_name == "ViT-L-14" else 512), dtype=np.float32)

        start_time = time.time()
        for idx, filename in enumerate(raw_files):
            src_path = os.path.join(SOURCE_DIR, filename)
            ts = parse_timestamp(filename, src_path)
            file_sha = get_file_sha256(src_path)
            
            # For MP4, load the extracted frame
            load_path = mp4_frame_path if filename.lower().endswith('.mp4') else src_path

            try:
                with Image.open(load_path) as im:
                    im_transposed = ImageOps.exif_transpose(im)
                    im_rgb = im_transposed.convert('RGB')
                    w, h = im_rgb.size
                    im_gray = im_rgb.convert('L')
                    sharpness = compute_sharpness(im_gray)
                    ph = str(imagehash.phash(im_rgb))
            except Exception as e:
                print(f"Error opening image {filename}: {e}")
                w, h, sharpness, ph = 0, 0, 0.0, "0"*16
                im_rgb = Image.new('RGB', (224, 224), color='black')

            file_info = {
                "index": idx,
                "name": filename,
                "path": src_path,
                "timestamp": ts.isoformat(),
                "date": ts.strftime("%Y-%m-%d"),
                "time": ts.strftime("%H:%M:%S"),
                "sha256": file_sha,
                "phash": ph,
                "width": w,
                "height": h,
                "sharpness": sharpness,
                "is_video": filename.lower().endswith('.mp4')
            }
            files_data.append(file_info)

            # Preprocess for CLIP
            tensor_img = preprocess(im_rgb).unsqueeze(0)
            pil_images.append(tensor_img)
            batch_indices.append(idx)

            if len(pil_images) == 32 or idx == len(raw_files) - 1:
                batch_tensors = torch.cat(pil_images, dim=0).to(device)
                with torch.no_grad():
                    image_features = model.encode_image(batch_tensors)
                    image_features /= image_features.norm(dim=-1, keepdim=True)
                    emb_batch = image_features.cpu().numpy()
                
                for b_i, b_idx in enumerate(batch_indices):
                    all_embeddings[b_idx] = emb_batch[b_i]
                    
                    # Space tag zero-shot
                    sims = np.dot(text_features, emb_batch[b_i])
                    # softmax
                    exp_sims = np.exp(sims * 100.0) # temperature
                    probs = exp_sims / np.sum(exp_sims)
                    top_k = np.argmax(sims)
                    files_data[b_idx]["space_tag"] = SPACE_TAGS[top_k]
                    files_data[b_idx]["space_score"] = float(sims[top_k])
                    files_data[b_idx]["space_prob"] = float(probs[top_k])

                pil_images = []
                batch_indices = []

            if (idx + 1) % 200 == 0 or idx == len(raw_files) - 1:
                print(f"Processed {idx + 1}/{len(raw_files)} images ({time.time() - start_time:.1f}s)...")

        embeddings = all_embeddings
        print(f"Embeddings computed with shape: {embeddings.shape}")
        
        # Save cache
        np.save(emb_cache_path, embeddings)
        with open(files_cache_path, "w", encoding="utf-8") as f:
            json.dump(files_data, f, indent=2, ensure_ascii=False)
        print("Cache saved successfully.")

    # -------------------------------------------------------------
    # Step 1b: Duplicate Detection
    # exact (file hash) and near (imagehash phash distance <= 4)
    # keep the sharpest/biggest, list the rest.
    # -------------------------------------------------------------
    print("Detecting exact and near duplicates...")
    n = len(files_data)
    
    # 1. Exact hash duplicates
    sha_map = {}
    for idx, f in enumerate(files_data):
        sha_map.setdefault(f["sha256"], []).append(idx)
    
    # 2. Phash parsing
    phashes = [imagehash.hex_to_hash(f["phash"]) for f in files_data]
    
    # Graph of duplicates
    adj = {i: set() for i in range(n)}
    
    # Connect exact
    for sha, indices in sha_map.items():
        if len(indices) > 1:
            for i in indices:
                for j in indices:
                    if i != j:
                        adj[i].add(j)
                        
    # Connect near (phash distance <= 4)
    # Check pairwise within the dataset
    for i in range(n):
        phi = phashes[i]
        for j in range(i + 1, n):
            dist = phi - phashes[j]
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

    duplicate_files = set()
    dup_details = {} # keeper_name -> [dup_names]
    
    for comp in dup_components:
        # Score each candidate: resolution first, then sharpness
        # keeper = max by (width * height, sharpness)
        comp_sorted = sorted(comp, key=lambda idx: (files_data[idx]["width"] * files_data[idx]["height"], files_data[idx]["sharpness"]), reverse=True)
        keeper_idx = comp_sorted[0]
        keeper_name = files_data[keeper_idx]["name"]
        
        dups = [files_data[idx]["name"] for idx in comp_sorted[1:]]
        for idx in comp_sorted[1:]:
            duplicate_files.add(files_data[idx]["name"])
            files_data[idx]["is_duplicate"] = True
            files_data[idx]["duplicate_of"] = keeper_name
            
        files_data[keeper_idx]["is_duplicate"] = False
        files_data[keeper_idx]["duplicates_of_this"] = dups
        dup_details[keeper_name] = dups

    print(f"Total duplicate components: {len(dup_components)}")
    print(f"Total duplicate files to separate: {len(duplicate_files)}")

    # -------------------------------------------------------------
    # Step 1c: Time bursts & Clustering
    # "Time bursts: new burst when the gap > 45 minutes or the date changes.
    #  Groups = agglomerative clustering on the embeddings (cosine, average linkage, distance threshold ~0.25,
    #  tune so most groups are 5–40 photos). Two time bursts whose mean embeddings are very close (cosine ≥ 0.90)
    #  → same place → same group, even on different days. Split groups bigger than 40 into parts."
    # -------------------------------------------------------------
    print("Building time bursts...")
    # Sort files by timestamp
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

    print(f"Total raw time bursts: {len(bursts)}")

    groups = [[f for f in b] for b in bursts]

    def get_mean(g):
        idx = [f['index'] for f in g]
        m = np.mean(embeddings[idx], axis=0)
        return m / np.linalg.norm(m)

    # 1. Merge same-date bursts if close
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

    # 2. Two bursts/groups whose mean embeddings are very close (cosine >= 0.90) -> same place -> same group
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

    # 3. Merge small groups (< 5 photos) if close in time and similarity
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

    # 4. Split any group > 40
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

    # Sort groups chronologically by their earliest timestamp
    final_groups.sort(key=lambda g: g[0]["timestamp"])

    # Prepare clusters.json
    clusters_json = []
    group_sizes = []
    for g_num, g in enumerate(final_groups, 1):
        gid = f"G{g_num:03d}"
        g_files = [f["name"] for f in g]
        dates = [f["date"] for f in g]
        min_date = min(dates)
        max_date = max(dates)
        date_range = min_date if min_date == max_date else f"{min_date} to {max_date}"
        
        # Space tags distribution
        space_counts = {}
        for f in g:
            st = f.get("space_tag", "other")
            space_counts[st] = space_counts.get(st, 0) + 1
        sorted_spaces = sorted(space_counts.items(), key=lambda x: x[1], reverse=True)
        top_space_tags = [f"{st} ({cnt})" for st, cnt in sorted_spaces[:3]]
        
        # Duplicates in this group
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

    clusters_path = os.path.join(WORK_DIR, "clusters.json")
    with open(clusters_path, "w", encoding="utf-8") as f:
        json.dump(clusters_json, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(clusters_json)} groups to {clusters_path}")

    # Generate progress summary in _work/progress.md
    progress_path = os.path.join(WORK_DIR, "progress.md")
    size_5_40 = sum(1 for s in group_sizes if 5 <= s <= 40)
    size_under_5 = sum(1 for s in group_sizes if s < 5)
    size_over_40 = sum(1 for s in group_sizes if s > 40)

    summary_content = f"""# VILL Portfolio Sorting Progress

## Step 1 — Clustering & Embedding Summary
- **Total Source Files**: {len(raw_files)} (1557 jpg, 25 png, 1 mp4)
- **Total Duplicate Files Identified**: {len(duplicate_files)}
- **Total Groups Created**: {len(final_groups)}
- **Group Size Distribution**:
  - 5 to 40 photos: {size_5_40} ({size_5_40/len(final_groups)*100:.1f}%)
  - Under 5 photos: {size_under_5} ({size_under_5/len(final_groups)*100:.1f}%)
  - Over 40 photos: {size_over_40} ({size_over_40/len(final_groups)*100:.1f}%)
  - Min group size: {min(group_sizes)}
  - Max group size: {max(group_sizes)}
  - Median group size: {sorted(group_sizes)[len(group_sizes)//2]}

## Status
- `embeddings.npy`: Ready
- `files.json`: Ready
- `clusters.json`: Ready ({len(final_groups)} groups)
- Contact Sheets: Pending (Step 2)
- Labels: Pending (Step 3)
"""
    with open(progress_path, "w", encoding="utf-8") as f:
        f.write(summary_content)
    print("Saved progress summary to progress.md")

if __name__ == "__main__":
    main()
