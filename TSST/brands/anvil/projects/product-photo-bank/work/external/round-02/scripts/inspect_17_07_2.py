import os
import numpy as np
from PIL import Image

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-07 2.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size
print(f"17-07 2 size: {w}x{h}")
arr = np.array(im)

# Scan vertically along center x = 475:
for y in range(200, 300, 10):
    print(f"Top y={y}: RGB={arr[y, 475]}")

for y in range(850, 950, 10):
    print(f"Bottom y={y}: RGB={arr[y, 475]}")

# Scan horizontally along y = 500:
for x in range(180, 260, 10):
    print(f"Left x={x}: RGB={arr[500, x]}")

for x in range(680, 760, 10):
    print(f"Right x={x}: RGB={arr[500, x]}")
