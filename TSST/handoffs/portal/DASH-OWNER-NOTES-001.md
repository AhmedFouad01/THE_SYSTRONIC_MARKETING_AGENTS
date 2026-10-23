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
| N8 | Package model (Starter Pack $300: social management, 3 campaigns, 10 ads, 100 work hours/month) | Add **edit credits**: each package has a monthly number of edit credits; each Request edit uses credits. Amounts per package are configurable (Ahmed does not know the right numbers yet). | R8 |
| N9 | Time tracking | Every deliverable has time: spent and expected. AI-made items count by their (estimated) time. Ahmed can also enter time by hand. Shows in reports and against the package hours. | R8 (data) / R10 (reports) |
| N10 | Bonus | Ahmed can open a bonus for a client for a set period (extra credits/hours/items); shows next to the package details. | R8 |
| N11 | Client header = package infographic | The client page header shows everything about the package: plan, used vs included (campaigns, ads, hours, edit credits), bonus and its end date, what was delivered. Infographic, almost no sentences (clients don't read). Needs a pro UX/UI proposal (desktop + phone) approved by Ahmed before build. | R8 |
| N12 | Business question | Is 100 hours/month for $300 right? Ahmed is unsure. Decide numbers separately; the system keeps them editable. | open |
| N13 | Review actions everywhere | Approve / Request edit are huge full-width pairs. Make them small, on the thumbnail / title row; labels "Approve" and "Edit" only. Approve = light Bootstrap green (#28A745), Edit stays red. (rules R49 / R51 updated 2026-10-24) | R8B |
| N14 | Review card | Reorganise the card (UX): clear order, no scattered chips and rows. | R8B |
| N7 | Client page header title | The page forces a title next to the logo, so Ahmed typed "." (the logo already is the title). When a logo exists, no text name beside it; the name is used only when there is no logo. | tbd |
| N15 | Domain | Ahmed registered DuckDNS `systronic` → 54.93.60.74 (checked 2026-10-24: `dash.systronic.duckdns.org` resolves). Move Dash to `https://dash.systronic.duckdns.org`; old `portal.the-systronic.duckdns.org` 301-redirects (old client links keep working); PUBLIC_ORIGIN + runbook updated; ship with the R8 deploy (one re-sign-in). | R8 deploy |
| N16 | Structure | Client → Projects → Jobs. Projects live inside the client account; jobs live inside projects. Some projects are lifetime (always on), campaigns have dates. | R9 (model) |
| N17 | Drive | Jobs still appear/sync from Google Drive. Stop it: the Dash is the source; Drive at most a manual import. | R9 |
| N18 | Admin Clients page | Cards are broken: logos overlap the name and "No package", rings misplaced. Redo. | R9 |
| N19 | Client access | A link cannot be opened again after sending; any change needs a new link; Ahmed cannot see what the client sees or does. Wants a persistent client profile/account linked to the client, not throw-away links. | R9 |
| N20 | Client profile control | Owner decides what each client sees (show/hide sections, projects, package, billing). | R9 |
| N21 | Marketing plan infographic | Per client: where we are in the plan; each campaign's goal stage (Awareness / Acquisition / Activation / Conversion); campaign dates. | R9 |
| N22 | Bonus + billing pages | The bonus as built and the billing page are not useful as they are. Rethink inside the client profile. | R9 |
| N23 | Review bulk | Select several items → bulk Approve / bulk Edit; filter by Approved (and other statuses). | R9 |
| N24 | Workspace name | Settings → Workspace still forces "Product name" (Ahmed typed "."), and the preview shows "." beside the logo. Same rule as N7: logo = title, name optional. | R9 |
| N25 | Titles | Internal titles leak into cards (e.g. "SCOPE v1 (frozen once Ahmed approves)"); Review cards repeat long job context. | R9 |
