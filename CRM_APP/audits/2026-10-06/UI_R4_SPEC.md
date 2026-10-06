# UI R4 SPEC - t-sag / CRM (implementable by DEV_AG)

Agent: CREATIVE_AG · Skills: CREATIVE-SK-004 (layout), SK-023 (preview/edit), SK-021 (navigation) · Status: DRAFT, NOT_READY
Authority: user test feedback 2026-10-06 + user decision (panel from the RIGHT in both languages; RTL top priority; EN and AR both first-class). Spec only.
Sources read: tokens/scales.ts+css.ts, Select, RecordPanel, AppShell+shell.css, DataGrid(+css), Dialog (already has `placement="side"`), `*View.tsx` columns, `features/*/*.css`.
Rule for every item: use logical properties (`inline-start/end`, `padding-inline`). EXCEPTION (user decision): slide-in origin is PHYSICAL right in both languages (section C/G). Neither language is a mirror of the other (see I).

## 0. Root causes in code (confirm, then fix)
- Select list width = trigger width (`pos.width = r.width`, Select.tsx) -> narrow chip gives ~40px list -> "Ot he r". (F1)
- Master-detail is a permanent 2nd grid column (`minmax(0,1fr) minmax(280..380px)` in contacts/leads/tasks/reporting css) -> table shrinks. (C)
- `RecordBody` shows only a Cancel bar unless the dirty footer mounts (`footerShown`) -> Save invisible. (D)
- `IdentityCell caption={r.ownerName}` repeats owner under every name while an Owner column exists. (B)
- `.sy-brand` is a `div`; breadcrumb items are plain `li` text. (E)
- `RecordDetails` (ID/Version) always rendered. (B)
- Cyan ring around table: focusable wrapper receives focus on mouse click. (F2)

## A. Layout system
Tokens (scales.ts add spacing 2,20,24,32,40; keep existing). css.ts vars: `--sy-page-max:1440px`; `--sy-gutter` 24px (>=1181) / 16px (721-1180) / 12px (<=720); `--sy-sidebar-w` 228px (76px <=1180, hidden <=720); `--sy-topbar-h:56px` (was 62; one value everywhere); `--sy-control-h:36px`, `--sy-control-h-sm:32px`; `--sy-row-h:44px` (36px compact opt-in).
Frame: `.sy-main{padding:var(--sy-gutter)}`; `.sy-page{max-inline-size:var(--sy-page-max);margin-inline:auto;display:flex;flex-direction:column;gap:16px}`. 12-col grid only Dashboard/Reporting (gap 16; 8 at 375, 4-col). Lists full width.
Spacing use: page gutter 24 · section gap 16 (24 between header block and content) · card padding 16 (12 <=720) · card header->body 12 · form field gap 12 · control gap 8 · icon+label 8 · cell padding-inline 12, block 0 (row-h sets height). New CSS uses only these (legacy 10/14 may stay until touched).
Alignment: controls in one row share height (toolbar 36, chips 32); `align-items:center`, gap 8. Facts: label 12/20 `--sy-text-3` above value 14/22 weight 600 (stacked, no side-by-side baselines). Numbers `text-align:end` + `tabular-nums`. Badges 22px tall.
| Screen | Width | Header | Toolbar | Body | 375 |
|---|---|---|---|---|---|
| Dashboard | max 1440 centred | PageHeader, KPI 4-col gap 16 | none | 12-col cards span 8/4, 6/6, 12; pad 16 | 1 col gap 12, KPIs 2x2 |
| Leads | full | PageHeader + primary "New lead" at inline-end | row1 views tabs; row2 search + filter chips + Columns btn (h36, gap 8) | table 100%, row 44 | search full row, chips scroll-x, card list |
| Contacts | full | same | same | same | same |
| Deals | full | same | + pipeline select (min 160) | table 100% | card list |
| Pipeline | full, horizontal scroll | PageHeader + pipeline select | none | columns 280px, gap 12, sticky col header | columns 85vw, snap-x |
| Tasks | full | PageHeader | tabs + search + chips | table; complete-checkbox cell first | card list |
| Reporting | max 1440 | PageHeader + date range | none | 12-col, card pad 16, chart min-h 240 | 1 col |
Sticky: topbar (56) and grid header row (top:56). Page scrolls (no nested vertical scroll except panel/modals).

