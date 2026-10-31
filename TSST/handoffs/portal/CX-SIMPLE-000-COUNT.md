# CX-SIMPLE-000: count what the old job model still holds (Codex, read only)

ROLE A (team runtime, DEV_AG), step 0 of `DASH-SIMPLE-001-PLAN.md`. Owner approved D1–D4 on 2026-10-31.
D1 = the old model closes: finished old jobs become view-only history, still-open old jobs move to items, new work is items only.
This step only measures. **No edits, no commits, no live DB, no ssh, no secrets.** Cost rules R52: read only what is named.

## Where
`C:\Work\tsst-portal` main (`git fetch` first; report the hash you read).

## A. Code: every place still on the old path
List file:line for each, grouped team / client / server:
1. Old decisions: `POST /decisions` / `POST /api/decision`, `useDecide`, `saveBulk`, `pendingClientReviews`, `withClientDecision`.
2. Screens that branch old vs new (e.g. `isJobModel` in `web/src/pages/Job.tsx`), and old job tabs (image / video / copy / plan / files).
3. Client pages still on old data: `ClientJob.tsx`, `ClientHome.tsx`, `ClientProject.tsx`, `ClientPosts.tsx`.
4. Reports / package counts that still read old decisions (spec S0 noted `reports.ts:128–153`, `packages.ts:600–610`).

## B. Data: how much old work is still open
Use the newest nightly dump in `G:\My Drive\TSST-Backups\dash\db\` (read the `.sql.gz` locally; never restore or send it anywhere).
Find the old vs new tables from `migrations/`. Per client (brand), count:
1. Old-model jobs: total · finished/archived · still open.
2. In the open ones: files/posts still waiting for a client decision (old path) · already decided.
3. New-model jobs and items (for comparison).
Report the dump file name and date. Names of clients are fine in the report; no other personal data.

## C. Your estimate
For step 2 (move open old work to items + close old writes): what the move needs (migration, script, or manual), what could break
(old client links, package Delivered counts, reports), and size: small / medium / big.

## Output
Write `CX-SIMPLE-000-COUNT_out.md` next to this file: A as a table, B as a table, C in ≤ 6 lines.
## Reply (3 lines, Egyptian Arabic)
dump date + main hash · open old jobs / waiting items total · your size for step 2.
