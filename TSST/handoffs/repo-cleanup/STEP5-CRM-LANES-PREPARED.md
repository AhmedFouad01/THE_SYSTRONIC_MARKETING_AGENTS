# CRM lanes — prepared (2026-10-11, DEV_AG)

To be pasted under STEP5-RESULT.md (that file lives on `master`, not on this branch, so it was not created here to avoid a merge conflict).
Nothing was deleted. Ahmed runs `TSST/handoffs/repo-cleanup/crm-cleanup.ps1`.

Backup: `C:\Work\backup\crm-cleanup-2026-10-11\` (bundle verified okay, 11 refs; stash patch sha256 `5aae9096...49e4b`; worktree files byte-compared).

| Branch | Tip | Ancestor of origin/feat/crm-mvp-ui | Worktree | Tracked clean |
|---|---|---|---|---|
| feat/crm-charts | 7583671 | yes | C:/Work/tsst-crm-lanes/charts | yes |
| feat/crm-ec2 | cb07789 | yes | C:/Work/tsst-crm-lanes/ec2 | yes |
| feat/crm-import | ed06974 | yes | C:/Work/tsst-crm-lanes/import | yes |
| feat/crm-p1b | 6ca52bf | yes | C:/Work/tsst-crm-p1b | yes (1 untracked: SESSION_BRIEF_P1B.md, backed up) |
| feat/crm-review-fix1 | 760cfdc | yes | none | n/a |
| feat/crm-review-fix2 | 9301f2f | yes | C:/Work/tsst-crm-codex | yes |
| feat/crm-server-search | fcd57c5 | yes | none | n/a |
| feat/crm-ui-migration | 3ac5741 | yes | none | n/a |
| feat/crm-v3-dashboard | 9034abe | yes | C:/Work/tsst-crm-lanes/dash | yes |
| feat/crm-v3-nav-import | 7411549 | yes | none | n/a |

Stash `stash@{0}` (7a8e319...): obsolete. origin/feat/crm-mvp-ui:CRM_APP/package.json already has `read-excel-file` 9.3.10, and all 7 lockfile packages the stash adds exist there with identical version and integrity.

Not backed up (by decision): node_modules, .next, dist, and in the kept `tsst-crm-mvp` only `.local-postgres` (3.9 GB) and `.local-tools` (100 MB). That worktree is not touched.
