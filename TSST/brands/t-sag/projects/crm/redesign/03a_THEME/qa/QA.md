# QA, house theme preview (round C1a)

Method: SK-010 / Impeccable bounded loop. Full build, one inspection of all 8 shots plus DOM scan (`shoot.mjs`, data in `qa-data.json`), one batch fix, one re-shoot. A single extra micro-fix (bulk bar position, below) was re-shot once more to confirm; no further rounds.
Shots (full page): `desktop-{light,dark}-{en,ar}.png` at 1440x900 viewport, `mobile-{light,dark}-{en,ar}.png` at 375x812.
Runtime: Playwright Chromium. Human review by Ahmed still needed; nothing is validated.

## Defects found in the first inspection and fixed in one batch
| # | Defect | Fix |
|---|---|---|
| 1 | Leads table collapsed and page overflowed 182px at 1440 (class `sel` used by both the select control and the selected row) | Renamed to `.dd` / `.on` |
| 2 | Hamburger button visible on desktop (`.btn` display overrode it) | `.btn.menu-btn` |
| 3 | Sidebar background ended at 100vh in tall pages | Full-height `.side` with inner sticky `.sidein` |
| 4 | Range select defaulted to "Last 7 days" instead of 30 | default index fixed |
| 5 | Mobile KPI label and chip squeezed into three lines | label row wraps |
| 6 | File size read "KB 48" in Arabic (bidi) | wrapped in `bdi dir=ltr` |
| 7 | Import button icon-only at 375 with no accessible name | `aria-label` |
| 8 | Select popover captured stale language | items read language at open time |
| 9 (re-shoot) | Sticky bulk bar floated over the table header and left a blank gap | Bulk bar now sits in flow between toolbar and table, no sticky |

## Results (final shots, all 8)
| Check | Result |
|---|---|
| Clipping / overflow | PASS. Horizontal overflow 0px in all 8; 0 clipped text nodes; long names ("Cairo Kitchens مطابخ القاهرة", the email-only lead) wrap, never cut. |
| Bidi in mixed names | PASS. "Omar Hassan (عمر حسن)", "محمد El-Sayed", "Delta Tech دلتا" render with correct run order in table and in AR; phones, emails and "48 KB" are LTR isolates; name input uses `dir=auto`. |
| Icons / chevrons mirrored in RTL | PASS for calendar prev/next (`.flip`, verified transform in DOM). Select chevrons are vertical (no mirror needed). Chart time axis reverses in AR (newest at the left), legend and sidebar flip, chips keep icon at the start. |
| Baseline and alignment | PASS. Header actions all 36px (44px at 375); top bar controls 36px; form fields share a row baseline because hints reserve their line; KPI values share a baseline. Mobile table row height uniform. |
| Button on a line | PASS. No borders on cards, rows, bars or footers; the only border-bottom match is the spinner glyph (false positive). Footer actions sit on the card with 24px spacing. |
| Contrast numbers | PASS, all text pairs ≥ 4.5 and UI parts ≥ 3 in both themes (table in DESIGN.md section 11). Exceptions documented there: disabled items; dark primary button fill vs surface is 3.29 (passes 3). |
| Visible focus | PASS. Tab lands on a 2px ring: light `rgb(34,81,211)`, dark `rgb(143,176,255)`, in all 8 runs. Not clicked-through exhaustively. |
| No pure black | PASS. 0 computed colour, background or border equal to rgb(0,0,0) across all 8 runs. Darkest surface `#0A1330`, darkest ink `#12203F`. |
| No native controls | PASS. 0 visible `select`, date, file, colour or range inputs; checkboxes are visually hidden and drawn (kit pattern); hidden file input is only triggered from the styled Browse button. |
| Tabular numbers | PASS. Every `td.num`, `.kpi .v` and `.num` computes to `tabular-nums`; chart ticks use `.num`. |

## Remaining / not checked
- The preview is HTML+CSS+JS, not React Aria: the select, date and file widgets prove the look and basic keyboard behaviour only. DEV must rebuild them on React Aria Components and re-run this QA. Arrow-key selects and date spinbuttons were not tested beyond load.
- Fonts load from Google Fonts at view time; offline the fallback stack shows. Production should self-host (both OFL).
- Arabic Plex digits: tabular behaviour for Arabic-Indic digits was checked visually only (alignment looked even); the font's `tnum` support for them is unverified.
- The 1440 shots are full-page (not a single 900px viewport) to inspect everything; the viewport is 1440x900.
- Mobile drawer open state and popovers open were not screenshotted.
- Dark-mode light-weight Arabic text on `raised` is 4.87:1 for ink-3; acceptable but the lowest text pair; avoid ink-3 on raised for body-size text.
- The "Coming soon" tooltip is a native `title`, to be replaced by the kit tooltip.
