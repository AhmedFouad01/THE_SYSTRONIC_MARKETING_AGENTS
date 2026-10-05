# CRM UI/UX Audit vs Approved Prototype (2026-10-05)

Auditor: CREATIVE_AG. Branch feat/crm-mvp-ui @ 2fdf2d8. Skills: SK-030 (method), 026 (RTL), 022 (grids), 023 (master-detail), 028 (responsive), 004 (hierarchy). Functional/scale issues are in DEV_REVIEW.md and not repeated here.
Screens inspected (actually opened): en-light-1440 leads list/detail/bulk/filters/new-lead, deal detail, pipeline, tasks detail, reporting, contacts detail; ar-light-1440 lead detail; ar-dark-1440 leads; en-light-375 leads list/detail. Prototype: PROTO-en-light-1440 leads+detail+deals, PROTO-ar-light-1440 leads, PROTO-en-light-375 leads.
NOT opened (captured, in shots/, not reviewed): dashboard, tasks/reporting/pipeline in AR and 375, merge dialog, workspace menu, Ctrl+K, 404, dark EN, connect gate/error, validation states. Findings there are unverified.
Setup: seed = 64 leads/contacts (AR+EN), 28 deals, 34 tasks via API on port 4318. Shots: audits/2026-10-05/shots/{lang}-{theme}-{width}__NN-name.png (app) and PROTO-*.png (prototype). Re-run: `COMBOS=ar-light-1440 npx playwright test -c audits/2026-10-05/playwright.config.ts`.
Caveat: the prototype covers only Leads/Contacts/Deals; Pipeline/Tasks/Reporting have no visual target, so they are scored against the shared patterns (UX_RULES, grid/detail contracts) only. Token names below are by role; DEV must map them to DESIGN_TOKENS.md names (I did not open that file).

## Verdict
Root cause of "far below approved": the shell and grid were rebuilt as generic form-and-table UI. The approved record-first design (KPI strip, two-line identity cells, stage chips, read-first summary card, numbered pagination, relative times, Arabic-Indic polish) was not carried over. Visible dev leftovers (raw UUIDs, "Synthetic manager", "Not in MVP", "Signed in as 8411c8f0", "Version 0") and an Arabic bidi/number layer that garbles dates and counts make it feel unfinished.

## Scorecard (1-5 vs prototype; 5 = matches)
| Screen | EN-LTR 1440 | AR-RTL 1440 | 375 | Main reason |
|---|---|---|---|---|
| Shell / nav | 2 | 2 | 2 | no breadcrumb, raw ID, Not-in-MVP clutter, truncated bottom nav |
| Leads list | 2 | 2 | 1 | no stage chips/identity cells/KPI, native selects, table clips at 375 |
| Lead detail | 2 | 2 | 1 | form instead of summary card; empty state; invisible on phone |
| Contacts | 2 | n/r | n/r | no header action, ID hash column, detail = form |
| Deals + deal detail | 1 | n/r | n/r | proto has full-page record with stage stepper; app has cramped form panel |
| Pipeline | 2 | n/r | n/r | 3 narrow columns, tiny cards, wrong default pipeline, no target |
| Tasks | 2 | n/r | n/r | wrapped cells, 3-line rows, timestamps noisy |
| Reporting | 2 | n/r | n/r | unstyled prose, oversized inputs, orphan detail panel |
| Dialogs | 2 | n/r | n/r | no scrim/elevation, stacked native controls |
| Dashboard | n/r | n/r | n/r | placeholder; not reviewed |
n/r = not reviewed.

## Findings
Severity: BLOCKER = task fails or visibly broken; MAJOR = clearly below approved; MINOR = polish. File shorthand: E=en-light-1440, A=ar-light-1440, M=en-light-375, P=PROTO. Names: E-10 = en-light-1440__10-leads-list.png.

