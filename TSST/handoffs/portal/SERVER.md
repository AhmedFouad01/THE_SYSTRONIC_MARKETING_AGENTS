# PORTAL-001 server runbook

Status: Phase 1 (server base) done 2026-10-18. No secrets in this file (keys, passwords, tokens are never written here).

## Facts
| Item | Value |
|---|---|
| Provider / region | AWS EC2, eu-central-1 (Frankfurt) |
| Type | t3.small, 2 vCPU, ~1.9 GB RAM |
| OS | Ubuntu 24.04.4 LTS, kernel 7.0.0-1014-aws |
| Disk | 29 GB root (EBS), ~27 GB free after base install |
| Public IPv4 | 54.93.60.74 (auto-assigned, NOT Elastic: it can change after a stop/start) |
| Time zone | Africa/Cairo |
| Swap | 2 GB `/swapfile` (in /etc/fstab), `vm.swappiness=10` (/etc/sysctl.d/99-tsst.conf) |
| Security group | 22 (owner IP only), 80, 443. Managed in AWS, not on the server |

## Access
```
ssh -i /c/Users/10/.ssh/tsst-portal-key-fra.pem ubuntu@54.93.60.74
```
(Git Bash path; in PowerShell use `C:\Users\10\.ssh\tsst-portal-key-fra.pem`.) The key file stays on the PC only. User `ubuntu` has passwordless sudo.
sshd (`/etc/ssh/sshd_config.d/00-tsst-hardening.conf`): `PasswordAuthentication no`, `PermitRootLogin no`, `KbdInteractiveAuthentication no`. Key login only.
If the IP changes after a stop/start, take the new IP from the EC2 console and update the security group rule for port 22 if Ahmed's own IP changed.

