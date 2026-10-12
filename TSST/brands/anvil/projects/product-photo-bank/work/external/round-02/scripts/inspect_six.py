import os
import sys
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
round02_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02"

six_files = [
    "PHOTO-2026-10-04-01-17-31.jpg",
    "PHOTO-2026-10-04-01-17-31 2.jpg",
    "PHOTO-2026-10-04-01-17-31 4.jpg",
    "PHOTO-2026-10-04-01-17-30 2.jpg",
    "PHOTO-2026-10-04-01-17-12.jpg",
    "PHOTO-2026-10-04-01-17-07 2.jpg",
]

for fn in six_files:
    p = os.path.join(src_dir, fn)
    stem = os.path.splitext(fn)[0]
    v01_p = os.path.join(round02_dir, "outputs", f"{stem}__white_v01.png")
    mask_p = os.path.join(round02_dir, "work", stem, "mask.png")
    if os.path.exists(p):
        im = Image.open(p)
        print(f"SRC: {fn} | Size: {im.size} | Mode: {im.mode}")
    else:
        print(f"SRC NOT FOUND: {p}")
    print(f"  v01 exists: {os.path.exists(v01_p)} | mask exists: {os.path.exists(mask_p)}")