| ID | Sev | Screen | Shot | Evidence | Fix spec | Skill |
|---|---|---|---|---|---|---|
| UX-01 | BLOCKER | AR all grids | A-11 | Dates render as "p ٢:٠٣ ,٢٠٢٦/١٠/٥" (reversed, mixed digits); counts "١٤ من ١٠–١"; "٧ من ١ الصفحة" | Format all dates/counts with Intl.DateTimeFormat/NumberFormat(locale) into ONE string, wrap each in `<bdi>`; never concatenate number+text pieces with raw punctuation; page text as one i18n message with placeholders `{from}-{to} من {total}`, `الصفحة {n} من {m}`. Use relative time for <7d ("منذ 12 دقيقة") else date-only | 026 |
| UX-02 | BLOCKER | Leads/Tasks 375 | M-10, M-11 | Table cut at right edge (Status/Owner unreachable); selecting a lead shows no change on screen (detail panel is below the fold) | Below 768px: transform rows to cards (title, contact, status chip, owner/date in meta line) or keep table with sticky first col + explicit scroll affordance. Record open at <1024px = full-screen sheet/drawer (slide from inline-end) with back button and focus return; never an off-screen sibling | 028, 023 |
| UX-03 | BLOCKER | Deals | E-31 | Deal detail is a form (Deal title, Value "296900" raw, Currency ISO free text, Owner select) in a 340px panel that overflows 900px; P-20 target is a full record page (title, stage stepper, KPI cards, Mark lost/won, tabs Overview/Activity/Tasks) | Build Deal record page per prototype DealView: header (eyebrow DEAL, title h1, subtitle), actions Mark lost (danger-subtle) / Mark won (success), stage stepper (done=success-subtle with check, current=info outline), 4 stat cards (value, probability, expected close, owner), tabs. Edit fields behind "Edit" / inline popovers, not a permanent form. Value: formatted money input; currency = select | 023, 004 |
| UX-04 | MAJOR | Shell | E-10, A-11 | "Signed in as 8411c8f0" (raw id); no breadcrumb; global search bar occupies top bar; Not-in-MVP rows (Email/Call/Import) shown with pills | Top bar = breadcrumb "CRM > Leads" (start) + workspace menu (end), as P. Replace actor with avatar initials + name + role at sidebar bottom (display name from API, never id). Remove fake affordances (UX_RULES #8): hide Email/Call/Import nav entries; Import button disabled -> remove. Keep search only if wired | 004, 030 |
| UX-05 | MAJOR | Grid | E-10 | Rows are one-line text; P shows two-line identity (name bold + "company . LD-1042" caption 11px text-3), stage chips, score colored, relative activity | Lead column: name (600) + caption (company . code) ; Stage/status as Chip with semantic tint (Qualified=success-subtle, Proposal=warning-subtle, Open=info-subtle, Lost=danger-subtle); drop "Version" column everywhere (E-30 shows Version 0..3); show created as relative | 022, 004 |
| UX-06 | MAJOR | Grid | E-10 | Every header shows a sort glyph; P only shows arrow on the active sort | Show sort arrow only on active column (hover reveals ghost); header 11px uppercase text-3, 600 weight | 022 |
| UX-07 | MAJOR | Grid toolbar | E-10, E-21 | "All / Save view" group has a heavy dark grey rectangle border (looks like stuck focus ring) and breaks the row height; Filters/Columns/Compact are three equal outline buttons | Saved-views control = borderless segmented tabs + "Save view" ghost button, same 36px height as search; remove outline unless `:focus-visible`. Selected view = pill fill only (UX_RULES #4 focus vs selected) | 022 |
| UX-08 | MAJOR | Grid footer | E-10 | "Rows per page" label above a 40px native select; "Previous page / Next page" text buttons + "Page 1 of 7" | One footer row: "1-10 of 64" (start), Rows [10v] compact select, numbered pager `‹ 1 2 3 ›` (current = primary-subtle) at end. Compact select 32px | 022 |
| UX-09 | MAJOR | Leads | E-10 vs P-01 | No KPI strip, no page subtitle, header + actions tight; P has 4 KPI cards (Open, Qualified, Pipeline value, Avg response) and subtitle | Add subtitle (text-2, 14px) and KPI row (4 cards, gap 12) only if data exists; otherwise at least subtitle. Do not use magenta/navy filled cards as default (UX_RULES #5): P's filled cards are the target but keep them to max 2 | 004 |
| UX-10 | MAJOR | Master-detail | E-10, E-11 | Empty "Lead details - Select a lead" card wastes 340px when nothing is selected; selected detail is a form | Auto-select first row on load (as P) or collapse panel until selection. Detail = read-first summary card (name, chip, Email/Call/Open contact/Convert to deal actions, 2-col fact grid, activity); edit in a drawer/popover. Selected row = primary-subtle fill + inline-start 3px bar is fine; keyboard focus = separate 2px ring | 023 |
| UX-11 | MAJOR | Detail forms | E-11, E-51 | Save/Discard buttons permanently shown disabled; Lead ID raw UUID wraps; "Version 0"; "Source evidence referral" | Show Save/Discard only when dirty (sticky footer of panel). Remove Version and UUID from the visible layer (move to "Details" disclosure with copy button). Translate/humanize source values (manual -> "Manual entry", referral -> "Referral") | 023, 030 |
| UX-12 | MAJOR | AR content | A-11 | Seed values "Synthetic manager", "manual", "referral" untranslated in AR; mixed Latin/Arabic titles ("استفسار مطبخ Alex Carter 60") with no isolation | Map enum/source labels via i18n; wrap user-entered names in `<bdi>`; for tables apply `unicode-bidi: plaintext` to text cells; keep phone/email/ID in `dir=ltr` + `text-align:start` | 026 |
| UX-13 | MAJOR | Typography AR | A-11, E-10 | Arabic glyph size reads ~2px smaller and lighter than Latin in same row (E-10 col 1 mixed rows); table body 13px | Arabic font stack Cairo/IBM Plex Sans Arabic at +1px size and line-height 1.6 via `:lang(ar)` token; equalise x-height; row min-height 48px in comfortable density | 026, 004 |
| UX-14 | MAJOR | Dialogs | E-15 | New lead dialog has no scrim, hairline shadow, grey page still interactive-looking; 7 stacked full-width fields; Source evidence textarea required but sounds technical | Scrim rgba(overlay, 0.45), elevation-3, radius 12, max-w 480, 24px padding; 2-col grid for Phone/Email on >=640px; relabel "Source evidence" -> "Where did this lead come from?" (AR: "من أين جاء هذا العميل؟"); footer buttons end-aligned, primary last (RTL mirrored) | 023, 030 |
| UX-15 | MAJOR | Native controls | E-11, E-13 | Native `<select>` with OS chevron in filters/forms (40px, mismatched radius), native date input in tasks | Replace with the shared Select/Popover component (32/36px, token border, chevron at inline-end), shared DatePicker; Rows-per-page uses same | 022 |
| UX-16 | MAJOR | Pipeline | E-40 | 3 columns of fixed ~270px leave 40% blank; default pipeline is the empty "M0 pipeline" (1 deal) rather than the populated one; card shows "Deal / Synthetic A / 0 EGP / Synthetic manager" unstyled; pipeline selector floats top-right out of header | Columns flex to fill (min 260, max 1fr) with horizontal scroll beyond 5; header with title + pipeline select inline + "New deal"; card: title 600, contact caption, value right-aligned bold, owner avatar; remember last-used pipeline, default to the one with most open deals; column header total value in text-2 | 004, 028 |
| UX-17 | MAJOR | Tasks | E-51 | Task/Owner/Source cells wrap to 3 lines ("Call back / Alex / Carter"), due shows full timestamp + relative + Overdue chip; Source "Not recorded" on all rows | Set col widths (Task flex, Related 160, Due 140, Owner 120 nowrap with ellipsis+title); Due = "Sep 23" + chip "Overdue 12d"; hide Source column by default; 48px rows; link style: no underline, text-primary on hover | 022 |
| UX-18 | MAJOR | Reporting | E-60 | Attribution/Lookback inputs stretch full width (one 440px); note paragraphs run on without spacing (under KPI cards) ; "Campaign detail" empty card beside empty table | Constrain controls (select 240, number 96); move provenance text into a collapsed "About this calculation" 12px text-3 block with 16px margin; hide detail panel until a row exists; KPI card min-height equal, label 12px, value 24px | 004 |
| UX-19 | MAJOR | Contacts | E-21 | Heading y differs from Leads (101 vs 111) because no action row; no "New contact" button; ID column shows hash "16314a1f"; detail has "Add identifier" form always open | Fixed page-header region (title, subtitle, actions at end) on every screen so h1 baseline is identical; add New contact; replace ID col with Phone/Email columns; identifier add behind "+ Add" popover | 004, 022 |
| UX-20 | MAJOR | Bulk actions | E-12 | Bar shows only "Assign to me / Clear selection"; layout jump (+60px) pushes table; no count of destructive/other actions | Fixed-height bar overlays toolbar slot (no push): "3 selected" + Assign owner, Change status, Add task, Delete (confirm) + Clear. Header checkbox tri-state already OK | 022 |
| UX-21 | MINOR | Dark | ar-dark-1440 shots | Primary button turns cyan (E: navy) and Save-view box white outline too strong | Use dark primary token pair from DESIGN_TOKENS; ensure the same hover/focus tokens; outline fix per UX-07 | 004 |
| UX-22 | MINOR | RTL icons | A-11 | Chevron/arrows direction not verified; search/filter icons correct | Mirror only directional icons (back, forward, chevron, arrow-right on Convert to deal); keep search/filter/check unmirrored | 026 |
| UX-23 | MINOR | Empty/loading | E-60 | Empty state has icon+reason+next step (good) but no action button | Add primary CTA ("Publish calculation") in empty state; loading = skeleton rows (6) not blank | 022, 030 |
| UX-24 | MINOR | Mobile nav | M-10 | Bottom bar shows 7 items with truncated labels (Dash.., Conta.., My ta.., Repor..); P shows 3 | Max 5 tabs (Leads, Contacts, Deals, Tasks, More); More opens sheet with remainder. Labels 11px no truncation | 028 |
| UX-25 | MINOR | Mobile header | M-10 | Search field + "Signed in as" take 120px before the title | Compact header 56px: breadcrumb/title + menu; search becomes icon -> full-width overlay | 028 |
| UX-26 | MINOR | A11y (flag only) | E-10 | Row selection by clicking a 10px corner required by capture; row click target unclear; focus vs selected states not distinguishable in E-11 | Whole row clickable (not checkbox cell) with `aria-selected`; focus ring 2px offset -2 | 023 |

## Cross-cutting design-system defects (fix once)
1. Page header: no shared PageHeader (title/subtitle/actions/KPI slot) -> h1 position differs per screen (UX-04, 09, 19).
2. Grid component: needs identity cell, Chip cell, relative-time cell, numbered Pager, active-only sort icon, row density tokens (UX-05..08, 17).
3. Select/DatePicker/Popover primitives replace native controls (UX-15).
4. Locale layer: one `formatDate/formatNumber/formatCount/formatRelative` + `<Bdi>` wrapper + enum label maps; stop interpolating strings (UX-01, 12).
5. Record surface: shared RecordPanel (read-first, edit-on-demand, dirty-only footer) + responsive Sheet <1024px (UX-02, 10, 11).
6. Dialog: scrim/elevation/size tokens (UX-14).
7. Chip/status component with semantic tokens (success/warning/danger/info) per UX_RULES #6.
8. Remove dev/technical leakage (ids, Version, Synthetic, Not recorded) via a "display layer" test: no UUID or 8-hex string in visible text.

## Prioritized fix batches for DEV_AG
Batch 1 (shared; do first, ~every screen improves)
- Locale/bidi layer (UX-01, 12, 13), PageHeader + Shell (UX-04, 24, 25), Grid parts + Pager + toolbar fix (UX-05..08, 17, 20), Select/DatePicker (UX-15), Chip, Dialog (UX-14), RecordPanel + mobile Sheet (UX-02, 10, 11), display-layer cleanup (UX-11).
Batch 2 (per screen)
1. Deals record page (UX-03) - highest visual gap.
2. Leads: KPI strip/subtitle, auto-select (UX-09, 10).
3. Contacts (UX-19), Tasks (UX-17), Pipeline (UX-16), Reporting (UX-18).
4. Dark + RTL icon pass (UX-21, 22), empty/loading (UX-23), a11y flags (UX-26).
Gate: re-run the capture spec, compare against PROTO-* shots; no UUID/hex text; AR dates/counts correct; 375 leads usable without horizontal scroll.

## Tasks (SK-030 heuristic walk)
Lead intake: completes but form-heavy (UX-14). Find contact: search works, results OK. Move deal: stage menu reachable, no stepper (UX-03). Create task: not visually reviewed. Inspect journey: Contacts>Journey tab not reviewed. View report: reachable, sparse (UX-18). No task hard-failed on desktop; 375 lead inspection fails (UX-02).

## Not reviewed / follow-up
Dashboard, AR/375 for pipeline-tasks-reporting, merge dialog, menus, Ctrl+K, 404, connect gate, validation messaging, Arabic copy wording beyond what is above, keyboard walk. Screenshots exist in shots/ for these.

## Re-audit r2 (after batch 1, e301f63)
Auditor: CREATIVE_AG. Skills: SK-030 (retest), 026 (RTL), 010 (render inspection). Shots: shots-r2/{en-light-1440,ar-light-1440,en-light-375,ar-dark-1440}__NN-name.png (script cap2.spec.ts + pw2.config.ts; API on 4318, stopped after). Viewed: EN leads list/detail/edit/bulk/filters/new-lead, deal+list, pipeline, tasks+new-task, reporting, contacts, dashboard; AR lead detail/validation/tasks/reporting/pipeline; AR-dark leads; 375 leads list/record sheet/More sheet/tasks/pipeline. NOT viewed (captured only): AR-dark other screens, 375 AR, merge dialog, Ctrl+K, 404, connect gate. Overall: big step up; leads now close to prototype, remaining gap is deals/reporting/tasks polish and mixed-bidi truncation.

### Batch-1 finding status
| ID | Status | Evidence / residue |
|---|---|---|
| UX-01 | PARTIAL | AR counts "١–١٠ من ٦٤" and pager numerals correct; dates in one string. Residue: Latin comma "٢٠٢٦ ,٥ أكتوبر" (use ar-EG "،"), AR task Due column clips ("٢٣ سبتمبر" cut) and wraps in panel (AR-50) |
| UX-02 | CLOSED | 375 leads = cards; record = full-screen sheet with Back (M-11); More sheet works (M-73) |
| UX-04 | CLOSED | breadcrumb, avatar+name+role in sidebar, Email/Call/Import gone, no raw id |
| UX-05 | PARTIAL | identity cells (name+caption), status chips, relative "now", Version gone. Residue: Lead title truncates to "Kitchen inquiry ..." so rows are indistinguishable (UX-R2-01); Arabic text in EN grid visibly smaller than Latin |
| UX-06 | CLOSED | sort mark only on active column |
| UX-07 | CLOSED | borderless "All" pill + Save view; focus ring gone. Nit: lone "All" pill reads like a tag |
| UX-08 | CLOSED | "1-10 of 64  Rows [10v]  numbered pager", current = tinted |
| UX-10 | CLOSED (leads) | first row auto-selected, read-first card with fact grid; deals/tasks/contacts panels still summary cards, not full record (see UX-03) |
| UX-11 | PARTIAL | Save/Discard only in edit; UUID/Version hidden under Details. Residue: "Source evidence: referral/instagram" raw lower-case; task "Source: Not recorded"; Edit mode puts "Cancel" in the action row (no Save visible until dirty - acceptable) and Esc does not leave edit |
| UX-12 | PARTIAL | source/status/owner labels translated; names isolated. Residue: seed text "Synthetic manager" (fixture, not code); stage names New/Qualified/Proposal untranslated in AR pipeline (data); ellipsis in mixed-bidi cells shows the wrong end ("...ry Lucas Meyer 58") (UX-R2-02) |
| UX-13 | PARTIAL | Cairo reads balanced in AR; rows 48px. Residue: Arabic strings inside EN grid ~2px smaller (E-10 row 1) |
| UX-14 | CLOSED | scrim, 480 width, Phone/Email 2-col, "Where did this lead come from?" + AR copy, validation inline in AR (AR-16) |
| UX-15 | PARTIAL | Select popover everywhere. DatePicker NOT applied: New task dialog still native "mm/dd/yyyy --:-- --" (E-52) |
| UX-17 | PARTIAL | Due = "Sep 23" + Overdue chip, rows 48px, source hidden in grid. Residue: Actions "Complete" button clipped at grid edge, Owner "Synthetic man...", Overdue chip crowds Owner on Oct 1/2 rows (UX-R2-03) |
| UX-20 | PARTIAL | fixed-height bar replaces toolbar, no layout jump. Residue: only "Assign to me / Clear selection" (no Change status / Add task / Delete) |
| UX-24 | CLOSED | 5 tabs Leads/Contacts/Deals/My tasks/More, labels untruncated |
| UX-25 | PARTIAL | 56px header with breadcrumb + avatar. Residue: search + Filters/Columns/Density occupy 3 rows (~190px) before first card; collapse into icon row |

### Regressions / new defects
| ID | Sev | Shot | Defect | Fix spec | Skill |
|---|---|---|---|---|---|
| UX-R2-01 | MAJOR | E-10, A-11 | Lead/Task title column ~120px while Owner/Source/Created have slack; all rows read "Kitchen inquiry ..." | Primary column flex 2fr min 280; secondary cols auto; title `-webkit-line-clamp:1` with `title` attr; hide Source before truncating title | 022 |
| UX-R2-02 | MAJOR | A-11, A-50 | In AR UI, Latin/mixed text truncates from the start ("...quiry", "…ll back Alex Carter"); same in 375 cards ("Kitchen inquiry ...لمصري") | `<bdi>` + `unicode-bidi:plaintext; text-align:start; text-overflow:ellipsis` on text cells so clip is at end of the logical string | 026 |
| UX-R2-03 | MAJOR | E-51 | Tasks grid overflows its container: Complete button cut at right, Owner truncated, AR date column clipped | Fix col widths (Task flex, Related 160, Due 150, Owner 120, Status 100, Actions 110 sticky end); drop per-row Complete to icon button | 022 |
| UX-R2-04 | MAJOR | E-03 | Dashboard shows "This screen is built in a later slice. /dashboard" (dev leakage; it is the first nav item) | Hide Dashboard nav until built, or ship minimal KPI page; never show route path | 004, 030 |
| UX-R2-05 | MAJOR | A-40 | AR money bidi: "ج.م." renders as ".ج.م ٢٩٦٫٩٠٠" (period leads); same in AR deal grid | Format with Intl.NumberFormat(locale,{style:currency,currency}) as single string in `<bdi dir=ltr>` or use "ج.م" symbol without period | 026 |
| UX-R2-06 | MINOR | M-50 | 375 task card shows stray "·…" placeholder where Due should be; Complete button on its own row | Render Due as "Sep 23 . Overdue" chip line; remove empty separators | 028 |
| UX-R2-07 | MINOR | A-60 | AR reporting meta line has broken punctuation order (": " and "·" jump); numerals "٠" read as a dot in KPI cards | Split meta into 3 short `<bdi>` lines; render zero as "٠" at larger weight or use Western digits for KPI values | 026 |
| UX-R2-08 | MINOR | E-11b | Edit mode: Cancel sits between Add task and fields; Esc ignored | Put Cancel/Save in sticky panel footer; Esc cancels edit | 023 |

### Still open from batch 1 scope boundary (batch 2, status unchanged)
UX-03 OPEN (Deal = same summary card, no stepper/stat cards/Mark won-lost/page; stage shown as chip + "..." menu). UX-09 OPEN (no subtitle/KPI strip on Leads; Reporting has subtitle). UX-16 PARTIAL (columns now fill, correct default, cards styled; still: Won/Lost clipped off-screen, "Final stage" label on each card, selector floats top-right with stacked label). UX-18 OPEN (inputs full-width, meta prose under KPI, orphan Campaign detail card, "Minor units" label). UX-19 PARTIAL (New contact still missing; ID column gone; identifiers list ok; "Phones and emails" lists only Email). UX-21 PARTIAL (AR-dark leads fine: dark tokens correct, primary cyan on dark acceptable; other dark screens unviewed). UX-22/23/26 not retested.

### Score vs prototype (1-5; was)
| Screen | EN 1440 | AR 1440 | 375 |
|---|---|---|---|
| Shell/nav | 4 (2) | 4 (2) | 4 (2) |
| Leads list | 4 (2) | 3 (2) | 3 (1) |
| Lead detail | 4 (2) | 4 (2) | 4 (1) |
| Contacts | 3 (2) | n/v | n/v |
| Deals + detail | 2 (1) | 2 | n/v |
| Pipeline | 3 (2) | 3 | 3 |
| Tasks | 2 (2) | 2 | 2 |
| Reporting | 2 (2) | 2 | n/v |
| Dialogs | 4 (2) | 4 | n/v |
| Dashboard | 1 | n/v | n/v |

### Confirmed batch 2 order
1. Fix r2 bugs that hit every row: UX-R2-01, 02, 03, 05 (small, shared grid/locale).
2. Deals record page (UX-03) - still the biggest gap; add UX-15 DatePicker in New task.
3. Dashboard decision (UX-R2-04) + Leads subtitle/KPI strip (UX-09).
4. Contacts New contact + phone column (UX-19), Tasks polish (UX-17 rest, R2-06), Pipeline Won/Lost visibility + selector (UX-16).
5. Reporting restyle (UX-18, R2-07), bulk actions breadth (UX-20), mobile toolbar collapse (UX-25).
6. Dark + RTL icon pass, empty/loading, a11y (UX-21/22/23/26), edit-mode footer (R2-08), UX-01 comma fix.
Gate: no 375/AR regression; AR tasks and pipeline re-captured; zero "slice"/route text.
