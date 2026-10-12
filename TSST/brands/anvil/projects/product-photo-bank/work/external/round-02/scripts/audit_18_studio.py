import os
import numpy as np
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"

studio_filenames = [
    "PHOTO-2026-10-04-01-14-33 2.jpg", "PHOTO-2026-10-04-01-14-33 3.jpg",
    "PHOTO-2026-10-04-01-14-33 4.jpg", "PHOTO-2026-10-04-01-14-33 5.jpg",
    "PHOTO-2026-10-04-01-14-33.jpg",   "PHOTO-2026-10-04-01-14-34 2.jpg",
    "PHOTO-2026-10-04-01-14-34 3.jpg", "PHOTO-2026-10-04-01-14-34 4.jpg",
    "PHOTO-2026-10-04-01-14-34 5.jpg", "PHOTO-2026-10-04-01-14-34.jpg",
    "PHOTO-2026-10-04-01-14-35 2.jpg", "PHOTO-2026-10-04-01-14-35 3.jpg",
    "PHOTO-2026-10-04-01-14-35.jpg",   "PHOTO-2026-10-04-01-16-56 2.jpg",
    "PHOTO-2026-10-04-01-16-56 3.jpg", "PHOTO-2026-10-04-01-16-56.jpg",
    "PHOTO-2026-10-04-01-16-57.jpg",   "PHOTO-2026-10-04-01-17-02.jpg"
]

for fn in studio_filenames:
    p = os.path.join(src_dir, fn)
    im = Image.open(p)
    arr = np.array(im)
    corners = [arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]]
    c_means = [np.mean(c) for c in corners]
    print(f"{fn}: size={im.size}, corners_min={min(c_means):.1f}, corners_max={max(c_means):.1f}")
