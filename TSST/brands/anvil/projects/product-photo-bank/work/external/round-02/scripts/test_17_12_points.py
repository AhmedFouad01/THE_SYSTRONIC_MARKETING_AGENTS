import os
import numpy as np
from PIL import Image, ImageDraw

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-12.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size
arr = np.array(im)

# Tub center ~ x=590.
# Green lid shrink-wrap:
# Top arc: from (405, 345) to (605, 305) to (820, 360)
# Right edge: (820, 360) to (840, 440) to (825, 700) to (790, 920) to (765, 945)
# Bottom base arc: from (765, 945) to (580, 955) to (385, 905)
# Left edge: (385, 905) to (375, 750) to (385, 550) to (385, 450) to (405, 345)
# Note: Thumb holds bottom left of tub between y=650 and 920.
# The black backdrop banner on the left is x < 380, y < 700. It MUST be excluded!

pts = [
    (405, 350), (450, 325), (520, 310), (600, 305), (680, 310), (760, 330), (820, 360),
    (835, 400), (840, 445), (835, 500), (830, 600), (820, 700), (805, 800), (785, 900), (765, 945),
    (720, 955), (650, 958), (580, 955), (500, 945), (430, 925), (385, 905),
    (375, 850), (375, 750), (378, 650), (382, 550), (385, 460), (395, 400), (405, 350)
]

overlay = im.copy()
draw = ImageDraw.Draw(overlay)
draw.polygon(pts, outline=(0, 255, 0), width=3)
overlay.save(r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02\scripts\test_17_12_overlay.jpg")
print("Saved 17-12 overlay")
