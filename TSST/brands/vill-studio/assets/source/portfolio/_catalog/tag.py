"""
VILL Portfolio - Zero-Shot Tagging Module
Step 1: Tags piece, material, stage, angle, and dominant non-background colour.

Prompts are defined at the top so TSST Lead can edit them directly.
Uses saved open_clip ViT-L-14 embeddings from portfolio/_work/embeddings.npy.
"""

import os
import sys
import json
import numpy as np
import torch
import open_clip
from PIL import Image, ImageOps

# -----------------------------------------------------------------------------
# PROMPT LISTS (Editable by TSST Lead)
# -----------------------------------------------------------------------------

PIECE_PROMPTS = {
    "dressing table/vanity": [
        "a photo of a bedroom makeup dressing table or vanity desk with mirror and drawers",
        "a vanity table with mirror and stool in a bedroom",
        "a cosmetic dressing table or makeup vanity with backlit mirror",
    ],
    "sofa": [
        "a photo of a living room sofa couch or salon seating",
        "an upholstered straight salon sofa",
        "a luxury upholstered couch in a living room",
    ],
    "corner sofa": [
        "a photo of an L-shaped corner sectional sofa in a living room",
        "a modular corner sectional sofa suite",
        "an L-shaped living room sectional couch",
    ],
    "armchair": [
        "a photo of a single upholstered armchair or lounge accent chair",
        "a salon wingback armchair or single barrel chair",
        "a decorative upholstered armchair",
    ],
    "bed": [
        "a photo of a master bedroom bed with tufted or upholstered headboard",
        "a king size or queen size bed frame in a master bedroom",
        "an adult bedroom double bed with headboard and mattress",
    ],
    "kids bed": [
        "a photo of a children's bedroom bed, kids bunk bed, or cartoon themed bed",
        "a twin bed in a kids bedroom or children bunk bed set",
        "a Spider-Man or Mickey Mouse themed cartoon children bed",
    ],
    "wardrobe": [
        "a photo of a fitted bedroom wardrobe cabinet with sliding or hinged doors",
        "a built-in bedroom clothes wardrobe closet",
        "a large storage wardrobe with wooden or mirrored doors",
    ],
    "dressing room": [
        "a photo of an open walk-in dressing room or walk-in closet with shelves and LED lighting",
        "a custom walk-in dressing room wardrobe system with open shelving and hanging rails",
        "a walk-in closet room interior",
    ],
    "kitchen": [
        "a photo of a custom fitted kitchen with cabinets, countertops, sink and appliances",
        "a modern kitchen cabinetry installation with cooking island and built-in appliances",
        "fitted kitchen wall and base cabinets",
    ],
    "dining table": [
        "a photo of a dining room table or large wooden dining table",
        "a solid wood or marble dining table in a dining area",
        "a central dining table",
    ],
    "dining chairs": [
        "a photo of dining chairs or upholstered dining room seating",
        "a set of dining chairs around a dining table",
        "upholstered dining chairs with legs",
    ],
    "coffee table": [
        "a photo of a living room central coffee table",
        "a low salon coffee table in front of a sofa",
        "a round or geometric coffee table on a rug",
    ],
    "side table": [
        "a photo of a small accent side table or bedside nightstand",
        "a small round side table or pedestal table next to a sofa or bed",
        "a compact end table or bedside table",
    ],
    "console": [
        "a photo of an entrance console table or decorative foyer credenza with mirror",
        "a slim entryway console table against a wall",
        "a luxury credenza or buffet console with decorative mirror",
    ],
    "TV wall": [
        "a photo of a living room TV wall unit with wood paneling, marble, or backlight",
        "a decorative television feature wall with LED lighting and floating console",
        "a modern media wall and TV cladding unit",
    ],
    "desk": [
        "a photo of an office desk, computer study desk, or executive work desk with drawers",
        "a home office study desk with chair and storage",
        "an executive wooden desk",
    ],
    "bathroom vanity": [
        "a photo of a bathroom vanity unit with washbasin sink, cabinet and mirror",
        "an under-sink bathroom storage cabinet with countertop and sink",
        "a modern bathroom vanity counter with mirror",
    ],
    "shower cabin": [
        "a photo of a glass shower cabin enclosure in a bathroom",
        "a walk-in tempered glass shower enclosure or shower door",
        "a bathroom glass shower cubicle",
    ],
    "door": [
        "a photo of an interior wooden room door with frame and handle",
        "a modern flush interior wooden door",
        "an interior door panel in a hallway or room",
    ],
    "staircase": [
        "a photo of an interior staircase with balustrade, railings, or floating stairs",
        "a duplex residential staircase with decorative handrail",
        "indoor marble or wooden stairs with railing",
    ],
    "ceiling": [
        "a photo looking up at a decorative gypsum ceiling with cove lighting and spotlights",
        "a false gypsum ceiling design with recessed LED strip lights and chandelier",
        "a decorative architectural ceiling",
    ],
    "flooring": [
        "a photo focused down on floor finish, porcelain tiles, or marble flooring",
        "interior floor tiles, polished porcelain floor, or parquet wood flooring",
        "interior flooring finish",
    ],
    "wall finish": [
        "a photo of decorative wall finish, CNC screen partition, wall paneling or wallpaper",
        "accent wall moldings, decorative gypsum wall trim, or wooden slat cladding",
        "interior wall finish and architectural wall decoration",
    ],
    "outdoor furniture": [
        "a photo of outdoor patio furniture, garden terrace seating, or exterior wooden sofa",
        "wooden outdoor garden patio seating furniture",
        "slatted wood exterior terrace sofa or bench",
    ],
    "none": [
        "a photo of an empty rough construction site, bare concrete, electrical wires, tools, rubble, or uninstalled materials",
        "a smartphone screenshot, catalog graphic flyer, advertisement banner, text graphic, or floor plan diagram",
        "a non-furniture photo showing only tools, construction mess, or random objects",
    ],
}

