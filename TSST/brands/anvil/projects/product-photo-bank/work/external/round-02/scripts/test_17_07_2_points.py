import os
import numpy as np
from PIL import Image, ImageDraw

src_path = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products\PHOTO-2026-10-04-01-17-07 2.jpg"
im = Image.open(src_path).convert('RGB')
w, h = im.size

# Red Premium Creatine:
# Lid top: from (230, 320) curving up to (475, 220) and down to (715, 310)
# Body right: (715, 310) to (720, 380) to (718, 500) to (710, 700) to (700, 850) to (685, 980) to (650, 1030)
# Base bottom: (650, 1030) curving down to (475, 1045) and up to (290, 1030)
# Body left: (290, 1030) to (245, 980) to (230, 850) to (225, 700) to (225, 500) to (228, 380) to (230, 320)

pts = [
    (230, 320), (280, 275), (360, 235), (475, 220), (590, 235), (670, 275), (715, 320),
    (720, 380), (720, 450), (718, 550), (715, 650), (710, 750), (702, 850), (690, 950), (675, 1000), (650, 1030),
    (600, 1040), (540, 1045), (475, 1045), (410, 1045), (350, 1040), (290, 1030),
    (265, 1000), (248, 950), (236, 850), (228, 750), (224, 650), (223, 550), (225, 450), (228, 380), (230, 320)
]

overlay = im.copy()
draw = ImageDraw.Draw(overlay)
draw.polygon(pts, outline=(0, 255, 0), width=3)
overlay.save(r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02\scripts\test_17_07_2_overlay.jpg")
print("Saved 17-07 2 overlay")
