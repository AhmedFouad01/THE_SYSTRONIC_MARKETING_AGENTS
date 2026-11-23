# Area: SERVER AND API (re-run 2026-11-23)

Evidence is about `next` (`e758f9a`, checkout /Users/fouad/Work/tsst-portal-s603) ONLY. The live site runs `main` = `6a28ba3`, so none of the FIXED items below is live. Read only: grep, git show/ls-tree, `npx tsx scripts/route-table.ts` (190 routes: 74 GET, 52 POST, 25 DELETE, 22 PATCH, 17 PUT). Tests not run. The decision-history behaviour was read from code, not exercised.

## 1. Findings of 5 Nov

**Three ways to record decisions / new model writes through old `decision_history`: PARTLY.**
- The old ways are closed. `POST /api/decision` returns 410 for a signed-in user (`src/server/app.ts:470-472`). `POST /decisions`, `/decisions/batch` and `client-view/decisions` return 410 (`src/server/v1/approvals.ts:421-433`). `src/service/save-decision.ts` is deleted (`git diff --name-status`, status D). One live path remains: `items/:id/decisions` (`approvals.ts:261`) and `client-view/items/:id/decisions` (`approvals.ts:322`).
- The writer still goes through the old table. `src/service/dash/job-model.ts:325-329` INSERTs `portal.decision_history(... bridged=true)` first, then `item_decisions` (line 330). The `bridged` mark makes the migration-027 trigger step aside.
- Other writers of the old table: `src/db/repo.ts:62` (`insertDecision`), `src/server/v1/publishing.ts:355` ("edited after review" rows), `src/service/review-mirror.ts` (CLI import).
- Old readers are unchanged: `jobs.ts:773`, `packages.ts:424,460,547`.
- So "one way in" is true. "One place of truth" is not.

**Server files split by permission, wrong names: PARTLY.**
- `src/server/v1/` went from 22 files to 14 (`git ls-tree 6290115` against `ls`). `team-read`, `team-write`, `owner` and `access` are gone. The files are now topic-named: approvals, clients, commerce, plan, publishing, requests, work, workspace. A route-table test exists (`tests/api-docs.test.ts:11-18`).
- Topics are still scattered. `client-view/*` routes sit in 6 files (approvals 2, clients 3, plan 2, publishing 2, requests 5, work 4). `items/*` sits in 2 (approvals 5, work 7).
- `work.ts` is 1457 lines and mixes me, home, jobs, items, sync, time, calendar and client home (`wc -l`; path-prefix count with grep).
- `commerce.ts` was renamed from `owner.ts` (R056).
- `approvals.ts:366-392` is minified-style code, inconsistent with the rest.

**`loadWorld` reads disk + tables every request and writes while reading: PARTLY.**
- The write part is FIXED. `loadWorld` and `detailOf` carry "a read never writes" (`jobs.ts:298`, `jobs.ts:808-846`). Syncing moved to `main.ts:40-48` (at start and every 5 minutes) and to the write routes `syncedWorld`.
- I scanned every `GET` route block in `v1/*.ts` for INSERT, UPDATE, sync and `tx`: 0 hits. Only the route bodies were scanned, not every helper they call.
- The remaining write on a read is `client-session.ts:183-184`, `UPDATE client_people SET last_seen`. It is throttled to once per 5 minutes (`SEEN_EVERY_MS`, line 41) and was already there on 5 Nov. Low.
- The read cost is OPEN. `loadWorld` still runs 10 `db.query` calls (11 on 5 Nov) with no cache (grep for "cache" in `jobs.ts`: 0). `scanAll`/`scanJob` read the disk inside request handlers at 21 call sites in `v1/`. `loadWorld(` appears 70 times in `src`, against 66 on 5 Nov.

**"Today" in UTC in 10 files: FIXED on `next`.**
- `src/core/day.ts:1-25` defines the Africa/Cairo day (`dayOf`/`todayOf`) and is used by 21 files. The server uses `toISOString().slice(0,10)` once (`dates.ts:23`), only for date arithmetic. It was in 8 files at `6290115`. `tests/v1-cairo-day.test.ts` exists.
- Caveat: the web client still has UTC day helpers (`web/src/lib/format.ts:54`, `home-week.ts:89`), which I did not judge.

