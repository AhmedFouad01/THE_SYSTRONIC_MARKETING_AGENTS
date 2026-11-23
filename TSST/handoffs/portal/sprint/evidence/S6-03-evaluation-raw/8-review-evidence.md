# Review 1 (evidence) of 7-evaluation.md

Checkout `/Users/fouad/Work/tsst-portal-s603`, local git only, nothing run. `N` = e758f9a, `L` = 6a28ba3, `O` = 6290115. Skills opened: TSST-DEV-SK-012 (review steps), -015 (claim / evidence / method / result), -005 (not needed beyond error contract reading). No preflight run: no plan.json was given.

## 1. Size of next vs live
- 327 commits: CONFIRMED (`git rev-list --count L..N` = 327; `O..N` = 494). BUT `N..L` = 12 commits (merge-base 4b27eef), so `next` is not a strict superset of live. The evaluator never says so. Most are merge commits plus one test fix (fd5370b). Whether those 12 carry content missing from `next`: NOT CHECKED.
- 230 files, +13,653 / -1,564: CONFIRMED (`git diff --shortstat L N -- src web/src`). OVERSTATED label "product files": 35 of the 230 are test files (`':!*.test.*'` gives 195, +11,502 / -1,524). The whole diff is 326 files, +33,073 / -1,700.
- Migrations 036-038 not on `main`: CONFIRMED (`git diff --name-status L N -- migrations` = 3 x A; `git ls-tree L migrations/` ends at 035).

## 2. "Already on live" list (all on L)
CONFIRMED: `spa.ts:8` imports `shared/routes.json` and `SPA_ROUTES` is built from `routes.pages`; `src/core/day.ts` Cairo; `src/server/v1/` has 14 files (22 at O), topic names; `jobs.ts:773,811,856` "a read never writes"; `034_soft_delete_more.sql`; `ConfirmDelete.tsx` plus 10+ users; `ClientDetail.tsx` imports `ClientOverviewTab`; `SetupLinkResult` in `ClientPeople.tsx:18`; `app.ts:462` throws 410 for `/api/decision`.
Nuance (M4): the Cairo helper is wider on `next`. Files using `dayOf`: 15 on L, 21 on N. Files importing `day.js`: 2 on L, 6 on N. So "FIXED, LIVE, 21 files" mixes the two. One `toISOString().slice(0,10)` left on both (`dates.ts`): CONFIRMED.

## 3. Decisions
- 410 on N: `approvals.ts:423,426,429,433` (4 routes) and `app.ts:471-472` (`/api/decision`). Evaluator cites `421-433` and `app.ts:470`: right, off by 1-2 lines. CONFIRMED.
- `decideItem` still writes both: `job-model.ts:326-327` inserts `decision_history` (with `bridged=true`), then `:329` inserts `item_decisions`. CONFIRMED (cited 325-330).
- "3 other writers leave `bridged` NULL": OVERSTATED. Only 2 SQL statements: `repo.ts:62` (`insertDecision`) and `publishing.ts:355` ("Edited after review"). The third, `review-mirror.ts:105`, calls `recordDecision` into the same `repo.ts` statement. R2's "old route and import" is stale: the old route now answers 410, and `recordDecision` has no other caller than the import. Say "2 statements, 2 live callers".

## 4. Hard deletes
12 tables at O, 11 at N: CONFIRMED (`git grep -hoE "DELETE FROM +(portal\.)?[a-z_]+" <rev> -- src | sort -u`). Gone: bonuses, brand_packages, document_payments, milestones. Added: campaign_goals, result_entries, result_notes (038 lines 23, 35, 49), deletes at `service/dash/growth.ts:289,323,352`. Note: the evaluator's cite `growth.ts` is in `src/service/dash/`. `ConfirmDelete.tsx` says these clears are deliberate (Decision 9, save on blur); the evaluator lists them as a problem without saying so. `ON DELETE CASCADE` from `projects`: CONFIRMED (038:24,37,50).

