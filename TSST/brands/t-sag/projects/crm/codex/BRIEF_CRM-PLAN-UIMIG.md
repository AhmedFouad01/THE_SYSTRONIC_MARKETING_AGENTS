# BRIEF CRM-PLAN-UIMIG — migrate CRM UI to React Aria Components + Tailwind (plan only)

ROLE A (TSST team runtime). Agent: tsst-dev, with product-UX input from NAV_AND_SCREENS. Tier: CODE (gpt-6.1-sol · high). Plan only: no installs, no code.

## Why
- Ahmed reviewed the merged app (2026-10-08) and found alignment, layout and visual-consistency problems ("بهدلة").
- He decided the UI moves to **react-aria-components + Tailwind** now, **before** segments. The dependencies are approved; pin the exact latest stable versions in the plan.
- Sign-in pages B7/B8 are built directly in the new stack.

## Read
- `C:\Work\tsst-crm-mvp\CRM_APP`, branch `feat/crm-mvp-ui`:
  - the `app/` tree (components, shell, styles, i18n);
  - `MVP_VISUAL_FOUNDATIONS_LOCK_v0.1.md`;
  - `CRM_UI_FOUNDATIONS_v0.1.md`;
  - the `--sy-*` tokens;
  - `AUTH_PLAN.md` (the B7/B8 rows).
- `TSST/brands/t-sag/projects/crm/specs/NAV_AND_SCREENS.md`
- `TSST/brands/t-sag/projects/crm/review/` (Ahmed's screenshots and notes, if present)

- **Prior art: the YAKEBDA_MS UI audit (P0–P3/P4 decisions, July 2026).** Reuse its decisions; do not re-derive them. These are readable `.md` sources:
  - `G:/My Drive/Yakebda_MS_Newmap/YAKEBDA_MS/02_PROJECT_MEMORY/PROJECT_DECISIONS.md`
  - `G:\My Drive\Yakebda_MS_Newmap\CHAT_SYNC__YAKEBDA_MS__2026-07-17__REPORTING_PR44_AUDIT_AND_FIXES.md`
  - `G:\My Drive\Yakebda_MS_Newmap\PROJECT_MEMORY_MAP__YAKEBDA_MS__2026-07-12__TECH_AUDIT_PR10.md`
  - any `.md`/`.txt` exports Ahmed drops into `TSST/brands/t-sag/projects/crm/review/yakebda/`
  - **Main source, if synced:** the folder `G:/My Drive/Real Memory/**/GDocs_to_MD — YAKEBDA MS/` (69 converted docs). Read its `INDEX.md` first, then ONLY the UI/UX, layout, theme, QA and audit-remediation P0–P4 docs it lists. Read at most 8 files.

  Skip `.gdoc` files; they are unreadable here. In section 3, add a short "Adopted from YAKEBDA audit" list. These are UI/UX and layout lessons only; never mix YAKEBDA data or brand into the CRM.

## Deliver `TSST/brands/t-sag/projects/crm/specs/UI_MIGRATION_PLAN.md` (≤ 2500 words)
1. **Stack setup:**
   - the Tailwind version and Vite plugin;
   - mapping the `--sy-*` tokens into a Tailwind theme (light and dark);
   - logical properties and RTL (`dir`, `ms-`/`me-`, `start`/`end`);
   - fonts and Arabic digits;
   - the RAC `I18nProvider` with locale `ar-EG` / `en`;
   - how the old CSS is retired. Prefer coexisting during the migration, then deleting it.
2. **Component kit:** a small in-repo kit on RAC + Tailwind, covering Button, TextField, Select/ComboBox, Dialog/Sheet, Menu, Tabs, Table/Grid wrapper, Toast, DatePicker, Checkbox, Badge and EmptyState. For each, list its states, focus ring and RTL notes.
3. **Layout system:** the shell grid, spacing scale, page header pattern and alignment rules that fix the reported "بهدلة" class of issues. Include a short list of rules a reviewer can check.
4. **Ordered task list for Codex.** Each task is about 1–2 hours, with files, checks C (lint, typecheck, test:unit, build) and done_when. The order is:
   - (a) setup + kit;
   - (b) shell/nav;
   - (c) B7 sign-in page and B8 invite/reset/users pages on the new kit;
   - (d) dashboard;
   - (e) import;
   - (f) the lists/grids and record panels;
   - (g) delete the old CSS.
   Keep the behaviour and tests unchanged. This is a UI-only swap.
5. **Risks:** 5 at most, for example bundle size, grid virtualization and test selectors.

## Budget
Read only what is listed; one pass; no web browsing beyond the npm versions. Then run `bus done --skills-used` and stop.
