import os
import numpy as np
from PIL import Image

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-14-33 2.jpg"
im = Image.open(src_path)
print("14-33 2 size:", im.size, "mode:", im.mode)
arr = np.array(im)

# In original, what is the background?
# Top-left corner:
print("Top-left pixel:", arr[0, 0])
print("Bottom-left pixel:", arr[-1, 0])

# Where is the shadow?
# Look at row 800 across x from 0 to 400:
for x in range(0, 400, 20):
    print(f"x={x}: RGB={arr[800, x]}")
