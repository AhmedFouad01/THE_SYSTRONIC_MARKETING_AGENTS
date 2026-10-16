# text_space.py test on VILL v2 text slides (UNVALIDATED tool, no slide rebuilt)
Command: `python TSST/CREATIVE/tools/text_space.py --slide build-v2/slide-NN --out _qa/text_space/slide-NN`
Box = real 03_text.png alpha bbox. Plane = box x1.5 area. Edge = Sobel>24 on 1.5px blur. Previews: slide-NN/heatmap.png (magenta = v2 box, green/yellow/cyan = picks 1-3, red = busy).

| Slide | Photo | Text box | v2 box (edge% / std / best brand colour, ratio mean / worst) | Tool #1 | Tool #2 | Tool #3 | Verdict |
|---|---|---|---|---|---|---|---|
| 01 | #8 | 456x95 | (176,79) 1.25% / 22.8 / F4F4F4 5.04 / 4.53 | (115,1167) 0.25% / 13.8 / F4F4F4 10.99 / 7.98 | (115,1047) 0.35% | (139,75) 0.75% / 17.8 / 5.11 / 4.53 | AGREE on region, weaker on rank |
| 02 | #1 | 274x101 | (471,135) 0.0% / 9.1 / 011C2C 7.05 / 6.16 | (455,135) 0.0% / 9.0 / 7.05 / 6.08 | (131,1167) 0.0% | (479,1167) 0.0% | AGREE (same plane, 16 px apart) |
| 04 | #7 | 160x90 | (68,63) 0.0% / 8.6 / F4F4F4 7.34 / 6.40 | (274,1178) 0.0% / 2.0 / 15.34 / 14.9 | (166,1022) 0.0% | (142,194) 0.0% / 3.8 / 6.16 / 5.72 | AGREE it is quiet; tool prefers other planes |

Notes
- Slide 1: v2 box is quiet (<5%) but only 5.04:1 on its mean and 4.53:1 worst; the tool finds quieter and much darker planes bottom-left (10.99:1) and the same top-left zone as #3. v2 chose the top for reading order, a reason the tool cannot see. Pick #3 (139,75) is a ~37 px shift left with the same contrast. Flag: contrast margin on slide 1 is thin (worst 4.53 vs the 4.5 floor).
- Slide 2: tool reproduces the v2 choice (quiet wall, 0.0%). Strong agreement.
- Slide 4: all picks 0.0% edge. v2 sits in the top-left; its luminance std (8.6) is 4x the tool's best (2.0), but contrast is fine (7.34 / 6.40).
- Tool picks #1/#2 on slides 2 and 4 land in the bottom band where the BEFORE/AFTER label (y 1262) and logo live. The tool has no keep-out for other layers; use --subject to fence them or treat bottom picks as candidates only.
- Tool is ranking by quietness only; reading order, thirds, and light direction (SK-008 v0.3) stay human decisions.
