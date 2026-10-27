# PORTAL-001 server runbook

Status: Phase 1 (server base) done 2026-10-18. No secrets in this file (keys, passwords, tokens are never written here).

## Facts
| Item | Value |
|---|---|
| Provider / region | AWS EC2, eu-central-1 (Frankfurt) |
| Type | t3.small, 2 vCPU, ~1.9 GB RAM |
| OS | Ubuntu 24.04.4 LTS, kernel 7.0.0-1014-aws |
| Disk | 29 GB root (EBS), ~27 GB free after base install |
| Public IPv4 | 63.185.191.224 (Elastic IP, fixed since 2026-10-28; the old auto-assigned 54.93.60.74 is gone) |
| Time zone | Africa/Cairo |
| Swap | 2 GB `/swapfile` (in /etc/fstab), `vm.swappiness=10` (/etc/sysctl.d/99-tsst.conf) |
| Security group | 22 (owner IP only), 80, 443. Managed in AWS, not on the server |

## Access
```
ssh -i /c/Users/10/.ssh/tsst-portal-key-fra.pem ubuntu@63.185.191.224
```
(Git Bash path; in PowerShell use `C:\Users\10\.ssh\tsst-portal-key-fra.pem`.) The key file stays on the PC only. User `ubuntu` has passwordless sudo.
sshd (`/etc/ssh/sshd_config.d/00-tsst-hardening.conf`): `PasswordAuthentication no`, `PermitRootLogin no`, `KbdInteractiveAuthentication no`. Key login only.
The IP is Elastic, so it survives stop/start. If Ahmed's own IP changed, update the security group rule for port 22.

## Installed (from Ubuntu repos or the vendors' official apt repos)
| Software | Version | Source |
|---|---|---|
| PostgreSQL | 16.15 | Ubuntu (`postgresql-16`), listens on 127.0.0.1:5432 only |
| Caddy | v2.11.7 | Cloudsmith official repo (`/etc/apt/sources.list.d/caddy-stable.list`) |
| Node.js / npm | v24.22.0 / 11.19.1 | NodeSource official apt repo (`node_24.x`, key `/usr/share/keyrings/nodesource.gpg`) |
| git, jq | 2.43.0, 1.7 | Ubuntu |
| rclone | v1.75.2 | official .deb from downloads.rclone.org, SHA256 verified (replaced Ubuntu 1.60.1, 2026-10-18) |
| ffmpeg (ffprobe), poppler-utils (pdftoppm) | 6.1.1, 24.02.0 | Ubuntu, `--no-install-recommends` (2026-10-21, Dash R3: video sizes, PDF page thumbnails) |
| ufw, fail2ban, unattended-upgrades | Ubuntu | see Security |

## Services (systemd, all enabled at boot)
- `caddy`: serves `/srv/tsst/www` on :80 (placeholder "The Systronic — قريباً"). Config `/etc/caddy/Caddyfile`. Admin API on 127.0.0.1:2019 only.
  Phase 2: replace `:80` with the DuckDNS hostname; Caddy then gets the Let's Encrypt certificate by itself (ports 80 and 443 must stay open).
  After any edit: `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy`.
- `postgresql` (cluster `16/main`): local only. Superuser is the OS user `postgres` (`sudo -u postgres psql`). No app roles or databases yet (created in later phases; passwords go to the server only, never to the repo).
- `fail2ban`: jail `sshd` (5 failures in 10 min = 1 h ban). Check: `sudo fail2ban-client status sshd`.
- `unattended-upgrades`: security updates daily (`/etc/apt/apt.conf.d/20auto-upgrades`). It does not auto-reboot; check `/var/run/reboot-required` now and then and reboot at a quiet time.
- `ufw`: default deny incoming; allow OpenSSH, 80/tcp, 443/tcp. Check: `sudo ufw status`.

## Paths
System user `tsst` (no login shell, home `/srv/tsst`) owns:
```
/srv/tsst/clients   mirror of Drive projects/ + approved/ (rclone, later)
/srv/tsst/portal    portal app (Phase 3+)
/srv/tsst/crm       CRM app (Phase 5)
/srv/tsst/backups   daily database dumps (mode 750, files 600)
/srv/tsst/www       static placeholder served by Caddy
```

