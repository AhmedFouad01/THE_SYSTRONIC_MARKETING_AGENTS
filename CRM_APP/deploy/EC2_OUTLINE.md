# EC2 hosting outline (prepare only, deferred)

Status: overview only. Nothing here has been run on AWS; no deploy is planned soon.
Target: Ubuntu 24.04 LTS on one EC2 instance, Node 24.18.0 (package.json engines), Postgres 17 on the same host (RDS is a later option).
Facts below come from the code on branch feat/crm-ec2 (cdabea6). `npm ci && npm run build` was run once and passed. The built entry `node dist/src/api.js` loads (it exits with PROTECTED_KEY_UNAVAILABLE when no database is reachable, as designed).

## Components

| Piece | Plan |
|---|---|
| Build | `npm ci` then `npm run build`. Output: `dist/src` (API, worker), `dist/scripts` (migrate), `dist/app` (React client), `dist/web` (legacy pages), `dist/migrations`. Release dir `/opt/crm/releases/<stamp>`, symlink `/opt/crm/current`. Runtime needs only `pg` (`npm prune --omit=dev`). |
| systemd | `crm-api.service`: `node dist/src/api.js` as a system user `crm` (nologin), `EnvironmentFile=/etc/crm/crm.env`, `Restart=on-failure`. Hardening: NoNewPrivileges, ProtectSystem=strict, ProtectHome, PrivateTmp, PrivateDevices, empty CapabilityBoundingSet, RestrictAddressFamilies (inet, unix), SystemCallFilter=@system-service. Do NOT set MemoryDenyWriteExecute (breaks Node/V8). Check with `systemd-analyze security`. A second unit for `dist/src/worker.js` exists in design only (see gaps). |
| nginx + TLS | Reverse proxy to `127.0.0.1:4317` (the API already binds loopback only). certbot (`--nginx`) for the domain, HTTP to HTTPS redirect, HSTS after the first good run. Security headers via one shared snippet (remember `add_header` is not inherited into a location that sets its own). gzip on. Serve `/app/assets/` straight from `dist/app/assets` with 1-year immutable cache (file names are hashed). CSP strict for `/app` (React uses inline `style=` so `style-src 'unsafe-inline'`); the legacy pages use inline scripts, so redirect `/` to `/app/` and return 404 for `/foundation` and `/reporting`. `limit_req` on `/v1/collect/events` (public endpoint, 8 KB body cap) and later `/v1/auth/`. `client_max_body_size` 1m until CSV import needs more. |
| Postgres roles | Install Postgres 17 from the PGDG apt repo (Ubuntu 24.04 ships 16). Listen on localhost only, scram-sha-256. `crm_migrator`: LOGIN, NOSUPERUSER, CREATEROLE, NOBYPASSRLS, owns database `crm` and all objects. `crm_runtime`: created by migration 001 (NOSUPERUSER NOBYPASSRLS NOINHERIT), used by the API via `DATABASE_URL`. `crm_auth` (from AUTH_PLAN v2, migration 013): DML on schema `auth` only, no privilege on `crm`; used by a second pool via `AUTH_DATABASE_URL`. `postgres` superuser is used only by hand over the local socket (peer), never by the app. Passwords: `openssl rand -hex 24` (migrate.ts requires alphanumeric, 24+ chars). Revoke `CONNECT` from PUBLIC after the first migrate. |
| Migrate | `node --env-file=/etc/crm/migrate.env dist/scripts/migrate.js` (needs `ADMIN_DATABASE_URL` = crm_migrator and `DATABASE_URL`, because it sets the crm_runtime password from it). Run a rehearsal on a scratch database first; it is untested with a non-superuser migrator. Always take a `pg_dump` before migrating: there are no down-migrations. |
| Backups | systemd timer, daily 02:30, as user `postgres`: `pg_dump -Fc crm` to a temp file, `pg_restore --list` check, atomic rename into `/var/backups/crm` (0700). Keep 14 daily + 8 weekly (Sunday), prune only after a verified new dump. Restore test script: `createdb crm_restore_test`, `pg_restore --exit-on-error`, check migration count and `crm.identifier_secret` rows, drop it. Run monthly and before every migrate. Dumps hold protected keys and (after auth) raw session tokens, so treat them as secrets; copy off-box (S3 with SSE, or EBS snapshots) because same-disk backups die with the instance. |
| Env vars | Runtime file `/etc/crm/crm.env` (root:crm, 0640) and migrate file `/etc/crm/migrate.env` (0600, admin only; never give `ADMIN_DATABASE_URL` to the service). Placeholders only in the repo. Names found in code: `DATABASE_URL`, `ADMIN_DATABASE_URL`, `PORT` (default 4317), `WORKER_CONTEXTS`, `CRM_AUTH_PEPPER_<id>` and `CRM_AUTH_PEPPER_ACTIVE` (base64, 32+ bytes; src/auth/password.ts). From AUTH_PLAN v2 (not in code yet, names provisional): `AUTH_DATABASE_URL`, `BETTER_AUTH_SECRET`, `CRM_DEV_BEARER` (must be unset in production), `CRM_TRUST_PROXY=1` (behind nginx), public origin (`BETTER_AUTH_URL`). SES (B9, not in code yet, provisional): `AWS_REGION`, `CRM_MAIL_FROM`; use an instance IAM role instead of access keys. |

