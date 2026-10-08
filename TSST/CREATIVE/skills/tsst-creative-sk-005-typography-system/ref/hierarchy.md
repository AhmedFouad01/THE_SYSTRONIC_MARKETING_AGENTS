# Hierarchy craft (UNVALIDATED, distilled from GEM-CR-006 after Lead review + own tests)

Canvas 1080x1350 (4:5). All sizes in px, never pt.

## Scale and size ladder
Pick 3 sizes at most per slide (one dominant, one support, one label). Ratio between neighbours 1.25-1.6; the jump must be visible at phone thumbnail size, otherwise it is not hierarchy.

| role | px (1080x1350) | weight | tracking | leading |
|---|---|---|---|---|
| display (1 hook line) | 110-160 | Inter 28pt SemiBold/Bold | -2 to -3 % (-20..-30) | 1.00-1.10 |
| headline | 64-96 | 28pt SemiBold | -1 to -2 % | 1.10-1.15 |
| support / sub | 36-48 | 18pt/24pt Medium | 0 | 1.25-1.35 |
| body (carousel, rare) | 30-34 | 18pt Regular | 0 to +1 % | 1.35-1.45 |
| caps label / kicker | 22-28 | 18pt SemiBold CAPS | +10 to +20 % (+100..+200) | n/a (1 line) |

Floor for any text on a 4:5 post: 26 px (label caps), 30 px mixed case. These replace the "30 pt, uppercase titles" slide rule, which is a presentation rule and not a social one.
Inter optical files: 28pt for display (>=40 px), 24pt for 28-40 px, 18pt for under 28 px.

## Tracking and leading
- Tracking tightens as size grows (big letters look loose); small text neutral; small CAPS opened wide.
- Display leading 1.0-1.1 is fine for Latin because lines have few descenders; Arabic needs ~1.35x its own size (METRICS.md, section c). Never share one leading value between scripts.
- Never track lowercase body wide. Never track Arabic at all (it breaks letter joins).

## Breaks, widows, alignment
- Break lines by meaning: "Made to / live in." not "Made to live / in." Each line should read as a phrase.
- No one-word last line in 2-3 line heads (widow). Shorten, rebreak, or adjust size, not tracking.
- Prefer ragged-right left-aligned or a single centered short line; centered 3+ lines only for a closing slide.
- Short lines stacked left share one left edge; do not mix left and centred in one block.

## Optical alignment
- Hanging punctuation: opening quote and bullet sit outside the left edge so letters line up.
- Big round or diagonal letters (O, V, A, "live") look inset next to a flat edge: nudge left 1-3 % of size so the visible edge aligns. Large type needs optical, not box, alignment.
- Align by baseline across mixed sizes (script + sans on one line share a baseline).

## Colour / contrast quick rule
Large display needs >= 3:1, small text >= 4.5:1 (SK-006). Measure against the actual photo patch, not the average impression (see lockup-tests/NOTES.md: the wall patch was darker than it looked).
