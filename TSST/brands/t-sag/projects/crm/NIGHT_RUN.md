> **SUPERSEDED 2026-10-07 07:55: if you were started as a night run, follow `SPRINT_SELLABLE.md` (same folder) instead. Sections §1 and §6 below remain the binding rules it references.**

# CRM night run — autonomous roadmap playbook (user-authorised 2026-10-06, valid until 2026-10-07 10:00 +03:00)

The user (Ahmed) said: keep working and move along the CRM roadmap until we wake up; resume automatically after the 5-hour limit resets. You are the TSST Lead (main session). Follow the repo's `AGENTS.md` → `TSST/context/boot.md` (brand t-sag, project crm).
- Checkpoint: `TSST/brands/t-sag/projects/crm/MORNING_QUESTIONS_2026-10-05.md`. Its top lines are ROADMAP and STATUS.
- Roadmap source: `C:\Work\tsst-crm-mvp\CRM_APP\audits\2026-10-06\ADR-002-OBJECT-PROPERTY-SYSTEM.md` §9.1.

## 0. Start-of-run gates (stop silently if any fails)
1. If the time is after 2026-10-07 10:00 +03:00, do nothing and stop.
2. Lock: if `C:\Work\crm-night.lock` was modified less than 45 minutes ago, another run is active. Stop.
   - Otherwise write the current ISO time into it.
   - Refresh it after every step, i.e. every agent return and every check run.
3. Usage: call the usage tool. If the weekly limit is ≥ 99%, write the morning note (section 4) and stop.
   - If the 5-hour limit is ≥ 95%, update the checkpoint and stop. A later scheduled run resumes.

## 1. Rules (unchanged from the day session)
- **Team and skills:** every task goes through the routed team agent with a Skill Plan (TEAM/AGENT/SKILLS/NOT_SELECTED/TIER/ACCEPTANCE/SKILL_GAP).
  - Build goes to `tsst-dev`. UI visual gates go to `tsst-creative`. Reads go to `tsst-reader`.
  - Reject any return without "Skills used:".
  - The main session is Lead and acceptance only.
- **Where to work:** only in `C:\Work\tsst-crm-mvp\CRM_APP`, branch `feat/crm-mvp-ui`.
  - The Lead commits after verifying.
  - **No push, no merge into master, no deploy.**
  - Never touch `C:\Work\tsst-crm-codex` or `C:\Work\tsst-crm-p1b`.
- **No new dependencies.** React Aria and other libraries need the user's approval per widget. Build in-house, or defer that widget and record it.
- **Environment:**
  - Postgres is on 127.0.0.1:55432. NEVER call `pg_ctl` directly. If it is down, start it detached via PowerShell `Start-Process` (command in the checkpoint history), and stop if that fails.
  - Port 4317 is the user's API: never kill it.
  - Run UI tests with a temp copy of `playwright.config.ts` with 4317→4318 and PORT=4318, then delete the copy.
  - NEVER read or print `.env` or `local-fixture.json`.
- **Acceptance per slice:** lint, typecheck, test:unit, build, test:db, test:bootstrap and the full UI suite all green.
  - UI slices also need a CREATIVE gate with EN/AR × light/dark × 1440/375 shots.
  - Arabic is complete RTL. Mixed AR/EN text must never break.
  - The desktop preview docks at the inline end (D7).
- **Interrupted run:** if the worktree has uncommitted changes from an interrupted run, do NOT discard them.
  - Have `tsst-dev` assess them, then finish and verify, or `git stash push -m "night-run interrupted <time>"`.
  - Record which one in the checkpoint.

## 2a. Priority and efficiency (user, 2026-10-07 00:55: "make the night count")
- **Goal by morning:** something the user can TRY. That means the P1b **B1 + B2**: the registry plus the property settings page, so the user can create a custom field and see it.
- **Finish B0 fast.** Write the doc from the existing `results.json`. No new measurements, no regenerating 1M rows.
- **Keep agent briefs narrow:** one slice per agent, and reuse existing patterns.
- **UI suite:** run the full UI suite once per slice, not twice, unless something failed.
- **CREATIVE gate:** only for slices with UI (B2 onward). Use 4 shots: EN/AR × light at 1440, plus AR dark 1440 and AR 375. 8 shots are not needed.
- **Cost (user, 2026-10-07):** B6 perf re-run at 1M is DEFERRED (no first customer is near that size).
  - Per slice, run only the affected UI specs.
  - Run the full UI suite once at the end of the run, before the morning note.
  - If something fails twice, stop and record it. Do not loop.
- **Never spend a window on polish or docs.** Small R4 items come last.

## 2. Work order (ROADMAP v2, ADR-002 §9.2: after B2 continue B3 then B4; skip B5–B7; if P1b is blocked, go to roadmap v2 item 2 = real sign-in, server half first)
1. **P1b plan.** `CRM_APP/P1B_PLAN.md` (branch-only). If it is missing, have `tsst-dev` write it with SK-003/002/006, plan only.
   - For its "decisions needed", adopt the **recommended answers as Lead-provisional**.
   - Record them in `CRM_APP/audits/2026-10-06/PREVIEW_DECISIONS.md` (branch-only)-style file `CRM_APP/P1B_DECISIONS.md` (branch-only), marked "provisional — user to confirm in the morning".
   - Exceptions: new deps and anything irreversible. Those stay pending.
