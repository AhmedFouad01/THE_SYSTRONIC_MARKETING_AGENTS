# DASH-SIMPLE-001 / DASH-AG-022: API Gaps Analysis (Step 0)

Date: 2026-11-01  
Runtime: DEV_AG (Antigravity)  
Target: `~/Work/TSST/TSST/handoffs/portal/simple-build-001/GAPS.md`  
Codebase: `~/Work/tsst-portal-simple-build` (branch `simple-build` from `origin/main` @ `2d9c851`)

---

## 1. Summary of Known Gaps (Step 0 Checklist)

1. **Copy a client link again:**
   - **Status:** Missing in `GET /api/v1/access` (`src/server/v1/access.ts:78`).
   - **Reason:** Only `sha256hex(token)` is saved in `portal.client_links.token_hash`. Plaintext token / URL is returned once upon creation (`POST /api/v1/access`, line 107) and never persisted.
   - **Server Need:** Store recoverable token or URL in `portal.client_links` (or dedicated secret storage), return `url` on `GET /api/v1/access`, and add `POST /api/v1/access/:id/renew` to extend expiration and return link URL.
   - **Size:** Small.

2. **Delete item, version (guard), comment (`item_comments` is append-only), request:**
   - **Delete item:** Exists at `DELETE /api/v1/items/:id` (`src/server/v1/items.ts:444`) and `DELETE /api/v1/posts/:id` (`src/server/v1/posts.ts:540`). UI needs delete confirmation modal. Size: Small.
   - **Delete version:** Missing (`DELETE /api/v1/items/:id/versions/:n`). Guardrail required: reject with 409 conflict if version is approved or posted. Size: Small.
   - **Comment edit/delete:** Missing. Database trigger `item_comments_immutable` on `portal.item_comments` (`migrations/027_job_model.sql:110`) blocks UPDATE and DELETE. Server needs migration to remove/alter trigger and add `PATCH/DELETE` for team (`items.ts`) and client (`client-view`). Size: Small.
   - **Delete request:** Exists for client cancel (`DELETE /api/v1/requests/:id`, `src/server/v1/client.ts:175`) and team delete (`src/server/v1/team-write.ts:820`), but team endpoint is currently restricted to `ownerRoute`. Needs `teamRoute`. Size: Small.

3. **Client "Change my decision" (Reversal):**
   - **Status:** Missing / Blocked.
   - **Reason:** `src/service/dash/job-model.ts:205` strictly blocks modifying approved decisions: `if (i.live_version === version && status !== "approved") throw conflict("approved versions are read-only; create a new version")`.
   - **Server Need:** Allow client to submit `changes_requested` on an approved item before it is scheduled or posted; update `portal.decision_history` and item live state accordingly.
   - **Size:** Medium.

4. **Team Home "Today" list:**
   - **Status:** Missing in `GET /api/v1/home` (`src/server/v1/team-read.ts:191`).
   - **Reason:** `GET /home` currently returns `{ kpis, milestones, campaigns, packages }`. It does not aggregate actionable items (pending reviews, scheduled today, overdue milestones, client edits requested) or new client requests.
   - **Server Need:** Add `today: ActionItem[]` and include pending `requests: JobRequest[]` in `GET /api/v1/home` (or serve requests via team route), and relax request accept/decline `PATCH /requests/:id` from `ownerRoute` to `teamRoute`.
   - **Size:** Medium.

---

## 2. R60 Objects Table (Read / Edit / Delete)

