"""VILL showcase-01 v3 builder (PIL only). Run: python build.py
v3 = v2 layout/photos/sequence, re-set in Inter (display 28pt, labels 18pt) with ONE Alex Brush script accent word
per lockup slide (s4 "live", s7 "finish."). ZERO colour layers over photos. Layers per slide:
01_photo, 02_accent (s7 solid rule), 03_text (Inter), 03c_script (Alex Brush word, own layer, editable), 03b_label, 04_logo (s1, s7).
Contrast is measured on the real PHOTO pixels under each ink box (p5/p50/p95, tools/contrast.py); build prints FAIL.
Text verbatim from COPY_DECK.md 'v2 placement'; only breaks/case change. Inputs read-only."""
import json, glob, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../../../.."))
BRAND = os.path.join(ROOT, "TSST/brands/vill-studio/assets")
LOGO_DIR = os.path.join(BRAND, "final/logo")
UF = os.path.expandvars(r"$LOCALAPPDATA/Microsoft/Windows/Fonts/")
INTER_D = UF + "Inter_28pt-SemiBold.ttf"      # display / headline (>= 40 px)
INTER_L = UF + "Inter_18pt-SemiBold.ttf"      # small caps labels (< 28 px)
SCRIPT = os.path.join(ROOT, "TSST/CREATIVE/fonts/alexbrush/AlexBrush-Regular.ttf")
sys.path.insert(0, os.path.join(ROOT, "TSST/CREATIVE/tools"))
from contrast import ratio  # noqa: E402

W, H = 1080, 1350
M = 64
DPETROL, WHITE, CREAM, ORANGE = "#011C2C", "#F4F4F4", "#EFE6D6", "#F58021"
LOGO_W = 150
CAP = 0.727          # Inter cap-height / em
SCR_K = 1.6          # script size vs Inter size (lockups.md: 1.5-1.7x)


def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# crop = (x0,y0,x1,y1) in the 1086x1448 source, ratio 0.8, scale <= 1.25
SLIDES = [
    dict(n=1, kind="full-bleed cover", src=8, crop=(222, 30, 1086, 1110),
         text=dict(lines=[[("Empty shell.", "i")], [("Sea view.", "i")], [("Finished.", "i")]], px=62, color=WHITE, anchor=(92, 54), lh=1.12, track=-1.0),
         logo=dict(variant="Wordmark Dark Transparent.png", pos=(910, 1264), w=106)),
    dict(n=2, kind="full-bleed Before", src=1, crop=(140, 0, 1086, 1182),
         text=dict(lines=[[("We received", "i")], [("empty rooms.", "i")]], px=72, color=DPETROL, anchor=(408, 130), lh=1.12, track=-1.2),
         label=dict(txt="BEFORE", color=WHITE, pos=(M, 1262))),
    dict(n=3, kind="framed (cream passe-partout) Before", src=6, crop=(0, 0, 1086, 1448), frame=(108, 84, 972, 1236), field=CREAM,
         label=dict(txt="BEFORE", color=DPETROL, pos=(108, 1262))),
    dict(n=4, kind="full-bleed After", src=7, crop=(0, 0, 986, 1232),
         text=dict(lines=[[("Made to", "i")], [("live", "s"), (" in.", "i")]], px=76, color=WHITE, script_color=WHITE, anchor=(M, 64), lh=1.12, lh_script=1.34, track=-1.2),
         label=dict(txt="AFTER", color=WHITE, pos=(M, 1262))),
    dict(n=5, kind="detail tight crop", src=9, crop=(222, 368, 1086, 1448), retouch=True),
    dict(n=6, kind="full-bleed sea view", src=10, crop=(0, 91, 1086, 1448)),
    dict(n=7, kind="type-only solid dark petrol", src=None, field=DPETROL,
         text=dict(lines=[[("One team,", "i")], [("start to ", "i"), ("finish", "s"), (".", "i")]], px=92, color=WHITE, script_color=ORANGE, anchor=(M, 500), lh=1.12, lh_script=1.34, track=-1.8),
         logo=dict(variant="Wordmark Dark Transparent.png", pos=(M, 1136)), accent=True),
]


def F(path, px):
    return ImageFont.truetype(path, int(round(px)))


def photo_path(n):
    return glob.glob(os.path.join(BRAND, f"source/photos-raw/*-{n}.png"))[0]


def retouch_9(im):
    """Owner-approved (2026-10-08) clean version: remove 2 red wall plates by feathered clone of stone 130px above."""
    box, dy = (476, 676, 660, 790), 130
    patch = im.crop((box[0], box[1] - dy, box[2], box[3] - dy))
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).rectangle((18, 18, patch.width - 18, patch.height - 18), fill=255)
    im.paste(patch, box[:2], mask.filter(ImageFilter.GaussianBlur(8)))
    return im


