# Repo cleanup assessment (read-only) - 2026-10-11
Agent: DEV_AG. Nothing was changed. Facts from git for-each-ref, rev-list, merge-base, merge-tree.
Skills: TSST-DEV-SK-011 (testing) and -006 (SQL) do not fit this git task; no git/CI skill matched (see skill_friction). Plain git inspection used.

## Key facts
- master = origin/master = 4d8ddae (2026-10-10). **anvil/campaign-01-reveal is a straight fast-forward of master** (0 behind, 15 ahead). 13 of the 15 commits are unpushed; 2 are on origin.
- All CRM feature branches except the spike are **ancestors of feat/crm-mvp-ui** (their commits are contained in it). mvp-ui = 122 commits ahead of master, 38 behind, one author, and **merges into master with no conflicts** (git merge-tree clean). Diff vs master: 547 files, +94k lines.

## 1+4. Branches
| Branch | Last commit | behind/ahead master | Merged? | Topic | Class |
|---|---|---|---|---|---|
| master | 10-10 | 0/0 | - | trunk | KEEP |
| anvil/campaign-01-reveal | 10-11 | 0/15 | no | 2 ANVIL + 13 other (see s2) | NEEDS-SPLIT (or just ff-merge, see s2) |
| feat/crm-mvp-ui | 10-09 | 38/122 | no | CRM tip, contains all CRM lanes; worktree has 77 untracked logs | MERGE (after review) |
| feat/crm-review-fix2 | 10-09 | 38/121 | inside mvp-ui | CRM review fix (worktree C:/Work/tsst-crm-codex) | DELETE after mvp-ui merged |
| feat/crm-review-fix1 | 10-09 | 38/116 | inside mvp-ui | CRM review fix | DELETE after |
| feat/crm-ui-migration | 10-08 | 38/110 | inside mvp-ui | CRM U19 | DELETE after |
| feat/crm-v3-dashboard | 10-08 | 38/78 | inside mvp-ui | CRM dash lane (worktree) | DELETE after |
| feat/crm-v3-nav-import | 10-08 | 38/76 | inside mvp-ui | CRM nav/import | DELETE after |
| feat/crm-charts | 10-07 | 38/62 | inside mvp-ui | CRM charts lane (worktree) | DELETE after |
| feat/crm-import | 10-07 | 38/62 | inside mvp-ui | CRM import lane (worktree) | DELETE after |
| feat/crm-ec2 | 10-07 | 38/61 | inside mvp-ui | EC2 outline, deferred (worktree) | DELETE after (content kept in mvp-ui) |
| feat/crm-p1b | 10-06 | 38/34 | inside mvp-ui | CRM P1b (worktree, 1 untracked file) | DELETE after |
| feat/crm-server-search | 10-06 | 38/33 | inside mvp-ui | CRM P1a S5 | DELETE after |
| spike/better-auth-b0 | 10-07 | 38/60 | no, 1 unique commit | THROWAWAY spike ("never merge") | KEEP until Ahmed decides; then tag + DELETE |
| chore/crm-m2-post-close-hardening | 10-04 | 79/0 | yes | old CRM | DELETE (local + remote) |
| feat/crm-m0-foundation | 10-02 | 88/0 | yes | old CRM | DELETE |
| feat/crm-m1-core | 10-02 | 84/0 | yes | old CRM | DELETE |
| feat/crm-m2-journey-reporting | 10-04 | 80/0 | yes | old CRM | DELETE (local + remote) |
| feat/dev-ag-v0.2 | 09-28 | 95/0 | yes | DEV_AG governance | DELETE |
| tsst-core-v0.2-sync | 10-05 | 30/0 | yes | core sync | DELETE (local + remote) |
| origin/chore/pilot-eol | 10-05 | 39/0 | yes | TSST pilot | DELETE remote |
| origin/chore/tsst-001a-baseline | 10-05 | 55/0 | yes | baseline | DELETE remote |
| origin/chore/tsst-session-2-spine | 10-05 | 57/0 | yes | spine | DELETE remote |
| origin/feat/c7-phase2-brand-assets | 10-05 | 35/0 | yes | VILL assets | DELETE remote |
| origin/feat/c7-vill-strategy-baseline | 10-05 | 41/0 | yes | VILL strategy | DELETE remote |
| origin/feat/team-skills-rule | 10-05 | 33/0 | yes | skills rule | DELETE remote |
| origin/anvil/campaign-01-reveal | 10-10 | 0/2 | no (local has +13) | ANVIL | KEEP (push after decision) |

