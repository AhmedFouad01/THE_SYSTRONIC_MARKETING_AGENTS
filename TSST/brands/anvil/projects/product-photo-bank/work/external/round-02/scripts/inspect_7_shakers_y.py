import os
import numpy as np
from PIL import Image

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-31 2.jpg"
im = Image.open(src_path).convert('RGB')
arr = np.array(im)

centers = [115, 275, 435, 610, 790, 985, 1170]
for idx, cx in enumerate(centers, 1):
    print(f"=== Shaker {idx} center x={cx} ===")
    for y in range(40, 160, 20):
        print(f"  Top y={y}: RGB={arr[y, cx]}")
    for y in range(380, 450, 10):
        print(f"  Bottom y={y}: RGB={arr[y, cx]}")
