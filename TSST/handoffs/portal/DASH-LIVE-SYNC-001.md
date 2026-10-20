# DASH-LIVE-SYNC-001 - Drive to Dash, near real-time (design only)

Author: tsst-dev (BUILD) | Skills: DEV-SK-003 (trade-offs), DEV-SK-005 (API/webhook), DEV-SK-009 (failure)
Status: proposal for Ahmed. No code or server was touched. Date: 2026-10-21.

## 1. Where we are (read from the repo)
- rclone sync of Drive `TSST-Clients` to `/srv/tsst/clients`, whole tree listed each run.
- Repo timer says every 5 min (`tsst-drive-sync.timer`). Ahmed sees up to 15. Check live: see step 0.
- Dash reads the disk on every request (no cache in `scan.ts` / `loadWorld`). A file on disk = visible on next load.
- No live push to the browser exists. `useResource().reload()` already reloads and keeps old data on screen.
- Size of the mirrored tree (local copy of Drive): 5,336 files, 535 folders, 30 mp4, 8 files over 50 MB.
- The tree is small. That decides a lot below.

## 2. Verified Google facts (read 2026-10-21)
Push: https://developers.google.com/workspace/drive/api/guides/push
- Watch works on `files` and `changes`. Channel max life: files 1 day, changes 1 week; default 1 hour.
- "there's no automatic way to renew a notification channel". We must create a new channel (new id).
- Notifications have an empty body. They say "something changed", never what or where.
- Needs HTTPS with a valid certificate. Token (max 256 chars) comes back in `X-Goog-Channel-Token`.
- Success = 200/201/202/204/102. The page gives no delivery guarantee. Treat it as best effort.
- Service accounts may watch if they have access to the resource.
Changes: https://developers.google.com/workspace/drive/api/guides/manage-changes
- `getStartPageToken`, then `changes.list`. Oldest first. Includes files "shared with a user".
- Reference: https://developers.google.com/workspace/drive/api/reference/rest/v3/changes/list
- pageSize default 100, max 1000. "The page token doesn't expire."
- `restrictToMyDrive` must stay false, or shared files not added to My Drive are left out.
- Shared drive needs `driveId` or `includeItemsFromAllDrives` + `supportsAllDrives`.
Limits: https://developers.google.com/workspace/drive/api/guides/limits
- Per minute: 1,000,000 units per project, 325,000 per user. Free daily threshold: 400,000,000 units.
- Units: read item 5, list items 100, download 200. Egress 1 TB/day per project.
- Notifications are free. `changes.watch`, `files.watch`, `channels.stop` calls do cost units.
- Pricing: standard use is free. "Exceeding the quota ... is planned to incur charges ... later in 2026".
- Limits changed 1 May 2026. Older projects keep old quotas. We are far below either.
rclone: https://rclone.org/drive/  (`--fast-list`: 700 files = 38 s -> 10 s; 39,000 files = 22 min -> 58 s)
Not verified (assumption): `changes.list` is billed as "list" = 100 units. I use 100 to be safe.

## 3. Options compared (our tree, free tier = 400M units/day)
| Option | Latency | Units/day (share) | Complexity | Main failure | Security |
|---|---|---|---|---|---|
| a) changes.watch webhook | 2-5 s + sync | ~0 idle | High: public route, weekly renewal | Missed or late push, expired channel. Needs poll fallback anyway | New public endpoint. Spoofable, so token check + it only triggers a poll |
| b) poll changes.list 10 s | 5 s avg + sync | 0.9M (0.2%) | Medium | Feed lag, token loss | No new endpoint. Key stays on server |
| c1) rclone every 1 min, no fast-list | ~30-90 s | ~78M (19%) | Trivial | Run longer than 1 min | None new |
| c2) rclone every 1 min + `--fast-list` | ~30-75 s | ~2M (0.5%) | Trivial | RAM on small EC2 (5k files: fine) | None new |
| d) Refresh button | on demand, ~10-30 s | tiny | Low | Needs a worker to act | Logged-in team only |

Notes on (a):
- `files.watch` on a folder lives 1 day and, per the docs, reports changes of that item (children flag).
  Deep files would need a channel per folder (535) renewed daily. Not workable.
- `changes.watch` covers the whole service-account feed. Still needs `changes.list` after every ping.
- For one tenant with a tiny quota bill, push saves ~9k cheap polls/day and adds a public door
  plus a renewal job. Not worth it now. Same `kick()` function can be called by a webhook later.
