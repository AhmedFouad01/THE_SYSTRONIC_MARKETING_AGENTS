# DASH-AG-005 — team Home + drawer in the client-page language — Antigravity request

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort Medium. Cost rules R52. Run AFTER DASH-AG-003 is committed.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-jobs`. `web/` only. Files: `web/src/components/Shell.tsx` (drawer / top
bar), `web/src/pages/Home.tsx`, their CSS, and shared components you extract. Do NOT touch the Job page,
Deliverables, Settings or `web/src/pages/client/**` logic (Codex is on the Job page in another branch).

## Goal
The team side looks like the approved client page (direction B, your AG-003 work): same header band, tiles, usage
rings, milestone map with pulse, review list with thumbnails, footer. REUSE those components; do not rebuild look-alikes.
- **Drawer:** Dash navy surface; header logo + product name from Settings → Workspace; nav items = icon + text;
  active item = raised surface + light-blue text (the segmented "selected" style), no filled button; footer text from
  Workspace at the bottom; collapses to icons below 1280 px.
- **Home:** header band in royal with "Good morning, <name>" and today's date; tiles = active jobs, pending review,
  changes requested, approved in the last 7 days (captions say what the number is); package usage rings per client;
  one milestone map for all clients (next 30 days, merged dots with counts, "today" pulse); "Waiting for review" list
  with thumbnails and sm Approve / Request edit; charts row stays below.

## Two small client-page fixes from the AG-003 review (allowed exception)
- Mobile job card: the cover image is cut from the left; center it (`object-fit: cover; object-position: center`).
- Client header "Next payment": when its due date is in the past, show it as Overdue (`#FF003C` chip), not as a plain date.

## Do not repeat these mistakes (each one already cost a round)
1. Colours: Dash navy / neutral surfaces only; no green anywhere; royal = identity; cyan `#007DA3` = actions;
   neon `#00BEF6` / `#FF003C` = accents; status colours per R49. No pastel slabs, no beige blocks on navy.
2. Buttons R51: filled only for actions; white Regular text; segmented / toggles / icon buttons / nav never filled;
   sm inside lists and cards; pairs same width.
3. R53: no border or stroke on anything; fills + soft shadow only.
4. R50 / R39: HeroUI components only; no native controls.
5. No eyebrow lines, no duplicated titles, no floating unexplained labels, no mock-only lines in the live build.
6. Columns share one top line; first rows align; one spacing scale (8 / 16 / 24).
7. Check with real-length data (long client names, 0 items, 40 items).

## Checks before the reply
`web/`: `npm run typecheck`, `npm run lint`, `VITE_API=live npm run build`. One commit on `dash-jobs`.
Screenshots: Home 1536 light + dark, Home 1920 dark (3 max) in `web/qa/X3/AG-005/`. Team screens are desktop
only; no mobile shots.

## Reply (3 lines)
What changed · checks pass / fail · anything you could not reuse and why.
