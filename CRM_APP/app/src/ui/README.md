# CRM UI kit

## Layout rhythm (R02 / R11)
Use the shared `--sy-*` scale; never choose a feature-local control height. Single-line Inputs, Selects, ComboBoxes, DatePickers and Buttons are **36px** (`--sy-control-h`). Button size props change horizontal padding/type, not height; textarea, calendar cells and touch menu rows retain their content/touch sizing.

Spacing (px): 2, 4, 6, 8, 10, 12, 14, 16, 20, 22, 24, 32, 40, emitted as `--sy-space-*`. Use 4 between label/control/hint, 8 between header actions, 10 between sibling form fields, 12 between header sections, 14 between title and KPI strip, 16/24 between content groups. Header actions wrap as a row with `align-items:center`; their field labels are visually hidden by the kit selector and remain accessible. Do not add a feature-local sr-only label selector.

Type size/line-height (EN → AR px): page title 28/36 → 29/38, section title 20/28 → 21/32, body 14/22 → 15/24, data and field labels/hints 13/20 → 14/22. Use the role tokens. Form grids and field content align to the top: a multiline hint/error may grow its own field, never stretch a sibling's label/control gap.

Reviewer checklist: compare button/select/input heights and baselines in every PageHeader; verify hidden labels remain announced; add a long hint/error to one sibling and confirm the other control stays in place; check Arabic RTL with mixed-script values, light/dark, and a 375px width for wrapping/overflow. Use one theme and `--sy-*` colours only. Manual spatial/type/rhythm review is used until Impeccable is installed with Ahmed's approval.

## Palette (R03)
KPI surfaces are neutral or use an existing semantic/brand emphasis. The removed dark blue emphasis has no variant or token. Light primary actions use brand cyanDark with white text; dark primary uses brand cyan. Use only `--sy-*` colours; no CSS/JS hex, colour functions or named pigments in consumers. `transparent` and `currentColor` mean absence/inheritance, so they remain allowed.

`--sy-series-1` through `--sy-series-8` (chart tokens serialize their derived, gamut-clamped sRGB for Chart.js hover/tooltip compatibility) are 45-degree hue rotations from cyanDark in light mode (OKLCH L=0.55639, C=0.11243, h=231.206) and cyan in dark mode (L=0.74875, C=0.14644, h=228.273). All colours in a mode have equal perceptual lightness/chroma; hue alone varies. They extend the same theme for data/category marks; use semantic foreground/background pairs for text and statuses. Review both modes together.

## Names and technical identifiers (R06)
Show an existing workspace display name when available; the current approved session/workspace response has no name, so use the localized generic CRM Workspace label. Never fabricate a tenant business name or display its UUID as the name. Identity shows technical IDs in pointer/focus tooltips; preserve their raw values for API binding and existing copy actions. Upcoming navigation keeps the same row height, is inert with aria-disabled, and has a warning token dot at logical end. Its tooltip opens on pointer hover and keyboard focus, dismisses on Escape, and stays localized.