def tracked(draw, x, y, txt, f, fill, track):
    """Draw with tracking; position of char i = length(prefix) + i*track (keeps kerning of the prefix)."""
    for i, ch in enumerate(txt):
        draw.text((x + draw.textlength(txt[:i], font=f) + i * track, y), ch, font=f, fill=fill, anchor="ls")
    return x + draw.textlength(txt, font=f) + len(txt) * track


def build_photo(s):
    x0, y0, x1, y1 = s["crop"]
    im = Image.open(photo_path(s["src"])).convert("RGB")
    note = f"photo #{s['src']} crop {s['crop']}"
    if s.get("retouch"):
        im = retouch_9(im)
        note += " + clean version (wall plates removed, owner-approved)"
    crop = im.crop(s["crop"])
    if "frame" in s:
        fx0, fy0, fx1, fy1 = s["frame"]
        scale = round((fx1 - fx0) / (x1 - x0), 3)
        canvas = Image.new("RGB", (W, H), hx(s["field"]))
        canvas.paste(crop.resize((fx1 - fx0, fy1 - fy0), Image.LANCZOS), (fx0, fy0))
        return canvas, scale, note
    assert abs((x1 - x0) / (y1 - y0) - 0.8) < 0.003, s["n"]
    scale = round(W / (x1 - x0), 3)
    assert scale <= 1.25, (s["n"], scale)
    return crop.resize((W, H), Image.LANCZOS), scale, note


def text_layers(spec):
    """Returns (inter_layer, script_layer or None, inter_box, script_box or None). Shared baseline per line."""
    px = spec["px"]
    fi, fs = F(INTER_D, px), F(SCRIPT, px * SCR_K)
    li = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ls_ = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    di, ds = ImageDraw.Draw(li), ImageDraw.Draw(ls_)
    x0, ytop = spec["anchor"]
    base = ytop + CAP * px
    has_s = False
    for ln in spec["lines"]:
        x = x0
        is_s = any(k == "s" for _, k in ln)
        for txt, k in ln:
            if k == "i":
                x = tracked(di, x, base, txt, fi, hx(spec["color"]) + (255,), spec["track"])
            else:
                has_s = True
                ds.text((x, base), txt, font=fs, fill=hx(spec["script_color"]) + (255,), anchor="ls")
                x += ds.textlength(txt, font=fs)
        base += px * (spec.get("lh_script", spec["lh"]) if is_s else spec["lh"])
    pad = 6

    def bx(l):
        b = l.getchannel("A").getbbox()
        return (b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad) if b else None
    return li, (ls_ if has_s else None), bx(li), (bx(ls_) if has_s else None)


def label_layer(spec):
    f = F(INTER_L, 26)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    x, y = spec["pos"]
    tracked(d, x, y + 22, spec["txt"], f, hx(spec["color"]) + (255,), 4.2)    # +16 % tracking
    b = lay.getchannel("A").getbbox()
    return lay, (b[0] - 6, b[1] - 6, b[2] + 6, b[3] + 6)


def logo_layer(spec):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    im = Image.open(os.path.join(LOGO_DIR, spec["variant"])).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    lw = spec.get("w", LOGO_W)
    im = im.resize((lw, round(im.height * lw / im.width)), Image.LANCZOS)
    c.alpha_composite(im, spec["pos"])
    return c, (spec["pos"][0] - 8, spec["pos"][1] - 8, spec["pos"][0] + im.width + 8, spec["pos"][1] + im.height + 8)


def region_stats(arr, box):
    x0, y0, x1, y1 = [max(0, int(v)) for v in box]
    reg = arr[y0:y1, x0:x1, :3].astype(np.float32).reshape(-1, 3)
    lum = reg @ np.array([0.2126, 0.7152, 0.0722], np.float32)

    def pix(p):
        r = reg[np.argmin(np.abs(lum - np.percentile(lum, p)))]
        return "#%02X%02X%02X" % tuple(int(v) for v in r)
    return pix(5), pix(50), pix(95)


def check(fg, arr, box, need):
    p5, p50, p95 = region_stats(arr, box)
    r = {k: round(ratio(fg, v), 2) for k, v in (("p5", p5), ("p50", p50), ("p95", p95))}
    worst = min(r.values())
    return dict(fg=fg, bg_p5=p5, bg_p50=p50, bg_p95=p95, ratio_p5=r["p5"], ratio_p50=r["p50"], ratio_p95=r["p95"],
                worst=worst, need=need, ok=worst >= need, box=list(box))


def flatten(d, layers):
    base = None
    for l in sorted(layers, key=lambda l: l["order"]):
        im = Image.open(os.path.join(d, l["file"])).convert("RGBA")
        if base is None:
            base = im
        else:
            base.alpha_composite(im)
    return base.convert("RGB")


