# BRIEF — Review fix batch 2 ("Data"): R08, R09, R10

ROLE A (TSST team runtime). Scope = exactly rows R08, R09 and R10 of `review/VISUAL_REVIEW_2026-10-08.md`, **including the 2026-10-09 clarifications**. Nothing else; the UI redesign is a separate track, so keep the UI changes minimal and functional.

- **Worktree:** `C:\Work\tsst-crm-codex`, branch `feat/crm-review-fix2` (from `feat/crm-mvp-ui` da856b3). One commit per task. Never push or merge.
- **Migrations:** use numbers **027, 028, …** (020–026 are reserved by BUILD_PLAN_v3). Update `scripts/migrate.ts`. Changes are additive and backfilled, with **no data loss**. RLS stays on, and new definers get REVOKE PUBLIC.
- **DB isolation:** use your own database `crm_lane_fix2`. Write a wrapper outside the repo that swaps only the DB name. Never read or print `.env`, and never touch the default DB.
- **Checks:** D = lint, typecheck, test:unit, build and test:db (full, on the lane DB).
- **Failures:** fix normal errors yourself (about 5 tries). Block only on a design or scope question.

## Tasks, in order
1. **CRM-G1 — R08 single name:**
   - Collapse every user-content `*_ar`/`*_en` name or label pair into one field: properties, groups, options, pipelines, stages and any other.
   - The backfill keeps the non-empty value; when both are set, prefer the one matching the tenant's primary language, and keep the other in an audit note.
   - Update the APIs, validation, search, import mapping and the dialogs to one field with `dir="auto"` and `<bdi>`.
   - UI chrome i18n stays bilingual.
2. **CRM-G2 — R09:**
   - Email, Phone, Company and Job title become **system properties** on contacts (Email and Phone also on leads). They appear as default grid columns and in panels and create dialogs, masked without `sensitive.read`.
   - Add property types `email`, `phone` (E.164, +20 default) and `url`, with server and client validation.
   - Add mailto, tel and WhatsApp actions on the record panel.
3. **CRM-G3 — R10:**
   - Creating or updating a lead requires **at least one of phone or email**: in the dialog, the API, import (failing rows go to row errors) and the future Lead Ads path.
   - Add a "missing contact" flag plus a filter for existing leads that have neither.
   - Error messages in AR and EN.

**Report:** `codex/reports/CRM-Gn.md` (≤ 12 lines) with the commit, migration number, checks with counts, done-when per review row, and `Skills used:`. Then run `bus done`.
