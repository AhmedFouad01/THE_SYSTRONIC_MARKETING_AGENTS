"""Find the quietest plane for a text box in a photo (UNVALIDATED craft tool, see SK-004 ref/composition.md).
Usage:
  python text_space.py --photo P.png --box WxH [--crop x0,y0,x1,y1 --canvas 1080x1350] [--subject x0,y0,x1,y1]
                       [--margin 64] [--v2 x0,y0,x1,y1] --out OUTDIR
  python text_space.py --slide SLIDE_DIR --out OUTDIR [--subject ...] [--keepout x0,y0,x1,y1 ...]
      (slide mode: reads SLIDE_DIR/01_photo.png and takes the box + the v2 placement from the alpha bbox of the lockup
       layers 03_text.png + 03c_script.png (union). Every OTHER non-photo layer in layers.json (label, logo, accent...)
       becomes an automatic keep-out from its alpha bbox.)
--keepout (repeatable, v0.3): box that counts as busy; a candidate text box must clear it by --margin on every side.
  Auto keep-outs from --slide are listed in result.json["keepouts"]; --no-auto-keepout turns them off.
--crop/--canvas: crop the photo then resize to the canvas (scale > 1.25 is refused).
Ranks the top 3 non-overlapping boxes by quietness: edge density % (Sobel on a 1.5px blur), luminance std,
distance from the subject. The plane is the text box grown to 1.5x its area (quiet if edge density < 5 %).
Text colour: best of the brand set by WCAG contrast (contrast.py logic) against mean / p5 / p95 of the box.
Writes OUTDIR/heatmap.png (red = busy) and OUTDIR/result.json. Default margin 64 px; real safe zones: TOOLCHAIN.md."""
import argparse, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contrast import ratio

BRAND = ["#011C2C", "#F4F4F4", "#01304A"]
EDGE_T = 24.0  # gradient magnitude (0-255 scale, after blur) counted as an edge pixel
QUIET = 5.0
LUMW = np.array([0.2126, 0.7152, 0.0722])


def sobel_mag(g):
    p = np.pad(g, 1, mode="edge")
    gx = (p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[1:-1, :-2] + p[2:, :-2])
    gy = (p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:])
    return np.hypot(gx, gy) / 4.0


def integral(a):
    return np.pad(a.cumsum(0).cumsum(1), ((1, 0), (1, 0)))


def isum(I, x0, y0, x1, y1):
    return I[y1, x1] - I[y0, x1] - I[y1, x0] + I[y0, x0]


def hexs(rgb):
    return "#%02X%02X%02X" % tuple(int(round(v)) for v in rgb)


def stats(I_e, I_l, I_l2, box, subj, diag):
    x0, y0, x1, y1 = box
    n = (x1 - x0) * (y1 - y0)
    ed = 100.0 * isum(I_e, x0, y0, x1, y1) / n
    m = isum(I_l, x0, y0, x1, y1) / n
    sd = max(isum(I_l2, x0, y0, x1, y1) / n - m * m, 0) ** 0.5
    dist = None
    if subj:
        dx = max(subj[0] - x1, x0 - subj[2], 0)
        dy = max(subj[1] - y1, y0 - subj[3], 0)
        dist = (dx * dx + dy * dy) ** 0.5 / diag
    return ed, sd, dist


def colour_pick(arr, box):
    x0, y0, x1, y1 = box
    reg = arr[y0:y1, x0:x1, :3].reshape(-1, 3).astype(float)
    mean = hexs(reg.mean(0))
    lum = reg @ LUMW
    p5 = hexs(reg[np.argmin(abs(lum - np.percentile(lum, 5)))])
    p95 = hexs(reg[np.argmin(abs(lum - np.percentile(lum, 95)))])
    worst = lambda c: min(ratio(c, mean), ratio(c, p5), ratio(c, p95))
    best = max(BRAND, key=worst)
    return dict(mean=mean, text=best, ratio_mean=round(ratio(best, mean), 2), ratio_worst=round(worst(best), 2))


LOCKUP = ["03_text.png", "03c_script.png"]


