# Dash sprint board (S0–S6)

The only source of truth for sprint progress. Every session reads this first and updates it in the same turn a ticket moves.
A ticket is never written as merged without its PR and its checks next to it.

- Plan (each ticket's `what` and `acceptance`): `~/Work/DASH-SPRINT0/sprint0-final.json` → `sprint_plan` (on this Mac, outside git).
- Report with Ahmed's approvals table: `~/Work/DASH-SPRINT0/SPRINT0-REPORT-AR.md`. Evaluation: `~/Work/DASH-EVALUATION-2026-11-05.md`.
- Mockups: `~/Work/DASH-SPRINT0/mockups/01..09`. Ticket files: `tickets/<id>.md` (written when a ticket starts).
- Product repo: `~/Work/tsst-portal` (GitHub `AhmedFouad01/tsst-portal`, branch `main`). Live: https://dash.the-systronic.com.

## Now
- Live release: **`d086f9e`** (live fixes F-03 + F-04 on top of F-01 + F-02) since 2026-11-11 (second deploy of the day); before it `496e255` (F-01 + F-02, 2026-11-11 08:47 Cairo), `1779ad0` (step D, 2026-11-10 21:05 Cairo), `3a5554a` (step C, migrations 031–035), `94e1a5b` (B), `8915d14` (A), `6290115` (PR #27). `main` = `d086f9e` = `next` (`5b6f5c0`) plus the merge commits.
- **2026-11-11: Ahmed reported two live problems** (the client sign-in card; post review does not show the work properly and never the copy). Tickets **F-01 and F-02 are built, merged (PR #56, #57) and deployed** the same day with his OK ("أيوه انشر"; release PR #58, live `496e255`, code only). **Open, his action:** upload the tight light logo in Settings › Workspace: at deploy time the stored `header_logo_light` was still the padded 1281×1281 canvas, which the new 40px cap shows very small on the light sign-in cards until it is uploaded again (any upload is now trimmed by the server). Then his signed-in look at the sign-in card and at a post under review (team and client).
- **2026-11-11, after the F deploy: Ahmed says the client page is very poor** (no plan, no acquisition / activation, only review posts; even the review is tiring). Diagnosed by a second workflow (five readers, each re-checked; digest `poor-diagnosis.txt` in the session scratchpad). Findings: (1) the CLIENT portal lost its plan page, stage board, roadmap, timeline and project cards in PR #27 (DASH-SIMPLE-001, live since 2026-11-04), not in the sprint; its Home is byte-identical before and after the sprint and shows a campaign box only when the per-client "Marketing plan" switch is on (off by default); (2) the TEAM client page's first tab (S3, step D) is mostly review states, the five-stage board is on the Plan tab; lost on the way: the roadmap calendar (on purpose, S6-01), the list of a client's posts and the editing of brand / job milestones (look accidental), a campaign with two stages fills only its first column (S3-04, on purpose); (3) review effort: one item at a time, no next, buttons at the bottom, and F-02 made each item taller. **F-03 (review effort) is being built on `next`.** Ahmed answered **"أيوه رجّعها"**: the plan page with its stages comes back to the client portal (a reversal of one part of DASH-SIMPLE-001): **F-03 and F-04 are merged (PR #59, #60) and deployed 2026-11-11** with Ahmed's OK ("أيوه انشر"; release PR #61, live `d086f9e`, code only), which also carries his OK for the three decisions taken in code (F-04 ticket). The "Open item" bug of the team Review queue is fixed on live by this deploy. **Open, his actions:** turn on "Marketing plan" per client where the client should see the Plan page (Settings › What the client sees); re-upload the light logo (Settings › Workspace); his signed-in look (review flow on a phone, the Plan page as a client).
- **The sprint's approved scope (S0–S3) is built and deployed (2026-11-10).** The loop is stopped. Left for Ahmed:
  1. (done: Ahmed confirmed step D signed in, "تمام شغال");
  2. mockups 04–06 (S4) and 07–09 (S5) need his approval before any of S4–S6 starts; decisions 8–15 are open;
  3. confirm or change at leisure: decisions 4, 5, 6 (running on defaults), the health thresholds 3 / 7 days;
  4. not built, his call: an Arabic switch for the team pages, "Archive client", "Team on this client";
  5. follow-ups on the tickets: migration 036 (drop `brands.ui_lang`, the old visibility row, the 027 trigger) once
     step C has settled; 12 tests that use the real `now()`; an archived project should stop the "waiting" count and
     `owed` still counts for delivered jobs (S3-06); the client Home reads a paused package's lines unguarded
     (S3-02); the nits of S3-05; `settings/Access.tsx` still offers PIN links (S4-06).
- **Ahmed, 2026-11-06: build first, deploy later.** No deploy yet, not even S0. `main` stays as it is (deployable with
  S0 alone); all new work goes to the integration branch `next`.
- Approved to build now: **S1-01, S1-03, S1-04, S1-05, all of S2, then S3** (mockups 01–03). Not approved: S1-02
  (needs Ahmed's access), S4–S6 (mockups 04–09 not approved), any deploy, any migration on production.
- **Where it stands (2026-11-06):** S1 is built and merged into `next` (S1-01 tag, S1-03 CI, S1-04 Cairo day, S1-05
  fixes, all four items), S2-01 (one route list) and S2-02 (a stable id for every job, five pull requests #35 to
  #39, migrations 031 and 032). `next` = `3191704`. S2-03 (one approvals service) is merged, in three pull requests: a (one writer of decisions,
  migration 033, PR #40), c (the five old decision routes answer 410, PR #41), b (a read never writes job data, one
  sync, a touched file is not a new version, PR #42). S2-04 (delete = hide, migration 034, one confirm dialog in the
  web, PR #43) and S2-05 (one `client_settings` row per client, migration 035, PR #44) and S2-06 (the server by domain, PR #45) and S2-07 (the old board and the dead decision path gone, round names gone, the route table in the docs tested, PR #46)
  are merged: **S2 is complete** (seven tickets, PRs #35–#46, migrations 031–035, all local only). S3-01 (the
  health word read model, PR #47) and S3-02 (Overview tab, mockup 01, PR #48) and S3-03 (Settings tab, mockup 02, PR #49) and S3-04 (Plan tab and campaign page, mockup 03, PR #50) are merged. S3-05 (Clients list cards, PR #51) is merged:
  **S3 is built** (five tickets, PRs #47–#51, no migration). Ahmed saw the preview on 2026-11-10 and said to fix its
  seven findings: S3-06 is merged (PR #52). Deploy steps A, B and C are live (2026-11-10; migrations 031–035 are applied on production). All four deploy steps are live (2026-11-10); the plan is `DEPLOY-PLAN.md`
  (four steps A–D, one per night; step C carries migrations 031–035). Nothing deploys without his OK per step.
- **S3 preview (2026-11-10):** the real server and built web from `next` (`c9cd03e`) on a local PGlite database, in
  `~/Work/tsst-portal-s3-preview/.preview/` (untracked: `start.sh`, `seed.mjs`, `backdate.ts`, `shots.mjs`; launch entry
  `dash-s3-preview`, port 3299; owner `owner@preview.invalid`, password in `.preview/credentials.txt`). Seeded like
  SAMPLE-STATE through the API (Nour Studio, Alpha Gym, Cairo Dental). Screenshots EN 1440 light and EN 390 dark; no
  page errors, no horizontal overflow. Not like the sample: no AR on team pages (no language switch), no scheduled /
  posted jobs (no posts seeded), "Ad" type does not exist.
- **Found at the preview, not fixed yet (one polish PR proposed):** (1) Settings › People rows are misaligned at 1440
  (name pushed to the far side, chip under the avatar); (2) Language & branding fields do not line up (logo / header
  image); (3) Plan board chips overflow their card ("Closed · hidden from client", "We are here"); (4) the four package
  meters sit in one cramped row (mockup: two by two); (5) client cards do not align their names; (6) the health
  "waiting" count includes items of delivered jobs and of projects hidden from the client (Nour shows 7, real 3);
  (7) "Waiting on client · today" where the sample says 1 day (the age is read from the send time).
- Runs as a self-paced loop in one session. Current ticket: the first row below that is not merged.
- **Ahmed's answers on 2026-11-06 (said in the Lead's main session, relayed):**
  1. decision 16: "شيل الرسالة": remove the shared-files notice; no client files list in this sprint (it is decided
     later with mockups 07–09 and his R60 answer);
  2. decision 12, branch protection: not possible on the current GitHub plan (the API answers 403 "Upgrade to GitHub
     Pro or make this repository public"). Whether to upgrade is Ahmed's call. Until then the rule stays ours: merge
     only with the three checks green and the reviewer's pass;
  3. decision 12, restore drill (S1-02): **approved 2026-11-06** ("موافق", in the Lead's main session, relayed) on the
     terms of `tickets/S1-02.md`: PostgreSQL 16 on the Mac in one locked folder, the Drive copy as the source (SSH
     only as a fallback with a temporary rule Ahmed adds himself), counts only, cleaned up the same day. Ahmed then
     answered in the sprint session ("اه موافق"): the Drive copy, the PostgreSQL 16 install, and rehearsing `next`'s
     migrations on the copy. **The drill passed the same day** (evidence on the ticket); Ahmed deleted the drill
     folder and the session checked it is gone (17:57 EET). S1-02 is done.
- Next owner stops: the S3 preview (Ahmed sees the built client page next to mockups 01–03), then the deploy plan.
  Proposed deploy order: S0 alone → S1 → S2 (migrations, after the restore drill) → S3, each in quiet hours.
- Deploy facts kept for later: this Mac's public IP changes within hours (three values on 2026-11-05) and port 22 did
  not answer from it, so read the IP at deploy time, Ahmed puts that one in the AWS SSH rule, and the deploy starts right after.

## Operating rules
1. **One ticket = one branch = one PR into `next`.** The branch is cut from `origin/next` in its own worktree. Never work
   on `main` or `next` directly, and no ticket PR targets `main` (since 2026-11-06): `main` must stay deployable with S0 alone,
   and `scripts/deploy.sh` refuses to run while a ready PR into `main` is open. `next` goes to `main` only at a deploy gate.
2. **Checks before a PR is merged:** `npm ci`, root typecheck, lint, `npx vitest run --no-file-parallelism`; plus the web typecheck,
   build and tests when `web/` changes. Until S1-03 is merged the checks run on this Mac and are written on the ticket; after it,
   CI must be green on the PR too.
3. **Independent reviewer on every PR:** a team agent (R1, `tsst-dev`) that sees only the diff and the acceptance list. Its findings
   are fixed or answered before the merge. Merge only when the checks are green and the reviewer says pass.
4. **The loop stops only at owner gates:** a decision a ticket needs, the S3 preview for Ahmed's approval, a Postgres install,
   restore-drill access, every deploy and every migration on production. It also stops on red checks on `next` or `main`.
5. **Deploys only with Ahmed's OK in chat**, in quiet hours (see Deploy below).
8. **Migrations are written and tested on a local database only.** Nothing touches production before a deploy gate, and the
   restore drill (S1-02) comes before any deploy that carries a migration.
9. **Preview before a deploy:** Ahmed sees the built pages, not only mockups: the real server and web from `next` on a local
   database seeded like `mockups/SAMPLE-STATE.md`, with EN 1440 light and AR 390 dark screenshots next to the mockups.
6. **Never touched by the loop:** `/etc/tsst-portal/portal.env`, `.env` files, `*.pem` contents, `~/.ssh`, AWS, DNS, mail or
   WhatsApp providers. Email sign-in returning 503 is expected (no mail provider on purpose).
7. Status words: `todo` · `in progress` · `in review` · `merged` · `deployed` · `blocked (<gate>)`.

## Approvals (Ahmed, in chat)
| Date | Approved | Meaning |
|---|---|---|
| 2026-11-05 | Mockups 01–03 (client page) as drawn | Design gate G2 is open for S3. Settles decisions 1, 2, 3, 7 (below). |
| 2026-11-05 | "Start S0" | S0-01 may be built and merged. The S0 deploy still needs its own OK. |
| 2026-11-06 | "طيب ابدأ ف تنفيذ الشكل والهيكلة الجديدة قبل النشر" (said in the Lead's main session, relayed to the sprint session) | Build the new structure and the new look before any deploy. Scope: S1-01, S1-03, S1-04, S1-05, all of S2, S3. Not S1-02, not S4–S6. Integration branch `next`; migrations on a local database only; decisions 4, 5, 6 run on the recommended defaults until he confirms them at the deploy gate. |
| 2026-11-10 | "أيوه صلّحهم" (the seven findings of the S3 preview) | S3-06 built and merged. |
| 2026-11-10 | "أيوه ابدأ A" (to: start step A, S0 alone, in the first quiet night?) | Step A of `DEPLOY-PLAN.md` may be deployed: `main` = `8915d14`, code only. Steps B, C, D each still need their own OK. The hour and the AWS SSH rule are his. |

## Decisions (numbers = `decisions_needed` in the plan)
| # | Decision | State | Answer or recommendation |
|---|---|---|---|
| 1 | Client page = 3 tabs (Overview / Plan / Settings), Settings in 5 sections | settled 2026-11-05 | Approved as drawn. |
| 2 | Package lines | settled 2026-11-05 | Keep the real lines: campaigns / ads / edit credits / hours. No new package model. |
| 3 | Account manager per client | settled 2026-11-05 | One "Account manager" line in Settings; needs a new column in S2-05. |
| 7 | Archive and Delete only in Settings > Danger | settled 2026-11-05 | Approved. |
| 4 | Requests per month on the client Home | default since 2026-11-06, Ahmed confirms at the deploy gate | No requests-per-month field (S2-05 does not add one). |
| 5 | Growth report link rule | default since 2026-11-06, Ahmed confirms at the deploy gate | The client's "This month's result" link shows only when the switch is on and a result exists. |
| 6 | "Approve all" on the client Home | default since 2026-11-06, Ahmed confirms at the deploy gate | Removed; the client approves on the item (built in S5, not now). |
| 8 | Arabic words: 5 stage names and "milestone" | open | Recommended: keep the current Arabic words; Ahmed confirms. |
| 9 | Who records a result | open | Recommended: any team member, name recorded, each field saves alone. |
| 10 | Metric list for v1 | open | Recommended: acquisition = reach; activation = visits or leads; revenue = orders; retention and referral optional. |
| 11 | Quiet hours for deploys | open, asked at the S0 deploy gate | Proposed: Cairo 01:00–06:00. Ahmed picks the day of the first migration deploy. |
| 12 | Restore-drill access and branch protection | open | Branch protection: not available on the current GitHub plan (403, needs GitHub Pro or a public repository); upgrading is Ahmed's call; until then merges follow our own rule (three checks green and the reviewer's pass). Restore drill (S1-02): approved 2026-11-06 on the terms of `tickets/S1-02.md`. |
| 13 | What a team member sees on Home and the job page | open | Recommended: own items only. |
| 14 | Bulk team approval | open | Recommended: moves items to the client queue only. |
| 16 | Shared files in the client's "My work" (found in S1-05) | settled 2026-11-06 | "شيل الرسالة": remove the notice. No client files list in this sprint; it is decided later with mockups 07–09 (S5) and Ahmed's R60 read / edit / delete answer. |
| 15 | Sprint boundary | open, before G5 | Recommended: baselines, next move, ad spend, Meta import, profitability, Remind and the client calendar go to a second sprint. |

## Gates
- **G0** Decisions 1–6 before S2-05 and before redrawing 01 / 02 / 07. 4, 5, 6 run on defaults since 2026-11-06 (confirmed at the deploy gate).
- **G1** Restore drill passed (S1-02) before any deploy that carries a migration (since 2026-11-06: migrations are built and
  tested locally first, so the drill gates the deploy, not the ticket).
  **Passed 2026-11-06** on the Mac from the Drive copy (`tickets/S1-02.md`): the nightly dump and the pre-deploy dump
  both restore, every table's count matches, the live release starts on the copy, and `next`'s migrations 031 to 033
  apply on real data. Limits: the off-server copy was five days old, and the drill does not cover media, secrets or
  a server rebuild.
- **G2** Design gate per set: 01–03 before S3 (**approved 2026-11-05**), 04–06 before S4, 07–09 before S5. Ahmed approves the drawn files.
- **G3** Migration gate: S2-02, S2-03, S2-04, S5-01 each need Ahmed's OK and a fresh backup the same day before they run on
  production. Building and testing them on a local database is approved (2026-11-06).
- **G4** Deploy gate: end of every part, quiet hours, Ahmed's OK, live smoke green.
- **G5** Sprint end: S0–S6 demos accepted here; anything else goes to the second sprint.

## Tickets

### S0 Hotfix: stop the live 404s on client links
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S0-01 | Add missing SPA routes | deploy | — | merged; deploy postponed by Ahmed (2026-11-06) | [#28](https://github.com/AhmedFouad01/tsst-portal/pull/28) → `8915d14` | pass (2 passes, final head `d8d089a`) | 10 routes, not the plan's 5. Checks at `d8d089a`: typecheck 0, lint 0 errors, vitest 603/603. Evidence: `tickets/S0-01.md`. |

Go / no-go (Ahmed): —

### S1 Safety (approved 2026-11-06, except S1-02)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S1-01 | Tag the live release and write the rollback | none | — | done 2026-11-06 (no code, no PR) | — | — | Tag `v-before-sprint` → `6290115` pushed. Rollback written below (Deploy). Tested: the local half of a deploy of the tag. Not tested: the switch on the server (needs Ahmed's OK). `tickets/S1-01.md`. |
| S1-02 | Backup and restore drill | decision | — | done 2026-11-06: drill passed (restore, counts, live release, rollback format, `next` 031 to 033 rehearsed); the drill folder is gone | — | — | Approved 2026-11-06 on the terms of `tickets/S1-02.md`. Must pass before any deploy that carries a migration. Counts only, same-day clean-up. |
| S1-03 | CI workflow | none | — | merged into `next` 2026-11-06 | [#29](https://github.com/AhmedFouad01/tsst-portal/pull/29) → `49e2847` | pass (2 passes) | CI green at `118cff4`: Server 1/2, Server 2/2, Web. About 7.5 minutes and 18 billed minutes per run. Branch protection waits for Ahmed's OK (decision 12). `tickets/S1-03.md`. |
| S1-04 | Cairo today helper everywhere | none | S1-03 | merged into `next` 2026-11-06 | [#31](https://github.com/AhmedFouad01/tsst-portal/pull/31) → `c34ecc8` | pass (2 passes; 3 small points accepted) | CI green at `b0ed129`. Today, the day of an event and clock times are Cairo, server and web. `tickets/S1-04.md`. |
| S1-05 | Evaluation "high" live fixes | deploy | S1-03 | merged into `next` 2026-11-06 (all 4 items) | [#32](https://github.com/AhmedFouad01/tsst-portal/pull/32) → `d116691`; [#34](https://github.com/AhmedFouad01/tsst-portal/pull/34) → `28806f7` | pass (2 passes on #32; pass on #34) | CI green at `12783d3` and `f387115`. 409 wording, confirm before the 3 deletes, Arabic "Home", the shared-files notice removed (decision 16). `tickets/S1-05.md`. |

Go / no-go (Ahmed): —

### S2 Foundation (approved 2026-11-06; migrations on a local database only)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S2-01 | `shared/routes.json` | none | S1-03 | merged into `next` 2026-11-06 | [#33](https://github.com/AhmedFouad01/tsst-portal/pull/33) → `5e45149` | pass (2 passes) | CI green at `076c1d8`. One route list for the server, the app and the tests; old `?view=` links redirect to `?tab=`. `tickets/S2-01.md`. |
| S2-02 | `jobs.id` uuid | migration | S2-01 (S1-02 gates its deploy) | merged into `next` 2026-11-06 (five pull requests) | a: [#35](https://github.com/AhmedFouad01/tsst-portal/pull/35) → `5921e39`; b: [#36](https://github.com/AhmedFouad01/tsst-portal/pull/36) → `d30b260`; d: [#38](https://github.com/AhmedFouad01/tsst-portal/pull/38) → `e9e9d0f`; c: [#37](https://github.com/AhmedFouad01/tsst-portal/pull/37) → `2e36225`; e: [#39](https://github.com/AhmedFouad01/tsst-portal/pull/39) → `ca9f13c` | design review: sound with changes (taken in design v2); each step passed an independent review (a 2 passes, b 2, c 3, d 2, e 2) | Five pull requests: a) the id on the register and on every job card, b) handlers check the register before writing, c) foreign keys from the working tables, d) the API takes `job_id`, e) the web links by id. No way to change a job's key is added. `tickets/S2-02.md`. Built and tested on a local database only. |
| S2-03 | One approvals service | migration | S2-02 | merged 2026-11-06 (a, c, b) | a: [#40](https://github.com/AhmedFouad01/tsst-portal/pull/40) → `0d83b98`; c: [#41](https://github.com/AhmedFouad01/tsst-portal/pull/41) → `9739f30`; b: [#42](https://github.com/AhmedFouad01/tsst-portal/pull/42) → `69b4d1a` | design review: sound with changes (taken in design v2); a: pass, two passes; c: pass, two reviewers, two passes each; b: pass, two passes | `tickets/S2-03.md`. Design first, with an independent design review, then small pull requests. |
| S2-04 | Soft delete and confirm everywhere | migration | S2-02 | merged 2026-11-06 | [#43](https://github.com/AhmedFouad01/tsst-portal/pull/43) | `c412e11` | `tickets/S2-04.md`. Migration 034 (local only). `client_links` is already soft (revoke). |
| S2-05 | `client_settings` row | decision | S2-01 | merged 2026-11-06 | [#44](https://github.com/AhmedFouad01/tsst-portal/pull/44) | `b5bdadc` | `tickets/S2-05.md`. Migration 035 (local only). Decisions 4, 5, 6 on defaults; decision 3's column. |
| S2-06 | Server split by domain | none | S2-03 | merged 2026-11-07 | [#45](https://github.com/AhmedFouad01/tsst-portal/pull/45) | `9e5ddbc` | `tickets/S2-06.md`. Nine domain files, `guard.ts`, `endpoints.ts` regrouped; no migration. |
| S2-07 | Delete dead code and rename rounds | none | S2-06 | merged 2026-11-07 | [#46](https://github.com/AhmedFouad01/tsst-portal/pull/46) | `6f4a3bc` | `tickets/S2-07.md`. Code only; the column/trigger drops wait for a later migration. |

Go / no-go (Ahmed): —

### S3 Client page (approved 2026-11-06; mockups 01–03 approved)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S3-01 | Health word read model | none | S1-04 | merged 2026-11-07 | [#47](https://github.com/AhmedFouad01/tsst-portal/pull/47) | `42cbd7c` | `tickets/S3-01.md`. `health.ts`; thresholds 3 / 7 days (Lead's defaults). |
| S3-02 | Overview tab | design | S2-02, S2-05, S3-01 | merged 2026-11-07 | [#48](https://github.com/AhmedFouad01/tsst-portal/pull/48) | `019d459` | Mockup 01. `tickets/S3-02.md`. Found: the team pages have no Arabic switch (the AR frame needs one; ask at the S3 preview); the client Home reads `included` unguarded (pre-existing, a paused package would break it). |
| S3-03 | Settings tab | design | S2-04, S2-05 | merged 2026-11-10 | [#49](https://github.com/AhmedFouad01/tsst-portal/pull/49) | `d350334` | Mockup 02. `tickets/S3-03.md`. Not built: Archive client and Team on this client (no model for either; ask at the S3 preview). |
| S3-04 | Plan tab and campaign page | design | S2-02 | merged 2026-11-10 | [#50](https://github.com/AhmedFouad01/tsst-portal/pull/50) | `4c2c2fb` | Mockup 03, without the calendar. `tickets/S3-04.md`. |
| S3-05 | Clients list cards | none | S3-01 | merged 2026-11-10 | [#51](https://github.com/AhmedFouad01/tsst-portal/pull/51) | `c9cd03e` | `tickets/S3-05.md`. |
| S3-06 | Fixes from the S3 preview | none | S3-01..05 | merged 2026-11-10 | [#52](https://github.com/AhmedFouad01/tsst-portal/pull/52) | `3191704` | `tickets/S3-06.md`. Ahmed 2026-11-10: "أيوه صلّحهم". |

Go / no-go (Ahmed): —

### F Live fixes after the deploy (reported by Ahmed on the live site)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| F-01 | The sign-in card (logo block, language button, glued words, footer, submit button) | deploy | S3 | **deployed 2026-11-11** (`496e255`) | #56 (`9e560ea`) | CI 3/3; browser gate 20 cards | `tickets/F-01.md`. Ahmed 2026-11-11, with a screenshot. Main cause: the stored light logo is a padded 1281×1281 square. Owner still to re-upload the logo. |
| F-02 | Reviewing a post shows the work and its copy (team and client) | deploy | S3 | **deployed 2026-11-11** (`496e255`) | #57 (`c7d4859`) | CI 3/3; real local server check | `tickets/F-02.md`. Ahmed 2026-11-11. Main cause: the web reads captions in the old shape; the client page never reads them; media is cropped and not the version's own. |
| F-03 | Reviewing takes fewer taps and less scrolling (client and team) | deploy | F-02 | **deployed 2026-11-11** (`d086f9e`) | #59 (`ca03144`) | CI 3/3; browser gate 26 cases; real local server check | `tickets/F-03.md`. Ahmed 2026-11-11: "حتى المراجعة متعبة". Also fixes a LIVE bug found on the way: "Open item" on the team Review queue links by the item id and lands on "This job could not be loaded" (since step C). Not deployed. |
| F-04 | The plan comes back to the client portal (plan page with the five stages, a richer Home) | deploy | F-02 | **deployed 2026-11-11** (`d086f9e`) | #60 (`5b6f5c0`) | CI 3/3; web gate 16 cases; server tests 11; real local server check | `tickets/F-04.md`. Ahmed 2026-11-11: "أيوه رجّعها". Gated by the per-client "Marketing plan" switch (off by default). Also closes older leaks of hidden campaigns' milestones and names in client reads (server, team reads unchanged). |

### S4 Team daily (not approved to start; mockups 04–06 not approved)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S4-01 | Home needs-action list | design | S2-02, S3-01 | todo | — | — | Mockup 04. |
| S4-02 | Work page with one New job modal | none | S2-02 | todo | — | — | |
| S4-03 | Job page | design | S2-03, S4-02 | todo | — | — | Mockup 05. |
| S4-04 | Review queues | design | S2-03 | todo | — | — | Mockup 06. |
| S4-05 | Requests in owner nav | none | S2-06 | todo | — | — | |
| S4-06 | Global settings pages | none | S3-03 | todo | — | — | |

Go / no-go (Ahmed): —

### S5 Growth (not approved to start; mockups 07–09 not approved)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S5-01 | Goals and results migration | migration | S2-02, S3-04 | todo | — | — | |
| S5-02 | Campaign page goal and result entry | none | S5-01 | todo | — | — | |
| S5-03 | Growth report (owner + client) | design | S5-02, S2-05 | todo | — | — | Mockup 09. |
| S5-04 | Client Home and review | design | S2-03, S5-03 | todo | — | — | Mockups 07 and 08. |

Go / no-go (Ahmed): —

### S6 Polish and docs (not approved to start)
| ID | Title | Gate | Depends on | Status | PR | Review | Note |
|---|---|---|---|---|---|---|---|
| S6-01 | Calendar view on Work | none | S4-02 | todo | — | — | |
| S6-02 | WhatsApp deep link to an item | none | S5-04 | todo | — | — | No sending, no provider. |
| S6-03 | Docs and rules | deploy | S6-01, S6-02 | todo | — | — | |

Go / no-go (Ahmed): —

## Deploy (only after Ahmed's explicit OK in chat)
1. Ahmed puts this Mac's public IP (`curl -s https://api.ipify.org`) in the AWS security-group SSH rule. The loop never touches AWS.
2. From a clean checkout at `origin/main`, with GNU tar and GNU grep first on `PATH`
   (`/opt/homebrew/opt/gnu-tar/libexec/gnubin`, `/opt/homebrew/opt/grep/libexec/gnubin`):
   `TSST_KEY=~/.ssh/tsst-portal-key-fra.pem TSST_PORTFOLIO=/Users/fouad/Work/TSST/TSST/core/portfolio.yaml bash scripts/deploy.sh`
3. Live smoke for the part (the list is on the part's deploy ticket).
4. Rollback: see below.

### Rollback (written by S1-01; the server half is not exercised yet, see `tickets/S1-01.md`)
Same env as the deploy command in every case.
- **One step back, code only:** `bash scripts/deploy.sh --rollback`. It swaps the server's `current` and `previous`
  releases and restarts. Running it twice returns to the newer release. The database is not touched.
- **Back to the release from before the sprint** (tag `v-before-sprint` = `6290115`), when more than one deploy has
  happened: in `~/Work/tsst-portal` run `git fetch origin --tags && git checkout --detach v-before-sprint`, then the
  deploy command with `TSST_ALLOW_OPEN_PRS=1` in front (the script refuses a checkout that is not `origin/main` without it).
- **After a deploy that carried a migration:** code alone cannot go back, migrations only go forward. The deploy wrote
  `/srv/tsst/backups/pre-deploy-<release>.sql.gz` before migrating; going back means restoring that dump, then
  redeploying the older release. The restore procedure is S1-02 (needs Ahmed's access) and must be drilled first.

| Date | Part | Release | Smoke | Rollback | Note |
|---|---|---|---|---|---|
| 2026-11-04 | before the sprint | `6290115` | — | — | PR #27, migrations 028–030. Detail: `../DASH-AG-022-SIMPLE-BUILD.md`. |
| 2026-11-10 | A: S0 (the missing SPA routes) | `8915d14a7` | `/login` 200; the ten routes answer the app shell (200 `text/html`); an unknown path 404 JSON; `/api/v1/me` 401 | not needed; `deploy.sh --rollback` goes back to `6290115` (code only) | Ahmed: "انشر دلوقتي". Pre-deploy dump `pre-deploy-8915d14a7.sql.gz` (768K). Migrations: none applied, 30 already applied. Deployed outside the proposed quiet hours at his word (code only). |
| 2026-11-10 | B: S1 (CI, Cairo day, live fixes, the shared-files notice removed, one route list) | `94e1a5b08` | signed out only: `/login`, `/jobs`, `/clients`, `/review`, `/client/work`, `/jobs/post`, `/clients/project` answer the app shell; an unknown path 404 JSON; `/api/v1/me`, `/jobs`, `/clients` 401; `/` answers 200 (the shell) where the old release redirected to `/login` | not needed; `deploy.sh --rollback` goes back to `8915d14` (code only) | Ahmed: "أيوه انشر B". PR #53 (`28806f7` + the one-line test date fix `fd5370b`, test only). Pre-deploy dump `pre-deploy-94e1a5b08.sql.gz`. Migrations: none applied. Signed in: Ahmed checked the live site on 2026-11-10 and said "تمام شغال". |
| 2026-11-10 | C: S2 (a stable job id, one approvals service, delete = hide, one settings row per client, the server by domain, the old board gone) | `3a5554a6e` | signed out: `/login`, `/jobs`, `/clients` 200; `/legacy` 404; `/api/tree`, `/api/v1/me`, `/api/v1/clients`, `POST /api/decision` 401; unknown path 404. Server (read-only, counts): `schema_migrations` 35, last `035_client_settings.sql`; register `job_projects` 8 = `job_meta` 8 = `job_sources` 8; `client_settings` 5 = `brands` 5; service active; no error line in the journal after the start | **the database restore**, not the code switch: restore `pre-deploy-3a5554a6e.sql.gz`, then redeploy `94e1a5b` | Ahmed: "ابدأ c". PR #54 (`next` at `6f4a3bc` merged into `main`). Pre-checks: today's nightly dump and the off-server copy (19:03, 0 errors) present; `bridge_item_decision()` owned by `tsst`; 15G free. Pre-deploy dump `pre-deploy-3a5554a6e.sql.gz` (768K). Migrate: applied 031–035. Deployed at 20:04 Cairo, outside the proposed quiet hours, at his word. Signed in: Ahmed checked the live site on 2026-11-10 and said "تمام شغال". |
| 2026-11-10 | D: S3 (the new client page, the campaign page, the Clients cards) | `1779ad0d0` | signed out: `/login`, `/clients`, `/clients/view`, `/clients/project`, `/jobs`, `/documents` 200; `/api/v1/me`, `/api/v1/clients` 401; unknown path 404. Server (read-only): `schema_migrations` still 35; service active; no error line in the journal after the start; `current` = `1779ad0d0`, `previous` = `3a5554a6e` | `deploy.sh --rollback` goes back to `3a5554a` (code only; the database is the same for both) | Ahmed: "ابدأ دي. هدخل انام وتخلص كل السيستم." PR #55 (`next` at `3191704` merged into `main`). Pre-deploy dump `pre-deploy-1779ad0d0.sql.gz`. Migrate: none applied, 35 already applied. Signed in: Ahmed checked the live site and said "تمام شغال". |
| 2026-11-11 | F: live fixes F-01 (sign-in card) + F-02 (post review) | `496e25528` | signed out: `/login`, `/clients`, `/review`, `/jobs`, `/client/for-your-review` 200 (app shell); `/api/v1/me`, `/api/v1/review`, `/api/v1/client-view/items`, a version file route 401; `/api/v1/workspace` 200; unknown path 404; the served CSS holds `.auth__lang`, `.riv__*`, `.workspace-footer__sep`; the `ReviewItemView` chunk answers 200. Server (read-only): `tsst-portal.service` active, `current` = `496e25528`, `previous` = `1779ad0d0`, 0 error lines in the journal after the start, 15G free | not needed; `deploy.sh --rollback` goes back to `1779ad0d0` (code only) | Ahmed: "أيوه انشر", then "تم، كمّل" after adding the Mac's IP. Release PR #58 (CI 3/3). Pre-deploy dump `pre-deploy-496e25528.sql.gz` (768K). Migrations: none applied, 35 already applied. The stored light logo was still 1281×1281 at deploy time (owner to re-upload). Seen in passing: an old failed transient unit `run-u2264.service` (a one-off `r7-live-check.ts` from 2026-10-23), unrelated. Signed-in check by Ahmed: pending. |
| 2026-11-11 | F: live fixes F-03 (review flow) + F-04 (client Plan page, client-read privacy) | `d086f9efb` | signed out: `/login`, `/review`, `/jobs`, `/clients`, `/client`, `/client/plan`, `/client/for-your-review` 200 (app shell); `/api/v1/me`, `/api/v1/review`, `/api/v1/client-view/plan`, `/home`, `/requests` 401; `/api/v1/workspace` 200; unknown path 404; the served CSS holds `.decision-bar`, `.cplan`, `.item-nav`; the `ClientPlan` chunk is in the bundle. Server (read-only): `tsst-portal.service` active, `current` = `d086f9efb`, `previous` = `496e25528`, 0 error lines in the journal after the start, 15G free | not needed; `deploy.sh --rollback` goes back to `496e25528` (code only) | Ahmed: "أيوه انشر". Release PR #61 (CI 3/3). Pre-deploy dump `pre-deploy-d086f9efb.sql.gz` (772K). Migrations: none applied, 35 already applied. No client setting was changed by the deploy. Signed-in check by Ahmed: pending. |