## 5. Web counts (git archive of `web/src` into my own scratch folders)
- CSS files 31 to 48: CONFIRMED (`git ls-tree -r --name-only <rev> web/src | grep -c '\.css$'`).
- `!important` in `ds/system.css` 62 and 62: CONFIRMED (`grep -c`). All CSS by occurrences 199 to 229 (`-o`).
- Mock 3,764 to 5,485 (15 to 27 files, `web/src/api/mock/*.ts`): CONFIRMED. `copy.ts` 890 to 1,276: CONFIRMED.
- Unused exports 20 to 18: CONFIRMED only with R3's filter. R3's `unused.py` on my copies gives 25 and 22 raw; dropping non-PascalCase names gives 20 and 18. Regex name match, so a floor, and `statusLegend` (camelCase) is in R3's "still dead" list.
- API methods with no caller 10 to 11: reproduced (161 and 178 methods; `apiunused.py` gives 10 and 11). Too crude to trust as a trend: any word match counts as a caller (copy keys such as `deleteClient: 'Delete client'` count), and deletes are called by string name through `ConfirmDelete` (`DELETE_CALLS`). My stricter `.name` count gave 32 for N, which is wrong the other way. State it as "about 10, method rough".

## 6. Tests
Test files 74 to 140: CONFIRMED (`git ls-tree -r --name-only <rev> tests | grep -c '\.test\.'`). Cases 598 to 1,324: CONFIRMED within one (`git grep -hE '^[[:space:]]*(it|test)\(' -- tests` = 598 and 1,325 with modifiers); `.each` loops make it a floor. Gates: `find web/qa -name gate.mjs` = 20 at N, 0 at O: CONFIRMED (other `gate-*.mjs` files exist: 26 `gate*.mjs`).

## 7. Server shapes
- Three error shapes: CONFIRMED. `{ok:false,error:string}` (`app.ts:162,165`), v1 `{error:{code,message}}` (`core.ts:13`), and `{ok:false,errors,warnings}` (`plan.ts:530-535`).
- `GET /review` and `GET /review/queues` both list: CONFIRMED (`approvals.ts:362,396`). "Can drift" is somewhat OVERSTATED: `approvals.ts:390` says the old status rule is shared (`legacyListed`). Different filters and limits (200 vs 50) are real.

## 8. RUNBOOK
The file is `docs/RUNBOOK.md`. Fresh dump is step 2 (`:270`). Wrong "step 1": `:256`, `:257` and also `:304` (the evaluator missed this one). Lines 249-250 are right. CONFIRMED, slightly incomplete. `:136-138` (rehearsal not done) and `:173-175` (old code on new schema; both links same release) CONFIRMED.

## 9. Scores
- NOT VALID: CONFIRMED, 7 foreign keys in `032_job_references.sql:21-27` (R2 cited 25-31), no `VALIDATE` anywhere in `migrations`. They are new since O. Database 2.5: follows from evidence; I accept 2.5 (3 is arguable given rollback notes, tests and a guarded swap).
- Deploy and quality 2.5: TOO HARSH, and inconsistent. Tests doubled, gates 0 to 20, `ci.yml` exists, `deploy.sh` is unchanged from the 5 Nov state (when it scored 3). R6 gave 3 after splitting 4 / 2.5. Re-weighting to "release safety only" changes the scale between rounds. My number: 3.
- Overall: the evaluator's own sum 16.5 of 30 is 5.5 of 10 (14 of 30 was 4.67, shown as 4), so both are rounded down. With deploy at 3, 17 of 30 is 5.7. "5" is defensible only as "rounded down both times"; say so or write 5.5.
- "About 4.5 for live, not scored by any reader": unsupported, from file greps only; mark as opinion.

## 10. Claims in A resting on a reader's word only (not re-checked by me or the evaluator)
H3 (CI refused since 17 Nov, 30 PRs on local checks: board text); H4 (`work.ts` 1457 lines, `client-view` in 6 files); H5 (23 of 23 DELETE callers, counted by files, not buttons: the evaluator admits it, but FIXED/PARTLY is read from it); H6 (2000+ prose lines, 4 routes in prose); M1; M2 (0 writes in GET bodies is a scan of route bodies only; `loadWorld` 10 queries, 70 call sites); M3; M7; M8 (119 refs, 105 merged). The evaluator's own live check covers only H1, H4 (14 files), H5 (034, confirms), M2 (write fix), M4, M6. Not re-run by me: "round tags 38 to 506".
