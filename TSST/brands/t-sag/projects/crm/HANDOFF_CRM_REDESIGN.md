# Handoff → new session "CRM full UI redesign + main theme" (Ahmed, 2026-10-09)

Reply to Ahmed only in plain Egyptian Arabic, short. The Lead spends tokens only on analysing requests, replying and reviewing team output (memory: feedback-lead-tokens-minimal). Before any round, show Ahmed the exact scope and cost and get his OK (memory: feedback-audit-scope-first).

## Ahmed's request
- The team (**LENS → SPARK → CREATIVE → DEV**, in that order; memory: feedback-lens-before-spark) redesigns **every CRM screen** from scratch and creates **one main theme**. This becomes the house theme for our products.
- **Theme direction:** dominant **blue** plus a **red that leans slightly toward magenta (NOT magenta)**. These two lead; every other colour is derived elegantly from them. We are not bound by the old strict `--sy-*` palette rules.
- **What is wrong today:** heavy black ("مصيبة سودا"), visible divider lines everywhere, buttons sitting on top of lines, and messy layout ("العك ده مش هيودينا في حتة").
- **Deliverables, in order:**
  1. **LENS:** research on how best-in-class CRMs (HubSpot and others; public info only) structure each screen for agency users and their clients, and the jobs and questions per screen.
  2. **SPARK:** what each screen must surface for marketing and ads work: KPIs, segments, journeys, attribution. Insights/Reports gets a full rebuild (review R05).
  3. **CREATIVE:**
     - (a) the theme proposal: tokens, light and dark, blue + magenta-leaning red, an elegant derived palette, surfaces without heavy black, minimal lines and elevation instead of borders;
     - (b) **a report of how each CRM page is redesigned**;
     - (c) **block wireframes / technical drawings first**: labelled blocks per page showing the regions and what each block contains. Pixel art is not required. Renders/images come after the blocks are approved.
  4. **DEV:** only after Ahmed approves the wireframes and theme: build tasks for Codex, as React Aria + Tailwind tasks.
- Every page: AR full RTL and EN, desktop 1440 and mobile 375, and **no native unstyled controls** (memory: feedback-no-native-controls).

## Inputs
- Ahmed's review log and screenshots: `review/VISUAL_REVIEW_2026-10-08.md` (R01–R12, plus the clarifications).
- `specs/NAV_AND_SCREENS.md`, `specs/UI_MIGRATION_PLAN.md`, `specs/ADS_REQUIREMENTS.md`, `specs/BUILD_PLAN_v3.md`, `specs/YAKEBDA_REUSE_MAP.md`.
- **App:** `C:\Work\tsst-crm-mvp\CRM_APP`, branch `feat/crm-mvp-ui` (HEAD da856b3: UI migration + fix batch 1). Run locally on http://localhost:4317/app with the demo manager in `CRM_APP/local-auth-demo.json` (branch-only). Ahmed opens that file; never read it.
- **Impeccable** design skill (github.com/pbakaus/impeccable) is approved by Ahmed but not installed yet.

## State of the other tracks
- **Fix batch 1 is done and merged.**
- **Batch 2 (data):** R08 single name field, R09 phone/email/url fields and types, R10 a lead requires phone or email. This is model/API work and is still valid. It can run in parallel, but show Ahmed the scope first.
- **Batch 3 (grid/pipeline/charts UI):** **ON HOLD**. It will be rebuilt inside the redesign.
- **U20 (delete the old CSS):** on hold.
- **Roadmap:** see memory `project-crm-roadmap-backend-first` (v3 + item 7 Commerce + future POS/KDS).
