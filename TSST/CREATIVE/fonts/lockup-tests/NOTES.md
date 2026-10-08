# Lockup tests, 2026-10-08 (UNVALIDATED, previs; not final assets)

Copy: "Made to live in." / "One team, start to finish." / "Finished." (COPY_DECK v2). Fonts: Inter 28pt Bold/SemiBold (display), Allura and Alex Brush (OFL). Colours: bold #F4F4F4, script #F58021 on dark petrol #011C2C; same on the real photo #7 (slide 4 clean crop, no overlays; text on the upper-left wall plane, 360 px wide). Files: sheet.png, variant_{A,B,C}_{Allura,AlexBrush}.png (left dark, right photo). Script: lock.py in this folder ( layers solid, no alpha, no shadow).

Photo patch measured: mean wall colour (112,74,47). Contrast: white 7.05:1 (OK), orange 2.95:1 (display only, marginal), dark petrol 2.25:1 (fails; first render used it, replaced by white).

Scores 1-5 vs ref/lockups.md (readability / premium vs cheap / fit with VILL quiet premium):

| variant | read | premium | VILL fit | note |
|---|---|---|---|---|
| A Allura (script "made to" over LIVE IN. caps) | 3 | 3 | 3 | script legible but thin; 12 % overlap touches the caps tops; caps feel loud for a quiet brand |
| A Alex Brush | 4 | 3 | 3 | heavier strokes read better over the caps; same loudness |
| B Allura (script "Finished" behind ONE TEAM.) | 2 | 2 | 2 | bold hides the script body ("sh"); on the photo they collide |
| B Alex Brush | 2 | 2 | 2 | same; script behind needs a thicker script |
| C Allura (Made to / *live* in.) | 5 | 5 | 5 | one word of script, shared baseline, calm; on photo still reads at 360 px |
| C Alex Brush | 4 | 4 | 4 | script bolder, slightly more casual; "live" ligature less elegant |

Photo panel: orange script on the dim wall is only 2.95:1; acceptable at display size only, retest on the real slide at final size.

Top 2 picks
1. C + Allura: script accent word inside an Inter line. Quiet, readable, one idea, fits the "quiet premium" brief and scales down.
2. A + Alex Brush (script over Inter Bold caps): the owner's named technique, most readable of the overlap lockups; test with bold SemiBold instead of Bold and a lower overlap (8-10 %) to cut the loudness.

Reject for now: B (script behind). Unproven: rotation, serif-italic, Arabic equivalent.
