Skills used: TSST-CREATIVE-SK-030 (post-implementation UI audit: 8-shot matrix, per-shot verdict, must-fix list), TSST-CREATIVE-SK-026 (RTL: dock side, overlap geometry, chevron/bidi checks), TSST-CREATIVE-SK-023 (preview/master-detail: list context, identity visibility, header title, history). Skipped: SK-028 (covered by 375 shots).
Status: NOT_READY (skills UNVALIDATED). Read-only gate; no code edited. All px are estimates read off the 1440x900 shots.

# Preview slide-over, Leads first increment: CREATIVE gate

## 1. Verdict per shot
| Shot | Verdict | Defects seen |
|---|---|---|
| leads-en-light-1440 | PASS-WITH-FIXES | Panel x 980-1440 (460px). Cuts toolbar mid-word ("Co" of Density/Columns), hides "New lead" and the count, cuts 2nd KPI. Identity, Contact, Status columns stay readable. Edge is a bare hairline, no visible shadow. Header says "Lead details" instead of the record title. Selected row has tint plus start bar: good. |
| leads-en-dark-1440 | PASS-WITH-FIXES | Same as light. Panel and canvas are nearly the same dark, so the edge reads flat (F-F: no dark shadow token). |
| leads-ar-light-1440 | FAIL | Panel (x 980-1440) covers the sidebar (x 1214-1440, 226px) and about 234px of content. Page title cut to "ون". 1st KPI hidden, 2nd partly. Search box cut. Lead-name column (identity, ~x 730-1190) is about half hidden, and because Arabic text starts at the right edge every name is lost: rows 1-3 show no lead name at all, other rows show only "Hote/Zahr/Acm" fragments. The sidebar brand block shows above the panel and is chopped at y=56 ("CRM Wor..." cut), which looks broken. |
| leads-ar-dark-1440 | FAIL | Same as AR light. The brand peek is more obvious on dark. The selected-row full tint works, but it does not make up for losing the names. |
| leads-en-light-375 | PASS-WITH-FIXES | Full-screen sheet, Back at start, 44px-ish targets, no bottom nav bleed. Header label "Lead details" rather than the lead name. Browser Back does not close it. Large empty lower area is acceptable. |
| leads-en-dark-375 | PASS-WITH-FIXES | Same as light. Contrast and tokens fine. |
| leads-ar-light-375 | PASS-WITH-FIXES | Sheet is correct for AR (RTL layout, Back "رجوع" with chevron at the right start). Same header-label and history defects. Mixed AR/EN title and subtitle render correctly. |
| leads-ar-dark-375 | PASS-WITH-FIXES | Same as AR light. |

Verification of the Lead's observations: all confirmed. AR 1440 is worse than the pre-build estimate: I predicted ~165px of identity covered, the shot shows ~210px plus the title and KPI. Also confirmed: the sidebar brand block is taller than the 56px topbar, so the panel (top 56px) leaves its lower half visible and cut. The user's feared "damaged overall look" is real in AR 1440 only. EN is rough but not damaged.

## 2. AR: is D1 (overlay on the physical right) still right?
Geometry at AR 1440 (sidebar 1214-1440, content zone 24-1190, table 24-1190, identity column ~730-1190):
| Option | What the user sees | Verdict |
|---|---|---|
| (a) Current overlay, panel x 980-1440 | Sidebar gone, title/KPI/search cut, names invisible, brand stub. About 460px lost, of which 210px is content, and it is the most important 210px (name start). | Reject as built. |
| (b) Panel docked to the right but starting at the sidebar edge (x 754-1214), sidebar stays | Sidebar and brand intact. But the panel now covers the whole identity column plus the title, KPI and checkbox side: ~460px of pure content, 100% of names. Table visible x 24-754 (Created, Source, Owner, Status, Contact). Worse for identification than (a), better chrome. | Reject: hides all lead names. |
| (c) Reserve (`--sy-preview-reserve`, ~460px) | Table 1166px -> ~706px (x 24-730), 1-2 data-collapse columns drop, reflow snap on every open/close, title and KPIs squeezed. Names fully visible. Sidebar still covered (panel is physical right) unless combined with (b). This is the squeeze the user rejected. | Fallback only. |
| (d) Mirror the dock to the inline end (physical LEFT in AR, same logic as EN) | Panel x 0-460. Covers Created/Source/Owner columns, count, "New lead", the toolbar start and about 1/3 of KPIs, exactly the EN situation. Sidebar, brand, title, search and the whole identity column stay visible and untouched. No reserve, no reflow. Motion enters from the left (natural for RTL). | RECOMMENDED for AR. |
| (e) Keep right, but panel covers only below the sidebar header and sidebar collapsed to icon rail while open | Needs new sidebar behavior, still hides names. | Reject. |

