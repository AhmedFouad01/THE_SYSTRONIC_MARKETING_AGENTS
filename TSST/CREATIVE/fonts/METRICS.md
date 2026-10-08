# Inter <-> Alexandria metrics (MEASURED)

Tool: `TSST/CREATIVE/tools/font_metrics.py` (PIL FreeType, measured at 400 px then scaled). Fonts: Inter 28pt optical files for display (Inter_28pt-*), Inter 18pt for small labels; Alexandria static weights. Both in the user font dir. Date 2026-10-08. Status UNVALIDATED.

Caveat: this PIL build has no RAQM, so Arabic is measured on ISOLATED letters (alef for height, seen for body height, a fixed 9-letter set for density), not shaped words. Heights and stems are reliable; descender depth of real shaped text (with diacritics, kashida) will be larger. Re-verify with shaped text in a RAQM-capable renderer (browser).

## Raw (per 400 px em; ratios are of em)

| font | cap/alef | x-height/seen | asc | desc | stem px | stem/em | advance/em | ascent+descent/em |
|---|---|---|---|---|---|---|---|---|
| Inter 28pt Regular | 0.728 | 0.522 | 0.728 | 0.212 | 34 | 0.085 | 0.418 | 1.212 |
| Inter 28pt Medium | 0.728 | 0.522 | 0.728 | 0.212 | 42 | 0.105 | 0.425 | 1.212 |
| Inter 28pt SemiBold | 0.728 | 0.522 | 0.728 | 0.212 | 50 | 0.125 | 0.433 | 1.212 |
| Inter 28pt Bold | 0.728 | 0.522 | 0.728 | 0.212 | 58 | 0.145 | 0.441 | 1.212 |
| Alexandria Light | 0.812 | 0.468 | 0.812 | 0.367 | 28 | 0.070 | 0.622 | 1.222 |
| Alexandria Regular | 0.820 | 0.482 | 0.820 | 0.367 | 40 | 0.100 | 0.643 | 1.222 |
| Alexandria Medium | 0.833 | 0.490 | 0.833 | 0.372 | 46 | 0.115 | 0.659 | 1.222 |
| Alexandria SemiBold | 0.850 | 0.502 | 0.850 | 0.380 | 53 | 0.133 | 0.682 | 1.222 |
| Alexandria Bold | 0.865 | 0.512 | 0.865 | 0.385 | 62 | 0.155 | 0.708 | 1.222 |

## (a) Size match (Inter Medium vs Alexandria Regular; ratios are the same across weights within 2 %)

- x-height match: Alexandria = **108 %** of the Inter size.
- cap-height (alef) match: Alexandria = **89 %** of the Inter size.
- The two disagree because Arabic alef is taller than Latin caps while Arabic body letters are shorter than Latin x-height. Rule: size Arabic by **x-height match (~108 %)** for body-like lines; the tall alef then stands about 22 % above Inter caps, which is normal for Arabic. For a headline stack where Arabic sits next to ALL-CAPS Inter, use the cap match (~89 %) or the middle (~100 %). The earlier '105 %' guess is close to the x-height number but was a guess.

| Inter px | Alexandria px (x-height match) | Alexandria px (cap match) |
|---|---|---|
| 48 | 52 | 43 |
| 72 | 78 | 64 |
| 96 | 104 | 85 |

## (b) Weight (colour) match, after x-height size match

Stem thickness (alef vs Latin l) in em, Alexandria scaled by the x-height factor so both are at matched visual size.

| Inter weight | Inter stem/em | best Alexandria | Alexandria stem/em (scaled) | other candidate |
|---|---|---|---|---|
| Medium | 0.105 | **Regular** | 0.108 | Medium 0.125 |
| SemiBold | 0.125 | **Medium** | 0.125 | Regular 0.108 |
| Bold | 0.145 | **SemiBold** | 0.143 | Medium 0.125 |

## (c) Line height

Ink extent (tallest ascender to deepest descender of the sample), per Inter-size em:
- Latin (Inter): 0.940 em
- Arabic at x-height-matched size: 1.286 em (1.37x Latin) (isolated letters; shaped text with marks needs more)

To keep the same visible gap between lines, Arabic pitch = Latin pitch + (Arabic ink - Latin ink).

| Inter size px | Latin leading 1.10 (display) pitch | Arabic pitch, same gap | Arabic as multiple of ITS font size | Latin body 1.40 pitch | Arabic body pitch |
|---|---|---|---|---|---|
| 48 | 53 | 69 | 1.34 | 67 | 84 (1.61x) |
| 72 | 79 | 104 | 1.34 | 101 | 126 (1.61x) |
| 96 | 106 | 139 | 1.34 | 134 | 168 (1.61x) |

Result: Arabic needs roughly 1.3-1.5x its own font size as line pitch in display (vs ~1.05-1.15 for Latin), and about 1.6-1.7x in body, i.e. a clearly looser stack than Latin set in the same box. The '+15 %' guess is too small for display; use the table.

## Other numbers
- Advance per em: Alexandria is wider (Regular 0.64 vs Inter ~0.43 on the samples, sample strings differ so compare only within a script); do not compare these across scripts for fit, test real copy.
- Inter 18pt vs 28pt: optical-size files differ in spacing/contrast; use 28pt for display (>=40 px), 18pt for labels under ~28 px.