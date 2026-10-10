"""
Semantic search CLI for TSST Photo Bank.
Subcommand: photobank.py search <bank> "<text>" | --like <file> [--top] [--min-score] [--piece] [--include-review]
"""

import os
import sys
import csv
import json
import numpy as np
import torch
import open_clip

def run_search(bank_dir, query=None, like_file=None, top=20, min_score=None, piece=None,
               material=None, colour=None, stage=None, folder=None, include_review=False):
    bank_dir = os.path.abspath(bank_dir)
    work_dir = os.path.join(bank_dir, "_work")
    csv_path = os.path.join(bank_dir, "CATALOG.csv")

    if not os.path.exists(csv_path):
        print(f"[Search] Error: CATALOG.csv not found in {bank_dir}. Run 'catalog' first.")
        sys.exit(1)

    files_json_path = os.path.join(work_dir, "files.json")
    emb_path = os.path.join(work_dir, "embeddings.npy")
    if not os.path.exists(files_json_path) or not os.path.exists(emb_path):
        print(f"[Search] Error: files.json or embeddings.npy missing in {work_dir}.")
        sys.exit(1)

    with open(files_json_path, "r", encoding="utf-8") as f:
        files_data = json.load(f)
    embeddings = np.load(emb_path)

    # Read CATALOG.csv
    records = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            records.append(r)

    file_to_idx = {f["name"]: f["index"] for f in files_data}

    query_vec = None
    query_desc = ""

    if like_file:
        target_name = os.path.basename(like_file)
        # Find in files_data
        matched_idx = None
        for f in files_data:
            if f["name"] == target_name or os.path.basename(f["name"]) == target_name:
                matched_idx = f["index"]
                target_name = f["name"]
                break

        if matched_idx is None:
            # If not in files_data, maybe an external image path: embed it
            if os.path.exists(like_file):
                print(f"[Search] Embedding external reference image: {like_file}")
                device = "cuda" if torch.cuda.is_available() else "cpu"
                model, _, preprocess = open_clip.create_model_and_transforms("ViT-L-14", pretrained="openai", device=device)
                from PIL import Image, ImageOps
                with Image.open(like_file) as im:
                    im_t = preprocess(ImageOps.exif_transpose(im).convert("RGB")).unsqueeze(0).to(device)
                    with torch.no_grad():
                        feat = model.encode_image(im_t)
                        feat /= feat.norm(dim=-1, keepdim=True)
                        query_vec = feat.cpu().numpy().flatten()
                query_desc = f"similar to external image: {like_file}"
            else:
                print(f"[Search] Error: Target file '{like_file}' not found in bank index or on disk.")
                sys.exit(1)
        else:
            query_vec = embeddings[matched_idx]
            query_desc = f"similar to photo: {target_name}"
    elif query:
        query_desc = f'"{query}"'
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model, _, _ = open_clip.create_model_and_transforms("ViT-L-14", pretrained="openai", device=device)
        tokenizer = open_clip.get_tokenizer("ViT-L-14")
        model.eval()

        with torch.no_grad():
            tokens = tokenizer([query]).to(device)
            t_feat = model.encode_text(tokens)
            t_feat /= t_feat.norm(dim=-1, keepdim=True)
            query_vec = t_feat.cpu().numpy().flatten()
    else:
        print("[Search] Error: Please provide either a text query or --like <image_path>.")
        sys.exit(1)

    results = []
    for r in records:
        fname = r["file"]
        if like_file and (fname == target_name or os.path.basename(fname) == target_name):
            continue

        if not include_review and r.get("folder") == "_review":
            continue

        ai_score = float(r.get("ai_score", 0.0))
        if min_score is not None and ai_score < min_score:
            continue
        if piece and piece.lower() not in r.get("piece", "").lower():
            continue
        if material and material.lower() not in r.get("material", "").lower():
            continue
        if colour and colour.lower() not in r.get("colour", "").lower():
            continue
        if stage and stage.lower() not in r.get("stage", "").lower():
            continue
        if folder and folder.lower() not in r.get("folder", "").lower():
            continue

        idx = file_to_idx.get(fname)
        if idx is None or idx >= len(embeddings):
            continue

        sim = float(np.dot(query_vec, embeddings[idx]))
        full_path = os.path.join(bank_dir, r.get("folder", ""), os.path.basename(fname))

        results.append({
            "file": fname,
            "folder": r.get("folder", ""),
            "piece": r.get("piece", ""),
            "material": r.get("material", ""),
            "colour": r.get("colour", ""),
            "ai_score": ai_score,
            "sim": sim,
            "path": full_path,
            "twin_group": r.get("twin_group", "")
        })

    results.sort(key=lambda x: x["sim"], reverse=True)
    top_results = results[:top]

    print(f"\nSearch Query: {query_desc}")
    filters = []
    if min_score is not None:
        filters.append(f"min_score>={min_score}")
    if piece:
        filters.append(f"piece='{piece}'")
    if material:
        filters.append(f"material='{material}'")
    if colour:
        filters.append(f"colour='{colour}'")
    if filters:
        print(f"Filters: {', '.join(filters)}")
    print(f"Matched {len(results)} items (showing top {len(top_results)}):\n")

    header_fmt = "{:<4} | {:<7} | {:<5} | {:<20} | {:<16} | {}"
    print(header_fmt.format("Rank", "Sim", "Score", "Category", "Material", "Path"))
    print("-" * 110)

    row_fmt = "{:<4} | {:<7.3f} | {:<5.1f} | {:<20} | {:<16} | {}"
    for rank, res in enumerate(top_results, 1):
        print(row_fmt.format(
            rank,
            res["sim"],
            res["ai_score"],
            res["piece"][:20],
            res["material"][:16],
            res["path"]
        ))
    print()
    return top_results
