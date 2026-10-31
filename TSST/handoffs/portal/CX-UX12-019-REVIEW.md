# CX-UX12-019: review Antigravity's UX12 quick fixes (Codex)

ROLE A (team runtime, DEV_AG review). R58 rung 2: Antigravity built, Lead looked at the shots (accepted), you review the code.
No deploy, no live DB, no secrets. Cost rules R52: read only what is named; reply in 3 lines.

## Where
`C:\Work\tsst-portal-ux12`, branch `ux12-quickfix` (5 commits on `origin/main`, last `811a0f7`). Read: `git diff origin/main...HEAD`
and `C:\Work\TSST\TSST\handoffs\portal\DASH-AG-019-UX12-QUICKFIX.md` (the 4 fixes + 4b).

## Check
1. Each of the 4 fixes does what the handoff says, nothing more (no API change, no `src/` edit).
2. Home: list = `getClientReviewQueue`; Approve all = `approveItems` on `current_version` with the confirm; errors shown; row link
   `?item=` preselects in `ClientReviewQueue` (desktop + 390) and a bad / stale `item` id falls back safely.
3. Request form: empty start, reset after submit, nothing sends `due` or files.
4. Gates: `web/` typecheck, build, ds:check, test:api; root typecheck + lint. Fix small issues yourself (commit on top);
   anything bigger: report, don't fix.

## Reply (3 lines, Egyptian Arabic)
verdict (merge / fix first) · gates · anything you fixed or found.
