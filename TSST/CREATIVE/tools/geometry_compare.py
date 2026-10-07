"""Geometry compare: original vs result. Usage:
geometry_compare.py ORIG RESULT OUTDIR [--obox x0,y0,x1,y1] [--rbox x0,y0,x1,y1] [--omir ..] [--rmir ..]
Boxes are in image px AFTER EXIF rotation; missing box = rough auto-detect (navy+white pixels).
Writes OUTDIR/<name>_side.png, <name>_edges.png; prints bbox, mirror ratio, navy hex/hue, drift."""
import sys, os, colorsys
import numpy as np
from PIL import Image, ImageOps, ImageFilter
def load(p, w=900):
    im = ImageOps.exif_transpose(Image.open(p)).convert("RGB"); s = w / im.width
    return im.resize((w, round(im.height * s))), s
def navy(a):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    return (b > r + 25) & (b > g + 10) & (b < 200) & (r < 90) & (b > 50)
def detect(a):
    m = navy(a); ys, xs = np.nonzero(m)
    if len(xs) < 50: return (0, 0, a.shape[1], a.shape[0])
    x0, x1 = np.percentile(xs, [0.5, 99.5]); y1 = np.percentile(ys, 99.5)
    wh = (a.min(-1) > 215) & (np.arange(a.shape[0])[:, None] < y1)
    ys2, xs2 = np.nonzero(wh & (np.abs(np.arange(a.shape[1])[None, :] - (x0 + x1) / 2) < (x1 - x0)))
    return (int(x0), int(ys2.min()) if len(ys2) else 0, int(x1), int(y1))
def opt(f):
    return tuple(map(float, sys.argv[sys.argv.index(f) + 1].split(","))) if f in sys.argv else None
def hue(a):
    m = navy(a); px = a[m].mean(0) if m.any() else np.zeros(3)
    return "#%02x%02x%02x" % tuple(int(v) for v in px), colorsys.rgb_to_hsv(*(px / 255))[0] * 360, int(m.sum())
if len(sys.argv) < 4 or sys.argv[1] in ("-h", "--help"):
    sys.exit(__doc__)
o, r, out = sys.argv[1:4]; os.makedirs(out, exist_ok=True)
(oi, os_), (ri, rs_) = load(o), load(r)
oa, ra = np.array(oi), np.array(ri)
ob = opt("--obox") or detect(oa); rb = opt("--rbox") or detect(ra)
print("orig bbox", ob, "w:h %.2f" % ((ob[2] - ob[0]) / (ob[3] - ob[1])), "| result bbox", rb, "w:h %.2f" % ((rb[2] - rb[0]) / (rb[3] - rb[1])))
for k, lab in (("mir", "mirror w:h"),):
    for t, f in (("orig", "--omir"), ("result", "--rmir")):
        m = opt(f)
        if m: print(t, lab, "%.2f" % ((m[2] - m[0]) / (m[3] - m[1])))
def crop(im, b, H=800):
    c = im.crop(tuple(int(v) for v in b)); return c.resize((round(c.width * H / c.height), H))
oc, rc = crop(oi, ob), crop(ri, rb)
name = os.path.splitext(os.path.basename(r))[0].replace(" ", "")
side = Image.new("RGB", (oc.width + rc.width + 10, 800), "white"); side.paste(oc, (0, 0)); side.paste(rc, (oc.width + 10, 0))
side.save(f"{out}/{name}_side.png")
rc2 = rc.resize(oc.size)  # scale+translate registration on bbox
eo = np.array(oc.convert("L").filter(ImageFilter.FIND_EDGES)) > 25
er = np.array(rc2.convert("L").filter(ImageFilter.FIND_EDGES)) > 25
ov = (np.array(rc2) * 0.45 + 255 * 0.55).astype(np.uint8); ov[er] = (0, 0, 0); ov[eo] = (255, 0, 0)
Image.fromarray(ov).save(f"{out}/{name}_edges.png")  # red=original edges, black=result edges
(ho, do, no), (hr, dr, nr) = hue(oa), hue(ra)
print("navy orig %s hue %.1f (n=%d) | result %s hue %.1f (n=%d) | drift %+.1f deg" % (ho, do, no, hr, dr, nr, dr - do))
