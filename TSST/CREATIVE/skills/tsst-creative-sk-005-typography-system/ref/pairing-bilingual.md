# Pairing and bilingual (UNVALIDATED). VILL: English = Inter, Arabic = Alexandria (not Cairo).

Numbers MEASURED with tools/font_metrics.py, full table in TSST/CREATIVE/fonts/METRICS.md (Inter 28pt vs Alexandria static; isolated Arabic letters because PIL has no RAQM here).

## Size and weight
- Match by x-height: Alexandria = ~108 % of the Inter size (Inter 48/72/96 px -> Alexandria 52/78/104 px). Alef is taller than Inter caps (Alexandria alef is 0.82 em vs Inter cap 0.73 em); against ALL-CAPS Inter use ~89-100 %, never 108 %.
- Weight match (after the size match): Inter Medium = Alexandria Regular; SemiBold = Medium; Bold = SemiBold. Stems agree within 0.003 em.
- Line pitch: Arabic needs ~1.34x its own size for display (Latin ~1.10) and ~1.6x for body. Do not share one leading.

## Rules
- Pair by colour (stem density) and height, not by identical numbers; test with real words.
- Never fake bold, stretch, or track Arabic.
- Each script owns its own line: do not mix script mid-line except brand names (VILL). Keep "VILL" away from line ends in Arabic (bidi).
- Numerals: Western digits in both languages for VILL unless the brief says Arabic-Indic; set digits with the Arabic font in Arabic lines to keep colour even; test +, %, dates.
- Punctuation in RTL: check full stop, comma, quotes and ellipsis end up on the correct side, and brackets mirror.
- Bidi test string must be rendered in a browser (RAQM/HarfBuzz), not only PIL.

## Bilingual lockups
- Script+bold technique has no Arabic equivalent with Alexandria alone; the Arabic "accent" voice is weight/size contrast (Alexandria Thin/Light + Black) or a calligraphic face (Aref Ruqaa is the only approved-in-review candidate; Rakkas/Lemonada/Lalezar are display faces, not handwriting). Not tested yet.
- Mirror the structure, not the shapes: EN left-aligned, AR right-aligned, same baseline grid, same colour roles, motion from the right in AR.
