# DASH-OWNER-NOTES-001 — Ahmed's walk-through notes (2026-10-23)

Raw owner notes from a live walk-through. Round (R8/R9/other) and how to build each one are decided with Ahmed after the list is complete.

| # | Where | Note | Round |
|---|---|---|---|
| N1 | Sign-in card (`auth__brand`) | The DASH logo is wide: center it across the card (not left/right aligned). "by The Systronic" sits small, under the logo's end (right edge). It should NOT appear everywhere. Ahmed 2026-10-23: it is a lockup, not text = "by" + the Systronic spark (`web/public/brand/mark.svg`) + "THE SYSTRONIC" in Raleway caps. Places (Lead default, Ahmed may change): sign-in card + expanded sidebar only. | R8A |
| N2 | Sidebar brand (`brand__prod`), collapsed sidebar | Same rule as N1: when the sidebar is narrow the tiny logo shows "by / The / Systronic" wrapped on 3 lines. Hide it there (it stays only where Ahmed says). | tbd |
| N3 | Whole app: page / section / card headings | Heading stack is wrong everywhere and makes pages very long: text before the title (e.g. `work/screens` group label), text after it (file path, "Approve ready items or request an edit.", "Campaigns and ads used…", "16 jobs shown", "Select up to 200 items…", keyboard hint), icons on their own line. Need ONE heading system, designed with UX/UI judgment (not a rigid template that breaks on phone or other widths). Principle: no full line spent on two words, no explanation that adds nothing; short facts that an icon can say become icon + value (e.g. 3 meta lines → 3 icons side by side in one row); actions on the title row where they fit; it must reflow cleanly at 1440 / 1024 / 390. The exact patterns come from a UX pass (designer proposes, Ahmed approves), not from the Lead. Goal: reach the cards without scrolling. | tbd |
| N4 | Sign-in card | Remove the "For the team." sub-line under "Sign in" (example of N3). | tbd |
| N5 | Top-bar search (`topbar__search is-open`) | Today it is an icon at the bottom of the sidebar that opens a floating box over the header. Move search into the drawer/sidebar right after the logo, as a visible field (not hidden behind an icon). | tbd |
| N6 | Client page header | The client's logo is far too small. Logos are wide: give the logo a wide container so it reads well, aligned to the header's margin/padding. | tbd |
| N7 | Client page header title | The page forces a title next to the logo, so Ahmed typed "." (the logo already is the title). When a logo exists, no text name beside it; the name is used only when there is no logo. | tbd |
