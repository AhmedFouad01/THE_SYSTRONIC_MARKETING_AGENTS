import os
import numpy as np
from PIL import Image

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-12.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size
print(f"17-12 size: {w}x{h}")
arr = np.array(im)

# The tub is Muscle Show Creatine held in a hand.
# On the left: black poster with white Arabic text.
# The green shrink wrap lid is at the top.
# Let's inspect the tub boundaries:
# Center of tub is roughly x = 580.
# Scan vertically along x = 580:
for y in range(250, 400, 10):
    print(f"Top y={y}: RGB={arr[y, 580]}")

for y in range(850, 1000, 10):
    print(f"Bottom y={y}: RGB={arr[y, 580]}")

# Scan horizontally along y = 600:
for x in range(300, 420, 10):
    print(f"Left x={x}: RGB={arr[600, x]}")

for x in range(750, 880, 10):
    print(f"Right x={x}: RGB={arr[600, x]}")
