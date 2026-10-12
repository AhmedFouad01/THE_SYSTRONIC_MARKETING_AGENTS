import os
import numpy as np
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
im = Image.open(os.path.join(src_dir, "PHOTO-2026-10-04-01-17-30 2.jpg"))
w, h = im.size
print(f"17-30 2 size: {w}x{h}")

# The tub is roughly centered horizontally and vertically.
# Let's inspect rows from y=50 to y=1200 and columns from x=100 to x=900.
# The lid top is around y=100..250.
# The base is around y=850..950.
# Let's inspect cross-sections.
arr = np.array(im)
print("Shape:", arr.shape)
