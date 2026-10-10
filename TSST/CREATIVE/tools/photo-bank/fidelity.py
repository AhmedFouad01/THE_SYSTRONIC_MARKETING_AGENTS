"""
Visual fidelity comparison tool for TSST Photo Bank.
Subcommand: photobank.py fidelity <render> <source...>

Computes:
- open_clip ViT-L-14 image-to-image cosine similarity
- Perceptual hash (pHash) Hamming distance
QA aid for SK-014 (Asset Quality Assurance & Media Fidelity).
Prints objective numerical metrics; never renders a subjective verdict.
"""

import os
import sys
import numpy as np
import torch
import open_clip
from PIL import Image, ImageOps
import imagehash

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}

def load_and_preprocess(img_path, preprocess):
    with Image.open(img_path) as im:
        im_t = ImageOps.exif_transpose(im).convert("RGB")
        ph = imagehash.phash(im_t)
        tensor = preprocess(im_t).unsqueeze(0)
        return tensor, ph, im_t.size

def run_fidelity(render_path, source_paths):
    render_path = os.path.abspath(render_path)
    if not os.path.exists(render_path):
        print(f"[Fidelity] Error: Render file '{render_path}' not found.")
        sys.exit(1)

    # Resolve sources: can be individual files or directory
    expanded_sources = []
    for sp in source_paths:
        sp_abs = os.path.abspath(sp)
        if os.path.isdir(sp_abs):
            for root, _, fnames in os.walk(sp_abs):
                for f in fnames:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in SUPPORTED_EXTS:
                        expanded_sources.append(os.path.join(root, f))
        elif os.path.isfile(sp_abs):
            expanded_sources.append(sp_abs)
        else:
            print(f"[Fidelity] Warning: Source path '{sp}' not found.")

    if not expanded_sources:
        print("[Fidelity] Error: No valid source images found to compare against.")
        sys.exit(1)

    print(f"[Fidelity] Comparing AI Render:")
    print(f"  Render:  {render_path}")
    print(f"  Sources: {len(expanded_sources)} reference images")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-L-14", pretrained="openai", device=device)
    model.eval()

    # Process render
    try:
        render_tensor, render_phash, render_dims = load_and_preprocess(render_path, preprocess)
        with torch.no_grad():
            render_emb = model.encode_image(render_tensor.to(device))
            render_emb /= render_emb.norm(dim=-1, keepdim=True)
            render_emb = render_emb.cpu().numpy().flatten()
    except Exception as e:
        print(f"[Fidelity] Error loading render image: {e}")
        sys.exit(1)

    results = []
    for sp in expanded_sources:
        try:
            src_tensor, src_phash, src_dims = load_and_preprocess(sp, preprocess)
            with torch.no_grad():
                src_emb = model.encode_image(src_tensor.to(device))
                src_emb /= src_emb.norm(dim=-1, keepdim=True)
                src_emb = src_emb.cpu().numpy().flatten()

            cos_sim = float(np.dot(render_emb, src_emb))
            phash_dist = int(render_phash - src_phash)

            results.append({
                "path": sp,
                "name": os.path.basename(sp),
                "dims": f"{src_dims[0]}x{src_dims[1]}",
                "cos_sim": cos_sim,
                "phash_dist": phash_dist
            })
        except Exception as e:
            print(f"[Fidelity] Warning: Could not process {sp}: {e}")

    if not results:
        print("[Fidelity] Error: No sources could be evaluated.")
        return

    # Sort by cosine similarity descending
    results.sort(key=lambda x: x["cos_sim"], reverse=True)

    cos_sims = [r["cos_sim"] for r in results]
    phash_dists = [r["phash_dist"] for r in results]

    print("\n" + "=" * 88)
    print("FIDELITY COMPARISON METRICS (SK-014 QA AID)")
    print("=" * 88)
    print(f"Render Image: {os.path.basename(render_path)} ({render_dims[0]}x{render_dims[1]} px)")
    print(f"Render pHash: {render_phash}")
    print("-" * 88)
    header_fmt = "{:<4} | {:<12} | {:<14} | {:<12} | {}"
    print(header_fmt.format("Rank", "CLIP Cosine", "pHash Distance", "Resolution", "Reference Source"))
    print("-" * 88)

    row_fmt = "{:<4} | {:<12.4f} | {:<14} | {:<12} | {}"
    for rank, r in enumerate(results, 1):
        print(row_fmt.format(rank, r["cos_sim"], r["phash_dist"], r["dims"], r["name"]))

    print("-" * 88)
    print("Aggregate Measurements:")
    print(f"  • CLIP Cosine Similarity:  Max = {max(cos_sims):.4f} | Mean = {np.mean(cos_sims):.4f} | Min = {min(cos_sims):.4f}")
    print(f"  • pHash Distance (0-64):   Min = {min(phash_dists)} | Mean = {np.mean(phash_dists):.1f} | Max = {max(phash_dists)}")
    print("=" * 88 + "\n")

    return {
        "max_cosine": max(cos_sims),
        "mean_cosine": np.mean(cos_sims),
        "min_phash": min(phash_dists),
        "mean_phash": np.mean(phash_dists),
        "results": results
    }
