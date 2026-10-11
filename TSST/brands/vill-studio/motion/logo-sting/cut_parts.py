"""Cut the approved VILL wordmark PNG into separate shapes by alpha connected components.
Pixels are copied unchanged (no redraw). Same canvas size as source so positions stay exact.
Usage: python cut_parts.py   (run from anywhere)"""
import json, os
from collections import deque
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, "..", "..", "assets", "final", "logo", "Wordmark Dark Transparent.png"))
im = np.array(Image.open(SRC).convert("RGBA"))
H, W = im.shape[:2]
alpha = im[..., 3]
mask = alpha > 0

# 8-connected labelling (BFS), numpy-only
lab = np.zeros((H, W), np.int32); n = 0
ys, xs = np.nonzero(mask)
for y0, x0 in zip(ys, xs):
    if lab[y0, x0]: continue
    n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n
    while q:
        y, x = q.popleft()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; q.append((yy, xx))

def info(i):
    yy, xx = np.nonzero(lab == i); m = alpha[yy, xx] > 200
    col = np.median(im[yy[m], xx[m], :3], axis=0).astype(int)
    return dict(id=i, x0=int(xx.min()), y0=int(yy.min()), x1=int(xx.max()), y1=int(yy.max()), n=len(xx), rgb=col)
comps = [info(i) for i in range(1, n + 1)]
print("raw components:", n)

def cls(c):  # colour class: orange vs light
    return "orange" if c["rgb"][0] > 200 and c["rgb"][2] < 100 else "light"

# merge same-colour components whose bboxes are within GAP px (STUDIO letters; tiny AA specks)
GAP = 14
parent = {c["id"]: c["id"] for c in comps}
def find(a):
    while parent[a] != a: parent[a] = parent[parent[a]]; a = parent[a]
    return a
for a in comps:
    for b in comps:
        if a["id"] < b["id"] and cls(a) == cls(b) == "orange":  # light slabs overlap in bbox (slant): never merge them
            gx = max(a["x0"] - b["x1"], b["x0"] - a["x1"], 0); gy = max(a["y0"] - b["y1"], b["y0"] - a["y1"], 0)
            if max(gx, gy) <= GAP: parent[find(b["id"])] = find(a["id"])
groups = {}
for c in comps: groups.setdefault(find(c["id"]), []).append(c["id"])

parts = []
for ids in groups.values():
    m = np.isin(lab, ids)
    yy, xx = np.nonzero(m)
    out = np.zeros_like(im); out[m] = im[m]
    area = alpha[m].astype(float)
    parts.append(dict(m=m, out=out, x0=int(xx.min()), y0=int(yy.min()), x1=int(xx.max()), y1=int(yy.max()),
                      cx=float((xx * area).sum() / area.sum()), cy=float((yy * area).sum() / area.sum()),
                      cls=cls(dict(rgb=np.median(im[m][alpha[m] > 200][:, :3], axis=0))), px=int(m.sum())))
# name by role: light sorted left->right by x0 = vslab, i, l1, l2; orange: wedge (higher/left), studio (lower)
light = sorted([p for p in parts if p["cls"] == "light"], key=lambda p: p["x0"])
orange = sorted([p for p in parts if p["cls"] == "orange"], key=lambda p: p["y0"])
names = ["v_slab", "i", "l1", "l2"]
assert len(light) == 4 and len(orange) == 2, (len(light), len(orange))
named = {nm: p for nm, p in zip(names, light)}
named["v_wedge"] = orange[0]; named["studio"] = orange[1]
assert named["v_wedge"]["x0"] < named["studio"]["x0"]

os.makedirs(os.path.join(HERE, "parts"), exist_ok=True)
meta = {"source": "Wordmark Dark Transparent.png", "canvas": [W, H], "parts": {}}
recomp = np.zeros_like(im)
for nm, p in named.items():
    Image.fromarray(p["out"], "RGBA").save(os.path.join(HERE, "parts", nm + ".png"))
    recomp[p["m"]] = p["out"][p["m"]]
    meta["parts"][nm] = dict(file="parts/%s.png" % nm, bbox=[p["x0"], p["y0"], p["x1"], p["y1"]],
        centroid=[round(p["cx"], 2), round(p["cy"], 2)], colour_class=p["cls"], pixels=p["px"],
        median_rgb="#%02X%02X%02X" % tuple(int(v) for v in np.median(p["out"][p["m"]][p["out"][p["m"]][:, 3] > 200][:, :3], axis=0)))
allm = np.any([p["m"] for p in named.values()], axis=0)
meta["logo_bbox"] = [min(p["x0"] for p in named.values()), min(p["y0"] for p in named.values()),
                     max(p["x1"] for p in named.values()), max(p["y1"] for p in named.values())]
# verify: every visible pixel in exactly one part; recomposed == source (alpha channel + RGBA where alpha>0)
cover = sum(p["m"].astype(int) for p in named.values())
d = np.abs(recomp.astype(int) - im.astype(int))
d_vis = d[alpha > 0].max() if (alpha > 0).any() else 0
d_alpha = d[..., 3].max()
meta["verify"] = dict(max_diff_visible_rgba=int(d_vis), max_diff_alpha=int(d_alpha),
                      pixels_in_multiple_parts=int((cover > 1).sum()), visible_pixels_unassigned=int(((alpha > 0) & (cover == 0)).sum()))
json.dump(meta, open(os.path.join(HERE, "parts.json"), "w"), indent=2)
print(json.dumps(meta, indent=1))
