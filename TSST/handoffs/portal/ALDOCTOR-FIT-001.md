# ALDOCTOR-FIT-001: Al Doctor's marketing team on today's Dash (fit test, 2026-11-11)

Internal note for the Dash sprint. Not for Al Doctor staff.
Ahmed's OK: "أيوه ابدأ" (2026-11-11), to a local fit test with no code change.

## Verdict
**The data fits. The daily view does not.** The calendar, the dated tasks and a two-step approval all go into
today's Dash. What a role sees when it opens the Dash in the morning is the gap, and that gap is S4's scope
(mockups 04–06, not approved yet). Three more things block a second install on another company's server.

## What was run
- The real server and built web from `next` (`3191704`) on a local PGlite database. Folder
  `~/Work/tsst-portal-aldoctor-fit` (a detached worktree of `tsst-portal`), everything of the test in `.fit/`
  (untracked). Launch entry `dash-aldoctor-fit`, http://127.0.0.1:3298.
- No change in `tsst-portal`, no deploy, nothing on production, no customer data.
- One client, "Al Doctor Group" (`aldoctor`). Five accounts named by role: Growth Director (`owner`), Social Media
  Lead, Senior Designer, Junior Designer, 3D Artist (`team`). Passwords are in `.fit/credentials.txt` only.
- Data:
  - 11 posts and 5 milestones in 2 jobs, imported with dash-plan-kit from a **copy** of
    `dash-plan-kit/clients/aldoctor` (the original has no `import.json`, so its real import is still open).
  - 24 one-time tasks, the dated lines of weeks 14 and 21 Nov of the "First 5 Weeks" sheet plus one 3D line,
    as milestones with one owner each (20 on the client, 3 on the campaign, 1 on the workspace).
  - One campaign, "DM-01 · Al Doctor Market · White Friday", 21–26 Nov.
- Scripts in `.fit/`: `seed.mjs` (data), `walk.mjs` (25 pages as the five roles: screenshot and page text in
  `.fit/shots/`), `flows.mjs` and `flows2.mjs` (what each role can and cannot do, through the API).
  No page error on any of the 25 pages.

## Works today (each one run)
1. **The plan goes in.** `check`, `preview`, `import` and `schedule` pass: 2 jobs, 11 posts, 5 milestones, 11
   publish dates.
2. **Dated tasks with one owner.** A milestone stores title, due date, optional start, owner and done. The API
   returns all 24 with the owner's name.
3. **Two approvals in a row.** Team track, then client track. "Posted" is refused until the post has an approved
   live version (409). The second approval was made through a client link.
4. **Return for edits with a note** (an Arabic note is stored and shown as written).
5. **A campaign on a growth stage** with its own milestones, shown on the Plan tab and on the campaign page.
6. **Weeks start on Saturday** in the reports.
7. **Arabic titles and task names** read correctly inside the English pages.

## Gaps for the team's daily work (most important first)
| # | Gap | What the test showed | Where it belongs |
|---|---|---|---|
| 1 | Home is the same for every role | All five roles see the same list: every post, as "Internal review". A post counts as waiting for review from the moment it is planned, with no design yet and a publish date weeks away. With a calendar made two weeks ahead, Home is never empty. | Core, S4-01, decision 13 |
| 2 | Tasks have no page | Home receives 29 tasks with their owners and shows none. A task appears only once it is overdue, and then on everyone's Home. The 20 client tasks show as one "Next milestone" line on Overview and nowhere else; the workspace task shows nowhere. Campaign milestones show without the owner. The API cannot filter by owner. | Core, S4-01 |
| 3 | No roles under "team" | The Junior Designer approved a post on the team track. Anyone can mark anyone's task done. "The Senior Designer reviews, then the Growth Director approves" cannot be enforced. | Core + config |
| 4 | The second approver is "the client" | Buttons and queues say "Approve & send to client" and "Waiting for client". The Growth Director would approve through the client portal with a second sign-in. | Core: second approver = a team role |
| 5 | Scheduling needs no approval | A post nobody approved, with no media, was set to "scheduled". The team's rule is: approve Tuesday, schedule Thursday, with one written exception. | Core + config |
| 6 | Three channels only | A post takes Instagram, Facebook and LinkedIn. TikTok, YouTube Shorts and Google per branch cannot be on a post: 2 of the 11 posts lose channels, and no Google post can be entered. | Core, migration |
| 7 | No fields for the brief | Content type, goal, template, shots, sizes, maker, the check before posting and the campaign short code have no field. The 9 extra columns of `posts.csv` are dropped at import. A campaign refuses `code` and `budget` (422). | Core |
| 8 | Team pages in English only | No Arabic switch for the team. Already an open item on the board. | Core |
| 9 | The publish date is hard to see | The job page shows the job's end date on each post (4 Dec for a post dated 29 Nov). No calendar view yet (S6-01). The caption does not show on the job page (F-02, in progress). | Core, S4-03, S6-01 |
| 10 | The team cannot file a request | Requests come only through the client door (405 for a team account). "Anything outside the calendar is written first" has no entry point. | Core, S4-05 |

Not there at all, as in the gap map: the week view of the rhythm, the five weekly numbers, Google reviews per
branch, counts per WhatsApp label, role cards with backups, the monthly spend limit.

## Blocks before a second install (any company, not only Al Doctor)
| # | Block | What the test showed |
|---|---|---|
| A | **A new database carries TSST's own client data** | Migrations 003 and 004 insert the client "ANVIL SUPPS" with the package "Starter Pack" at 15,000 EGP, and the names of four more TSST clients. "ANVIL SUPPS" and its package show in the client list of Reports on the test install; the other four names sit in the database without showing on a page. |
| B | **"by THE SYSTRONIC" is fixed in the code** | The lockup in the side menu and on the sign-in page, the default footer "Workspace by The Systronic", and client messages such as "Ask The Systronic for a new one". Workspace settings change the product name, logos and footers only. |
| C | **Agency parts on an in-house install** | "Open client portal", the package tile, "Packages & billing", Documents, and "Client:" on every row. They need one switch. |
| D | **A client is a folder on the server** | No "new client" in the app: a folder under `BRANDS_ROOT`, then the profile (which requires `header_color`). |

## Small things seen
- A post with both approvals was marked "posted" with no media on it.
- Reports shows "Delivered 11" straight after the import.
- A publish date on a Friday is accepted (wanted: stories go out on Fridays).

## What it means
- Keep dash-plan-kit as the way plans enter; add the task file and the extra columns to it later, when the fields exist.
- Gaps 1–5 and 9–10 change what mockups 04 (Home), 05 (Job) and 06 (Review) should draw. Redrawing them **before**
  Ahmed approves them avoids building S4 twice. Decisions 13 and 14 are answered by the same redraw.
- Blocks A–D are small, separate tickets, and they come before any install on Al Doctor's server.

## Proposed next step (needs Ahmed's OK; design gate R57)
Redraw mockups 04–06 with gaps 1–5, 9 and 10, plus one new screen "My week" (my tasks, my posts to make, my
approvals, by day, Saturday to Thursday). Ahmed approves the drawings; only then is anything built, inside S4 and
under the sprint's rules.