**Two shapes of error answers: OPEN, now 3.**
- v1 answers `{error:{code,message}}` (`v1/index.ts:51-53`).
- Everything in `app.ts` answers `{ok:false,error:"..."}`: 12 occurrences at `6290115` and 12 now. That includes the 404 for non-API paths, `bad host`, `login required`, the 429, and the 410 of `/api/decision`.
- A third shape: the plan-import 422 returns `{ok:false, errors, warnings}` (`plan.ts:530-535`).
- `core.ts:31-33` maps `BadRequest` into the v1 shape, but `app.ts` does not use it.

**SPA page list in 3 places, 404 on refresh: FIXED on `next`.**
- `shared/routes.json` (46 lines) is the one list. `spa.ts:8-14` reads it, `web/src/lib/routes.ts:3` and `App.tsx:8` read it, and `tests/spa.test.ts:40` compares `SPA_ROUTES` with it. Not live.
- `/client/for-your-review`, `/client/work`, `/jobs/post` and `/clients/project` are in the list.
- Not verified: that every `<Route>` in `App.tsx` is covered by a test.

**API contract behind the code: PARTLY.**
- `docs/DASH-API.md` (2375 lines) now has a generated route table, 192 table lines. `--md` output is contained in the doc, checked with python, and `tests/api-docs.test.ts` fails when it is stale.
- Four routes are served outside `ROUTES` and are only in the prose (`DASH-API.md:8-11`).
- The 2000+ lines of prose are still the v1.24 history, and the file states "when a section and the table disagree, the table is right" (`DASH-API.md:6-12`). There is no v2.0 rewrite.

## 2. New problems from the sprint

- **Second way to list review items (medium).** `GET /review` (`approvals.ts:~362-392`, kept "as it is") and the new `GET /review/queues` (`approvals.ts:394-408`) answer the same question with different parameters (limit 200/500 against 50/200, `before` against `offset`). Both call `legacyListed`/`legacyQueueOf` for clients without a review order. Two answers for one list can drift.
- **Gate by convention (medium).** The client growth read `GET client-view/growth` (`reports.ts:46-62`) is safe only because the route calls `growthShown` first. `growth-report.ts:168` says "THE CALLER MUST HAVE CHECKED". `clients.ts:675` repeats the check. This is not in `client-scope.ts`.
- **Twin `safeNext` (low-medium).** `src/service/dash/client-next.ts:1-2` is a copy of `web/src/lib/clientAccess.ts`, held in sync by `safe-next-twin.test.mjs`. Duplicated by design, with a test. The allow-list is correct: it refuses `//`, `%`, `:`, `..` and backslash.
- **Route declaration styles (low).** `reports.ts` declares 3 routes as object literals (`file:` property in 13 places in total) while the rest use `route(...)`. `plan.ts` holds goals and results routes (`projects/:id/goal|results|growth`) next to the marketing plan, and `growth*.ts` is 4 service files plus `reports.ts` for one feature.
- **Legacy shim kept (low).** The bridge in `job-model.ts:325` stays, and 9 routes answer 410 (`grep -c "gone("`: 4 in `approvals.ts`, 5 in `clients.ts`). Dead handlers are still in the table until a later step removes them.
- Nothing new that writes inside a GET: share link (`share-link.ts:1-4`, pure, no db), calendar (`GET calendar`, `work.ts:731`, read), review order (writes in `review-order.ts:244-266`, transactional, from PATCH only).

## 3. Score

**Now 3 of 5 (5 Nov: 2 of 5).** The server is split by topic (14 files from 22), the three decision routes are down to one live route with the others answering 410, a read no longer syncs, the day is Cairo, and the page list and route table each have one source plus a test. It stays at 3 because the new decision writer still goes through `decision_history`, the work/client-view topics are still scattered over 6 files, the error shapes are 3, `loadWorld` still loads 10 queries and walks the disk on each request, and the prose contract is still a v1.24 history. All of this is `next`, not deployed.

## 4. Not looked at

The auth and session code beyond the lines quoted; `migrate.ts` and the `027` trigger body; the web mocks; the 410 logging window planned in the 5 Nov plan (not seen); whether every GET helper is free of writes; behaviour under load; the tests (not run).
