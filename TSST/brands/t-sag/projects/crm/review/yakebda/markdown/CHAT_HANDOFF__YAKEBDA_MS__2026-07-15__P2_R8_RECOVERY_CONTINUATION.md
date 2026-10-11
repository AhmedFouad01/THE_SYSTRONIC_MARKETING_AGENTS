CHAT HANDOFF — YAKEBDA_MS — P2 R8 RECOVERY CONTINUATION
Generated: 2026-07-15 Africa/Cairo
Transcript: https://docs.google.com/document/d/1PpX1xmPbN978LrGg-pgRrYsVGImZX4QmsMd_9VTCg9Q/edit
Current Status: https://docs.google.com/document/d/1BYWS-DwMWBSDGIiuzZ_s3hS8JAtzxXifUxTRcoeUcXM/edit


1. Start here


Use:
C:\Users\10\Downloads\yakebda-p2-clean


Expected branch:
recovery/p2-ui-regression


Expected committed HEAD:
583cab74f9968241af444a4f5eb1037202118adc


Expected working tree is NOT clean. Latest user report shows:
 M apps/admin/src/global-colors.css
 M apps/admin/src/theme.css


Do not discard, reset, checkout over, amend, or overwrite the current uncommitted diff.


2. Remote boundary


PR #34 is live-verified as Open / Draft / Mergeable / Unmerged.
Remote head is the same committed SHA: 583cab74f9968241af444a4f5eb1037202118adc.
The current uncommitted changes are not on GitHub.
Do not push, mark Ready, merge, rebase, retarget, or modify the PR without explicit user direction.


3. Why verification was reopened


Old zero-diff evidence from Wave 3A, Wave 3B, Wave 4A retro-validation, Wave 4B, and initial C1 was invalidated because port 5173 served another worktree. Wave 1 POS and Wave 2 KDS remain the valid historical visual checkpoints.


Use exact baseline:
8c56f91


Never accept HTTP 200 as source identity. Before capture, hard-verify:
- worktree path
- expected SHA
- PID and port
- CSS import paths/order
- live CSSOM important counts
- requested and measured viewport
- theme
- route/state
- animation stability


Use an isolated server port. Do not use `git show > file`; use `git restore --source`.


4. Latest attempt result


Automated gates passed:
- Admin tests 11/11
- Admin build
- Color contract
- git diff --check


Visual matrix failed:
- 128 baseline states
- 128 candidate states
- 0 capture errors
- 20 zero-diff
- 108 real differences


Known clusters:
- .btn
- .sm / .primary.sm / .danger.sm
- .crm-name
- .menu-status
- .source-picker-card
- generic panels/cards


The current local diff includes 71 insertions and 57 deletions across theme.css and global-colors.css. No new commit exists.


Evidence folder:
C:\Users\10\Downloads\yakebda-p2-reverify-evidence-583cab7


5. Immediate action rule


Do not continue widening fixes until the user explicitly approves expansion into shared buttons, Menu, CRM, source-picker cards, and generic panels/cards.


When approval is received:
1. Verify branch, HEAD, and current dirty diff.
2. Preserve a patch or safety reference without changing the working state.
3. Inspect the 108 differences and group them by shared root cause.
4. Fix only evidenced root causes using scoped specificity, source order, and controlled :where() demotion.
5. Add no raw color and no new !important.
6. Keep global-colors.css the final import and color authority.
7. Rerun sentinel checks, automated gates, then the full identity-verified matrix.
8. Stop before commit and report results unless the user explicitly authorizes commit.


6. Prohibitions


- No revert of the connected recovery chain by default.
- No blind CSS deletion to chase counts.
- No feature work, P3, UI polish, or login redesign.
- No API, migration, or business-logic changes.
- No C2/C3 terminology needs to be introduced to the active Codex session.
- No claim of visual acceptance while differences remain.
- No claim of commit, push, CI, Ready, merge, or sync without direct evidence.


7. Required next report


Report:
- start branch and SHA
- preserved dirty-state evidence
- files/selectors changed
- root-cause grouping for all remaining differences
- identity verification
- sentinel and full-matrix results
- automated gates
- source and live CSSOM important counts
- evidence paths
- git status and diff stat
- remaining risks
