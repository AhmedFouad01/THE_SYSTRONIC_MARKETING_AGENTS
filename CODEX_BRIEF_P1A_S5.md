# Codex brief — CRM P1a S5: Arabic search, related-name search/sort, contact sources (2026-10-06)

Issued by TSST Lead (Claude). Runtime: Codex. **Reply to the user in plain Egyptian Arabic** (English only for file names/IDs). TSST root: `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS` (read-only for you; boot: its `AGENTS.md` → `TSST/context/boot.md`) (brand t-sag, project crm).

## Skill Plan
- TEAM: build · AGENT: DEV_AG (`tsst-dev`) · TIER: CODE · SKILL_GAP: none
- SKILLS: `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/DEV/skills/tsst-dev-sk-006-data-sql-migration-engineering`, `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/DEV/skills/tsst-dev-sk-005-api-integration-engineering`, `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/DEV/skills/tsst-dev-sk-011-testing-tdd-engineering`
- NOT_SELECTED: UI skills. Do not touch `app/`; the Claude session is working there.
- Your report MUST start with `Skills used:`.

## Workspace (strict)
- Worktree `C:\Work\tsst-crm-codex`, branch `feat/crm-server-search` (from `d0d1b6d`). App: `CRM_APP`. Work only there.
- No commit, push, merge or deploy. The Lead verifies and commits.
- Database: the separate DB `crm_codex` on 127.0.0.1:55432, set by the user in this worktree's `.env`. Never touch `crm_m0`.
- Never read or print `.env` or `local-fixture.json`. Never call `pg_ctl`; if Postgres is down, stop and report.
- Port 4317 is the user's API. Do not kill it. UI tests are not in scope.
- No new npm dependencies. A Postgres extension that ships with the bundled build (e.g. `unaccent`, `pg_trgm`) is allowed only if `CREATE EXTENSION` works on it. Otherwise use plain SQL.

## Setup (once; the user has put `.env` in place first)
1. In `CRM_APP`, run `npm ci`.
2. Create the `crm_codex` database if it is missing, using a one-off `tsx --env-file=.env` script on `ADMIN_DATABASE_URL`. Print nothing from the env.
3. Run `npm run migrate`, then `npm run seed`.
4. If role or owner errors appear because the roles are shared across the cluster, stop and report them. Do not alter cluster roles.

## Context
`CRM_APP/P1A_CONTRACTS.md` S4, lines ~28–38, is the current list query. Gaps found when the UI switched to it:
1. `q` is a bounded ILIKE on title / display_name only.
2. No Arabic folding (أ إ آ ا, ى ي, ة ه, tashkeel and tatweel).
3. No sort on related names.
4. No distinct contact sources.

## Task (server only: `src/`, `migrations/`, `tests/`, `P1A_CONTRACTS.md`)
1. **Arabic-normalised `q`** for all four kinds:
   - Fold alef variants to ا, ى to ي, ة to ه.
   - Strip tashkeel and tatweel. Make Latin case-insensitive.
   - Apply the same fold to the query.
   - Keep the bounds, escaping and the 5 s timeout.
   - Prefer a generated/stored normalised column, or an IMMUTABLE SQL function plus an index, via a new numbered migration.
2. **`q` also matches related names:**
   - leads, deals: the contact `display_name`.
   - tasks: the related lead/deal title, if cheap.
   - Keep tenant and rep scope (RLS) intact.
3. **New sort keys:**
   - lead and deal: `contact_name`, `owner_name`.
   - deal: `stage` (pipeline stage order).
   - task: `owner_name`.
   - Keyset cursor stays correct (exact values plus the `id` tiebreak, NULLS LAST) and `fp` is unchanged in behaviour.
4. **`GET /v1/contacts/sources`:** distinct non-null `source` values for the tenant, max 200, sorted, rep scope respected.
5. **Docs:** update `P1A_CONTRACTS.md` with an S5 section: grammar, whitelist and the new endpoint.

## Acceptance (exact counts in the report)
- Tests in `tests/p1a.test.ts` (or `tests/p1a-s5.test.ts` added to `test:db`) with at least 150 rows:
  - every Arabic fold pair, plus a mixed AR/EN value;
  - related-name search;
  - each new sort key across pages (keyset, no duplicates or gaps), asc and desc;
  - the sources endpoint, including tenant isolation and rep scope;
  - a legacy request without q/filter/sort stays byte-compatible.
- `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:db` and `npm run test:bootstrap` are all green.
- Report: Skills used; files changed; migration number; contract diff summary; counts; risks; `skill_friction`.

## Lead addendum (2026-10-06) — unblock setup
Blocker: `42710 role "crm_runtime" already exists`. The role is cluster-global and line 4 of `migrations/001_foundation.sql` is not guarded.
Decision: in `001_foundation.sql`, replace only the `CREATE ROLE crm_runtime …` statement with an idempotent guard that keeps the identical attributes:
`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='crm_runtime') THEN CREATE ROLE crm_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF; END $$;`
- Change nothing else in 001. Do not ALTER, DROP or re-grant cluster roles by hand.
- If `scripts/migrate.ts` sets the runtime password, leave it as is: it is the same value.
- Already-migrated databases (`crm_m0`) are unaffected, because 001 does not re-run.
- Then continue setup (migrate, seed) and the task.
- `npm run test:bootstrap` must stay green, since it covers a fresh cluster.
- List this change separately in your report.
