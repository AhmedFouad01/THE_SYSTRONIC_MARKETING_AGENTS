# DASH-AG-011 — R8 backend: package v2, edit credits, bonus, time tracking, milestone scopes, feedback, client timeline

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort High. Cost rules R52: read only what is named; ONE commit per part (4 parts; Ahmed
sends "Part 1" … "Part 4"); reply in 3 lines, plain Egyptian Arabic. Plan: `DASH-R8-PLAN.md` (same folder).

## Where
Folder `C:\Work\tsst-portal-ag`. First: `git switch -C dash-r8 main` (main = 8ebcb76, contract v1.12). Write ONLY
`src/**`, `migrations/015_*.sql`, `tests/**`. No new dependency. Do NOT touch `web/**` (Codex, later) or `docs/**`
(a contract gap goes into your reply).

## Read first (only these)
1. `docs/DASH-API.md`: the whole section "v1.12 R8", plus types `Plan`, `PackageCard`, `Milestone`, `ReviewItem`,
   `Deliverable` and the client rules for `client-view/home`.
2. Code: `migrations/003_dash.sql` (milestones, plans), `migrations/008_client_items.sql`, `src/service/dash/packages.ts`,
   `src/service/dash/client-view.ts`, `src/service/dash/client-items.ts`, `src/service/dash/jobs.ts`,
   `src/service/dash/posts.ts`, `src/server/v1/owner.ts`, `src/server/v1/team-read.ts`, `src/server/v1/team-write.ts`,
   `src/server/v1/client.ts`, `src/db/repo.ts` (decisions).

## Part 1 — migration 015 + package v2 + bonus (commit)
Migration 015 exactly as the contract's last rule. Plans POST / PATCH / GET with `hours`, `edit_credits`, `services`
(validation as typed). Bonus owner endpoints. `PackageCard` v1.12 (`included`, `used`, `extra_edits`, `delivered`,
`bonuses`) everywhere it is returned (home, clients, client); edit-credit counting rule exactly ("asking again is free").

## Part 2 — time tracking (commit)
Time endpoints (own entry or owner for PATCH / DELETE), `/settings/time-estimates` (one row, defaults), `maker` on
`PATCH /job/items` (posts too), `Deliverable.maker`. `TimeSummary` math and type mapping exactly as the rule;
`used.hours` / `included.hours` in the package.

## Part 3 — milestone scopes + feedback (commit)
Milestone scope rules (checks, `done_at`, `owner_id` active user, agency never client-visible, existing rows = job),
`GET /milestones` filters, home = every scope. `GET /feedback`, `client_request` on items, `GET /review` keeps items
with an open client request. `GET /client?brand=` adds `milestones`, `bonuses`, `feedback`.

## Part 4 — client view + tests (commit)
`client-view/home`: strip hours, `extra_edits`, `hours` bonuses, bonus notes; add `timeline`; never `owner`.
Tests `tests/v1-r8.test.ts`:
- Plan 3 credits + bonus 2 → client requests on 6 different items in the window → `used.edit_credits` 6, `included` 5,
  `extra_edits` 1, the 6th `FeedbackItem.extra` true. Same item asked twice in a row → counted once. Team
  changes_requested → no credit. Plan 0 credits → no counting.
- Approved image without entries = 30 min estimate; `maker: ai` = 15; a manual 45-min entry overrides to 45; a pending
  item counts in `open_minutes`; a client-level entry adds as is.
- Agency milestone with `client_visible: true` → stored false; client milestone without job; job scope without job → 422.
- Feedback closes after the team's next decision; the item stays in `/review` while open.
- Client view: no hours anywhere, no `extra_edits`, no hours bonus, no notes, `timeline` has a done milestone from 10
  days ago and not one from 100 days ago; another brand's bonus never shows.
Existing tests stay green (say which you changed and why).

## Checks before each reply
Root: `npm run typecheck`, `npm run lint` (0 new warnings), `npx vitest run` (full suite, Part 4; Parts 1–3 may run
only the touched test files).

## Reply (3 lines, Egyptian Arabic)
Part n done · checks pass / fail · contract gaps / tests changed (for the Lead).

## Part 5 — v1.12b additions (commit; after Part 4)
Contract v1.12b (main 309a595; `git merge main` into `dash-r8` first): `Bonus.tone` (`BonusTone`, default `cyan`,
client sees it) and `BrandHeader` on BrandProfile (`settings/clients`, `client-view/profile`), `PUT /settings/clients/:brand`
with `header_style`, `header_color2`, `header_angle`, `header_overlay`, `header_image` (PNG / JPEG / WebP ≤ 4 MB, never
SVG, re-encoded to WebP ≤ 2400 px wide, null removes; "image" without a picture → 422) and a route that serves the
stored picture to team and to that brand's client. Migration 015 is not deployed yet: add the columns there (brands:
header_style, header_color2, header_angle, header_overlay, header_image; bonuses: tone). Tests in `tests/v1-r8.test.ts`:
tone round-trip + client view; gradient without color2 → 422; image upload → served to the brand's client, 404 for
another brand's client; SVG → 415 or 422. Full suite at the end.