Notes on (b): 10 s costs 8,640 calls/day. 5 s costs 17,280 (0.4%). Safe either way.
Notes on (c): quota is fine only with `--fast-list` (about 11-15 list calls per run instead of ~540).

## 4. Recommendation: b + d, built in two stages, with c2 as day-one quick win
One design: a small worker watches the Drive change feed every 10 s and rings a doorbell.
The Dash shows status live (SSE) and has a "Refresh from Drive" button.
```
 Ahmed's PC --Drive for desktop--> Google Drive (TSST-Clients)
                                        |  changes.list (every 10 s, saved page token)
                                        v
   tsst-drive-live.service (own process, holds the SA key, writes the mirror)
     poll -> change seen? -> mark dirty -> run tsst-drive-sync (rclone, --fast-list) -> /srv/tsst/clients
        |                                                         |
        +--> portal.drive_sync_state (token, status, rev) <-------+
                      ^                         |
 Refresh button --> portal.drive_sync_requests  | read every 1-2 s by the web process
                                                v
   Dash web (Node) --SSE /api/v1/drive/events--> browser: "Live, checked 6 s ago" + reload open page
```
Stage 1 (ship first): doorbell + existing rclone script. Expected end-to-end 15-30 s after Drive has the file.
Stage 2 (only if 15-30 s still feels slow): apply the change directly through the API. Expected 5-10 s.
Why this order: Stage 1 reuses tested rclone code (auth, retries, md5, deletes, `--max-delete`, filter).
All shared parts (poll loop, state table, SSE, button) are reused in Stage 2.
Be honest about the floor: Drive for desktop upload time on Ahmed's PC is outside our control.

### 4.1 Components
- `tsst-drive-live.service`: Node process, user `tsst`, `Restart=always`. Separate from the web process so
  the internet-facing app never holds the Drive key. `ReadWritePaths` = mirror, rclone dir, `/run/tsst-drive-sync`.
- Auth: service-account JWT signed with `node:crypto` (no new dependency). Scope `drive.metadata.readonly` for polling.
  rclone keeps `drive.readonly`. Key file already at `/var/lib/tsst-rclone/sa.json`. Never logged.
- Page token: DB row `portal.drive_sync_state` (not a file). Advanced only after `dirty=true` is saved.
- Loop: poll -> if any change: `dirty=true`, save token -> run sync (min 10 s between runs, changes during a run
  coalesce into one more run) -> on success `dirty=false`, `rev=rev+1`.
- Crash/restart: `dirty=true` on boot means "sync now". Sync is idempotent. Nothing is lost.
- Lost or invalid token: take a fresh start token, force one full sync.
- Old timer stays as a safety net, slowed to hourly. Both use the same flock, so they never overlap.
- 403/429/5xx: exponential backoff with jitter (1 s up to 5 min). 401/invalid_grant: status `error: auth`.

### 4.2 What each hard case does
| Case | Stage 1 (rclone does it) | Stage 2 (direct apply, if built) |
|---|---|---|
| File id to path | rclone resolves paths | `drive_nodes(id,name,parent,md5,size,path)`; path from parent chain |
| Delete | rclone sync, `--max-delete 200` | Same cap; mass `removed` (share revoked) = stop, flag, no wipe |
| Rename / move | seen as delete + copy | `fs.rename`; a folder rename updates subtree paths in one SQL (feed only lists the folder) |
| Large video | rclone streams, retries | Stream to `.part`, check size + md5, then atomic rename; check free disk first |
| Google Docs/Sheets | skipped (`--drive-skip-gdocs`), unchanged | Skip the same mime types; shortcuts: count them in the spike first |
| First full sync | existing rclone sync | `files.list` crawl (pageSize 1000, ~10 calls) after taking the start token, then apply feed |
| Names | rclone encodes `/` etc. | Same encoding, reject `.`/`..`, duplicate names in one folder: first wins, log the other |
| Crash | dirty flag | Token advanced only after the batch is applied; apply is idempotent |

### 4.3 What the Dash shows
- `GET /api/v1/drive/status` -> `{ state, checked_at, last_sync_at, syncing, error, rev }`.
- One status line in the shell: "Live - checked 6 s ago" / "Syncing..." / "Drive link delayed - last check 4 min ago".
  "Checked" uses the last good poll, not the last change, so a quiet folder still shows fresh.
