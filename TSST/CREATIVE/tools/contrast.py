"""WCAG contrast ratio for hex pairs.
Usage: python contrast.py "#01304A" "#F4F4F4" ["#fg2" "#bg2" ...]
Prints ratio and pass/fail for AA text (4.5), AA large/UI (3.0), AAA (7.0). Exit 1 if any pair < 4.5."""
import sys


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def lum(hexstr):
    h = hexstr.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def main(argv):
    if len(argv) < 2 or len(argv) % 2:
        print(__doc__)
        return 2
    bad = False
    for fg, bg in zip(argv[::2], argv[1::2]):
        r = ratio(fg, bg)
        bad |= r < 4.5
        print(f"{fg} on {bg}: {r:.2f}:1  AA-text(4.5) {'PASS' if r >= 4.5 else 'FAIL'}  "
              f"AA-large(3.0) {'PASS' if r >= 3 else 'FAIL'}  AAA(7.0) {'PASS' if r >= 7 else 'FAIL'}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
