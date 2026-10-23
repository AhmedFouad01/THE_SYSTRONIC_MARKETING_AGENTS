# DASH-R8B — compact review actions + review card reorganised (Codex)

Owner walk-through 2026-10-24 (before the R8 deploy): Approve / Request edit are huge full-width pairs in many places
and the review card is disorganised. Rules updated: `C:/Work/TSST/TSST/core/rules.md` R49 (button label "Edit") and
R51 (Approve fill = Bootstrap green #28A745 light + dark; Edit = #FF003C; review actions small, on the item's
thumbnail / title row). R8 is integrated on main (4b2cbc2) but not deployed; this round ships with it.
ROLE A (team runtime, front end). Bounded: `web/` only, no deploy, no push, no secrets, no backend files. Effort: High.
Cost rules R52: read only what is named; ONE commit per step (2 steps; Ahmed sends "Step 1", then "Step 2");
3–4 screenshots of the changed area; reply in 3 lines, plain Egyptian Arabic. R50 / R53 / HEADINGS.md apply.

## Where
Folder `C:\Work\tsst-portal-web`. First: `git switch -c dash-r8b-web main` (main = 4b2cbc2). Keep the untracked qa
folders as they are. Read: rules R49 / R51; `web/qa/R8A/HEADINGS.md`; code `web/src/components/review/Deliverables.tsx`,
`web/src/pages/Review.tsx`, `web/src/pages/Home.tsx` (waiting list), `web/src/components/ds/PostFrame.tsx`,
`web/src/pages/client/ClientDeliverables.tsx`, `web/src/copy.ts`, the action button tokens in `web/src/theme/tokens.css`.

## Step 1 — PROPOSAL on two screens (commit = proposal only), then STOP
- Actions: two small (sm) buttons "Edit" (red #FF003C, pencil icon) and "Approve" (green #28A745, check icon) on the
  same row as the item's thumbnail / title, right-aligned; on 390 they stay on that row (icon + short label, or
  icon-only with aria-label if the row is too tight). Never a full-width pair. A decided item shows only what still
  makes sense (e.g. approved by team → only "Edit", unless an open client request needs a team answer).
- Card order (one clear reading path): media → title row (type icon, title, actions) → one status line (team status
  chip + client status chip, same size) → client request note (collapsed to one line + "Show", expanded on click) →
  publishing row (Show to client switch, "Edit for client" as a text/icon button, maker + other actions in the "…" menu).
  No line holds a single short word; no empty gaps.
- Apply to Job → Deliverables (image card + Files row) and the Review page only. Write `web/qa/R8B/CARD.md` (≤ ½ page:
  order, sizes, what moved into the menu).
Screenshots (4): Deliverables 1440 light (one approved card with a client request, one pending); Review 1440 dark;
Deliverables 390 dark; a Files row 390 light.

## Step 2 — apply everywhere (commit)
Same pattern on Home "Waiting for review", post frames (IG / FB / LinkedIn), copy and plan cards, the client view
(client cards: "Edit" + "Approve" with the same colours and size). Keyboard shortcuts (A / E) unchanged. `copy.ts`:
button label "Edit" (aria-label "Request edit"), status words unchanged (R49).
Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`.
Screenshots (3): Home waiting list 1440 dark; an Instagram post frame 390 light; client job page 390 dark.

## Reply (3 lines per step, Egyptian Arabic)
Step n done · gates pass / fail · open items.