## Order of steps

1. AWS side (Ahmed): account, instance, security group, Elastic IP, DNS, IAM role, SES (see below).
2. Base server: updates, `ubuntu` admin only with SSH key, user `crm`, directories, ufw/security group (22 from your IP, 80, 443).
3. Install Node 24.18.0 (exact), Postgres 17 (PGDG), nginx, certbot.
4. Postgres bootstrap: `crm_migrator`, database `crm`; write the two env files from shell variables (no secrets in shell history or argv).
5. Build release, rehearse migrate on a scratch DB, then migrate for real; revoke PUBLIC connect; provision tenant keys (`configure-identifier-key.js <tenant>`).
6. Install systemd unit, start, check `curl -H 'Accept: text/html' http://127.0.0.1:4317/app/` returns 200.
7. nginx site on port 80, certbot for TLS, enable headers/gzip/limits, reload.
8. Backup timer, run one backup and one restore test by hand.
9. Smoke test from outside; write down the previous release path for rollback.

Rollback: app = point `/opt/crm/current` at the previous release and restart (migrations so far are additive). Data = restore the pre-migrate dump into a NEW database, repoint `DATABASE_URL`; never edit applied SQL by hand. RPO equals the last dump.

## Gaps found

1. No health endpoint. Nothing like `/healthz` or `/readyz`; the DB key check runs only at boot. Interim: `GET /app/` with `Accept: text/html` (200) and `GET /v1/contacts` without headers (422 VALIDATION_FAILED) for liveness; a call with a random tenant UUID and a bad bearer token (401/403) proves the DB path. Needs a small code change later (liveness without DB, readiness with `SELECT 1` as crm_runtime).
2. Worker: `WORKER_CONTEXTS` holds service session tokens, and the only minting script is the synthetic `seed.ts`. No production minting exists (AUTH_PLAN says "script-minted"). Until then automation/outbox work would not run in production.
3. No tenant/admin bootstrap script for production (planned `create-tenant-admin.ts`, B4). Do not run `seed`/`seed:demo` in production.
4. `/`, `/foundation`, `/reporting` serve legacy unauthenticated pages from the API; hide them at nginx.
5. Dev Bearer path: today every non-cookie request is a bearer token. The production boot refusal and `CRM_DEV_BEARER` gate are planned (B3), not built. Real sign-in must land before any public exposure.
6. No structured access logs or metrics: only `console.error` at boot and an `X-Request-ID` header. Use nginx access logs plus journald; log the request id in nginx (`$upstream_http_x_request_id`).
7. `migrate.ts` is hard-coded to migrations 001-012 and to the crm_runtime password; migrations 013-016 and `crm_auth` need that script extended (AUTH_PLAN B1).
8. Migrations were only exercised with a superuser migrator (local `postgres`); the least-privilege `crm_migrator` path is unverified.
9. Docker `backup.ps1`/`restore.ps1` are Windows/compose only; server backup scripts still have to be written and tested.
10. Single instance, single disk, no HA, no tested RPO/RTO. Big client chunk (627 kB) is only a Vite warning.

## What Ahmed must do on AWS (nothing done yet)

- Create or confirm the AWS account, region (suggest closest to users) and billing alert.
- Launch an Ubuntu 24.04 LTS instance (size to be agreed, gp3 EBS, encrypted volume); create the SSH key pair and keep it safe.
- Security group: 22 from his IP only, 80 and 443 open; allocate an Elastic IP.
- Buy or point a domain; create the DNS A record to the Elastic IP (needed before certbot).
- Create an IAM instance role (SES send, optional S3 backup bucket write); create the S3 backup bucket with encryption, versioning and a lifecycle rule; schedule EBS snapshots (Data Lifecycle Manager).
- SES: verify the sender domain/address (DKIM, SPF), request production access (out of sandbox). Until then reset-by-email stays off (AUTH_PLAN D4).
- Approve the spend and give a go for each step; deploy, SSH and AWS access are still not authorised for agents.
