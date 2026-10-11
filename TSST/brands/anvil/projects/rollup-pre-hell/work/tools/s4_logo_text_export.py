# Stage 4: engraved/lit official logo on the beam face, text, grade, CMYK PDF + preview. Run from anywhere.
import numpy as np, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops, ImageCms
Image.MAX_IMAGE_PIXELS = None
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
W, H = 4724, 11811
PXCM = W / 80.0
FONT = '../../../../../PILOTS/TSST-PILOT-001_ANVIL_SWITCH/11_PRODUCTION_V01/source/fonts/Inter_18pt-SemiBold.ttf'
cv = Image.open('04_main_cells_chains.png').convert('RGB')

# ---------- logo (vector PDF rasterised by Windows.Data.Pdf at 3600 px, downsampled = supersampled)
mark = Image.open('logo_mark_3600.png').convert('RGBA').split()[-1]
LH = 640
LW = int(LH * mark.size[0] / mark.size[1])
cx, cy = 2368, 1108
A = mark.resize((LW, LH), Image.LANCZOS)
pad = 120
layer_w, layer_h = LW + 2 * pad, LH + 2 * pad
Afull = Image.new('L', (layer_w, layer_h), 0)
Afull.paste(A, (pad, pad))
x0, y0 = cx - layer_w // 2, cy - layer_h // 2
reg = np.asarray(cv.crop((x0, y0, x0 + layer_w, y0 + layer_h))).astype(np.float32) / 255
a = np.asarray(Afull).astype(np.float32) / 255
d = 7


def shift(arr, dy):
    return np.asarray(ImageChops.offset(Image.fromarray((arr * 255).astype(np.uint8)), 0, dy)).astype(np.float32) / 255


# underglow (orange, from the lit underside) around lower edges
glow = np.asarray(Image.fromarray((shift(a, 14) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(26))).astype(np.float32) / 255
glow = glow * (1 - a)
col = np.array([1.0, 0.42, 0.04], np.float32)
reg = 1 - (1 - reg) * (1 - glow[..., None] * col * 0.55)
# lit lower outer rim of the cut
rim = np.clip(shift(a, 5) - a, 0, 1)
reg = 1 - (1 - reg) * (1 - rim[..., None] * np.array([1.0, 0.55, 0.2], np.float32) * 0.55)
# recess floor: near-black, concrete texture still showing through
floor = reg * 0.075 + 0.008
reg = reg * (1 - a[..., None]) + floor * a[..., None]
# lit top wall (faces the light from below) + deep shadow on the bottom wall
topwall = np.clip(a - shift(a, d), 0, 1)
topwall = np.asarray(Image.fromarray((topwall * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
reg = 1 - (1 - reg) * (1 - topwall[..., None] * np.array([1.0, 0.50, 0.12], np.float32) * 0.80)
cv.paste(Image.fromarray((np.clip(reg, 0, 1) * 255).astype(np.uint8)), (x0, y0))
print('logo', LW, 'x', LH, 'px =', round(LW / PXCM, 1), 'x', round(LH / PXCM, 1), 'cm; source vector -> 3600 px render, ', round(3600 / (LW / PXCM / 2.54)), 'dpi equiv')

# ---------- dark floor gradient under the text block
a_ = np.asarray(cv).astype(np.float32)
y = np.arange(H)[:, None].astype(np.float32)
y_a, y_b = 156 * PXCM, 164 * PXCM
g = np.clip((y - y_a) / (y_b - y_a), 0, 1) * 0.62
a_ = a_ * (1 - g[..., None])
cv = Image.fromarray(a_.astype(np.uint8))

# ---------- text (Inter 18pt SemiBold, SIL OFL; local file shipped with ANVIL pilot)
d = ImageDraw.Draw(cv)


def tracked(text, size, track_em):
    f = ImageFont.truetype(FONT, size)
    adv = [f.getlength(c) + track_em * size for c in text]
    return f, adv, sum(adv) - track_em * size


def draw_tracked(text, size, track_em, cx_px, cap_top, fill):
    f, adv, tw = tracked(text, size, track_em)
    x = cx_px - tw / 2
    asc = f.getbbox('H')[1]  # offset of cap top within line box
    for c, w_ in zip(text, adv):
        d.text((x, cap_top - asc), c, font=f, fill=fill)
        x += w_
    return tw, f.getbbox('H')[3] - f.getbbox('H')[1]


mid = W / 2
tw2, ch2 = draw_tracked('AUTHORIZED DISTRIBUTOR \u00b7 PREMIUM PRE-HELL', 112, 0.08, mid, 163.2 * PXCM, (217, 217, 212))
tw1, ch1 = draw_tracked('ANVIL-SUPPS.COM', 300, 0.04, mid, 169.4 * PXCM, (255, 255, 255))
bar_y = 169.4 * PXCM + ch1 + 0.9 * PXCM
d.rectangle((mid - tw1 / 2, bar_y, mid + tw1 / 2, bar_y + 0.38 * PXCM), fill=(255, 106, 0))
print('tagline width cm', round(tw2 / PXCM, 1), 'cap cm', round(ch2 / PXCM, 2), '| URL width cm', round(tw1 / PXCM, 1), 'cap cm', round(ch1 / PXCM, 2), 'bar bottom cm', round((bar_y + 0.38 * PXCM) / PXCM, 1))

cv.save('07_master_rgb.png', compress_level=2)

# ---------- preview
os.makedirs('../final', exist_ok=True)
pv = cv.resize((int(1000 * W / H), 1000), Image.LANCZOS)
pv.save('../final/preview.jpg', quality=90)

# ---------- CMYK PDF (CoatedFOGRA39 from the Windows colour store; perceptual, BPC)
src = ImageCms.createProfile('sRGB')
dst = ImageCms.getOpenProfile('C:/Windows/System32/spool/drivers/color/CoatedFOGRA39.icc')
cmyk = ImageCms.profileToProfile(cv, src, dst, renderingIntent=ImageCms.Intent.PERCEPTUAL, outputMode='CMYK', flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)
cmyk.save('08_master_cmyk.tif', compression='tiff_lzw')
# page = exactly 800 x 2000 mm: choose dpi so width 4724 px = 800 mm
res = W / (800 / 25.4)
cmyk.save('../final/anvil-rollup-pre-hell-80x200.pdf', 'PDF', resolution=res, quality=93)
# soft-proof preview back to sRGB
back = ImageCms.profileToProfile(cmyk, dst, src, renderingIntent=ImageCms.Intent.PERCEPTUAL, outputMode='RGB')
back.resize((int(1000 * W / H), 1000), Image.LANCZOS).save('09_cmyk_softproof_preview.jpg', quality=88)
print('exported, dpi', res)
