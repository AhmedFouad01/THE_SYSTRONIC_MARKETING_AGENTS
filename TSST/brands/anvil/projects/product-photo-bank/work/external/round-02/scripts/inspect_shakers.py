import os
import numpy as np
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"

for fn in ["PHOTO-2026-10-04-01-17-31 2.jpg", "PHOTO-2026-10-04-01-17-31 4.jpg"]:
    p = os.path.join(src_dir, fn)
    im = Image.open(p).convert('RGB')
    arr = np.array(im)
    print(f"=== {fn} ({im.size}) ===")
    h, w, _ = arr.shape
    # check top and bottom rows
    for y in range(50, 200, 25):
        print(f"y={y}: center RGB={arr[y, w//2]}")
    for y in range(h-100, h, 25):
        print(f"y={y}: center RGB={arr[y, w//2]}")
