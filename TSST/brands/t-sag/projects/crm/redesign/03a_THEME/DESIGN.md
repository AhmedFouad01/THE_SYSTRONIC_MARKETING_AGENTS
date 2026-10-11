# TSST House Theme v0.1 — DESIGN.md

Brand `t-sag` · project `crm` · round C1a · status: proposal, NOT_READY (not validated, not approved).
Files: `tokens.css` (CSS variables `--hs-*` + Tailwind v4 `@theme`), `theme-preview.html` (live), `qa/` (shots + QA.md).
Brand check: `brand.md` for t-sag holds no palette, font or logo facts, so nothing here claims to "match the brand". The old `--sy-*` palette is not binding (Ahmed).

## 1. Concept
1. **Blue leads, quietly.** Deep blue-tinted surfaces and ink in both themes; one saturated blue for action and selection.
2. **One red, used rarely.** A hue-347 red marks danger, destructive actions and the occasional accent; never decoration.
3. **Space, steps and soft shadow instead of lines.** Regions are separated by surface steps and elevation; a line exists only as the edge of an input.

## 2. Palette

### 2.1 Primitives (hex)
| Ramp | Values |
|---|---|
| Blue (hue 224) | 50 `#E3EBFD` · 200 `#B7CBFA` · 400 `#7FA0F2` · 500 `#3F69E0` · 600 `#2251D3` (brand) · 700 `#1B43B3` · 800 `#163796` · dark-mode fill `#3A66E8`, text `#8FB0FF` |
| Red (hue 347, not magenta, not orange) | 50 `#FDE6EB` · 600 `#C81F45` (brand red) · 700 `#AC1839` · 800 `#A8143A` · dark fill `#D92B52`, dark text `#FF7090` |
| Neutral (blue-tinted, hue ~222) | light: `#F3F5FB` `#EBEFF9` `#EAEEF8` `#FFFFFF`; ink `#12203F` `#435073` `#56638A`; dark: `#0A1330` `#0D1838` `#121E42` `#182753` `#1F3063`; ink `#E9EEFC` `#B3BEDD` `#92A0C8` |
| Green / Amber / Sky | `#0B7547` / `#C77D0A` (ink `#865000`) / `#0A6A99`; dark `#4FD39A` / `#F2B24A` / `#5CC4F0` |
| Violet (platform) | `#5B3FB8` light, `#B9A6FF` dark |

Red hue check: `#C81F45` = HSL hue 347, `#D92B52` = 347. Inside the 340-352 band; not pink, not orange.
No colour in the system is #000 or a near-black slab: darkest surface is `#0A1330` (deep blue), darkest ink `#12203F`.

### 2.2 Semantic roles (CSS names `--hs-*`; Tailwind `--color-*` same name without prefix)
| Role | Light | Dark |
|---|---|---|
| canvas (page) | `#F3F5FB` | `#0A1330` |
| nav (sidebar) | `#EBEFF9` | `#0D1838` |
| surface (cards) | `#FFFFFF` | `#121E42` |
| surface-2 (sunken, table header, secondary button) | `#EAEEF8` | `#182753` |
| raised (popover, bulk bar) | `#FFFFFF` + shadow-2 | `#1F3063` + shadow-2 |
| hover / selected | primary 7% wash / `#E3EBFD` | blue 9% wash / `#1B2F6A` |
| ink / ink-2 / ink-3 | `#12203F` / `#435073` / `#56638A` | `#E9EEFC` / `#B3BEDD` / `#92A0C8` |
| primary (fill) / hover | `#2251D3` / `#1B43B3` | `#3A66E8` / `#4A75F0` |
| primary-text (links, ghost) | `#2251D3` | `#8FB0FF` |
| primary-soft / ink | `#E3EBFD` / `#1A3FA6` | `#1B2F6A` / `#8FB0FF` |
| accent = danger fill | `#C81F45` | `#D92B52` |
| accent-text / soft | `#C81F45` / `#FDE6EB` (ink `#A8143A`) | `#FF7090` / `#3A1A36` |
| edge (input, checkbox) | `#7F8CAE` | `#6C7AA6` |
| focus | `#2251D3` | `#8FB0FF` |

