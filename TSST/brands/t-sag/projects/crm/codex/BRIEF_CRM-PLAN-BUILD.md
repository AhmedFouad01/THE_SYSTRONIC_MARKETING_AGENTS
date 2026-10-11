# BRIEF CRM-PLAN-BUILD — one build plan for roadmap items 2–5, split into Codex-sized tasks

**Agent:** tsst-dev. **Tier:** CODE (gpt-6.1-sol · high). **Mode:** plan only: no code, no installs, no test runs.
**Starts only after** CRM-PLAN-ADS and CRM-PLAN-UX are done.

## Read
- `TSST/brands/t-sag/projects/crm/specs/ADS_REQUIREMENTS.md`
- `TSST/brands/t-sag/projects/crm/specs/NAV_AND_SCREENS.md`
- `C:\Work\tsst-crm-mvp\CRM_APP`, branch `feat/crm-mvp-ui` (read-only):
  - `AUTH_PLAN.md` §6 (the increments);
  - `IMPORT_CONTRACTS.md`;
  - `CHARTS_CONTRACTS.md`;
  - `P1B_CONTRACTS.md`;
  - `scripts/migrate.ts` (the migration list);
  - `ls migrations/`.

## Deliver `TSST/brands/t-sag/projects/crm/specs/BUILD_PLAN_v3.md`
Keep it to about 3,000 words or less. It must contain:
1. **Architecture decisions:**
   - the segments engine, reusing the B4 filter AST;
   - the touchpoint/event store and the consent fields;
   - per-tenant ad-account connections, with OAuth token storage encrypted at rest and least privilege;
   - the outbox-driven sync jobs to Meta (audiences, CAPI) with retry and idempotency;
   - the webhook ingestion for Lead Ads, with signature verification.
   Give one recommended option each, with a one-line reason.
2. **Migration numbering:** 013–014 are done, 015–017 are reserved for auth B2/lockout, and 018 is import. New work starts at **020**.
3. **Ordered task list.** Each task is independently buildable in one Codex session of about 2 hours. For each task give:
   - the ID;
   - the goal;
   - the files and areas touched;
   - the migration number, if any;
   - the tests to add;
   - the checks (lint, typecheck, test:unit, build, test:db; no UI suite);
   - `done_when`.
   Cover, in order:
   - (2) nav restructure, import UI and dashboard UI;
   - (3) segments;
   - (4) tracking, journey and consent;
   - (5) Meta: Lead Ads in, Custom Audiences, CAPI.
   Leave Google and TikTok as a later section with stubs only. Auth B2–B5 stays with Claude; list it only as a dependency.
4. **Shared rules for every build task:**
   - branch per task from `feat/crm-mvp-ui`;
   - the Codex worktree is `C:\Work\tsst-crm-codex`;
   - per-lane DB isolation (own database, env override, never read or print `.env`);
   - port 4317 is untouchable; no push, no merge, no deploy;
   - Arabic is full RTL and mixed text never breaks;
   - reviews are light now: the worker's own checks only. Heavy reviews come pre-launch.
5. **Risks:** 5 at most, each with a mitigation.

## Lead notes (2026-10-07)
- **TOTP is deferred** (AUTH_PLAN D2). Wherever ADS_REQUIREMENTS says "manager with MFA", read "manager role" until the `mfa_ok` switch is turned ON before launch.
- The ADS spec flags that its Meta details were **not verified** (the docs returned 429). Mark each Meta-dependent task "verify against current Meta docs at build time". Do not block on it.

## Budget rules (mandatory)
- No web browsing; the ADS spec already cites the docs.
- Read only the files listed above. One pass. Stop after `done`.
- `done --skills-used` must list the skills you applied.