## Backup
- Script `/usr/local/sbin/tsst-pg-backup.sh`: `pg_dumpall | gzip` to `/srv/tsst/backups/<YYYY-MM-DD>.sql.gz` (written as .tmp, then renamed), owner `tsst`, deletes dumps older than 7 days.
- Timer `tsst-pg-backup.timer`: every day 03:30 Cairo time, `Persistent=true` (runs after boot if a run was missed). Check: `systemctl list-timers tsst-pg-backup.timer`; last run: `journalctl -u tsst-pg-backup.service -n 20`.
- Run by hand: `sudo systemctl start tsst-pg-backup.service`.
- Every deploy (`scripts/deploy.sh`, DASH-001 C2) first writes `/srv/tsst/backups/pre-deploy-<release>.sql.gz`
  (`pg_dump` of the portal database as `tsst`, mode 600, `gzip -t` checked; the 10 newest kept). If the dump fails,
  the deploy stops before migrate. Migrations are forward-only: a code rollback keeps the database; restore from this dump.
- Test dump of 2026-10-18 created and verified (`gzip -t` OK; 701 bytes because the cluster is still empty).
- Off-server copy: done by the PC pulling, see "Off-server copy (PC pull)" below (the rclone-on-server idea is dropped).

### Off-server copy (PC pull)
- What: Ahmed's PC pulls over ssh (read-only `sudo find` / `sudo cat`, nothing changes on the server). `db\`: every nightly dump it does not have yet + the newest `pre-deploy-*` dump, each gzip-verified before it is kept; newest 30 daily dumps kept (10 pre-deploy). `media\`: incremental mirror of `/srv/tsst/dash-media` (new/changed files only; files that vanish on the server are logged, never deleted here).
- Where: `G:\My Drive\TSST-Backups\dash\` (`db\`, `media\`, `LAST_RUN.txt` = date, counts, newest dump). Deliberately NOT inside TSST-Clients (that folder is mirrored to the server). Script `scripts/pull-backup.py` in the tsst-portal repo (`C:\Work\tsst-portal`). Log `%LOCALAPPDATA%\tsst-review\backup.log` (rotated at 100 KB).
- Schedule: task "TSST Dash backup", hourly, `pythonw`, current user, only when logged on, no admin. A stamp (`%LOCALAPPDATA%\tsst-review\backup.stamp`) makes it once per day; a failed run leaves no stamp and retries next hour; PC off = it catches up at the next hour after logon. Offline: quiet exit 0.
- Run/stop: `python C:\Work\tsst-portal\scripts\pull-backup.py [--dry-run] [--force]`; `schtasks /Run /TN "TSST Dash backup"`, `schtasks /End /TN "TSST Dash backup"`, `schtasks /Delete /TN "TSST Dash backup" /F`.
- Restore: use "How to restore a backup" below, with the file from `G:\My Drive\TSST-Backups\dash\db\` copied to the server (`scp`) instead of `/srv/tsst/backups/`. Media: copy `media\` back into `/srv/tsst/dash-media` (owner `tsst`, mode 750). Dumps hold password hashes: keep the folder private.
- First real run 2026-10-23: 6 daily dumps + newest pre-deploy copied, all `gzip -t` OK; media empty at that time.

## How to restore a backup
A dump holds the whole cluster (all databases, roles, passwords hashes). Restore into a clean cluster:
```
# 1. stop apps that use the database (later: portal, crm)
sudo systemctl stop postgresql
# 2. (only if replacing a damaged cluster) recreate it empty
sudo pg_dropcluster 16 main
sudo pg_createcluster 16 main --start
# 3. load the dump (pick the file by date)
sudo zcat /srv/tsst/backups/2026-10-18.sql.gz | sudo -u postgres psql -v ON_ERROR_STOP=0 -f - postgres
# 4. start apps again and check
sudo -u postgres psql -c '\l'
```
Notes: if the cluster is healthy and only one database is bad, load into a spare server/cluster first, then copy the needed database out with `pg_dump`/`pg_restore`. Step 3 prints "role postgres already exists" errors on a fresh cluster; these are expected. To test a restore without risk, restore on another machine with PostgreSQL 16.

## Not yet done (later phases)
- DuckDNS name + HTTPS (Phase 2), UptimeRobot monitor (needs the hostname). (Off-server backup copy: done, see Backup.)
- Elastic IP: done 2026-10-28 (63.185.191.224, see "Domain move" below). No DuckDNS IP updater needed.

## Phase 2: domain + HTTPS (2026-10-18)
- DuckDNS: `the-systronic.duckdns.org` → 54.93.60.74 (set by Ahmed in the DuckDNS web page). Sub-names resolve
  to the same IP: `dash.systronic.duckdns.org` (old `dash.systronic.duckdns.org` 301-redirects since 2026-10-24), `crm.the-systronic.duckdns.org`.
- Caddy (`/etc/caddy/Caddyfile`, backup of phase 1 at `Caddyfile.phase1.bak`): automatic Let's Encrypt
  certificates for the three names (issuer YE1, auto-renew), HTTP → HTTPS 308, HSTS, nosniff; portal and crm send
  `X-Robots-Tag: noindex`. All three serve the placeholder until their apps exist. No ACME contact email is set.
- The bare IP still answers on plain HTTP with the placeholder.
- The IP is not Elastic: after a stop/start, update it in DuckDNS (web page, "update ip"). An automatic updater
  needs the DuckDNS token on the server; Ahmed places it himself (never in the repo or in chat).

## Phase 3 / R3a: portal app deployed (2026-10-18)
Live: https://dash.the-systronic.com (was dash.systronic.duckdns.org until 2026-10-28; `/login` 200, `/api/tree` 401 without a session, `/` 302 to `/login`).
Source of all server files: repo `C:\Work\tsst-portal`, folder `scripts/server/` (+ `scripts/deploy.sh`). No secrets in any of them.

| Item | Value |
|---|---|
| Service | `tsst-portal.service` (User `tsst`, enabled at boot, Restart=on-failure, hardened: NoNewPrivileges, ProtectSystem=strict, ProtectHome, PrivateTmp, only `/var/cache/tsst-portal` writable). Runs TypeScript through `tsx` (moved to a runtime dependency; no build step). Listens on 127.0.0.1:3100 only |
| App | `/srv/tsst/portal/releases/<git sha>`; `current` and `previous` are symlinks; the 5 newest releases are kept |
| Config | `/etc/tsst-portal/portal.env` (root:tsst 640): never print it. `BETTER_AUTH_SECRET` was generated on the server |
| Database | Postgres role `tsst` + database `portal` (owner `tsst`), peer auth over `/var/run/postgresql`, no password. Included in the daily dump |
| Caddy | `dash.the-systronic.com` (both duckdns Dash names 301-redirect to it since 2026-10-28) reverse-proxies to 127.0.0.1:3100 (HSTS, nosniff, noindex kept). Website root and crm stay placeholders. Backups: `Caddyfile.phase1.bak`, `Caddyfile.phase2.bak` |
| Portfolio | `/srv/tsst/portal/portfolio.yaml` (copy of `TSST/core/portfolio.yaml`, refreshed on every deploy) |
| Thumb cache | `/var/cache/tsst-portal` |
| Helper | `/usr/local/bin/tsst-portal-run <npm-script>` (run as `tsst`: loads the env file, runs `npm run`) |

### Deploy (from the PC, Git Bash, in `C:\Work\tsst-portal`)
```
scripts/deploy.sh             # HEAD must be committed (refuses uncommitted tracked changes)
scripts/deploy.sh --dirty     # HEAD + uncommitted tracked changes (release name ends -dirty-<time>)
```
Steps: `git archive` -> scp -> unpack to a new release folder -> `npm ci --omit=dev` -> migrations -> atomic symlink switch -> restart -> health check (`/login` on 127.0.0.1:3100, up to 30 s). A failed health check switches back to the previous release by itself. The server holds no GitHub credential.
The first deploy was `--dirty` (release `b52a81867-dirty-...`): run a normal `scripts/deploy.sh` once the Lead has committed.

### Rollback
```
scripts/deploy.sh --rollback     # switch to `previous`, restart, health check
```
Manual: `sudo ln -sfn /srv/tsst/portal/releases/<old> /srv/tsst/portal/current.new && sudo mv -T /srv/tsst/portal/current.new /srv/tsst/portal/current && sudo systemctl restart tsst-portal`. Migrations only go forward; a rollback keeps the newer schema, so migrations must stay additive.
Logs: `sudo journalctl -u tsst-portal -n 50`. Status: `systemctl is-active tsst-portal`.

### Drive mirror (rclone, read-only)
- Config `/var/lib/tsst-rclone/rclone.conf` (tsst:tsst 600, remote `gdrive`, scope `drive.readonly`). It is NOT under `/etc/tsst-portal/` because rclone rewrites the file when the access token refreshes (needs a folder `tsst` can write to).
- `tsst-drive-sync.timer`: every 5 min (2 min after boot) -> `tsst-drive-sync.service` -> `/usr/local/bin/tsst-drive-sync`: `rclone sync gdrive:TSST-Clients /srv/tsst/clients` as `tsst`, `flock` lock, `--drive-skip-gdocs`, `--delete-excluded`, `--max-delete 200`, logs in the journal. While the config file is missing it only logs "not linked yet" and exits 0.
- Filter `/etc/tsst-portal/drive-filter.txt`: includes `<brand>/projects/**`, `approved/**`, `photos/**`, `*.md`, `*.yaml` (root and brand top level); excludes `archive/**`, `desktop.ini`, `Thumbs.db`, `.DS_Store`; everything else is skipped.
- Receiver `/usr/local/bin/tsst-rclone-token` (root): reads the `rclone authorize` output from stdin, keeps only the token between rclone's paste markers, writes the config, lists the folders in `TSST-Clients`, starts the first sync. It never prints the token.
- Check: `systemctl list-timers tsst-drive-sync.timer`, `sudo journalctl -u tsst-drive-sync -n 20`.
- Revoke: `sudo rm /var/lib/tsst-rclone/rclone.conf` and remove the app at https://myaccount.google.com/permissions.

### Authorise Drive with a service account (Ahmed, PowerShell on the PC, once) — preferred since 2026-10-18
Why: rclone's shared OAuth client is being retired during 2026; an own OAuth client in "Testing" expires every 7 days
and Google's "Publish app" stayed disabled. A service account never expires and sees only what is shared with it.
Google Cloud project `tsst-drive` (Drive API enabled) -> IAM & Admin -> Service Accounts -> `tsst-portal-drive`, no
roles -> Keys -> JSON key into Downloads. In Drive, `TSST-Clients` is shared with the account's
`...iam.gserviceaccount.com` address as **Viewer**.
```
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\10\tsst-tools\rclone\drive-link-sa.ps1"
```
The helper moves the key to `C:\Users\10\.ssh\tsst-drive-sa.json` and pipes it to `/usr/local/bin/tsst-rclone-sa`
(root). The receiver tests the key with a temporary config (`shared_with_me = true`, `drive.readonly`) and switches only
when `gdrive:TSST-Clients` lists; otherwise it prints the address to share with and leaves the current link alone.
On success: key `/var/lib/tsst-rclone/sa.json` (tsst 600), old config kept as `rclone.conf.prev` (rollback:
`sudo mv /var/lib/tsst-rclone/rclone.conf.prev /var/lib/tsst-rclone/rclone.conf`). Revoke: remove the share in Drive
and delete the key in Google Cloud.

### Authorise Drive with an OAuth token (older way, kept as a fallback)
Own Google OAuth client: consent screen External and **published** (in "Testing" the token expires after 7 days),
client type Desktop app. Its `client_secret_*.json` is downloaded into Downloads; the helper moves it to
`C:\Users\10\.ssh\tsst-drive-client.json` and reuses it on later runs.
```
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\10\tsst-tools\rclone\drive-link.ps1"
```
The helper builds the authorize blob (base64 of `{"client_id","client_secret","scope":"drive.readonly"}` WITHOUT `=`
padding; rclone rejects the padded form) and sends `TSST_CLIENT_ID=` / `TSST_CLIENT_SECRET=` lines plus the
`rclone authorize` output to the receiver over ssh stdin. A browser opens for the Google sign-in; pick the account that
owns TSST-Clients, approve read-only access ("not verified" = your own app: Advanced -> Go to TSST Drive). The terminal
then prints `OK - Drive linked (own Google client)` and the folder names. Without a client file the older one-liner
with blob `eyJzY29wZSI6ImRyaXZlLnJlYWRvbmx5In0` still links through rclone's shared client.

### Create the first portal user (Ahmed, PowerShell, interactive; password typed twice, hidden)
```
ssh -t -i C:\Users\10\.ssh\tsst-portal-key-fra.pem ubuntu@63.185.191.224 "sudo -u tsst tsst-portal-run user:add -- --email the.systronic@gmail.com --name 'Ahmed Fouad'"
```

### Reboot test (2026-10-18)
Server rebooted once: `tsst-portal`, `caddy`, `postgresql` active, timers back, `/login` 200, `/api/tree` 401, `/` 302. The journal was searched for the auth secret: no hit.

### Review decisions: import / export / pull (R3b, 2026-10-18)
The portal database is the source of truth for review decisions; the `review` block of each job's `DELIVERY.json` is a mirror.
- Import (once, after the Drive mirror finished): `sudo -u tsst tsst-portal-run import:review`. Reads every `BRANDS_ROOT/*/projects/**/DELIVERY.json` `review` block into `decision_history` (source `import`, `decided_by` from `by`, `decided_at` from `date` at 00:00 UTC). Idempotent: an entry whose status and note already match is skipped; a different current decision made on or after the file's date is kept (the database wins). Prints one line per job (in file / inserted / same / db newer / skipped). Exit 1 if a manifest is unreadable.
- Export: `sudo -u tsst tsst-portal-run export:decisions` prints ONE line of JSON `[{brand, job, key, status, note, by, date}]` (current decisions; no ids, no secrets). npm prints a banner before it; the line starts with `[`.
- Pull (PC): `python TSST/services/review/pull_decisions.py [--dry-run]` runs the export over ssh (key `~/.ssh/tsst-portal-key-fra.pem`, BatchMode), writes changed jobs' `review` blocks (indent and newline kept; local-only keys kept), then `build_delivery.py` for changed jobs that have a DELIVERY.html, then `sync_jobs.py <brand>`. Offline: quiet exit 0. Log `%LOCALAPPDATA%/tsst-review/pull.log` (rotated at 100 KB). Scheduled task "TSST pull decisions": every 15 min, `pythonw`, current user, only when logged on, no admin. Run/stop: `schtasks /Run /TN "TSST pull decisions"`, `schtasks /End ...`, `schtasks /Delete /TN "TSST pull decisions" /F`.

## Domain move: Dash at https://dash.the-systronic.com (2026-10-28)
Owner Ahmed approved. The Dash now lives on his own domain; DuckDNS names only redirect.
- Elastic IP **63.185.191.224** attached to the instance (replaces 54.93.60.74). Every SSH command and the default `TSST_HOST` in `deploy.sh`, `pull-backup.py` and `services/review/pull_decisions.py` use it.
- DNS: `dash.the-systronic.com` A record (Namecheap) → 63.185.191.224. `dash.systronic.duckdns.org` → 63.185.191.224 (done). `the-systronic.duckdns.org` (and `portal.`/`crm.` under it) still pointed to 54.93.60.74 at move time: **Ahmed updates it in DuckDNS**; until then the old `portal.the-systronic.duckdns.org` links do not reach the server (Caddy's redirect for it works, tested with a forced resolve).
- Caddy (`scripts/server/Caddyfile` = `/etc/caddy/Caddyfile`): `dash.the-systronic.com` reverse-proxies to 127.0.0.1:3100 (HSTS, nosniff, referrer policy, `X-Robots-Tag: noindex, nofollow`, no Server header). `dash.systronic.duckdns.org` and `portal.the-systronic.duckdns.org` → `301 https://dash.the-systronic.com{uri}` (path and query kept). Certificate for the new name: Let's Encrypt (YE1), issued 2026-10-28, valid to 2027-01-25, auto-renew. No ACME email. Other blocks (root, crm, bare-IP placeholder) untouched; the bare-IP block still names the old IP (`http://54.93.60.74`), so it no longer matches: change it to the new IP only if the plain-HTTP placeholder is wanted.
- App env: `PUBLIC_ORIGIN=https://dash.the-systronic.com`, `ALLOWED_HOSTS=dash.the-systronic.com` (only these two lines changed; `provision.sh` matches).
- Verified 2026-10-28: `/login` 200, `/api/tree` 401 without a session, old duckdns URL `/jobs/abc?x=1` → 301 `https://dash.the-systronic.com/jobs/abc?x=1`.
- Rollback: backups `/etc/caddy/Caddyfile.pre-dash-domain2-20261028-015543.bak` and `/etc/tsst-portal/portal.env.pre-dash-domain2-20261028-015543.bak`.
  `sudo cp -p /etc/caddy/Caddyfile.pre-dash-domain2-20261028-015543.bak /etc/caddy/Caddyfile && sudo cp -p /etc/tsst-portal/portal.env.pre-dash-domain2-20261028-015543.bak /etc/tsst-portal/portal.env && sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy && sudo systemctl restart tsst-portal`