MATERIAL_PROMPTS = {
    "white lacquer": [
        "furniture with smooth white lacquer or high-gloss white painted finish",
        "clean white polyurethane lacquer painted furniture",
        "white lacquered cabinet surfaces",
    ],
    "colored lacquer": [
        "furniture with colored lacquer paint, like black, grey, red, blue, green, or cream lacquer finish",
        "high-gloss colored painted wood or acrylic cabinets",
        "colored lacquer coating on furniture",
    ],
    "wood veneer": [
        "furniture with natural wood veneer finish, oak or walnut wood grain pattern",
        "engineered wood veneer surface with clear grain",
        "natural wood veneer paneling",
    ],
    "solid wood": [
        "handcrafted solid natural timber or carved solid hardwood furniture",
        "solid natural wood planks or raw carpentry timber",
        "solid wood carpentry",
    ],
    "velvet": [
        "furniture upholstered in soft plush velvet fabric with sheen and texture",
        "rich velvet upholstery fabric on sofa, chairs, or headboard",
        "tufted velvet fabric",
    ],
    "leather": [
        "furniture upholstered in genuine leather or faux leather surface",
        "leather sofa, armchair, or padded headboard",
        "smooth leather upholstery",
    ],
    "fabric pattern": [
        "furniture upholstered in patterned fabric, floral print, textured woven cloth, or jacquard",
        "woven textured textile upholstery or patterned cushions",
        "upholstery fabric with decorative pattern",
    ],
    "marble": [
        "surfaces made of polished natural marble stone, granite, quartz, or onyx slab",
        "marble tabletop, marble wall cladding, or marble countertop",
        "natural veined marble slab",
    ],
    "gypsum": [
        "architectural gypsum board plaster, cornice moldings, or drywall ceiling",
        "white gypsum decorative ceiling and wall moldings",
        "plasterboard gypsum finish",
    ],
    "glass": [
        "transparent tempered glass panels, mirror glass, or glass cabinet doors",
        "clear glass shower cabin or decorative glass mirrors",
        "architectural glass surfaces",
    ],
    "metal/gold": [
        "electroplated gold stainless steel, brass, chrome metal accents, legs or frames",
        "metallic gold hardware, metal profile trim, or steel furniture legs",
        "shiny gold or bronze metal elements",
    ],
    "porcelain tiles": [
        "ceramic or porcelain tiles on bathroom walls or floors",
        "large format porcelain tiles or bathroom wall tiling",
        "glazed ceramic wall and floor tiles",
    ],
}

STAGE_PROMPTS = {
    "workshop/raw frame": [
        "a photo inside a carpentry workshop or wood factory, raw unfinished wooden frames, saws, unpainted furniture skeletons",
        "carpentry manufacturing in workshop, bare wood pieces being cut, assembled or sanded",
        "raw wooden frame fabrication in factory",
    ],
    "under installation": [
        "a photo of interior finishing or furniture under installation on site, workers fitting cabinets, rough wiring, open tools",
        "active construction site with ongoing installation of carpentry, kitchens, or gypsum",
        "assembly and mounting in progress inside an unfinished room",
    ],
    "finished/handover": [
        "a photo of completed finished interior space ready for handover, clean room with fully installed and styled furniture",
        "a professionally completed room handover with clean lighting, polished floors, and finished pieces",
        "completed turnkey handover photo",
    ],
}

