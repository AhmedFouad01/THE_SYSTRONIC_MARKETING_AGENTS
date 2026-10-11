# QA round 2 (CREATIVE_AG, bounded: shoot, look, fix once, re-shoot once)

Build: `npm run build` = `tsc -b && vite build`, passes. Rendered from the built `dist` over file:// in Chromium (Playwright). Before each shot the script asserts `html[data-theme]` and `html[dir]` equal the requested state (a mismatch throws), so no mislabelled shots (round-1 defect 1).

## The 12 required shots (+2 extras)
Leads 1440 and 375 x light/dark x AR/EN (8): `leads_{1440|375}_{light|dark}_{en|ar}.png` (bulk bar visible in `leads_1440_dark_en` and `leads_1440_light_ar`).
Sign-in: `signin_1440_light_ar.png`, `signin_1440_dark_en.png`. Dashboard: `dashboard_1440_light_ar.png`, `dashboard_1440_dark_en.png`.
Extras: `extra_leads_empty_1440_light_en.png`, `extra_dashboard_375_dark_ar.png`, `extra_more_sheet_375_light_ar.png`. Raw numbers: `report.json`.

## Found in the first batch and fixed in the one batch
1. Mobile top bar overflowed 375 (new button label, theme, language, avatar); fixed: label and prefs hidden, prefs moved into the More sheet.
2. Horizontal overflow at 375 from the toolbar (4-18px) and the dashboard chart panel (321px, grid min-content); fixed (`minmax(0,1fr)`, shrinking toolbar search, filter icon-only).
3. Sign-in watermark invisible in light (navy on navy); now always the white mark on the brand panel.
4. Chart in AR mirrored the time axis (W40 on the left); time axis now LTR in both languages, markers padded away from the y-axis.
5. Phone in mobile AR cards aligned to the wrong edge; fixed (`align-self: flex-start`).
6. Avatar "NS" light grey on light; recoloured to Legacy Blue / lifted Royal.
7. CRM source marker in AR wrapped ("إدارة العملاء"); now "CRM".
8. Search placeholder clipped on mobile; shorter copy; AR headline orphan; `text-wrap: balance`.
9. Bottom bar labels wrapped unevenly in AR; aligned to top.
10. Shots at 375 were full-page so the fixed bottom bar floated mid-image; now viewport shots.

## DOM checks (second batch, all 14 renders)
- Horizontal overflow: 0 px in all 14 (the tab strip scrolls inside its own container by design).
- Native controls: none visible. The only native element found is HeroUI Select's visually hidden `<select>` (a11y/form mirror).
- Dark surfaces: every opaque surface bg is blue-family (not grey) and not darker than `#002244`; 0 offenders in the 7 dark renders (accent chips/dots excluded from the surface test).
- Computed text contrast: 1081 visible text nodes checked, effective background resolved through ancestors, thresholds 4.5 (3 for large): 0 failures. UI components (>= 3:1) measured by hand, see DESIGN.md section 8.
- Fonts: Poppins 400-700 and IBM Plex Sans Arabic 400-700 reported loaded from the file:// build.
- Console errors: 0.

## Remaining / not done
- Eyeballed only the shots listed as looked-at in the report; light AR/EN mobile and dark AR mobile Leads were checked by DOM only after the batch, not re-read pixel by pixel.
- Colour-blind simulation not run (shape, word and icon cues carry every status).
- Mobile cards have no row selection; menu items other than Dashboard and Leads are inert; no tooltip on the chart; RTL keyboard order not tested by hand.
- Bidi mixed names ("Karim Nabil كريم نبيل", "ليلى Mansour") render with dir="auto" and read correctly in both directions.

## Round 3 (D-11 brand block, contact fixes)
Sidebar brand block (mark + Raleway wordmark + version, status, manager) and a compact lockup in the 375 More sheet. All 14 renders re-shot: 0 overflow, 0 console errors, 0 text-contrast failures. The brand block is the one surface darker than `#002244`, by decision D-11 (`#001A35`); the dark-surface audit excludes it. Contact page: mixed AR/EN note split into per-sentence `bdi` isolates; highlights email is one line with ellipsis, LTR isolate and a HeroUI Tooltip with the full value.

## Round 4 (D-12 brand block from Ahmed's mock)
Block rebuilt to the mock: status + red version badge on top, large bolt, one-line wordmark, product name with three dots, Manager pill. Re-shot all 14 renders plus 4 contact shots: 0 overflow, 0 console errors, 0 contrast failures. Wordmark fits on one line at 1440 and in the 375 sheet (checked by measurement and by eye).