## B. Data display order
Column 1 = identity (opens preview); then status/stage; relation; value/date; owner; source/created. Max 6 default columns desktop, 3 at 375 (`mobile` prop). Rest via Columns picker.
| Object | Default columns | Hidden (picker) | Caption under identity |
|---|---|---|---|
| Leads | Lead, Status, Contact, Owner, Source, Created | Updated, Score, Phone, Email | none (never owner) |
| Contacts | Name, Email, Phone, Company, Owner, Source | Created, Updated, Title | none |
| Deals | Deal, Stage, Value, Contact, Owner, Close date | Pipeline, Created | none |
| Tasks | Title, Due, Status, Related, Owner | Source, Created, Priority | none |
Contacts Email/Phone/Company only if the API supplies them; else Name, Owner, Source (no fake columns). Owner = avatar(20)+name chip, only in Owner column. Empty = "-" in `--sy-text-3`. Dates: relative <7d else short; full date in `title`.
Preview facts order: status/stage chip + action row -> key facts (2-col, 5-8: owner, source, relation, value/due, created) -> notes/activity/tasks -> danger zone (merge/delete) last.
Technical details (ID, Version, raw timestamps): hidden by default. Only a closed `<details>` "Technical details" at the bottom (copy-ID button), rendered for admin role only. Version still sent in requests, not shown.

## C. Preview panel (HubSpot-like) - USER DECISION: from the RIGHT in EN and AR
Replace the permanent split with a slide-over (new `Dialog placement="preview"`, reuse side machinery).
- Position/motion: panel is docked to the PHYSICAL right edge (`inset-inline` NOT used; `right:0`) in both languages and slides `translateX(24px)->0` + fade from the right. Never mirrored by `[dir=rtl]`. Panel CONTENT inside follows the language direction (text, header icon order, facts) - only the dock side is fixed.
- AR consequences (DEV must handle, CREATIVE to review): in AR the sidebar and identity column are also on the right, so the panel overlays the sidebar zone and the first column. Mitigations: panel z-index above sidebar (overlay, closes on outside click/Esc); selected row keeps its inline-start bar and is also `scrollIntoView`; at 1440 table content width is unchanged. If the user finds the covered identity column a problem in AR, the fallback is a 400px `padding-inline-start` reserve on the table scroller while open (NOT default).
- Width `clamp(360px,32vw,480px)`; <=720px full 100vw sheet from the right (same direction in both languages; back button at header inline-start, chevron points left in EN, right in AR). Header 56, body scrolls, footer sticky.
- Overlay, not push: table stays 100% wide. Desktop no dark scrim (transparent, outside click closes); shadow `--sy-shadow-menu`, 1px border on the left edge. 375: scrim.
- Open: row click or Enter/Space on focused row (name cell is a real link/button; ctrl/middle-click opens full record). Opening another row swaps content in place (120ms body crossfade). List scroll/filter/sort/selection untouched.
- Focus: on open focus the panel heading (tabindex -1); `role="dialog"`; `aria-modal=false` desktop (table stays usable), trap Tab + modal at <=720. Esc closes (while editing: first Esc cancels edit, dirty -> confirm). Close returns focus to the originating row.
- Header actions (32px icon buttons, localised aria-labels + tooltips): Prev (up), Next (down), Open full record, Close. Prev/Next walk the loaded, filtered, sorted rows; `J`/`K` or Alt+Up/Down in panel; disabled at ends; scroll the row into view (`block:nearest`).
- "Open full record" routes to the detail route; Back restores list scroll/filters, preview closed. Open state in URL `?preview=<id>` (refresh/deep link restore).
- Delete `RecordEmpty` placeholder and `autoOpenFirst`.

## D. Edit model
Sticky footer (56px, border-top): `[Save primary, disabled until dirty] [Cancel ghost]`, always rendered while editing (remove `footerShown` + `sy-record__cancelbar`). Disabled Save: `aria-disabled` + title "No changes". Pending: inline spinner, width locked. Success -> leave edit + toast "Saved". Error -> stay, inline field errors, focus first invalid. Ctrl/Cmd+Enter saves; Esc cancels (confirm if dirty).
Inline edit (phase 2): click value in preview facts -> control in place (owner, status/stage, due, source); Enter/blur commits optimistically, Esc reverts; pencil on hover/focus (always visible at 375). Full Edit button remains for multi-field forms.

