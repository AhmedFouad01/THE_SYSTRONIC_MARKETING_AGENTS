# DASH-DS1 — one global design system for the whole Dash (Codex, High)

Replaces DASH-UX1-ROUND.md (do not run that one). Goal: stop patching screens. Build ONE design system (tokens, layout
primitives, components) and move EVERY screen onto it, so a fix in one place fixes the whole app.

## Ground rules
- Folder `C:\Work\tsst-portal-web`, branch `dash-ds1` (= `main` 5b6862c, live). Work and commit ONLY there.
- `web/` only. Do NOT change the backend, the API contract, routes, data logic, or what a client is allowed to see.
  Every feature that works today must still work (same buttons, same actions, same data).
- No deploy, no push, no secrets, no new paid tools. New npm packages only if unavoidable; say which and why.
- Commit at the end of each phase (5 commits). If you hit a limit, stop at a phase boundary and say which phase is done.

## Read first (only these)
1. `C:/Work/TSST/TSST/core/rules.md` — R39 and R49–R53 only (no native controls; status words and colours; HeroUI only;
   action buttons and colours; cheap requests; no borders).
2. `C:/Work/TSST/TSST/handoffs/portal/DASH-UX-AUDIT-001.md` — all 18 items (this round must fix 1–17; 18 is Ahmed's).
3. The current code: `web/src/theme/*`, `web/src/styles/*`, `web/src/components/**`, `web/src/pages/**`, `web/src/copy.ts`.
4. `docs/DASH-REPORTS.md` "Library and colours" only.

## Ahmed's decisions (final, do not re-decide)
- Look = the approved client page (direction B) everywhere: Dash navy surfaces in dark, neutral in light; royal
  `#00338D` = identity (header bands, drawer accents, headings); cyan `#007DA3` = primary action; no green anywhere.
- Action buttons (R51): flat fill, NO border / outline / shadow, white text, weight 400, hug the label (min 96 px), never
  full width above 640 px; pairs equal width; order everywhere = Request edit (left) · Approve (right).
  Fills: Request edit `#E0264B`; Approve `#0A9BD0` dark / `#00338D` light; Primary `#007DA3`; Secondary `#475569`;
  Danger `#E0003A`; hover = one step deeper. Neon `#00BEF6` / `#FF003C` only for dots, pulse, focus ring, chart accents.
- Segmented choices, tabs, toggles, icon buttons and nav are NEVER filled buttons (selected = raised surface + royal /
  light-blue text). Status chip: one size, dot + word, R49 colours (Approved = Approve colour, Pending = orange,
  Changes requested = `#E0264B`).
- R53: no stroke or border on any component; fields and unchecked boxes = filled tint clearly different from the
  surface; cards = surface + soft shadow; row dividers only inside lists / tables; keyboard focus ring `#00BEF6` only.
- Client header = KEEP the live client page header exactly as it is now (Ahmed likes it): full brand band with the
  logo, name, industry AND the infographic tiles inside it (package, period progress, usage rings, active jobs,
  awaiting-you, next payment). Only move it onto the tokens / components; do not redesign it. Audit item 13 is
  dropped. Package name on one line + price in plan currency, Overdue chip when the payment date is past.
- Drawer: top = Dash logo from Settings → Workspace (dark-theme logo) + "by The Systronic" small under it; nav; at the
  bottom only the user and theme controls. ONE footer for the whole app: page bottom, one muted line.
- Logos render as uploaded on a transparent background (no white plate, no border); only a missing logo gets the
  initial-letter tile.

## Phase 1 — Inventory (read-only, short)
`web/qa/DS1/INVENTORY.md` (≤ 1 page): every CSS file and what it styles; every one-off component that duplicates
another; every hard-coded colour, spacing, radius, border, z-index and full-width button outside the theme files;
which screens use which. This is your migration list. Commit.

## Phase 2 — Tokens (one source of truth)
`web/src/theme/tokens.css` (+ a typed mirror `web/src/theme/tokens.ts` for charts):
- Colour: surfaces 0–3, text 1–3, brand (royal, cyan, navy), action fills above with hover, status (approved,
  pending, changes) + soft tints, accents (neon), field fill, divider. Light and dark.
- Type scale 12 / 13 / 14 / 16 / 20 / 24 / 32, weights 400 and 500 (600 only for page titles).
- Space 4 / 8 / 12 / 16 / 24 / 32 / 48. Radius 8 (controls) / 12 (cards). Shadow sm / md.
- Z-index scale: base, sticky, drawer, overlay, modal, toast. Breakpoints 390 / 640 / 1024 / 1280 / 1536 / 1920.
- Page container: fluid, max 1600 px, 24 px gutters; content starts on the same left edge as page headers.
Charts read colours from `tokens.ts`. Commit.

## Phase 3 — Primitives and components (HeroUI v3 underneath, R50)
In `web/src/components/ds/` (one folder, one export index):
- Layout: `AppShell` (drawer + top bar + the single footer), `Page` (container + title block), `Section`,
  `Grid` (auto-fit, min 320 / max 420 px cards, equal-height rows), `Stack`, `Cluster`, `ActionsBar` (right-aligned;
  sticky variant right-aligned, not full width).
- Content: `Card` (actions pinned to the bottom), `StatTile`, `InfographicTile`, `UsageRing`, `ProgressBar`,
  `StatusChip`, `Thumb` (4:3, `object-fit: contain` on a neutral tile, video play mark + length, file icon for text),
  `ListRow` (thumb + clean title + muted meta + actions; truncates, never scrolls sideways), `EmptyState` (compact:
  icon + one line + optional action), `Logo` (transparent, initial fallback), `MilestoneMap` (merged dots, pulse).
- Controls: `ActionButton` (variants approve / requestEdit / primary / secondary / danger; sizes sm / md / lg; sm inside
  lists and cards), `Segmented`, `Toggle` (Switch), `IconButton`, `Field` wrappers (text, textarea, number, select,
  date, date range, file drop, colour) — filled, no border, label above, help text below.
- Clean titles: one helper used by team AND client lists (no raw file names as the main line; path muted below).
- Lists that can be long (Waiting for review, Items for review): show the newest 5 + "Show all (N)" link. No inner
  scroll boxes anywhere.
Add `npm run ds:check` (a small node script): fails on raw HTML controls outside `components/ds`, on `border` /
`outline` outside the allowed divider / focus rules, on hex colours or px spacing outside the theme files, on
`width: 100%` buttons above 640 px. Commit.

## Phase 4 — Move every screen onto the system
Team: Login, Invite, Home, Jobs, Job (all tabs, Edit job, milestones, deliverables, preview, Edit for client), Review,
Reports, Clients, Client detail, Settings → Clients / Workspace / Team / Client access / Visibility / Packages.
Client: link + PIN page, Client home, Client job, preview modal.
Then delete the one-off CSS and components the inventory listed (`styles/polish.css`, page-level rules in
`styles/dash.css`, `styles/branding.css`, `pages/client/client.css`, duplicate button / chip / toggle components)
as they become unused. Screen files keep only layout composition. Commit.

## Phase 5 — Proof
- `/design` page (only when `VITE_API=mock`, never in the live build): every token and component, light + dark.
- Gates: `npm run ds:check`, `npm run typecheck`, `npm run lint` (0 errors), `npm run test:api`,
  `VITE_API=live npm run build`; root `npm test` must stay green (you did not touch the backend).
- Playwright: on every screen no inner scrollbars and `scrollWidth <= clientWidth`; Home, Clients, Settings content
  share one left edge at 1536 and 1920; a sticky Save stays above content while scrolling; checkboxes toggle from the
  box and the label.
- Screenshots in `web/qa/DS1/` (10 max): `/design` 1536 light + dark; team Home 1536 + 1920 dark; Clients 1536 dark;
  Visibility 1536 dark; client Home 1536 light + dark, 390 light; drawer close-up.
- `web/qa/DS1/REPORT.md` (≤ 1 page): audit items 1–17 → fixed by which component / token; anything not done.
Commit.

## Reply (5 lines)
Phases done · gates pass / fail · audit items fixed / open · packages added (if any) · screenshot folder.
