import os
import json
from PIL import Image
import numpy as np

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
job_root = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-01"
scripts_dir = os.path.join(job_root, "correction-01", "scripts")
os.makedirs(scripts_dir, exist_ok=True)

with open(os.path.join(job_root, "correction-01", "pre-correction", "SOURCE_MANIFEST.csv"), "r", encoding="utf-8") as f:
    lines = [l.strip() for l in f if l.strip()]

header = lines[0].split(",")
filenames = []
for l in lines[1:]:
    # first column is filename
    fn = l.split(",")[0]
    filenames.append(fn)

print(f"Total files from manifest: {len(filenames)}")

results = []
for fn in filenames:
    p = os.path.join(src_dir, fn)
    with Image.open(p) as im:
        w, h = im.size
        # analyze border pixels (top 5%, bottom 5%, left 5%, right 5%)
        im_rgb = im.convert("RGB")
        arr = np.array(im_rgb)
        top = arr[:int(h*0.05), :]
        bot = arr[int(h*0.95):, :]
        left = arr[:, :int(w*0.05)]
        right = arr[:, int(w*0.95):]
        
        border_pixels = np.concatenate([
            top.reshape(-1, 3),
            bot.reshape(-1, 3),
            left.reshape(-1, 3),
            right.reshape(-1, 3)
        ], axis=0)
        
        # Check percentage of near-white pixels (R > 240, G > 240, B > 240)
        near_white = np.all(border_pixels > 240, axis=1)
        white_pct = float(np.mean(near_white))
        
        # Also check mean luminance of borders
        lum = 0.299 * border_pixels[:, 0] + 0.587 * border_pixels[:, 1] + 0.114 * border_pixels[:, 2]
        mean_lum = float(np.mean(lum))
        
        is_white_candidate = white_pct > 0.85
        results.append({
            "filename": fn,
            "dimensions": f"{w}x{h}",
            "white_pct": round(white_pct, 3),
            "mean_lum": round(mean_lum, 1),
            "is_white_candidate": is_white_candidate
        })

white_candidates = [r["filename"] for r in results if r["is_white_candidate"]]
print(f"White background candidates: {len(white_candidates)}")
for fn in white_candidates:
    print(f"  {fn}")

print(f"Non-white (retail/shelf/other): {len(results) - len(white_candidates)}")
