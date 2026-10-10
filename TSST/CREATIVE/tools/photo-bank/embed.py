"""
Embedding and metadata extraction engine for TSST Photo Bank.
Subcommand: photobank.py embed <src> <bank> [--profile <name>]

Extracts:
- Media frames (for MP4 via ffmpeg)
- Perceptual hashes (pHash) and SHA-256
- Timestamps (from filenames, EXIF DateTimeOriginal, or mtime)
- Sharpness (Laplacian variance)
- Dimensions (width, height)
- CLIP embeddings (open_clip ViT-L-14 openai)
- Space / category zero-shot classification
Caches all artifacts in <bank>/_work/
Rerun skips already embedded files.
"""

import os
import sys
import re
import time
import json
import hashlib
import datetime
import subprocess
import numpy as np
import torch
import open_clip
from PIL import Image, ImageOps
import imagehash

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

try:
    from .profiles import load_profile
except (ImportError, ValueError):
    from profiles import load_profile

FFMPEG_PATH = r"C:\Users\10\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
if not os.path.exists(FFMPEG_PATH):
    FFMPEG_PATH = "ffmpeg"

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".mp4"}
ARABIC_TO_LATIN = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
MONTH_NAMES = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
}

def parse_timestamp(filename, filepath):
    name = filename.translate(ARABIC_TO_LATIN)
    
    # 1. ChatGPT format: "ChatGPT Image Oct 1, 2026, 06_13_48 PM"
    m_chatgpt = re.search(r'([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})[,\s_]+(\d{2})[_\:](\d{2})[_\:](\d{2})\s*([AP]M)', name, re.IGNORECASE)
    if m_chatgpt:
        try:
            mon_str = m_chatgpt.group(1).lower()[:3]
            mon = MONTH_NAMES.get(mon_str)
            if mon:
                day = int(m_chatgpt.group(2))
                yr = int(m_chatgpt.group(3))
                hr = int(m_chatgpt.group(4))
                mn = int(m_chatgpt.group(5))
                sec = int(m_chatgpt.group(6))
                ampm = m_chatgpt.group(7).upper()
                if ampm == "PM" and hr < 12:
                    hr += 12
                elif ampm == "AM" and hr == 12:
                    hr = 0
                return datetime.datetime(yr, mon, day, hr, mn, sec)
        except Exception:
            pass

    # 2. Standard YYYYMMDD_HHMMSS or YYYYMMDD-HHMMSS
    m = re.search(r'(20\d{2})[-_]?(\d{2})[-_]?(\d{2})[_\-T](\d{2})(\d{2})(\d{2})', name)
    if m:
        try:
            return datetime.datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)),
                                     int(m.group(4)), int(m.group(5)), int(m.group(6)))
        except ValueError:
            pass

    # 3. Date only in filename (e.g. IMG-20180127-WA0010.jpg)
    m_date = re.search(r'(20\d{2})(\d{2})(\d{2})', name)

    # 4. Check EXIF DateTimeOriginal if image
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

def extract_video_frame(video_path, out_frame_path):
    if os.path.exists(out_frame_path) and os.path.getsize(out_frame_path) > 0:
        return True
    os.makedirs(os.path.dirname(out_frame_path), exist_ok=True)
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-ss", "00:00:01",
        "-i", video_path,
        "-vframes", "1",
        out_frame_path
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return os.path.exists(out_frame_path)
    except Exception:
        # Fallback to frame 0
        cmd[2] = "00:00:00"
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            return os.path.exists(out_frame_path)
        except Exception as e:
            print(f"Warning: ffmpeg failed for {video_path}: {e}")
            return False

