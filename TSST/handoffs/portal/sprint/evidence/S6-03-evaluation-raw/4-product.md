# Area 4: the product as each user sees it (re-run, 2026-11-23)

Subject: `/Users/fouad/Work/tsst-portal-s603` at `e758f9a` (branch `next`, NOT deployed). Live site still runs `main` = `6a28ba3`. Every verdict below is about `next` only. Read-only, from code; I did not run the app. Paths are relative to that checkout.

## 1. Findings of 5 Nov

| Finding | Verdict | Evidence |
|---|---|---|
| Refresh or direct link gives 404 on new pages | FIXED (next only) | `shared/routes.json` is now the one list; `src/server/spa.ts:8,13` builds `SPA_ROUTES` from it; `tests/spa.test.ts:63-95` compares it with `web/src/App.tsx`. My own diff (grep of `Route path=` in App.tsx vs `routes.json`): App.tsx 37 unique paths, routes.json 35; the only two extra in App.tsx are `/c/:token` (served by `src/server/app.ts:204`) and `/design` (mock-only, `App.tsx:42`). All five 5 Nov paths are listed (`/client/for-your-review`, `/client/work`, `/client/requests`, `/jobs/post`, `/clients/project`). |
| `/requests` (pricing) has no menu button | FIXED, owner only | `web/src/components/ds/AppShell.tsx:36` (`owner: true`, with a count badge); a team member does not see it (`:84`). Decision R60 on "all team or owner only" is therefore taken as owner only; not confirmed with Ahmed. |
| Team client page "Summary" = old hub inside tabs | PARTLY | Tabs are now Overview / Plan / Posts / Settings (`web/src/pages/ClientDetail.tsx:109`); old tabs `summary/work/package/admin` are gone (`git show 6290115:web/src/pages/ClientDetail.tsx:49`). Overview is 4 read-only cards, no create/edit button (`web/src/components/ClientOverviewTab.tsx:1-33`). "New job" is in the header once (`ClientDetail.tsx:116`). Still a tabbed page of 135 lines + Settings with 6 sections (`web/src/lib/settings.ts` SETTINGS_SECTIONS). Better, but a client's jobs live in 3 places: Overview "Running jobs", Posts tab, `/jobs?brand=`. |
| Access and Visibility repeated: owner menu vs client page | PARTLY | Visibility is gone from the owner menu: `web/src/pages/settings/SettingsLayout.tsx:9-16` lists Company, Clients, Workspace, Team, Access, Packages; the switches exist only in `ClientVisibility.tsx` (client page Settings). Access is still in both: `settings/Access.tsx` (legacy links list, PIN toggle, revoke) and "Old links" fold in `ClientPeople.tsx` (`OldLinks`, revoke only). Access.tsx tells the owner "Invite people from the client hub" (copy in the file), i.e. the page points away from itself. |
| Delete without confirmation in 3 places (stages, cancel invite, undo payment) | FIXED | `ConfirmDelete` now covers: milestones (`MilestoneEditor.tsx:72,101`, `ClientPlanTab.tsx:132`), cancel invite and delete user (`settings/Team.tsx:120,124`), undo payment (`DocumentEdit.tsx:212`). Command: for the 25 `'DELETE'` calls in `web/src/api/endpoints.ts`, each with a caller outside mocks (23 of 25; `deleteMedia` and `deleteDocument` have no caller) lives in a file that imports and uses `ConfirmDelete` (count >= 2 per file, checked 14 files). `ClientPackages.tsx:98` uses `ConfirmModal` for the package steps. `endClientPreview` is not a delete. Not checked: that every button inside those files goes through the confirm (I counted files, not buttons). |
| AI mark disappeared | OPEN | No screen sets or shows `maker: 'ai'`: grep of `web/src` for `onMaker`/`ItemWorkMenu`/`updateClientItems` finds nothing outside mocks (the old menu was `JobTime.tsx:46` at `6290115`). `types.ts:235` still has `ItemMaker`; copy `"Mark as AI-made"` (`web/src/copy/en/client-ui.ts:474`) is unused. The owner setting "AI factor" (`settings/PackageTools.tsx:73`) says "AI-made items use this fraction" but nothing can make an item AI-made: a dead setting. |
| Newly created client link not shown | PARTLY | Create/Renew were removed from the page: "no create, renew or reset-PIN on the page any more" (`ClientPeople.tsx` OldLinks comment). The new way is Invite person, which shows the setup URL in the result (`ClientPeople.tsx:18` `SetupLinkResult`, "Valid 7 days, works once") and the permanent address `/c/<slug>` as text (`ClientPeople.tsx` address block; `app.ts:307`). Not verified: that the address is shown when the link key is unset; the key `TSST_LINK_TOKEN_KEY` decision. The legacy list can still not show old URLs. |
| Shared files missing from "My work" | PARTLY | The permanent notice "Shared files are not listed here yet" was removed (`git diff 6290115 e758f9a -- web/src/pages/client/ClientWork.tsx`: 1 deleted line, the notice). But `ClientWork.tsx:21` reads `GET client-view/items?scope=all` which returns items only (`src/server/v1/work.ts:604-640`); shared files that are attached to an item show through the item, shared files with no `item_id` have no row (`src/service/dash/client-view.ts:288` keeps them in a separate `files` list). So the notice is gone but the gap may remain. Not verified with data. |

