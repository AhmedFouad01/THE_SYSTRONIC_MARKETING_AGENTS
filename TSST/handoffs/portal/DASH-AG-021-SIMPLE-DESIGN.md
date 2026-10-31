# DASH-AG-021: draw the simplified Dash (Antigravity, step 3)

ROLE A (team runtime, CREATIVE_AG work), step 3 of `DASH-SIMPLE-001-PLAN.md`. Owner approved D1–D4 and the R60 table on 2026-10-31.
R57 + R58: Antigravity draws → Codex checks → Lead R55 → Ahmed. HTML mocks only: no app code, no commit in the portal repo.
Goal = **less**: fewer doors, words, states and buttons than today. Full redraw (R55), not a patch. Cost rules R52: read only what is
named, reply in 3 lines, plain Egyptian Arabic. Effort: High.

## Where (strict)
Write only in `C:\Work\TSST\TSST\handoffs\portal\simple-001\`. Don't commit. Playwright: `C:\Users\10\tsst-tools\code-motion`.

## Read
- `DASH-SIMPLE-001-PLAN.md` (all: problem, D1–D4, new shape, R60 table + guardrails).
- Look + gate to reuse, don't restyle: `job-model-001\` (DESIGN.md, CSS, render.mjs with its checks) and the live client review /
  item panel built from it (approved). `ux12\DASH_UX12_REVIEW_AR.md` = background only.
- Rules: `C:\Work\TSST\TSST\core\rules\build.md` (R55); `C:\Work\TSST\TSST\core\rules.md` R49–R53, R59, R60.

## Draw (one HTML per page, rendered at 1440 + 390, light + dark; client pages EN + AR RTL)
Client (nav = 4 links: Home · For your review · My work · Requests; 3 statuses only: Needs your review · In progress · Ready):
1. `client-home.html`: waiting for you (count + rows, "Approve all") → latest ready work → package summary (plan inside) → "New request".
2. `client-review.html`: from the approved design; add "Change my decision" on an approved item until it is scheduled / posted.
   Client comments: edit + delete own.
3. `client-work.html`: all work + shared files in one list, filter by type (posts · video · design · files · …) instead of 4 pages.
4. `client-requests.html`: new request (output types, title, details) + my requests list with edit / cancel before the team accepts.
Team (nav = Home · Work · Review · Clients; Reports, Documents, Settings in the owner menu):
5. `team-home.html`: what needs action today + new client requests (accept / decline in place).
6. `team-client.html`: 4 tabs Summary · Work & plan · Package & billing · Client admin. Header: visible **"Open client portal"**
   button (fixed, not in ⋯). Client admin: links list with **Copy link · Renew · Revoke** on every row (link always findable again),
   people, visibility, language, activity.
7. `team-job.html`: one view only (no old tabs): items list + item panel (versions, comments, files). Extras (AI-made mark,
   hold / release early) inside ⋯ (D4).
8. `controls.html`: one sheet with every object in the R60 table and its real controls (add / edit / delete, delete confirm, the two
   guardrails: no delete on the approved or posted version; documents: cancel, not delete).
Words: plain; Arabic = live style (plain Egyptian, no slang). Demo brand invented, not a real client.

## Done when
render checks all 0 on every page; `DESIGN.md` (≤ 40 lines: what was removed vs today, decisions, open questions).
Reply 3 lines: pages · gate line · open questions.

## R1. Lead R55 look (2026-10-31): structure right (4 links, 4 tabs, portal button, link copy / renew, one job view). Fix, re-render:
1. Client Home: no per-row Approve / Request edits. A row opens the item in For your review (the only place to decide, plan D).
   Keep "Approve all" **with a confirm** (answers your open question 1).
2. Client side (Home, My work): no v1 / v2 chips, one status chip per row (the 3 client statuses) + type chip. Versions only inside
   For your review.
3. Every section header: title + count at the start, actions at the end. No chip floating in the middle (all pages).
4. Buttons (R51): no underlined text in buttons. At most 2 button colours per card: green = approve only, red = delete / revoke only.
5. Rows compact on 1440: the actions sit at the row end on the same line, not a second line under the text.
6. No internal text in the UI: "(R60)", "Persistent & findable", "Single integrated view", "Job Workspace", "Ready for Lead".
7. Link rows use the real address `https://dash.the-systronic.com/c/…`.
8. Team job: no per-item assignee (Lead note W1 2b-7). "Schedule" only after client approval (R59 schedule gate). One item count.
9. Expired link: Renew only (no Copy / Revoke). Timezone field: clock / globe icon, not a calendar.
Open question 2 (auto notice to the client on accept / decline): not in this job. The request status shows in My requests.
Render checks all 0; reply 3 lines.

## R1 done: Lead look accepted (2026-10-31). Client Home rows open review, no versions on client side, 2 button colours, real
address, no assignee / early Schedule. Left for the build: one item count on the job page ("Job items (5)" + "5 items total").
Next: Ahmed looks at the screens.