| # | R60 Object / Capability | Existing Endpoint (file:line) or Missing | What the Server Needs | Size |
|---|---|---|---|---|
| 1 | Client portal entry button (الدخول على بوابة العميل) | `POST /api/v1/settings/clients/:brand/preview` (`src/server/v1/client-accounts.ts:187`) (owner only) | Change access to `team`; update preview auth in `src/server/v1/index.ts:72-73` to allow team member sessions. | Small |
| 2 | Clients (العملاء) — Read | `GET /api/v1/clients` (`src/server/v1/team-read.ts:216`), `GET /api/v1/client` (`src/server/v1/team-read.ts:248`) | Exists. | Small |
| 3 | Clients (العملاء) — Edit | `PATCH /api/v1/settings/clients/:brand` (`src/server/v1/branding.ts:76`), `PUT /api/v1/settings/clients/:brand` (`src/server/v1/branding.ts:86`) | Exists. | Small |
| 4 | Clients (العملاء) — Delete | **Missing** | Add `DELETE /api/v1/settings/clients/:brand` (archive or soft-delete brand). | Small |
| 5 | Packages (الباقات) — Read | `GET /api/v1/client/packages` (`src/server/v1/team-read.ts:288`) | Exists. | Small |
| 6 | Packages (الباقات) — Create / Edit / Delete | `POST /api/v1/client/packages` (`src/server/v1/owner.ts:426`), `PATCH /api/v1/client/packages/:id` (`src/server/v1/owner.ts:449`), `DELETE /api/v1/client/packages/:id` (`src/server/v1/owner.ts:492`) | Endpoints exist. If team members manage packages per R60, relax access from `owner` to `team`. | Small |
| 7 | Payments (المدفوعات) — Read | Embedded in `GET /api/v1/client/packages` (`src/server/v1/team-read.ts:288`) | Exists. | Small |
| 8 | Payments (المدفوعات) — Mark Paid | `POST /api/v1/client/payments/paid` (`src/server/v1/owner.ts:502`) | Exists. | Small |
| 9 | Payments (المدفوعات) — Edit / Delete | **Missing** | Add `PATCH /api/v1/client/payments/:id` (edit amount/due date) and `DELETE /api/v1/client/payments/:id` (unmark or delete payment). | Small |
| 10 | Projects (المشروعات) — Read / Create / Edit / Delete | `GET /projects` (`src/server/v1/projects.ts:49`), `POST /projects` (`src/server/v1/projects.ts:86`), `PATCH /projects/:id` (`src/server/v1/projects.ts:146`), `DELETE /projects/:id` (`src/server/v1/projects.ts:202`) | Complete CRUD exists. | Small |
| 11 | Jobs (الشغلانات) — Read / Create / Edit | `GET /jobs` (`src/server/v1/team-read.ts:294`), `POST /jobs` (`src/server/v1/team-write.ts:122`), `PATCH /job/meta` (`src/server/v1/team-write.ts:345`), archive/restore (`src/server/v1/team-write.ts:430, 447`) | Exists. | Small |
| 12 | Jobs (الشغلانات) — Delete | **Missing** | Add `DELETE /api/v1/jobs` or `DELETE /api/v1/job` (hide/soft-delete job). | Small |
| 13 | Items (العناصر) — Read / Create / Edit / Delete | `GET /items` (`src/server/v1/items.ts:331`), `POST /items` (`src/server/v1/items.ts:337`), `PATCH /items/:id` (`src/server/v1/items.ts:386`), `DELETE /items/:id` (`src/server/v1/items.ts:444`) | Complete CRUD exists (posts handled via `/posts/:id`). UI needs delete confirm modal. | Small |
| 14 | Versions (النسخ) — Read / Create / Edit | `GET /items/:id/versions` (`src/server/v1/items.ts:493`), new version created via `PATCH /items/:id` (`src/server/v1/items.ts:386`) | Exists. | Small |
| 15 | Versions (النسخ) — Delete (with guardrail) | **Missing** | Add `DELETE /api/v1/items/:id/versions/:n`. Guardrail: reject with 409 conflict if version is approved or posted. | Small |
| 16 | Files & Media (الملفات) — Read / Upload / Delete | `GET /job/files` (`src/server/v1/items.ts:533`), `PUT /media` (`src/server/v1/plans-media.ts:286`), `DELETE /media` (`src/server/v1/plans-media.ts:421`) | Exists. | Small |
| 17 | Team Comments (تعليقات الفريق) — Read / Add | `GET /items/:id/comments` (`src/server/v1/items.ts:122`), `POST /items/:id/comments` (`src/server/v1/items.ts:138`) | Exists. | Small |
| 18 | Team Comments (تعليقات الفريق) — Edit / Delete | **Missing** (trigger `item_comments_immutable` in `migrations/027_job_model.sql:110` blocks UPDATE/DELETE) | Migration to allow UPDATE/DELETE on `portal.item_comments`; add `PATCH /api/v1/items/:id/comments/:id` and `DELETE /api/v1/items/:id/comments/:id`. | Small |
| 19 | Client Requests (طلبات العميل — الفريق) — Read / Accept / Decline / Delete | `GET /requests` (`src/server/v1/team-write.ts:655`), `PATCH /requests/:id` (`src/server/v1/team-write.ts:683`), `DELETE /requests/:id` (`src/server/v1/team-write.ts:820`) | Endpoints exist but are `ownerRoute`. Relax access to `teamRoute` so team members can accept/decline in place. | Small |
| 20 | Client Requests (طلبات العميل — العميل) — Read / Create / Cancel | `GET /requests` (`src/server/v1/client.ts:118`), `POST /requests` (`src/server/v1/client.ts:122`), `DELETE /requests/:id` (`src/server/v1/client.ts:175`) | Exists (cancel sets status to 'cancelled'). | Small |
| 21 | Client Requests (طلبات العميل — العميل) — Edit | **Missing** | Add `PATCH /api/v1/requests/:id` for client session to edit title, details, and output types before accepted. | Small |
| 22 | Client Links (لينكات العملاء) — List / Revoke / Reset PIN | `GET /access` (`src/server/v1/access.ts:78`), `POST /access/:id/revoke` (`src/server/v1/access.ts:147`), `POST /access/:id/reset-pin` (`src/server/v1/access.ts:130`) | Exists. | Small |
| 23 | Client Links (لينكات العملاء) — Copy Link Again | **Missing** | Store recoverable token/URL in `portal.client_links` and return `url` on `GET /api/v1/access`. | Small |
| 24 | Client Links (لينكات العملاء) — Renew Link | **Missing** | Add `POST /api/v1/access/:id/renew` to extend expiration date and return link URL. | Small |
| 25 | Client People (أشخاص العميل) — Read / Invite / Edit / Resend | `GET /client/people` (`src/server/v1/client-accounts.ts:102`), `POST/PATCH/POST resend` (`src/server/v1/client-accounts.ts:107, 146, 164`) | Endpoints exist (relax `owner` to `team` if team manages people). | Small |
| 26 | Client People (أشخاص العميل) — Delete | **Missing** | Add `DELETE /api/v1/settings/clients/:brand/people/:id`. | Small |
| 27 | Team Accounts & Invites (حسابات الفريق) — Read / Invite / Edit / Delete Invite | `GET /team` (`src/server/v1/team-admin.ts:37`), `POST /invites` (`src/server/v1/team-admin.ts:42`), `DELETE /invites/:id` (`src/server/v1/team-admin.ts:63`), `PATCH /users/:id` (`src/server/v1/team-admin.ts:71`) | Exists. | Small |
| 28 | Team Accounts & Users (حسابات الفريق) — Delete User | **Missing** | Add `DELETE /api/v1/users/:id` (delete or deactivate user). | Small |
| 29 | Schedule & Milestones (المواعيد) — Read / Create / Edit / Delete | `GET /milestones` (`src/server/v1/team-read.ts:393`), `POST/PATCH/DELETE milestones` (`src/server/v1/team-write.ts:463, 556, 649`), `time` endpoints (`src/server/v1/time.ts:62, 99, 137, 178`) | Complete CRUD exists. | Small |
| 30 | Content & Marketing Plans (الخطط) — Read / Import | `GET /plan` (`src/server/v1/client-profile.ts:22`), `GET /client-view/plan` (`src/server/v1/client-profile.ts:53`), `POST /plans/import` (`src/server/v1/plans-media.ts:170`) | Exists. | Small |
| 31 | Content & Marketing Plans (الخطط) — Delete | **Missing** | Add `DELETE /api/v1/settings/plans/:id` (pricing plans) and `DELETE /api/v1/plans/:id` (imported marketing plans). | Small |
| 32 | Client Reversal (تراجع العميل عن القرار) | `POST /api/v1/client-view/items/:id/decisions` (`src/server/v1/items.ts:613`) | Blocked by check in `src/service/dash/job-model.ts:205`. Allow changing decision on approved item until scheduled or posted. | Medium |
| 33 | Client Comments (تعليقات العميل) — Read / Add | `GET /client-view/items/:id/comments` (`src/server/v1/items.ts:122`), `POST /client-view/items/:id/comments` (`src/server/v1/items.ts:138`) | Exists. | Small |
| 34 | Client Comments (تعليقات العميل) — Edit / Delete Own | **Missing** (blocked by trigger `item_comments_immutable`) | Add `PATCH /api/v1/client-view/items/:id/comments/:id` and `DELETE /api/v1/client-view/items/:id/comments/:id`. | Small |
| 35 | Invoices & Documents (الفواتير والمستندات) — Read / Create / Edit | `GET /documents` (`src/server/v1/documents.ts:60`), `POST /documents` (`src/server/v1/documents.ts:85`), `PATCH /documents/:id` (`src/server/v1/documents.ts:109`) | Exists. | Small |
| 36 | Invoices & Documents (الفواتير والمستندات) — Cancel / Delete | `POST /documents/:id/status` (`src/server/v1/documents.ts:245`) (sets status='cancelled'), `DELETE /documents/:id` (`src/server/v1/documents.ts:263`) (drafts only) | Exists. Matches R60 rule (issued documents cancel instead of hard delete). | Small |

