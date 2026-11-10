# Dash sprint: deploy plan (proposal, 2026-11-10)

Status: **proposal, waiting for Ahmed's OK**. Nothing is deployed. Live is still `6290115` (tag `v-before-sprint`).
Everything built sits on `next` = `3191704`; `main` = `8915d14` (S0-01 only). How a deploy runs and how to roll back is on
`BOARD.md` → Deploy. Each step below needs its own explicit OK in chat, on its day.

## The four steps
One part per night, in the quiet hours (proposed Cairo 01:00–06:00, decision 11), with a day between parts so a
problem shows before the next part lands. Each step = fast-forward `main` to the named commit of `next` (a PR into
`main`, three checks green), then the deploy command from `main`.

| Step | Part | `main` moves to | Carries | Migration | Roll back |
|---|---|---|---|---|---|
| A | S0 | `8915d14` (already there) | the missing SPA routes | none | `deploy.sh --rollback` (code only) |
| B | S1 | `28806f7` | CI, Cairo day, live fixes, the shared-files notice removed, one route list (S2-01, code only) | none | `deploy.sh --rollback` |
| C | S2 | `6f4a3bc` | a stable id for every job, one approvals service, delete = hide, one settings row per client, the server by domain, the old board gone | **031–035** | restore the pre-deploy dump, then redeploy step B's release |
| D | S3 | `3191704` | the new client page (Overview, Plan, Settings), the campaign page, the Clients cards | none | `deploy.sh --rollback` |

## Before step C (the only step with migrations)
- A fresh backup the same day (the deploy writes `pre-deploy-<release>.sql.gz` before migrating; also the nightly dump),
  and the off-server copy checked that day. The restore drill passed on 2026-11-06 (`tickets/S1-02.md`); its limits
  stand: it did not cover media, secrets or a server rebuild.
- The migrating role must own `portal.bridge_item_decision()` (migration 033 replaces it). Check on the server before
  the deploy; if another role owns it, the migration stops.
- Migration 032 (the job references) must run with S2-02b's code, which this step ships together: do not split S2.

## What changes for people, per step (say it to the team before each night)
- **C, first start:** every job is synced once (S2-03b), so the first start after the deploy takes longer than usual.
- **C, delete:** "Delete" hides (S2-04). If the code is rolled back alone, hidden rows show again and packages come
  back detached: after step C a rollback means the database restore, not the code switch.
- **C, client settings:** one row per client (S2-05). A code-only rollback would read the old visibility row and
  `brands.ui_lang` again, which stop being updated after step C.
- **C, old addresses:** the old board paths (`/legacy`, `/api/tree`, `/api/job`, …) answer 404; `POST /api/decision`
  answers 410; `GET /` with a session and no built front end answers 404 JSON.
- **D:** the client page has three tabs; old `?tab=` / `?view=` links redirect. Mark paid and Create invoice move to
  Documents. The link create / renew / reset-PIN controls leave the client page (they stay on Settings › Access).

## Live smoke per step (short; the full list goes on each step's deploy record)
- A: open `/client/work`, `/jobs/post`, `/clients/project` directly: the app shell, not 404.
- B: `/login` 200, `/api/v1/me` 401 without a session; a job page shows today's Cairo date on a new item.
- C: sign in; open a client, a job and an item; approve one test item as the team and see it in the client view of a
  test client; delete and restore nothing real. `schema_migrations` ends at 035.
- D: `/clients` cards show the health word; a client's Overview, Plan and Settings open; one switch in "What the
  client sees" saves; the campaign page opens from the Plan tab.

## Decisions Ahmed confirms at the gate
- 4, 5, 6 run on their defaults (no requests-per-month field; the growth-report link only when on and a result exists;
  no "Approve all" on the client Home).
- 11: the quiet hours and the nights.
- S3-01's thresholds: changes owed after 3 days, stuck with the client after 7 days (`health.ts`); say if they should
  differ.

## Not in this plan
- No Arabic on the team pages (no language switch exists), no "Archive client", no "Team on this client": not built.
- Follow-ups recorded on the tickets: migration 036 (drop `brands.ui_lang`, the old visibility row, the 027 trigger)
  after step C has settled; 12 tests that use the real `now()`; an archived project should stop the "waiting" count;
  the client Home reads a paused package's lines unguarded (pre-existing on live).