### 2.3 Status
| | Light fill / soft / ink | Dark fill / soft / ink | Always paired with |
|---|---|---|---|
| Success | `#0B7547` / `#DDF4E8` / `#0B7547` | `#4FD39A` / `#123A3A` | check icon + word |
| Warning | `#C77D0A` / `#FFF0D2` / `#865000` | `#F2B24A` / `#3B2F1E` | clock or dot + word |
| Danger | `#C81F45` / `#FDE6EB` / `#A8143A` | `#FF7090` / `#3A1A36` | x or ban icon + word |
| Info | `#0A6A99` / `#DCF0FA` | `#5CC4F0` / `#10384F` | word |
Colour is never the only signal: every status chip carries an icon or a word.

## 3. Typography
Both fonts are **SIL Open Font License 1.1**, free for commercial use, loaded from Google Fonts in the preview (self-host for production).
- **Inter** (Latin, numerals, tabular figures) and **IBM Plex Sans Arabic** (Arabic). One stack: `"Inter", "IBM Plex Sans Arabic", system-ui`. Latin runs fall on Inter, Arabic runs fall through to Plex, so mixed strings render without a font swap seam. `lang=ar` flips the order so Arabic UI text leads with Plex.
- Replaces today's Inter + Cairo + Alexandria + Plex mix: one family pair, fewer roles. (Today's file: `ui/tokens/scales.ts`.)

| Role | Size / line (EN) | AR | Weight | Use |
|---|---|---|---|---|
| title | 28 / 36 | 30 / 42 | 700 | page title |
| section | 20 / 28 | 21 / 30 | 600 | empty-state title |
| subhead | 16 / 24 | 17 / 28 | 600 | card title |
| body | 14 / 22 | 15 / 26 | 400 | default |
| label | 13 / 18 | 14 / 20 | 500-600 | field labels, KPI labels |
| caption | 12 / 18 | 13 / 18 | 600 for chips | hints, chips |
| kpi | 30 / 36 | 30 / 36 | 700 | KPI value, tabular |
- Body is 14px: dense Operate role, justified by table density; inputs go to 16px on touch to avoid iOS zoom (set in app). Prose measure 45-75ch.
- Numbers: `font-variant-numeric: tabular-nums lining-nums` on every table cell, KPI and axis (`.hs-num`). Arabic UI uses Arabic-Indic digits via `Intl` (`ar-EG`); phones and codes stay Western digits in an `ltr` isolate.
- Mixed text: names use `<bdi dir="auto">`; phones, emails and units use `<bdi dir="ltr">`. Inputs holding names are `dir="auto"`.
- Light-on-dark: dark theme text is `#E9EEFC` not white; headings keep weight, line-height unchanged (Plex Arabic has generous metrics).
- Fallbacks: `system-ui, "Segoe UI"`; `font-display: swap` via the Google URL.

## 4. Space, shape, elevation
- **Spacing** 4-point: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Card padding 20-24 (16 on mobile); gap between cards 16; page gutter 32 (16 on mobile). More space above a group than inside it.
- **Control height 36 on desktop, 44 on touch/375.** Every control in a row shares one height and one centre line (`align-items:center`). Hints reserve their row so sibling fields never shift.
- **Radius**: 6 (checkbox) · 10 (controls, rows) · 16 (cards) · pill (chips).
- **Elevation** (soft, offset + blur, blue-tinted; dark uses deeper, bluer shadows plus the lighter-is-higher surface step): shadow-1 cards; shadow-2 popovers, bulk bar, floating panels; shadow-3 drawers and modals. No hard offset shadows.

## 5. Border policy
1. **No borders on cards, sidebar, top bar, table rows or headers.** Cards sit on the canvas by surface step plus shadow-1. Table rows are separated by a 2px gap and a 52px height; the header is a `surface-2` band.
2. **Allowed lines** (all functional): input / select / date edge 1px `edge` (3:1 or better); checkbox edge; focus ring; chart guides at 10% ink (data meaning only, they carry the scale); "still maturing" chip hairline (it is part of the hatch symbol).
3. **A button never rests on a line.** Action rows sit on surface with padding (24px above the footer actions), never on a rule; a bulk bar is a raised card, not a bordered strip.
4. Selected rows use the `selected` tint, never a border-left accent.

