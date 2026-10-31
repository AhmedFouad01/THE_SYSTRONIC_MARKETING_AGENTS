# DASH-AG-022: build the simplified Dash (Antigravity, step 4)

ROLE A (team runtime, DEV_AG + CREATIVE_AG work), step 4 of `DASH-SIMPLE-001-PLAN.md`. Owner OK'd the plan (D1–D4), the R60 table
and the screens in `simple-001/` on 2026-10-31. R57 + R58: Antigravity builds → Codex reviews → Lead compares live vs design →
Ahmed → deploy. Goal = less: fewer doors, words, states, buttons. Cost rules R52: read only what is named; 3 lines per stop.
Effort: High.

## Where (strict)
- `cd C:\Work\tsst-portal` (Mac: `~/Work/tsst-portal`) → `git fetch` → new worktree / branch `simple-build` from `origin/main`
  (`2d9c851`), `npm ci` in root and `web/`.
- Work only there. Never push, merge to main or deploy. No live DB, no server, no secrets.
- The live DB was wiped on 31/10: only new-model data exists. Never add a new use of the old decision path.

## Read
- `C:\Work\TSST\TSST\handoffs\portal\DASH-SIMPLE-001-PLAN.md`: all, including the R60 table and its 2 guardrails.
- Design = the spec: `simple-001\` (HTML + PNGs + `DESIGN.md`; the R1 notes in `DASH-AG-021-SIMPLE-DESIGN.md` win).
- Old-path list: `CX-SIMPLE-000-COUNT_out.md` part A (read-only map).
- Rules: `core/rules/build.md` (R55, R57); `core/rules.md` R49–R53, R59, R60.

## Step 0: API gaps. Stop and reply before building
Write `C:\Work\TSST\TSST\handoffs\portal\simple-build-001\GAPS.md`: one row per R60 object and per page action.
- Columns: existing endpoint (file:line) **or** missing → what the server needs → size small / medium.
- Known likely gaps, check them:
  - Copy a client link again (the URL is only returned on create today).
  - Delete item, version (guard), comment (`item_comments` is append-only), request.
  - Client "change my decision".
  - Team home "today" list.
- Reply 3 lines and **wait**. The Lead and Ahmed decide who builds the server part. Don't edit `src/` or `migrations/` before that.

## Build (after the OK; commit per step: `feat(web): … (DASH-SIMPLE-001 build n/9)`)
1. **Client shell:** 4 links (Home · For your review · My work · Requests), 390 = one row + menu. Old routes keep working and
   redirect: `/client/posts|videos|designs|job|project|plan` → My work (filter) or Home; `/client/review` → For your review.
2. **Client Home:** as `client-home`. Rows open For your review with `?item=`. Approve all keeps its confirm (`approveItems`).
3. **For your review:** as `client-review`.
   - Change my decision until scheduled / posted.
   - Client comments: edit + delete own.
4. **My work:** one list of all work + files shared with the client, with a type filter. Replaces the Posts / Videos / Designs pages.
5. **Requests:** new request + my requests, edit / cancel before the team accepts.
   **Stop and reply** with shots in `web/node_modules/.cache/simple-build/` (EN 1440-light, AR 390-dark).
6. **Team shell:** Home · Work · Review · Clients. Owner menu: Reports · Documents · Settings.
7. **Team Home** and **Team client page:**
   - Client page: 4 tabs, "Open client portal" button (uses `previewClient`).
   - Links list: Copy link · Renew · Revoke. Expired links: Renew only.
8. **Team job:**
   - One view: drop the old tabs and the `isJobModel` branch.
   - Extras (AI-made, hold / release early) go behind ⋯.
   - Show one item count.
   - "Schedule" shows only after the client approves.
9. **R60 controls everywhere** (add / edit / delete, a confirm before every delete).
   - Guardrails: no delete on the approved / posted version; documents use cancel, not delete.
   - Client sees only 3 statuses: Needs your review · In progress · Ready.
   - Words in `web/src/copy.ts` + `web/src/copy/ar/copy.ts`.

## Proof (R57) and checks
- `web/qa/SIMPLE/gate-live.mjs` (copy of the JOB one) on every built page: EN 1440-light + AR 390-dark.
- Compare images (design | build) into `C:\Work\TSST\TSST\handoffs\portal\simple-build-001\`. All checks 0.
- Per UI step: `web` typecheck + build.
- At the end:
  - `web/`: typecheck, build, ds:check, test:api.
  - Root: typecheck, lint, `npx vitest run --no-file-parallelism`.

## Reply
Only at the stops (after step 0, after step 5, final): 3 lines (commits · checks · anything off-design or any API gap).
