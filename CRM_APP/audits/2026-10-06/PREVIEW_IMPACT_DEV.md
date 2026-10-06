# PREVIEW_IMPACT_DEV - UI R4 batch 2 item C (preview slide-over): impact assessment

Agent DEV_AG (TSST BUILD) · Skills (UNVALIDATED): TSST-DEV-SK-003 (boundaries/shared contracts), SK-002 (options), SK-011 (test strategy) · READ-ONLY: no source/test/config edited, nothing run (Playwright needs the API + DB; counts below are from static reading) · Branch feat/crm-mvp-ui @ 4ad35c3 · NOT_READY.
All paths relative to `C:\Work\tsst-crm-mvp\CRM_APP\app\src` unless noted.

## 0. Headline findings (things the spec does not know yet)
1. `react-aria-components` is NOT a dependency (no `app/package.json`; root `package.json` has only `pg` + dev tools; no tailwind). ADR-002 accepted RAC+Tailwind, but the RAC spec makes the stack install "step 0" and Dialog "step 6". RAC for this item = new deps + Tailwind pipeline -> needs user approval and touches the whole look.
2. Every overlay is rendered inline with `position: fixed` (no `createPortal` anywhere: grep). Select list (`ui/primitives/Select.tsx:95-107`, `select.css:60-67`), DatePicker (`DatePicker.tsx:371`), nested Dialogs (`AddTaskButton`) compute viewport coordinates. Any ancestor with `transform`/`filter`/`backdrop-filter`/`will-change` (the slide-in animation, or the planned glass blur) re-bases them and mispositions/clips them. Top technical risk.
3. "Open full record" has no target for Leads/Contacts/Tasks: `router.ts:5-15` ROUTES is flat (no `:id`), and `src/static.ts:8+` hard-codes the SPA routes server-side. Only Deals has a record page (`DealsView.tsx` `page` mode).
4. The existing URL param is `?select=` (read once at mount by `parseSelect`, `features/deals/model.ts:246`; never written by Leads/Contacts/Tasks) with 9 producers; the spec says `?preview=`. And Leads/Contacts/Tasks do not fetch a record that is not in the loaded rows (only Deals does, `DealsView.tsx:293-305`), so deep-link restore does not work today for 3 of 4 screens.
5. Contacts merge dialog is mounted only while `mergeWith && active` (`ContactsView.tsx:317`). An outside-click-closes preview would set `active=null` and unmount the merge dialog mid-flow.
6. Dead CSS: `.sy-leads__detail`, `.sy-contacts__detail`, `.sy-tasks__detail`, `.sy-deals__detail` are not used by any TSX (grep). Only `.sy-rep__detail` is live.
7. Deals is NOT a master-detail split (desktop = full record page, <1024 = `Dialog placement="side"` sheet). Spec line 10 lists contacts/leads/tasks/reporting only: keep Deals out of batch 2 except the shared `side` sheet decision (section 4).