ANGLE_PROMPTS = {
    "front": [
        "a straight-on frontal view of the furniture piece, facing directly towards it",
        "a direct front elevation photo of the furniture",
    ],
    "three-quarter": [
        "a three-quarter perspective angle view of the furniture piece, showing both front and side in perspective",
        "an angled perspective photograph of the furniture",
    ],
    "close-up detail": [
        "a close-up macro detail photo focused tightly on materials, joints, carving, hardware, or fabric texture",
        "a tight detail close-up shot of furniture craftsmanship and upholstery texture",
    ],
    "wide room": [
        "a wide-angle establishing shot showing the entire room interior and surrounding environment",
        "a panoramic or wide view of the whole room and space",
    ],
}

# -----------------------------------------------------------------------------
# ZERO-SHOT EMBEDDING CLASSIFICATION
# -----------------------------------------------------------------------------

def encode_prompt_dict(prompt_dict, model, tokenizer, device):
    """Encodes a dictionary of label -> prompt_list into normalized ensemble text features."""
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
    """
    Computes dot products between image embeddings (N, D) and text features (K, D).
    Returns for each image: top_tag, top_score, top2_tag, top2_score.
    """
    sims = np.dot(embeddings, text_features.T)
    results = []
    for i in range(len(embeddings)):
        row = sims[i]
        top_idx = int(np.argmax(row))
        top_tag = keys[top_idx]
        top_score = float(row[top_idx])
        
        # 2nd choice
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

# -----------------------------------------------------------------------------
# DOMINANT NON-BACKGROUND COLOUR
# -----------------------------------------------------------------------------

def compute_dominant_color_from_image(im_rgb):
    """
    Computes dominant non-background colour from a PIL Image (resized to 256x256).
    Excludes border background wall/floor tones to highlight the piece colour.
    """
    im_256 = im_rgb.resize((256, 256), Image.Resampling.BILINEAR)
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
        return max(strong_chromatic, key=lambda x: x[1])[0]
    
    candidates = [(c, cf) for c, cf in c_freqs.items() if b_freqs.get(c, 0.0) < 0.65 or cf > 0.40]
    if candidates:
        return max(candidates, key=lambda x: x[1])[0]
    return max(c_freqs.items(), key=lambda x: x[1])[0]

# -----------------------------------------------------------------------------
# MAIN CLI EXECUTION
# -----------------------------------------------------------------------------

def main():
    repo_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
    portfolio_dir = os.path.join(repo_dir, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
    work_dir = os.path.join(portfolio_dir, "_work")
    catalog_dir = os.path.join(portfolio_dir, "_catalog")
    
    print("Loading model ViT-L-14...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, _ = open_clip.create_model_and_transforms("ViT-L-14", pretrained="openai", device=device)
    tokenizer = open_clip.get_tokenizer("ViT-L-14")
    model.eval()

    print("Encoding prompt categories...")
    p_keys, p_feats = encode_prompt_dict(PIECE_PROMPTS, model, tokenizer, device)
    m_keys, m_feats = encode_prompt_dict(MATERIAL_PROMPTS, model, tokenizer, device)
    s_keys, s_feats = encode_prompt_dict(STAGE_PROMPTS, model, tokenizer, device)
    a_keys, a_feats = encode_prompt_dict(ANGLE_PROMPTS, model, tokenizer, device)

    # Save prompt embeddings cache for fast text query / search
    prompt_cache = {
        "p_keys": p_keys, "p_feats": p_feats.tolist(),
        "m_keys": m_keys, "m_feats": m_feats.tolist(),
        "s_keys": s_keys, "s_feats": s_feats.tolist(),
        "a_keys": a_keys, "a_feats": a_feats.tolist(),
    }
    with open(os.path.join(catalog_dir, "prompt_features.json"), "w", encoding="utf-8") as f:
        json.dump(prompt_cache, f)

    # Load saved embeddings
    emb = np.load(os.path.join(work_dir, "embeddings.npy"))
    with open(os.path.join(work_dir, "files.json"), "r", encoding="utf-8") as f:
        files = json.load(f)

    print(f"Classifying {len(emb)} embeddings...")
    p_res = classify_zero_shot(emb, p_keys, p_feats)
    m_res = classify_zero_shot(emb, m_keys, m_feats)
    s_res = classify_zero_shot(emb, s_keys, s_feats)
    a_res = classify_zero_shot(emb, a_keys, a_feats)

    # Load pre-extracted pixel stats if available
    pixel_cache_path = os.path.join(catalog_dir, "image_pixel_stats.json")
    pixel_stats = {}
    if os.path.exists(pixel_cache_path):
        with open(pixel_cache_path, "r", encoding="utf-8") as f:
            pixel_stats = json.load(f)

    # Merge tags
    tags_data = {}
    for i, file_rec in enumerate(files):
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

    out_path = os.path.join(catalog_dir, "tags.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(tags_data, f, indent=2)
    print(f"Tags successfully generated and written to {out_path} ({len(tags_data)} files)!")

if __name__ == "__main__":
    main()
