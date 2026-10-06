# SPIKE_RTL_STACK - RTL/AR+EN gate for the user-approved client stack (ADR-002 section 9)

Date 2026-10-06. Author DEV_AG (TSST BUILD). Status: THROWAWAY spike, readiness NOT_READY. Skills (UNVALIDATED): TSST-DEV-SK-002 (bounded probe), SK-011 (E2E tests), SK-015 (claim-to-evidence).
Code: `C:\Work\crm-spike` (Vite 8 + React 19 + TS; not promoted; no commit, no deploy). Run: `npm run build && npx vite preview --port 5299` then `npx playwright test`.
Result: **34/34 Playwright checks pass (17 x AR/RTL + 17 x EN/LTR), Chromium 1243 only, 0 console errors/warnings** (StrictMode on). Screenshots in `C:\Work\crm-spike\shots\` (viewed: panel-ar, grid-pinned-scrolled-ar, querybuilder-ar, select-en, kanban-409-toast-ar, col-reorder-pointer-ar, zoom-row4-ar).

## 1. Verdicts (exact pins used; all npm installs `-E`)
| Library | Pin | Verdict | One-line evidence |
|---|---|---|---|
| React Aria Components | 1.21.1 | **GO** | Tabs arrow keys follow reading dir (AR ArrowLeft = next); submenu opens on inline-end (left in AR, right in EN); Select/Menu/Dialog/Modal/TextField render correctly in both; `I18nProvider locale ar-EG` |
| Tailwind CSS + @tailwindcss/vite | 4.3.3 | **GO** (with the setup in section 4) | Logical utilities (`start-0`, `end-4`, `ms-`, `text-start`) flip correctly; Vite 8 plugin works |
| TanStack Table | 9.2.6 | **GO-WITH-CONDITIONS** | Pinning is logical `start`/`end` natively; sticky pinned col on inline-start in both langs, stays after horizontal scroll. Conditions: section 3 items T1-T4 |
| TanStack Virtual | 3.14.13 | **GO** | 5,000 rows -> 28 DOM rows; scroll 240 frames p50 16.7ms / p95 18.1ms (AR), 18.0ms (EN) |
| dnd-kit core/sortable/utilities | 6.3.1 / 10.0.0 / 3.2.2 | **GO-WITH-CONDITIONS** | Pointer + keyboard OK in RTL, incl. column header reorder and kanban. Conditions D1-D4 |
| TanStack Query | 5.104.1 | **GO** | Optimistic rename shows instantly, 409 rolls back to previous value + status; kanban Move-to 409 rolls back card + toast |
| React Hook Form + Zod (+ @hookform/resolvers) | 7.89.0 / 4.6.5 / 5.9.1 | **GO** | Zod 4 + resolvers 5 OK; schema rebuilt per language; errors re-localise on toggle |
| react-querybuilder | 8.24.3 | **GO-WITH-CONDITIONS** | JSON AST correct, mixed AR value preserved, layout mirrors (field select right of remove button in AR). Conditions Q1-Q4 |
| motion | 14.0.0 | **GO-WITH-CONDITIONS** | Toast presence anim (Y 16 -> 0) and reduced-motion respected. Cost is 30 KB gz lazy, not 4.6 KB (section 5) |
React 19 peer compatibility: `npm i` printed no peer warnings, `npm ls` shows no invalid/unmet; React 19.3.0 everywhere. Not tested: Firefox/WebKit.

## 2. What was proven (check -> AR | EN, evidence = test name in `tests/spike.spec.ts`)
- Select long options: 61-81 chars wrap at word boundaries (2 lines), `overflow-wrap/word-break: normal`, popover >= trigger width, max 28rem | same. (shots select-*)
- Side panel (RAC ModalOverlay+Modal, CSS `right:0`, never `inset-inline`): rAF samples translateX 24.0 -> 15.9 -> 9.5 -> ... -> 0 (from RIGHT) in both; box right edge = 1440 +-1.5 in both; content `:dir()` follows language; `backdrop-filter: blur` active (shot panel-ar shows blurred page behind); Esc closes; reduced-motion: zero translate (fade only).
- Mixed text, programmatic Range x-positions + innerText equals logical string: `اجتماع مع Ahmed Corp غداً` (Ahmed Corp LTR run between AR words), `Meeting with أحمد الشريف tomorrow` (cell dir=auto -> LTR, AR name RTL inside), `احجز Demo يوم 12/10/2026 الساعة 3:30 PM`, `تواصل على +20 100 123 4567 أو ahmed@corp.com` (after fix B2), panel title. Input/textarea: `:dir()` resolves rtl for s1, ltr for s3; value round-trips exactly.
- Grid pin: AR select col right edge = scroller right (+-3px), name col adjacent; EN mirrored; after scrollLeft +-400 pinned cols unchanged and header/body aligned (<1px). Sticky header stays at scroller top after scrolling to row 2500.
- Sort (aria-sort asc verified numerically), row select (2 rows, select-all 5000), resize (`columnResizeDirection` 'rtl'/'ltr' set from lang: drag toward inline-end widens 180 -> 240 in both).
- Column reorder RTL: pointer drag `company` over `email` -> order `email,company,...`, email visually at inline-start side (right in AR) | mirrored in EN. Keyboard (Space, physical arrow, Space): AR ArrowLeft and EN ArrowRight both move the column one place later.
- Kanban: columns render first stage at inline-start (right in AR). Keyboard with custom getter: AR ArrowLeft / EN ArrowRight = to next column; opposite key = back; ArrowDown reorders within column (index 0 -> 1); pointer drag between columns incl. fast drop; "Move to..." RAC menu moves card; locked card -> optimistic move then rollback + toast at 500 ms.
- Toast: Y 16 -> 0 from block-end, stacks at inline-end (left edge 16px in AR, right in EN); reduced motion -> no intermediate frames.
- QB: `{"combinator":"and","rules":[{"field":"name","operator":"contains","value":"أحمد Corp",...}]}`, add rule -> 2 rules; no SQL in the AST.

## 3. Conditions and bugs found (each was reproduced; fix verified unless marked)
Bidi/RTL generic (apply to any stack):
- B1 `dir="auto"` on an EMPTY input/textarea resolves LTR (spec), so in AR the caret/placeholder jumps left. Fix verified: `dir={value ? 'auto' : uiDir}` (controlled value). Update UI_R4 section I accordingly.
- B2 Free text with a phone/date/email INSIDE an Arabic sentence is reordered by UBA (`+20 100 123 4567` showed as `4567 123 100 +20` before fix). Fix verified: display-only `Mixed` component (src/Mixed.tsx) wraps regex-matched islands in `<bdi dir="ltr">`; stored text and innerText unchanged. Regex covers email, EGP amounts, dd/mm/yyyy, h:mm AM/PM, phone; extend with unit tests.
- B3 Vite 8 (lightningcss) dropped the unprefixed `backdrop-filter` when both `-webkit-backdrop-filter` and `backdrop-filter` were hand-written (computed value `none`). Write ONLY the unprefixed property (or Tailwind `backdrop-blur-*`).
TanStack Table 9.2.6:
- T1 `row.getAllCells()` does NOT follow pinning regions (header groups do). Render cells as `headerGroups[0].headers.map(h => row.getAllCellsByColumnId()[h.column.id])` (bug seen: identity cell rendered last). Verified.
- T2 Numeric columns sort desc-first by default; set `sortDescFirst:false` per column if product wants asc-first.
- T3 Pin offsets only via `column.getStart('start')` + `position:sticky; inset-inline-start`; widths must equal model sizes. RTL horizontal scrollLeft is negative (tests account for it).
- T4 Features are explicit (`tableFeatures({...})`); 5,000 rows sorted client-side; server/manual mode, keyboard cell navigation (roving tabindex), column visibility chooser: UNTESTED. v9 is new: keep it behind a `gridModel` adapter (fallback v8/AG Grid per TECH_RESEARCH R2).
dnd-kit (legacy 6.3.1/10.0.0):
- D1 Stock `sortableKeyboardCoordinates` wastes a key press after a cross-container move (first reverse-direction press is a no-op: "c1 over c1") and the first physical-left press failed from the start in AR. Fix verified: custom `coordinateGetter` for Left/Right that jumps to the visually adjacent column rect (Kanban.tsx `kbCoords`), delegating Up/Down to the stock one. Works identically in AR/EN.
- D2 In `onDragEnd` read the LATEST state from the store (`qc.getQueryData`), not the render closure, and apply the move from `event.over` if `onDragOver` has not flushed (fast drop otherwise lands back in the source column). Verified.
- D3 Arrow keys are PHYSICAL/visual (AR: ArrowLeft = later column). Acceptable and consistent with RAC Tabs; show localised hint text. Default screen-reader announcements are English: supply AR/EN `accessibility.announcements` (done in spike for text, spoken output UNTESTED).
- D4 Make drag handle a separate focusable button (card menu inside a draggable card would trigger drag on Space). Keep the "Move to..." menu as the non-drag path (WCAG 2.5.7): works. Library idle since 2024-12: plan B pragmatic-dnd stays per TECH_RESEARCH R5.
react-querybuilder:
- Q1 Operator/combinator labels stay English in AR ("AND", "contains", "=" seen in shot querybuilder-ar) unless full `translations`/`getOperators` supplied. Q2 Default CSS (78 KB raw, 2.7 KB gz) paints a blue panel: restyle with tokens or write own css. Q3 AST nodes carry random `id` (uuid): strip/ignore server-side and validate with allowlist. Q4 Value inputs are not `dir=auto` (use `controlValueEditor`/custom editor); bring in via `React.lazy` (done). Depends on Redux Toolkit/immer (about 10 KB gz of its cost).
motion:
- M1 `MotionConfig reducedMotion="user"` verified (no translate frames). M2 For toast/panel, CSS (`@starting-style`, keyframes) already gives the same motion at 0 KB; the RAC side panel in this spike uses pure CSS. Use motion only for exit/layout list animation.

## 4. Integration pattern for CRM_APP
1. Install exact: `npm i -E tailwindcss@4.3.3 @tailwindcss/vite@4.3.3` + libs above; Vite: `plugins:[react(), tailwindcss()]`; no tailwind.config.js (CSS-first).
2. Coexistence with current CSS (no Preflight reset): `@layer theme, base, components, utilities; @import "tailwindcss/theme.css" layer(theme); @import "tailwindcss/utilities.css" layer(utilities);` plus 3-line own base (`box-sizing`, `button{font:inherit}`). Spike used exactly this; no collisions seen, but the spike had no legacy stylesheet. UNTESTED hazard: UNLAYERED legacy rules beat any layered Tailwind utility regardless of specificity; before migrating a screen either put legacy CSS in `@layer legacy` declared first, or use `@import ... prefix(tw)`.
3. Token hook-in: map existing `--sy-*` in `@theme inline { --color-surface: var(--sy-surface); --color-accent: var(--sy-accent); --shadow-menu: var(--sy-shadow-menu); ... }` (inline keeps runtime light/dark switching of the legacy variables; no duplicate palette). Add spacing/motion tokens the same way (`--sy-dur-*`, `--sy-ease-*`).
4. RTL: `<html lang dir>` set from UI language; `I18nProvider` for RAC; only logical utilities; the panel dock is the single physical exception (`right:0` in `.side-modal`). Add a lint/grep test for `left|right|ml-|mr-|pl-|pr-|text-left|text-right` outside the allowlist.
5. Per-component imports from `react-aria-components` (tree-shaken, see sizes); style via `data-[selected]`, `data-[focused]`, `data-[entering]/[exiting]` variants.
6. Grid: `features` + `columns` module-scope/memoised; `columnResizeDirection` from lang; cells from header-group order (T1); virtualiser at `estimateSize 36`, `overscan 8`; text cells `<bdi dir="auto">`, ids/phone/email `<bdi dir="ltr">`, free text through `Mixed`.
7. Board/columns: dnd-kit with handle button, `kbCoords`, store-based `onDragEnd`; every move goes through ONE mutation (`onMutate` snapshot -> optimistic, `onError` restore + toast, version conflict = 409). Menu "Move to..." calls the same mutation.
8. Forms: build Zod schema in `useMemo([lang])` from the property registry; call `trigger()` on language change when `submitCount>0`.

## 5. Bundle budget (production build, minified; measured by `vite build` + zlib gzip and rollup-plugin-visualizer)
Whole spike app: initial JS **227.1 KB gz** (741 KB raw) + CSS **3.6 KB gz**; lazy chunks: react-querybuilder **36.2 KB gz** (+2.7 KB css), motion toast **30.6 KB gz** (MotionToast 16.0 + domAnimation 14.5). Includes React 19 DOM (~60 KB gz of the 227).
Standalone per-library (lib build, React external; NODE_ENV not replaced so slight upper bounds), gz / raw: RAC subset actually used 74.6 / 283.6 KB (`export *` all of RAC would be 307.5 gz: never do it); TanStack Table (6 features) 20.8 / 88.4; Virtual 8.8 / 32.7; dnd-kit core+sortable+utilities 18.0 / 61.8; Query 12.1 / 47.2; RHF 13.6 / 45.5; Zod 4 + resolver 26.3 / 106.6; react-querybuilder 46.2 / 172.6; motion LazyMotion+m core 11.0 / 35.7, with domAnimation 35.3 / 122.9. (The standalone `react` entry is invalid: dev build.)
Suggested budget for CRM_APP list route: initial JS <= 260 KB gz (spike 227 + app code), react-querybuilder and motion lazy only (<= 40 KB each), CSS <= 12 KB gz. Cheapest savings if needed: zod/mini or Valibot (-15 KB), drop motion (-30 KB lazy), RAC subset only.

## 6. UNTESTED / limits
Grid keyboard cell navigation and column visibility chooser; server-mode/infinite cursor list; 375px viewport and touch; dark mode; Firefox/Safari; actual screen-reader speech; Arabic IME composition; RAC DatePicker/NumberField Arabic digits; unlayered-legacy-CSS collision (section 4.2); render cost of sorting 5,000 rows not profiled; frame timings are headless Chromium (software compositing, 60 Hz) so only a rough budget. Passing this spike does not validate production suitability or the skills used.

## 7. Next
(1) Lead: record GO/conditions in ADR-002 section 9; (2) BUILD: promote only the patterns (Mixed, kbCoords, `@theme inline` map), not the spike code; (3) address UI_R4 section I update for B1/B2; (4) run the UNTESTED list as BUILD tests when each library enters CRM_APP/package.json.
