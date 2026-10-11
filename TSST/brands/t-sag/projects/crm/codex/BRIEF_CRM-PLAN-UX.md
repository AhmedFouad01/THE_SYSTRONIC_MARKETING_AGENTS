# BRIEF CRM-PLAN-UX — sidebar/IA restructure + import and dashboard screens (spec)

**Agent:** tsst-creative (product UX). **Tier:** WORK (gpt-6.1-sol · medium). **Mode:** spec only: no code, no image renders, no test runs.

## Context
- The T-SAG CRM serves Ahmed's marketing agency and a per-client CRM, with one tenant per client and agency staff switching between client tenants. We compete with HubSpot, using public patterns only.
- Rules:
  - Arabic is complete RTL, and motion comes from the right.
  - Mixed AR/EN text must never break.
  - EN is equally first-class.
  - Light and dark themes, with the `--sy-*` tokens.
  - Desktop 1440 and mobile 375.
- Ahmed says the current sidebar sections need regrouping and nesting.
- The upcoming modules need a place in the nav:
  - Import;
  - Dashboard (charts);
  - Segments;
  - Journeys/Tracking;
  - Integrations (Meta/Google/TikTok);
  - Users & roles;
  - Settings (properties, security).

## Read (read-only)
- `C:\Work\tsst-crm-mvp\CRM_APP`, branch `feat/crm-mvp-ui`:
  - `MVP_INFORMATION_ARCHITECTURE.md`;
  - `MVP_SCREEN_INVENTORY.md`;
  - the current sidebar/nav component under `app/` (find it with one grep for the nav/sidebar);
  - `IMPORT_CONTRACTS.md`;
  - `CHARTS_CONTRACTS.md` (including §6: weeks start on Saturday, browser timezone).

## Deliver `TSST/brands/t-sag/projects/crm/specs/NAV_AND_SCREENS.md`
Keep it to about 2,500 words or less, and prefer tables to prose. It must contain:
1. **Final sidebar tree:**
   - groups, the children of each group, and the order;
   - AR/EN labels;
   - icons (by name from the existing icon set);
   - the permission gating per role (manager, rep, reader);
   - the agency tenant switcher placement;
   - which items are "coming soon" versus live today;
   - collapse and mobile behaviour.
2. **Import screens:** upload → mapping (including custom properties) → preview with row errors → duplicate policy → result. Cover the states (empty, loading, error, partial) and the AR/EN copy keys.
3. **Dashboard:**
   - the widget grid per role, using CHARTS_CONTRACTS C1–C5;
   - the Chart.js 4.5.1 settings for RTL legend and tooltip, Arabic digits and token colours (light/dark);
   - an aria-label plus a data-table fallback;
   - the empty states.
4. **Migration notes:** the routes or labels that change, and anything to keep for back-compat.

## Budget rules (mandatory)
- No web browsing. Use the repo docs only.
- Read only the files listed above. One pass, with no self-review loops. Stop after `done`.
- `done --skills-used` must list the skills you applied.
