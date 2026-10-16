"""VILL showcase-01 v2 builder (PIL only). Run: python build.py
ZERO colour layers over photos. Layers per slide: 01_photo (real photo crop, unretouched except s5 clean),
02_accent (solid, type-only slide), 03_text, 03b_label, 04_logo (slides 1 and 7 only).
Text legibility = placement + colour choice, verified here against the PHOTO pixels under each text box
(worst case of p5/p50/p95 luminance pixels) with tools/contrast.py. The build prints FAIL below threshold.
Inputs read-only. Text verbatim from COPY_DECK.md 'v2 placement'."""
import json, glob, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../../../.."))
BRAND = os.path.join(ROOT, "TSST/brands/vill-studio/assets")
FONTS = os.path.join(ROOT, "TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/assets/fonts")
CAIRO = os.path.join(FONTS, "cairo.ttf")                       # brand face (BRAND.md), variable wght
BARLOW = os.path.join(FONTS, "barlow-condensed-bold.ttf")      # brand label-only face
LOGO_DIR = os.path.join(BRAND, "final/logo")
sys.path.insert(0, os.path.join(ROOT, "TSST/CREATIVE/tools"))
from contrast import ratio  # noqa: E402

W, H = 1080, 1350
M = 64
DPETROL, WHITE, CREAM, ORANGE = "#011C2C", "#F4F4F4", "#EFE6D6", "#F58021"
LOGO_W = 150    # 14% of width, small and quiet


def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# crop = (x0,y0,x1,y1) in the 1086x1448 source; frame = inner photo rect on canvas (framed slides)
SLIDES = [
    dict(n=1, kind="full-bleed cover", src=8, crop=(0, 0, 1086, 1357),
         text=dict(lines=["Empty shell. Sea view.", "Finished."], px=50, wght=400, color=WHITE, anchor=(172, 66), lh=1.14),
         logo=dict(variant="Wordmark Dark Transparent.png", pos=(868, 1252))),
    dict(n=2, kind="full-bleed Before", src=1, crop=(0, 0, 1086, 1357),
         text=dict(lines=["We received", "empty rooms."], px=48, wght=400, color=DPETROL, anchor=(470, 122), lh=1.14),
         label=dict(txt="BEFORE", color=WHITE, pos=(M, 1262))),
    dict(n=3, kind="framed (cream passe-partout) Before", src=6, crop=(0, 0, 1086, 1448), frame=(108, 84, 972, 1236), field=CREAM,
         label=dict(txt="BEFORE", color=DPETROL, pos=(108, 1262))),
    dict(n=4, kind="full-bleed After", src=7, crop=(0, 60, 1086, 1417),
         text=dict(lines=["Made to", "live in."], px=48, wght=400, color=WHITE, anchor=(64, 50), lh=1.14),
         label=dict(txt="AFTER", color=WHITE, pos=(M, 1262))),
    dict(n=5, kind="detail tight crop", src=9, crop=(222, 368, 1086, 1448), retouch=True),
    dict(n=6, kind="full-bleed sea view", src=10, crop=(0, 91, 1086, 1448)),
    dict(n=7, kind="type-only solid dark petrol", src=None, field=DPETROL,
         text=dict(lines=["One team,", "start to finish."], px=76, wght=300, color=WHITE, anchor=(M, 520), lh=1.14),
         logo=dict(variant="Wordmark Dark Transparent.png", pos=(M, 1136)), accent=True),
]


def font(path, px, wght=None):
    f = ImageFont.truetype(path, px)
    if wght is not None:
        f.set_variation_by_axes([wght, 0])
    return f


def photo_path(n):
    return glob.glob(os.path.join(BRAND, f"source/photos-raw/*-{n}.png"))[0]


def retouch_9(im):
    """DISCLOSED INTERNAL RETOUCH (needs Ahmed OK): remove 2 red wall plates by feathered clone of stone 130px above."""
    box, dy = (476, 676, 660, 790), 130
    patch = im.crop((box[0], box[1] - dy, box[2], box[3] - dy))
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).rectangle((18, 18, patch.width - 18, patch.height - 18), fill=255)
    im.paste(patch, box[:2], mask.filter(ImageFilter.GaussianBlur(8)))
    return im


def tracked(draw, xy, txt, f, fill, track):
    x, y = xy
    for ch in txt:
        draw.text((x, y), ch, font=f, fill=fill, anchor="ls")
        x += draw.textlength(ch, font=f) + track
    return x


def build_photo(s, alt=False):
    x0, y0, x1, y1 = s["crop"]
    im = Image.open(photo_path(s["src"])).convert("RGB")
    note = f"photo #{s['src']} crop {s['crop']}"
    if s.get("retouch") and not alt:
        im = retouch_9(im)
        note += " + clone-retouch of red wall plates (DISCLOSED, pending Ahmed OK)"
    elif s.get("retouch"):
        note += " UNRETOUCHED ALT"
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


def text_layer(spec):
    f = font(CAIRO, spec["px"], spec["wght"])
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    x, y = spec["anchor"]
    lh = round(spec["px"] * spec["lh"])
    right = x
    for i, ln in enumerate(spec["lines"]):
        d.text((x, y + spec["px"] + i * lh), ln, font=f, fill=hx(spec["color"]) + (255,), anchor="ls")
        right = max(right, x + d.textlength(ln, font=f))
    box = (x - 6, y - 4, int(right) + 6, y + spec["px"] + (len(spec["lines"]) - 1) * lh + int(spec["px"] * 0.32))
    return lay, box


