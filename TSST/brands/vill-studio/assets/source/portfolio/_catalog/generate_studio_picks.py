"""
VILL Portfolio - Studio Picks Generator
Step 6: Generates portfolio/STUDIO_PICKS.md containing the top 5 photos
by AI-source score for each piece type, with path and an explainable one-line why.

Fix 1: Re-tagged stages (showroom removed, only workshop/raw frame, under installation, finished/handover).
Fix 3: Enforces max ONE photo per twin group.
"""

import os
import sys
import json

REPO_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
PORTFOLIO_DIR = os.path.join(REPO_DIR, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
CATALOG_DIR = os.path.join(PORTFOLIO_DIR, "_catalog")

PIECE_ORDER = [
    "dressing table/vanity",
    "sofa",
    "corner sofa",
    "armchair",
    "bed",
    "kids bed",
    "wardrobe",
    "dressing room",
    "kitchen",
    "dining table",
    "dining chairs",
    "coffee table",
    "side table",
    "console",
    "TV wall",
    "desk",
    "bathroom vanity",
    "shower cabin",
    "door",
    "staircase",
    "ceiling",
    "flooring",
    "wall finish",
    "outdoor furniture"
]

def make_why(item):
    p = item["parts"]
    shp_val = p.get("sharpness", 3.0)
    exp_val = p.get("exposure", 3.0)
    clut_val = p.get("clutter", 3.0)
    dom_val = p.get("dominance", 3.0)
    mat = item["m"]
    col = item["c"]
    piece = item["p"]
    stage = item["s"]
    angle = item["a"]

    reasons = []
    if dom_val >= 4.0:
        reasons.append("prominent hero framing dominating the shot")
    elif angle in ["three-quarter", "front"]:
        reasons.append(f"clean {angle} perspective")

    if clut_val >= 4.0:
        reasons.append("clutter-free background staging")
    elif stage == "finished/handover":
        reasons.append("completed handover presentation")
    elif stage == "under installation":
        reasons.append("on-site installation craftsmanship")
    elif stage == "workshop/raw frame":
        reasons.append("raw workshop joinery fabrication")

    if shp_val >= 4.0:
        reasons.append("tack-sharp craftsmanship details")
    elif shp_val >= 3.0:
        reasons.append("crisp edge definition")

    if exp_val >= 4.0:
        reasons.append("balanced studio lighting")

    why_str = f"High-resolution {mat} {piece} in {col} with " + ", and ".join(reasons[:2]) + "."
    return why_str

def generate_studio_picks():
    json_path = os.path.join(CATALOG_DIR, "catalog_data.json")
    scores_path = os.path.join(CATALOG_DIR, "scores.json")

    with open(json_path, "r", encoding="utf-8") as f:
        items = json.load(f)
    with open(scores_path, "r", encoding="utf-8") as f:
        scores_data = json.load(f)

    # Group by piece
    by_piece = {}
    for p in PIECE_ORDER:
        by_piece[p] = []

    for it in items:
        p_name = it["piece"]
        if p_name in by_piece:
            fname = it["file"]
            sc = scores_data.get(fname, {})
            enriched = {
                "f": fname,
                "d": it["folder"],
                "p": p_name,
                "m": it["material"],
                "c": it["colour"],
                "s": it["stage"],
                "a": it["angle"],
                "sc": float(it["ai_score"]),
                "sp": it["score_parts"],
                "parts": sc.get("parts", {}),
                "w": it["width"],
                "h": it["height"],
                "dt": it["date"],
                "n": it["project folder note (from INDEX.md)"],
                "tg": it.get("twin_group", ""),
                "is_primary": it.get("is_twin_primary", True),
                "is_review": it["folder"] == "_review"
            }
            by_piece[p_name].append(enriched)

    # Sort each group: prefer non-review, primary takes, then by score descending, enforcing MAX ONE per twin group globally
    picks = {}
    seen_twin_groups = set()
    for p in PIECE_ORDER:
        group = by_piece[p]
        group.sort(key=lambda x: (not x["is_review"], x["is_primary"], x["sc"], x.get("parts", {}).get("dominance", 0)), reverse=True)
        
        selected = []
        for item in group:
            if not item["is_primary"]:
                continue
            tg = item.get("tg", "")
            if tg:
                if tg in seen_twin_groups:
                    continue  # Skip near-twin duplicate take
                seen_twin_groups.add(tg)
            selected.append(item)
            if len(selected) == 5:
                break
        picks[p] = selected

    # Build Markdown document
    lines = []
    lines.append("# VILL Studio — Curated Top Photo Picks\n")
    lines.append("**Client**: VILL (Interior Finishing & Custom Furniture)")
    lines.append("**Catalog Source**: `TSST/brands/vill-studio/assets/source/portfolio/`")
    lines.append("**Selection Criteria**: Top 5 photographs per piece category ranked by AI-Source Score (1–5 composite of resolution, sharpness, balanced exposure, clutter-free environment, and single-piece dominance).")
    lines.append("**Diversity Guardrail**: Maximum one photograph per near-twin take group (near-duplicate takes filtered out).\n")
    lines.append("---\n")

    for p in PIECE_ORDER:
        top_list = picks[p]
        lines.append(f"## {p.title()} ({len(top_list)} Top Picks)\n")
        
        if not top_list:
            lines.append("*No photos matched this category in the catalog.*\n")
            continue

        for rank, item in enumerate(top_list, 1):
            rel_folder_path = f"{item['d']}/{item['f']}"
            why = make_why(item)
            tg_label = f" | Twin Group: `{item['tg']}`" if item.get("tg") else ""
            lines.append(f"### {rank}. `{item['f']}` — Score {item['sc']:.1f}/5.0")
            lines.append(f"- **Path**: `TSST/brands/vill-studio/assets/source/portfolio/{rel_folder_path}`")
            lines.append(f"- **Specifications**: {item['m'].title()} | {item['c'].title()} | {item['s'].title()} | {item['a'].title()} ({item['w']}x{item['h']} px){tg_label}")
            lines.append(f"- **Score Parts**: `{item['sp']}`")
            lines.append(f"- **Why Selected**: {why}")
            if item.get("n"):
                lines.append(f"- **Project Note**: {item['n']}")
            lines.append("")
        lines.append("---\n")

    out_md_path = os.path.join(PORTFOLIO_DIR, "STUDIO_PICKS.md")
    with open(out_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"STUDIO_PICKS.md successfully generated at {out_md_path}!")

if __name__ == "__main__":
    generate_studio_picks()
