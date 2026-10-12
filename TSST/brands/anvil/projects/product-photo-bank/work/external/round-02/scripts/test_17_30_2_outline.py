import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
im = Image.open(os.path.join(src_dir, "PHOTO-2026-10-04-01-17-30 2.jpg"))
w, h = im.size

# Let's inspect the tub in 17-30 2:
# The lid top is an elliptical arc:
# center top is around y=95. Left lid corner is around (235, 150). Right lid corner is around (825, 160).
# Let's test an outline and draw it on a copy of the image to see where it lands!

test_im = im.copy()
draw = ImageDraw.Draw(test_im)

# Let's find key points:
# Lid top arc: (238, 155) -> (380, 105) -> (535, 94) -> (685, 108) -> (825, 165)
# Lid bottom rim: (246, 260) -> (535, 275) -> (825, 275)
# Body left edge: (246, 260) -> (242, 800)
# Body right edge: (825, 275) -> (825, 800)
# Base bottom arc: (242, 800) -> (535, 840) -> (825, 800)

points = [
    (238, 155), (280, 130), (360, 108), (450, 97), (535, 94), (620, 98), (700, 109), (780, 133), (825, 165),
    (825, 260), (828, 275), (827, 450), (826, 650), (825, 795),
    (820, 815), (780, 832), (700, 842), (600, 846), (535, 846), (460, 844), (380, 838), (300, 825), (245, 805),
    (245, 795), (246, 650), (247, 450), (246, 275), (238, 260)
]

draw.polygon(points, outline=(255, 0, 0), width=3)
test_im.save(r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02\scripts\test_17_30_2_outline.jpg")
print("Saved outline test image")
