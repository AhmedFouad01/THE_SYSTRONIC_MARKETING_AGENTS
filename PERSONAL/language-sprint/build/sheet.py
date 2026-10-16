"""QA helper: contact sheet + single-page renders. sheet.py <pdf> <outdir> [page ...]"""
import sys
from pathlib import Path

import pymupdf

doc = pymupdf.open(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
stem = Path(sys.argv[1]).stem[:2]
pages = [int(x) for x in sys.argv[3:]]
if not pages:
    cols, tw = 6, 200
    th = int(tw * 297 / 210)
    rows = (doc.page_count + cols - 1) // cols
    sheet = pymupdf.open()
    sp = sheet.new_page(width=cols * tw, height=rows * th)
    for i, p in enumerate(doc):
        r = pymupdf.Rect((i % cols) * tw, (i // cols) * th, (i % cols + 1) * tw, (i // cols + 1) * th)
        sp.show_pdf_page(r, doc, i)
        sp.insert_text((r.x0 + 4, r.y0 + 12), str(i + 1), fontsize=11, color=(1, 0, 0))
    sp.get_pixmap(dpi=72).save(out / f"{stem}_sheet.png")
    print(out / f"{stem}_sheet.png")
for n in pages:
    doc[n - 1].get_pixmap(dpi=85).save(out / f"{stem}_p{n:02d}.png")
    print(out / f"{stem}_p{n:02d}.png")
