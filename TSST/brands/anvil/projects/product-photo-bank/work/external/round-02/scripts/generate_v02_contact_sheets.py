import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
round02_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02"
outputs_dir = os.path.join(round02_dir, "outputs")
contact_dir = os.path.join(round02_dir, "contact_sheets")
os.makedirs(contact_dir, exist_ok=True)

# 20 changed files in v02:
# 6 demonstrated failures + 14 studio packshots
six_failures = [
    ("PHOTO-2026-10-04-01-17-30 2", "Zoomad One Raw: restored shark artwork, 100 Creatine text, solid lid/base"),
    ("PHOTO-2026-10-04-01-17-12", "Muscle Show: restored CREATINE text, green lid, removed black backdrop"),
    ("PHOTO-2026-10-04-01-17-07 2", "Premium Creatine: refined red contour, removed detached shelf/skin scraps"),
    ("PHOTO-2026-10-04-01-17-31", "MET-Rx 4 shakers: restored all 4 shakers intact, lids/bases, removed brown wall"),
    ("PHOTO-2026-10-04-01-17-31 2", "ON 7 shakers: restored all 7 shakers (7th red lid & 5th gold lid), removed wall"),
    ("PHOTO-2026-10-04-01-17-31 4", "SPORTSIUM 4 shakers: restored pink & green lids/bodies, intact transparent cups")
]

studio_14 = [
    ("PHOTO-2026-10-04-01-14-33 2", "TVN Pistachio Bar: seamless left shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-33 3", "TVN Pistachio Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-33 4", "TVN Pistachio Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-33 5", "TVN Pistachio Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-33",   "TVN Pistachio Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-34 2", "TVN Hazelnut Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-34 3", "TVN Hazelnut Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-34 4", "TVN Hazelnut Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-34 5", "TVN Hazelnut Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-34",   "TVN Hazelnut Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-35 2", "TVN Peanut Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-35 3", "TVN Peanut Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-14-35",   "TVN Peanut Bar: seamless shadow fade, protected box packaging"),
    ("PHOTO-2026-10-04-01-16-56 2", "TVN Creatine tub: seamless shadow fade, protected packaging")
]

all_changed = six_failures + studio_14

def make_paired_sheet(items, sheet_name, title):
    # Each row: 3 columns (Original, v01, v02)
    # Thumbnail size: 400 x 400
    thumb_w, thumb_h = 360, 360
    header_h = 80
    row_h = thumb_h + 60
    sheet_w = thumb_w * 3 + 80
    sheet_h = header_h + row_h * len(items) + 40
    
    sheet = Image.new('RGB', (sheet_w, sheet_h), (250, 250, 250))
    draw = ImageDraw.Draw(sheet)
    
    # Title
    draw.text((30, 25), title, fill=(20, 20, 20))
    
    for idx, (stem, desc) in enumerate(items):
        y_top = header_h + idx * row_h
        
        # Load Original
        src_p = os.path.join(src_dir, f"{stem}.jpg")
        orig_im = Image.open(src_p).convert('RGB')
        # Letterbox/fit to thumb
        orig_im.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        ox = 30 + (thumb_w - orig_im.width) // 2
        oy = y_top + (thumb_h - orig_im.height) // 2
        sheet.paste(orig_im, (ox, oy))
        
        # Load v01
        v01_p = os.path.join(outputs_dir, f"{stem}__white_v01.png")
        v01_im = Image.open(v01_p).convert('RGB')
        v01_im.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        v1x = 30 + thumb_w + 10 + (thumb_w - v01_im.width) // 2
        v1y = y_top + (thumb_h - v01_im.height) // 2
        sheet.paste(v01_im, (v1x, v1y))
        
        # Load v02
        v02_p = os.path.join(outputs_dir, f"{stem}__white_v02.png")
        v02_im = Image.open(v02_p).convert('RGB')
        v02_im.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        v2x = 30 + thumb_w * 2 + 20 + (thumb_w - v02_im.width) // 2
        v2y = y_top + (thumb_h - v02_im.height) // 2
        sheet.paste(v02_im, (v2x, v2y))
        
        # Labels
        draw.text((30, y_top + thumb_h + 5), f"[ORIGINAL] {stem}", fill=(80, 80, 80))
        draw.text((30 + thumb_w + 10, y_top + thumb_h + 5), f"[v01 RENDER]", fill=(180, 40, 40))
        draw.text((30 + thumb_w * 2 + 20, y_top + thumb_h + 5), f"[v02 CORRECTED]", fill=(20, 140, 40))
        draw.text((30, y_top + thumb_h + 25), desc, fill=(40, 40, 40))
        
        # Separator line
        draw.line([(20, y_top + row_h - 10), (sheet_w - 20, y_top + row_h - 10)], fill=(220, 220, 220), width=1)
        
    out_sheet_path = os.path.join(contact_dir, sheet_name)
    sheet.save(out_sheet_path, format="JPEG", quality=90)
    print(f"Saved contact sheet: {out_sheet_path}")

print("Generating 3-way contact sheets for all changed files...")
make_paired_sheet(six_failures, "contact_sheet_v02_six_repairs.jpg", "ROUND 02 CORRECTION — SIX DEMONSTRATED FAILURES (ORIGINAL vs v01 vs v02)")
make_paired_sheet(studio_14[:7], "contact_sheet_v02_studio_part1.jpg", "ROUND 02 CORRECTION — STUDIO SHADOW SEAM REPAIRS PART 1 (ORIGINAL vs v01 vs v02)")
make_paired_sheet(studio_14[7:], "contact_sheet_v02_studio_part2.jpg", "ROUND 02 CORRECTION — STUDIO SHADOW SEAM REPAIRS PART 2 (ORIGINAL vs v01 vs v02)")
print("Done generating contact sheets.")
