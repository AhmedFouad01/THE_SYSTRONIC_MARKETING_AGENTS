"""VILL social-setup-01 kit builder (stage C, SV-01 applications-only). PIL only. Run: python build.py
Inputs read-only: approved logos (composited, never regenerated), real photos, showcase-01 v3 s01.
Rules: zero alpha layers over photos; solid dark-petrol grounds; contrast measured on rendered pixels (p5/p50/p95);
logos by SK-006 v0.4 (p50 >= 3:1). Layered sources for photo templates -> layers/<name>/ + layers.json."""
import json, glob, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../../../.."))
BRAND = os.path.join(ROOT, "TSST/brands/vill-studio/assets")
LOGO_DIR = os.path.join(BRAND, "final/logo")
SHOW = os.path.join(ROOT, "TSST/brands/vill-studio/projects/showcase-01/build-v3/export/VILL_showcase-01v3_s01.png")
UF = os.path.expandvars(r"$LOCALAPPDATA/Microsoft/Windows/Fonts/")
INTER_D = UF + "Inter_28pt-SemiBold.ttf"
INTER_M = UF + "Inter_24pt-SemiBold.ttf"
INTER_L = UF + "Inter_18pt-SemiBold.ttf"
INTER_R = UF + "Inter_24pt-Regular.ttf"
SCRIPT = os.path.join(ROOT, "TSST/CREATIVE/fonts/alexbrush/AlexBrush-Regular.ttf")
sys.path.insert(0, os.path.join(ROOT, "TSST/CREATIVE/tools"))
from contrast import ratio  # noqa

EX = os.path.join(HERE, "export"); QA = os.path.join(HERE, "_qa"); LAY = os.path.join(HERE, "layers")
for d in (EX, QA, LAY):
    os.makedirs(d, exist_ok=True)

PETROL, DPETROL, WHITE, ORANGE, CREAM = "#01304A", "#011C2C", "#F4F4F4", "#F58021", "#EFE6D6"
CAP = 0.727
REPORT = []   # contrast lines


def hx(h):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def tohex(rgb):
    return "#%02X%02X%02X" % tuple(int(v) for v in rgb)


def F(p, px):
    return ImageFont.truetype(p, int(round(px)))


def photo(n):
    return Image.open(glob.glob(os.path.join(BRAND, f"source/photos-raw/*-{n}.png"))[0]).convert("RGB")


def retouch_9(im):  # owner-approved 2026-10-08: remove 2 wall plates (feathered clone of stone 130px above)
    box, dy = (476, 676, 660, 790), 130
    patch = im.crop((box[0], box[1] - dy, box[2], box[3] - dy))
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).rectangle((18, 18, patch.width - 18, patch.height - 18), fill=255)
    im.paste(patch, box[:2], mask.filter(ImageFilter.GaussianBlur(8)))
    return im


def fit_photo(im, crop, size):
    c = im.crop(crop)
    sc = size[0] / c.width
    assert sc <= 1.25, ("upscale", sc)
    return c.resize(size, Image.LANCZOS), round(sc, 3)


def tracked(d, x, y, txt, f, fill, track):
    for i, ch in enumerate(txt):
        d.text((x + d.textlength(txt[:i], font=f) + i * track, y), ch, font=f, fill=fill, anchor="ls")
    return x + d.textlength(txt, font=f) + len(txt) * track


