# Pre-export typography checklist (UNVALIDATED)

Run at 100 % and at phone-thumbnail size (tools/phone_preview).

1. Reading order: one dominant line, one support at most; squint test passes.
2. Sizes from the px ladder (ref/hierarchy.md); none under 26 px caps / 30 px mixed.
3. Tracking: display tightened, caps labels opened, lowercase body neutral, Arabic untracked.
4. Leading per script (Arabic ~1.34x display, Latin ~1.10).
5. Line breaks by meaning; no widow; no break inside a name or number.
6. Lockup: one only, built from layers, script word 1-2 max, overlap tested for readability.
7. Contrast measured on the real background patch (3:1 large, 4.5:1 small); no partial-alpha text.
8. Text sits on a quiet plane; nothing crosses lamps, edges, signs, or detail.
9. No text shadows or glows on project photos (SK-011/008 v0.3); no stroke on script.
10. Optical alignment: hanging punctuation; round letters nudged; shared baseline across sizes.
11. Script rotation is optional: if used, one angle, 5-12 degrees, never on the photo-heavy slides by default.
12. Fonts only Inter + Alexandria (+ approved script test fonts); no fake bold, no stretching.
13. Arabic and mixed strings rendered in a browser; bidi/punctuation/numerals checked.
14. Safe margins respected (SK-004), no text near the platform UI zones.

Removed from the Gemini list: "overshoot compensation" (a type-design property built into the font, not a designer action).

## Exercises
1. Take one VILL line, set it 3 ways (all Inter / script accent / Thin+Black); pick one in 10 minutes and write why.
2. Set the same line in AR+EN; match sizes with METRICS.md; render in a browser.
3. Break "One team, start to finish." three ways; keep the best by meaning.
4. Photo test: measure the contrast of a text colour on the exact crop; fix colour, not an overlay.
5. Take a Gemini/Canva "pretty" lockup, redraw it from layers, list what you changed.