---

## 3. Page Actions Table (Screen by Screen)

### Client Screens

| # | Screen / Area | Action | Existing Endpoint (file:line) or Missing | What the Server Needs | Size |
|---|---|---|---|---|---|
| 1 | Client Shell | 4 navigation links (Home, For your review, My work, Requests) + legacy redirects | Frontend router (`web/src/App.tsx`) | No server change needed. | Small |
| 2 | Client Home | Load waiting for review items | `GET /api/v1/client-view/items` (`src/server/v1/items.ts:576`) | Exists (returns waiting items when `job` is null). | Small |
| 3 | Client Home | Load ready work & package summary | `GET /api/v1/home` (`src/server/v1/client.ts:24`) | Exists. | Small |
| 4 | Client Home | "Approve all" waiting items (with confirm dialog) | `POST /api/v1/client-view/items/:id/decisions` (`src/server/v1/items.ts:613`) via `approveItems` | Exists per-item. (Optional: `POST /client-view/items/decisions/batch` for atomic batch). | Small |
| 5 | Client Home | Row click opens item in For your review | Client navigation (`/client/review?item=:id`) | Frontend routing only. | Small |
| 6 | Client Review | Load item details & versions | `GET /api/v1/client-view/items/:id/versions` (`src/server/v1/items.ts:230`) | Exists. | Small |
| 7 | Client Review | View sent version file / preview | `GET /api/v1/client-view/items/:id/versions/:n/file` (`src/server/v1/items.ts:181`) | Exists. | Small |
| 8 | Client Review | Submit Approve / Request Changes | `POST /api/v1/client-view/items/:id/decisions` (`src/server/v1/items.ts:613`) | Exists. | Small |
| 9 | Client Review | "Change my decision" (on approved item) | `POST /api/v1/client-view/items/:id/decisions` (`src/server/v1/items.ts:613`) | Server blocks in `job-model.ts:205`. Allow edit until item scheduled/posted. | Medium |
| 10 | Client Review | View comments on item | `GET /api/v1/client-view/items/:id/comments` (`src/server/v1/items.ts:122`) | Exists. | Small |
| 11 | Client Review | Add comment on item | `POST /api/v1/client-view/items/:id/comments` (`src/server/v1/items.ts:138`) | Exists. | Small |
| 12 | Client Review | Edit own comment | **Missing** | Migration to permit update on `portal.item_comments`; `PATCH /client-view/items/:id/comments/:id`. | Small |
| 13 | Client Review | Delete own comment | **Missing** | Migration to permit delete on `portal.item_comments`; `DELETE /client-view/items/:id/comments/:id`. | Small |
| 14 | My Work | Load unified deliverables list with type filter | `GET /api/v1/client-view/items` (`src/server/v1/items.ts:576`) | Server currently filters to waiting review items only when `job` is null. Needs `scope=all` and type filter. | Small |
| 15 | Requests | Load client requests list | `GET /api/v1/requests` (`src/server/v1/client.ts:118`) | Exists. | Small |
| 16 | Requests | Submit new client request | `POST /api/v1/requests` (`src/server/v1/client.ts:122`) | Exists. | Small |
| 17 | Requests | Edit own request before acceptance | **Missing** | Add `PATCH /api/v1/requests/:id` for client session. | Small |
| 18 | Requests | Cancel own request before acceptance | `DELETE /api/v1/requests/:id` (`src/server/v1/client.ts:175`) | Exists. | Small |
| 19 | Requests | Approve / request edit on price quote | `POST /api/v1/requests/:id/price` (`src/server/v1/client.ts:166`) | Exists. | Small |