## 6. Focus and motion
- Focus ring: `2px solid var(--hs-focus)`, offset 2px, on every interactive element via `:focus-visible`. Light `#2251D3`, dark `#8FB0FF` (both at least 3:1 on every surface). Inputs also swap their edge to the ring colour.
- Motion: 120ms for colour, press and hover, 200ms for popovers (fade + 4px rise + 2% scale), 320ms for the mobile drawer; one easing, `cubic-bezier(.22,1,.36,1)`. Press = 1px down. `prefers-reduced-motion` sets all durations to 0. No decorative motion.
- RTL: the drawer enters from the right, popovers align to the logical start, mirrored icons use `.flip`.

## 7. Components (preview shows each)
- Buttons: primary (blue fill, white text), secondary (surface-2 fill), ghost (primary-text), danger (red fill). Disabled uses `disabled-bg` + `ink-disabled`. Loading shows a spinner and keeps width.
- Fields: styled select (button + listbox popover with keyboard), checkbox (visually hidden input + drawn box), date (segmented spinbuttons + calendar popover), file (DropZone with Browse button + file chip). All native look hidden; the underlying input exists only for semantics and focus.
- Table: selection checkbox, header select-all with indeterminate, status chips, tabular numbers, bulk bar above the table. At 375 rows become stacked cards.
- Nav: five approved groups (Overview, CRM, Marketing, Insights, Administration). Upcoming items render disabled with an amber dot at the logical end and the tooltip "Coming soon / قريبًا"; no badge text.

## 8. Data-viz
Categorical (use in this order; 6 maximum per chart; always add labels, patterns or direct value reads):
| # | Light | Dark | Role |
|---|---|---|---|
| 1 | `#2251D3` | `#6C96F9` | CRM / primary series |
| 2 | `#C81F45` | `#FF7090` | negative / lost |
| 3 | `#0E8C86` | `#3FC8BE` | teal |
| 4 | `#C77D0A` | `#F2B24A` | amber |
| 5 | `#6A4BD0` | `#A58BFF` | violet |
| 6 | `#5F6E93` | `#8D9BC0` | slate / other |
Sequential (blue, 5 steps): light `#E3EBFD #B7CBFA #7FA0F2 #3F69E0 #1B43B3`; dark `#1B2F6A #284BA8 #3A66E8 #6C96F9 #B7CBFA`. Light-to-dark in light mode, dark-to-light in dark mode so "more" is always "more contrast".
Chart rules (fixes R04): short ticks ("Aug 17"), never rotated; max 4 horizontal guides, no vertical; square legend keys, RTL-mirrored; time flows right-to-left in AR; bars 18px max with 4px radius; tooltip styled as a raised popover; Arabic digits in AR; if all values are 0, show the empty state; trim empty leading periods.

### CRM vs platform numbers (always visually separate)
| | CRM number | Platform number |
|---|---|---|
| Colour | blue (`--hs-crm`) | violet (`--hs-platform`) |
| Fill | solid | hatched (45 degrees) |
| Tag | chip "CRM" with solid square | chip "Platform" with hatched square, violet-soft background |
| Placement | own column or own half of a pair | own column or own half; never summed or blended in one value |
The gap between them is shown as a "Lead gap / Reconciliation" pair (128 and 141 side by side), never as an error.

## 9. Data states
| State | Treatment |
|---|---|
| Not connected | Empty card: 56px icon tile (plug-off), title, one sentence, primary "Connect ..." + ghost link. KPI shows a neutral chip "Not connected", value "—". CRM numbers keep working. |
| Stale | Warning chip with clock and age ("Updated 26 h ago") on the number; chart gets an amber-soft note with Refresh. Amber, never red. |
| Still maturing | Hatched, hairline-edged neutral chip with clock. The newest chart bar is hatched at 55% with a solid outline. |
| Unknown / direct | Italic neutral chip with "?" icon; never blank. |
| No baseline | Neutral chip "– No baseline"; no delta, no colour. |
| Delivery accepted / rejected | Success chip with check / danger chip with x. |
| Consent | Granted = success + check; Unknown = italic neutral + "?"; Denied = danger + ban; Withdrawn = warning + ban. |