def auto_keepouts(slide, size):
    """alpha bbox of every non-photo layer in layers.json that is not part of the lockup being placed."""
    out = []
    for l in json.load(open(os.path.join(slide, "layers.json")))["layers"]:
        f = l["file"]
        if f in LOCKUP or f.startswith("01_photo"):
            continue
        p = os.path.join(slide, f)
        if not os.path.exists(p):
            continue
        b = Image.open(p).convert("RGBA").getchannel("A").getbbox()
        if b and (b[2] - b[0]) * (b[3] - b[1]) < 0.6 * size[0] * size[1]:
            out.append(dict(layer=f, box=list(b)))
    return out


def load(a):
    if a.slide:
        im = Image.open(os.path.join(a.slide, "01_photo.png")).convert("RGB")
        t = None
        for f in LOCKUP:  # the lockup being placed = Inter text + script accent layer (union)
            p = os.path.join(a.slide, f)
            if os.path.exists(p):
                b = Image.open(p).convert("RGBA").getchannel("A").getbbox()
                t = b if t is None else (min(t[0], b[0]), min(t[1], b[1]), max(t[2], b[2]), max(t[3], b[3]))
        a.auto_ko = [] if a.no_auto_keepout else auto_keepouts(a.slide, im.size)
        a.v2 = a.v2 or ",".join(map(str, t))
        a.box = a.box or f"{t[2] - t[0]}x{t[3] - t[1]}"
        return im
    im = Image.open(a.photo).convert("RGB")
    if a.crop:
        x0, y0, x1, y1 = map(int, a.crop.split(","))
        cw, ch = map(int, a.canvas.split("x"))
        if cw / (x1 - x0) > 1.25:
            sys.exit(f"REFUSED: scale {cw / (x1 - x0):.2f} > 1.25 cap")
        im = im.crop((x0, y0, x1, y1)).resize((cw, ch), Image.LANCZOS)
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--photo"); ap.add_argument("--slide"); ap.add_argument("--box")
    ap.add_argument("--crop"); ap.add_argument("--canvas", default="1080x1350"); ap.add_argument("--subject")
    ap.add_argument("--v2"); ap.add_argument("--margin", type=int, default=64); ap.add_argument("--out", required=True)
    ap.add_argument("--stride", type=int, default=12)
    ap.add_argument("--keepout", action="append", default=[], help="x0,y0,x1,y1 (repeatable)")
    ap.add_argument("--no-auto-keepout", action="store_true")
    a = ap.parse_args()
    a.auto_ko = []
    if not (a.photo or a.slide) or (not a.box and not a.slide):
        ap.error("need --slide, or --photo with --box")
    im = load(a)
    W, H = im.size
    tw, th = map(int, a.box.lower().split("x"))
    k = 1.5 ** 0.5
    pw, ph = int(tw * k + .999), int(th * k + .999)
    arr = np.asarray(im)
    lum = arr[..., :3].astype(float) @ LUMW
    g = np.asarray(im.convert("L").filter(ImageFilter.GaussianBlur(1.5)), float)
    edge = (sobel_mag(g) > EDGE_T).astype(float)
    I_e, I_l, I_l2 = integral(edge), integral(lum), integral(lum * lum)
    subj = tuple(map(int, a.subject.split(","))) if a.subject else None
    diag = (W * W + H * H) ** 0.5
    m = a.margin
    kos = [dict(layer="--keepout", box=list(map(int, k.split(",")))) for k in a.keepout] + a.auto_ko
    cands = []
    for y in range(m, H - m - ph + 1, a.stride):
        for x in range(m, W - m - pw + 1, a.stride):
            plane = (x, y, x + pw, y + ph)
            ox, oy = (pw - tw) // 2, (ph - th) // 2
            tb = (x + ox, y + oy, x + ox + tw, y + oy + th)
            if subj and not (tb[2] <= subj[0] or tb[0] >= subj[2] or tb[3] <= subj[1] or tb[1] >= subj[3]):
                continue
            if any(not (tb[2] + m <= k["box"][0] or tb[0] - m >= k["box"][2] or
                        tb[3] + m <= k["box"][1] or tb[1] - m >= k["box"][3]) for k in kos):
                continue
            ed, sd, dist = stats(I_e, I_l, I_l2, plane, subj, diag)
            cands.append((ed + 0.15 * sd - (10 * dist if dist is not None else 0), ed, sd, dist, plane, tb))
    cands.sort(key=lambda c: c[0])
    top = []
    for c in cands:
        if all(c[4][2] <= t[4][0] or c[4][0] >= t[4][2] or c[4][3] <= t[4][1] or c[4][1] >= t[4][3] for t in top):
            top.append(c)
        if len(top) == 3:
            break
    res = dict(canvas=[W, H], text_box=[tw, th], plane=[pw, ph], edge_threshold=EDGE_T, margin=m, keepouts=kos, picks=[])
    for i, (s, ed, sd, dist, plane, tb) in enumerate(top, 1):
        res["picks"].append(dict(rank=i, text_box_xyxy=list(tb), plane_xyxy=list(plane), edge_pct=round(ed, 2),
                                 lum_std=round(sd, 1), subject_dist=None if dist is None else round(dist, 3),
                                 quiet=bool(ed < QUIET), **colour_pick(arr, tb)))
    if a.v2:
        v = tuple(map(int, a.v2.split(",")))
        px, py = (pw - tw) // 2, (ph - th) // 2
        vp = (max(0, v[0] - px), max(0, v[1] - py), min(W, v[2] + px), min(H, v[3] + py))
        ed, sd, dist = stats(I_e, I_l, I_l2, vp, subj, diag)
        sc = ed + 0.15 * sd
        better = sum(c[0] < sc for c in cands) / max(len(cands), 1) * 100
        res["v2"] = dict(text_box_xyxy=list(v), plane_xyxy=list(vp), edge_pct=round(ed, 2), lum_std=round(sd, 1),
                         quiet=bool(ed < QUIET), pct_of_positions_quieter=round(better, 1), **colour_pick(arr, v))
    os.makedirs(a.out, exist_ok=True)
    # heat-map: local edge density in a 81px window (red = busy)
    r = 40
    ys, xs = np.arange(H), np.arange(W)
    y0, y1 = np.clip(ys - r, 0, H), np.clip(ys + r, 0, H)
    x0, x1 = np.clip(xs - r, 0, W), np.clip(xs + r, 0, W)
    S = I_e[y1][:, x1] - I_e[y0][:, x1] - I_e[y1][:, x0] + I_e[y0][:, x0]
    hm = S / ((y1 - y0)[:, None] * (x1 - x0)[None, :])
    over = np.zeros((H, W, 4), np.uint8)
    over[..., 0] = 255
    over[..., 3] = (np.clip(hm / 0.15, 0, 1) * 180).astype(np.uint8)
    pv = im.convert("RGBA")
    pv.alpha_composite(Image.fromarray(over))
    d = ImageDraw.Draw(pv)
    for p, c in zip(res["picks"], ["#00FF66", "#FFE600", "#00C8FF"]):
        d.rectangle(p["plane_xyxy"], outline=c, width=2)
        d.rectangle(p["text_box_xyxy"], outline=c, width=5)
        d.text((p["text_box_xyxy"][0] + 6, p["text_box_xyxy"][1] + 4), f"#{p['rank']} {p['edge_pct']}%", fill=c)
    if a.v2:
        b = res["v2"]["text_box_xyxy"]
        d.rectangle(b, outline="#FF00FF", width=4)
        d.text((b[0] + 6, b[3] + 6), f"v2 {res['v2']['edge_pct']}%", fill="#FF00FF")
    if subj:
        d.rectangle(subj, outline="#FFFFFF", width=3)
    for k in kos:
        b = k["box"]
        d.rectangle([b[0] - m, b[1] - m, b[2] + m, b[3] + m], outline="#FF8800", width=2)
        d.rectangle(b, outline="#FF8800", width=4)
        d.text((b[0] + 4, b[1] - m + 4), "KEEP-OUT " + os.path.basename(k["layer"]), fill="#FF8800")
    pv.convert("RGB").save(os.path.join(a.out, "heatmap.png"))
    json.dump(res, open(os.path.join(a.out, "result.json"), "w"), indent=1)
    for p in res["picks"]:
        print(f"#{p['rank']} box={p['text_box_xyxy']} edge={p['edge_pct']}% std={p['lum_std']} dist={p['subject_dist']} "
              f"mean={p['mean']} text={p['text']} ratio={p['ratio_mean']} worst={p['ratio_worst']}")
    if a.v2:
        print("v2 ", res["v2"])
    for k in kos:
        print("keepout", k["layer"], k["box"])


if __name__ == "__main__":
    main()