### Team Screens

| # | Screen / Area | Action | Existing Endpoint (file:line) or Missing | What the Server Needs | Size |
|---|---|---|---|---|---|
| 20 | Team Shell | Nav (Home, Work, Review, Clients) & Owner menu | Frontend layout (`web/src/components/Header.tsx`) | No server change needed. | Small |
| 21 | Team Home | "Needs action today" list | `GET /api/v1/home` (`src/server/v1/team-read.ts:191`) | Add `today: ActionItem[]` to return items due/urgent today. | Medium |
| 22 | Team Home | New client requests list | `GET /api/v1/requests` (`src/server/v1/team-write.ts:655`) | Exists, or embed in `GET /home`. | Small |
| 23 | Team Home | Accept client request in place | `PATCH /api/v1/requests/:id` (`src/server/v1/team-write.ts:683`) | Change access from `ownerRoute` to `teamRoute`. | Small |
| 24 | Team Home | Decline client request in place | `PATCH /api/v1/requests/:id` (`src/server/v1/team-write.ts:683`) | Change access from `ownerRoute` to `teamRoute`. | Small |
| 25 | Team Client Page | Header button: "Open client portal" | `POST /api/v1/settings/clients/:brand/preview` (`src/server/v1/client-accounts.ts:187`) | Change access to `team`; allow team sessions in `index.ts:72-73`. | Small |
| 26 | Team Client Page | Tab 1 Summary (overview, KPIs, activity) | `GET /client` (`src/server/v1/team-read.ts:248`), `GET /client/activity` (`src/server/v1/client-accounts.ts:172`) | Exists. | Small |
| 27 | Team Client Page | Tab 2 Work & Plan (jobs, items, plans) | `GET /jobs` (`src/server/v1/team-read.ts:294`), `GET /plan` (`src/server/v1/client-profile.ts:22`), `GET /projects` (`src/server/v1/projects.ts:49`) | Exists. | Small |
| 28 | Team Client Page | Tab 3 Package & Billing | `GET /client/packages` (`src/server/v1/team-read.ts:288`), `GET /documents` (`src/server/v1/documents.ts:60`) | Exists. | Small |
| 29 | Team Client Page | Tab 4 Client Admin: Links list | `GET /api/v1/access` (`src/server/v1/access.ts:78`) | Exists. | Small |
| 30 | Team Client Page | Tab 4 Client Admin: Copy link again | **Missing** | Persist recoverable token/URL and return `url` on `GET /api/v1/access`. | Small |
| 31 | Team Client Page | Tab 4 Client Admin: Renew link | **Missing** | Add `POST /api/v1/access/:id/renew` to extend expiration and return link URL. | Small |
| 32 | Team Client Page | Tab 4 Client Admin: Revoke link | `POST /api/v1/access/:id/revoke` (`src/server/v1/access.ts:147`) | Exists. | Small |
| 33 | Team Client Page | Tab 4 Client Admin: People list & invite | `GET /client/people` (`src/server/v1/client-accounts.ts:102`), `POST people` (`src/server/v1/client-accounts.ts:107`) | Exists (relax owner to team). | Small |
| 34 | Team Client Page | Tab 4 Client Admin: Remove person | **Missing** | Add `DELETE /api/v1/settings/clients/:brand/people/:id`. | Small |
| 35 | Team Client Page | Tab 4 Client Admin: Visibility toggles | `GET/PUT settings/clients/:brand/visibility` (`src/server/v1/client-profile.ts:28, 33`) | Exists. | Small |
| 36 | Team Job Page | Single workspace view & single item count | `GET /job` (`src/server/v1/team-read.ts:322`), `GET /items` (`src/server/v1/items.ts:331`) | Exists. Frontend drops old tabs and displays single count. | Small |
| 37 | Team Job Page | Add item | `POST /api/v1/items` (`src/server/v1/items.ts:337`) | Exists. | Small |
| 38 | Team Job Page | Edit item | `PATCH /api/v1/items/:id` (`src/server/v1/items.ts:386`) | Exists. | Small |
| 39 | Team Job Page | Delete item (with confirmation) | `DELETE /api/v1/items/:id` (`src/server/v1/items.ts:444`) | Exists. Frontend provides delete confirmation dialog. | Small |
| 40 | Team Job Page | Create / upload new version | `PATCH /api/v1/items/:id` (`src/server/v1/items.ts:386`) | Exists. | Small |
| 41 | Team Job Page | Delete version (with guardrail) | **Missing** | Add `DELETE /api/v1/items/:id/versions/:n`. Guard: reject if version is approved or posted. | Small |
| 42 | Team Job Page | Add team comment | `POST /api/v1/items/:id/comments` (`src/server/v1/items.ts:138`) | Exists. | Small |
| 43 | Team Job Page | Edit team comment | **Missing** | Add `PATCH /api/v1/items/:id/comments/:id` (requires trigger migration). | Small |
| 44 | Team Job Page | Delete team comment | **Missing** | Add `DELETE /api/v1/items/:id/comments/:id` (requires trigger migration). | Small |
| 45 | Team Job Page | Schedule post (R59 gated) | `PATCH /api/v1/posts/:id` (`src/server/v1/posts.ts:387`) | Exists. Frontend enables control only when client approved. | Small |
| 46 | Team Job Page | Menu ⋯: Batch hold | `PATCH /api/v1/job/model` (`src/server/v1/items.ts:516`) with `hold_until_all` | Exists. | Small |
| 47 | Team Job Page | Menu ⋯: Early release | `POST /api/v1/job/release-early` (`src/server/v1/items.ts:303`) | Exists (relax owner to team if needed). | Small |
| 48 | Team Job Page | Menu ⋯: AI mark | `PATCH /api/v1/job/items` or `maker` field | Exists. | Small |
| 49 | Team Job Page | Manage files (upload, replace, delete) | `PUT /media` (`src/server/v1/plans-media.ts:286`), `DELETE /media` (`src/server/v1/plans-media.ts:421`) | Exists. | Small |
| 50 | Team Review Page | Review queue & submit decision | `GET /review` (`src/server/v1/team-read.ts:371`), `POST /items/:id/decisions` (`src/server/v1/items.ts:457`) | Exists. | Small |
| 51 | Team Review Page | Withdraw item from client review | `POST /api/v1/items/:id/withdraw` (`src/server/v1/items.ts:483`) | Exists. | Small |

