import os
import numpy as np
from PIL import Image

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-31 2.jpg"
im = Image.open(src_path).convert('RGB')
arr = np.array(im)
w, h = im.size
print(f"17-31 2 size: {w}x{h}")

# The 7 shakers:
# 1. Yellow (black lid)
# 2. Green (black lid)
# 3. Blue (blue lid)
# 4. Black (blue/black lid)
# 5. Gold (gold lid)
# 6. Dark/smoke (green lid)
# 7. Dark/smoke (red lid)

# Let's scan y=250 across x from 0 to 1280 in steps of 15
row = arr[250, :, :]
for x in range(0, 1280, 20):
    print(f"x={x}: RGB={row[x]}")