Remote has 11 heads. **No CRM feature branch (besides m2) is on origin**, so CRM work from 10-05..10-09 exists only locally and in C:/Work worktrees. Pushing mvp-ui doubles as backup.

## 2. anvil/campaign-01-reveal: 15 commits not on master
| Topic | Commits | Count |
|---|---|---|
| ANVIL | 6bf8516 campaign-01 folder + reveal v2 pack + AE script; 147db3f Lead handoff to Codex (both on origin) | 2 |
| Creative tools / VILL | 3c5d3e4 photo-bank tool + VILL raw bank catalog; 7f4c530 working-tree sync (Motion research, VILL pilot PNGs/guidelines, font tests) | 2 |
| Motion AG team | d5bb15e MOTION_AG team, routing, guard, ADR-005; 9552aab state sync/Real Memory; 772b985 motion skills 005-007 + validation plan | 3 |
| Skill validation | 15c6865, 5d40e8e, a6580a0, 6479f4b, 1bdb2b9, ae494ad, d6b834d, 4bfcde5 (SKV-ALL bus task created then cancelled) | 8 |

No CRM or SCC commits on this branch. Commits are linear and interleaved (7f4c530 touches many areas), so a clean topic split by cherry-pick is unreliable.
**Recommendation:** branch is a pure fast-forward of master and all TSST docs/skills (no app code), so simplest safe path is push + `--ff-only` into master, no split. If Ahmed wants ANVIL isolated: the 2 ANVIL commits are the oldest two, so `git branch anvil/reveal-only 147db3f` is a clean prefix; the other 13 stay on the current branch (or a renamed `tsst/team-sync-2026-10`).

