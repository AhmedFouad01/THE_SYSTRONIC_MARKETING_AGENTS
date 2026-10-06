Skills used: TSST-CREATIVE-SK-030 (post-implementation audit, regate vs Leads baseline and IMPACT s4 guard-rails), TSST-CREATIVE-SK-026 (RTL/bidi: panel side, mixed AR/EN names, column header alignment, digits), TSST-CREATIVE-SK-023 (record preview: header, actions, tabs, identifiers list, sheet at 375)

# Contacts preview GATE (2026-10-06)
Agent: tsst-creative. Read-only, static shots only (all 8 viewed, plus leads-ar-light-1440 for comparison). D7 as reference.

## Per-shot verdict
| Shot | Verdict | Notes |
|---|---|---|
| en-light-1440 | PASS | Right panel 432px, overlay, below 56px topbar, left edge + shadow same as Leads, header 56px with "8 of 9", prev/next/close at the end. Row tint + 3px accent clear. Actions (Create deal / Add task / Edit), Owner/Source, tabs Overview/Journey/Duplicates, identifiers list (Email badge + value + Add), Technical details all fit, no clipping. |
| en-dark-1440 | PASS | Edge/shadow visible, selected row tint legible, primary button cyan with good contrast. Same as light. |
| en-light-375 | PASS | Full-width sheet, Back chevron left + label, header name truncated, actions on one row, tabs and email row fit, no horizontal clipping. |
| en-dark-375 | PASS | Same as light, contrast OK. |
| ar-light-1440 | PASS-WITH-FIXES | Panel on LEFT per D7, close at left end, order correct, sidebar (right) and page title "جهات الاتصال" visible, name column visible and right-aligned, selected row tint ok. Panel content mirrors correctly (actions, tabs, identifiers: Add left, "البريد" badge right, email LTR ok). Issues: (1) the Contact column HEADER is not at the start edge: only a clipped "جه" shows at the far left under the panel edge, so the column title is effectively invisible (Leads AR headers sit at the right, so this is a Contacts-specific regression). (2) Panel header name truncation leaves a Latin fragment "...ice - شركة..." (cut mid-word of "Nile Office"). |
| ar-dark-1440 | PASS-WITH-FIXES | Same as AR light; same two issues. Edge/shadow clear. |
| ar-light-375 | PASS-WITH-FIXES | Sheet correct: Back chevron at right (start) pointing right with "رجوع". Actions, Owner/Source, tabs, identifier fit. Issue: H1 "شركة النور ... العامة - Nile Office" wraps and splits the Latin name, leaving "Office" orphaned alone on line 2. Header line truncates as "...Office - شركة..." (fragment of Latin name). |
| ar-dark-375 | PASS-WITH-FIXES | Same as AR light 375. |

## Consistency with Leads
Edge, shadow (heavier in dark), header height/layout, width 432, selected-row tint + accent bar, 375 sheet header with Back: all match. No regression of the 56px brand block. Differences: Contacts has no checkbox column (expected). Contact name shown in header and body H1 (same accepted pattern as Leads).

## Guard-rails (IMPACT s4), visible parts
Intact in shots: topbar 56, record crumb in topbar (CRM > Contacts > name; AR mirrored), 6/3-col toolbar and Columns count, row height 44 and ellipsis cells, no owner caption under name (only job-title line "Synthetic manager" is a seed subtitle), Technical details closed, Create deal primary + Edit/Add task secondary, page not shifted when panel opens (overlay, table not reflowed). Not verifiable from static shots: focus return, z-order of menus/dialogs, motion, Esc, deep link, Save/Cancel dirty model, test ids.

## Overall: PASS-WITH-FIXES

### Must-fix (precise)
1. AR Contacts grid: the "جهة الاتصال" column header is not aligned at inline-start (right) and is clipped under the left panel at 1440. Align header text with the cells (logical `text-align:start`, check the sort-arrow flex direction and any `left`/`text-align:left` or `direction:ltr` on the Contacts header cell; compare with the Leads header which is correct). Re-shot AR 1440 light/dark.
2. Mixed AR/EN name in AR: render the name as separate `<bdi>` spans (Latin and Arabic parts) and keep the Latin part from splitting: `white-space:nowrap` on the Latin `<bdi>` (so "Nile Office" never wraps into "Nile" / "Office"). Apply to panel H1, header name, topbar crumb. Re-shot AR 375.
3. Panel header name truncation in AR (1440 and 375): do not cut inside the Latin run. Either truncate at the logical end of the string (so the Arabic or the whole name shows consistently) or use `<bdi>` per part with ellipsis on the container so no partial Latin fragments like "...ice" show.

### Later
- Digit consistency: AR header count "٨ من ٩" is Arabic-Indic while seed emails/IDs are Latin: correct by design, just confirm product rule for digits.
- Show header name only after the body H1 scrolls out (same as Leads).
- Interactive pass for focus, Esc, Back close, z-order, deep link and dirty-edit model (not testable from static shots).
- Synthetic job-title line "Synthetic manager" duplicates the Owner value; seed noise only.