---

## 4. Size & Complexity Summary

- **Medium Complexity Work (2 items):**
  1. **Client Reversal ("Change my decision"):** Business logic update in `src/service/dash/job-model.ts:205` to permit changing approval to `changes_requested` until post is scheduled or published; updating `live_version` state and recording audit event.
  2. **Team Home "Today" Aggregation:** Extending `GET /api/v1/home` (`src/server/v1/team-read.ts:191`) to build and return a unified action list (pending items, items scheduled today, overdue milestones, client change requests) plus incoming client requests.

- **Small Complexity Work (Remaining items):**
  - Schema migration: drop/alter `item_comments_immutable` trigger to allow comment updates/deletes; add token persistence column to `portal.client_links`.
  - New endpoints: `DELETE /items/:id/versions/:n` (with approval/post guard), `PATCH/DELETE` comments, `PATCH /requests/:id` (client edit), `DELETE /settings/clients/:brand/people/:id`, `POST /access/:id/renew`, `DELETE /settings/plans/:id`, `DELETE /settings/clients/:brand`.
  - Endpoint access adjustments: change `ownerRoute` to `teamRoute` on `preview`, `requests` accept/decline/delete, and `people` management.
  - Parameter extension: add `scope=all` on `GET /api/v1/client-view/items` for the "My work" page.
