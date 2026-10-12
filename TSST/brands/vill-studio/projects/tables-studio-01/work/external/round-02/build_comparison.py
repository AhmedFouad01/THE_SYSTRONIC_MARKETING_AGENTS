"""Rebuild the three-column, five-row review sheet; source image bytes remain untouched."""
from pathlib import Path
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageOps

JOB = Path(__file__).resolve().parents[3]
EXPORTS = JOB / "exports"
TITLES = ["Faceted coffee table", "Organic coffee table", "Rectangular dining table", "Circular pipe-leg table", "Geometric frame table"]
COLS = ["ORIGINAL", "ROUND 01", "CHATGPT ROUND 02"]
PAD, GAP, CELL_W, CELL_H = 24, 24, 600, 750
HEADER_H, ROW_TITLE_H, ROW_GAP = 108, 56, 24
WIDTH = PAD * 2 + CELL_W * 3 + GAP * 2
HEIGHT = HEADER_H + 5 * (ROW_TITLE_H + CELL_H) + ROW_GAP * 4 + PAD
BG, INK, ACCENT = "#F7F5F1", "#01304A", "#F58021"

def font(size, bold=False):
    candidates = [Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")]
    for candidate in candidates:
        if candidate.is_file():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)

def center(draw, label, x, y, f):
    bounds = draw.textbbox((0, 0), label, font=f)
    text_w = bounds[2] - bounds[0]
    draw.text((x + (CELL_W - text_w) / 2, y), label, fill=INK, font=f)

def main():
    canvas = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((PAD, 12), "VILL TABLES / OWNER REVIEW PENDING", fill=INK, font=font(26, True))
    for col, label in enumerate(COLS):
        center(draw, label, PAD + col * (CELL_W + GAP), 54, font(32, True))
    for row, title in enumerate(TITLES, 1):
        y = HEADER_H + (row - 1) * (ROW_TITLE_H + CELL_H + ROW_GAP)
        draw.line((PAD, y, WIDTH - PAD, y), fill=ACCENT, width=3)
        draw.text((PAD, y + 12), f"TABLE {row:02} / {title}", fill=INK, font=font(32, True))
        paths = [JOB / f"inputs/table-{row:02}-original.jpg", EXPORTS / f"table-{row:02}.png", EXPORTS / f"table-{row:02}-chatgpt-r02.png"]
        for col, path in enumerate(paths):
            x, image_y = PAD + col * (CELL_W + GAP), y + ROW_TITLE_H
            draw.rectangle((x, image_y, x + CELL_W - 1, image_y + CELL_H - 1), fill="white", outline="#DEDAD2", width=1)
            with Image.open(path) as source:
                displayed = ImageOps.exif_transpose(source).convert("RGB")
                fitted = ImageOps.contain(displayed, (CELL_W - 2, CELL_H - 2), method=Image.Resampling.LANCZOS)
                canvas.paste(fitted, (x + (CELL_W - fitted.width) // 2, image_y + (CELL_H - fitted.height) // 2))
    output = EXPORTS / "tables-comparison-chatgpt-r02.jpg"
    canvas.save(output, "JPEG", quality=94, subsampling=0, optimize=True)
    shutil.copy2(output, EXPORTS / "tables-comparison-contact.jpg")
    print(f"{output}: {WIDTH} x {HEIGHT}")

if __name__ == "__main__":
    main()