def main():
    qa, outs = {}, []
    os.makedirs(os.path.join(HERE, "export"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "_qa"), exist_ok=True)
    for s in SLIDES:
        d = os.path.join(HERE, f"slide-{s['n']:02d}")
        os.makedirs(d, exist_ok=True)
        layers, q = [], {}
        if s["src"]:
            canvas, scale, note = build_photo(s)
            layers.append(dict(order=1, file="01_photo.png", blend="normal", opacity=1.0, scale=scale, source=note + f" scale {scale}"))
        else:
            canvas = Image.new("RGB", (W, H), hx(s["field"])); scale = 1.0
            layers.append(dict(order=1, file="01_photo.png", blend="normal", opacity=1.0, scale=1.0, source=f"solid {s['field']}, no photo"))
        canvas.save(os.path.join(d, "01_photo.png"))
        arr = np.array(canvas)
        order = 2
        if "frame" in s:
            layers[0]["source"] += f"; framed at {s['frame']} on solid {s['field']}"
        if s.get("accent"):
            ac = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(ac).rectangle((M, 452, M + 56, 456), fill=hx(ORANGE) + (255,))
            ac.save(os.path.join(d, "02_accent.png"))
            layers.append(dict(order=order, file="02_accent.png", blend="normal", opacity=1.0, scale=1.0, source=f"solid orange {ORANGE} rule 57x5"))
            order += 1
        if "text" in s:
            t = s["text"]
            li, ls_, bi, bs = text_layers(t)
            li.save(os.path.join(d, "03_text.png"))
            need = 3.0 if t["px"] >= 48 else 4.5
            q["text"] = check(t["color"], arr, bi, need)
            layers.append(dict(order=order, file="03_text.png", blend="normal", opacity=1.0, scale=1.0,
                               source=f"Inter 28pt SemiBold {t['px']}px, tracking {t['track']}px, leading {t['lh']}, {t['color']}; verbatim COPY_DECK v2",
                               lines=["".join(x for x, _ in ln) for ln in t["lines"]]))
            order += 1
            if ls_ is not None:
                ls_.save(os.path.join(d, "03c_script.png"))
                q["script"] = check(t["script_color"], arr, bs, need)
                q["script"]["orange_alt"] = check(ORANGE, arr, bs, need)["worst"]
                layers.append(dict(order=order, file="03c_script.png", blend="normal", opacity=1.0, scale=1.0,
                                   source=f"Alex Brush {round(t['px'] * SCR_K)}px ({SCR_K}x), {t['script_color']}, one accent word, shared baseline"))
                order += 1
        if "label" in s:
            lay, box = label_layer(s["label"])
            lay.save(os.path.join(d, "03b_label.png"))
            q["label"] = check(s["label"]["color"], arr, box, 4.5)
            layers.append(dict(order=order, file="03b_label.png", blend="normal", opacity=1.0, scale=1.0, source=f"Inter 18pt SemiBold 26px caps tracking +4.2px {s['label']['color']}"))
            order += 1
        if "logo" in s:
            lay, box = logo_layer(s["logo"])
            lay.save(os.path.join(d, "04_logo.png"))
            q["logo"] = check(WHITE, arr, box, 4.5)
            q["logo"]["variant"] = s["logo"]["variant"]
            layers.append(dict(order=order, file="04_logo.png", blend="normal", opacity=1.0, scale=round(s["logo"].get("w", LOGO_W) / 868, 3), source=f"{s['logo']['variant']} as-is, alpha-bbox trim, {s['logo'].get('w', LOGO_W)}px wide at {s['logo']['pos']}"))
            order += 1
        json.dump(dict(canvas=[W, H], kind=s["kind"], layers=layers), open(os.path.join(d, "layers.json"), "w"), indent=2)
        out = flatten(d, layers)
        out.save(os.path.join(d, f"slide-{s['n']:02d}.png"))
        out.save(os.path.join(HERE, "export", f"VILL_showcase-01v3_s{s['n']:02d}.png"))
        outs.append(out)
        q.update(kind=s["kind"], scale=scale)
        qa[s["n"]] = q
        for k in ("text", "script", "label", "logo"):
            if k in q and not q[k]["ok"]:
                print(f"!! slide {s['n']} {k} FAILS contrast", q[k]["fg"], q[k]["worst"], "need", q[k]["need"])
    json.dump(qa, open(os.path.join(HERE, "_qa", "contrast.json"), "w"), indent=2)
    cols = 4
    sheet = Image.new("RGB", (cols * 380 + 20, 2 * 470 + 20), (24, 24, 24))
    for i, o in enumerate(outs):
        sheet.paste(o.resize((360, 450), Image.LANCZOS), (20 + (i % cols) * 380, 20 + (i // cols) * 470))
    sheet.save(os.path.join(HERE, "contact-sheet.png"))
    outs[0].save(os.path.join(HERE, "export", "VILL_showcase-01v3_linkedin.pdf"), save_all=True, append_images=outs[1:], resolution=96.0)
    for k, v in qa.items():
        print(k, {a: (b if not isinstance(b, dict) else (b["fg"], b["worst"], b["need"], b["ok"])) for a, b in v.items()})


if __name__ == "__main__":
    main()
