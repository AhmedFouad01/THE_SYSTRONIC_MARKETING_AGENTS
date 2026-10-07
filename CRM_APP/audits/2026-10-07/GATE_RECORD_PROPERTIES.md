Skills used: TSST-CREATIVE-SK-030 (post-implementation heuristic pass), TSST-CREATIVE-SK-026 (RTL/bidi/numerals/plurals check), TSST-CREATIVE-SK-025 (edit-form field check). All three are UNVALIDATED. Read-only gate, screenshots only. No code or live interaction was checked.

# GATE: Custom fields in record panels and edit forms (P1b B3)

## Verdict: PASS-WITH-FIXES

The section is functionally correct and bidi-safe. Two visual defects (M1, M2) should be fixed before the gate closes.

## Per-shot verdicts

| Shot | Verdict | Notes |
|---|---|---|
| en-light-1440 | PASS-WITH-FIXES | The panel docks at the right (inline end in LTR), which is correct for D7. Labels and values are aligned. Pairs (Seats/Budget, Start date/VIP) sit on the same two columns as Owner/Source. Chips (Professional, Solar, Storage) show a colour dot plus text, so colour is not the only cue. Defect M1. |
| ar-light-1440 | PASS-WITH-FIXES | The panel docks at the left, which is the inline end in RTL (D7 OK). Mirror is complete: labels and values right-aligned, chip dot on the start side, chip order starts at the right. Digits are Arabic-Indic (١٬٢٣٤, ١٥ نوفمبر ٢٠٢٦, ٣:٥٢ ص). The currency sits correctly after the number ("ج.م"). The URL is intact at zoom (https://example.com, not scrambled). Mixed text ("Renewal due Q4", "Solar villa") does not break. Defect M2. |
| ar-dark-1440 | PASS | Dark tokens are correct. The panel surface, divider, label contrast, chip fill and dot colours (lighter variants) are readable. The primary "إنشاء صفقة" button and the selected sidebar row use the dark-theme accent. Same layout as light. |
| ar-light-375-edit | PASS | RTL form: labels right-aligned, inputs full width, no horizontal clipping. The checkbox list for Interests reads correctly. The select chevrons are at the start side. The sticky footer (إلغاء / حفظ التغييرات) is not clipped, and the disabled save state is visible. Only the first viewport is captured (the fields from Budget downward are hidden under the footer), so dates, boolean, URL and textarea inputs in edit mode were not reviewed. |

## Must-fix (real defects)

- M1 The section heading is too heavy. "Custom fields" / "الحقول المخصصة" renders at about the same size and weight as the record title ("Solar villa"), so it competes with the title and breaks panel hierarchy. The other panel blocks (Owner/Source grid) have no heading of that size. Use the panel section-heading style (smaller, semibold) so the title stays the top level. The same applies to the edit form on mobile.
- M2 Multiline text values are not start-aligned in RTL. In ar-light and ar-dark the "ملخص" (Brief) label is on the right, but its value ("Line one / Line two") is left-aligned. Single-line values ("Renewal due Q4") are correctly on the right. Set the value to `text-align: start` and isolate the content (`unicode-bidi: isolate` or `dir=auto` together with start alignment) so English text in the multiline block aligns with its label.

## Later (non-blocking)

- L1 The created-at value ("٧ أكتوبر ٢٠٢٦, ٣:٥٢ ص") uses a Latin comma. This is existing behaviour outside B3. Use the Arabic comma "،" in the date-time formatter.
- L2 No screenshot of the required-custom-field create dialogs. Capture them (AR, light and dark) next round. Also check the required marker, the error text and that no value is cleared after a validation failure (SK-025).
- L3 No 375 dark and no 375 view-mode shots. Capture the lower part of the edit form (dates, boolean, URL, textarea, footer overlap) too.
- L4 Plural check not possible. No count of custom fields is visible. If a count is added, use the Arabic plural forms (1 / 2 / 3–10 / 11+).
- L5 The 375 edit form has a checkbox group with tight vertical spacing (about 12px) and 20px checkboxes. Make the row at least 44px high.
- L6 The field labels are small (about 10-11px) and light grey. This matches the rest of the panel, so it is consistent, but check AA contrast on the light theme.
