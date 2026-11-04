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
- **Done 01/11.** Lead accepted `GAPS.md` (add the missing `Skills used:` line). Ahmed's decisions are in the plan, R60 section, last bullet.

## Step 0b: server part (Ahmed OK 01/11). Stop and reply before the UI
Build every server row marked missing or "relax" in `GAPS.md`, section 4, in the `simple-build` worktree.
Commit per piece: `feat(api): … (DASH-SIMPLE-001 server n/N)`. Every new or changed endpoint gets an API test.
- **Access:** these move from owner to every team account: client preview (`client-accounts.ts:187` + the owner-only check in
  `index.ts:72-73`), requests accept / decline / price / delete, client people, packages and payments, release early.
- **Copy link again:**
  - New links: store the token encrypted (AES-256-GCM). The key comes only from an env var on the server, never in the repo or `.env.example` values.
  - `GET /access` returns `url` when it can decrypt it. With no key set, it returns no `url` and nothing breaks.
  - `POST /access/:id/renew` = new token + new expiry, and the old token stops working. Old links (hash only) get renew only.
  - Name the env var in your reply: the Lead adds it on the server at deploy.
- **History stays whole:** keep `item_comments_immutable` and `item_versions_immutable`. Comment edit / delete and version delete
  are new append-only rows (a revision or a "deleted" mark). Reads show the latest and hide deleted ones.
  - Version delete: 409 on the approved or posted version.
  - Client edits / deletes only their own comments.
- **Change my decision:** the client can change an approved item until it is scheduled or posted, recorded in decision history.
- **Other deletes** (client, job, client person, team user, plans): hide from lists (soft delete or deactivate). Never hard-delete rows that history points to.
- **Team home `today`** and **My work `scope=all` + type filter**: as `GAPS.md` says.
- Checks once at the end: root typecheck, lint, `npx vitest run --no-file-parallelism`.
- No live DB, no server, no deploy, no push. Reply 3 lines (commits · checks · env var name) and **wait** for the Codex review.
- **Built 03/11 on the Mac by Claude `tsst-dev` (Ahmed's choice).** `simple-build` `b81e7f0..b183c85` (7 commits, local only, migrations 028–030);
  typecheck + lint 0 errors; vitest 590/590. Env var `TSST_LINK_TOKEN_KEY` (32 bytes, base64 or hex; wrong length stops the server at start).
  Ahmed 03/11: client links open to every team account → `c6fc206` (all `/settings/access` routes incl. edit + reset PIN; vitest 592/592).
  Delete client, team user and plan stay owner-only. Next: Codex review of `origin/main..c6fc206`.
- **03/11 Ahmed: Claude reviews (instead of Codex) and builds the screens.** Review `e482084`, `f1a9b24` (3 medium fixed); server 8/8 `7554cf7`
  (client request edit, comment `mine`); vitest 601/601. Client steps 1–5 `fab1213..06e9b23`, Lead R55 R1 returned (10 points), R2 accepted;
  gate 0 on 4 pages; compare images in `simple-build-001/cmp-client-*`. Waiting: Ahmed looks at the client pages, then team steps 6–9.
- **04/11 Ahmed OK'd the client pages; team steps 6–9 built** `330deb8..49455f9` (Lead R55: R1 returned, R2 4 points, R3 people-row reset kept, accepted).
  Root typecheck + lint 0 errors, vitest 601/601; web typecheck, build, ds:check, test:api 131/131; web lint 265 errors vs 266 on main.
  Gate 0 on 17 shots; images `simple-build-001/cmp-team-*`. Pushed 04/11 (Ahmed OK): tsst-portal PR #27 `simple-build` → `main`, not merged, not deployed. Open: job "AI-made" extra has no UI;
  shared files not in client My work; no timezone in API. Next: Ahmed looks at the team pages → push branch / PR → deploy (Ahmed OK, add `TSST_LINK_TOKEN_KEY`) → step 5.

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
