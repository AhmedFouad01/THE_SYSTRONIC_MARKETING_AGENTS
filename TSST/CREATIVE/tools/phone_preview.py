"""360 px phone previews + contact sheet; warns on layers scaled above 1.25x.
Usage: python phone_preview.py <slide.png ...> [--out DIR]   (default DIR = ./_preview next to cwd)
For each slide, reads layers.json beside it (same folder, or folder named like the slide stem).
Scale comes from a layer's "scale" field, else "scale N" parsed from its "source" note, else warns 'scale unknown'."""
import sys, os, re, json
from PIL import Image

MAX_SCALE = 1.25
W = 360


def check_layers(slide):
    d = os.path.dirname(os.path.abspath(slide))
    stem = os.path.splitext(os.path.basename(slide))[0]
    for cand in (os.path.join(d, "layers.json"), os.path.join(d, stem, "layers.json")):
        if os.path.exists(cand):
            break
    else:
        print(f"[warn] {stem}: no layers.json found")
        return
    for L in json.load(open(cand, encoding="utf-8")).get("layers", []):
        sc = L.get("scale")
        if sc is None:
            m = re.search(r"scale\s*([0-9.]+)", str(L.get("source", "")))
            sc = float(m.group(1)) if m else None
        name = L.get("file")
        if sc is None:
            print(f"[warn] {stem}/{name}: scale unknown")
        elif sc > MAX_SCALE:
            print(f"[WARN] {stem}/{name}: scale {sc} > {MAX_SCALE}")


def main(argv):
    out = "_preview"
    if "--out" in argv:
        i = argv.index("--out")
        out = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    if not argv:
        print(__doc__)
        return 2
    os.makedirs(out, exist_ok=True)
    thumbs = []
    for p in argv:
        im = Image.open(p).convert("RGB")
        t = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
        t.save(os.path.join(out, "phone_" + os.path.basename(p)))
        thumbs.append(t)
        check_layers(p)
    gap = 16
    sheet = Image.new("RGB", (len(thumbs) * (W + gap) + gap, max(t.height for t in thumbs) + 2 * gap), (24, 24, 24))
    for i, t in enumerate(thumbs):
        sheet.paste(t, (gap + i * (W + gap), gap))
    sheet.save(os.path.join(out, "contact_sheet_360.png"))
    print(f"wrote {len(thumbs)} previews + contact_sheet_360.png to {os.path.abspath(out)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
