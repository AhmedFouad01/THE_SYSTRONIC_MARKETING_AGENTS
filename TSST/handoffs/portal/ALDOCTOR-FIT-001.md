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

## Round-2 mockups for S4 (drawn 2026-11-11; Ahmed's OK to draw: "أيوه ارسم"; not approved yet)
Folder `~/Work/DASH-SPRINT0/mockups/s4-r2/` (outside git, like the first round). The old 04–06 are untouched.
- `SPEC.md` is the brief: nine product rules (P1–P9), the fixed words, the sample state, the four screens.
- `04-home-today.html`, `10-home-week.html` (new: the second segment of Home, not a nav item), `05-job.html`,
  `06-review.html`, the shared pieces in `r2.css`, an `index.html`, screenshots in `shots/`.
- Drawn by CREATIVE (four runs, one screen each). Checked with `~/Work/DASH-SPRINT0/check-r2.mjs` (classes, hard-coded
  colours, sideways overflow, clipped text, borders, phone controls under 44px, button weight and colour, green
  outside Approve): 0 findings on all four. Then the Lead's R55 read of every frame.
- The TSST Design Gate tool is not on this Mac (it was never committed from the Windows copy), so its checks did not run.
- What the drawings cover: gaps 1–5, 9 and 10 of this note. Not drawn: brief fields, more channels, weekly numbers,
  Google reviews, budgets.
- In-house frames (Home › Week frames 3 and 4, and the labelled insets) show roles only and no agency name.

Decisions the drawings raise (Ahmed's): 13 (own rows only; owner has Mine / Everyone) · 14 (bulk approval moves to
the next person only) · 17 (the word for a dated to-do: Task / «تاسك», or «شغلانة», or keep «محطة») · 18 (review
order per client: reviewer then approver; the maker cannot approve) · 19 (schedule only after approval; one recorded
exception) · 20 (a team member's primary button is "New request" where the workspace says so).

Known error in the approved first round: `SAMPLE-STATE.md` and mockups 01–03 say "Wed 5 Nov 2026"; that date is a
Thursday. Round 2 writes Thursday.

## The Al Doctor version of the four screens (drawn 2026-11-11; not approved yet)
Ahmed on the round-2 drawings: "ايوه بس اللوجو مختلف، وكلمة كلاينتس دي ما تنفعش، احنا عايزينها بستايل الدكتور."
His four answers the same day: style = the identity of Al Doctor's PDF files · the nav word instead of "Clients" =
**Plan / الخطة** · all four screens · Arabic on desktop and phone.
- Folder `~/Work/DASH-SPRINT0/mockups/s4-r2/aldoctor/`: `SPEC-ALDOCTOR.md` (the brief), `theme-aldoctor.css`,
  `logo-doctor.png`, and the same four pages. Each page links `shared.css`, `r2.css`, then the theme: the screens do
  not change, one theme file and the in-house words do. Check: 0 findings on all four pages; no "client" word, no
  agency name, no person's name (searched).
- The theme: navy shell, blue actions and headings, yellow only as a small filled marker (active nav item, today),
  Alexandria for titles and IBM Plex Sans Arabic for text, the mark alone as the logo. All main text and chip pairs
  measure AA or better in light and dark (the document orange was darkened for chip text to pass).
- In-house wording: nav الرئيسية · الأعمال · المراجعة · الخطة; the workspace owner's group is «الإدارة» (الطلبات · التقارير ·
  الإعدادات); "Waiting on client" reads «مستني الموافقة»; a team member's primary button is «طلب جديد».
- Two things the Lead added, for Ahmed to confirm: a plan item (the weekly calendar) goes straight to the approver,
  so the review order can differ by kind of work (extends decision 18); the group title «الإدارة».
- For the build later: these are settings of one codebase (a theme file, a workspace kind "in-house", a label map),
  not a second product. Five thumb-colour lines sit in the Job page's style and belong in the theme. The page
  behind «الخطة» (the old client page 01–03) is not drawn in this version yet. The logo file is small (130×169).

## Approved by Ahmed, 2026-11-11 (both recorded on `sprint/BOARD.md`)
- The round-2 screens: "ايوه بس اللوجو مختلف، وكلمة كلاينتس دي ما تنفعش، احنا عايزينها بستايل الدكتور". Read as: yes to the
  four screens; the two objections are about Al Doctor's own look and words. Decisions 13, 14 and 17–20 are settled as drawn.
