import os
import sys
import json
import torch
import open_clip
import numpy as np

REPO_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
PORTFOLIO_DIR = os.path.join(REPO_DIR, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
WORK_DIR = os.path.join(PORTFOLIO_DIR, "_work")
CATALOG_DIR = os.path.join(PORTFOLIO_DIR, "_catalog")

with open(os.path.join(WORK_DIR, "files.json"), "r", encoding="utf-8") as f:
    files_data = json.load(f)
embeddings = np.load(os.path.join(WORK_DIR, "embeddings.npy"))

with open(os.path.join(CATALOG_DIR, "catalog_data.json"), "r", encoding="utf-8") as f:
    catalog = json.load(f)

file_to_idx = {f["name"]: f["index"] for f in files_data}

device = "cuda" if torch.cuda.is_available() else "cpu"
model, _, _ = open_clip.create_model_and_transforms("ViT-L-14", pretrained="openai", device=device)
tokenizer = open_clip.get_tokenizer("ViT-L-14")
model.eval()

queries = [
    "white lacquer dresser navy velvet",
    "modern minimalist kitchen black marble counter",
    "curved grey velvet sofa gold legs"
]

results = {}

for q in queries:
    print(f"=== SEARCH: \"{q}\" ===")
    with torch.no_grad():
        tok = tokenizer([q]).to(device)
        q_emb = model.encode_text(tok)
        q_emb /= q_emb.norm(dim=-1, keepdim=True)
        q_vec = q_emb.cpu().numpy().flatten()
    
    scored = []
    for item in catalog:
        fname = item["file"]
        idx = file_to_idx.get(fname)
        if idx is None:
            continue
        sim = float(np.dot(q_vec, embeddings[idx]))
        scored.append((sim, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    
    q_res = []
    for rank, (sim, item) in enumerate(scored[:5], 1):
        rel = f"{item['folder']}/{item['file']}"
        print(f"{rank}. Sim: {sim:.3f} | Score: {item['ai_score']} | Piece: {item['piece']} | Mat: {item['material']} | Col: {item['colour']} | Path: {rel}")
        q_res.append({
            "rank": rank,
            "sim": round(sim, 3),
            "score": item["ai_score"],
            "piece": item["piece"],
            "material": item["material"],
            "colour": item["colour"],
            "path": rel,
            "note": item.get("project folder note (from INDEX.md)", "")
        })
    results[q] = q_res
    print()

with open(os.path.join(CATALOG_DIR, "sample_searches.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
