import os
import numpy as np
from PIL import Image, ImageDraw

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-31.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size
arr = np.array(im)

# Let's inspect each shaker in 17-31:
# Shaker 1: Black
# Shaker 2: Red
# Shaker 3: Green
# Shaker 4: Blue

# Let's find the exact columns and top/bottom for each:
# Top background is brown wall: arr[:, :, 0] > arr[:, :, 2] + 40, arr[:, :, 2] < 60
# Shelf at bottom: arr[:, :, 0] > 200, arr[:, :, 1] > 200, arr[:, :, 2] > 180

# Let's draw test bounding polygons for the 4 shakers on an overlay
overlay = im.copy()
draw = ImageDraw.Draw(overlay)

# Let's test polygons for each shaker:
# Shaker 1 (Black):
# Top spout/lid/wrap: starts around y=190, x=30 to 250
# Base: y=710, x=65 to 225
sh1 = [
    (30, 270), (45, 230), (80, 195), (140, 185), (200, 195), (250, 270),
    (240, 360), (225, 550), (225, 710), (65, 710), (60, 550), (35, 360)
]

# Shaker 2 (Red):
# Top: y=180, x=260 to 450
# Base: y=710, x=280 to 435
sh2 = [
    (260, 340), (275, 260), (320, 200), (370, 180), (420, 200), (445, 260),
    (445, 340), (440, 550), (435, 710), (280, 710), (280, 550), (265, 360)
]

# Shaker 3 (Green):
# Top: y=175, x=480 to 690
# Base: y=715, x=510 to 670
sh3 = [
    (480, 340), (490, 260), (530, 200), (590, 175), (660, 200), (680, 260),
    (685, 340), (675, 550), (670, 715), (510, 715), (510, 550), (490, 360)
]

# Shaker 4 (Blue):
# Top: y=165, x=730 to 970
# Base: y=715, x=755 to 920
# Note: blue shaker right edge extends to x ~ 960 (with wrapping to 980)
sh4 = [
    (740, 340), (750, 250), (790, 190), (860, 165), (940, 190), (965, 250),
    (965, 340), (940, 550), (925, 715), (755, 715), (760, 550), (745, 360)
]

draw.polygon(sh1, outline=(255, 0, 0), width=3)
draw.polygon(sh2, outline=(255, 0, 0), width=3)
draw.polygon(sh3, outline=(255, 0, 0), width=3)
draw.polygon(sh4, outline=(255, 0, 0), width=3)

overlay.save(r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02\scripts\test_17_31_shakers.jpg")
print("Saved 17-31 shakers test overlay")