## E. Navigation
- Sidebar brand block -> `<a href="/dashboard">` (aria-label "THE SYSTRONIC - Dashboard"), same plainClick/`navigate()` as nav links; collapsed 76px = mark only, still a link; 375 topbar brand mark links too. Disconnected brand not linked.
- Breadcrumb: `CRM` -> /dashboard; current page plain text `aria-current="page"`. Record route: `CRM > Leads > <name>` with Leads linked (returns to list with filters via history/saved view). Separator chevron flips under RTL. Name truncated at 24ch (end, see I).
- Active nav: bg `--sy-active`, 3px inline-start bar, `aria-current`; parent stays active on record routes.
- Keyboard: skip link exists; Tab: sidebar -> topbar -> main; optional `g` then d/l/c/o/t/r go-to (batch 6).
- Global search: not built (no backend). Reserve centred topbar slot (max 480); ship only with a real endpoint. No placeholder input.

## F. Popovers and focus
F1 Select/popover: `min-inline-size:max(var(--sy-trigger-w),160px)`, `inline-size:max-content`, `max-inline-size:min(360px,100vw - 16px)`; options `white-space:nowrap;overflow:hidden;text-overflow:ellipsis;overflow-wrap:normal` (never per-char wrap); option min-h 36 (44 <=720); `max-block-size:min(320px,visual-viewport - 16px)` + `overflow-y:auto`. Align to trigger inline-start (so right edge in AR), flip above if no room, clamp horizontally with 8px margin. Do not set width=trigger (min only). Chips: min-width 120, value ellipsis. Test: "Other" with 60px trigger renders on one line in EN and AR.
F2 Focus: grid scroller/table not mouse-focusable (`tabindex` removed or -1 + `:focus{outline:none}`); ring only via `:focus-visible` on rows (offset -2px) and cells/buttons. Never a wrapper outline after click.

## G. Motion
Library: CSS-only for batches 1-4 (0 KB: transitions, `@starting-style`, transform/opacity). Add **`motion`** (ex framer-motion, `motion/react` v12, React 19 compatible, ~4.6 KB with `LazyMotion`+`domAnimation`) only in batch 4 for `AnimatePresence`/`layout` (row removal, toast exit, list reorder).
Tokens: `--sy-dur-instant:80ms` · `--sy-dur-fast:120ms` · `--sy-dur-base:200ms` · `--sy-dur-slow:300ms` · `--sy-ease-out:cubic-bezier(.2,.8,.2,1)` (enter) · `--sy-ease-in:cubic-bezier(.4,0,1,1)` (exit, 70% duration) · `--sy-ease-std:cubic-bezier(.4,0,.2,1)`.
Direction per language (explicit):
| Element | EN | AR |
|---|---|---|
| Preview panel / 375 side sheet | from RIGHT, X +24px->0, 200 out / 150 in | from RIGHT (same), identical |
| Bottom sheet (More, 375) | from bottom 300 | same |
| Toast | from block-end, Y 16px, 200; stack at inline-end | from block-end; stack at inline-end (LEFT in AR, because AR text origin is right the toast mirrors; confirm in re-audit) |
| Popover/Select | Y 4px+fade 120, anchored to trigger | same, anchored to trigger inline-start (right) |
| Dialog | fade+scale .98->1, 200 | same |
| Tab/view indicator, chevrons, progress bar | start->end = left->right | start->end = right->left (use logical props/`scaleX(-1)`) |
| Horizontal list/kanban entry, carousel, skeleton shimmer | travels start->end (left->right) | travels right->left |
Only animate `transform`/`opacity`. Reduced motion: durations -> 1ms except opacity fades <=120ms; no translate/scale; shimmer -> opacity pulse; spinner kept.

