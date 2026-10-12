import os
import numpy as np
from PIL import Image

round02_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02"
outputs_dir = os.path.join(round02_dir, "outputs")

studio_stems = [
    "PHOTO-2026-10-04-01-14-33 2", "PHOTO-2026-10-04-01-14-33 3",
    "PHOTO-2026-10-04-01-14-33 4", "PHOTO-2026-10-04-01-14-33 5",
    "PHOTO-2026-10-04-01-14-33",   "PHOTO-2026-10-04-01-14-34 2",
    "PHOTO-2026-10-04-01-14-34 3", "PHOTO-2026-10-04-01-14-34 4",
    "PHOTO-2026-10-04-01-14-34 5", "PHOTO-2026-10-04-01-14-34",
    "PHOTO-2026-10-04-01-14-35 2", "PHOTO-2026-10-04-01-14-35 3",
    "PHOTO-2026-10-04-01-14-35",   "PHOTO-2026-10-04-01-16-56 2",
    "PHOTO-2026-10-04-01-16-56 3", "PHOTO-2026-10-04-01-16-56",
    "PHOTO-2026-10-04-01-16-57",   "PHOTO-2026-10-04-01-17-02"
]

print("Auditing 18 studio v01 outputs:")
for stem in studio_stems:
    p = os.path.join(outputs_dir, f"{stem}__white_v01.png")
    if os.path.exists(p):
        im = Image.open(p)
        arr = np.array(im)
        # Check non-white area
        non_white = np.any(arr < 254, axis=2)
        y_idx, x_idx = np.where(non_white)
        # Check bounding box
        ymin, ymax = y_idx.min(), y_idx.max()
        xmin, xmax = x_idx.min(), x_idx.max()
        # Check if boundary pixels have any sharp discontinuity
        left_edge = arr[ymin:ymax, xmin, :]
        left_has_dark = np.any(left_edge < 240)
        print(f"{stem}: bbox=({xmin},{ymin})-({xmax},{ymax}), left_dark={left_has_dark}")
