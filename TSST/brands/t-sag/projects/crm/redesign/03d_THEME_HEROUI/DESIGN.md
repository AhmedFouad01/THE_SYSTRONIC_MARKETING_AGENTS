# The Systronic CRM house theme on HeroUI (round 2)

Status: PREVIS / prototype, NOT_READY. Brand t-sag, project crm. Decisions: D-05 menu, D-08 HeroUI base, D-09 palette, D-10 Western digits.
Source (not Drive): `C:\Work\tsst-crm-theme-proto`. Open the built prototype: `preview/index.html` (works from file://, URL params `?view=leads|dashboard|signin&theme=light|dark&dir=ltr|rtl&sel=2&q=zzz`).

## 1. Concept
An editorial studio handover, turned into a work tool: Legacy Blue sidebar, Poppins that is big and bold at the page title with a short Impact Red bar beside it, wide-tracked small-caps labels, status dots, square-ish 6-8px corners, space and surface steps instead of lines. Hairlines only carry meaning: the tab rail, table rows, nav groups never. A barber shop UI does not have a bolt, a red bar and the three dots; this one does in every screen.

## 2. Palette (D-09) and roles
| Role | Light | Dark |
|---|---|---|
| Royal Blue `#00338D`: primary button, links, selected, chart 1 | `#00338D`, hover `#002780`, pressed `#001974` | lifted `#3069D0`, hover `#366FD6`, pressed `#2A63C9`; text/link `#A1BFF2` |
| Impact Red `#C60C30`: title bar, active-nav indicator, active-tab underline, chart 2, attention | `#C60C30`; text on tint `#A90018` | lifted `#E94E58`; text `#F49190` (Impact Red needs one lift to reach 3:1 on blue) |
| Legacy Blue `#002244`: sidebar, sign-in brand panel, chart 3, text | sidebar `#002244`, text `#002244` | floor of every dark surface |
| Crisp White `#F2F3F3`: canvas | canvas `#F2F3F3`, surface `#FFFFFF` | text `#F2F3F3` |
| Cyan `#0085B2`: chart 4, focus, small details | `#0085B2`; text `#006185` | `#4AAAD6`; text/focus `#7FC9ED` |

Dark surfaces, all lifted Legacy Blue (same hue 252, nothing below `#002244`): sidebar/bottom bar `#002244`, canvas `#0F2C4B`, surface `#183555`, hover `#223F5F`, overlay `#2B4869`, line `#375576`. Neutrals in light are Legacy Blue tints: `#E4ECF5`, `#D8DFE6`, `#5B6B7D`, `#3D4F63`.
Derivation method: OKLCH of the five official colours (Royal L.359 C.157 H261, Red L.526 C.207 H21, Legacy L.251 C.075 H252, Cyan L.578 C.117 H231). Tints keep the hue and lift L with chroma tapered toward white; darker steps drop L by .04 (hover) and .08 (pressed); dark surfaces keep H252 at C.066 and step L .29 to .44.
Red never means "new" or "brand". It means attention or danger and always travels with an icon and a word (chip "Follow-up overdue", delta below zero, bulk Delete).
Status chip family (tint + word + shape): New = Royal tint with ring dot; Contacted = Cyan tint with solid dot; Qualified = solid Royal with check; Lost = Legacy tint with minus; Follow-up overdue = Red tint with triangle.

### Cyan options for Ahmed (the one in use is A)
- **A `#0085B2` (in use)**: same chroma (.117) and lightness (.578) as the midpoint of Royal and Red; hue 231, between the logo cyan and Royal. 4.2:1 on white, so used for graphics, not body text; text variant `#006185` (6.9:1).
- **B `#0A9BC4`**: hue 224, a touch brighter (L .64), nearer to the logo cyan `#29BCEF`; better for dark mode, needs the dark text variant on white.
- **C `#007A99`**: hue 218, calmer and greener-blue (L .53); passes 4.5:1 on white as text; less contrast against Royal in charts.
Open point from D-09 stays: the logo's measured red `#E7213A` / navy `#181D36` differ from this palette; logo files are used untouched.

## 3. State matrix (light / dark)
| Role | Rest | Hover | Pressed | Selected | Focus | Disabled |
|---|---|---|---|---|---|---|
| Primary button | `#00338D` / `#3069D0`, white text | `#002780` / `#366FD6` | `#001974` / `#2A63C9`, scale .97 | n/a | 2px Cyan ring, 2px offset (`#0085B2` / `#7FC9ED`) | fill `#F2F6FA`/`#223F5F`, text muted, no ring |
| Outline/ghost button | surface + 1px field line | surface-hover `#F2F6FA` / `#223F5F` | same, scale .97 | n/a | Cyan ring | muted text on hover fill |
| Sidebar nav item | transparent, text `#E4ECF5` | white 7% | white 11% | white 10% + 3px red bar at logical start (`#E94E58`), bold | outline `#7FC9ED` inset | "Soon": text `#B9C6D4` + hollow cyan dot, not navigating |
| Table row | surface | `#F2F6FA` / `#223F5F` | n/a | Royal-100 `#E3ECFA` / `#24467E` + checked box | Cyan ring on cell | n/a |
| Tab (saved view) | muted text | text colour | n/a | bold + 3px Impact Red underline | Cyan ring inset | n/a |
| Field / search | 1px `#6A7D93` / `#8499B0` | border text-2 | n/a | n/a | border + 2px Cyan ring | muted fill |
| Checkbox | 1.5px field line | n/a | n/a | Royal fill + white check | Cyan ring | muted |
| Select item | transparent | surface-hover | n/a | Royal tint + bold | hover fill | n/a |

## 4. Chart order and rules
Series 1 Royal (New, circle), 2 Impact Red (Lost, square), 3 Legacy Blue (Qualified, diamond), 4 Cyan (Won, triangle). Dark: `#6091E7`, `#E94E58`, `#9FBEE0`, `#4AAAD6`, each at least 3:1 on `#183555`. Marker shape differs per series, legend repeats the shape, y gridlines are surface tints, axis labels 11.5px. The time axis stays left to right in Arabic too (numbers and week codes do not mirror); legend and labels are RTL.

## 5. Type
Raleway 900/800 italic (wordmark only) and Poppins 400/500/600/700 (Latin, self-hosted via `@fontsource/poppins`) and IBM Plex Sans Arabic 400/500/600/700 (`@fontsource/ibm-plex-sans-arabic`), both OFL. One stack `Poppins, "IBM Plex Sans Arabic"`: Latin runs (names, phones, EN labels) take Poppins, Arabic runs fall through to Plex, so mixed names look matched.
| Role | EN | AR |
|---|---|---|
| Sign-in headline | 40/1.12 700 -0.02em | 38/1.4 700 |
| Page title | 28/1.2 700 | 26/1.4 700 |
| Panel title | 16 600 | 16 600 |
| Body / table | 14/1.5 400-500 | 15/1.65 |
| Caps label (nav group, KPI, table head) | 11 600 +0.14em uppercase | 12.5 600, no tracking, no case |
| KPI value | 32 600 tabular | same |
Arabic never gets letter-spacing or uppercase. Digits are Western (D-10), dates `Intl` with `ar-EG-u-nu-latn`.

## 6. Radius, elevation, lines
Radius: controls 6px, panels 8px, sheet 14px, chips 6px, avatars full. Elevation: light panels `0 1px 2px / 0 6px 20px` at 5-6% Legacy Blue; overlays `0 4px 12px, 0 16px 40px`. Dark: no panel shadow, depth is the surface step. Lines: tab rail under the saved views, one hairline between table rows, none around the topbar, sidebar, KPI cards or toolbars. A button never sits on a line.

## 7. Brand signatures
Red 4px bar beside every page title; red 56px bar above the sign-in headline; tracked small caps (nav groups, KPI labels, table heads); three-dot loader (Royal, Cyan, Red; reduced-motion safe) on the sign-in submit and as a static motif on the sign-in panel; status dots (ring, solid, hollow cyan for "Soon"); the bolt in the sidebar and on the sign-in panel (see section 7b).

## 7b. Logo usage
One logo per screen. Never two logos in one view.
| Where | Asset | Size | Notes |
|---|---|---|---|
| Sidebar brand block (desktop, D-11/D-12) | Vector mark `systronic_mark_vector.svg` (inline, white) + THE SYSTRONIC in Raleway 900 italic, one line, white | Mark 64px tall (min 24px); wordmark 19.5px | Own framed area, see "Brand block" below. One lockup, no PNG logo here. |
| Brand block in the 375 More sheet | Same block, full width | Mark 76px, wordmark 22px | Mark and wordmark keep left-to-right order in AR (the lockup never mirrors). |
| Top bar, mobile, forms | none | n/a | The top bar and the 375 layout carry no logo. |
| Sign-in brand panel | Full stacked logo PNG `logo-white.png` (mark + THE SYSTRONIC), shown once | 112px tall (min 96px) | 56px panel padding, which is more than half the mark's width. The PNG is 602x713, so at least 5x for the 112px display; `object-fit: contain`, no cropping, no stretching. |
| Sign-in watermark | Same vector mark, inline SVG, white at 5% on Legacy Blue | 340px wide | Brand panel only. The whole bolt is visible, never clipped by the panel edge, not behind body text. |
| Favicon | Vector mark, navy `#002244` colourway (`brand/mark-navy.svg`) | n/a | Same polygon, only the fill differs. |
| Dashboard cards, empty states | none (a 22px outline icon in a tinted square) | n/a | No watermark anywhere except the sign-in panel. |
Approved colourways of the vector: white, navy/Legacy Blue, black. The vector's export fill `#e51c1c` is not used. The polygon points are copied unchanged from the file.
Brand block (D-11, D-12, drawn by Ahmed, ref `refs/brand-block_ahmed_2026-10-09.png`): a 14px-radius frame on the deeper Legacy Blue `#001A35` (the one surface below `#002244`, never `#000`); 28px of space and the surface change separate it from the menu, no divider. Top row, end-aligned: connection ("Online" with a cyan dot, "Offline" with a hollow red ring, always text plus dot) and a red version badge "v 0.9 preview" (Impact Red `#C60C30`, white text, 6:1). Main row (always left-to-right, the lockup never mirrors): a large white vector bolt (64px tall in the sidebar, 76px in the sheet) beside, on one line, THE SYSTRONIC in Raleway 900 italic caps (19.5px in the 240px block, 22px in the sheet; measured 146px of 154px available, no clipping), then "Datatronic CRM" (Poppins 500, 12.5px, `#9FB2C6`) followed by three dots (Royal lift `#4A78BD`, Cyan `#4AAAD6`, Red `#E94E58`), then a segmented pill: darker inner segment "Manager" / "المدير" and the manager's name in bold caps from workspace data. Brand name and product name are never translated; version, status and role come from the dictionary (`b.*`), Western digits. Wordmark checked against `systronic_logo_white_transparent.png` (same heavy italic). Mobile: the same block, full width, at the top of the More sheet.
Clear space: at least half the mark's width on every side (for the 32px mark: 13px; the sidebar gives 12px side and 28px below).
Minimum sizes: mark 24px tall, full logo 96px tall.
Don'ts: crop, stretch, rotate, recolour with filters or gradients, add shadow/glow/outline/effects, place two logos in one view, put a logo on a busy photo or a surface other than Legacy Blue, white or Crisp White, redraw or trace the PNG, use the PNG where the vector fits, put the watermark on working screens.
Checked: the white PNG on `#002244` has hard alpha edges (255/0, no matte fringe) so no halo; the vector renders crisp at 32px.

## 8. Contrast table (measured, tools: WCAG relative luminance)
| Pair | Ratio |
|---|---|
| L text `#002244` on canvas `#F2F3F3` | 14.39 |
| L text-2 `#3D4F63` on white | 8.41 |
| L text-3 `#5B6B7D` on canvas | 4.91 |
| L white on primary `#00338D` | 11.30 |
| L chips: new 9.50, contacted 5.81, qualified 11.30, lost 7.05, overdue 7.14 | all >= 4.5 |
| L field border `#6A7D93` / focus `#0085B2` / red bar `#C60C30` on white (UI) | 4.23 / 4.20 / 6.01 |
| D text `#F2F3F3` / text-2 / text-3 on `#183555` | 11.25 / 7.20 / 5.03 |
| D white on primary `#3069D0` | 5.18 |
| D link `#A1BFF2` on `#183555` | 6.70 |
| D chips: new 6.47, contacted 7.28, qualified 5.18, lost 6.99, overdue 8.36 | all >= 4.5 |
| D field border `#8499B0` on `#0F2C4B` / focus `#7FC9ED` on `#183555` (UI) | 4.83 / 6.84 |
| D red bar `#E94E58` on `#183555` / on sidebar `#002244` (UI) | 3.39 / 4.34 |
| D chart royal / legacy-lift / cyan on `#183555` (UI) | 3.99 / 6.50 / 4.77 |
| Sidebar text `#E4ECF5` / caps `#B9C6D4` on `#002244` | 13.42 / 9.21 |
Plus automated per-text check on every render (1081 text nodes over 14 renders, zero failures), see `qa/QA.md`.

## 9. HeroUI API notes (v3.2.6, verified in node_modules types and CSS)
- Compound components only: `Table > Table.ScrollContainer > Table.Content (selectionMode, selectedKeys, onSelectionChange) > Table.Header/Column/Body/Row/Cell`; `Checkbox slot="selection"` > `Checkbox.Control > Checkbox.Indicator` in header column and each row cell. `Table variant="secondary"` removes the card padding that `primary` adds.
- `Tabs variant="secondary"` + `Tabs.ListContainer > Tabs.List > Tabs.Tab > Tabs.Indicator` gives the line indicator; recoloured Impact Red, 3px.
- `Select > Select.Trigger (Select.Value, Select.Indicator) + Select.Popover > ListBox > ListBox.Item (+ ItemIndicator)`; `SearchField > SearchField.Group > SearchIcon, Input, ClearButton`; `Pagination > Summary, Content > Item > Previous/Link isActive/Next`; `Drawer isOpen > Backdrop > Content placement="bottom" > Dialog > Handle, Header/Heading, Body` (used for the More sheet); `Chip variant="tertiary"` with own `--chip-bg/--chip-fg`; `Avatar > Avatar.Fallback`.
- Theming: override HeroUI CSS variables (`--background, --surface*, --accent*, --danger, --field-*, --border, --focus, --radius`) in unlayered CSS after `@import "@heroui/styles"`; set `data-theme` and `dir` on `<html>` so portals inherit. `Select` renders a visually hidden native `<select>` for forms (not visible, not an unstyled control). HeroUI warning/success have no family colours, mapped to red/cyan and never used alone.
- Logos: sidebar mark and watermark are inline SVG (component `BoltMark`), favicon is `brand/mark-navy.svg`; the stacked logo is `brand/logo-white.png` (white transparent PNG, tight bbox crop of `systronic_logo_white_transparent.png`, no pixel changes).
- Versions: `@heroui/react` 3.2.6 (MIT), `@heroui/styles` 3.2.6, `react-aria-components` 1.22.0 (Apache-2.0), React 19.2.8, Tailwind 4.3.3, Vite 8.3.4, TypeScript 6.0, lucide-react 1.54 (icons), `@fontsource/poppins`, `@fontsource/ibm-plex-sans-arabic`.
- file:// : Chrome blocks `type="module"`; the build is one IIFE with `defer` (small Vite plugin), `base: './'`, no router.

## 10. Known gaps (honest)
Only Dashboard, Leads and Sign-in are built; other menu items are inert. Mobile cards have no row selection (bulk bar is desktop-first). Gradients, motion beyond the dots and bulk bar rise are not specified. The chart has no tooltip. Fonts self-host only the latin and arabic subsets.
