import os
import numpy as np
from PIL import Image

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-31.jpg"
im = Image.open(src_path).convert('RGB')
arr = np.array(im)

# Scan a horizontal slice at y=450 across all x from 0 to 1280:
# Shaker 1 is black (R,G,B < 40)
# Shaker 2 is red (R > 120, G,B < 50)
# Shaker 3 is green (G > 120, R,B < 80)
# Shaker 4 is blue (B > 120, R,G < 50)

row = arr[450, :, :]
# Find ranges for each color
print("--- Finding shakers along y=450 ---")
for x in range(0, 1280, 20):
    print(f"x={x}: RGB={row[x]}")