## H. AJAX feel
Shell never unmounts; no full-page spinners after first load. First load = 6 skeleton rows with real column widths; route change keeps old content (stale-while-revalidate), skeleton only after 150ms.
| Interaction | Rule |
|---|---|
| Inline edit / status / owner / stage / task complete | Optimistic: update cache+row now, request in background, 600ms `--sy-success` flash; fail -> revert + toast with Retry |
| Form Save | Spinner on button then in-place row update (no list reload) |
| Create | Insert row at top of the view, highlight 1.5s, toast with "Open"; refetch reconciles ids |
| Delete/merge | Row collapses 150ms with Undo toast 6s; irreversible merge keeps confirm dialog |
| Filter/search/sort | Search debounce 250ms; keep previous rows at 60% opacity + 2px top progress bar; never blank the table |
| Load more | Footer inline spinner, rows append, no scroll jump |
| Background refresh | On focus + every 60s while visible: silent refetch, merge by id, never overwrite a row in edit; "Updated just now" in toolbar |
| Preview open | Header+facts instantly from row data; extras (notes/activity) as skeleton blocks |
| Failure | Inline grid banner, data retained, per-row retry |
| Buttons | pending = spinner replaces icon, width locked, `aria-busy`, double-submit blocked |
Live region `aria-live="polite"` for "Saved", "Deleted - Undo".

## I. Bidi / RTL robustness (top priority; AR and EN both first-class)
Principles: (1) Document `dir`/`lang` follow the UI language; EN is LTR with Latin metrics, AR is RTL with Arabic metrics (existing sizeAr +1px, line 1.6) - not a flipped EN. (2) USER CONTENT direction is independent of UI direction: decide per field/per value from its first strong character. (3) Never concatenate Arabic and Latin into one string in code; use ICU placeholders wrapped in isolates.
Rules per element type:
| Element | Rule |
|---|---|
| `<input type=text>`, `<textarea>` (names, notes, titles, search) | `dir="auto"` (value direction from first strong char; empty field uses UI dir via placeholder alignment). `text-align:start` (NOT left/right) so alignment follows the resolved dir. `unicode-bidi:plaintext` on the element for textarea. Caret and typing follow the paragraph dir: typing an English word inside an Arabic sentence keeps the Arabic paragraph RTL; each new line/paragraph in textarea resolves independently (plaintext). Placeholder uses UI lang/dir. |
| email, url, phone, number, ID, code, date, currency inputs | Explicit `dir="ltr"` + `text-align:start` in EN; in AR `dir="ltr"` with `text-align:end` so they sit at the right edge like other AR fields but digits/@/+ never reorder. `inputmode` set. Phone keeps `+20 100 123 4567` order (no mirrored plus/parens). |
| Select/option text, chips, badges | `<bdi>` around record-supplied text (never around static UI labels). Chip = `display:inline-flex;gap:4px`, label span `unicode-bidi:isolate;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`. |
| Grid cells (text) | Cell content wrapped `<bdi dir="auto">`; cell `text-align:start`. Numeric/currency/date columns: `dir="ltr"` island, `text-align:end`, `tabular-nums`. Email/phone cells: `<bdi dir="ltr">`, left edge of the island aligned to the cell inline-start. |
| Titles (record title, page title, dialog title, breadcrumb name) | `<bdi dir="auto">` inside the heading; heading `text-align:start`; truncation by `text-overflow:ellipsis` which cuts at the END of the resolved direction (right end for RTL value, so the beginning of the name stays visible). |
| Toasts, dialogs, messages built with record data | Template via ICU placeholders; each placeholder `<bdi>`; container dir = UI dir. Example AR: "تم حفظ <bdi>Ahmed Corp</bdi> بنجاح". Never string-concatenate. |
| Mixed with numbers/currency/units | Digits stay LTR islands (`<bdi dir="ltr">`); Arabic-Indic vs Latin digits follow the locale setting consistently (default Latin 0-9 in data, AR UI chrome may use Arabic text but numbers in tables stay Latin for scan/sort); currency "EGP 12,500" island not split by the sentence. |
| Punctuation | Trailing punctuation (. ! ? : ,) belongs to the sentence dir; when a sentence ends with an English word in AR text wrap the word in `<bdi>` so the full stop stays at the LEFT end of the Arabic line (visually after the word). Parentheses and quotes wrap the isolated run, not outside it. Use Arabic comma (،) and question mark (؟) only in static AR UI copy, never auto-replace user content. |
| Truncation / wrap | `overflow-wrap:anywhere` only in titles/free text, never in options/chips; ellipsis at end of resolved dir; multi-line clamp via `-webkit-line-clamp` on the `<bdi>` parent. |
| Icons | Directional icons (chevron, back, arrow, forward) flip in AR; non-directional (search, check, plus, trash, clock, play-media) never flip. Layout order of toolbars and tables follows dir; the panel dock side is the one explicit physical exception (C). |
| Search box, filters | Search input `dir="auto"`; chip values `<bdi>`; count badge digits LTR. |
| Export/copy | Copy text keeps original string, no embedded control chars added to stored data (isolates are DOM only, never saved). |
Test matrix (screenshot AR and EN, light, at 1440 and 375, in: input, textarea (3 lines), grid cell, chip, record title, breadcrumb, toast, dialog title). Strings:
1. `اجتماع مع Ahmed Corp غداً` (AR, English name in middle)
2. `عميل VIP - شركة Orange Egypt` (AR with hyphen + EN)
3. `Meeting with أحمد الشريف tomorrow` (EN with Arabic name)
4. `احجز Demo يوم 12/10/2026 الساعة 3:30 PM` (date/time islands)
5. `تواصل على +20 100 123 4567 أو ahmed@corp.com` (phone + email in AR)
6. `سعر العرض EGP 12,500.00 شامل الضريبة` (currency)
7. `(Q4) خطة المبيعات - "Phase 2"؟` (brackets, quotes, AR question mark)
8. `ABC-123 / رقم 45` (code with slash)
9. A 90-char single-token Arabic name and a 90-char EN name (truncation end, no per-char wrap)
10. Empty field then typing AR first / EN first (caret + alignment switch live); then delete everything (returns to UI dir)
Pass criteria: no reordered digits/emails/phones; punctuation on the correct visual end; alignment follows first strong char; ellipsis at the correct end; caret never jumps; chips/toast/dialog identical in both locales; AR looks native (not a mirrored EN screenshot) and EN has no RTL artifacts (no flipped icons, no `text-align:right` leftovers). Add unit test: grep CSS for `left:|right:|margin-left|padding-left|text-align:\s*(left|right)` outside the explicit allowlist (panel dock, scrollbars).

