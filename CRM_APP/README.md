# CRM M0 foundation

Synthetic local proof only. API: loopback port 4317. PostgreSQL: loopback port 55432. Separate worker, durable database outbox, no provider integrations.

## Run (PowerShell 7, Node 24.18.0)

```powershell
npm ci
npx playwright install chromium
./scripts/local.ps1             # generates ignored credentials, Docker PostgreSQL, migration, seed
npm run api                    # terminal 1
npm run worker                 # terminal 2
```

Open `http://127.0.0.1:4317`. The ignored `local-fixture.json` contains synthetic session tokens and opaque IDs: use `tokens.manager`, `ids.a`, `ids.dealA`, `ids.qualified`, expected version 0. Load the deal, move once to Qualified, then use `ids.won` with the returned version. Language button switches Arabic RTL / English LTR. Tokens expire after 24 hours; `npm run seed` appends a fresh isolated synthetic fixture, never deletes existing data. Do not paste fixture tokens into shared evidence.

`npm run migrate` is transactional, serialized and versioned; rerunning verifies migration 001 and refreshes the runtime password from `.env`. Admin URL is for migrations/seed/recovery/tests only. API/worker use `DATABASE_URL`, whose account must remain non-owner and non-bypass. No real customer data, production authentication, attachment product, or schema down-migration is supplied. Recover through a verified backup/new database; do not revert executable SQL blindly.

## Native Windows fallback

Docker is optional for this spike. Supply a PostgreSQL 17.10 binary directory with initdb/pg_ctl/postgres. A local test-tool download used here is `@embedded-postgres/windows-x64@17.10.0-beta.17`; the wrapper carries a beta suffix, while `postgres --version` reports PostgreSQL 17.10. It is not an application dependency.

```powershell
npm install --prefix .local-tools --no-save --package-lock=false @embedded-postgres/windows-x64@17.10.0-beta.17
./scripts/native-local.ps1 -PgBin .local-tools/node_modules/@embedded-postgres/windows-x64/native/bin
```

Both bootstrap scripts refuse to overwrite `.env`. On partial failure preserve the existing cluster and credentials; finish the failed step from the console. Stop the native test cluster with `pg_ctl -D .local-postgres/data -m fast -w stop` from that binary directory. Native data is ignored and must stay off Drive.

Google Drive can reject npm file writes. If that occurs, copy **only product source/configuration** to a normal local verification directory, run there, and compare SHA-256 hashes back to the Drive checkout before committing. Keep node_modules, `.env`, database directories, binaries, fixture tokens and backups outside Drive/version control. The evidence records this fallback.

## Focused validation

```powershell
npm run test:db                 # first, targeted real PostgreSQL tests
npm run test:ui                 # four real-browser language/viewport checks
npm run lint
npm run typecheck
npm test                        # complete M0 command
npm run build
git diff --check
```

Tests create uniquely named synthetic tenants in the configured local database; one atomicity probe installs/removes a temporary audit trigger. Run only on the dedicated M0 database. `tests/foundation.test.ts` covers tenant/FK/RLS isolation, forged context, role/assigned scope, revocation, atomic transition, invalid/stale commands, durable retries, crash/restart, and HTTP validation. `tests/ui.spec.ts` checks 360px/1280px in Arabic/English, overflow and keyboard focus.

## Backup and restore

Docker logical backup into an ignored custom-format dump; restore only into a **new** database, never over an existing one:

```powershell
./scripts/backup.ps1
./scripts/restore.ps1 -Database crm_m0_restore
```

The native fallback includes a reproducible **cold physical** backup→restore proof (same PostgreSQL version/platform, dedicated synthetic cluster only). It cleanly stops the original cluster, copies it into a new backup directory, restarts it, restores to a new directory on port 55433, compares every CRM table count/digest, checks restored runtime RLS, then stops the restored cluster. Credentials in physical backups must remain private.

```powershell
$env:PG_BIN=(Resolve-Path .local-tools/node_modules/@embedded-postgres/windows-x64/native/bin).Path
node --env-file=.env --import tsx scripts/native-recovery.ts
```

See ignored `backups/recovery-evidence.json` and committed `M0_EVIDENCE.md`. The measured synthetic drill establishes no production RPO/RTO. Docker scripts are provided but their execution is blocked when Docker cannot run.