## 3. Worktrees and stash
| Worktree | Branch | State |
|---|---|---|
| main (gitdir C:/GitMetadata/...) | anvil/campaign-01-reveal | 3 untracked items |
| C:/Work/tsst-crm-mvp | feat/crm-mvp-ui | 77 untracked audit logs (CRM_APP/audits/2026-10-05/*.log) |
| C:/Work/tsst-crm-codex | feat/crm-review-fix2 | clean |
| C:/Work/tsst-crm-lanes/charts, dash, ec2, import | feat/crm-charts, -v3-dashboard, -ec2, -import | clean |
| C:/Work/tsst-crm-p1b | feat/crm-p1b | 1 untracked SESSION_BRIEF_P1B.md |

Stash `stash@{0}` on feat/crm-mvp-ui (2026-10-07): "wip(crm): import - read-excel-file 9.3.10 dep (partial)", only package.json + lock (+68 lines). Import was committed afterwards (feat/crm-import), so likely obsolete; verify the dep is in mvp-ui package.json before dropping.
Worktrees must be removed before their branches can be deleted.

## 5. Untracked
| Item | Size | What | Suggestion |
|---|---|---|---|
| TSST/skills/validation/ | 8K | skill-validation work files | KEEP - review, then commit on the TSST branch |
| systronic-control-center/ | 1 MB, 0 tracked | SCC scaffold (nested systronic-control-center/ dir, Makefile, docker-compose, apps/, docs) | KEEP, do not delete. Move out of repo root (own repo or C:/Work) or commit on its own branch; Ahmed decides |
| monumentextended-freeforpersonaluse.zip | 47K | Monument Extended font, personal-use licence (2018) | MOVE to TSST/CREATIVE/fonts (or brand assets, zips there are gitignored); check licence before client use |

Ignored but present: /tmp/ (tmp/pdfs, Sep 23), desktop.ini.

## 6. Top-level clutter (quick scan)
| Item | Note | Suggestion |
|---|---|---|
| LEGACY_ID_MAP.md (121 KB, Sep 20) | tracked, legacy | archive to TSST/migration/ |
| TSST_Specialist_Skill_Matrix_v0.1.xlsx, TSST_TEAM_BOOTSTRAP_PROMPT_v0.1.md (Sep 20) | tracked, pre-spine v0.1 | archive to TSST/migration/ |
| tmp/ | ignored scratch (pdfs) | delete locally if Ahmed OKs |
| TSST/PILOTS/TSST-PILOT-001, -002 | pilots finished (baseline frozen) | candidate for archive, not urgent |
| TSST/handoffs/*_report.md, VILL_RAW_BANK_FIX_01, ANVIL_REVEAL_V2_GPT* | finished handoffs | candidate for an archive/ subfolder |
| CRM_APP / CRM_BLUEPRINT / CRM_UI_HANDOFF | m2-era on master; mvp-ui adds 547 files | resolved by the CRM merge |

Not verified: C:/Work contents beyond git state; whether CRM mvp-ui tests pass (merge is clean, not validated).

## 7. Ordered action list (each step needs Ahmed approval)
| # | Action | Command | Risk |
|---|---|---|---|
| 1 | Backup local-only work | `git push origin feat/crm-mvp-ui anvil/campaign-01-reveal spike/better-auth-b0` | low, additive; first push of 122 CRM commits - scan for secrets first |
| 2 | Deal with 77 audit logs in mvp worktree | `git -C C:/Work/tsst-crm-mvp clean -n` (dry run) then gitignore `CRM_APP/audits/**/*.log` or delete | medium: deletes files; dry run first |
| 3 | Commit validation files on TSST branch | `git add TSST/skills/validation` then commit | low |
| 4 | TSST work to master, no split | `git switch master && git merge --ff-only anvil/campaign-01-reveal && git push origin master` | low; ff-only fails safely. Alt: split per s2 |
| 5 | CRM to master | `git merge --no-ff feat/crm-mvp-ui`, run CRM tests, push (or via PR) | medium: 94k lines; review first |
| 6 | Remove worktrees (mvp after step 2; save SESSION_BRIEF_P1B.md first) | `git worktree remove C:/Work/tsst-crm-lanes/charts` (repeat: dash, ec2, import, C:/Work/tsst-crm-codex, C:/Work/tsst-crm-p1b, C:/Work/tsst-crm-mvp) | medium: removes folders; refuses if dirty without --force |
| 7 | Delete already-merged local branches | `git branch -d chore/crm-m2-post-close-hardening feat/crm-m0-foundation feat/crm-m1-core feat/crm-m2-journey-reporting feat/dev-ag-v0.2 tsst-core-v0.2-sync` | low; -d refuses unmerged |
| 8 | After step 5, delete CRM lane branches | `git branch -d feat/crm-charts feat/crm-ec2 feat/crm-import feat/crm-p1b feat/crm-review-fix1 feat/crm-review-fix2 feat/crm-server-search feat/crm-ui-migration feat/crm-v3-dashboard feat/crm-v3-nav-import` | low |
| 9 | Delete merged remote branches | `git push origin --delete chore/crm-m2-post-close-hardening chore/pilot-eol chore/tsst-001a-baseline chore/tsst-session-2-spine feat/c7-phase2-brand-assets feat/c7-vill-strategy-baseline feat/crm-m2-journey-reporting feat/team-skills-rule tsst-core-v0.2-sync` | medium: shared remote; all verified merged |
| 10 | Stash | verify, then `git stash drop stash@{0}` | low if verified |
| 11 | Spike | `git tag archive/better-auth-b0 spike/better-auth-b0` then `git branch -D spike/better-auth-b0` | low with tag |
| 12 | SCC folder, font zip, legacy root files | move/archive per s5/s6 | low |

Order matters: 1 before any deletion; 5 before 8; 6 before 8.