def text_layer(size, lines, px, anchor, color, font=INTER_D, track=-1.0, lh=1.12, lh_s=1.34, script_color=None):
    """lines: [[(txt,'i'|'s'),..],..]. Returns (layer, bbox)."""
    lay = Image.new("RGBA", size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    fi, fs = F(font, px), F(SCRIPT, px * 1.6)
    x0, yt = anchor; base = yt + CAP * px
    for ln in lines:
        x = x0; is_s = any(k == "s" for _, k in ln)
        for t, k in ln:
            if k == "i":
                x = tracked(d, x, base, t, fi, hx(color) + (255,), track)
            else:
                d.text((x, base), t, font=fs, fill=hx(script_color or color) + (255,), anchor="ls"); x += d.textlength(t, font=fs)
        base += px * (lh_s if is_s else lh)
    b = lay.getchannel("A").getbbox()
    return lay, (b[0] - 6, b[1] - 6, b[2] + 6, b[3] + 6)


def measure(base, box, fg, label, gate=3.0):
    """p5/p50/p95 of luminance under box on the rendered background. Text: worst>=gate(3 large). Returns ok."""
    reg = np.array(base.convert("RGB").crop(box)).reshape(-1, 3).astype(float)
    lum = reg @ np.array([0.2126, 0.7152, 0.0722])
    o = np.argsort(lum); n = len(o)
    px = {p: reg[o[min(n - 1, int(n * p / 100))]] for p in (5, 50, 95)}
    r = {p: round(ratio(fg, tohex(px[p])), 2) for p in px}
    worst = min(r.values()); ok = worst >= gate
    REPORT.append(f"{label}: fg {fg} bg p5 {tohex(px[5])} {r[5]} | p50 {tohex(px[50])} {r[50]} | p95 {tohex(px[95])} {r[95]} | worst {worst} -> {'PASS' if ok else 'FAIL'} (text gate {gate})")
    return ok


def logo_img(variant, w):
    im = Image.open(os.path.join(LOGO_DIR, variant)).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    return im.resize((w, int(round(im.height * w / im.width))), Image.LANCZOS)


def place_logo(size, base, pos, w, label, force=None):
    """SK-006 v0.4: pick Dark Transparent (white) vs Light Transparent (dark) by p50 contrast; gate p50>=3."""
    cands = {"Wordmark Dark Transparent.png": WHITE, "Wordmark Light Transparent.png": "#1E3A44"}
    lg = {v: logo_img(v, w) for v in cands}
    h = lg["Wordmark Dark Transparent.png"].height
    box = (pos[0], pos[1], pos[0] + w, pos[1] + h)
    reg = np.array(base.convert("RGB").crop(box)).reshape(-1, 3).astype(float)
    lum = reg @ np.array([0.2126, 0.7152, 0.0722]); med = reg[np.argsort(lum)[len(lum) // 2]]
    sc = {v: ratio(c, tohex(med)) for v, c in cands.items()}
    v = force or max(sc, key=sc.get)
    p5 = tohex(reg[np.argsort(lum)[int(len(lum) * .05)]]); p95 = tohex(reg[np.argsort(lum)[int(len(lum) * .95)]])
    REPORT.append(f"LOGO {label}: {v} p50 {tohex(med)} ratio {sc[v]:.2f} (gate >=3) | worst-px check p5 {p5} {ratio(cands[v], p5):.2f} p95 {p95} {ratio(cands[v], p95):.2f} -> {'PASS' if sc[v] >= 3 else 'FAIL'}")
    lay = Image.new("RGBA", size, (0, 0, 0, 0)); lay.alpha_composite(lg[v], pos)
    return lay, v


def compose(name, base, layers, ext="png"):
    """Flatten + store layer files and layers.json (layered-build standard L4)."""
    d = os.path.join(LAY, name); os.makedirs(d, exist_ok=True)
    out = base.convert("RGBA"); meta = [{"order": 1, "file": "01_base.png", "blend": "normal", "opacity": 1}]
    base.convert("RGB").save(os.path.join(d, "01_base.png"))
    for i, (lab, lay) in enumerate(layers, 2):
        fn = f"{i:02d}_{lab}.png"; lay.save(os.path.join(d, fn)); out.alpha_composite(lay)
        meta.append({"order": i, "file": fn, "blend": "normal", "opacity": 1})
    json.dump(meta, open(os.path.join(d, "layers.json"), "w"), indent=1)
    return out.convert("RGB")


def save(im, name, jpg=False):
    p = os.path.join(EX, name)
    if jpg:
        im.convert("RGB").save(p, quality=92, subsampling=0, optimize=True)
    else:
        im.convert("RGB").save(p)
    return p


# ---------------------------------------------------------------- 1. avatar
tile = Image.open(os.path.join(LOGO_DIR, "IconicMark Light-Highlight.png")).convert("RGB")   # petrol tile, mark white+orange (pixel-verified)
arr = np.array(tile).astype(int); mask = (np.abs(arr - np.array(hx(PETROL))).sum(2) > 40); mask[940:] = False  # drop vill-studio.com line
wh = mask & (arr.min(2) > 200)                                     # white bars only
ys0, xs0 = mask.nonzero(); y_white_bottom = np.nonzero(wh.any(1))[0].max()
tag_rows = mask.copy(); tag_rows[:y_white_bottom + 2] = False      # STUDIO tag = everything below the white bars
tag_h = (np.nonzero(tag_rows.any(1))[0].max() - np.nonzero(tag_rows.any(1))[0].min() + 1) if tag_rows.any() else 0
mask[y_white_bottom + 2:] = False                                  # round 2: STUDIO tag dropped (measured below)
ys, xs = mask.nonzero(); bb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
cx, cy = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
rmax = np.sqrt(((xs - cx) ** 2 + (ys - cy) ** 2)).max()
k = 0.78 * 540 / rmax                                   # mark circumscribed circle = 78 % of the avatar circle diameter
mk = tile.crop(bb); mk = mk.resize((int(mk.width * k), int(mk.height * k)), Image.LANCZOS)
av = Image.new("RGB", (1080, 1080), hx(PETROL))
av.paste(mk, (540 - mk.width // 2, 540 - mk.height // 2))
av.save(os.path.join(EX, "VILL_social_avatar_master_1080.png"))
tag_110 = tag_h * k * 110 / 1080
REPORT.append(f"AVATAR r2: source IconicMark Light-Highlight.png (opaque petrol tile, bg {tohex(arr[5,5])}); mark scale {k:.3f}; mark circumscribed circle = {rmax*k/540*100:.0f}% of circle diameter (r1 was 90%); STUDIO tag was {tag_h}px tall in source -> {tag_110:.1f}px at 110px avatar: below 7px legibility floor -> DROPPED. URL line cropped out.")
for nm, s in (("instagram_1080", 1080), ("facebook_320", 320), ("tiktok_200", 200), ("linkedin_400", 400)):
    av.resize((s, s), Image.LANCZOS).save(os.path.join(EX, f"VILL_social_avatar_{nm}.png"))


def circ(im, d, bg):
    sq = im.convert("RGB").resize((d, d), Image.LANCZOS)
    m = Image.new("L", (d * 4, d * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=255); m = m.resize((d, d), Image.LANCZOS)
    c = Image.new("RGB", (d, d), bg); c.paste(sq, (0, 0), m); return c


def circle_sheet(src, sizes, name, title, crop=None):
    s = src if crop is None else src.crop(crop)
    W = sum(sizes) + 40 * (len(sizes) + 1)
    sh = Image.new("RGB", (W, 2 * 260 + 300), (255, 255, 255)); d = ImageDraw.Draw(sh)
    sh.paste(Image.new("RGB", (W, 260), (255, 255, 255)), (0, 0)); sh.paste(Image.new("RGB", (W, 260), (18, 18, 18)), (0, 260))
    f = F(INTER_L, 18); x = 40
    for sz in sizes:
        sh.paste(circ(s, sz, (255, 255, 255)), (x, 60)); sh.paste(circ(s, sz, (18, 18, 18)), (x, 320))
        d.text((x, 30), f"{sz}px", fill=(0, 0, 0), font=f); d.text((x, 290), f"{sz}px", fill=(255, 255, 255), font=f)
        big = circ(s, sz, (255, 255, 255)).resize((sz * 3, sz * 3), Image.NEAREST)
        x += sz + 40
    # 3x enlarged row
    x = 40
    for sz in sizes:
        sh.paste(circ(s, sz, (255, 255, 255)).resize((sz * 3, sz * 3), Image.NEAREST).crop((0, 0, min(sz * 3, 330), min(sz * 3, 330))), (x, 560)) if False else None
        x += sz + 40
    d.text((40, 520), title + " (actual pixel size, white and dark UI; 3x enlarged below)", fill=(0, 0, 0), font=f)
    x = 40
    for sz in sizes:
        e = circ(s, sz, (255, 255, 255)).resize((sz * 3, sz * 3), Image.NEAREST); sh.paste(e, (x, 550)) if False else None
        x += sz + 40
    # enlarged strip (own canvas)
    big = Image.new("RGB", (sum(z * 3 for z in sizes) + 30 * (len(sizes) + 1), max(sizes) * 3 + 40), (240, 240, 240)); xx = 30
    for sz in sizes:
        big.paste(circ(s, sz, (240, 240, 240)).resize((sz * 3, sz * 3), Image.NEAREST), (xx, 20)); xx += sz * 3 + 30
    out = Image.new("RGB", (max(sh.width, big.width), sh.height - 300 + big.height + 10), (255, 255, 255))
    out.paste(sh.crop((0, 0, sh.width, 540)), (0, 0)); out.paste(big, (0, 545))
    out.save(os.path.join(QA, name))


circle_sheet(av, [110, 176, 98, 64], "avatar_circle_test.png", "AVATAR circle test 110 / 176 / 98 / 64")

# ---------------------------------------------------------------- 2. facebook cover 1640x924
W, H = 1640, 924
base = Image.new("RGB", (W, H), hx(DPETROL))
ph, sc = fit_photo(photo(8), (0, 0, 1086, 1433), (693, 924)); base.paste(ph, (947, 0))
lg, v = place_logo((W, H), base, (120, 290), 420, "fb-cover wordmark", force="Wordmark Dark Transparent.png")
bg_text = base.copy()
tl, tb = text_layer((W, H), [[("One team,", "i")], [("start to ", "i"), ("finish", "s"), (".", "i")]], 52, (120, 500), WHITE, font=INTER_D, track=-1.0, script_color=ORANGE)
measure(bg_text, tb, WHITE, "FB cover text white on #011C2C")
fb = compose("fb-cover", base, [("logo", lg), ("text", tl)])
save(fb, "VILL_social_facebook-cover_1640x924.png"); save(fb, "VILL_social_facebook-cover_1640x924.jpg", jpg=True)
REPORT.append(f"FB cover: photo #8 panel scale {sc} (downscale), orange script word on #011C2C {ratio(ORANGE, DPETROL):.2f} (large decorative >=3 ok)")
# QA: mobile crop + avatar overlays (indicative)
band = (0, (H - round(W / 2.4)) // 2, W, (H + round(W / 2.4)) // 2)
q = fb.copy(); d = ImageDraw.Draw(q, "RGBA")
d.rectangle((0, 0, W, band[1]), fill=(255, 0, 0, 70)); d.rectangle((0, band[3], W, H), fill=(255, 0, 0, 70))
d.ellipse((64, H - 352 + 120, 64 + 352, H + 120), outline=(255, 255, 0, 255), width=6)          # desktop avatar (indicative)
d.ellipse((73, band[3] - 182, 73 + 446, band[3] - 182 + 446), outline=(0, 255, 255, 255), width=6)  # mobile avatar (indicative, EN)
d.ellipse((W - 73 - 446, band[3] - 182, W - 73, band[3] - 182 + 446), outline=(255, 0, 255, 255), width=6)  # mobile avatar mirrored (AR)
d.text((20, 20), "red = hidden on mobile 2.4:1 | yellow desktop avatar | cyan mobile avatar EN | magenta mobile avatar AR-mirrored (indicative)", fill=(255, 255, 255), font=F(INTER_L, 22))
q.save(os.path.join(QA, "fb_cover_crops_overlap.png"))
fb.crop(band).save(os.path.join(QA, "fb_cover_mobile_2.4_crop.png"))

# ---------------------------------------------------------------- 3. linkedin cover 1512x256
W, H = 1512, 256
base = Image.new("RGB", (W, H), hx(DPETROL))
p10 = photo(10); ph, sc = fit_photo(p10, (0, 80, 1086, 80 + 675), (412, 256)) if False else (None, None)
c = p10.crop((0, 230, 1086, 230 + 675)).resize((412, 256), Image.LANCZOS); base.paste(c, (1100, 0))
lg, v = place_logo((W, H), base, (330, 44), 220, "li-cover wordmark", force="Wordmark Dark Transparent.png")
tl, tb = text_layer((W, H), [[("Interior fit-out, lighting and bespoke furniture", "i")], [("manufactured by VILL | Egypt", "i")]], 26, (330, 142), WHITE, font=INTER_M, track=0.0, lh=1.4)
measure(base, tb, WHITE, "LI cover text white on #011C2C")
li = compose("li-cover", base, [("logo", lg), ("text", tl)])
save(li, "VILL_social_linkedin-cover_1512x256.png")
q = li.copy(); d = ImageDraw.Draw(q, "RGBA"); d.rectangle((0, 96, 300, 256), outline=(255, 255, 0, 255), width=3)
d.text((8, 8), "yellow = lower-left logo keep-out (practice default, NOT CONFIRMED)", fill=(255, 255, 0), font=F(INTER_L, 16)); q.save(os.path.join(QA, "li_cover_keepout.png"))

# ---------------------------------------------------------------- 4. highlight covers
GL = 4  # supersample


def glyph(kind):
    S = 520 * GL; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    w = 26 * GL; c0 = S // 2

    def P(pts, col, ww=w):
        pts = [(c0 + x * GL, c0 + y * GL) for x, y in pts]
        d.line(pts, fill=hx(col) + (255,), width=ww, joint="curve")
        for x, y in pts:
            d.ellipse((x - ww / 2, y - ww / 2, x + ww / 2, y + ww / 2), fill=hx(col) + (255,))
    if kind == "projects":        # house / door-frame outline, door in orange
        P([(-170, -10), (0, -170), (170, -10)], WHITE); P([(-135, -30), (-135, 170), (135, 170), (135, -30)], WHITE)
        P([(-45, 170), (-45, 40), (45, 40), (45, 170)], ORANGE)
    elif kind == "beforeafter":   # two halves meeting at a thin line: empty outline | finished (lamp + shelf)
        P([(0, -150), (-170, -150), (-170, 150), (0, 150)], WHITE); P([(0, -150), (170, -150), (170, 150), (0, 150)], WHITE)
        P([(0, -150), (0, 150)], ORANGE, 14 * GL)
        P([(60, 70), (125, 70)], WHITE); d.ellipse((c0 + 70 * GL, c0 - 70 * GL, c0 + 120 * GL, c0 - 20 * GL), fill=hx(ORANGE) + (255,))
    else:                         # chair: back, seat, legs, orange cushion line
        P([(-95, -165), (-95, 45), (115, 45)], WHITE); P([(-95, 45), (-95, 170)], WHITE); P([(115, 45), (115, 170)], WHITE)
        P([(-60, 5), (80, 5)], ORANGE)
    return im.resize((S // GL, S // GL), Image.LANCZOS)


HL = {}
for nm, kd in (("projects", "projects"), ("before-after", "beforeafter"), ("furniture", "furniture")):
    cv = Image.new("RGB", (1080, 1920), hx(PETROL)); g = glyph(kd); g = g.resize((int(g.width * 1.2), int(g.height * 1.2)), Image.LANCZOS)
    cv.paste(g, (540 - g.width // 2, 960 - g.height // 2), g)
    save(cv, f"VILL_social_highlight-{nm}_1080x1920.png"); HL[nm] = cv
REPORT.append(f"HIGHLIGHT: bg petrol {PETROL}; white {WHITE} on petrol {ratio(WHITE, PETROL):.2f}; orange accent {ORANGE} on petrol {ratio(ORANGE, PETROL):.2f} (non-text gate 3.0 -> {'PASS' if ratio(ORANGE, PETROL) >= 3 else 'FAIL'})")
sh = Image.new("RGB", (3 * 700, 900), (255, 255, 255))
for i, (nm, cv) in enumerate(HL.items()):
    full = cv.crop((0, 420, 1080, 1500)).resize((300, 300), Image.LANCZOS)
    sh.paste(full, (i * 700 + 20, 20))
    for j, sz in enumerate((110, 64)):
        sh.paste(circ(cv.crop((0, 420, 1080, 1500)), sz, (255, 255, 255)), (i * 700 + 20 + j * 140, 340))
        sh.paste(circ(cv.crop((240, 660, 840, 1260)), sz, (255, 255, 255)), (i * 700 + 20 + j * 140, 470))
    e = circ(cv.crop((0, 420, 1080, 1500)), 110, (255, 255, 255)).resize((330, 330), Image.NEAREST); sh.paste(e, (i * 700 + 330, 340))
    ImageDraw.Draw(sh).text((i * 700 + 20, 600), f"{nm}: row1 = full-width circle crop @110/@64 + 3x; row2 = tight 600px circle @110/@64", fill=(0, 0, 0), font=F(INTER_L, 16))
sh.crop((0, 0, 2100, 640)).save(os.path.join(QA, "highlight_circle_test.png"))

# ---------------------------------------------------------------- 5. story 1080x1920 (round 2: passe-partout, 64 px grid)
W, H = 1080, 1920
base = Image.new("RGB", (W, H), hx(DPETROL))
FR = (64, 300, 1016, 1360)                                   # frame 952x1060, margin 64 left/right
ph, sc = fit_photo(photo(10), (0, 0, 1086, 1209), (952, 1060)); base.paste(ph, (FR[0], FR[1]))
tl, tb = text_layer((W, H), [[("Sea view. Finished.", "i")]], 64, (64, 1402), WHITE, font=INTER_D, track=-1.2)
measure(base, tb, WHITE, "Story text white on solid #011C2C")
wm_h = logo_img("Wordmark Dark Transparent.png", 150).height
lg, v = place_logo((W, H), base, (1016 - 150, int(1402 + (CAP * 64 - wm_h) / 2)), 150, "story wordmark on #011C2C", force="Wordmark Dark Transparent.png")
st = compose("story", base, [("logo", lg), ("text", tl)]); save(st, "VILL_social_story-template_1080x1920.png")
q = st.copy(); d = ImageDraw.Draw(q, "RGBA"); d.rectangle((0, 0, W, 269), fill=(255, 0, 0, 90)); d.rectangle((0, 1536, W, H), fill=(255, 0, 0, 90))
d.text((20, 20), "red = 14% top / 20% bottom (ads guidance, working default)", fill=(255, 255, 255), font=F(INTER_L, 28)); q.save(os.path.join(QA, "story_safezone.png"))
REPORT.append(f"STORY r2: passe-partout frame {FR} (952x1060, margin 64), photo #10 scale {sc} (downscale); line + wordmark share one baseline row y1402-1449 on a 64 px grid, all inside 269..1536 (content y300-1449)")

# ---------------------------------------------------------------- 6. reel cover 1080x1920 (round 2: line on quiet ceiling plane per tools/text_space.py, bands carry wordmark + URL)
base = Image.new("RGB", (W, H), hx(DPETROL))
ph, sc = fit_photo(photo(7), (0, 0, 1086, 1448), (1080, 1440)); base.paste(ph, (0, 240))
tl, tb = text_layer((W, H), [[("Made to", "i")], [("live", "s"), (" in.", "i")]], 92, (600, 240 + 125), WHITE, font=INTER_D, track=-1.8)
measure(base, tb, WHITE, "Reel text white on photo #7 ceiling plane (text_space rank 1 box 587,110,967,310 in photo coords)")
lg, v = place_logo((W, H), base, (64, 150), 150, "reel wordmark top band on #011C2C", force="Wordmark Dark Transparent.png")
ul = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ud = ImageDraw.Draw(ul); ud.text((64, 1735), "vill-studio.com", font=F(INTER_R, 34), fill=hx(WHITE) + (255,), anchor="lm")
measure(base, (64, 1715, 330, 1755), WHITE, "Reel URL white on solid #011C2C")
rc = compose("reel-cover", base, [("logo", lg), ("text", tl), ("url", ul)]); save(rc, "VILL_social_reel-cover-template_1080x1920.png")
c420 = rc.crop((0, 119, 1080, 119 + 1682)).resize((420, 654), Image.LANCZOS)
g34 = rc.crop((0, 240, 1080, 1680))
sh = Image.new("RGB", (420 + 360 + 380 + 80, 700), (90, 90, 90)); sh.paste(c420, (20, 20)); sh.paste(g34.resize((360, 480)), (460, 20)); sh.paste(g34.resize((120, 160)), (850, 20))
dd = ImageDraw.Draw(sh); f = F(INTER_L, 16)
dd.text((20, 685), "420x654 reel cover crop | 3:4 grid thumb (360 wide) | grid thumb at 120 wide", fill=(255, 255, 255), font=f)
sh.save(os.path.join(QA, "reel_cover_crops.png")); c420.save(os.path.join(QA, "reel_cover_420x654.png")); g34.save(os.path.join(QA, "reel_cover_grid_3x4.png"))
REPORT.append(f"REEL r2: photo #7 scale {sc}; photo band = the 3:4 grid crop exactly (y240-1680); line moved to ceiling plane x600 (inside photo, survives 3:4 + 420x654); wordmark y150 (top band) and URL y1735 (bottom band) both inside the 420x654 crop y119-1801")

# ---------------------------------------------------------------- 7. feed post 1080x1350 (round 2: photo #10 sea view, one approved line; grid reads wall > sea > living)
W, H = 1080, 1350
ph, sc = fit_photo(photo(10), (0, 91, 1086, 1448), (1080, 1350))
base = ph.copy()
tl, tb = text_layer((W, H), [[("One team,", "i")], [("start to finish.", "i")]], 72, (84, 62), WHITE, font=INTER_D, track=-1.2)
ok = measure(base, tb, WHITE, "Feed text white on photo #10 upper sky (text_space plane)")
lg, v = place_logo((W, H), base, (1046 - 40 - 150, 1255), 150, "feed wordmark on #10 lower right")
fd = compose("feed-post", base, [("logo", lg), ("text", tl)]); save(fd, "VILL_social_feed-post-template_1080x1350.png")
g = fd.crop((34, 0, 1046, 1350)); g.save(os.path.join(QA, "feed_grid_3x4_crop.png"))
REPORT.append(f"FEED r2: photo #10 (sea view) scale {sc}; line 'One team, start to finish.' (approved); text box {tb} inside x34-1046 -> {'inside' if tb[0] >= 34 and tb[2] <= 1046 else 'OUTSIDE'}")

# ---------------------------------------------------------------- profile mock (Instagram, phone 780 wide = 2x of 390)
W = 780; mk_ = Image.new("RGB", (W, 1420), (255, 255, 255)); d = ImageDraw.Draw(mk_)
fb_, fm, fs_ = F(INTER_D, 30), F(INTER_R, 26), F(INTER_L, 22)
d.text((40, 36), "vill.studio", font=fb_, fill=(40, 40, 40)); d.text((440, 40), "MOCK, indicative layout", font=fs_, fill=(150, 150, 150))
mk_.paste(circ(av, 176, (255, 255, 255)), (40, 110))
for i, lab in enumerate(("Posts", "Followers", "Following")):
    d.text((300 + i * 160, 170), "-", font=fb_, fill=(40, 40, 40)); d.text((300 + i * 160, 214), lab, font=fs_, fill=(60, 60, 60))
d.text((40, 312), "VILL Studio", font=F(INTER_D, 26), fill=(30, 30, 30))
bio = ["Interior fit-out and furniture studio in Egypt.", "Furniture made by VILL.", "One team, start to finish.", "Projects and contact: link below"]
for i, t in enumerate(bio):
    d.text((40, 352 + i * 36), t, font=fm, fill=(30, 30, 30))
d.text((40, 352 + 4 * 36), "vill-studio.com", font=F(INTER_D, 26), fill=(0, 55, 107))   # IG link field (not typed in bio)
for i, t in enumerate(("Follow", "Message")):
    d.rounded_rectangle((40 + i * 350, 556, 40 + i * 350 + 320, 612), 12, fill=(0, 149, 246) if i == 0 else (239, 239, 239))
    d.text((40 + i * 350 + 160, 584), t, font=fs_, fill=(255, 255, 255) if i == 0 else (30, 30, 30), anchor="mm")
for i, (nm, lab) in enumerate((("projects", "Projects"), ("before-after", "Before & After"), ("furniture", "Furniture"))):
    cv = HL[nm].crop((0, 420, 1080, 1500)); x = 40 + i * 170
    mk_.paste(circ(cv, 128, (255, 255, 255)), (x + 6, 648)); d.ellipse((x, 642, x + 140, 782), outline=(210, 210, 210), width=2)
    d.text((x + 70, 806), lab, font=F(INTER_L, 20), fill=(30, 30, 30), anchor="mm")
d.line((0, 851, W, 851), fill=(220, 220, 220), width=2); d.rectangle((0, 848, 260, 852), fill=(30, 30, 30))
s01 = Image.open(SHOW).convert("RGB"); s01 = s01.crop((34, 0, 1046, 1350))
for i, tm in enumerate((s01, fd.crop((34, 0, 1046, 1350)), rc.crop((0, 240, 1080, 1680)))):
    mk_.paste(tm.resize((258, 344), Image.LANCZOS), (i * 261, 866))
d.text((20, 1236), "Row 1: showcase-01 v3 s01 (wall) | feed post (sea) | reel cover (living), all 3:4 grid crop", font=F(INTER_L, 18), fill=(120, 120, 120))
mk_ = mk_.crop((0, 0, W, 1266)); mk_.save(os.path.join(QA, "profile_mock.png"))

# ---------------------------------------------------------------- contrast token pairs + report
pairs = [(WHITE, PETROL, "white on petrol"), (WHITE, DPETROL, "white on dark petrol"), (ORANGE, DPETROL, "orange on dark petrol (script word, large)"), (ORANGE, PETROL, "orange on petrol (glyph accent, non-text)"), (DPETROL, CREAM, "dark petrol on cream")]
REPORT.append("TOKENS: " + " | ".join(f"{n} {ratio(a, b):.2f}" for a, b, n in pairs))
open(os.path.join(QA, "contrast.txt"), "w").write("\n".join(REPORT) + "\n")

# ---------------------------------------------------------------- contact sheet
items = [("avatar 1080", av), ("FB cover 1640x924", fb), ("LI cover 1512x256", li), ("HL projects", HL["projects"]), ("HL before-after", HL["before-after"]), ("HL furniture", HL["furniture"]),
         ("story", st), ("reel cover", rc), ("feed post", fd)]
cw, chh = 420, 520; cols = 3; rows = 3
cs = Image.new("RGB", (cols * (cw + 20) + 20, rows * (chh + 50) + 20), (70, 70, 70)); d = ImageDraw.Draw(cs); f = F(INTER_L, 20)
for i, (n, im) in enumerate(items):
    t = im.copy(); t.thumbnail((cw, chh)); x = 20 + (i % cols) * (cw + 20); y = 20 + (i // cols) * (chh + 50)
    cs.paste(t, (x + (cw - t.width) // 2, y + (chh - t.height) // 2)); d.text((x, y + chh + 8), n, fill=(255, 255, 255), font=f)
cs.save(os.path.join(HERE, "contact-sheet.png"))
print("\n".join(REPORT))
