Skills used: TSST-CREATIVE-SK-030 (post-implementation audit: per-shot heuristic pass, severity split), TSST-CREATIVE-SK-026 (AR RTL/bidi/digits/panel side), TSST-CREATIVE-SK-029 (reports view: KPI/table/detail hierarchy, number/currency formatting). All UNVALIDATED; readiness NOT_READY. Read-only gate, no code edits.

# PREVIEW GATE: Reporting (Campaigns tab) - 2026-10-06

## Overall: PASS-WITH-FIXES

Core goal met. The permanent detail column and the "اختر صفًا لعرض تفاصيله" placeholder are gone. The table now spans the full content width. The panel matches the other screens: right on EN, LEFT on AR (D7), full-screen sheet at 375. Panel content fits 432 and 375. Must-fix items are AR counter bugs and mixed-name cell alignment/truncation.

## Per-shot verdicts

| Shot | Verdict | Notes |
|---|---|---|
| en-light-1440 | PASS-WITH-FIXES | Placeholder gone, table full width, KPI/header intact. Panel (432) overlays the 4th KPI card and the Publish button (clipped "Pu"). Panel content fits: outcomes table and spend facts. Counter "2 of 5" is correct. Mixed names are misaligned in the first column (see F2). |
| en-dark-1440 | PASS-WITH-FIXES | Same as light. Selected row and panel contrast are fine. Same F2 and overlay note. |
| ar-light-1440 | PASS-WITH-FIXES | Sidebar on the right, title and first column (الحملة) visible, panel on the LEFT. KPI values use Arabic digits and ج.م correctly. Bugs: panel counter reads "٢ من 0" (should be 5). Pagination reads "١–0 من 0" while 5 rows show. The "WhatsApp Broadcast" name is truncated at its start: "...atsApp Broadcast - حملة الواتساب" (F3). Latin digits are mixed in: lookback "30", KPI "70", "0 استرداد", panel dates (F4). |
| ar-dark-1440 | PASS-WITH-FIXES | Same findings as ar-light. Visual parity is otherwise good. |
| en-light-375 | PASS | Full-screen sheet from the right with Back and title. Outcomes table fits (Outcomes column is tight at about 353 of 375, no overflow). The table-header mid-word fix is not visible here because the shot shows only the sheet (F6). |
| en-dark-375 | PASS | Same as light. |
| ar-light-375 | PASS | رجوع with a chevron pointing toward the start. Content is RTL, columns are ordered right to left, and ج.م renders. The count "١٧" renders like "IV" at this size (glyph legibility, F5). |
| ar-dark-375 | PASS | Same as ar-light-375. |

## Checks requested

- Placeholder column gone and table full width: yes (all 1440 shots).
- Consistency with Leads/Contacts/Tasks: yes. Same slide-over, same prev/next and counter pattern, same sheet at 375. The overlay covers the right-hand KPI and the Publish button, consistent with D7.
- KPI cards and header unaffected: yes. They are only covered by the overlay while the panel is open.
- AR sidebar/title/first column visible: yes.
- Mixed AR/EN campaign names isolated: NO, only partly. See F2 and F3.
- Numbers and currency: ج.م and Arabic digits are correct in KPIs and the panel table. Digits are inconsistent elsewhere (F4). The panel subtitle shows "EGP" while the KPIs show ج.م (F4).
- Panel content fits 432 and 375: yes.

## Must-fix

- F1 (AR counters, data bug). The panel counter shows "٢ من 0" and the table pagination shows "١–0 من 0" while 5 rows are present. EN is correct ("2 of 5", "1–5 of 5"). Cause is probably the total not being passed to the AR formatter, or a number-format path that fails on the total. Fix both, and use Arabic digits for the whole counter.
- F2 (EN first column alignment). Rows with Arabic or mixed names ("Ramadan Sale - حملة رمضان", "عرض الجمعة البيضاء", "WhatsApp Broadcast - حملة الواتساب") are right-aligned or indented inside the LTR column, while Latin-only names are start-aligned. Wrap the name in `<bdi>`/`dir="auto"` as an inline isolate, and keep the cell `text-align: start` in the page direction. The first column should line up on the start edge.
- F3 (AR truncation). The cell ellipsizes the Latin segment from its start ("...atsApp Broadcast") although the column has room. Isolate the name with `<bdi>`, apply `text-overflow: ellipsis` to the cell and not to the mixed run, and check the column max-width.

## Later (should-fix / polish)

- F4 Digits and currency consistency in AR: lookback "30", KPI "70", "0 استرداد" and the date "2026-10-01" are Latin while neighbours are Arabic-Indic. The panel subtitle says "العملة: EGP" and "EGP" beside a ج.م value. Choose one rule (dates may stay ISO/Latin by decision) and apply it consistently.
- F5 The count "١٧" renders like "IV" in the AR table at small size. Consider a font-feature or size bump, or tabular numerals.
- F6 The 375 shots show only the sheet. Please add a 375 shot of the Reporting table itself (panel closed) to confirm the header mid-word fix and horizontal scroll.
- F7 No prev/next and no "2 of 5" at 375, unlike desktop. Confirm this matches the other screens (Tasks gate precedent).
- F8 At 1440 the open panel hides the Publish action. This is acceptable under D7, but consider keeping the action reachable.
- F9 Wide tables (the Outcomes columns) are clipped by the overlay with no cue. This is cosmetic.
