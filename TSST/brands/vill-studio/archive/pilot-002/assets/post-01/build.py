"""VILL post-01 carousel builder (PIL only). Run: python build.py  -> slide-0N/{01_photo,02_tone,03_logo}.png, layers.json, slide-0N.png, contact-sheet.png
Inputs are read-only: assets/source/photos-raw (photos) and assets/final/logo (logo, composited as-is, scaled + alpha-bbox trim only)."""
import json, glob, os
from PIL import Image, ImageFilter
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.abspath(os.path.join(HERE, "../../../../brands/vill-studio/assets"))
W, H = 1080, 1350
DEEP_NAVY = (1, 28, 44)  # #011C2C
LOGO = os.path.join(BRAND, "final/logo/Wordmark Dark Transparent.png")  # white+orange, for dark/blue photo areas (section C)
LOGO_W, MARGIN = 168, 72  # same size + top-left position on every slide

def photo(n):
    return glob.glob(os.path.join(BRAND, f"source/photos-raw/*-{n}.png"))[0]

# crop box = (x0,y0,x1,y1) in 1086x1448 source, always 4:5. scale = 1080/width (<=1.25)
SLIDES = [
  dict(n=1, src=10, crop=(0, 0, 1086, 1357),   focus=(0.50, 0.30), strength=0.34, logo=True, note="place + sea, scale 0.99"),
  dict(n=2, src=8,  crop=(222, 0, 1086, 1080), focus=(0.58, 0.40), strength=0.42, logo=False, note="lit stone wall + pendant, scale 1.25"),
  dict(n=3, src=7,  crop=(222, 200, 1086, 1280), focus=(0.40, 0.28), strength=0.55, logo=False, note="niche + lamp + dining, scale 1.25"),
]

def tone(focus, strength):
    """Transparent deep-navy falloff: clear around the lit detail, darker toward edges/bottom. No fake light."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = focus[0] * W, focus[1] * H
    d = np.sqrt(((xx - cx) / (W * 0.85)) ** 2 + ((yy - cy) / (H * 0.80)) ** 2)
    a = np.clip((d - 0.30) / 0.80, 0, 1) ** 1.6 * strength
    out = np.zeros((H, W, 4), np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = DEEP_NAVY
    out[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")

def logo_layer(show):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if not show: return c  # logo on slide 1 only (decision in sheet); empty transparent canvas keeps the layer stack identical
    im = Image.open(LOGO).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    im = im.resize((LOGO_W, round(im.height * LOGO_W / im.width)), Image.LANCZOS)
    c.alpha_composite(im, (MARGIN, MARGIN))
    return c

def main():
    outs = []
    for s in SLIDES:
        d = os.path.join(HERE, f"slide-{s['n']:02d}"); os.makedirs(d, exist_ok=True)
        x0, y0, x1, y1 = s["crop"]; assert abs((x1-x0)/(y1-y0) - 0.8) < 0.002 and W/(x1-x0) <= 1.25001
        ph = Image.open(photo(s["src"])).convert("RGB").crop(s["crop"]).resize((W, H), Image.LANCZOS)
        ph.save(os.path.join(d, "01_photo.png"))
        tone(s["focus"], s["strength"]).save(os.path.join(d, "02_tone.png"))
        logo_layer(s["logo"]).save(os.path.join(d, "03_logo.png"))
        layers = [{"order": 1, "file": "01_photo.png", "blend": "normal", "opacity": 1.0, "source": f"photo #{s['src']} crop {s['crop']} ({s['note']})"},
                  {"order": 2, "file": "02_tone.png", "blend": "normal", "opacity": 1.0},
                  {"order": 3, "file": "03_logo.png", "blend": "normal", "opacity": 1.0, "source": os.path.basename(LOGO) if s["logo"] else "none (empty by design: logo on slide 1 only)"}]
        json.dump({"canvas": [W, H], "layers": layers}, open(os.path.join(d, "layers.json"), "w"), indent=2)
        # flatten strictly from layers.json
        base = None
        for l in sorted(layers, key=lambda l: l["order"]):
            im = Image.open(os.path.join(d, l["file"])).convert("RGBA")
            if l["opacity"] < 1: im.putalpha(im.getchannel("A").point(lambda v: int(v * l["opacity"])))
            if base is None: base = im
            else: base.alpha_composite(im)
        out = base.convert("RGB"); out.save(os.path.join(d, f"slide-{s['n']:02d}.png")); outs.append(out)
    sheet = Image.new("RGB", (W * 3 + 80, H + 40), (244, 244, 244))
    for i, o in enumerate(outs): sheet.paste(o, (20 + i * (W + 20), 20))
    sheet.save(os.path.join(HERE, "contact-sheet.png"))
    for o, n in zip(outs, (1, 2, 3)): o.resize((360, 450), Image.LANCZOS).save(os.path.join(HERE, f"_phone_{n}.png"))

if __name__ == "__main__": main()
