"""
VILL Portfolio - AI-Source Scoring Module
Step 2: Computes explainable AI-source score (1-5) from 5 components:
  1. Resolution (long side)
  2. Sharpness (Laplacian variance from files.json)
  3. Exposure (mean luminance and highlight/shadow clipping)
  4. Clutter (CLIP zero-shot: clean product photo vs cluttered messy room)
  5. Dominance (CLIP zero-shot: hero dominant single piece vs wide busy space)

Outputs scores.json and can be imported or run standalone.
"""

import os
import sys
import json
import numpy as np
import torch
import open_clip

REPO_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
PORTFOLIO_DIR = os.path.join(REPO_DIR, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
WORK_DIR = os.path.join(PORTFOLIO_DIR, "_work")
CATALOG_DIR = os.path.join(PORTFOLIO_DIR, "_catalog")

# CLIP Prompts for Clutter and Dominance
CLEAN_PROMPTS = [
    "a clean well-lit professional interior product photograph of high-end furniture in an elegant tidy room",
    "a beautiful clean architectural interior photograph of finished custom furniture",
    "a spotless tidy living room or bedroom with luxury furniture and perfect staging"
]
CLUTTER_PROMPTS = [
    "a cluttered messy room with scattered construction tools, sawdust, debris, wires, boxes and people",
    "a chaotic messy room under rough construction with debris, trash, dirty floors and clutter",
    "a messy cluttered workshop with scattered tools, junk and unfinished materials"
]

HERO_PROMPTS = [
    "a focused hero product shot of a single dominant furniture piece prominently filling the frame",
    "a tight focused photograph highlighting one specific custom furniture piece as the main subject",
    "a professional catalog photo centered on one clear piece of luxury furniture"
]
BUSY_PROMPTS = [
    "a wide room shot with many competing scattered objects, background clutter, and no single focal point",
    "a distant chaotic room view with lots of empty floor, ceiling, and distracting elements",
    "a confusing interior photo with multiple scattered pieces competing for attention"
]

def encode_prompts(prompts, model, tokenizer, device):
    tokens = tokenizer(prompts).to(device)
    with torch.no_grad():
        feat = model.encode_text(tokens)
        feat /= feat.norm(dim=-1, keepdim=True)
        mean_feat = feat.mean(dim=0, keepdim=True)
        mean_feat /= mean_feat.norm(dim=-1, keepdim=True)
        return mean_feat.cpu().numpy()

def compute_scores(recompute_clip=False):
    # Load files.json
    with open(os.path.join(WORK_DIR, "files.json"), "r", encoding="utf-8") as f:
        files = json.load(f)
    
    # Load pixel stats
    pixel_cache_path = os.path.join(CATALOG_DIR, "image_pixel_stats.json")
    pixel_stats = {}
    if os.path.exists(pixel_cache_path):
        with open(pixel_cache_path, "r", encoding="utf-8") as f:
            pixel_stats = json.load(f)
    
    # Load tags.json if available
    tags_path = os.path.join(CATALOG_DIR, "tags.json")
    tags_data = {}
    if os.path.exists(tags_path):
        with open(tags_path, "r", encoding="utf-8") as f:
            tags_data = json.load(f)

    # Load saved embeddings
    emb = np.load(os.path.join(WORK_DIR, "embeddings.npy"))
    
    # Check if CLIP clutter/dom scores are cached
    clip_scores_cache = os.path.join(CATALOG_DIR, "clip_score_features.json")
    if os.path.exists(clip_scores_cache) and not recompute_clip:
        with open(clip_scores_cache, "r", encoding="utf-8") as f:
            cached = json.load(f)
        clut_diff = np.array(cached["clut_diff"])
        dom_diff = np.array(cached["dom_diff"])
    else:
        print("Computing CLIP clutter and dominance features...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model, _, _ = open_clip.create_model_and_transforms("ViT-L-14", pretrained="openai", device=device)
        tokenizer = open_clip.get_tokenizer("ViT-L-14")
        model.eval()

        e_clean = encode_prompts(CLEAN_PROMPTS, model, tokenizer, device)
        e_clutter = encode_prompts(CLUTTER_PROMPTS, model, tokenizer, device)
        e_hero = encode_prompts(HERO_PROMPTS, model, tokenizer, device)
        e_busy = encode_prompts(BUSY_PROMPTS, model, tokenizer, device)

        sim_clean = np.dot(emb, e_clean.T).flatten()
        sim_clutter = np.dot(emb, e_clutter.T).flatten()
        clut_diff = sim_clean - sim_clutter

        sim_hero = np.dot(emb, e_hero.T).flatten()
        sim_busy = np.dot(emb, e_busy.T).flatten()
        dom_diff = sim_hero - sim_busy

        with open(clip_scores_cache, "w", encoding="utf-8") as f:
            json.dump({
                "clut_diff": clut_diff.tolist(),
                "dom_diff": dom_diff.tolist()
            }, f)

    # Calculate 5 score components for each file
    scores_dict = {}
    for i, file_rec in enumerate(files):
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

        # 1. Resolution score: 800px -> 1.0, 3000px+ -> 5.0
        res_score = float(np.clip(1.0 + 4.0 * (long_side - 800) / 2200.0, 1.0, 5.0))
        
        # 2. Sharpness score: <15 -> 1.0, 150+ -> 5.0
        shp_score = float(np.clip(1.0 + 4.0 * (np.sqrt(max(0, sharpness)) - np.sqrt(15)) / (np.sqrt(150) - np.sqrt(15)), 1.0, 5.0))
        
        # 3. Exposure score: penalize deviation from 125 lum and clipped pixels
        lum_diff = abs(mean_lum - 125.0)
        exp_penalty = (lum_diff / 75.0) * 2.0 + (clip_ratio / 0.15) * 2.5
        exp_score = float(np.clip(5.0 - exp_penalty, 1.0, 5.0))
        
        # 4. Clutter score: CLIP clean vs cluttered
        clut_score = float(np.clip(1.0 + 4.0 * (clut_diff[i] - (-0.06)) / 0.18, 1.0, 5.0))
        
        # 5. Dominance score: hero vs busy + piece margin
        dom_base = float(np.clip(1.0 + 4.0 * (dom_diff[i] - (-0.05)) / 0.15, 1.0, 5.0))
        if piece == "none":
            dom_score = float(np.clip(dom_base - 2.0, 1.0, 5.0))
        else:
            # Margin bonus up to +0.4
            margin_bonus = min(0.4, max(0.0, p_margin * 5.0))
            dom_score = float(np.clip(dom_base + margin_bonus, 1.0, 5.0))

        # Overall AI score (weighted composite, 1.0 to 5.0)
        # 5 = clean, sharp, one clear piece; 1 = unusable
        total = (
            0.15 * res_score +
            0.20 * shp_score +
            0.15 * exp_score +
            0.25 * clut_score +
            0.25 * dom_score
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

    return scores_dict

def main():
    scores = compute_scores()
    out_path = os.path.join(CATALOG_DIR, "scores.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(scores, f, indent=2)
    print(f"Scores successfully computed and saved to {out_path} ({len(scores)} files)!")

    # Print distribution
    score_vals = [s["ai_score"] for s in scores.values()]
    print(f"Score distribution (min: {min(score_vals):.1f}, mean: {np.mean(score_vals):.2f}, max: {max(score_vals):.1f}):")
    for bucket in [1, 2, 3, 4, 5]:
        cnt = sum(1 for v in score_vals if bucket <= v < bucket + 1 or (bucket == 5 and v == 5.0))
        print(f"  Score {bucket}.0 - {bucket}.9: {cnt} files ({cnt/len(score_vals)*100:.1f}%)")

if __name__ == "__main__":
    main()
