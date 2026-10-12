import os
import json
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
job_root = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-01"
scripts_dir = os.path.join(job_root, "correction-01", "scripts")
inspection_dir = os.path.join(job_root, "correction-01", "inspection_crops")
os.makedirs(inspection_dir, exist_ok=True)

clusters_path = os.path.join(job_root, "bank", "_work", "clusters.json")
with open(clusters_path, "r", encoding="utf-8") as f:
    clusters = json.load(f)

# Let's inspect all clusters and write out crops for key clusters
for c in clusters:
    gid = c["group_id"]
    files = c["files"]
    print(f"\nCluster {gid} ({len(files)} files):")
    for idx, fn in enumerate(files):
        print(f"  [{idx:02d}] {fn}")
        p = os.path.join(src_dir, fn)
        with Image.open(p) as im:
            w, h = im.size
            # save an inspection crop (center 80%)
            crop = im.crop((int(w*0.1), int(h*0.1), int(w*0.9), int(h*0.9)))
            crop.thumbnail((800, 800))
            out_fn = f"{gid}_{idx:02d}_{fn.replace('PHOTO-2026-10-04-01-', '').replace('.jpg', '')}.jpg"
            crop.save(os.path.join(inspection_dir, out_fn), quality=90)

print(f"\nAll inspection crops saved to {inspection_dir}")
