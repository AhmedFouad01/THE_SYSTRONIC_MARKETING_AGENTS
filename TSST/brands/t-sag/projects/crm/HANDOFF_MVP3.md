# Handoff → session "TSST CRM MVP 3" (2026-10-07 16:15)

Reply to the user (Ahmed) **only in plain Egyptian Arabic**, with English only for file names and IDs. Be short. This holds even after reading English agent reports.

## Boot (read only these)
1. `AGENTS.md` → `TSST/context/boot.md` (brand t-sag, project crm).
2. Checkpoint: `TSST/brands/t-sag/projects/crm/MORNING_QUESTIONS_2026-10-05.md`. Read the top lines only.
3. Rules and environment: `NIGHT_RUN.md` §1 + §6. Sprint economy: `SPRINT_SELLABLE.md`.
4. Memory has the roadmap (v2 sellable-first), the RTL rules and the language rule.

## Where things are
- **Code:** `C:\Work\tsst-crm-mvp\CRM_APP`, branch `feat/crm-mvp-ui`, latest commit at handoff `2df5e7b`. Not pushed. Run `git log --oneline -12`.
- **Done:**
  - the grids on the server query;
  - the preview slide-over on 4 screens;
  - mixed AR/EN fixes;
  - Codex Arabic search, merged;
  - the security review, merged;
  - P1b custom fields **B1–B4 complete**: registry, settings page, values on records, grid columns, filters and sort;
  - the auth plan `AUTH_PLAN.md` and A1 (scrypt helpers).
- **Plans and decisions:** `CRM_APP/P1B_PLAN.md` (branch-only), `P1B_DECISIONS.md`, `P1B_CONTRACTS.md`, `AUTH_PLAN.md`, and ADR-002 §9.1/§9.2 (roadmap, stack).
- **Reports:** `NIGHT_RUN_REPORT.md` (Arabic).

## Open decision — ask the user FIRST
**Real sign-in: building it from scratch is ON HOLD.** The user asked "are we really coding login from zero in 2026?".
- The Lead recommends **Better Auth 1.7.7** (MIT, self-hosted on our Postgres). It covers email/password, sessions, organizations/multi-tenant, invitations, roles, TOTP, rate limits and reset.
- The alternative is AWS Cognito.
- It needs the user's approval as a new dependency.
- If approved: `tsst-dev` revises `AUTH_PLAN.md` on top of Better Auth, mapping its user and organization to our principal, tenant, RLS and `role_permission`. Keep our UI in AR/EN. The 13 decisions shrink to about 4–5.
- A1 (`2df5e7b`) may become unused: drop it or keep it as a decision for that plan.

## Next (roadmap v2, `SPRINT_SELLABLE.md` items)
1. Sign-in, per the decision above.
2. Import: CSV plus `.xlsx` via `read-excel-file` (approved).
3. Dashboard charts: Chart.js 4.5.1 + react-chartjs-2 5.3.1 (approved).
4. EC2 hosting package. Prepare only.

## Automation state
- Scheduled task `crm-sprint-sellable` is **PAUSED** (enabled=false) so this session is the only driver. Re-enable it only if the user asks.
- **Permission mode:** scheduled runs stalled for hours on approval prompts. If the user wants unattended runs again, they must first set that routine's permission mode to Auto in the app (the user's own setting).
- **Lock** `C:\Work\crm-night.lock`: if the content or mtime is fresh (< 45 min), another run may still be active. Check `git status` and file mtimes before you start.
- **Usage:** the weekly limit was ~70% on 2026-10-07 morning and resets 2026-10-12. The user raised the stop cap to 99%. Be economical.

## Live at handoff
The last sprint run (started 08:31) was still **running** and had begun item 3 (import): `read-excel-file` 9.3.10 was added to `package.json`/lock but not committed. Before starting, check whether that run is still active (lock, file mtimes, task runs). If it has stopped, have `tsst-dev` assess the partial import work and finish it or stash it. Never discard it.
