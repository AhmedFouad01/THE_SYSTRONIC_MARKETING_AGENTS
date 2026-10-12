import os
import numpy as np
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
im = Image.open(os.path.join(src_dir, "PHOTO-2026-10-04-01-17-30 2.jpg"))
arr = np.array(im)

# Let's inspect rows from 95 to 845 in steps of 20
# Find the transition from background to tub
print("y, left_edge, right_edge")
for y in range(100, 840, 20):
    row = arr[y, :, :]
    # let's look at row pixels from x=200 to x=300, and x=780 to x=860
    # print summary