- The Al Doctor version: "موافق". The theme and the in-house wording are approved as drawn.
- Not approved by either: starting S4, any build, any install, any deploy.

## Build plan (the Lead's proposal for the sprint; nothing here is adopted until Ahmed says start)
One codebase. Core tickets go into S4 under the sprint's rules (one ticket = one branch = one PR into `next`, three
checks, an independent reviewer, migrations on a local database first). The Al Doctor part is settings and one install.
Sizes are rough (S about a day, M two to three, L four or more); the sprint session re-sizes when it writes each ticket.

**S4 re-cut (core, for every workspace).** Design source: `mockups/s4-r2/` and its `SPEC.md` (rules P1–P9).
| ID | Ticket | What | Gate | Size |
|---|---|---|---|---|
| S4-00 (new) | Makers and review order | One maker per item (also before anything is uploaded); per client: reviewer, approver (the client's approver or a team member); decisions recorded by step and by person; the maker cannot decide on their own item; "Planned" until the maker sends | migration | L |
| S4-01 (changed) | Home › Today | Per-person read model: needs action only when a named person must act; Mine / Everyone for the owner; tasks due and overdue; the quiet "with …" line; New requests card | design (r2 04) | M |
| S4-07 (new) | Home › Week | The week by day (working days are a workspace setting, default Sat–Thu), the five row kinds plus "waiting on others", folded days on the phone, optional weekday labels | design (r2 10) | M |
| S4-08 (new) | Tasks | A milestone with an owner shown as a Task: New task sheet, the check as its one control, filter by owner in the API, overdue never hidden | none | S |
| S4-02 | Work page with one New job modal | As planned; plus "New request" as a team member's primary where the workspace says so | none | M |
| S4-03 (changed) | Job page | Each post's own publish date, one control per row, the review line, Schedule only after approval with the one recorded exception, bulk schedule | design (r2 05) | L |
| S4-04 (changed) | Review queues | "Needs your review" and "Waiting on others" from the reader's side, with whom and for how long, bulk approve to the next person only | design (r2 06) | M |
| S4-05 | Requests in owner nav | As planned; plus requests filed by team members | none | M |
| S4-06 | Global settings pages | As planned; plus workspace kind, working week, weekday labels | none | S |

**In-house and Al Doctor (settings of the same codebase; after the S4 core screens).**
| ID | Ticket | What | Gate | Size |
|---|---|---|---|---|
| IH-01 | Clean install | Migrations stop inserting TSST's own clients and package into a new database (block A); a new workspace starts empty | migration (new installs only; production untouched) | S |
| IH-02 | White label | The "by" line, footer credit and client-facing messages come from workspace settings and can be empty (block B) | none | S |
| IH-03 | In-house workspace kind | One company: no client portal, packages, billing or documents; «الخطة» instead of Clients; «الإدارة» group; "Waiting on approval" wording; no client words anywhere (block C) | design (aldoctor/) | M |
| IH-04 | New client or company from the app | No folder work on the server to add one (block D) | none | M |
| IH-05 | Team pages in Arabic | A language switch for the team side, right-to-left layout checked on every team page, the missing Arabic strings (the AR copy file exists, about 120 lines short of the English one) | design (aldoctor/) | L |
| IH-06 | Themes | A theme is one token file chosen per workspace; the Al Doctor theme from `aldoctor/theme-aldoctor.css`; no colour, font or radius left in screens | none | M |
| IH-07 | Al Doctor install | A second host in the deploy script, backup and a restore drill there, the first owner account, the plan import; license wording is Ahmed's («راجع مع المستشار») | deploy, Ahmed's OK per step | M |

Order proposed: S4-00 → S4-08 → S4-01 → S4-07 → S4-03 → S4-04 → S4-02, S4-05, S4-06 → IH-01, IH-02 → IH-03, IH-05,
IH-06 → IH-04 → IH-07. IH-01 and IH-02 are independent and small, so they can also go first while S4-00 is designed.

Not in this plan (the next round, after the team works in it): TikTok / YouTube / Google on a post, the brief fields,
the five weekly numbers, Google reviews per branch, campaign short codes and budgets, the page behind «الخطة» in the
Al Doctor theme, a larger logo file.

Until the Al Doctor install exists, the team runs its first weeks on the sheet and the PDF files (from Sat 14 Nov).

## Next step (Ahmed's)
Say "start S4" to the sprint. The sprint session then adopts the re-cut on the board and writes the first ticket (S4-00)
with its design note for an independent review, as it did for S2-02 and S2-03.
