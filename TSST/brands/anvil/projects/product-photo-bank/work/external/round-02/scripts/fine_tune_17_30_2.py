import os
import numpy as np
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
im = Image.open(os.path.join(src_dir, "PHOTO-2026-10-04-01-17-30 2.jpg"))
arr = np.array(im)
h, w, _ = arr.shape

# Let's inspect the exact coordinates of the lid top, lid sides, body sides, base
# Top of lid arc:
for y in range(85, 105):
    print(f"y={y}: center x=535 RGB={arr[y, 535]}")

# Top corners of lid:
for y in range(145, 175, 5):
    # left lid edge
    for x in range(230, 245):
        if np.mean(arr[y, x]) < 80: # black lid
            print(f"Top left lid edge y={y}: x={x}, RGB={arr[y, x]}")
            break

# Body left edge (y=300 to y=780)
print("--- Body left edge ---")
for y in [300, 400, 500, 600, 700, 780]:
    for x in range(240, 255):
        # tub label is bright blue (B > 120, R < 100)
        if arr[y, x, 2] > 120:
            print(f"y={y}: left edge x={x}, RGB={arr[y, x]}")
            break

# Body right edge (y=300 to y=780)
print("--- Body right edge ---")
for y in [300, 400, 500, 600, 700, 780]:
    for x in range(835, 815, -1):
        if arr[y, x, 2] > 100 or arr[y, x, 0] > 60:
            print(f"y={y}: right edge x={x}, RGB={arr[y, x]}")
            break

# Base bottom arc:
print("--- Base bottom arc ---")
for x in [300, 400, 535, 650, 750]:
    for y in range(850, 810, -1):
        # base is dark plastic
        if np.mean(arr[y, x]) < 70:
            print(f"x={x}: bottom edge y={y}, RGB={arr[y, x]}")
            break
