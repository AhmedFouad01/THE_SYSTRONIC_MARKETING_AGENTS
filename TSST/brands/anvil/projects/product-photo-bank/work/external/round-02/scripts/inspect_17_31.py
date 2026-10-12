import os
import numpy as np
from PIL import Image

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-31.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size
print(f"17-31 size: {w}x{h}")
arr = np.array(im)

# Four shakers from left to right:
# Shaker 1 (Black): around x = 50 to 320
# Shaker 2 (Red): around x = 320 to 580
# Shaker 3 (Green): around x = 580 to 880
# Shaker 4 (Blue): around x = 880 to 1240

# Let's inspect the vertical extent:
# Lids top:
for y in range(150, 260, 10):
    print(f"Top y={y}: RGB sh1={arr[y, 180]}, sh2={arr[y, 440]}, sh3={arr[y, 740]}, sh4={arr[y, 1050]}")

# Bases bottom:
for y in range(650, 741, 10):
    print(f"Bottom y={y}: RGB sh1={arr[y, 180]}, sh2={arr[y, 440]}, sh3={arr[y, 740]}, sh4={arr[y, 1050]}")