## 1. Inventory (file:line)
| Item | Where | Notes |
|---|---|---|
| Split grid columns | `features/leads/leads.css:9` `minmax(0,1fr) minmax(280px,340px)`, collapse `:74-78` (<=1023) | `.sy-leads__body` |
| | `features/contacts/contacts.css:111` `minmax(300px,380px)`, collapse `:215-219` | `.sy-contacts__body` |
| | `features/tasks/tasks.css:9` `minmax(280px,340px)`, collapse `:76` | `.sy-tasks__body` |
| | `features/reporting/reporting.css:137` `minmax(280px,360px)`, collapse `:177-181` (<=900), `--solo` modifier | `.sy-rep__body`; 3 panels |
| | `features/deals/deals.css:25` `.sy-deals__body` is single column | no split |
| Body wrappers (JSX) | `LeadsView.tsx:~478` `.sy-leads__body`; `ContactsView.tsx:~277`; `TasksView.tsx:~470`; `CampaignsPanel.tsx:106`; `EvidencePanels.tsx:115,280` | detail rendered as 2nd child |
| Shared panel | `ui/primitives/RecordPanel.tsx:53-79` (`<Panel as=aside .sy-record-panel>` >=1024, `Dialog placement="side"` <1024); body `:81-157`; footer `:187-234`; css `ui/primitives/record-panel.css` | consumers: `LeadDetail.tsx:216`, `ContactDetail.tsx:561`, `TaskDetail.tsx:257` |
| RecordEmpty | def `RecordPanel.tsx:159-179`; export `primitives/index.ts:32`; used `LeadDetail.tsx:208`, `ContactDetail.tsx:554`, `TaskDetail.tsx:250`; i18n `*.detail.empty` en.ts 145/219/321/463 + ar.ts 145/218/320/462 (4 keys x2; `deals.detail.empty` is unused by TSX already) | delete = remove 3 render sites + keys (parity test `i18n/i18n.test.tsx:20` forces both locales) |
| autoOpenFirst | prop `ui/data-grid/DataGrid.tsx:113`, effect `:200-205`; passed `LeadsView.tsx:~524` (`wide && !suppressAutoOpen`), `ContactsView.tsx:298`, `TasksView.tsx:499` (`wide`) | Deals/Reporting do not use it |
| Wide/sheet hooks | `ui/primitives/useMediaQuery.ts:21-28` (`RECORD_SHEET_QUERY (max-width:1023px)`); users: Leads/Contacts/Tasks `useWideLayout`, Deals `DealsView.tsx:153`, `RecordPanel.tsx:54,168` | spec breakpoint is 720, today 1023 |
| Crumb coupling | `ui/shell/RecordCrumb.tsx` (`useRecordCrumb`, `useCrumbReturn` incl. `suppressAutoOpen`); used `LeadsView.tsx:~148`, `ContactsView.tsx:155-156`, `TasksView.tsx:206`, `DealsView.tsx:291` | `suppressAutoOpen` becomes dead once autoOpenFirst is gone (simplify later, not required) |
| Dialog machinery | `ui/overlays/Dialog.tsx` (`placement: center|sheet|side` `:31`; side head `:114-126`; focus/Esc/trap `:56-98`; `lockScroll` `:61`); `overlays.css:51-62` scrim z1000, `:170-190` sheet, `:195-301` side (+RTL keyframes `:285-295`); `ui/overlays/nav.ts` (`focusablesIn`, `trapIndex`, `lockScroll`); `useDismiss.ts` (`useOutsideDismiss`, pointerdown capture) | `side` consumers: `RecordPanel`, `DealsView.tsx:697` (`deal-sheet`); `sheet`: `AppShell.tsx:293`, `DataGrid.tsx:583` |
| Selection state | detail row: `activeId` per view (`useState` + `parseSelect(location.search)`: `LeadsView.tsx:~118`, `ContactsView.tsx:100`, `TasksView.tsx:135`, `DealsView.tsx:219`; reporting `useState` x3); grid-internal `state.activeId` + `prune` (`gridModel.ts:275-281`); bulk selection separate set (`gridModel.ts:224`) | controlled `activeId` is NOT pruned |
| Row open handlers | `DataGrid.tsx:213-233` (Enter opens, Space toggles bulk, click opens unless target in `interactive` selector `:119`), `aria-current/aria-selected` `:424-425`, active bar css `datagrid.css:336-342` (physical `inset 3px` / RTL `inset -3px`) | no `scrollIntoView` anywhere in grid |
| URL | only `parseSelect(?select=)` read-once; writes: `router.ts:33 navigate` (pushState), `DealsView.tsx:436` replaceState (deal context). No `?preview=`. Producers of `?select=`: `DashboardView.tsx:358,361,609`, `DealRecord.tsx:214,217`, `DealsView.tsx:108,111`, `PipelineView.tsx:106`, `tasks/model.ts:165`, `tasks/RelatedLink.tsx`, `reporting/model.ts:283`, `reporting/shared.tsx:114` | |
| Keyboard | grid roving rows `DataGrid.tsx:207-234`; Dialog Esc+Tab trap `Dialog.tsx:78-98`; RecordBody Esc leaves edit (stops propagation) `RecordPanel.tsx:101-110`; Select consumes its own Esc; no `J/K` anywhere | |
| Server list | `ui/data-grid/useServerList.ts` (`refreshing`, `need`, `onNeedRows`), grid page window `DataGrid.tsx:141-155`, `PAGE_SIZES [10,25,50,100]` (`gridModel.ts:24`), default 10 | rows loaded only as far as the current grid page needs |
| DataGrid instances | `<DataGrid` x7: Leads, Contacts, Deals, Tasks, `CampaignsPanel`, `EvidencePanels` x2 (conversions, orders), `JourneyPanel` (no detail) | reporting grids are client-mode (not `server`) |

