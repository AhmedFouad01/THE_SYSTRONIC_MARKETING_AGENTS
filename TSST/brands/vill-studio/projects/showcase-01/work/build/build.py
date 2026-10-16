"""VILL showcase-01 carousel builder (PIL only). Run: python build.py
Writes slide-0N/{01_photo,02_tone,03_text,04_logo}.png + layers.json + slide-0N.png, contact-sheet.png,
export/*.png + linkedin pdf, _qa/contrast.json. Inputs read-only: brands/vill-studio/assets/source/photos-raw and final/logo
(logo composited as-is: alpha-bbox trim + uniform scale only). Text = approved COPY_DECK.md wording, verbatim (line breaks only)."""
import json, glob, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../../../.."))
BRAND = os.path.join(ROOT, "TSST/brands/vill-studio/assets")
FONT = os.path.join(ROOT, "TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/assets/fonts/cairo.ttf")
LOGO = os.path.join(BRAND, "final/logo/Wordmark Dark Transparent.png")  # white+orange mark for DARK grounds (matrix, section C)
sys.path.insert(0, os.path.join(ROOT, "TSST/CREATIVE/tools"))
from contrast import ratio  # noqa: E402

W, H = 1080, 1350
M = 65                              # 6% margin
LOGO_W = 216                        # 20% of width
LOGO_POS = (M, M)                   # same on every slide
PETROL, WHITE, CREAM = (1, 48, 74), (244, 244, 244), (239, 230, 214)
H1_PX, H1_COVER_PX, SUP_PX = 80, 104, 38
TEXT_W = 900

SLIDES = [
 dict(n=1, src=8,  crop=(0, 0, 1086, 1357),     focus=(0.60, 0.35), vig=0.30, h1="Empty shell.\nSea view.\nFinished.", sup=None, cover=True),
 dict(n=2, src=1,  crop=(60, 0, 1040, 1225),    focus=(0.50, 0.30), vig=0.35, h1="We received empty rooms.", sup="Bare walls. Open floor. A sea view waiting."),
 dict(n=3, src=5,  crop=(186, 0, 1086, 1125),   focus=(0.55, 0.30), vig=0.40, h1="The ask: everything.", sup="Finishes, lighting, furniture, all of it. One brief, handled by one team."),
 dict(n=4, src=6,  crop=(0, 50, 1086, 1407),    focus=(0.42, 0.45), vig=0.35, h1="Before: the same space.", sup="Marble floor, blank walls, waiting for a plan. Next: what we did."),
 dict(n=5, src=7,  crop=(0, 100, 960, 1300),    focus=(0.55, 0.30), vig=0.35, h1="After. Made to live in.", sup="Furniture made by VILL, warm light, a natural stone wall."),
 dict(n=6, src=9,  crop=(222, 368, 1086, 1448), focus=(0.50, 0.30), vig=0.35, h1="Detail, up close.", sup="Natural stone, softly lit, with a bench made by VILL beneath.", retouch=True),
 dict(n=7, src=8,  crop=(222, 368, 1086, 1448), focus=(0.38, 0.40), vig=0.40, h1="Every piece, made by VILL.", sup="Bed, sofa, tables, bench. Custom furniture, made for this home."),
 dict(n=8, src=10, crop=(43, 143, 1043, 1393),  focus=(0.50, 0.32), vig=0.30, h1="Back to the sea view.", sup="The view stayed. Now the rooms match it."),
 dict(n=9, src=None, crop=None, focus=(0.5, 0.4), vig=0.0, h1="Have an empty shell?", sup="One team, start to finish.", typeonly=True),
]


def font(px, wght):
    f = ImageFont.truetype(FONT, px)
    f.set_variation_by_axes([wght, 0])
    return f


def photo_path(n):
    return glob.glob(os.path.join(BRAND, f"source/photos-raw/*-{n}.png"))[0]


def retouch_9(im):
    """Remove the red wall plates (x~514-620, y~710-752) by feathered clone of stone 100 px above. Disclosed internal retouch."""
    box, dy = (476, 676, 660, 790), 130
    patch = im.crop((box[0], box[1] - dy, box[2], box[3] - dy))
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).rectangle((18, 18, patch.width - 18, patch.height - 18), fill=255)
    im.paste(patch, box[:2], mask.filter(ImageFilter.GaussianBlur(8)))
    return im


