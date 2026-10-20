> SUPERSEDED by DASH-DS1-DESIGN-SYSTEM.md (2026-10-20). Do not run.

# DASH-UX1 — one build round for DASH-UX-AUDIT-001 — request (Antigravity or Codex)

Bounded code task: no deploy, no push, no spend, no secrets. Cost rules R52: read only what is named; reply in 3 lines.
Antigravity model: Gemini 4 Argon, effort Medium.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-ux1` (from `main` 5b6862c, = live). `web/` only, no backend change.
Work and commit ONLY there.

## Task
The audit is `C:\Work\TSST\TSST\handoffs\portal\DASH-UX-AUDIT-001.md` — do items **1–5, 7–12, 14–17** exactly as
written there (problem → fix → done when). Rules R39, R49–R53 (`C:/Work/TSST/TSST/core/rules.md`, read R49–R53 only).

Ahmed's decisions for the two open items:
- **Item 6 — button fills (calmer):** Request edit `#E0264B` (hover one step deeper); Approve `#0A9BD0` in dark,
  `#00338D` in light. Neon `#00BEF6` / `#FF003C` stay for dots, pulse, focus, chart accents only. Status colours
  follow the same values.
- **Item 13 — client header = option A, but KEEP the infographic:** a thinner brand band (logo + name + industry);
  under it, on the page surface, the infographic tiles stay with their colours: package, period progress bar, campaign
  and ad usage rings, active jobs, awaiting-you count, next payment (if billing shown). Clients must understand at a
  glance what we do for them; do not reduce the tiles to plain numbers.

## Checks before the reply
`web/`: `npm run typecheck`, `npm run lint`, `VITE_API=live npm run build`. Playwright: no inner scrollbars and
`scrollWidth <= clientWidth` on every card; Home, Clients and Settings content start on one left line at 1536 and 1920.
One commit on `dash-ux1`. Screenshots (changed screens only, max 8) in `web/qa/UX1/`: team Home 1536 + 1920 dark,
Clients 1536 dark, Visibility 1536 dark, client Home 1536 light + dark and 390 light, drawer close-up.

## Reply (3 lines)
What changed (by audit item number) · checks pass / fail · items you could not finish and why.

## Not in this round
The milestone / marketing-plan infographic round (explain what we do, the plan and our mapping to clients) comes later
as its own round.
