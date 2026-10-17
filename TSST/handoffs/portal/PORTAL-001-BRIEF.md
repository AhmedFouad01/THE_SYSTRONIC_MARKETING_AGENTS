# PORTAL-001: online portal + CRM on AWS (brief)

Owner: Ahmed. Approved 2026-10-18 as an R46 exception (rules.md). Domain: free DuckDNS (no owned domain).
Goal: one online place for all client work. It replaces "open REVIEW.bat on my PC" and later the static
DELIVERY.html pages. It has two faces: an internal portal for the team, and a client portal reached by an access-token link.
The design must allow linking it later to the agency website and to the CRM.

## Architecture (decided)
```
Ahmed's PC / agents ──write──▶ Google Drive (G:/My Drive/TSST-Clients) = file source of truth
                                   │ rclone, read-only Drive scope, every 5 min
                                   ▼
AWS EC2 (Ahmed's existing instance)
  Caddy (reverse proxy, automatic Let's Encrypt HTTPS)
    <name>.duckdns.org/team        internal portal (login)
    <name>.duckdns.org/c/<token>   client portal (token link)
    <name>.duckdns.org/crm         CRM (C:/Work/tsst-crm, already planned for EC2)
  Portal app — same stack as the CRM: Node 24 + TypeScript, Postgres, better-auth
  Postgres — one server: schema `crm` + schema `portal`
                                   │ API
                                   ▼
TSST/services/review pull script on the PC: writes decisions into each job's DELIVERY.json "review"
(agents keep reading decisions from files, as AGENTS.md says)
```
- Files: Drive is the source of truth. The server only mirrors `projects/` and `approved/` (no `archive/`
  and no raw photo banks); web-size derivatives are cached on the server. Client media is about 4.8 GB today.
- Decisions: Postgres is the source of truth. The pull script copies them to `review` blocks; the board's
  rules (tabs, post cards, file#anchor keys, noise/rejected folders) are reused unchanged.
- Client portal: per-brand token links, 128-bit random, stored hashed, with expiry and revoke. Clients see
  only approved, non-internal items (same leak rules as build_delivery client pages). They can approve or
  request changes and comment, and those show in the internal portal.
- Internal portal: login with better-auth, the same users as the CRM later. It has everything the review
  board has, plus delivery-page detail (status, next steps, decisions log).
- Later integration: a `clients` table maps brand id ↔ CRM client id; token links are issued from the CRM;
  the website gets a "client login" link; email notifications go through SES (the CRM already has a mailer).

## Phases
0. Ahmed, in person (credentials stay his): instance facts (type, OS, region, disk, free-tier status), DuckDNS
   name, SSH key path on this PC, and later the Google Drive authorisation for rclone.
1. Server base (tsst-dev): SSH key only, firewall 22/80/443, updates, swap, Caddy, Postgres, daily
   pg_dump → Drive, UptimeRobot.
2. DuckDNS + HTTPS (an IP updater on the server only if the public IP is not fixed).
3. Internal portal v1 = review board parity online, plus login.
4. Client portal (tokens, client approve/comment).
5. CRM deploy on the same server (its own pre-launch hardening: secrets, trust proxy, TOTP).
6. Later: website link, CRM ↔ portal, notifications.

## Cost watch (tell Ahmed before anything can bill)
- The public IPv4 address is billed after free-tier coverage (about USD 3.6/month); check his free-tier status first.
- EBS above the free allowance, snapshots, and data out above the free allowance.
- Instance size: with 1 GB RAM, Postgres + Node needs swap and lean settings.
