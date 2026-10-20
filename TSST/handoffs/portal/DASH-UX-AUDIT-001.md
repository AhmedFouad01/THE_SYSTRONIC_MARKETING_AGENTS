# DASH-UX-AUDIT-001 — strict UX/UI pass after release 5b6862cae (2026-10-20)

Source: Ahmed's live screenshots (Clients, team Home 1920, client Home, Settings → Clients, Visibility) + his notes.
Rules in force: R39, R49, R50, R51, R52, R53. Severity: **P1** broken / confusing, **P2** clearly wrong, **P3** polish.
Each item: problem → fix → done when.

## A. Layout and grid (all team screens)
1. **P1 Home content is not aligned with the page.** At 1920 the header band is full width but the cards start ~180 px
   to the right of it, leaving a dead strip by the drawer. → One page container for every screen: fluid, max 1600 px,
   24 px gutters, content starts at the same left edge as the header text. → Home, Clients, Settings all start on one
   left line at 1536 and 1920.
2. **P1 "Waiting for review" is a scroll box with vertical AND horizontal native scrollbars.** → No inner scroll: show
   the 5 newest items, then "Show all (940)" linking to Review. No horizontal overflow anywhere (titles truncate with
   tooltip). → No scrollbar inside any card; Playwright check `scrollWidth <= clientWidth` on every card.
3. **P2 Cards stretch to fill instead of fitting content** (one package card 850 px wide with rings 400 px apart;
   empty "Approvals trend" card as tall as the donut). → Grid of fixed-ratio cards (min 320, max 420 px), rings close
   together; empty states are compact (one line + icon), not full-height cards.
4. **P2 Card heights in one row differ** (Clients page: cards with 3 lines vs 2). → Equal-height rows, actions pinned
   to the card bottom.

## B. Buttons
5. **P1 Full-width buttons** (Save visibility, Create plan, View client, Save client…). → Buttons hug their label
   (min 96 px); form actions sit bottom-right; full width ONLY below 640 px. Sticky save bar = right-aligned button,
   not a full-width bar.
6. **P1 Colours too saturated.** Neon `#00BEF6` / `#FF003C` as large fills glare on navy. → Keep the hues, lower the
   saturation for FILLS: Approve dark `#0A9BD0`, Request edit `#E0264B`, hover one step deeper; neon stays for small
   accents only (dots, pulse, focus). Ahmed approves the exact values from a swatch sheet before the build (R51 update).
7. **P2 Pair order differs** (team: Approve | Request edit; client: Request edit | Approve). → Everywhere: Request edit
   left, Approve right. **P3** "Approved" shown twice (chip + button) → chip only once decided.

## C. Drawer, logo, footer
8. **P1 Footer repeated 2–4 times** (drawer bottom, page bottom, card footers). → ONE footer: page bottom only, one
   line, muted. Drawer bottom holds nothing but the user / theme controls.
9. **P1 Drawer header = the Dash logo.** → Top of the drawer: Dash logo (from Settings → Workspace, dark-theme logo) and
   under it "by The Systronic" (small, muted). Nothing else there.
10. **P1 Logos are forced into a white frame.** → Logos render as uploaded on a transparent background (no white plate,
    no border); a white logo stays visible on navy. Only a missing logo gets the initial-letter tile.
11. **P2 Active nav item has a light stroke** (Home outlined in cyan). → R53: raised fill + light-blue text, no outline.

## D. Client page
12. **P1 Job cards are too big and the cover crops square images into a thin wide strip.** → Smaller cards (4 per row
    at 1536, 2 at 390), cover area 4:3 with `object-fit: contain` on a neutral tile so a square post shows whole.
13. **P1 Header is weak.** Dark tiles on a saturated brand band (orange) look heavy and the brand colour fights the
    tiles. → Brand colour as a thinner band (logo + name + industry) and the tiles on the page surface below it, or
    tiles in a translucent white-on-colour style; choose one in a 2-image swatch before building.
14. **P2 Empty / unset states take full tiles** ("Period not set", "0 of 0 reviewed", "No milestone"). → One quiet line
    inside a compact tile; hide rings when the package has no start date.
15. **P2 Long package names wrap into 2 big lines** ("Starter Pack - 300$"). → Name on one line (truncate + tooltip),
    price on its own smaller line from the plan currency.

## E. Content
16. **P2 Team lists show raw file names** (`bce9394f-…-2a41103132f1.png`). → Use the clean title (same cleaner as the
    client view) as the main line; path/file name small and muted on a second line.
17. **P3 Settings → Clients:** "Choose colour" chip + "Hex colour" label cramped on one line; preview must use the
    saved header colour (it showed royal while the client page is orange).

## F. Logo file (Ahmed)
18. **P1 `DASH1.svg` / `DASH2.svg` use live text in the font "Stretch Pro"**, not shapes. Browsers and the server do not
    have that font, so the logo renders in a fallback font. → In Illustrator: select the text → Type → Create Outlines,
    then export SVG (white version for dark, dark version for light). Then upload both in Settings → Workspace.

## Order and cost (one build round, R52)
Round 1 (one runtime, one commit): items 1–5, 7–12, 14–17 (layout, buttons, drawer, footer, logos, client cards,
content). Before it: one swatch sheet for items 6 and 13 (2 images), Ahmed picks. Item 18 = Ahmed.
Checks: web typecheck + lint + live build; Playwright overflow + alignment checks; screenshots 1536 + 1920 (team),
1536 + 390 (client), light + dark, changed screens only (max 8).