## 2. Shared-surface blast radius
| Shared piece | Touched by the change? | Other screens reached through it |
|---|---|---|
| `DataGrid` | YES if prev/next, "reveal row/page" and scrollIntoView live in the grid (grid owns `state.page`; `pageRows` is a window of `rows`, so the preview cannot walk past the page edge without grid cooperation); `autoSelectFirst` removal | all 7 grids incl. Deals + reporting; keep new props optional, default off |
| `Dialog` (`placement`) | Only if a 4th placement is added; `side` css is shared with Deals `deal-sheet` and drives focus/Esc/trap/scroll-lock for modal use | AppShell More sheet, bulk dialogs, every confirm. Recommendation: do NOT mutate Dialog; new primitive, Dialog only reused for <=720 |
| `RecordPanel` | YES (the main change: inline Panel -> overlay; `RecordEmpty` delete; footer sticky/negative margins `record-panel.css:85-97` assume 16px panel padding) | Lead/Contact/Task detail (3 screens) |
| Shell/sidebar | Overlap only (no code change) but z-order/topbar clash, see section 4 | all screens at runtime while a preview is open |
| Tokens | new `--sy-preview-w` (+ optional dur/ease if not already) in `tokens/css.ts` | token tests (`tokens.test.ts`, `no-raw-colors.test.ts`) must stay green: no raw colors |
| z-index layers | current: sticky th 2, batch 5, menu/popover 30, topbar 45, bottomnav 60, scrim 1000, toasts 1100, select/datepicker 1200 | new panel needs a slot 61..999 (proposal 200) |
| Focus management | new focus-into-heading / return-to-row / non-modal; `lockScroll` must NOT run on desktop (page behind scrolls and the table is usable) | Dialog opened from inside the panel (AddTaskButton, NewTaskDialog) must still return focus to its opener |
| i18n | new keys EN+AR (prev/next/open/close/position "n of m", aria labels); delete 4 `*.detail.empty` x2 locales | parity test fails if one locale is missed |
| `dir` handling | panel dock is the single physical exception; content inherits `<html dir>` (no portal, so inheritance is automatic) | the spec-I CSS lint (not yet present) needs an allowlist entry |
| Router / URL | `?preview=` read/write + back-compat for `?select=`; no new route unless "Open full record" is built | Dashboard/Pipeline/Tasks/Reporting hand-offs (9 producers) keep working only if `?select=` stays accepted |

