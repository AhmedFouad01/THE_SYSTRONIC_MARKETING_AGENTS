import os
import sys

# Ensure standard library modules are not shadowed
if sys.path and (sys.path[0].endswith('_work') or sys.path[0] == os.path.dirname(os.path.abspath(__file__))):
    _work_dir = sys.path.pop(0)
    sys.path.append(_work_dir)

import json
from PIL import Image, ImageDraw, ImageFont, ImageOps

SOURCE_DIR = r"G:\.shortcut-targets-by-id\1o5SwZqNlYdgmgCG5SIPqDmuda6ldjIR4\Vill"
WORK_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\vill-studio\assets\source\portfolio\_work"
SHEETS_DIR = os.path.join(WORK_DIR, "sheets")

# Try to load Windows TrueType font, fallback to default
def get_fonts():
    font_paths = [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibri.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                title_font = ImageFont.truetype(p, 26)
                body_font = ImageFont.truetype(p, 14)
                sub_font = ImageFont.truetype(p, 12)
                return title_font, body_font, sub_font
            except Exception:
                pass
    def_font = ImageFont.load_default()
    return def_font, def_font, def_font

def create_contact_sheet(group_info, files_dict, output_path, fonts):
    title_font, body_font, sub_font = fonts
    group_id = group_info["group_id"]
    file_names = group_info["files"]
    date_range = group_info["date_range"]
    top_tags = ", ".join(group_info.get("top_space_tags", []))
    dup_count = len(group_info.get("duplicates", []))

    num_files = len(file_names)
    cols = 6 if num_files > 15 else (5 if num_files > 8 else 4)
    rows = (num_files + cols - 1) // cols
    if rows == 0:
        rows = 1

    cell_w = 260
    cell_h = 280
    header_h = 100
    margin = 20

    sheet_w = margin * 2 + cols * cell_w
    sheet_h = header_h + rows * cell_h + margin

    sheet = Image.new("RGB", (sheet_w, sheet_h), color=(30, 32, 35))
    draw = ImageDraw.Draw(sheet)

    # Draw header banner
    draw.rectangle([(0, 0), (sheet_w, header_h)], fill=(20, 22, 25))
    header_text = f"Group: {group_id}  |  Count: {num_files} photos  |  Date Range: {date_range}"
    if dup_count > 0:
        header_text += f"  |  Duplicates: {dup_count}"
    draw.text((margin, 18), header_text, font=title_font, fill=(255, 255, 255))
    
    sub_header = f"Top Model Spaces: {top_tags}"
    draw.text((margin, 58), sub_header, font=body_font, fill=(200, 210, 225))
    draw.line([(margin, header_h - 10), (sheet_w - margin, header_h - 10)], fill=(60, 65, 75), width=1)

    mp4_frame = os.path.join(WORK_DIR, "20200212_172425.jpg")

    for i, fname in enumerate(file_names):
        r = i // cols
        c = i % cols
        x0 = margin + c * cell_w
        y0 = header_h + r * cell_h

        # Thumbnail area: cell_w x 210
        thumb_box_w = cell_w - 20
        thumb_box_h = 200

        # Load image
        img_path = mp4_frame if fname.lower().endswith('.mp4') else os.path.join(SOURCE_DIR, fname)
        try:
            with Image.open(img_path) as im:
                im_t = ImageOps.exif_transpose(im)
                im_rgb = im_t.convert("RGB")
                # Resize keeping aspect ratio
                im_rgb.thumbnail((thumb_box_w, thumb_box_h), Image.Resampling.LANCZOS)
                tw, th = im_rgb.size
                tx = x0 + 10 + (thumb_box_w - tw) // 2
                ty = y0 + 10 + (thumb_box_h - th) // 2
                sheet.paste(im_rgb, (tx, ty))
                # Border
                draw.rectangle([(tx - 1, ty - 1), (tx + tw, ty + th)], outline=(70, 75, 85), width=1)
        except Exception as e:
            draw.rectangle([(x0 + 10, y0 + 10), (x0 + 10 + thumb_box_w, y0 + 10 + thumb_box_h)], fill=(50, 20, 20))
            draw.text((x0 + 20, y0 + 50), f"Error loading:\n{e}", font=sub_font, fill=(255, 150, 150))

        # Metadata label
        f_info = files_dict.get(fname, {})
        tag = f_info.get("space_tag", "")
        score = f_info.get("space_score", 0.0)
        is_dup = f_info.get("is_duplicate", False)
        
        # Display index and filename
        lbl_idx = f"[{i}] {fname}"
        if len(lbl_idx) > 28:
            lbl_idx = lbl_idx[:25] + "..."
        draw.text((x0 + 10, y0 + thumb_box_h + 15), lbl_idx, font=body_font, fill=(255, 230, 100) if not is_dup else (180, 180, 180))
        
        tag_str = f"Tag: {tag} ({score:.2f})" if tag else ""
        if is_dup:
            tag_str += " [DUP]"
        draw.text((x0 + 10, y0 + thumb_box_h + 38), tag_str, font=sub_font, fill=(160, 200, 255))

    sheet.save(output_path, quality=90)

def main():
    os.makedirs(SHEETS_DIR, exist_ok=True)
    clusters_path = os.path.join(WORK_DIR, "clusters.json")
    files_path = os.path.join(WORK_DIR, "files.json")

    if not os.path.exists(clusters_path) or not os.path.exists(files_path):
        print("Missing clusters.json or files.json. Run cluster.py first.")
        sys.exit(1)

    with open(clusters_path, "r", encoding="utf-8") as f:
        clusters = json.load(f)
    with open(files_path, "r", encoding="utf-8") as f:
        files_list = json.load(f)

    files_dict = {f["name"]: f for f in files_list}
    fonts = get_fonts()

    print(f"Generating contact sheets for {len(clusters)} groups...")
    for idx, g in enumerate(clusters):
        gid = g["group_id"]
        out_sheet = os.path.join(SHEETS_DIR, f"{gid}.jpg")
        create_contact_sheet(g, files_dict, out_sheet, fonts)
        if (idx + 1) % 10 == 0 or idx == len(clusters) - 1:
            print(f"Generated {idx + 1}/{len(clusters)} sheets...")

    print("All contact sheets generated successfully.")

if __name__ == "__main__":
    main()