## Installed (from Ubuntu repos or the vendors' official apt repos)
| Software | Version | Source |
|---|---|---|
| PostgreSQL | 16.15 | Ubuntu (`postgresql-16`), listens on 127.0.0.1:5432 only |
| Caddy | v2.11.7 | Cloudsmith official repo (`/etc/apt/sources.list.d/caddy-stable.list`) |
| Node.js / npm | v24.22.0 / 11.19.1 | NodeSource official apt repo (`node_24.x`, key `/usr/share/keyrings/nodesource.gpg`) |
| git, jq | 2.43.0, 1.7 | Ubuntu |
| rclone | v1.75.2 | official .deb from downloads.rclone.org, SHA256 verified (replaced Ubuntu 1.60.1, 2026-10-18) |
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
- Test dump of 2026-10-18 created and verified (`gzip -t` OK; 701 bytes because the cluster is still empty).
- NOT done yet: copy to Google Drive. Waits for Ahmed to authorise rclone himself (`rclone config` run by him on the server; the token stays in the server's rclone config, never in the repo). Backups are only on the same disk until then. Do not treat them as off-site.

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
- DuckDNS name + HTTPS (Phase 2), UptimeRobot monitor (needs the hostname), Drive upload of backups (needs Ahmed's rclone authorisation).
- Elastic IP: not allocated (cost watch in the brief: public IPv4 is billed after free-tier coverage). Without it the IP can change on stop/start; Phase 2 then needs the DuckDNS IP updater.

## Phase 2: domain + HTTPS (2026-10-18)
- DuckDNS: `the-systronic.duckdns.org` → 54.93.60.74 (set by Ahmed in the DuckDNS web page). Sub-names resolve
  to the same IP: `portal.the-systronic.duckdns.org`, `crm.the-systronic.duckdns.org`.
- Caddy (`/etc/caddy/Caddyfile`, backup of phase 1 at `Caddyfile.phase1.bak`): automatic Let's Encrypt
  certificates for the three names (issuer YE1, auto-renew), HTTP → HTTPS 308, HSTS, nosniff; portal and crm send
  `X-Robots-Tag: noindex`. All three serve the placeholder until their apps exist. No ACME contact email is set.
- The bare IP still answers on plain HTTP with the placeholder.
- The IP is not Elastic: after a stop/start, update it in DuckDNS (web page, "update ip"). An automatic updater
  needs the DuckDNS token on the server; Ahmed places it himself (never in the repo or in chat).

## Phase 3 / R3a: portal app deployed (2026-10-18)
Live: https://portal.the-systronic.duckdns.org (`/login` 200, `/api/tree` 401 without a session, `/` 302 to `/login`).
Source of all server files: repo `C:\Work\tsst-portal`, folder `scripts/server/` (+ `scripts/deploy.sh`). No secrets in any of them.

| Item | Value |
|---|---|
| Service | `tsst-portal.service` (User `tsst`, enabled at boot, Restart=on-failure, hardened: NoNewPrivileges, ProtectSystem=strict, ProtectHome, PrivateTmp, only `/var/cache/tsst-portal` writable). Runs TypeScript through `tsx` (moved to a runtime dependency; no build step). Listens on 127.0.0.1:3100 only |
| App | `/srv/tsst/portal/releases/<git sha>`; `current` and `previous` are symlinks; the 5 newest releases are kept |
| Config | `/etc/tsst-portal/portal.env` (root:tsst 640): never print it. `BETTER_AUTH_SECRET` was generated on the server |
| Database | Postgres role `tsst` + database `portal` (owner `tsst`), peer auth over `/var/run/postgresql`, no password. Included in the daily dump |
| Caddy | `portal.the-systronic.duckdns.org` reverse-proxies to 127.0.0.1:3100 (HSTS, nosniff, noindex kept). Website root and crm stay placeholders. Backups: `Caddyfile.phase1.bak`, `Caddyfile.phase2.bak` |
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

### Authorise Drive (Ahmed, PowerShell on the PC, once)
The blob is base64 of `{"scope":"drive.readonly"}` WITHOUT `=` padding (rclone rejects the padded form).
```
& "C:\Users\10\tsst-tools\rclone\rclone.exe" authorize "drive" "eyJzY29wZSI6ImRyaXZlLnJlYWRvbmx5In0" | ssh -i C:\Users\10\.ssh\tsst-portal-key-fra.pem ubuntu@54.93.60.74 "sudo tsst-rclone-token"
```
A browser opens for the Google sign-in; approve read-only access. The terminal then prints `OK - Drive linked` and the folder names.

### Create the first portal user (Ahmed, PowerShell, interactive; password typed twice, hidden)
```
ssh -t -i C:\Users\10\.ssh\tsst-portal-key-fra.pem ubuntu@54.93.60.74 "sudo -u tsst tsst-portal-run user:add -- --email the.systronic@gmail.com --name 'Ahmed Fouad'"
```

### Reboot test (2026-10-18)
Server rebooted once: `tsst-portal`, `caddy`, `postgresql` active, timers back, `/login` 200, `/api/tree` 401, `/` 302. The journal was searched for the auth secret: no hit.

### Review decisions: import / export / pull (R3b, 2026-10-18)
The portal database is the source of truth for review decisions; the `review` block of each job's `DELIVERY.json` is a mirror.
- Import (once, after the Drive mirror finished): `sudo -u tsst tsst-portal-run import:review`. Reads every `BRANDS_ROOT/*/projects/**/DELIVERY.json` `review` block into `decision_history` (source `import`, `decided_by` from `by`, `decided_at` from `date` at 00:00 UTC). Idempotent: an entry whose status and note already match is skipped; a different current decision made on or after the file's date is kept (the database wins). Prints one line per job (in file / inserted / same / db newer / skipped). Exit 1 if a manifest is unreadable.
- Export: `sudo -u tsst tsst-portal-run export:decisions` prints ONE line of JSON `[{brand, job, key, status, note, by, date}]` (current decisions; no ids, no secrets). npm prints a banner before it; the line starts with `[`.
- Pull (PC): `python TSST/services/review/pull_decisions.py [--dry-run]` runs the export over ssh (key `~/.ssh/tsst-portal-key-fra.pem`, BatchMode), writes changed jobs' `review` blocks (indent and newline kept; local-only keys kept), then `build_delivery.py` for changed jobs that have a DELIVERY.html, then `sync_jobs.py <brand>`. Offline: quiet exit 0. Log `%LOCALAPPDATA%/tsst-review/pull.log` (rotated at 100 KB). Scheduled task "TSST pull decisions": every 15 min, `pythonw`, current user, only when logged on, no admin. Run/stop: `schtasks /Run /TN "TSST pull decisions"`, `schtasks /End ...`, `schtasks /Delete /TN "TSST pull decisions" /F`.