## 3. Behaviour that depends on the panel being always open
| # | Dependency | What breaks / must be redefined | Severity |
|---|---|---|---|
| 1 | Contacts merge: `mergeWith && active` (`ContactsView.tsx:317`); `MergeDialogs` target = `active`; `onMerged` bumps `detailEpoch` (`:235`) | outside-click/Esc closing the preview unmounts the merge dialog; the outside-dismiss must ignore pointer events inside any dialog/scrim and the preview must not close while a modal is open (use `lockScroll` ref-count or a small overlay-stack) | High |
| 2 | Create-deal / add-task from preview (`lead-create-deal`, `contact-create-deal`, `AddTaskButton`) | `navigate("/deals", ctx)` unmounts the view; Back returns via `?select=` -> preview must reopen from `?select=`/`?preview=` (alias). `AddTaskButton` opens a nested fixed Dialog inside the panel (transform issue, section 0.2) | High |
| 3 | `active` is derived from loaded rows (`allRows.find`) | filter/sort change or `leads.reload()` can drop the row -> panel silently closes/blank; deep link to a record on page >1 shows nothing. Needs a retained `activeRecord` snapshot + fetch-by-id (reuse `fetchExpanded`, `features/listApi.ts`; Deals pattern `:293-305`) | High |
| 4 | Edit state: `RecordBody key={recordKey}` (`RecordPanel.tsx:82`) resets edit when swapping rows; `TaskDetail` also resets on id | spec says dirty -> confirm; dirty lives inside editors (`RecordEditFooter dirty` prop), not in the panel -> needs a small context from footer to panel (swap row, Esc, outside click, Close all consult it) | Med |
| 5 | Esc ordering: RecordBody handler stops propagation when editing; Dialog's Esc is on the dialog root | a document-level Esc for the non-modal panel is only safe because React's synthetic `stopPropagation` blocks it at the root. Put Esc on the panel root (like Dialog), not on `document`, so Select/nested Dialog/edit-cancel keep priority | Med |
| 6 | Bulk selection | independent of `activeId` (`gridModel.ts:224`); BUT the overlay covers table columns: in AR the checkbox/identity column (first, right edge) is under the panel; in EN right-edge sortable headers are covered. Bulk needs the preview closed | Med |
| 7 | Prev/next over server-paged rows | `rows` = every row loaded so far, grid shows a page window. Walk `matching` in server order; at the loaded end call `server.onNeedRows(rows.length+1, pageSize)` (`useServerList.ts` `need`), show busy, advance when the row arrives; disable at true end (`!hasMore`) and while `refreshing`; grid must switch `state.page` to the target index (new optional `revealId`/handle prop) and then `scrollIntoView({block:"nearest"})`. Client-mode grids (reporting) walk the sorted/filtered `matching` | Med |
| 8 | `onCreated` flows (`LeadsView`/`ContactsView`/`DealsView` `setActiveId(new.id)`) | after create the new row is not yet in `rows`; Contacts uses `addedRows`, Leads/Tasks rely on overlay/`mergeLatest`. Preview must open from the created record directly (existing e2e: "create selects row", "New contact ... opens the record") | Med |
| 9 | Crumb: `useRecordCrumb` + `useCrumbReturn` | crumb `back` = close preview; keep as-is. `suppressAutoOpen` becomes meaningless | Low |
| 10 | Task detail: complete-from-row / from-detail, 409 conflict, reader 403 | independent of layout; only selectors/visibility assumptions in tests change | Low |
| 11 | `J/K` shortcut | `e.key` is Arabic characters on an Arabic layout: use `e.code` (KeyJ/KeyK) or only Alt+Up/Down; ignore when focus is in input/textarea/select/contenteditable | Low |

## 4. RTL / physical-right risks
| Risk | Detail | Mitigation |
|---|---|---|
| AR: panel covers sidebar AND first column | `.sy-shell` grid puts the 228px (76px <=1180) sidebar on the right in RTL (`shell.css:1-6`); panel 360-480px at `right:0` covers the sidebar and the identity column; the active-row bar (`datagrid.css:340`) and checkbox column are under it | Spec fallback: CSS var `--sy-preview-reserve` (default 0) applied as `padding-inline-start` on the grid scroller while open. Ship the variable in increment 1 so enabling it is a 1-line flip; user decision to enable stays with the user/CREATIVE |
| Panel over the topbar | spec `inset-y-0` covers the topbar's right end: in EN the language switch + actor menu (`AppShell.tsx` topbar actions), in AR the breadcrumb/brand | start the desktop panel at `top: var(--sy-topbar-h)` (full height only <=720); needs CREATIVE sign-off |
| z-index | topbar 45, bottomnav 60 (<=720), menus 30, scrim 1000, toasts 1100, selects/date 1200; sidebar has none | panel 200 (desktop), 1000 sheet <=720 (via Dialog). Nested dialog/select inside the panel live in its stacking context: still above page chrome, toasts (1100) still above. Merge/New dialogs (z1000, outside panel) correctly sit above it |
| Toast vs footer in EN | toasts at `inset-inline-end:16px; bottom:16px; w340` (`overlays.css:100-110`) = bottom-right in EN, exactly over the panel's Save/Cancel (`justify-content:flex-end`) at the moment "Saved" appears; in AR toasts are bottom-left, no clash | while preview open set `--sy-preview-w` on `<html>`; `.sy-toasts{inset-inline-end: calc(16px + var(--sy-preview-w,0px))}` only in LTR (physical-aware) or shift the toast stack to inline-start |
| Transformed ancestor re-bases `position:fixed` (Select, DatePicker, nested Dialog) | slide-in `translateX(24px)->0` must end at `transform:none` (no `animation-fill-mode:forwards` with a transform, no `will-change:transform`, no `backdrop-filter` on any ancestor of the body). RAC glass spec (`RAC_TAILWIND_GLASS_SPEC` s.69) blurs the panel chrome: keep blur on header/footer siblings only | e2e: open Select + AddTask dialog inside the panel at AR and EN, assert list/dialog rect inside viewport and anchored to trigger |
| Logical props vs physical | `.sy-record__footer` uses `margin-inline` negative (fine); panel needs physical `right:0` + `border-left` + `translateX(+24px)` (allowlist for the future CSS lint, spec I). Existing `side` sheet slides from inline-end (LEFT in AR; keyframes `overlays.css:285-295`), spec wants physical right in both | Decide: (a) change `side` to physical right globally (affects Deals `deal-sheet` + RecordPanel sheet, 1 e2e at `mvp-deals.spec.ts:693`) for consistency, or (b) leave Deals mirrored and accept AR inconsistency between screens. Recommend (a), as a separate small increment |
| Breakpoint | spec sheet <=720, code 1023 (`RECORD_SHEET_QUERY`). 721-1023 today = full-screen modal sheet (tested at 768 in `mvp-record-grid.spec.ts:181`) | keep 1023 in the first increments (zero tablet change); move to 720 as the last increment with its own test |
| Back chevron | `.sy-back-icon` already scaleX(-1) in LTR / none in RTL (`overlays.css:268-274`) = matches spec (left in EN, right in AR) | none |
| Select in panel near right edge | list is `inline-size:max-content` anchored at trigger inline-start; `Select.tsx:181` clamps horizontally | e2e AR+EN with Source select in the editor |
| Panel content direction | no portal, so `<html dir>` inherits; do not set `dir` on the panel | none |

