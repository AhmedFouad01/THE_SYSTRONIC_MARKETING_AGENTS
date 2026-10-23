# DASH-R8A — owner walk-through fixes: brand, search, client header, heading system (Codex)

Source: Ahmed's live walk-through, `DASH-OWNER-NOTES-001.md` N1–N7 (same folder). R7 is live (main 8197418).
ROLE A (team runtime, front end). Bounded: `web/` only, no deploy, no push, no secrets, no backend files. Effort: High.
Cost rules R52: read only what is named; ONE commit per step (3 steps; Ahmed sends "Step 1", "Step 2", "Step 3");
2–4 screenshots of the changed area per step; front-end gates only; reply in 3 lines, plain Egyptian Arabic.
Rules: `C:/Work/TSST/TSST/core/rules.md` R49–R53, DS tokens, `npm run ds:check`. HeroUI v3 only.

## Where
Folder `C:\Work\tsst-portal-web`. First: `git switch -c dash-r8a-web main` (main = 8197418). Keep `web/qa/AUDIT-003/`
and `web/qa/R6/real/` untracked as they are. Read: `DASH-OWNER-NOTES-001.md`; code `web/src/components/AuthLayout.tsx`,
`web/src/components/WorkspaceBrand.tsx`, `web/src/components/ds/AppShell.tsx`, `web/src/components/ds/system.css`
(brand / topbar / auth parts), `web/src/pages/client/ClientShell.tsx`, `web/src/copy.ts`.

## Step 1 — brand, search, client header (N1, N2, N4, N5, N6, N7) (commit)
- "by The Systronic" is no longer plain text: it is a small lockup = "by" + our spark mark (`web/public/brand/mark.svg`,
  colours as in the file) + "THE SYSTRONIC" in Raleway, all caps (the font `.cshell__word` already uses). One
  component (e.g. `ByTheSystronic`) used everywhere it appears; `aria-label="by The Systronic"`.
- Sign-in (N1, N4): the wide DASH logo is centred across the card; the lockup small, right-aligned under the logo's
  right edge. Remove "For the team.".
- The lockup shows ONLY on the sign-in card and the expanded sidebar (under the logo, right-aligned, small).
  Hidden in the collapsed sidebar, the phone top bar and everywhere else (N2: today it wraps into 3 lines).
- Search (N5): a visible search field in the sidebar right under the logo (same search, same results). No floating box
  over the header, no search icon at the sidebar bottom. Collapsed sidebar = search icon in that same top spot that
  expands the sidebar with the field focused. Phone: field at the top of the drawer.
- Client page header (N6, N7): the client logo sits in a wide container (logos are wide), height that reads clearly,
  aligned to the header padding. When the client has a logo, show NO text name beside it (the logo is the title);
  the name shows only when there is no logo. Keep the accessible name (`aria-label` = client name, never ".").
Screenshots (4): sign-in 1440 dark; sidebar expanded + collapsed 1440 light; client page header with ANVIL logo 1440
light; drawer with search at 390 dark.

## Step 1b — two brand assets from Ahmed (add to the Step 2 commit, or its own small commit)
The Lead placed two untracked files in `web/public/brand/`; commit them with this change.
- `dash-icon.svg` (white, Ahmed's compact "Iconic DASH"): use it wherever the DASH logo is small — collapsed sidebar
  top and phone top bar — instead of the shrunken full wordmark. Height so it reads clearly (about 20–24 px), centred
  in the collapsed rail. On light surfaces draw it in ink like the workspace logo does.
- `mark-white.svg` (the spark, white): the "by THE SYSTRONIC" lockup uses it instead of the red `mark.svg`, and the
  whole lockup is bigger: spark about 18 px tall, "THE SYSTRONIC" about 13 px Raleway caps, "by" the same size,
  all white (ink on light surfaces), vertically centred on one line. Ahmed: last try — if it still does not read
  well we remove the lockup.
Screenshots (2): sign-in 1440 dark (lockup); collapsed + expanded sidebar 1440.

## Step 2 — heading system PROPOSAL (N3), no app-wide change yet (commit = proposal only)
Problem: page / section / card headings stack text before the title (`work/screens` group label), after it (file path,
"Approve ready items or request an edit.", "Campaigns and ads used…", "16 jobs shown", "Select up to 200 items…",
keyboard hint) and icons on their own line, so pages get long and the cards start far down.
- Write `web/qa/R8A/HEADINGS.md` (≤ 1 page): 3 levels (page / section / card), each = title (+ count) + optional icon
  + actions on the same row when they fit; short facts become icon + value in one row (e.g. 3 meta lines → 3 icons);
  which current descriptions go, which become a tooltip/info icon, which stay. Reflow rules at 1440 / 1024 / 390.
- Apply it to THREE screens only as the proof: Home, Jobs list, Job → Deliverables (card body included).
Screenshots (4): Home 1440 dark before/after (one image each); Deliverables 1440 light after; Jobs at 390 light after.
STOP after Step 2: Ahmed approves or corrects the proposal before Step 3.

## Step 3 — apply the approved heading system app-wide (commit)
Every remaining team and client page (Review, Reports, Clients, Settings tabs, job Overview / Log, client pages,
modals' headers) follows HEADINGS.md as approved. Remove the descriptions it marks for removal from `copy.ts`.
Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`.
Screenshots (3): Review 1440 light; Settings → Clients 1440 dark; a client page at 390 light.

## Reply (3 lines per step, Egyptian Arabic)
Step n done · gates pass / fail · open items.