Recommendation AR: (d), panel at inline-end (left in AR), mirror of EN; overlay, no reserve. The user will see: the table, names and sidebar exactly as when closed, and a panel sliding in from the left with the record on the opposite side from the nav. This overrides the literal "from the right" part of D1, so it needs the USER's decision (the wording was explicit; the evidence now contradicts it). Offer a one-line choice: "panel on the left in Arabic (recommended) or on the right with the squeeze". If the user insists on the physical right: ship (a) plus must-fix items 2-4 below and enable (c) at widths <1680 only, accepting the squeezed table.
The 375 sheet is not affected: it stays full-screen from the right in both languages (D5 and the screenshots are fine).

Recommendation EN: keep the overlay at inline-end (right), as built (no reserve). The user will see: table unmoved, Lead/Contact/Status readable, Owner/Source/Created, "New lead" and the toolbar end covered while the panel is open; Esc/outside click restores. Lead-level fix only (shadow, title, width), no user decision.

Decision split:
- USER decision: AR desktop panel side (left, recommended, vs right with squeeze).
- Lead-level fixes: everything else below.

## 3. Must-fix for DEV
1. `.sy-preview` (desktop panel) in AR: dock to `inset-inline-end:0` (physical left in AR) instead of physical right, and flip the entry keyframe to come from that side. Keep the 375 sheet from the right in both languages. If the user rules "right", instead keep physical right and set top below the sidebar header too (see 2). Required result: at AR 1440 no sidebar, title, KPI or name column is covered.
2. Sidebar brand clip (only relevant if the panel stays over the sidebar, but fix regardless): sidebar header height must equal `--sy-topbar-h` (56px) so a panel starting at `top:var(--sy-topbar-h)` cannot reveal a half block. Required result: no half-cut brand/"CRM Workspace" line at any width.
3. Panel edge treatment: add `--sy-shadow-panel` (light and dark values, cast horizontally toward the content, `-12px 0 32px` dark-heavier) and a 1px `--sy-border` on the content-facing edge. Required result: edge clearly visible in dark EN/AR (currently flat) and in light.
4. Panel width: use `clamp(360px, 30vw, 440px)` at 1440 (432px), and never cover the "New lead"/page title in EN where possible; at minimum keep `padding` so the table's selected row stays visible. Required result: EN 1440 still shows Lead, Contact, Status and the 2nd KPI fully.
5. Header label: show the record title (`<bdi dir="auto">`, single-line ellipsis) in the panel/sheet header instead of "Lead details" (keep "Lead details" as an aria-label or small eyebrow). Required result: the 375 header and the 1440 header show the lead name.
6. Browser Back at 375: opening the sheet must push history (`?preview=<id>` state); Back/swipe-back closes it and keeps list scroll/filters. Required result: Back from an open sheet lands on the list with the sheet closed.
7. Exit animation: add the exit transition (transform+opacity, 150-200ms, reduced-motion = fade only), same direction as entry; unmount after `transitionend`. Required result: no pop-out.
8. z-order: raise `.sy-menu/.sy-popover` above the panel (Columns/row menus must not open under it); verify Columns button remains reachable when the panel is open in EN (it is partly covered today: user must be able to close first, acceptable, but menu must not render beneath).

## Nice-to-have
- EN: when the toolbar end is covered, the cut "Co" reads as a bug; consider `inert` + slight dim (scrim 0-8%) on the covered table region, or hide the toolbar-end overflow with a fade, so occlusion looks intentional.
- Selected row: keep the full-row tint (works) and `scrollIntoView({block:"nearest"})`; check that the row is not under the panel in AR if the user keeps the right dock.
- Row hover/cursor affordance while the panel is open; focus returns to the originating row on close.
- 375: show the position ("6 of 8") and Prev/Next in the sheet header (present at 1440, absent at 375), or confirm it is intentionally omitted.
- Verify 1920 AR dark and 820 tablet (full sheet) after the fixes; re-shoot the 8 shots plus these 2.
- Record the guard-rail regression check (PREVIEW_IMPACT_CREATIVE section 4) against `shots-b1` after fixes.

## Gate outcome
Overall: FAIL for AR 1440 (as built), PASS-WITH-FIXES for EN 1440 and all 375 shots. Contacts/Tasks/Reporting must not start until AR 1440 passes a re-shoot after the user decides the AR dock side and fixes 1-7 land.

skill_friction: SK-023/026 do not say whether an RTL side panel should mirror to the inline end or keep the physical dock; this report supplies the rule (mirror when the nav sits on the dock side).
