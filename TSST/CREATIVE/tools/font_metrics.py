"""font_metrics.py - measure fonts with PIL (no install needed).

Usage:
  python font_metrics.py FONT [FONT ...] [--size 100]
  python font_metrics.py --pair INTER.ttf ALEX.ttf [--sizes 48 72 96]

Per font, at --size px: cap height (H), x-height (x), ascender (d/l/h), descender (p/g),
colour = ink coverage of a sample string inside its own ink-box rows (stem weight proxy),
adv/em = mean advance width per em of the sample. Arabic fonts use alef (cap proxy),
a medial-free letter set for x-height proxy (seen/noon body) and a tall+deep line test.
Numbers are measured, not trusted: rerun after changing files.
"""
import sys, argparse
from PIL import Image, ImageDraw, ImageFont

LAT = "Made to live in. Finished."
AR = "اسنهدرعمل"  # isolated letters (PIL here has no RAQM shaping): stem-weight proxy only


def ink_bbox(font, text, size):
    im = Image.new("L", (size * 6, size * 3), 0)
    d = ImageDraw.Draw(im)
    d.text((size, size), text, font=font, fill=255, anchor="ls")
    bb = im.getbbox()
    return (bb[0] - size, bb[1] - size, bb[2] - size, bb[3] - size) if bb else None  # relative to baseline


def height_of(font, ch, size):
    bb = ink_bbox(font, ch, size)
    return -bb[1] if bb else 0  # top above baseline


def depth_of(font, ch, size):
    bb = ink_bbox(font, ch, size)
    return bb[3] if bb else 0  # below baseline


def colour(font, text, size):
    im = Image.new("L", (size * 40, size * 3), 0)
    d = ImageDraw.Draw(im)
    d.text((size, size * 2), text, font=font, fill=255, anchor="ls")
    bb = im.getbbox()
    if not bb:
        return 0.0
    # fixed band: from baseline-x-height-ish region to baseline: use whole ink box rows
    crop = im.crop(bb)
    px = sum(1 for v in crop.get_flattened_data() if v > 127)
    return px / (crop.width * crop.height)


def stem(font, size):
    # horizontal run length of ink across the middle of "l" (Latin stem) -> px
    im = Image.new("L", (size * 2, size * 2), 0)
    ImageDraw.Draw(im).text((size // 2, size + size // 2), "l", font=font, fill=255, anchor="ls")
    bb = im.getbbox()
    y = (bb[1] + bb[3]) // 2
    return sum(1 for x in range(im.width) if im.getpixel((x, y)) > 127)


def stem_ar(font, size):
    # alef stem width at mid height
    im = Image.new("L", (size * 2, size * 2), 0)
    ImageDraw.Draw(im).text((size // 2, size + size // 2), "ا", font=font, fill=255, anchor="ls")
    bb = im.getbbox()
    y = (bb[1] + bb[3]) // 2
    return sum(1 for x in range(im.width) if im.getpixel((x, y)) > 127)


def measure(path, size=100, arabic=False):
    f = ImageFont.truetype(path, size)
    r = {"file": path.replace("\\", "/").split("/")[-1], "size": size}
    if arabic:
        kw = dict()
        r["cap(alef)"] = height_of_ar(f, "ا", size)
        r["xh(seen body)"] = height_of_ar(f, "س", size)
        bb = ink_bbox_ar(f, AR, size)
        r["asc"] = -bb[1]
        r["desc"] = bb[3]
        r["stem"] = stem_ar(f, size)
        r["colour"] = round(colour_ar(f, AR, size), 4)
        r["adv/em"] = round(f.getlength(AR) / len(AR) / size, 3)
    else:
        r["cap"] = height_of(f, "H", size)
        r["xh"] = height_of(f, "x", size)
        r["asc"] = height_of(f, "dlh", size)
        r["desc"] = depth_of(f, "pgy", size)
        r["stem"] = stem(f, size)
        r["colour"] = round(colour(f, LAT, size), 4)
        r["adv/em"] = round(f.getlength(LAT) / len(LAT) / size, 3)
    asc, desc = f.getmetrics()
    r["font ascent+descent/em"] = round((asc + desc) / size, 3)
    return r


def _ar_draw(f, text, size, w=40):
    im = Image.new("L", (size * w, size * 3), 0)
    ImageDraw.Draw(im).text((size, size * 2), text, font=f, fill=255, anchor="ls")
    return im


def ink_bbox_ar(f, text, size):
    im = _ar_draw(f, text, size)
    bb = im.getbbox()
    return (bb[0], bb[1] - size * 2, bb[2], bb[3] - size * 2)


def height_of_ar(f, ch, size):
    return -ink_bbox_ar(f, ch, size)[1]


def colour_ar(f, text, size):
    im = _ar_draw(f, text, size)
    crop = im.crop(im.getbbox())
    return sum(1 for v in crop.get_flattened_data() if v > 127) / (crop.width * crop.height)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fonts", nargs="*")
    ap.add_argument("--size", type=int, default=100)
    ap.add_argument("--ar", action="store_true", help="treat fonts as Arabic")
    a = ap.parse_args()
    for p in a.fonts:
        print(measure(p, a.size, a.ar))


if __name__ == "__main__":
    main()
