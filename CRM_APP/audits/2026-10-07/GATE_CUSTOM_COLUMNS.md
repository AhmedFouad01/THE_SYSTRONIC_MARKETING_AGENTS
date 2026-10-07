Skills used: TSST-CREATIVE-SK-030 (post-implementation heuristic pass), TSST-CREATIVE-SK-026 (RTL/bidi/numerals check), TSST-CREATIVE-SK-025 (filter/control check). All three are UNVALIDATED. Read-only gate, 4 screenshots only. No code or live interaction was checked (open picker popover and sort interaction not captured).

# GATE: List grid custom columns, picker, typed filters, sort (P1b B4)

## Verdict: PASS-WITH-FIXES

RTL mirroring, digits and dark tokens are sound. Two visual defects (M1, M2) should be fixed before the gate closes.

## Per-shot verdicts

| Shot | Verdict | Notes |
|---|---|---|
| en-light-1440 | PASS | The toolbar order is Search, All, Save view, Filters, Columns, Custom fields, Compact density. The three pills share one style. The filter panel has the Custom field / Condition / Value row, a remove button, "Add custom field filter" and "Clear filters". The chip "Seats at least 200" is shown under it. Header and cell alignment is correct. The custom columns Seats (300, 500) and Plan (chip with dot plus text) render through the B3 renderers. The Created header has a sort marker. Minor items L1, L2. |
| ar-light-1440 | PASS-WITH-FIXES | The toolbar mirrors fully (search at the right, count "٢ نتيجة" at the left). The filter panel labels, the controls and the remove button at the inline end are mirrored. The chip reads "عدد المقاعد لا يقل عن ٢٠٠" and the dot is at the start. Digits are Arabic-Indic everywhere (counts, ٣٠٠, ٥٠٠, "١–٢ من ٢", pager). The column order is mirrored (Lead at the right, Plan at the left). Mixed text ("Charlie lead", "Synthetic manager") sits correctly in cells, with no scrambling. The sort marker sits at the end of the label (left) and the pagination arrows are mirrored. Defect M1, M2. |
| ar-dark-1440 | PASS | The tokens hold: the panel surface, borders, chip, plan-chip dot and the focus ring on the active "الحقول المخصصة" pill are visible. The primary button uses the dark accent. Layout is the same as light. Header label grey is low-contrast (L3). |
| ar-light-375 | PASS-WITH-FIXES | Nothing clips. The grid turns into cards and the custom values show as "label: value" ("عدد المقاعد: ٣٠٠", "الباقة: [chip]"). The chip row wraps correctly. The card titles are start-aligned. See L4: the picker, custom-field filter pill and sort are not visible at this width. |

## Must-fix (real defects)

- M1 Header and cell misalignment in AR 1440 (light and dark). The headers of the right-most columns sit on the right edge of the column, but the cells of the last four columns sit toward the left. Created: the header spans x 336-392 and the value "الآن" is at 302-322. Seats: the header spans 225-282 and the value is at 175-190. Plan: the header is at 127-154 and the chip at 35-114. Status: the header is at 712-738 and the chip at 660-715. In EN the same columns align. Use `text-align: start` (and `justify-content: flex-start`) on header and cells with the same column track widths, so both start at the inline-start edge. Numeric columns should align consistently on one side in both languages.
- M2 The sort marker is a raw black "▼" text glyph, small and off-system. The icons in the toolbar are line icons. A single arrow also does not tell ascending from descending, and only one header carries it. Replace it with the system chevron/arrow icon (tokenised colour, flips direction for asc/desc), and make sortable headers a button with `aria-sort`. This applies to EN, AR, light and dark.

## Later (non-blocking)

- L1 In the filter panel the control heights differ: the Value input is about 36px high and the selects about 32px. Its label sits about 4px higher than "Custom field" and "Condition" (EN and AR). Match the heights and align the labels on one baseline.
- L2 The filter row is stacked at the start with a wide empty area in the panel. The Custom field / Condition / Value controls could sit in one row with the Status/Owner group. Check this at 1024.
- L3 Table header labels are about 10px and light grey. This matches the rest of the app, but check AA contrast, especially in dark.
- L4 At 375 the "Columns", "Custom fields" and "Compact density" pills and any sort control are not visible. Only a filter icon with count "١" is shown. If these live inside the filter sheet, capture it (open picker popover and filter sheet, AR, light and dark). If they are absent, users on mobile cannot pick or sort custom columns. Confirm this is intended.
- L5 No capture of the open picker popover in any language. Check it in the next round: RTL anchor, checkbox alignment, search, Arabic labels, and that the "Seats" label does not break next to the English field name.
- L6 At 375 the "١–٢ من ٢" counter is in a brown/orange colour that does not match the grey counters elsewhere. Use the muted text token.
- L7 At 375 the select-all checkbox sits alone on its own row with no label. Add a label or fold it into the toolbar.
- L8 Typed filters: only a number filter was shown. Text, date, select, boolean condition rows (SK-025) were not captured. Also capture the error state for an invalid value (for example, text in a number field) and the "clear" behaviour.
