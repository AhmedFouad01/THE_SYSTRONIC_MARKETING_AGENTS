# M0 evidence — 2026-10-01

**Result: PASS WITH BLOCKERS (local tooling paths only).** All mandatory M0 behavior gates passed against real PostgreSQL and Chromium. No M1–M4/product/production-readiness claim.

Decision commit: `b70c4f6eb5f16b13e629968af520b97f5b46b5ad`. Branch: `feat/crm-m0-foundation`. Stack/pins/license rationale: `ADR-001.md` and `package-lock.json` (Node 24.18.0, TypeScript 7.0.2, PostgreSQL 17.10, pg 8.23.1, tsx 4.23.15, Playwright 1.63.0, Biome 2.5.15, @types/node 24.19.0, @types/pg 8.23.1). API uses built-in Node HTTP; web uses HTML/CSS/JS. No Redis is needed for this bounded database effect.

| Claim / command | Observed result / exact evidence |
|---|---|
| Migration + seed: `npm run migrate`, `npm run seed` | PASS, real isolated PostgreSQL 17.10 cluster; synthetic Tenant A/B fixtures |
| Tenant isolation / runtime privileges | PASS, `tests/foundation.test.ts` tests 01–03: non-owner/NOBYPASSRLS, FORCE RLS, cross-tenant read/update denied, cross-tenant FK rejected, forged tenant/token/actor rejected, pooled context cleared |
| RBAC, scoped grants, revocation | PASS, tests 04–05: reader write denied, assigned scope denied, revoked agency replay denied, queued work blocked with no effect |
| Atomic transition | PASS, tests 06–08 and 11–12: one history/event/outbox/audit/receipt, invalid transition and stale version denied, concurrent writers yield one success, injected audit failure rolls back every effect, HTTP validation/status checks |
| Distinct idempotency / recovery lifecycles | PASS, tests 09–10: replay before/after API-cache expiry returns one durable result; changed body conflicts; retry + process exit after effect SQL + fresh worker process yields one logical effect and processed state |
| RTL/LTR | PASS, `tests/ui.spec.ts`: 4/4 Chromium tests, English/Arabic × 360/1280px; direction/text, no horizontal overflow, responsive columns and keyboard focus. Screenshots: `evidence/en-360.png`, `ar-360.png`, `en-1280.png`, `ar-1280.png`. Arabic mobile and English desktop screenshots also visually inspected |
| Focused tests first | `npm run test:db`: 12/12; `npm run test:ui`: 4/4 |
| Final complete gate | `npm run lint`: PASS (14 files); `npm run typecheck`: PASS; `npm test`: **16 passed, 0 failed, 0 skipped**; `npm run build`: PASS |
| Dependency check | `npm audit`: zero reported vulnerabilities; metadata licenses reviewed; exact lockfile retained |
| Backup → restore | PASS, `scripts/native-recovery.ts`: clean shutdown/physical backup/new cluster on port 55433, all **18 CRM table counts and row digests equal**, restored runtime RLS fails closed. Measured backup/copy/start interval **8,161ms**; see `evidence/recovery-evidence.json`. No production RPO/RTO claim |
| Source equivalence | `evidence/source-hashes.json`: SHA-256 of every delivered source/configuration/evidence file (excluding this manifest); copied source verified equal to the executed local files before commit |
| Repository gates | `git diff --check` and staged whitespace check run before implementation commit; only CRM_APP and the two narrow Blueprint evidence updates staged. No push |

## Environment limits / remaining blockers

- **BLOCKED: direct dependency installation on Google Drive.** npm returned EBADF/UNKNOWN writes. Product files remain under `G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\CRM_APP`; execution used an identical source mirror at `C:\Users\10\Documents\ChatGPT\THE_SYSTRONIC_MARKETING_AGENTS\tmp\m0-stage`. Credentials/data/dependencies/backups were excluded from synchronization and commits.
- **BLOCKED: Docker path.** Docker engine did not respond and service startup was denied. Therefore Docker compose startup and logical `pg_dump`/`pg_restore` scripts are supplied but not certified by this run. Equivalent mandatory database/recovery proofs passed using native PostgreSQL 17.10 and a cold physical restore. Native binaries were fetched as test tooling using `@embedded-postgres/windows-x64@17.10.0-beta.17` (wrapper suffix; actual engine reports 17.10).
- Existing Git maintenance warned about `refs/codex/desktop.ini` during the documentation commit. Commit/branch creation succeeded; the unrelated ref was left unchanged.
- Independent delegated review could not run because its agent hit a usage limit; no independent-review acceptance is claimed. Main-agent inspection and executable gates above are the evidence.
- No unresolved M0 implementation choice. Production identity/MFA, session issuance, real-data retention, operating targets and all excluded product areas remain outside this synthetic proof. The 7-day retry window is demonstrated by simulated expiry, not a seven-day endurance run. Runtime SQL role is trusted application infrastructure; RLS isolates tenants but action checks also rely on the server boundary.

Synthetic fixture/session files and raw database backups are intentionally private and ignored. This evidence does not promote DEV_AG skills or TSST readiness.