## 5. Option: existing machinery now vs RAC
| | A. In-house `PreviewPanel` now (reuse `nav.ts`, `useOutsideDismiss`, `.sy-dialog__side*` styles; Dialog only for <=720) | B. RAC `Modal/Dialog` now | C. Extend `Dialog` with `placement="preview"` |
|---|---|---|---|
| New deps | none | `react-aria-components` + Tailwind v4 + vite plugin + RAC-tailwind plugin; spec step 0 (tokens, baseline screenshots, CSS-layer collision 4.2 in SPIKE) must come first | none |
| Needs user approval | no | YES (deps) | no |
| Blast radius | RecordPanel + 3 views + small DataGrid hooks | whole styling pipeline; "0px diff" gate on 12 screens x 2 langs x 2 themes x 2 widths before it is safe | Dialog is modal-by-contract (aria-modal, trap, lockScroll, scrim); making one placement non-modal puts conditionals in the most shared overlay |
| Fit to non-modal desktop panel | exact (own contract) | RAC non-modal overlay = Popover/`Dialog` without Modal; usable, but not an off-the-shelf "side drawer" | poor |
| Reversibility | high (one primitive) | low | medium |
| Time to value | smallest | largest | medium |
**Recommendation: A.** No dependency, no pipeline change, and the contract (props: `open,label,onClose,returnFocusRef,onPrev,onNext,...`) can later be re-implemented on RAC without touching screens. Do not extend `Dialog` (C). B stays the plan of record (ADR-002) but belongs after the RAC step 0 baseline, not in this batch. Re-use at <=720: delegate to the existing `Dialog placement="side"` (already full-screen, back button, trap, focus return).

