# BRIEF · THEME-HEROUI-1 — Systronic theme on HeroUI (live prototype)
ROLE A — team runtime (Codex as CREATIVE_AG, TEAM studio). Follow AGENTS.md → boot.md. Owner approved 2026-10-09: the round, HeroUI as base, and `npm install` in a scratch folder.

**Read first:**
- `TSST/brands/t-sag/projects/crm/redesign/DECISIONS.md`: D-05 menu, D-08 HeroUI, D-09 palette, D-10 digits.
- `TSST/brands/t-sag/assets/IDENTITY.md`: the bolt mark, the red bar above headings, three dots, Poppins.
- Logos: `TSST/brands/t-sag/assets/final/logo/`.
- Spirit reference: screenshot `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/social-setup-01/DELIVERY.html`. Do not read its 2 MB body.
- Anti-reference (generic, rejected): `redesign/03a_THEME/qa/desktop-light-ar.png`.
- Owner hates heavy black, divider lines everywhere, and buttons sitting on lines.
- Optional: `~/.claude/skills/impeccable/reference/craft-floor.md`.

**Verify first** on official heroui.com pages: the licence, the exact v3 version, RTL support, the theming method, and component coverage (table + selection, select/combobox, date, file, drawer, tabs). If the licence or RTL fails, `block` with one question.

**Build:** a scratch app at `C:\Work\tsst-crm-theme-proto`, outside Drive. Use Vite + React + TS + Tailwind v4 + HeroUI v3. Pin exact versions, and use `base: './'` so the build opens from file://.

**Palette (D-09, only these):**
- Royal Blue `#00338D`: primary, links, selected, chart series 1.
- Impact Red `#C60C30`: heading bar, active-nav indicator, active-tab underline, chart series 2, "needs attention". Danger always pairs red with an icon and a word.
- Legacy Blue `#002244`: sidebar, sign-in panel, base of dark mode lifted (never #000), chart series 3.
- Crisp White `#F2F3F3`: light canvas.
- **Cyan:** derive one that matches the others' mood (OKLCH chroma and lightness in their band). Give the recommended hex plus 2 alternates and the method; it is chart series 4 and a detail accent.
- Beyond those, tints and shades only. Write a **state matrix** (rest, hover, pressed, selected, focus, disabled) for each interactive role, in light and dark.

**Screens:**
- Shell: sidebar with the D-05 menu in AR/EN and the white bolt logo; top bar with the client switcher, search and "+ New".
- Sign-in.
- Leads list: saved views, toolbar, a table with selection and a bulk bar, status chips, mixed AR/EN names.
- Dashboard top: KPIs with the CRM vs Platform split, one chart, an attention row, and the not-connected state.
- Toggles for AR/EN (dir) and light/dark. Western digits. Poppins + IBM Plex Sans Arabic. HeroUI components only; no native controls.

**QA (bounded: shoot once, fix once, re-shoot once):**
- `npm run build` must pass.
- Playwright shots: Leads at 1440/375 × light/dark × AR/EN (8 shots), plus Sign-in and Dashboard at desktop light-AR and dark-EN (4 shots).
- DOM checks: horizontal overflow, native controls, computed contrast (≥4.5:1 text, ≥3:1 UI).
- The Lead does the visual review.

**Write only** `TSST/brands/t-sag/projects/crm/redesign/03d_THEME_HEROUI/`:
- `DESIGN.md`: palette roles, cyan, state matrix, chart order, type, radius, elevation, line policy, brand signatures, contrast table, verified HeroUI facts with URLs, and exact versions;
- `theme/`: the HeroUI config and a tokens.css copy;
- `preview/`: the built dist;
- `qa/`: the shots and `QA.md`.

Do not touch the CRM app, `local-auth-demo.json` or git. Report `Skills used:` and `skill_friction:`.
