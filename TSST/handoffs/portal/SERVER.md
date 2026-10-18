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
| git, jq, rclone | 2.43.0, 1.7, 1.60.1 | Ubuntu |
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
