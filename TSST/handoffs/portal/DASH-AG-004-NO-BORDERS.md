# DASH-AG-004 — no borders (R53) + checkbox bugs — Antigravity request

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort Medium. Cost rules R52: read only what the task needs; reply in 3 lines.
Run this AFTER DASH-AG-003 is committed.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-jobs`. Work and commit ONLY there. `web/` only; no backend change.

## Task
1. **Owner rule R53** (`C:/Work/TSST/TSST/core/rules.md`, read R50–R53 only): NO stroke or border on any component —
   buttons, text fields, text areas, selects, date pickers, number fields, checkboxes, radios, switches, cards,
   tables, modals, chips — in light and dark. Tell shapes apart by pure colour: fields and unchecked boxes get a filled
   surface tint that clearly differs from the background they sit on (check both themes); checked = solid colour;
   cards / modals = surface colour + soft shadow; keep row dividers only inside lists and tables. Focus = fill change,
   plus the keyboard focus-visible ring `#00BEF6` (the one allowed ring). Do it at the theme level first
   (`web/src/theme/*`, `web/src/styles/*`, `components/ui/*`), not screen by screen; then grep `web/src` for
   `border`, `outline`, `ring`, `stroke`, `box-shadow: 0 0 0` and remove what is left.
2. **Bug: clicking the checkbox square does nothing; clicking its label works.** Find the cause (likely our CSS: an
   overlay, `pointer-events`, or the visual box not matching the real input) and fix it for every checkbox (Visibility,
   Packages platforms, Edit job platforms, Access job picker). The square, the label and the whole row must toggle.
3. **Bug: checkboxes paint over buttons while scrolling** (sticky "Save" bars, modal footers). Fix the stacking
   (no `z-index` / `position` on checkboxes above the page layer; sticky bars and modal footers sit above content).

## Checks before the reply
`web/`: `npm run typecheck`, `npm run lint`, `VITE_API=live npm run build`; a Playwright check that clicking the
square toggles a checkbox and that a sticky Save bar is on top after scrolling. One commit on `dash-jobs`.
Two screenshots max in `web/qa/X3/AG-004/`: Settings → Visibility 1536 light + dark.

## Reply (3 lines)
What changed · checks pass / fail · anything that still has a border and why.
