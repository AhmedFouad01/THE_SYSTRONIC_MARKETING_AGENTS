# Stage 3: composite cells, main tub, chains-in-front, energy arc. Run from work/tools. Inputs from work/.
import numpy as np, random, math, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
Image.MAX_IMAGE_PIXELS = None
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, 'tools')
from s2_cutouts import feather

W, H = 4724, 11811
SC = 0.7585151933701658
OX = 165
TOPC = 549
PXCM = W / 80.0
RAW = '../../../INBOX/01_RAW_PRODUCTS/premium-pre-hell/'


def P(x, y):  # plate px -> canvas px
    return x * SC + OX, y * SC - TOPC


cv = Image.open('01_plate_extended.png').convert('RGB')
base_plate = cv.copy()


def _box(w, h, x, y):
    x, y = int(round(x)), int(round(y))
    x0, y0 = max(x, 0), max(y, 0)
    x1, y1 = min(x + w, W), min(y + h, H)
    return x, y, x0, y0, x1, y1


def paste_rgba(layer, x, y):
    global cv
    w, h = layer.size
    x, y, x0, y0, x1, y1 = _box(w, h, x, y)
    if x1 <= x0 or y1 <= y0:
        return
    lay = layer.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    reg = cv.crop((x0, y0, x1, y1)).convert('RGBA')
    reg.alpha_composite(lay)
    cv.paste(reg.convert('RGB'), (x0, y0))


def screen_add(mask, color, x, y, gain=1.0):
    global cv
    w, h = mask.size
    x, y, x0, y0, x1, y1 = _box(w, h, x, y)
    if x1 <= x0 or y1 <= y0:
        return
    m = np.asarray(mask.crop((x0 - x, y0 - y, x1 - x, y1 - y))).astype(np.float32) / 255 * gain
    reg = np.asarray(cv.crop((x0, y0, x1, y1))).astype(np.float32) / 255
    col = np.array(color, np.float32) / 255
    out = 1 - (1 - reg) * (1 - np.clip(m[..., None], 0, 1) * col)
    cv.paste(Image.fromarray((out * 255).astype(np.uint8)), (x0, y0))


def darken(mask, x, y, strength):
    global cv
    w, h = mask.size
    x, y, x0, y0, x1, y1 = _box(w, h, x, y)
    if x1 <= x0 or y1 <= y0:
        return
    m = np.asarray(mask.crop((x0 - x, y0 - y, x1 - x, y1 - y))).astype(np.float32) / 255 * strength
    reg = np.asarray(cv.crop((x0, y0, x1, y1))).astype(np.float32)
    out = reg * (1 - m[..., None])
    cv.paste(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), (x0, y0))


def ellipse_mask(w, h, rx, ry, cx, cy, blur):
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))


def grade_tub(tub, glow=1.0):
    """Light/colour grade only (no warp/regeneration): lowered key, cylinder side falloff,
    orange rim + wrap on the silhouette edge, orange bounce on the white jar base."""
    w, h = tub.size
    a = np.asarray(tub).astype(np.float32)
    A = a[..., 3] / 255
    rgb = np.clip(a[..., :3] / 255, 0, 1) ** 1.08 * 0.90
    xs = (np.arange(w)[None, :] - w / 2) / (w / 2)
    ys = np.arange(h)[:, None] / h
    rgb = rgb * (1 - 0.20 * (np.abs(xs) ** 2.2)[..., None])
    k = 2 * max(5, int(w / 90)) + 1
    Al = Image.fromarray((A * 255).astype(np.uint8))
    er = np.asarray(Al.filter(ImageFilter.MinFilter(k))).astype(np.float32) / 255
    edge = np.clip(A - er, 0, 1)
    edge = np.asarray(Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(k / 4))).astype(np.float32) / 255
    wgt = (0.35 + 0.65 * np.abs(xs) ** 1.2) * (0.55 + 0.7 * ys)
    rim = np.clip(edge * wgt * 1.6 * glow, 0, 1)[..., None]
    col = np.array([1.0, 0.50, 0.10], np.float32)
    rgb = 1 - (1 - rgb) * (1 - rim * col)
    base_ramp = np.clip((ys - 0.90) / 0.10, 0, 1) ** 1.3
    rgb = 1 - (1 - rgb) * (1 - (0.30 * glow * base_ramp)[..., None] * col * np.ones((1, w, 1), np.float32))
    wrap = np.clip((np.abs(xs) - 0.90) / 0.10, 0, 1) ** 1.5 * 0.22 * glow
    rgb = 1 - (1 - rgb) * (1 - wrap[..., None] * col)
    out = np.dstack([rgb * 255, a[..., 3]])
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')


