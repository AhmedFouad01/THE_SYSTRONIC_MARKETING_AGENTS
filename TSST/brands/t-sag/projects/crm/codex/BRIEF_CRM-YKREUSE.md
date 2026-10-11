# BRIEF CRM-YKREUSE — reuse map from YAKEBDA_MS into the CRM (read and plan only)

ROLE A (TSST team runtime). Agent: tsst-dev (SK-001 discovery, SK-003 architecture). Tier: WORK (gpt-6.1-sol · medium).

**Ahmed approved (2026-10-09):** we may take code and patterns from YAKEBDA_MS and adapt them into the CRM. **Code and patterns only.** Never copy YAKEBDA data, branding, client names, secrets or `.env`.

## Read (read-only)
- **Source (main, use this):** `C:\Users\10\Downloads\yakebda-main-qa`. It is a git monorepo with `apps/` and `packages/`. Start with its README, AGENTS.md, the root and `apps/*/package.json` files and the folder tree. `C:\Users\10\Documents\YAKEBDA_MS` is an older copy; use it only to fill gaps.
- **Target:** `C:\Work\tsst-crm-mvp\CRM_APP` (stack: React Aria 1.21.1 + Tailwind 4.3.3, Postgres RLS, Better Auth).
- **Needs:** `TSST/brands/t-sag/projects/crm/review/VISUAL_REVIEW_2026-10-08.md` (R01, R04, R05, R07, R08, R09, R10) and `TSST/brands/t-sag/projects/crm/specs/BUILD_PLAN_v3.md` (segments, tracking, Meta).

- **YAKEBDA decisions and plans** (Ahmed's Drive folder, already converted to Markdown and copied locally): `TSST/brands/t-sag/projects/crm/review/yakebda/`.
  - Read its `INDEX.md` first, then only the decision, ADR, plan, audit-remediation and UI/QA docs. Read at most 10.
  - Reuse decisions that were already settled; do not re-derive them.
  - Add a short section, "YAKEBDA decisions we adopt", where each entry gives the decision, the source file and how it applies to the CRM.

## Deliver `TSST/brands/t-sag/projects/crm/specs/YAKEBDA_REUSE_MAP.md` (≤ 1500 words)
A table with one row per CRM need. Include at least:
- HubSpot-style grid: column chooser, reorder, freeze, inline edit;
- pipeline drag & drop and stage settings;
- chart theme;
- reports/insights;
- phone/email/url fields and validation (+20);
- file upload;
- date and time pickers;
- tables, empty states and filters;
- RTL utilities;
- any other strong module you find.

Columns:
1. the need;
2. the YAKEBDA path or paths;
3. its stack/library;
4. the verdict: **take as-is / adapt / skip**, with the reason;
5. the adaptation effort (S/M/L);
6. the target CRM batch.

Also list the licensing or dependency conflicts, for example a different UI library or Tailwind version. End with the **top 5 highest-value reuses**.

## Budget
Read at most 25 files; use the folder tree and grep, not full reads. No installs, no code changes. Then run `bus done --skills-used` and stop.
