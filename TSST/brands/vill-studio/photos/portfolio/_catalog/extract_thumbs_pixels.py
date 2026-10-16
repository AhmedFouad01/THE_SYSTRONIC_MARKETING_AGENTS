import os
import sys
import json
import time
import concurrent.futures
import numpy as np
from PIL import Image, ImageOps

REPO_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
PORTFOLIO_DIR = os.path.join(REPO_DIR, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
CATALOG_DIR = os.path.join(PORTFOLIO_DIR, "_catalog")
THUMBS_DIR = os.path.join(CATALOG_DIR, "thumbs")
os.makedirs(THUMBS_DIR, exist_ok=True)

# Parse detailed index
index_path = os.path.join(PORTFOLIO_DIR, "INDEX.md")
file_to_folder = {}
with open(index_path, "r", encoding="utf-8") as f:
    text = f.read()
_, detailed = text.split("## Detailed File Index")
for line in detailed.splitlines():
    if line.strip().startswith("| `"):
        parts = [p.strip().replace("`", "") for p in line.split("|")[1:-1]]
        file_to_folder[parts[0]] = parts[1]

# Exclude _duplicates
catalog_files = [(fname, fld) for fname, fld in file_to_folder.items() if fld != "_duplicates"]
print(f"Total catalog files to process: {len(catalog_files)}")

def process_single(item):
    fname, fld = item
    src_path = os.path.join(PORTFOLIO_DIR, fld, fname)
    thumb_path = os.path.join(THUMBS_DIR, f"{os.path.splitext(fname)[0]}.jpg")
    
    # Defaults in case of failure or MP4
    if fname.lower().endswith(".mp4"):
        # For MP4, see if there is a preview frame in _work or create black
        return {
            "name": fname,
            "color": "grey",
            "mean_lum": 128.0,
            "clip_ratio": 0.0,
            "thumb_saved": False
        }

    try:
        with Image.open(src_path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            w_orig, h_orig = im.size
            
            # Save 320px thumbnail if not exists
            if not os.path.exists(thumb_path):
                im_thumb = im.copy()
                im_thumb.thumbnail((320, 320), Image.Resampling.LANCZOS)
                im_thumb.save(thumb_path, "JPEG", quality=85)
            
            # 256x256 for color and exposure
            im_256 = im.resize((256, 256), Image.Resampling.BILINEAR)
            arr = np.array(im_256)
            
            # Exposure
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
            
            # Classify pixel colors
            def get_color_counts(ph, ps, pv):
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

            c_freqs = get_color_counts(ch, cs, cv)
            b_freqs = get_color_counts(bh, bs, bv)
            
            # Non-background dominance: excess center frequency over border
            excess = {}
            for col, cf in c_freqs.items():
                bf = b_freqs.get(col, 0.0)
                # Excess weight: if color is chromatic or significant in center
                excess[col] = cf - 0.7 * bf
            
            # Also evaluate chromatic presence
            chromatic_cols = ["turquoise", "navy/blue", "green/emerald", "gold/yellow", "red/burgundy", "pink", "purple", "orange"]
            strong_chromatic = [(c, c_freqs[c]) for c in chromatic_cols if c_freqs.get(c, 0.0) >= 0.08 and excess.get(c, 0.0) > 0.03]
            
            if strong_chromatic:
                dom_color = max(strong_chromatic, key=lambda x: x[1])[0]
            else:
                # Top by excess or top by center frequency
                # Filter out pure background if border has > 60% of it
                candidates = [(c, cf) for c, cf in c_freqs.items() if b_freqs.get(c, 0.0) < 0.65 or cf > 0.40]
                if candidates:
                    dom_color = max(candidates, key=lambda x: x[1])[0]
                else:
                    dom_color = max(c_freqs.items(), key=lambda x: x[1])[0]

            return {
                "name": fname,
                "color": dom_color,
                "mean_lum": mean_lum,
                "clip_ratio": clip_ratio,
                "thumb_saved": True
            }
    except Exception as e:
        print(f"Error processing {fname}: {e}")
        return {
            "name": fname,
            "color": "grey",
            "mean_lum": 128.0,
            "clip_ratio": 0.0,
            "thumb_saved": False
        }

t0 = time.time()
print("Starting thumbnail & image analysis generation...")
results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(process_single, catalog_files))

t1 = time.time()
print(f"Processed {len(results)} images in {t1 - t0:.2f}s ({(t1 - t0)/len(results)*1000:.1f}ms/img)!")

# Save to cache
cache_path = os.path.join(CATALOG_DIR, "image_pixel_stats.json")
with open(cache_path, "w", encoding="utf-8") as f:
    json.dump({r["name"]: r for r in results}, f, indent=2)

print(f"Saved results to {cache_path}")
