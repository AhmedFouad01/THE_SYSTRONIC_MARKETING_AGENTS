# Rules pack — products, code, UI

Load for product, CRM, SCC or any build work. Core rules still apply.
Original wording: `TSST/decisions/rules-history.md`. DEV_AG: `TSST/DEV/AGENT.md`.

- **R30 Plan first, light reviews.** Spec before build; per-slice checks stay light; heavy reviews
  (security, full UI, AR/EN visual gate) only pre-launch.
- **R39 No native controls.** No product ships browser-native unstyled controls (file, date,
  colour, range, select, checkbox); styled kit components only, stated in every UI brief.
- **R55 UI quality bar** (owner 2026-10-27: Ahmed's repeated fixes). Every Dash/CRM screen passes all
  10 before the Lead shows it; one fail = returned, not patched. The Lead judges the look, not only the numbers.
  1. Design the whole screen, never patch a fix list: one grid, aligned edges, clear reading order;
     fields in one row share height and baseline.
  2. Heading stack: title first, its actions on the title row, no text before or after it, icons in one row.
  3. Order by importance: what needs action comes first; numbers with context (used / max / left);
     numbers and chips over sentences.
  4. One action, one control: no two buttons or links for the same thing; one review decision per item,
     no scattered chips or rows.
  5. Logos: transparent, no white plate, frame or border. A logo is the title: no name beside it.
  6. Words: every label, chip and column says what the user means in plain words ("Progress 40%", not
     "Calendar elapsed"); no internal names, IDs, process words or tool names on screen; client-facing
     pages formal, one language.
  7. Controls: HeroUI only (R50), no native controls (R39); text in selects, list items and buttons
     vertically centred; one radius scale.
  8. Look: no borders (R53); buttons and colours exactly R51; status words R49.
  9. Done only when visibly right at 1440 / 1024 / 390, light + dark, real-length data; no half-finished
     screen; settled owner decisions are not reopened.
  10. Theme-ready: every colour, radius, font, shadow and spacing comes from the active theme's tokens,
     nothing hard-coded in screens. A theme = one folder (tokens + its rules); a new theme plugs in by
     setting, with no screen edits.
- Merging to master, deployment and publication stay reserved (`TSST/TSST_DECISION_RIGHTS.md`).
