import os
import numpy as np
from PIL import Image

round02_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02"
outputs_dir = os.path.join(round02_dir, "outputs")

for stem in ["PHOTO-2026-10-04-01-16-56", "PHOTO-2026-10-04-01-16-56 3", "PHOTO-2026-10-04-01-16-57", "PHOTO-2026-10-04-01-17-02"]:
    p = os.path.join(outputs_dir, f"{stem}__white_v01.png")
    im = Image.open(p)
    arr = np.array(im)
    corners = [arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]]
    print(f"{stem}: size={im.size}, corners={[c.tolist() for c in corners]}")