def wrap(draw, text, f, maxw):
    out = []
    for para in text.split("\n"):
        line = ""
        for w in para.split():
            t = (line + " " + w).strip()
            if draw.textlength(t, font=f) <= maxw:
                line = t
            else:
                out.append(line)
                line = w
        out.append(line)
    return out


def balanced(draw, text, f, maxw):
    """Same words, same order; narrowest width that keeps the minimum line count (avoids one-word last lines)."""
    base = wrap(draw, text, f, maxw)
    if len(base) < 2 or chr(10) in text:
        return base
    lo, hi = 200, maxw
    while hi - lo > 4:
        mid = (lo + hi) // 2
        if len(wrap(draw, text, f, mid)) <= len(base):
            hi = mid
        else:
            lo = mid
    return wrap(draw, text, f, hi + 6)


def text_layer(s):
    """Bottom-left text zone; last baseline at H-M-10. Returns layer, text bbox, meta."""
    h1px = H1_COVER_PX if (s.get("cover") or s.get("typeonly")) else H1_PX
    f1, f2 = font(h1px, 800), font(SUP_PX, 500)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    l1 = balanced(d, s["h1"], f1, TEXT_W)
    l2 = balanced(d, s["sup"], f2, TEXT_W) if s["sup"] else []
    lh1, lh2, gap = round(h1px * 1.10), round(SUP_PX * 1.40), 30
    y_end = H - M - 10
    y_sup0 = y_end - (len(l2) - 1) * lh2 if l2 else None
    y_h1_last = (y_sup0 - SUP_PX - gap) if l2 else y_end
    y_h1_0 = y_h1_last - (len(l1) - 1) * lh1
    y = y_h1_0
    for ln in l1:
        d.text((M, y), ln, font=f1, fill=WHITE + (255,), anchor="ls")
        y += lh1
    if l2:
        y = y_sup0
        for ln in l2:
            d.text((M, y), ln, font=f2, fill=CREAM + (255,), anchor="ls")
            y += lh2
    right = M + max([d.textlength(t, font=f1) for t in l1] + [d.textlength(t, font=f2) for t in l2])
    top = int(y_h1_0 - h1px * 0.8)
    return lay, (M, top, int(right), y_end + 14), dict(h1=l1, sup=l2, h1px=h1px)


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def tone_layer(s, top):
    """Petrol #01304A alpha layer: text band, local ellipse behind the logo, mild falloff away from the lit detail. No glow, nothing lighter than the photo."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = np.zeros((H, W), np.float32)
    if not s.get("typeonly"):
        y0 = top - 300
        a = np.maximum(a, 0.84 * smooth((yy - y0) / (top + 40 - y0)))
        e = np.sqrt(((xx - (LOGO_POS[0] + LOGO_W / 2)) / 520) ** 2 + ((yy - (LOGO_POS[1] + 50)) / 300) ** 2)
        a = np.maximum(a, 0.74 * (1 - smooth(e)))
        cx, cy = s["focus"][0] * W, s["focus"][1] * H
        dd = np.sqrt(((xx - cx) / (W * 0.85)) ** 2 + ((yy - cy) / (H * 0.80)) ** 2)
        v = np.clip((dd - 0.30) / 0.80, 0, 1) ** 1.6 * s["vig"]
        a = 1 - (1 - a) * (1 - v)
    col = PETROL
    if s.get("typeonly"):
        dd = np.sqrt(((xx - W * 0.3) / (W * 0.9)) ** 2 + ((yy - H * 0.25) / (H * 0.9)) ** 2)
        a = np.clip((dd - 0.35) / 0.75, 0, 1) ** 1.5 * 0.85
        col = (1, 28, 44)   # deep petrol #011C2C, shade toward lower right
    out = np.zeros((H, W, 4), np.uint8)
    out[..., :3] = col
    out[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def logo_layer():
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    im = Image.open(LOGO).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    im = im.resize((LOGO_W, round(im.height * LOGO_W / im.width)), Image.LANCZOS)
    c.alpha_composite(im, LOGO_POS)
    return c, im.size


def lum_hex(arr):
    p = np.percentile(arr.reshape(-1, 3).astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32), 95)
    return "#%02X%02X%02X" % ((int(p),) * 3)


def flatten(d, layers, upto=99):
    base = None
    for l in sorted(layers, key=lambda l: l["order"]):
        if l["order"] > upto:
            continue
        im = Image.open(os.path.join(d, l["file"])).convert("RGBA")
        if l["opacity"] < 1:
            im.putalpha(im.getchannel("A").point(lambda v: int(v * l["opacity"])))
        if base is None:
            base = im
        else:
            base.alpha_composite(im)
    return base.convert("RGB")


def main():
    qa, outs = {}, []
    os.makedirs(os.path.join(HERE, "export"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "_qa"), exist_ok=True)
    logo, lsize = logo_layer()
    for s in SLIDES:
        d = os.path.join(HERE, f"slide-{s['n']:02d}")
        os.makedirs(d, exist_ok=True)
        if s.get("typeonly"):
            ph, scale, src = Image.new("RGB", (W, H), PETROL), 1.0, "type-only: solid petrol #01304A, no photo"
        else:
            x0, y0, x1, y1 = s["crop"]
            assert abs((x1 - x0) / (y1 - y0) - 0.8) < 0.003, s["n"]
            scale = round(W / (x1 - x0), 3)
            assert scale <= 1.25, (s["n"], scale)
            im = Image.open(photo_path(s["src"])).convert("RGB")
            if s.get("retouch"):
                im = retouch_9(im)
            ph = im.crop(s["crop"]).resize((W, H), Image.LANCZOS)
            src = f"photo #{s['src']} crop {s['crop']} scale {scale}" + (" + clone-retouch of red wall plates (disclosed internal)" if s.get("retouch") else "")
        ph.save(os.path.join(d, "01_photo.png"))
        tl, tb, meta = text_layer(s)
        tl.save(os.path.join(d, "03_text.png"))
        tone_layer(s, tb[1]).save(os.path.join(d, "02_tone.png"))
        logo.save(os.path.join(d, "04_logo.png"))
        layers = [dict(order=1, file="01_photo.png", blend="normal", opacity=1.0, scale=scale, source=src),
                  dict(order=2, file="02_tone.png", blend="normal", opacity=1.0, scale=1.0, source="petrol #01304A alpha: text band + logo quiet zone + falloff"),
                  dict(order=3, file="03_text.png", blend="normal", opacity=1.0, scale=1.0, source=f"Cairo 800 {meta['h1px']}px / Cairo 500 {SUP_PX}px; verbatim COPY_DECK.md", lines=meta),
                  dict(order=4, file="04_logo.png", blend="normal", opacity=1.0, scale=round(LOGO_W / 868, 3), source=f"{os.path.basename(LOGO)} as-is, alpha-bbox trim, {lsize[0]}px wide at {LOGO_POS}")]
        json.dump(dict(canvas=[W, H], layers=layers), open(os.path.join(d, "layers.json"), "w"), indent=2)
        out = flatten(d, layers)
        out.save(os.path.join(d, f"slide-{s['n']:02d}.png"))
        outs.append(out)
        bg = np.array(flatten(d, layers, upto=2))
        tx0, ty0, tx1, ty1 = tb
        reg = bg[max(ty0, 0):ty1, tx0:tx1]
        lg = bg[LOGO_POS[1]:LOGO_POS[1] + lsize[1], LOGO_POS[0]:LOGO_POS[0] + lsize[0]]
        bh, bl = lum_hex(reg), lum_hex(lg)
        qa[s["n"]] = dict(text_bg_p95=bh, h1_vs_bg=round(ratio("#F4F4F4", bh), 2),
                          sup_vs_bg=round(ratio("#EFE6D6", bh), 2) if meta["sup"] else None,
                          logo_bg_p95=bl, logo_white_vs_bg=round(ratio("#F4F4F4", bl), 2),
                          logo_orange_vs_bg=round(ratio("#F58021", bl), 2), scale=scale)
        out.save(os.path.join(HERE, "export", f"VILL_showcase-01_s{s['n']:02d}.png"))
    json.dump(qa, open(os.path.join(HERE, "_qa", "contrast.json"), "w"), indent=2)
    sheet = Image.new("RGB", (3 * 380 + 20, 3 * 470 + 20), (24, 24, 24))
    for i, o in enumerate(outs):
        sheet.paste(o.resize((360, 450), Image.LANCZOS), (20 + (i % 3) * 380, 20 + (i // 3) * 470))
    sheet.save(os.path.join(HERE, "contact-sheet.png"))
    outs[0].save(os.path.join(HERE, "export", "VILL_showcase-01_linkedin.pdf"), save_all=True, append_images=outs[1:], resolution=96.0)
    for k, v in qa.items():
        print(k, v)


if __name__ == "__main__":
    main()