## 10. Do / don't
Do: separate with space and surface steps; use one control height per row; show units and "as of" times; pair every colour with an icon or word; isolate mixed-script strings with `bdi`; keep red rare; keep CRM and platform apart.
Don't: use #000 or near-black slabs; add dividers, card borders or row lines; place a button on a rule; use a coloured side-border on cards or alerts; use gradient text, glass or hard offset shadows; use a native select, checkbox, date or file control; blend CRM and platform values; show a raw UUID (show names, UUID in a tooltip); use emoji as icons.

## 11. Contrast (computed WCAG 2.x relative luminance; text ≥ 4.5, large text and UI ≥ 3)
| Pair | Light | Dark | Need |
|---|---|---|---|
| ink on canvas | 14.77 | 15.76 | 4.5 |
| ink on surface | 16.10 | 14.03 | 4.5 |
| ink on surface-2 | 13.87 | 12.45 | 4.5 |
| ink on raised (dark) | - | 10.90 | 4.5 |
| ink-2 on surface | 7.97 | 8.78 | 4.5 |
| ink-2 on canvas | 7.31 | 9.86 | 4.5 |
| ink-2 on surface-2 | 6.87 | 7.79 | 4.5 |
| ink-3 on surface (placeholder, hints) | 5.92 | 6.27 | 4.5 |
| ink-3 on canvas | 5.43 | 7.04 | 4.5 |
| ink-3 on surface-2 | - | 5.56 | 4.5 |
| ink-3 on raised (dark) | - | 4.87 | 4.5 |
| ink on nav | 13.99 | 15.02 | 4.5 |
| ink-2 on nav | 6.93 | 9.40 | 4.5 |
| primary-text on surface (link, ghost button) | 6.59 | 7.61 | 4.5 |
| white on primary button | 6.59 | 4.95 (`#3A66E8`) | 4.5 |
| white on danger button | 5.62 | 4.75 | 4.5 |
| chip primary-soft-ink on soft | 7.62 | 5.91 | 4.5 |
| chip success | 4.98 | 6.57 | 4.5 |
| chip warning | 5.90 | 6.98 | 4.5 |
| chip danger | 6.26 | 5.77 | 4.5 |
| chip info | 5.06 | 6.24 | 4.5 |
| chip platform | 6.14 | 6.30 | 4.5 |
| accent / danger text on surface | 5.62 | 6.18 | 4.5 |
| success text on surface | 5.75 | 8.62 | 4.5 |
| warning text on surface | 6.64 (ink) | 8.71 | 4.5 |
| info text on surface | 5.94 | 8.22 | 4.5 |
| ink on selected row | 13.47 | 10.90 | 4.5 |
| input / checkbox edge on surface | 3.35 | 3.85 | 3 (UI) |
| input edge on canvas | 3.08 | 3.70 | 3 (UI) |
| focus ring on surface | 6.59 | 7.61 | 3 (UI) |
| primary button fill on canvas | 6.05 | 3.70 | 3 (UI) |
| primary button fill on surface | 6.59 | 3.29 | 3 (UI) |
| viz 1 on surface | 6.59 | 5.71 | 3 (UI) |
| viz 2 | 5.62 | 6.18 | 3 |
| viz 3 | 4.11 | 7.92 | 3 |
| viz 4 | 3.30 | 8.71 | 3 |
| viz 5 | 5.95 | 6.00 | 3 |
| viz 6 | 5.07 | 5.88 | 3 |
| CRM / platform colour on surface | 6.59 / 7.37 | 5.71 / 7.72 | 3 |
Known exceptions: disabled controls and disabled nav items (light 2.32 / 2.47, dark 3.12) are exempt under WCAG, and are never the only carrier of meaning (disabled nav also has the amber dot and a tooltip). Light viz 4 (amber `#C77D0A`) is 3.03 on canvas: acceptable as a graphic with labels; keep amber text on its `ink` shade (`#865000`).