MASTER = Image.open('cutouts/_master_mask.png')


def cut_jpg(n):
    jp = Image.open(RAW + n + '.jpg').convert('RGBA')
    jp.putalpha(feather(MASTER))
    return jp.crop(MASTER.getbbox())


# pad centre (plate px) and pad width (plate px), measured on plate-b-4x.jpg
CELLS = [
    ('tequille', (2088, 11860), 980),
    ('bad-girl', (3720, 11860), 980),
    ('red-poll', (1160, 12180), 1160),
    ('moonster-energy', (2868, 12160), 1100),
    ('red-chili', (4452, 12180), 1100),
    ('trooma', (2912, 12820), 1420),
    ('sour-strips', (5080, 12800), 1360),  # sour-strips.jpg shows the Blue Resberry packshot
]
info = {}
for name, (px, py), pw in CELLS:
    tub = cut_jpg(name)
    cx, cy = P(px, py)
    padw = pw * SC
    tw = int(padw * (0.66 if name == 'trooma' else 0.70))
    th = int(tw * tub.size[1] / tub.size[0])
    tub = tub.resize((tw, th), Image.LANCZOS)
    feet = cy + 0.06 * padw
    M = int(tw * 0.5)
    sh = ellipse_mask(tw + 2 * M, int(tw * 0.5), tw * 0.56, tw * 0.11, tw / 2 + M, int(tw * 0.25), tw * 0.035)
    darken(sh, cx - tw / 2 - M, feet - tw * 0.29, 0.85)
    gl = ellipse_mask(tw + 2 * M, int(tw * 0.5), tw * 0.52, tw * 0.085, tw / 2 + M, int(tw * 0.25), tw * 0.05)
    screen_add(gl, (255, 100, 10), cx - tw / 2 - M, feet - tw * 0.27, 0.45)
    rf_h = int(th * 0.20)
    refl = tub.crop((0, th - rf_h, tw, th)).transpose(Image.FLIP_TOP_BOTTOM).filter(ImageFilter.GaussianBlur(2))
    fade = np.linspace(0.30, 0.0, rf_h)[:, None]
    ra = np.asarray(refl.split()[-1]).astype(np.float32) * fade
    clip = ellipse_mask(tw, rf_h, tw * 0.45, rf_h * 1.1, tw / 2, 0, tw * 0.01)
    refl.putalpha(ImageChops.multiply(Image.fromarray(ra.astype(np.uint8)), clip))
    paste_rgba(refl, cx - tw / 2, feet - tw * 0.02)
    paste_rgba(grade_tub(tub), cx - tw / 2, feet - th)
    info[name] = dict(w=tw, h=th, eff_dpi=round(544 / (tw / PXCM / 2.54)), feet_cm=round(feet / PXCM, 1), cx_cm=round(cx / PXCM, 1))
    print(name, info[name])

# ---- main tub: Mango packshot (transparent PNG), plain Lanczos upscale
mt = Image.open(RAW + 'mango.png').convert('RGBA')
mt = mt.crop(mt.split()[-1].point(lambda v: 255 if v > 8 else 0).getbbox())
al = mt.split()[-1].filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
mt.putalpha(al)
MW = 1500
MH = int(MW * mt.size[1] / mt.size[0])
mcx, mcy = 2332, 5355
mt_big = mt.resize((MW, MH), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.2, percent=60, threshold=2))
print('main tub src', mt.size, '->', (MW, MH), 'eff dpi', round(mt.size[0] / (MW / PXCM / 2.54), 1), 'cm', round(MW / PXCM, 1), 'x', round(MH / PXCM, 1))
mx, my = mcx - MW // 2, mcy - MH // 2
R = int(MW * 1.6)
hal = ellipse_mask(2 * R, 2 * R, MW * 0.55, MH * 0.52, R, R, MW * 0.28)
screen_add(hal, (255, 90, 0), mcx - R, mcy - R, 0.42)
mg = grade_tub(mt_big, glow=1.1)