def run_embed(src_dir, bank_dir, profile_name="generic"):
    src_dir = os.path.abspath(src_dir)
    bank_dir = os.path.abspath(bank_dir)
    work_dir = os.path.join(bank_dir, "_work")
    frames_dir = os.path.join(work_dir, "video_frames")
    os.makedirs(work_dir, exist_ok=True)
    os.makedirs(frames_dir, exist_ok=True)

    profile = load_profile(profile_name)
    print(f"[Embed] Source folder: {src_dir}")
    print(f"[Embed] Bank folder:   {bank_dir}")
    print(f"[Embed] Profile:       {profile['_profile_name']} ({profile['brand_name']})")

    # Discover media files in src_dir (support non-recursive and recursive)
    discovered = []
    for root, _, files in os.walk(src_dir):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in SUPPORTED_EXTS:
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, src_dir).replace("\\", "/")
                discovered.append((rel_p, full_p))
    discovered.sort(key=lambda x: x[0])

    if not discovered:
        print(f"[Embed] No supported media files found in {src_dir}")
        return

    print(f"[Embed] Total media files found: {len(discovered)}")

    emb_cache_path = os.path.join(work_dir, "embeddings.npy")
    files_cache_path = os.path.join(work_dir, "files.json")

    # Load existing cache if present
    cached_files = []
    cached_embeddings = None
    if os.path.exists(files_cache_path) and os.path.exists(emb_cache_path):
        try:
            with open(files_cache_path, "r", encoding="utf-8") as f:
                cached_files = json.load(f)
            cached_embeddings = np.load(emb_cache_path)
            print(f"[Embed] Loaded existing cache: {len(cached_files)} files, embeddings {cached_embeddings.shape}")
        except Exception as e:
            print(f"[Embed] Failed to load existing cache: {e}. Recomputing.")
            cached_files = []
            cached_embeddings = None

    cached_map = {f["name"]: (idx, f) for idx, f in enumerate(cached_files)}
    
    # Check what needs processing
    to_process = []
    preserved_records = []
    preserved_embs = []
    
    for rel_name, full_p in discovered:
        if rel_name in cached_map and cached_embeddings is not None and cached_map[rel_name][0] < len(cached_embeddings):
            old_idx, old_rec = cached_map[rel_name]
            # Ensure path is updated to current full_p
            old_rec["path"] = full_p
            preserved_records.append(old_rec)
            preserved_embs.append(cached_embeddings[old_idx])
        else:
            to_process.append((rel_name, full_p))

    if not to_process and len(preserved_records) == len(discovered):
        print(f"[Embed] All {len(discovered)} files are already embedded and cached. Skipping.")
        # Re-index to ensure contiguous order
        for idx, rec in enumerate(preserved_records):
            rec["index"] = idx
        with open(files_cache_path, "w", encoding="utf-8") as f:
            json.dump(preserved_records, f, indent=2, ensure_ascii=False)
        return

    print(f"[Embed] Need to process {len(to_process)} new/modified files ({len(preserved_records)} cached).")

    # Setup CLIP
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Embed] Loading ViT-L-14 (openai) on {device}...")
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-L-14", pretrained="openai", device=device)
    tokenizer = open_clip.get_tokenizer("ViT-L-14")
    model.eval()

    # Pre-encode space tags / categories if available in profile
    space_tags = profile.get("space_tags", ["other"])
    space_prompts = profile.get("space_prompts", ["a photo of general subject or environment"])
    with torch.no_grad():
        toks = tokenizer(space_prompts).to(device)
        txt_feats = model.encode_text(toks)
        txt_feats /= txt_feats.norm(dim=-1, keepdim=True)
        txt_feats_np = txt_feats.cpu().numpy()

    new_records = []
    new_embs = []
    pil_batch = []
    meta_batch = []

    start_t = time.time()
    for idx_item, (rel_name, full_p) in enumerate(to_process):
        is_mp4 = rel_name.lower().endswith(".mp4")
        file_sha = get_file_sha256(full_p)
        ts = parse_timestamp(rel_name, full_p)

        load_path = full_p
        if is_mp4:
            safe_frame_name = re.sub(r'[^\w\-_.]', '_', rel_name) + ".jpg"
            frame_path = os.path.join(frames_dir, safe_frame_name)
            if extract_video_frame(full_p, frame_path):
                load_path = frame_path
            else:
                load_path = None

        w, h, sharpness, ph = 0, 0, 0.0, "0" * 16
        im_rgb = None
        if load_path and os.path.exists(load_path):
            try:
                with Image.open(load_path) as im:
                    im_t = ImageOps.exif_transpose(im)
                    im_rgb = im_t.convert("RGB")
                    w, h = im_rgb.size
                    sharpness = compute_sharpness(im_rgb.convert("L"))
                    ph = str(imagehash.phash(im_rgb))
            except Exception as e:
                print(f"[Embed] Warning: Could not open {rel_name}: {e}")
                im_rgb = Image.new("RGB", (224, 224), color="black")
        else:
            im_rgb = Image.new("RGB", (224, 224), color="black")

        rec = {
            "name": rel_name,
            "path": full_p,
            "timestamp": ts.isoformat(),
            "date": ts.strftime("%Y-%m-%d"),
            "time": ts.strftime("%H:%M:%S"),
            "sha256": file_sha,
            "phash": ph,
            "width": w,
            "height": h,
            "sharpness": sharpness,
            "is_video": is_mp4
        }
        meta_batch.append(rec)
        pil_batch.append(preprocess(im_rgb).unsqueeze(0))

        if len(pil_batch) == 32 or idx_item == len(to_process) - 1:
            batch_tensors = torch.cat(pil_batch, dim=0).to(device)
            with torch.no_grad():
                feats = model.encode_image(batch_tensors)
                feats /= feats.norm(dim=-1, keepdim=True)
                emb_batch = feats.cpu().numpy()

            for b_i, item_meta in enumerate(meta_batch):
                emb_vec = emb_batch[b_i]
                new_embs.append(emb_vec)

                # Space / category score
                sims = np.dot(txt_feats_np, emb_vec)
                exp_sims = np.exp(sims * 100.0)
                probs = exp_sims / np.sum(exp_sims)
                top_k = int(np.argmax(sims))
                item_meta["space_tag"] = space_tags[top_k] if top_k < len(space_tags) else "other"
                item_meta["space_score"] = float(sims[top_k])
                item_meta["space_prob"] = float(probs[top_k])
                new_records.append(item_meta)

            pil_batch = []
            meta_batch = []

        if (idx_item + 1) % 50 == 0 or idx_item == len(to_process) - 1:
            print(f"[Embed] Processed {idx_item + 1}/{len(to_process)} ({time.time() - start_t:.1f}s)...")

    # Combine preserved and new
    all_records = preserved_records + new_records
    if preserved_embs and new_embs:
        all_embeddings = np.vstack([np.array(preserved_embs), np.array(new_embs)])
    elif new_embs:
        all_embeddings = np.array(new_embs, dtype=np.float32)
    else:
        all_embeddings = np.array(preserved_embs, dtype=np.float32)

    # Sort all_records and all_embeddings deterministically by name
    name_order = [r["name"] for r in all_records]
    sorted_indices = sorted(range(len(all_records)), key=lambda i: all_records[i]["name"])

    final_records = []
    final_embeddings = np.zeros_like(all_embeddings)
    for new_idx, old_idx in enumerate(sorted_indices):
        r = all_records[old_idx]
        r["index"] = new_idx
        final_records.append(r)
        final_embeddings[new_idx] = all_embeddings[old_idx]

    # Save
    np.save(emb_cache_path, final_embeddings)
    with open(files_cache_path, "w", encoding="utf-8") as f:
        json.dump(final_records, f, indent=2, ensure_ascii=False)

    print(f"[Embed] Saved {len(final_records)} records to {files_cache_path}")
    print(f"[Embed] Saved embeddings {final_embeddings.shape} to {emb_cache_path}")
