# BRIEF CRM-LOCALAUTH — enable real sign-in locally for Ahmed's visual review

ROLE A (TSST team runtime). Agent: tsst-dev. Worktree `C:\Work\tsst-crm-mvp`, branch `feat/crm-mvp-ui` (HEAD 2c85b10, UI migration merged).

## Goal
Ahmed signs in on http://localhost:4317/app with email and password (B7) as a manager of the existing demo tenant `f018c810-1de8-45c2-9021-76162be4d472` and reviews the new UI.

## Do
1. Add `scripts/enable-local-auth.ts`, dev only, which refuses to run when NODE_ENV=production. It:
   - (a) If `.env` lacks `AUTH_DATABASE_URL` or `BETTER_AUTH_SECRET`, generates strong random values and **appends** them to `.env`. AUTH_DATABASE_URL uses role `crm_auth` on the same host and DB as DATABASE_URL, derived in code. It never prints values and never rewrites other lines.
   - (b) Runs migrate, so the `crm_auth` password gets set.
   - (c) Creates a demo manager for that tenant through the B4 bootstrap logic (`create-tenant-admin` or its functions), with email `ahmed.review@local.test` and a generated strong password.
   - (d) Writes `{email, password, tenant}` to the git-ignored file `local-auth-demo.json`. Add the file to `.gitignore` and print only "credentials written to local-auth-demo.json".
2. It must be idempotent: a re-run keeps the existing env values and resets only the demo password.
3. Commit the script, the `.gitignore` change and a one-line npm script `auth:local`. Do not commit `.env` or the JSON.
4. Run it once.
   - Do NOT kill or restart port 4317. Ahmed or the Lead restarts the API.
   - Check with a quick server-side sign-in test against a **temporary server on port 4318**, then stop that server.
5. Checks: lint, typecheck, test:unit, build.

## Rules
- Never print or echo secrets, `.env` or the JSON contents.
- Report in `TSST/brands/t-sag/projects/crm/codex/reports/CRM-LOCALAUTH.md` (≤ 12 lines) with `Skills used:`. Then run `bus done` and stop.
