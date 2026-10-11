ANTIGRAVITY REQUEST GEM-CRM-004 · t-sag · crm (C2 wireframes, TRIAL: one page) · from TSST Lead · 2026-10-09
SURFACE: Antigravity
OBJECTIVE: A trial of one block wireframe, the **Contact record + journey** page, on the approved Systronic/HeroUI theme. Ahmed compares the quality before deciding who draws the other ~24 pages.

## Steps for Ahmed
1. Keep the Antigravity settings from last time: Turbo + the deny list (rm, rmdir, del, Remove-Item, git push/commit/reset/clean).
2. Open a NEW Antigravity conversation on the project folder.
3. Paste everything inside the PROMPT block, and tell the Lead when it finishes.

## PROMPT

```text
ROLE: EXTERNAL TOOL — build one UI block wireframe. You are NOT a TSST agent: do not claim TSST roles, do not run the TSST boot, do not create bus tasks, do not commit.

SETUP (isolation)
Copy the theme prototype C:\Work\tsst-crm-theme-proto to a NEW folder C:\Work\tsst-crm-wire-trial (exclude node_modules, dist, test-results). Then run npm install there. Work ONLY in that new folder. Never edit C:\Work\tsst-crm-theme-proto.

READ (only these, in G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\)
1. TSST/brands/t-sag/projects/crm/redesign/03b_PAGE_REDESIGN_REPORT.md — sections "0. Shared patterns" (0.1–0.7) and "4.3 Contact / lead record with journey timeline". This is the plan you are drawing.
2. TSST/brands/t-sag/projects/crm/redesign/02_SPARK_SCREEN_DATA.md — section "2.2 CRM", only the rows about the contact/lead record and the journey (fields, events, source fields, consent).
3. TSST/brands/t-sag/projects/crm/redesign/03d_THEME_HEROUI/DESIGN.md — the theme rules, including "Logo usage" (7b). Follow them exactly.
4. The prototype source in your new folder: src/ (shell, sidebar, top bar, i18n dictionary, tokens). Reuse the existing shell, tokens and components. Do not restyle anything.

UI LIBRARY (mandatory): the project is built on HeroUI v3 (@heroui/react 3.2.6, on React Aria Components + Tailwind v4). Build every control and container with HeroUI components (Card, Chip, Tabs, Button, Avatar, etc.). Do not add another UI library and do not hand-roll a control HeroUI already has. HeroUI v3 uses compound components (e.g. Tabs > Tabs.ListContainer > Tabs.List > Tabs.Tab + Tabs.Indicator), so check the real API in node_modules/@heroui/react types and in the existing src/ before writing; do not guess from v2 docs.

WHAT TO BUILD
A new view "contact" (URL: ?view=contact&theme=light|dark&dir=ltr|rtl), inside the existing shell, with Leads still active in the sidebar.
It is a BLOCK WIREFRAME, not a finished page:
- Every region from section 4.3 is a labelled block on the theme surfaces. Each block shows: (a) its name, (b) one line on what it is for, (c) the fields/items it contains as short grey placeholder lines or real field names (from the SPARK rows), and (d) the primary action of that region where 4.3 names one.
- Use the order and placement from 4.3 and 0.4 (header + actions, highlights strip of up to 6 items, the three regions, the journey timeline with People / System chips, the consent and source cards).
- Bilingual: every label in the AR/EN dictionary. Western digits. Logical CSS properties only, so RTL mirrors correctly.
- 375px: the stacking order from 4.3 / 0.4 (no horizontal overflow).
- Theme rules: no native controls, no neutral grey or black surfaces in dark mode, no button sitting on a line, one logo per screen (the sidebar mark only), a red bar beside the page title.

QA (bounded: build, shoot, look, fix once, re-shoot once)
- npm run build (tsc -b && vite build) must pass. Do NOT remove the tsc step.
- Use the existing qa/shoot.mjs approach (URL params, assert data-theme and dir before each shot). Make 4 shots: contact_1440_light_ar, contact_1440_light_en, contact_1440_dark_en, contact_375_light_ar.
- Check: 0 horizontal overflow, 0 console errors, text contrast ≥ 4.5:1.

WRITE (only)
- Source: C:\Work\tsst-crm-wire-trial
- Deliverables: G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\t-sag\projects\crm\redesign\04_WIREFRAMES\contact-record\
  - shots/ (the 4 PNGs)
  - preview/ (the built dist; it must open from file://)
  - NOTES.md (≤ 30 lines: the regions in order, what each holds, the open questions, and any place where you departed from 4.3 and why)
Do not edit any other file in the project.

END with a short report: what you built, the build/QA results, what is left, and the exact list of files you created or changed.
```
