import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-31.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size

# Shaker 1 (Black):
# Top: (60, 300) -> (75, 240) -> (115, 195) -> (175, 185) -> (240, 195) -> (280, 240)
# Base: y=715, x=90 to 255
sh1 = [
    (55, 300), (70, 240), (110, 195), (175, 185), (240, 195), (280, 240),
    (280, 320), (275, 450), (265, 580), (258, 715),
    (92, 715), (82, 580), (68, 450), (55, 320)
]

# Shaker 2 (Red):
# Top: (330, 300) -> (345, 240) -> (385, 185) -> (445, 175) -> (510, 185) -> (550, 240)
# Base: y=715, x=360 to 525
sh2 = [
    (325, 300), (340, 240), (380, 185), (445, 175), (510, 185), (552, 240),
    (552, 320), (548, 450), (538, 580), (530, 715),
    (365, 715), (355, 580), (342, 450), (328, 320)
]

# Shaker 3 (Green):
# Top: wrap sticks up: (620, 300) -> (635, 240) -> (680, 185) -> (745, 170) -> (815, 185) -> (860, 240)
# Base: y=715, x=660 to 830
sh3 = [
    (618, 300), (632, 240), (675, 180), (745, 168), (815, 180), (862, 240),
    (862, 320), (858, 450), (848, 580), (840, 715),
    (670, 715), (660, 580), (645, 450), (628, 320)
]

# Shaker 4 (Blue):
# Top: (950, 300) -> (965, 235) -> (1010, 175) -> (1080, 158) -> (1155, 175) -> (1205, 235)
# Base: y=715, x=995 to 1170
sh4 = [
    (948, 300), (962, 235), (1005, 175), (1080, 155), (1160, 175), (1210, 235),
    (1210, 320), (1205, 450), (1195, 580), (1185, 715),
    (1005, 715), (995, 580), (980, 450), (960, 320)
]

mask = Image.new('L', (w, h), 0)
draw = ImageDraw.Draw(mask)
draw.polygon(sh1, fill=255)
draw.polygon(sh2, fill=255)
draw.polygon(sh3, fill=255)
draw.polygon(sh4, fill=255)

# Soft feathering of edges (0.8 px)
mask_f = mask.filter(ImageFilter.GaussianBlur(radius=0.8))

# Composite onto pure white canvas
canvas = Image.new('RGB', (w, h), (255, 255, 255))
comp = Image.composite(im, canvas, mask_f)

out_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02\scripts\test_17_31_comp.jpg"
comp.save(out_path)
print("Saved accurate 17-31 comp")
