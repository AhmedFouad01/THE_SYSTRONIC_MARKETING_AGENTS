Skills used: TSST-CREATIVE-SK-030 (post-implementation audit: re-gate against prior must-fix list), TSST-CREATIVE-SK-026 (bilingual/RTL/bidi checks: chevron direction, mixed AR/EN text, panel side), TSST-CREATIVE-SK-023 (record preview: panel/sheet structure, header, dedupe of title)

# Leads preview RE-GATE (2026-10-06)
Agent: tsst-creative. Read-only. All 8 shots viewed. Decision D7 applied as reference.

## Per-shot verdict
| Shot | Verdict | Notes |
|---|---|---|
| en-light-1440 | PASS | Panel at right, 432px, overlay, clear left edge and shadow. Header 56px aligns with the topbar. Count, prev/next, close all at the end. Brand block fixed. |
| en-dark-1440 | PASS | Edge and heavier shadow are visible against the dark table. Selected row remains legible. |
| en-light-375 | PASS | Sheet is full width. Back chevron points left with "Back" label. Record name shown in header, actions and fields are fine. |
| en-dark-375 | PASS | Same as light. Contrast OK. |
| ar-light-1440 | PASS-WITH-FIXES | Panel on the LEFT (correct per D7). Order is correct: close at left end, count at start. Body subtitle line is bidi-suspect (see below). |
| ar-dark-1440 | PASS-WITH-FIXES | Same as AR light. Edge and shadow clear. |
| ar-light-375 | PASS-WITH-FIXES | Sheet is correct. Back chevron CORRECT: it sits at the right (start) edge and points right, with "رجوع". Subtitle mixed-text issue (below). |
| ar-dark-375 | PASS-WITH-FIXES | Same as AR light. |

## Lead's specific points
1. Back chevron in AR 375: correct. It points right, toward the start edge, at the right of the label. No change needed.
2. Mixed AR/EN subtitle ("شركة النور ... العامة - Contact" / "طلب عرض سعر"):
   - Reading order looks wrong. "Contact" renders at the far visual end of the line, next to the dash, and the tail "طلب عرض سعر" drops to the next line. At 1440 only "سعر" is orphaned alone on a third line. The "Contact" prefix is logically first, so it should sit at the start (right) of the line.
   - It is PRE-EXISTING, not introduced by the panel. The same pattern appears in the AR table row sub-line for this lead and in the Contact column cells (for example "Contact ... - ..." in an LTR-flowing cell inside the RTL page). The panel inherits the composed string "Contact " + lead title.
   - The pure-Latin rows (Orbit, Delta, Hotel, Acme, Zahra) look fine in AR. Only the Arabic-title rows are affected.
   - Because the user calls mixed-text breakage critical, treat it as a must-fix even though it is not a panel regression. Caveat: I judged this from screenshots only. Confirm the logical string in the DOM before fixing.
3. Record name twice at 1440 (header + body): acceptable. The header copy is small, truncated and carries position (n of 8), so it works as context. The body title is the H1 with the status badge. No removal needed. Optional later: show the header name only once the body title scrolls out of view.

## Prior must-fix list check
- 56px brand block: done.
- Edge and shadow tokens, heavier in dark: done.
- Width 432 at 1440: done.
- Record title in header: done.
- Back closes the 375 sheet: Back control present and correct (the close behaviour itself was not exercisable in a static shot).
- Exit animation and menu z-index: not verifiable from static shots. The topbar "..." menu is not covered by the panel in any shot.

## Overall: PASS-WITH-FIXES

### Must-fix (precise)
1. Isolate the mixed AR/EN subtitle in the panel, the table sub-line and the Contact column cell. Wrap the contact name and lead title in `<bdi>` or `dir="auto"` spans, rendered as separate elements. Do not concatenate "Contact " + Arabic title into one bidi run. Then re-shot AR 375 and AR 1440 on the "شركة النور ..." row.
2. Stop the orphaned last word wrapping (for example "سعر") in the AR subtitle. Allow the subtitle to wrap by whole phrase, or truncate it to one line with an ellipsis.

### Later
- Header name appears only after the body title scrolls out.
- Confirm exit animation, focus return and Back behaviour through an interactive run (not testable from static shots).
- The seed data string "Contact ..." prefix is synthetic noise. Real data may not hit this, but the isolation fix should still ship.
