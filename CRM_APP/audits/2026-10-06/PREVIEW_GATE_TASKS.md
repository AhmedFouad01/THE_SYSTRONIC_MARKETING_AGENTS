# PREVIEW_GATE_TASKS (CREATIVE, 2026-10-06) - READ-ONLY gate

Skills used: TSST-CREATIVE-SK-030 (post-implementation audit: per-shot findings, severity, pass/fail), TSST-CREATIVE-SK-026 (RTL/bidi checks: start-edge headers, mixed AR/EN isolation, logical docking), TSST-CREATIVE-SK-023 (preview anatomy, action placement, list-context preservation). Baseline: PREVIEW_DECISIONS.md D5/D7.

## Contacts must-fix 1 re-verification
contacts-ar-light-1440 / dark-1440: column header "جهة الاتصال" now sits at the start (right) edge, aligned with the names. VERIFIED FIXED. Panel docks left, sidebar/title/name column visible.

## Per-shot verdicts
| # | Shot | Verdict | Notes |
|---|---|---|---|
| 1 | en-light-1440 | PASS | Panel at right, below topbar, 432 wide. Chip, Edit, Complete, Due, Overdue chip, Owner, Technical details all fit. Selected row tinted; same anatomy as Leads/Contacts. Due chip and Actions column clipped under panel (see DEV note). |
| 2 | en-dark-1440 | PASS | Same as 1; contrast of chips, Complete (cyan) and selected row fine. |
| 3 | ar-light-1440 | PASS | Panel docks physical left (D7). Sidebar, "مهامي" title, task-name column all visible. Headers (المهمة, مرتبطة بـ, الموعد) at start edge. Panel text RTL, buttons mirrored correctly. |
| 4 | ar-dark-1440 | PASS | Same as 3. |
| 5 | en-light-375 | PASS-with-note | Full-screen sheet, Back, all content fits, Edit/Complete full-size touch targets. Title wraps "Nile - [AR] / Office" (splits the English name). |
| 6 | en-dark-375 | PASS-with-note | Same as 5. |
| 7 | ar-light-375 | PASS-with-note | Sheet from the right (D7), Back/رجوع with correct chevron. Content fits. Title wraps "... شركة / النور - Nile Office" - acceptable. Date uses Latin comma (see later). |
| 8 | ar-dark-375 | PASS-with-note | Same as 7. |
| 9 | contacts-ar-light-1440 | PASS | must-fix 1 verified. |
| 10 | contacts-ar-dark-1440 | PASS | Same. |

## Checks requested
- Consistency with Leads/Contacts: same header (title, 1 of N, prev/next, close), same actions-then-fields layout, same selected row tint, same technical-details disclosure. OK.
- AR start-edge headers on Tasks: yes, via the central th fix.
- Mixed AR/EN: title strings with Arabic + "Nile Office" render in a consistent visual order between list, breadcrumb and panel; related-link text and Owner "Synthetic manager" read as isolated runs; no scrambled digits. No new defects in isolation.
- Fit at 432 and 375: all content fits, nothing clipped inside the panel.

## DEV note: Actions column and "New task" under the open panel (EN 1440; mirrored in AR where the panel covers the left end)
- Row Complete / Actions column hidden under the panel: ACCEPTABLE, no design change. Complete is duplicated in the panel (primary dark/cyan button), the selected row is identified, and Esc/close restores the column. Preview mode is a one-record-at-a-time workflow, so row-level actions are not needed.
- "New task" header button hidden under the panel: ACCEPTABLE for this batch (not a blocker; user can close the panel, and the topbar stays reachable per D2). If the user reports friction, the cheapest design change is NOT a reserve (it would shrink the table), but moving the page-header primary action to stay left of the panel: place header actions at the inline-start side of the title row when a preview is open, or keep them in the topbar. Log as later.
- Also the Due column is partly clipped by the panel (chip "Overdue" cut at the panel edge, EN 1440). Same information is in the panel; acceptable, same behavior as Leads/Contacts columns.

## Must-fix
None.

## Later (non-blocking)
1. Arabic datetime in panel and AR Due shows a Latin comma "٢٠٢٦, ١٠:٤١ م"; use Arabic comma "،" (locale formatting).
2. Title wraps can split an English name ("Nile / Office") at 375 and in the 432 panel in AR. User-value splitting was ruled out of scope by the Lead; keep as the same later item as Contacts item 2-3.
3. Optional: keep "New task" reachable while a preview is open (see DEV note).
4. Rollback point for Reporting remains clean: no Tasks regression versus Leads/Contacts.

## Overall: PASS
