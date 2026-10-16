"""Post-process booklet PDFs.

finish.py pages <pdf> <json>          -> find @@KEY@@ markers, write {KEY: page_no}
finish.py stamp <in.pdf> <out.pdf> <label>  -> add footer (label + page no) to every page but the cover
"""
import json
import re
import sys

import pymupdf

mode = sys.argv[1]
doc = pymupdf.open(sys.argv[2])
if mode == "pages":
    found = {}
    for i, p in enumerate(doc):
        for k in re.findall(r"@@?([A-Z][A-Z0-9]*)@@", p.get_text()):
            found.setdefault(k, i + 1)
    prev = {}
    try:
        prev = json.load(open(sys.argv[3], encoding="utf-8"))
    except FileNotFoundError:
        pass
    json.dump(found, open(sys.argv[3], "w", encoding="utf-8"))
    print("pages", doc.page_count, "changed" if found != prev else "stable", found)
else:
    label = sys.argv[4]
    for i, p in enumerate(doc):
        if i == 0:
            continue
        w, h = p.rect.width, p.rect.height
        p.draw_line((40, h - 34), (w - 40, h - 34), color=(0.86, 0.89, 0.91), width=0.6)
        p.insert_text((40, h - 21), label, fontsize=7.5, fontname="helv", color=(0.37, 0.42, 0.47))
        n = str(i + 1)
        p.insert_text((w - 40 - pymupdf.get_text_length(n, "hebo", 9), h - 21), n, fontsize=9, fontname="hebo", color=(0.07, 0.19, 0.29))
    doc.save(sys.argv[3], garbage=3, deflate=True)
    print("saved", sys.argv[3], doc.page_count)
