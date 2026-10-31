# DASH-AG-019 UX12 quick fixes: client request, Files link, one approve path (Antigravity)

ROLE A (team runtime, DEV_AG work). Source: UX12 review (`ux12/DASH_UX12_REVIEW_AR.md`), Lead-checked on `main` e71c47a.
Owner OK 2026-10-31: these 4 fixes only. The nav / tab restructure from the review is NOT in this job.
R58 ladder: Antigravity builds → Codex reviews → Lead → owner → deploy. Cost rules R52: read only what is named; 3 lines per stop.

## Where (strict)
- `cd C:\Work\tsst-portal` → `git fetch` → `git worktree add C:\Work\tsst-portal-ux12 -b ux12-quickfix origin/main`, then `npm ci` in root and `web/`.
- Work only there. Web only: never edit `src/` or migrations. If a fix needs an API change, stop and report it.
- Never push, merge to main or deploy.

## Read
- `web/src/pages/client/ClientRequest.tsx`, `ClientShell.tsx`, `ClientHome.tsx`, `ClientReviewQueue.tsx`; `web/src/lib/item-bulk.ts`.
- Rules: `C:\Work\TSST\TSST\core\rules\build.md` (R55); R50 HeroUI only, R51 buttons, R53 no borders in `core/rules.md`.

## Fixes (commit after each: `fix(web): … (DASH-AG-019 n/4)`)
1. **Request form starts empty.** `ClientRequest.tsx` lines 114-127 prefill demo text ("Winter Capsule Collection 2026", 2026-12-10,
   blankets brief, 3 outputs + extras). Start with no output selected, empty extras, title, details. Placeholders stay.
2. **Hide what doesn't work yet.** The target date is never sent (`createJobRequest` has no `due`) and the attachments dropzone has
   no input. Remove both from the client form for now (date + dropzone block). Don't add an API field.
3. **Files link.** `ClientShell.tsx` 128 and 148 go to `/client#client-files`; no element has that id. Remove the Files link from the
   top nav and the menu (files stay in each job's Files tab). A real Files page comes with the restructure later.
4. **One approve path.** Home "Needs your review" builds its list from job details (`pendingClientReviews`) and approves with the old
   `useDecide` / `saveBulk` (`POST /decisions`), while For your review uses versioned items (`getClientReviewQueue`,
   `decideClientItem`). Make Home use the same source and path:
   - list = `api.getClientReviewQueue` (same data as the nav badge); drop the per-job `getClientJob` fan-out for this card.
   - a row opens `/client/for-your-review?item=<id>`; `ClientReviewQueue` reads `item` to preselect it. No per-row
     Approve / Edit buttons on Home, no Home preview modal.
   - "Approve all" stays (with its confirm) but uses `approveItems` from `lib/item-bulk.ts` on each item's current version.
   - If any item the old list showed (legacy job deliverables / posts) is missing from `/client-view/items` in the mock data, stop
     and report which; don't fake it.
   EN + AR RTL; empty / loading / error states as now.

## Checks
- Per fix: `web` typecheck + build.
- End: `web/` `npm run typecheck`, `npm run build`, `npm run ds:check`, `npm run test:api`; root `npm run typecheck`, `npm run lint`.
- Shots into `web/node_modules/.cache/ux12/`: client Home + request form + nav, EN 1440-light and AR 390-dark (no horizontal scroll).

## Reply
Once, at the end: 3 lines (commits · checks · anything off or any API gap).

## 4b. Lead review of `8800054` (2026-10-31): fixes 1–3 accepted; fix 4 returned
1. Home "Needs your review" is broken: each row's thumb fills the whole card width (~500 px tall blank box, title far below), EN 1440
   and AR 390. Use the same small fixed thumb as the For your review list (`.item-thumb` size), thumb + title + project on one compact
   row like before. If `item.preview` holds an image URL, show it; else the type label as now.
2. Keep everything else in 4 (queue source, link with `?item=`, Approve all via `approveItems`).
3. You didn't report the legacy check: list which pending old-model items (old job deliverables / posts) in the mock data no longer
   show on Home. Report only, don't fake them (step 0 / step 2 of DASH-SIMPLE-001 handle real data).
Web typecheck + build + ds:check; re-shoot `client-home-en-1440-light` + `client-home-ar-390-dark`. Reply 3 lines.

## 4c. Lead look at `811a0f7`: accepted (compact rows, real thumbs, EN + AR). 16 legacy mock items no longer on Home = expected
(DASH-SIMPLE-001 step 2 wipes all work; step 5 moves the post screens to the versioned path). Next: Codex review, then merge.