## 6. Tests
### 6a. Existing Playwright specs (static estimate; suite not run, needs API+DB; `playwright.config.ts` workers 1)
Likely to BREAK or need rewriting (they assume inline panel, auto-opened first row, or `*-detail-empty`): ~22 blocks.
| Spec | Blocks (line) |
|---|---|
| `mvp-leads.spec.ts` | 61 (list/search/detail 360+1280, "sheet only <1024"), 168 (arrows/Enter opens detail), 277 (edit/conflict), 316 (reader 403) |
| `mvp-contacts.spec.ts` | 78, 146 (edit/conflict/identifier), 302 (reader), 339 (New contact opens record); merge test 222 touches the merge dialog flow (verify, likely survives) |
| `mvp-tasks.spec.ts` | 161, 319 (complete from detail, edit, 409), 468 (360/1280) |
| `mvp-record-grid.spec.ts` | 43 (asserts auto-select + `lead-detail-empty` count 0: delete/replace), 140 (375 sheet), 181 (768 no clipping) |
| `mvp-ui-r4-b1.spec.ts` | 130 (crumb returns, "auto-open suppressed" regression becomes moot), 166 (Save always visible), 187 (no owner caption/technical details), 248 (mixed text in preview) |
| `mvp-ux-r2.spec.ts` | 325 (Cancel in sticky footer, Esc), 415, 439 |
| `mvp-reporting.spec.ts` | 122, 301 ("detail only with data") - only if Reporting is in the batch |
Probably unaffected (incidental detail use): `mvp-deals.spec.ts` (5, Deals not in the split; 693 changes only if `side` becomes physical-right), `mvp-pipeline.spec.ts:343`, `mvp-bulk.spec.ts:274`, `mvp-ux-r3.spec.ts` (2). Playwright viewports used by per-screen specs: 360 and 1280 (and 1440/768 in a few) -> 1280 means the new overlay is exercised by most of them.
### 6b. Existing unit specs
No unit test references `RecordPanel`, `RecordEmpty`, `autoSelectFirst`, `useWideLayout`, `useRecordSheet` or `placement` (grep over `*.test.*`). `overlays.test.tsx:58` covers Dialog default placement only. i18n key-parity (`i18n/i18n.test.tsx:20`) and `no-raw-colors`/`tokens` tests will fail on any missed key/raw color. `features/deals/model.test.ts` covers `parseSelect` (extend for `preview`).
### 6c. New tests needed
| Layer | Test |
|---|---|
| unit | `parsePreview(search)` (accepts `preview`, falls back to `select`, uuid-validated); pure `stepIndex(rows, id, dir)` (ends, filtered/sorted, id missing); outside-dismiss predicate (inside panel, inside any dialog/scrim, on a grid row = ignore); i18n parity for new keys; CSS lint: panel css is the only file allowed `right:`/`border-left`/`translateX` |
| e2e (EN+AR, 1280) | panel box `right == viewport width` in BOTH languages (physical dock) and table width unchanged (compare bounding box before/after open); slide origin is right in AR (computed transform at t0 > 0, not < 0) |
| e2e focus | open -> heading focused; Tab stays usable on page (non-modal); Esc closes and focus returns to the originating row; Esc in edit cancels edit first, second Esc closes; dirty -> confirm; open nested Add-task dialog -> Esc closes only the dialog, focus returns to its button |
| e2e outside click | click empty page closes; click another row swaps content without close/reopen (no focus bounce); click inside Select list / DatePicker / merge dialog does NOT close |
| e2e URL | open writes `?preview=<id>` (replaceState); reload restores; deep link to a record NOT on the first page (fetch-by-id) in Leads/Contacts/Tasks; legacy `?select=` still opens; closing removes the param; Back button |
| e2e prev/next | walks loaded filtered+sorted rows; at last loaded row with `hasMore` triggers load and advances; disabled at true end and while `refreshing`; grid page follows and row is in view; J/K and Alt+Up/Down work; ignored while typing in an input |
| e2e 375 | full-width sheet from the right in EN and AR, back button chevron direction, focus trap, focus returns to row |
| e2e layout | Select list and nested dialog inside the panel positioned correctly (no transformed-ancestor drift) in AR+EN; toast does not cover Save in EN; at 1440 AR selected row still identifiable (reserve flag off/on) |
| regression | contacts merge flow with preview open (outside click on merge scrim keeps both); create-deal round trip returns to preview; bulk select with preview closed; `server.refreshing` while preview open keeps panel and record |