- `GET /api/v1/drive/events` (SSE, team session). The web process reads `rev` every 1-2 s (one shared timer)
  and pushes `{rev}`. Heartbeat every 25 s. Browser reloads the open page through `reload()`, debounced 1 s.
  If SSE fails: plain polling of `/status` every 15 s. Cap: 5 streams per user.
- `POST /api/v1/drive/refresh` (team): inserts a request row, returns 202; worker acts within 1-2 s;
  button shows "Updating..." then "Updated". Max 1 per 5 s per user. Caddy passes `text/event-stream`;
  verify no buffering with `encode` in the test.
- Client-link pages (`/c/<token>`) stay as today (reload on tab focus). Live push for clients is a later option.

### 4.4 Security
- No new public endpoint. SA key stays server-side, 0600, only the worker reads it. Read-only scopes.
- Events carry only `rev` numbers, never file names. Status and refresh need a team login and same-origin checks.
- If (a) is added later: random channel token (32 bytes) in DB, constant-time compare, known channel id,
  ignore old `X-Goog-Message-Number`, answer 204 fast. A forged ping can only cause one extra poll.

## 5. Implementation plan
Step 0 - gate (0.25 day, needs server access, not done here):
- `systemctl list-timers` and `journalctl -u tsst-drive-sync` to see real interval and run time.
- One-off script: `getStartPageToken`, then Ahmed edits a file two folders deep, then `changes.list`.
  Must show the change within seconds. If it does not, stop and use c2 + d only (Step 1 below).
Step 1 - quick win (0.25 day): add `--fast-list` to `scripts/server/tsst-drive-sync`; timer to 1 min; reprovision.
  Measure run time and RAM. Rollback: revert both files.
Step 2 - migration `migrations/011_drive_sync.sql` (additive): `portal.drive_sync_state` (single row, token, dirty,
  status, checked_at, last_sync_at, error code, rev), `portal.drive_sync_requests` (who, when, done_at).
Step 3 - worker (1 day): `src/service/drive/google-auth.ts`, `changes.ts`, `runner.ts`, `src/cli/drive-live.ts`;
  `scripts/server/tsst-drive-live.service`; `provision.sh` lines; env `DRIVE_POLL_SECONDS=10`, `DRIVE_LIVE=on|off`.
  Run first in log-only mode for a day: counts and latency of seen changes.
Step 4 - API (0.75 day): `src/server/v1/drive.ts` (status, events, refresh), register in `v1/index.ts`, `docs/DASH-API.md`.
Step 5 - web (0.75 day): `web/src/lib/driveSync.ts` (EventSource + fallback), status line, Refresh button on client
  and job pages, EN/AR strings in `copy`, mock API entries.
Step 6 - tests (1 day), same vitest style as the repo:
- Fake Drive server (`node:http`): paging, token advance, 403/429 backoff, invalid token, mass-removal guard.
- Runner with injected spawn: coalescing, 10 s gap, crash with `dirty=true`, concurrent refresh requests.
- API: roles (client link gets 403), SSE headers and `rev` event, refresh rate limit, no file names in events.
- Migration test next to `tests/migrate*.test.ts`.
Stage 2 (optional, 2-3 days): `drive_nodes`, direct apply, sanitizer, filter parity test against `drive-filter.txt`.
Effort Stage 0+1: ~4.5 days incl. tests. Quick win alone: 0.25 day.

Rollout: deploy with `DRIVE_LIVE=off`; log-only day; switch on; watch units/day in Cloud console.
Rollback: `systemctl disable --now tsst-drive-live`, timer back to 5 min. Tables stay unused. Web hides the
status line when status says `disabled`. Disk mirror is always valid because rclone remains the writer.

## 6. Risks
- Step 0 unproven: the feed for a Viewer service account on a shared My Drive folder may lag or omit inherited
  items. Fallback is c2 + d (30-75 s). This is the main risk.
- Doorbell fires for edits outside the mirror (e.g. `archive`): harmless, one cheap fast-list run.
- Quota rules may start billing later in 2026; we use under 1% of the free daily threshold (it cannot be raised).
- A forgotten `--fast-list` or a 1-min timer without it costs 19% of the daily threshold (see table).
- Out of scope: decisions PC -> portal (`pull_decisions.py`) stay on their own 15-min cycle.
