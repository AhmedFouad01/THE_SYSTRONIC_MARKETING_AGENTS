# Lead notes on BRAND_LOOK_DIRECTION_v0.3 (C7-VILL-07, round 1)

Correct: sampled hex `#040136` navy, `#EE8C01` orange (Lead re-sampled Logo.png: same); all contrast ratios re-computed: same.

Fix in v0.3 (same file):
1. **Typography/grid ignore the VI deck.** `inputs/VI/VI (5).png` specifies Raleway Bold (headlines 36/48/64/72, tracking −0.5%), SemiBold (subheads 20/24/28/32), Regular (body 12/14/16/18), Light (captions 10/12/14, +0.5%); 12-column grid, 64 px margins, 24 px gutter, 8/16/32 spacing. Use these; add an Arabic companion that matches Raleway's geometric style (state why), keep Arabic tracking 0.
2. **Colour roles contradict.** Navy is "60% primary text" while Ivory is "20% dominant background". VI DNA is dark: Navy = dominant background 60%, Ivory = content/text 20%, Orange = accent (≤10%); fix the table and the light-ground variant.
3. Add the logo white `#F3F4F6` as the logo-only token (Lead sample).
4. State the mapping explicitly: Ink Blue `#0F1E34` → Logo Navy, Aged Bronze `#B07A3C` → Logo Orange (same colour families, tuned to the logo). User confirms at acceptance.
5. Markdown is broken (backslashes instead of backticks, words split across lines in §2/§3). Write plain UTF-8 with LF.
Also read all 8 VI pages before writing.