## 7. Risk register (ranked)
| # | Risk | Sev | Mitigation |
|---|---|---|---|
| 1 | Transformed/blurred ancestor breaks fixed Select/DatePicker/nested Dialog (no portals) | High | animation must end at `transform:none`, no `will-change`/`backdrop-filter` on any ancestor of body content; e2e in both langs; or introduce a single portal root later |
| 2 | Merge flow unmounts under outside-click-close | High | outside-dismiss ignores events inside any dialog/scrim and while a modal is open; regression e2e |
| 3 | `active` derived from loaded rows: preview vanishes on filter/reload/deep link; `?select=` vs `?preview=` hand-offs | High | retained record snapshot + fetch-by-id (reuse `fetchExpanded`); accept both params, write `preview`; do not touch the 9 producers |
| 4 | AR: panel hides sidebar, identity column, checkbox column, active-row bar | High (visual, user-decided) | ship `--sy-preview-reserve` hook (default off); CREATIVE/user review of AR screenshots before default; panel below topbar |
| 5 | Shared DataGrid change (page reveal, step, remove autoOpen) regresses 7 grids | Med | all new props optional/default-off; Deals and reporting untouched until their own step; grid unit tests (`gridModel.test.ts`) + 1 e2e per grid |
| 6 | Prev/next over server pages (async load, refresh, ends) | Med | pure `stepIndex` unit-tested; disabled while loading; no wrap |
| 7 | Dirty-edit confirm needs state not owned by the panel | Med | context from `RecordEditFooter` (dirty/saving) -> panel; ship in its own increment |
| 8 | EN toast covers Save/Cancel; z-order surprises | Med | `--sy-preview-w` toast offset; z-map documented in `tokens/css.ts` |
| 9 | "Open full record" has no route for Leads/Contacts/Tasks | Med | omit the button there in batch 2 (Deals keeps its record page) unless user approves new routes + `static.ts` change; ask CREATIVE/Lead |
| 10 | ~22 e2e rewrites; green suite is the safety net | Med | keep `data-testid`s (`lead-detail`, `*-detail-title`, `sheet-back`, `record-*`) unchanged; update specs in the same increment as each screen |
| 11 | Breakpoint 1023 vs 720; `side` sheet direction in AR | Low | defer to last increments, each with its own e2e |
| 12 | `J/K` on Arabic layout; focus ring / Esc corner cases | Low | `e.code`, Alt+Arrows primary |
| 13 | RAC adoption later re-opens the primitive | Low | keep the in-house prop contract RAC-shaped |

### Proposed increment order (small, verifiable; one commit each; rollback point = the previous commit)
| # | Increment | Verify | Rollback |
|---|---|---|---|
| 0 | Baseline: run full `npm run test:ui` + `npm run test:unit` + `typecheck` + `lint`, capture Leads screenshots EN/AR 1440/1280/375 (before) | green, saved | n/a |
| 1 | Pure, unwired: `parsePreview`, `stepIndex`, `--sy-preview-w/--sy-preview-reserve` tokens, i18n keys EN+AR, z-map comment | unit tests | revert commit, no UI change |
| 2 | `PreviewPanel` primitive (non-modal desktop, delegates to `Dialog side` <=1023), not yet used; storybook-less unit/DOM test | unit test | revert |
| 3 | Leads only: swap `LeadDetail`->PreviewPanel, drop `.sy-leads__body` split, remove `autoSelectFirst`+`RecordEmpty` for Leads, retained record + fetch-by-id, `?preview`/`?select`; update the 4+ Leads/grid specs | leads specs EN+AR 1280/360; screenshots EN/AR 1440 reviewed; Select/Dialog-inside-panel checks | revert commit = old split back |
| 4 | Edge behaviours on Leads: Esc/outside click/focus return/dirty confirm/toast offset; AR reserve flag check | new e2e | revert |
| 5 | DataGrid optional `reveal`/step handle + prev/next + J/K | unit + e2e on Leads | revert |
| 6 | Contacts (with merge regression test) | contacts specs + merge e2e | revert |
| 7 | Tasks | tasks specs | revert |
| 8 | Delete `RecordEmpty`, `*.detail.empty` keys, dead `.sy-*__detail`/split CSS, `useWideLayout`, `suppressAutoOpen` (cleanup after all 3 screens migrated) | full suite + lint | revert |
| 9 | Reporting (3 panels, no RecordPanel; optional - lowest value) | reporting specs | revert |
| 10 | (optional, separate) `side` sheet physical-right + breakpoint 720 | deal sheet + 375 specs EN/AR | revert |
| 11 | Re-audit (CREATIVE) EN+AR light/dark 1440+375, then close batch 2 | acceptance list items 2-3 | n/a |

## 8. Open decisions for the Lead/user (blocking only items marked *)
1. * "Open full record" for Leads/Contacts/Tasks: omit now (recommended) or add routes (+ `src/static.ts` server list)?
2. * Panel top edge: below the 56px topbar (recommended; keeps language/actor controls reachable in EN) or full height as spec?
3. AR coverage: ship `--sy-preview-reserve` off by default (spec) - user to judge from AR screenshots after increment 3.
4. Include Reporting and Deals in batch 2? Recommended: Deals out, Reporting last/optional.
5. Sheet breakpoint 1023 -> 720 and `side` sheet to physical right: separate later increment (recommended).
6. RAC/Tailwind adoption: separate approved track (deps need explicit user OK); not required for item C.
