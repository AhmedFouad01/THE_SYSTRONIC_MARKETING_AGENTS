# Lockup recipes (UNVALIDATED starting points to TEST, not rules)

A lockup = two or more type voices designed as one shape. Test results: TSST/CREATIVE/fonts/lockup-tests/NOTES.md.

## 1. Script + bold (owner's named technique)
Recipe to test: script word 1-2 words max; script x-height about 40-50 % of the bold cap height; overlap 10-25 % of the bold height (our test: 12 %); script ON TOP of the bold; bold in caps; two colours (bold white/dark, script orange). Rotation 5-12 degrees is optional, try straight first. Script baseline continues into the bold's top edge, so the two read as one object.
- Premium: one script word, thin overlap, strong colour contrast, bold set tight, script not scaled up to shout, lots of space around.
- Cheap: whole sentence in script, script on both sides, glow/shadow/stroke on script, random tilt, script and bold the same colour, overlap so deep letters become unreadable.
- Variation "script behind bold" works only if the bold is small and low and the script big; any bold that covers the script x-height body kills it (our test B). Needs a thick script; Allura and Alex Brush are thin.

## 2. Script accent word inside a sans line (best result in our test)
One word of the line swapped to script, 1.5-1.7x size, in the accent colour; the rest stays quiet Inter. Shares a baseline. Premium: only one word, the word carries the meaning ("live"). Cheap: 2+ script words, script word at the same size as sans (looks like a font error), accent on a filler word.

## 2b. Script line: leading, size ratio, punctuation (MEASURED, 2026-10-08)
Measured with `tools/font_metrics.py` at 1000 px (em fractions). Inter 28pt SemiBold: cap 0.727, x-height 0.522, descender 0.212. Alex Brush: x-height 0.416, cap 0.735, ascender of `l` 0.498 (`f` 0.540), descender of `f`/`y` 0.205, plain `live` descender 0.013.

**Leading.** Pitch P (baseline to baseline, in Inter-size units, script factor k):
- into a script line: P >= d_above + g + a_s*k  (d_above = 0.212 if the Inter line above has g/j/p/q/y, else 0; a_s = 0.498, or 0.540 if the word has `f`)
- out of a script line: P >= dsc_s*k + g + 0.727  (dsc_s = 0.205 for f/y words, about 0.01 otherwise; 0.727 = cap of the Inter line below)
- g = 0.10 (about one Inter stem 0.125 minus a little; 8-9 px at 76-92 px).
- Line height = max(Inter display leading 1.12, the larger P above). At k = 1.6 worst cases: into 0.212 + 0.10 + 0.864 = 1.18 (`f` word under a descender line); out 0.328 + 0.10 + 0.727 = 1.16. Typical (`live` under "Made to", no descenders): 0.10 + 0.797 = 0.90, so Inter 1.12 governs.
- Check of v3: the 1.34 `lh_script` in build.py was never applied (the script sits on the LAST line of both lockups and `lh_script` only moves the baseline AFTER the script line), so the real pitch into the script was 1.12: gap 0.32 em above a no-descender line, 0.11 em under a descender line, clear. 1.34 would be over-specified: out-of-script needs 1.16 at k = 1.6 (1.34 only at k = 2.5). Use 1.20 as the safe single value for a script line at k <= 1.6.

**Size ratio.** Matching x-height: k = 0.522 / 0.416 = 1.25. Matching Inter cap to the Alex Brush `l` ascender: k = 0.727 / 0.498 = 1.46. v3 used 1.6: script x-height 1.28x the Inter x-height, ascender 1.10x above the Inter cap. Rule: 1.25 = quiet (same lowercase mass); 1.46 = ascender meets cap height (default for an inline accent); 1.6 = display emphasis, still inside the 1.5-1.7 recipe. v3 approved at 1.6: do not change.

**Punctuation after a script word.** Set in Inter (Inter size, not k) on the shared baseline; never a script glyph (Alex Brush strokes are about 0.07 em vs Inter 0.125, a script period/comma nearly vanishes next to Inter). Gap: the script's last stroke overhangs its advance (`live` ink ends 0.061 em, `finish` 0.044 em past the advance, times k) while the Inter `.` has left bearing 0.051 em. Natural gap at k = 1.6 is -0.047 px-units (live) and -0.019 (finish): the dot touches the stroke. Target ink-to-ink gap 0.08 em, so pen x = script ink right + 0.03 em (period LSB included), about +0.10-0.13 em (7-10 px at 76-92 px) beyond the plain advance. Eye check on the real render; v3 (approved) unchanged.

## 3. Serif-italic accent (to test next)
Same logic with an italic serif (e.g. a licensed display serif) instead of script: quieter, more editorial, no readability problem. Needs an approved font first.

## 4. Thin + Black in one family
One family, two extremes (Inter Thin or Light + Black), same size or 1.3x. Contrast of weight does the work, no second typeface. Premium: both same colour or one tint; ample leading. Cheap: three weights in one line.

## 5. Stacked blocks
Short lines stacked into a block with equal widths (size adjusted per line to fill the measure) or an equal left edge. Premium: sizes differ by line only when meaning differs; tight 1.0 leading. Cheap: forced justification that stretches letters (never stretch or artificially bold type).

## General
- One lockup per slide. The text belongs to a quiet plane of the photo (tools/text_space.py), never on top of detail.
- Lockups are built from layers (each voice its own layer) so Ahmed can edit them.
