import os
import csv
from PIL import Image, ImageDraw, ImageFont

def generate_contact_sheets():
    round02_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    src_dir = os.path.abspath(os.path.join(round02_dir, "..", "..", "..", "..", "..", "assets", "Anvil products"))
    outputs_dir = os.path.join(round02_dir, "outputs")
    sheets_dir = os.path.join(round02_dir, "contact_sheets")
    os.makedirs(sheets_dir, exist_ok=True)

    manifest_path = os.path.join(round02_dir, "MANIFEST.csv")
    with open(manifest_path, 'r', encoding='utf-8') as f:
        records = list(csv.DictReader(f))

    print(f"[Contact Sheets] Generating paired before/after contact sheets for {len(records)} items...")

    # Organize into sheets: 10 pairs per sheet (each sheet is 2 columns: Before, After; 10 rows)
    # Total 10 sheets (9 sheets of 10, 1 sheet of 5)
    chunk_size = 10
    total_sheets = (len(records) + chunk_size - 1) // chunk_size

    thumb_w = 400
    thumb_h = 400
    header_h = 80
    row_h = thumb_h + 50
    margin = 30
    sheet_w = margin * 2 + thumb_w * 2 + 40
    
    for s_idx in range(total_sheets):
        start = s_idx * chunk_size
        end = min(len(records), start + chunk_size)
        batch = records[start:end]

        sheet_h = header_h + len(batch) * row_h + margin
        sheet = Image.new('RGB', (sheet_w, sheet_h), (245, 245, 248))
        draw = ImageDraw.Draw(sheet)

        # Draw header
        draw.rectangle([0, 0, sheet_w, header_h], fill=(20, 24, 33))
        title_text = f"ANVIL Round 02: Before / After Contact Sheet {s_idx + 1:02d} of {total_sheets:02d} (Items {start + 1} - {end})"
        draw.text((margin, 25), title_text, fill=(255, 255, 255))

        col1_x = margin
        col2_x = margin + thumb_w + 40

        for r_idx, rec in enumerate(batch):
            y_pos = header_h + r_idx * row_h + 15
            fn = rec['filename']
            status = rec['status']
            out_fn = os.path.basename(rec['output_path'])

            src_path = os.path.join(src_dir, fn)
            out_path = os.path.join(outputs_dir, out_fn)

            # Before thumbnail
            if os.path.exists(src_path):
                with Image.open(src_path) as im_b:
                    im_b_thumb = im_b.convert('RGB')
                    im_b_thumb.thumbnail((thumb_w, thumb_h), Image.Resampling.BILINEAR)
                    # paste centered in thumb cell
                    bx = col1_x + (thumb_w - im_b_thumb.size[0]) // 2
                    by = y_pos + (thumb_h - im_b_thumb.size[1]) // 2
                    sheet.paste(im_b_thumb, (bx, by))
            
            # After thumbnail
            if os.path.exists(out_path):
                with Image.open(out_path) as im_a:
                    im_a_thumb = im_a.convert('RGB')
                    im_a_thumb.thumbnail((thumb_w, thumb_h), Image.Resampling.BILINEAR)
                    ax = col2_x + (thumb_w - im_a_thumb.size[0]) // 2
                    ay = y_pos + (thumb_h - im_a_thumb.size[1]) // 2
                    sheet.paste(im_a_thumb, (ax, ay))

            # Labels
            status_color = (0, 140, 0) if status in ["COMPLETED", "REUSED_CANVAS"] else (180, 80, 0)
            draw.text((col1_x, y_pos + thumb_h + 5), f"Source: {fn}", fill=(40, 40, 40))
            draw.text((col2_x, y_pos + thumb_h + 5), f"Output: {out_fn} | [{status}]", fill=status_color)
            draw.line([(margin, y_pos + row_h - 10), (sheet_w - margin, y_pos + row_h - 10)], fill=(210, 210, 220), width=1)

        sheet_out_path = os.path.join(sheets_dir, f"contact_sheet_{s_idx + 1:02d}.jpg")
        sheet.save(sheet_out_path, 'JPEG', quality=85)
        print(f"Saved {sheet_out_path}")

    print(f"[Contact Sheets] Generated {total_sheets} contact sheets successfully!")

if __name__ == '__main__':
    generate_contact_sheets()
