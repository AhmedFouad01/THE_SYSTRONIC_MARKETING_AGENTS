import os
import numpy as np
from PIL import Image

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-31 4.jpg"
im = Image.open(src_path).convert('RGB')
arr = np.array(im)
w, h = im.size
print(f"17-31 4 size: {w}x{h}")

# The 4 shakers:
# 1. Pink inner cup (red/black lid)
# 2. Black inner cup (black lid)
# 3. Blue inner cup (blue/black lid)
# 4. Green inner cup (green/black lid)

# Scan y=350 across x from 0 to 1280:
row = arr[350, :, :]
for x in range(0, 1280, 20):
    print(f"x={x}: RGB={row[x]}")
