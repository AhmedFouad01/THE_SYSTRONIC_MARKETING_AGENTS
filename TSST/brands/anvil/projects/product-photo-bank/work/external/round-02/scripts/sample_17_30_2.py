import os
import numpy as np
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
im = Image.open(os.path.join(src_dir, "PHOTO-2026-10-04-01-17-30 2.jpg"))
arr = np.array(im)

# Let's inspect vertical slice along center column x = 540
col = arr[:, 540, :]
for y in range(80, 150, 5):
    print(f"y={y}: RGB={col[y]}")

print("--- bottom ---")
for y in range(800, 870, 5):
    print(f"y={y}: RGB={col[y]}")

print("--- left/right at y=400 ---")
row = arr[400, :, :]
for x in range(210, 260, 5):
    print(f"x={x}: RGB={row[x]}")
for x in range(800, 850, 5):
    print(f"x={x}: RGB={row[x]}")