# chain-in-front mask from the untouched plate (luminance keyed, sparks removed)
rx0, ry0, rx1, ry1 = mx - 260, my - 200, mx + MW + 260, my + MH + 200
crop = base_plate.crop((rx0, ry0, rx1, ry1))
lum = np.asarray(crop).astype(np.float32).mean(2)
binm = Image.fromarray(((lum > 30) * 255).astype(np.uint8))
opened = binm.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(9))
soft = np.clip((lum - 26) / 16, 0, 1)
chain = (np.asarray(opened.filter(ImageFilter.MaxFilter(3))).astype(np.float32) / 255) * soft
chain[:, :int(1250 - rx0)] = 0
chain[:, int(3500 - rx0):] = 0
chain_im = Image.fromarray((chain * 255).astype(np.uint8))
chain_im.save('05_chain_mask.png')
shd = ImageChops.offset(chain_im.filter(ImageFilter.GaussianBlur(14)), 26, 34)
tm = np.asarray(mg).astype(np.float32)
sx0, sy0 = mx - rx0, my - ry0
sub = np.asarray(shd.crop((sx0, sy0, sx0 + MW, sy0 + MH))).astype(np.float32) / 255 * 0.55
tm[..., :3] *= (1 - sub[..., None])
paste_rgba(Image.fromarray(tm.astype(np.uint8), 'RGBA'), mx, my)

# energy arc: lid -> arc end under the beam (hand-built jagged polylines + glow)
rnd = random.Random(7)
lidtop = (mcx, my + MH * 0.012)
arcend = (2332, 3200)
ox_, oy_ = mcx - 750, int(arcend[1]) - 150
LS = (1500, int(lidtop[1] - arcend[1]) + 300)


def arc(p0, p1, amp, seg=9):
    pts = []
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L
    for i in range(seg + 1):
        t = i / seg
        e = math.sin(math.pi * t) ** 0.7
        o = rnd.uniform(-1, 1) * amp * e * (0.5 if i % 2 else 1.0)
        pts.append((p0[0] + dx * t + nx * o, p0[1] + dy * t + ny * o))
    return pts


def layer_of(width, col, amp, n, seed):
    global rnd
    rnd = random.Random(seed)
    l = Image.new('RGBA', LS, (0, 0, 0, 0))
    d = ImageDraw.Draw(l)
    for i in range(n):
        s = (lidtop[0] + rnd.uniform(-90, 90), lidtop[1])
        e = (arcend[0] + rnd.uniform(-70, 70), arcend[1] + rnd.uniform(-30, 30))
        d.line([(x - ox_, y - oy_) for x, y in arc(s, e, amp)], fill=col, width=width, joint='curve')
    return l


for l in (layer_of(30, (255, 90, 0, 235), 90, 4, 7).filter(ImageFilter.GaussianBlur(34)),
          layer_of(30, (255, 90, 0, 255), 90, 4, 7).filter(ImageFilter.GaussianBlur(10)),
          layer_of(11, (255, 200, 90, 255), 90, 4, 7).filter(ImageFilter.GaussianBlur(1.5)),
          layer_of(6, (255, 245, 210, 255), 70, 2, 11).filter(ImageFilter.GaussianBlur(1))):
    paste_rgba(l, ox_, oy_)
fl = ellipse_mask(700, 300, 260, 60, 350, 150, 40)
screen_add(fl, (255, 170, 60), mcx - 350, my - 90, 0.9)

# chains in front of the tub (original plate pixels, keyed)
cl = crop.convert('RGBA')
cl.putalpha(chain_im)
paste_rgba(cl, rx0, ry0)
cv.save('04_main_cells_chains.png', compress_level=2)
cv.resize((472, 1181), Image.LANCZOS).save('04_thumb.jpg')
print('stage 3 done')