2. **P1b slices in plan order.** Run the S10 thresholds/spike first if the plan says so.
   - Each slice: `tsst-dev` (SK-004/011/015 plus the plan's skills) with server + plain UI + tests.
   - Then the Lead verifies the checks, runs the CREATIVE gate for UI slices, and commits.
   - Then update the checkpoint STATUS line, in English and in short form.
   - Migrations start at 010. Run `npm run migrate` after a migration commit.
   - Definer functions must REVOKE PUBLIC, and new tables get RLS.
3. **Stop P1b before any slice that needs a pending user decision.** Then go to roadmap item 2, the server aggregate endpoints for charts, if P1b is blocked.

## 3. Turn-limit handling
Agents often stop at their turn limit. Resume the same agent with SendMessage, or start a fresh one with a narrow brief.

## 4. Morning note (always, at the end of every run)
Append to `TSST/brands/t-sag/projects/crm/NIGHT_RUN_REPORT.md`, in **plain Egyptian Arabic**, with English only for file names and commit IDs:
- what was done, with commits;
- check counts;
- provisional decisions waiting for the user;
- what stopped the run and why;
- what is next.

## 5. Sellable release (user, 2026-10-07 01:05): "prepare a version ready to sell; do the 6 points"
Execute roadmap v2 items 1–5, in order, slice by slice, with the same rules (team + skills, Lead verifies, then commits; branch `feat/crm-mvp-ui`). Item 6 waits for the first customers.
1. **P1b B1–B4.**
2. **Real sign-in.**
   - Email + password, hashed with Node `crypto.scrypt`. No new dependency.
   - httpOnly secure session cookie, CSRF-safe.
   - Users and roles per tenant, an invite flow, a password reset token (the email-sending step is stubbed and logged), and a login rate limit.
   - Keep the session-token path for tests and dev only.
   - Security review by `tsst-dev` SK-007/008 before commit.
3. **Import.**
   - **CSV in-house** (no dependency) for contacts and leads: column mapping, preview, duplicate handling, and an idempotent import job.
   - `.xlsx` needs a library, so it waits for the user's approval. Record it in the morning note.
4. **Dashboard charts.**
   - Server aggregate endpoints, then UI widgets from MagicPath design-system sections 10–12.
   - Use **Chart.js 4.5.1 + react-chartjs-2 5.3.1** (USER-APPROVED 2026-10-07; exact pins), with animations on and prefers-reduced-motion respected.
   - Colors come from the `--sy-*` tokens, including dark.
   - Use Arabic digits and labels, and an RTL legend and tooltip.
   - Give each canvas an aria-label and a data-table fallback.
   - Hand-drawn SVG only for tiny sparklines and progress bars, if that is simpler.
   - Charts must be AR/EN-correct, work in light and dark, and be RTL-aware.
5. **Hosting package for the user's AWS EC2 — PREPARE ONLY, never deploy.**
   - Production build, a Node process manager (systemd unit), an nginx reverse-proxy config with HTTPS (certbot steps), a Postgres setup and migrate runbook, a daily `pg_dump` backup with rotation, env templates with placeholders only, health check, and a step-by-step `DEPLOY_EC2.md`.
   - No SSH, no credentials, no AWS calls. The user runs it, or approves a deploy session.

## 6. User approvals (2026-10-07 ~02:10) — binding
- **All P1b provisional decisions are APPROVED.** The next commit that touches `CRM_APP/P1B_DECISIONS.md` (branch-only) sets its status to "APPROVED by the user 2026-10-07".
- **Dependencies approved**, with exact pins when installed, plus lint/typecheck/build and the affected tests after install:
  - `chart.js` 4.5.1 + `react-chartjs-2` 5.3.1
  - `read-excel-file`: latest stable at install time, MIT, pinned
  - `@aws-sdk/client-sesv2`: latest stable, pinned. Code only; credentials and SES setup are the user's step. No AWS calls.
  - `react-aria-components` + `tailwindcss` + `@tailwindcss/vite`: latest stable at install, exact pins. Approved by the user 2026-10-08 for the UI migration; the user reversed the earlier no-RAC/Tailwind stance.
  - `better-auth` **1.7.7** exact pin (MIT), approved by the user 2026-10-07 for sign-in (`CRM_APP/AUTH_PLAN.md` (branch-only) v2, D1–D5 decided). Any version bump needs a regenerated-schema diff first.
- **Still NOT approved:** any deploy to EC2, any AWS or SSH access, push, or merge into master.
- **The user said "build it right":** correctness and security come before speed.
  - Keep the database tests, the security review for sign-in and import, and the AR/EN checks.
  - Cut cost only on the gates already deferred.
