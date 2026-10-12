import os
import numpy as np
from PIL import Image, ImageDraw

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-31 4.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size

# Shaker 1 (Pink / red-black lid):
# Base sits on shelf at y ~ 645, x = 70 to 240
# Lid top: y ~ 190, x = 45 to 260
sh1 = [
    (40, 290), (45, 225), (80, 185), (145, 175), (220, 185), (260, 230), (258, 290),
    (248, 420), (242, 550), (238, 645), (75, 645), (72, 550), (65, 420), (45, 320)
]

# Shaker 2 (Black):
# Base sits at y ~ 645, x = 325 to 495
# Lid top: y ~ 180, x = 300 to 520
sh2 = [
    (300, 290), (310, 225), (355, 180), (420, 170), (480, 180), (520, 225), (518, 290),
    (505, 420), (498, 550), (492, 645), (330, 645), (328, 550), (320, 420), (305, 320)
]

# Shaker 3 (Blue):
# Base sits at y ~ 645, x = 575 to 740
# Lid top: y ~ 180, x = 545 to 770
sh3 = [
    (545, 290), (555, 225), (600, 175), (670, 168), (735, 175), (770, 225), (768, 290),
    (755, 420), (748, 550), (740, 645), (580, 645), (578, 550), (570, 420), (550, 320)
]

# Shaker 4 (Green):
# Base sits at y ~ 645, x = 810 to 980
# Lid top: y ~ 180, x = 780 to 1010
sh4 = [
    (780, 290), (790, 225), (835, 175), (910, 165), (980, 175), (1015, 225), (1010, 290),
    (998, 420), (988, 550), (980, 645), (820, 645), (818, 550), (808, 420), (788, 320)
]

overlay = im.copy()
draw = ImageDraw.Draw(overlay)
draw.polygon(sh1, outline=(255, 0, 0), width=3)
draw.polygon(sh2, outline=(255, 0, 0), width=3)
draw.polygon(sh3, outline=(255, 0, 0), width=3)
draw.polygon(sh4, outline=(255, 0, 0), width=3)

overlay.save(r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02\scripts\test_17_31_4_shakers.jpg")
print("Saved 17-31 4 overlay")