## Column chooser / filters (property-ready)
Toolbar inline-start->end: Views | Search | filter chips (max 3, rest "More filters") | spacer | Columns | Density. Chooser = popover (w 280, max-h 360): search, checkbox list with drag handle (order persisted in saved view), Reset. One `ColumnDef[]` (`id,label,type,value,filter?,defaultVisible,width`) so a property registry can supply defs later (type -> cell renderer + filter control: text/enum/date/number/user). Saved views store ids. No property admin UI now.

## Batches for DEV_AG
1. (P0) F1 Select sizing+test; F2 focus; brand+breadcrumb links (E); Save always visible (D); remove owner caption, gate technical details (B); page frame tokens (A); Bidi quick wins: `dir="auto"` inputs/textareas, `<bdi>` in cells/chips/titles/toasts (I).
2. (P0) Preview slide-over from the right (C) with focus/Esc/URL/prev-next/375 sheet; delete RecordEmpty/autoOpenFirst; update tests.
3. (P1) Column defaults/order (B), toolbar + Columns chooser, row-h 44, per-screen table (A); bidi test matrix screenshots + CSS lint (I).
4. (P1) Motion tokens, CSS transitions, per-language directions, reduced motion (G); optional `motion` lib.
5. (P1) AJAX feel (H); inline edit (D).
6. (P2) Shortcuts, global search when backend exists.

## Acceptance for CREATIVE re-audit (EN+AR, light+dark, 1440+375)
1. Source filter list single-line options, >=160px, aligned to trigger inline-start, no wrap.
2. Table width unchanged with preview open; panel overlays and docks RIGHT in EN and AR, slides in from the right in both.
3. Preview focus entry/return, Esc, Prev/Next, Open full record, `?preview=` restore, 375 full-screen sheet.
4. Edit mode always shows Save (disabled until dirty) + Cancel.
5. Logo and CRM crumb go to Dashboard; list crumb on a record returns to the filtered list.
6. No owner caption; no ID/Version for non-admin; admin sees closed "Technical details".
7. No cyan outline after mouse click; Tab shows row ring.
8. Spacing only token values; gutters 24/16/12; topbar 56; toolbar controls 36.
9. Reduced motion respected; optimistic failure reverts with toast; no full-screen spinner after first load.
10. Section I matrix passes in AR and EN screenshots; EN and AR each judged on their own (neither a degraded mirror).
