import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-30 2.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size

# High-precision contour for 17-30 2 (Zoomad One Raw Creatine)
# Lid top arc: smooth ellipse from left edge to right edge
top_pts = []
for t in np.linspace(-1, 1, 40):
    x = 533 + t * 297
    y = 91 + (57.0 + 3.0 * t) * (t ** 2)
    top_pts.append((float(x), float(y)))

# Lid right side:
lid_right = [(830, 154), (833, 190), (833, 240), (832, 265)]

# Body right side down to bottom rim:
# The cylinder right boundary is at x=825.
# Fingertips curl around right edge between y=520 and 720.
# Any finger pixels inside the cylinder boundary x <= 826 remain intact.
# The boundary descends to the bottom right corner (815, 1035).
body_right = [
    (832, 265), (830, 300), (828, 400), (826, 500), (825, 600), (824, 700),
    (824, 800), (823, 900), (820, 1000), (814, 1035)
]

# Base bottom arc:
# from (814, 1035) to (535, 1065) and up to (245, 1035)
bottom_pts = []
for t in np.linspace(1, -1, 30):
    x = 530 + t * 285
    # arc curves downward in center: at t=0 y=1065, at t=+/-1 y=1035
    y = 1065 - 30.0 * (t ** 2)
    bottom_pts.append((float(x), float(y)))

# Body left side: from (245, 1035) up to (242, 265)
# Thumb/palm is on the left side:
# The cylinder left boundary is at x=246.
body_left = [
    (245, 1035), (245, 1000), (245, 900), (246, 800), (246, 700),
    (247, 600), (247, 500), (246, 400), (245, 300), (242, 265)
]

# Lid left side:
lid_left = [(240, 265), (238, 230), (237, 190), (236, 148)]

all_pts = top_pts + lid_right + body_right + bottom_pts + body_left + lid_left

# Create binary mask
mask = Image.new('L', (w, h), 0)
draw = ImageDraw.Draw(mask)
draw.polygon(all_pts, fill=255)

# Soft feathering
mask_feathered = mask.filter(ImageFilter.GaussianBlur(radius=0.8))

# Composite onto pure white canvas
canvas = Image.new('RGB', (w, h), (255, 255, 255))
comp = Image.composite(im, canvas, mask_feathered)

# Save test
out_test = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02\scripts\test_17_30_2_comp.jpg"
comp.save(out_test)

# Also create overlay
overlay = im.copy()
odraw = ImageDraw.Draw(overlay)
odraw.polygon(all_pts, outline=(0, 255, 0), width=3)
overlay.save(r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02\scripts\test_17_30_2_overlay.jpg")
print("Saved comp and overlay with full height!")
