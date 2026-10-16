"""
VILL Portfolio - Semantic Search CLI
Step 4: Search the photo catalog using natural language text or image-to-image similarity.

Usage:
  python search.py "white lacquer dresser navy velvet" --top 20 [--min-score 3] [--piece sofa]
  python search.py --like 20171128_020539.jpg --top 10 [--min-score 3]
"""

import os
import sys
import argparse
import json
import numpy as np
import torch
import open_clip

# Configure stdout for clean console output
sys.stdout.reconfigure(encoding="utf-8")

REPO_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
PORTFOLIO_DIR = os.path.join(REPO_DIR, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
WORK_DIR = os.path.join(PORTFOLIO_DIR, "_work")
CATALOG_DIR = os.path.join(PORTFOLIO_DIR, "_catalog")

def load_catalog_data():
    csv_path = os.path.join(PORTFOLIO_DIR, "CATALOG.csv")
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found. Run build_catalog.py first.")
        sys.exit(1)

    import csv
    records = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            records.append(r)
    return records

def main():
    parser = argparse.ArgumentParser(description="VILL Portfolio Semantic Search CLI")
    parser.add_argument("query", nargs="?", default=None, help="Text query to search for")
    parser.add_argument("--like", dest="like_file", default=None, help="Find photos similar to a given file name or path")
    parser.add_argument("--top", type=int, default=20, help="Number of results to return (default: 20)")
    parser.add_argument("--min-score", type=float, default=None, help="Minimum AI-source score filter (1.0 to 5.0)")
    parser.add_argument("--piece", type=str, default=None, help="Filter by piece category (e.g. sofa, bed, kitchen)")
    parser.add_argument("--material", type=str, default=None, help="Filter by material")
    parser.add_argument("--colour", type=str, default=None, help="Filter by colour")
    parser.add_argument("--stage", type=str, default=None, help="Filter by stage")
    parser.add_argument("--folder", type=str, default=None, help="Filter by folder name")
    parser.add_argument("--include-review", action="store_true", default=False, help="Include _review folder in search results (hidden by default)")
    
    args = parser.parse_args()

    if not args.query and not args.like_file:
        parser.print_help()
        print("\nError: Please provide either a text query or --like <filename>.")
        sys.exit(1)

    # Load files.json and embeddings.npy
    files_json_path = os.path.join(WORK_DIR, "files.json")
    emb_path = os.path.join(WORK_DIR, "embeddings.npy")
    with open(files_json_path, "r", encoding="utf-8") as f:
        files_data = json.load(f)
    embeddings = np.load(emb_path)

    # Load catalog records
    catalog_records = load_catalog_data()
    catalog_map = {r["file"]: r for r in catalog_records}

    # Map filename -> embedding index
    file_to_idx = {f["name"]: f["index"] for f in files_data}

    query_vec = None
    query_desc = ""

    if args.like_file:
        # Image-to-image similarity
        target_name = os.path.basename(args.like_file)
        if target_name not in file_to_idx:
            print(f"Error: Target file '{target_name}' not found in portfolio index.")
            sys.exit(1)
        idx = file_to_idx[target_name]
        query_vec = embeddings[idx]
        query_desc = f"similar to photo: {target_name}"
    else:
        # Text query
        query_desc = f'"{args.query}"'
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model_name = "ViT-L-14"
        model, _, _ = open_clip.create_model_and_transforms(model_name, pretrained="openai", device=device)
        tokenizer = open_clip.get_tokenizer(model_name)
        model.eval()

        with torch.no_grad():
            tokens = tokenizer([args.query]).to(device)
            t_feat = model.encode_text(tokens)
            t_feat /= t_feat.norm(dim=-1, keepdim=True)
            query_vec = t_feat.cpu().numpy().flatten()

    # Compute cosine similarities for all catalog items
    results = []
    for r in catalog_records:
        fname = r["file"]
        if args.like_file and fname == os.path.basename(args.like_file):
            continue  # Don't return the query image itself

        # Skip _review unless requested
        if not args.include_review and r["folder"] == "_review":
            continue

        # Apply filters
        ai_score = float(r["ai_score"])
        if args.min_score is not None and ai_score < args.min_score:
            continue
        if args.piece and args.piece.lower() not in r["piece"].lower():
            continue
        if args.material and args.material.lower() not in r["material"].lower():
            continue
        if args.colour and args.colour.lower() not in r["colour"].lower():
            continue
        if args.stage and args.stage.lower() not in r["stage"].lower():
            continue
        if args.folder and args.folder.lower() not in r["folder"].lower():
            continue

        idx = file_to_idx.get(fname)
        if idx is None:
            continue

        sim = float(np.dot(query_vec, embeddings[idx]))
        full_path = os.path.join(PORTFOLIO_DIR, r["folder"], fname)
        rel_path = os.path.relpath(full_path, REPO_DIR)

        results.append({
            "file": fname,
            "folder": r["folder"],
            "piece": r["piece"],
            "material": r["material"],
            "colour": r["colour"],
            "ai_score": ai_score,
            "sim": sim,
            "path": full_path,
            "rel_path": rel_path,
            "twin_group": r.get("twin_group", "")
        })

    # Sort by similarity descending
    results.sort(key=lambda x: x["sim"], reverse=True)
    top_results = results[:args.top]

    # Print output
    print(f"\nSearch Query: {query_desc}")
    filters = []
    if args.min_score is not None:
        filters.append(f"min_score>={args.min_score}")
    if args.piece:
        filters.append(f"piece='{args.piece}'")
    if args.material:
        filters.append(f"material='{args.material}'")
    if args.colour:
        filters.append(f"colour='{args.colour}'")
    if filters:
        print(f"Filters: {', '.join(filters)}")
    print(f"Matched {len(results)} items (showing top {len(top_results)}):\n")

    header_fmt = "{:<4} | {:<7} | {:<5} | {:<22} | {:<16} | {}"
    print(header_fmt.format("Rank", "Sim", "Score", "Piece", "Material", "Path"))
    print("-" * 110)

    row_fmt = "{:<4} | {:<7.3f} | {:<5.1f} | {:<22} | {:<16} | {}"
    for rank, res in enumerate(top_results, 1):
        print(row_fmt.format(
            rank,
            res["sim"],
            res["ai_score"],
            res["piece"][:22],
            res["material"][:16],
            res["rel_path"]
        ))
    print()

if __name__ == "__main__":
    main()