def label_layer(spec):
    f = font(BARLOW, 27)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    x, y = spec["pos"]
    end = tracked(d, (x, y + 24), spec["txt"], f, hx(spec["color"]) + (255,), 4.5)
    return lay, (x - 6, y - 2, int(end) + 6, y + 30)


def logo_layer(spec):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    im = Image.open(os.path.join(LOGO_DIR, spec["variant"])).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())          # alpha-bbox trim + uniform scale only
    im = im.resize((LOGO_W, round(im.height * LOGO_W / im.width)), Image.LANCZOS)
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
                worst=worst, need=need, ok=worst >= need)


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
            canvas.save(os.path.join(d, "01_photo.png"))
            layers.append(dict(order=1, file="01_photo.png", blend="normal", opacity=1.0, scale=scale, source=note + f" scale {scale}"))
            if s.get("retouch"):
                alt, _, _ = build_photo(s, alt=True)
                alt.save(os.path.join(HERE, "export", f"VILL_showcase-01v2_s{s['n']:02d}_ALT-unretouched.png"))
        else:
            canvas = Image.new("RGB", (W, H), hx(s["field"]))
            canvas.save(os.path.join(d, "01_photo.png"))
            scale = 1.0
            layers.append(dict(order=1, file="01_photo.png", blend="normal", opacity=1.0, scale=1.0, source=f"solid {s['field']}, no photo"))
        arr = np.array(canvas)
        order = 2
        if "frame" in s:
            layers[0]["source"] += f"; framed at {s['frame']} on solid {s['field']} (field baked into layer 01)"
        if s.get("accent"):
            ac = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(ac).rectangle((M, 468, M + 56, 472), fill=hx(ORANGE) + (255,))
            ac.save(os.path.join(d, "02_accent.png"))
            layers.append(dict(order=order, file="02_accent.png", blend="normal", opacity=1.0, scale=1.0, source=f"solid orange {ORANGE} rule 57x5 (solid field, not an overlay)"))
            order += 1
        if "text" in s:
            lay, box = text_layer(s["text"])
            lay.save(os.path.join(d, "03_text.png"))
            q["text"] = check(s["text"]["color"], arr, box, 3.0 if s["text"]["px"] >= 48 else 4.5)
            q["text"]["box"] = box
            layers.append(dict(order=order, file="03_text.png", blend="normal", opacity=1.0, scale=1.0,
                               source=f"Cairo {s['text']['wght']} {s['text']['px']}px {s['text']['color']}; verbatim COPY_DECK v2", lines=s["text"]["lines"]))
            order += 1
        if "label" in s:
            lay, box = label_layer(s["label"])
            lay.save(os.path.join(d, "03b_label.png"))
            q["label"] = check(s["label"]["color"], arr, box, 4.5)
            q["label"]["box"] = box
            layers.append(dict(order=order, file="03b_label.png", blend="normal", opacity=1.0, scale=1.0, source=f"Barlow Condensed Bold 27px tracked {s['label']['color']}"))
            order += 1
        if "logo" in s:
            lay, box = logo_layer(s["logo"])
            lay.save(os.path.join(d, "04_logo.png"))
            wm = s["logo"]["variant"]
            fg = "#01304A" if "Light" in wm else WHITE
            q["logo"] = check(fg, arr, box, 4.5)
            q["logo"]["variant"] = wm
            q["logo"]["box"] = box
            q["logo"]["orange_vs_bg_p50"] = round(ratio(ORANGE, q["logo"]["bg_p50"]), 2)
            layers.append(dict(order=order, file="04_logo.png", blend="normal", opacity=1.0, scale=round(LOGO_W / 868, 3), source=f"{wm} as-is, alpha-bbox trim, {LOGO_W}px wide at {s['logo']['pos']}"))
            order += 1
        json.dump(dict(canvas=[W, H], kind=s["kind"], layers=layers), open(os.path.join(d, "layers.json"), "w"), indent=2)
        out = flatten(d, layers)
        out.save(os.path.join(d, f"slide-{s['n']:02d}.png"))
        out.save(os.path.join(HERE, "export", f"VILL_showcase-01v2_s{s['n']:02d}.png"))
        outs.append(out)
        q.update(kind=s["kind"], scale=scale)
        qa[s["n"]] = q
        for k in ("text", "label", "logo"):
            if k in q and not q[k]["ok"]:
                print(f"!! slide {s['n']} {k} FAILS contrast", q[k])
    json.dump(qa, open(os.path.join(HERE, "_qa", "contrast.json"), "w"), indent=2)
    cols = 4
    sheet = Image.new("RGB", (cols * 380 + 20, 2 * 470 + 20), (24, 24, 24))
    for i, o in enumerate(outs):
        sheet.paste(o.resize((360, 450), Image.LANCZOS), (20 + (i % cols) * 380, 20 + (i // cols) * 470))
    sheet.save(os.path.join(HERE, "contact-sheet.png"))
    outs[0].save(os.path.join(HERE, "export", "VILL_showcase-01v2_linkedin.pdf"), save_all=True, append_images=outs[1:], resolution=96.0)
    for k, v in qa.items():
        print(k, {a: (b if not isinstance(b, dict) else (b["worst"], b["need"], b["ok"])) for a, b in v.items()})


if __name__ == "__main__":
    main()