## 2. Walk of each user's main path (code only)

Client (`web/src/pages/client/*`, 4 links + redirects, `App.tsx:63-77`): Home, For your review, My work, Requests, Plan, Report. Still confusing:
- "For your review" and "My work" show the same item rows (`ClientWork.tsx:70` opens the review page for every item; status filter review/progress/ready duplicates the queue). Two places for one job.
- `/client/request` and `/client/requests` are the same page (`App.tsx:75-76`).
- Viewer: ClientRequest shows a notice and disables fields (`ClientRequest.tsx:50-69`), so a viewer is told. Comments: the server refuses a viewer (`approvals.ts:147 assertClientWriter`); whether the review page hides the comment box for a viewer is not verified (`ClientReviewQueue.tsx:23` reads `canDecide`).
- Dead files: `ClientSummary.tsx` (2 lines) and `ClientJobCards.tsx` (29 lines) are still present and `ClientJobCards` is imported by nobody (grep).

Team member: nav is Home, Work, Review, Clients (`AppShell.tsx:33-37`), Home has `/week`. New calendar on Work, review order, campaign goal/results, WhatsApp share: not opened in this pass (see section 4). Overview shows campaign goal and result via `GoalLine` (`ClientOverviewTab.tsx:70-76`, links to `#campaign-goal-results`). Team pages are English only: `clientLocale.tsx` sets `language = client ? choice ?? default : 'en'`, so Arabic copy in `copy/ar/*` is unreachable from team pages and no switch exists; `ClientOverviewTab.tsx:69` says so. Unreachable: the Arabic strings of `th.client.*` for a team member (by design, not announced).

Owner: Settings menu has 6 entries (`SettingsLayout.tsx:9-16`), plus Reports and Documents in the main nav (`AppShell.tsx:38-39`). "Clients" settings (`settings/Clients.tsx`) is only a list that links back into the client page (`:20`), a third way into the same client. Packages exist both in `settings/Packages.tsx` (plans) and in the client page Settings > Package: different things, same word. The report's month with no result: not verified.

## 3. New problems (introduced by the sprint)

- medium: hard-coded English in the shell: "Documents" (`AppShell.tsx:39`), "Search jobs, clients" (`:115,:193`), "Collapse sidebar" (`:139`), bypassing `copy`.
- medium: dead "AI factor" setting with no way to produce AI items (see AI mark).
- low: nav item "Requests" label comes from `copy.requests.nav.entry` while the page is called pricing in the 5 Nov text; naming differs between menu and page (not checked on screen).
- low: dead code kept: `ClientSummary.tsx`, `ClientJobCards.tsx`, `deleteMedia`, `deleteDocument` endpoints.

## 4. Score

5 Nov: 3 of 5. Now: 3.5, I give 4 only for `next` if deployed: the 404, the Requests button, the three confirms and the Summary hub are fixed with evidence. The AI mark is still gone, Access is still in two places, shared files may still be missing, and the product is not live, so the user sees none of this today.

## 5. Not looked at

Not opened: Home.tsx, HomeWeek.tsx, Jobs.tsx (new calendar), Review.tsx, Job.tsx, ProjectView.tsx (campaign goal/results page), share on WhatsApp, Reports.tsx (month with no result), Documents pages, ClientHome/ClientPlan/ClientReport/ClientReviewQueue bodies, the ClientShell, the comment box for a viewer, mobile layout, and any running behaviour. The 28-call budget was spent on the items above. No tests run.
