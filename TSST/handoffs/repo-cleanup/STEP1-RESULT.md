# STEP 1 RESULT (backup push prep) - 2026-10-11
Agent: DEV_AG | Skill: TSST-DEV-SK-011 (verification discipline only) | Status: NOT_READY
Verdict: NEEDS-ACTION (gitleaks NOT run: Docker engine is down). No push, delete, rewrite or config change was done.

## 1. Backup - DONE
- Source `C:\GitMetadata\THE_SYSTRONIC_MARKETING_AGENTS.git` -> `C:\Work\backup\gitmeta-2026-10-11\` (robocopy /E).
- 319 files / 842,712,744 bytes on both sides (identical).
- Branch tips match in the copy:
  - feat/crm-mvp-ui 4015129
  - anvil/campaign-01-reveal 4bfcde5
  - spike/better-auth-b0 5175a91
- `fsck --connectivity-only` on the copy: exit 0 (only dangling objects, which are normal).
- Source repo has 2 `tmp_obj_*` garbage files in objects/ (harmless, git warns).

## 2. gitleaks - BLOCKED
`docker version` -> cannot connect to `npipe:////./pipe/dockerDesktopLinuxEngine` (daemon not running). Docker Desktop is installed (`C:\Program Files\Docker\Docker\Docker Desktop.exe`) but I did not start it or download the binary (per instruction).
Report `C:\Work\gitleaks-report.json` NOT created. `--help` not checked (needs the image).
Command ready once Docker is up (pin a tag, e.g. `ghcr.io/gitleaks/gitleaks:v8.x.y`; confirm the exact tag exists):
`docker run --rm -v C:/GitMetadata/THE_SYSTRONIC_MARKETING_AGENTS.git:/repo:ro -v C:/Work:/out <image:tag> git /repo --log-opts="feat/crm-mvp-ui anvil/campaign-01-reveal spike/better-auth-b0" --redact -v --report-format json --report-path /out/gitleaks-report.json`
Note: the `:ro` mount may make git complain about "dubious ownership"/safe.directory inside the container; if so, mount a copy (the backup folder is fine) instead of editing git config.

## 3. Added sensitive-name files (all added paths on the 3 branches: 2,919 unique)
Only 2 name matches:
| Path | Call |
|---|---|
| CRM_APP/.env.example | Template, not a real secret. Values are local-dev: DATABASE_URL / ADMIN_DATABASE_URL point to 127.0.0.1:55432 (passwords masked in my check); POSTGRES_PASSWORD is 7 chars and WORKER_CONTEXTS is 2 chars (looks like placeholder / `[]`). I did not print them. Gitleaks must confirm the password is not a reused real one. |
| TSST/DEV/skills/tsst-dev-sk-007-identity-access-secrets-engineering/SKILL.md | Docs file; name matches "secret" only. False positive. |
No .pem, id_rsa, credential, .key or service-account files ever added. No real `.env` file at the tip of feat/crm-mvp-ui.

## 4. Largest blobs on the 3 branches (top 20; >10MB flagged)
| MB | Path |
|---|---|
| 185.07 FLAG | TSST/brands/anvil/projects/rollup-pre-hell/work/08_master_cmyk.tif |
| 67.92 FLAG | .../rollup-pre-hell/work/01_plate_extended.png |
| 67.14 FLAG | .../rollup-pre-hell/work/04_main_cells_chains.png |
| 63.04 FLAG | .../rollup-pre-hell/work/07_master_rgb.png |
| 39.58 FLAG | .../rollup-pre-hell/final/anvil-rollup-pre-hell-80x200.pdf |
| 16.37 FLAG | .../rollup-pre-hell/plates/plate-b-4x.jpg |
| 11.22 FLAG | .../rollup-pre-hell/ai-pass/v2.png |
| 11.13 FLAG | .../rollup-pre-hell/plates/plate-a.png |
| 10.65 FLAG | .../rollup-pre-hell/ai-pass/v1.png |
| 10.54 FLAG | .../rollup-pre-hell/plates/plate-b.png |
| 8.05 | PILOT-002 .../s06-stonewall/out/video_v1.mp4 |
| 5.55 and below | PNG/HTML assets (rest of top 20 are 2.4-5.6 MB) |
Ten blobs >10MB, all under TSST/brands/anvil/projects/rollup-pre-hell/ (about 543 MB raw, compresses less since PNG/TIF/PDF). None hits GitHub's 100MB hard limit EXCEPT the 185MB `08_master_cmyk.tif`: a normal push will be REJECTED by GitHub (GH001, file > 100MB), failing the whole push of the branch that contains it. Verified: only `anvil/campaign-01-reveal` has it (added in commit 7f4c530 "chore(tsst): sync working tree - Motion AG research ..."); feat/crm-mvp-ui and spike/better-auth-b0 do not, and origin/anvil/campaign-01-reveal (147db3f) does not. So the two other branches can be pushed independently; only the anvil push is at risk.

## 5. Dry run
`git push --dry-run origin feat/crm-mvp-ui anvil/campaign-01-reveal spike/better-auth-b0`:
```
   147db3f..4bfcde5  anvil/campaign-01-reveal -> anvil/campaign-01-reveal
 * [new branch]      feat/crm-mvp-ui -> feat/crm-mvp-ui
 * [new branch]      spike/better-auth-b0 -> spike/better-auth-b0
```
Roughly 136 commits / 3,904 objects not yet on any origin ref. Dry-run does not run server-side size checks, so it cannot show the >100MB rejection.

## Needed from Ahmed
1. Start Docker Desktop (or approve the gitleaks binary), then re-run step 2.
2. Decide on the 185MB TIF (and the other >40MB rollup files): git-lfs, or exclude/scrub from history (history rewrite = separate approval) before the real push. Otherwise the push to GitHub will fail.
3. No real push until gitleaks is clean.

---
# Step 1b (2026-10-11) - gitleaks scan, backup push, anvil scrub
Agent: DEV_AG | Skill: TSST-DEV-SK-011 (verification discipline only; no git-hygiene skill yet) | Status: NOT_READY
Verdict: A OK | B OK (0 real secrets) | C DONE | D DONE (no force push)

## A. Docker
Engine was already running (Docker Desktop 4.81.0, engine 29.6.1); nothing needed starting. Pulled `ghcr.io/gitleaks/gitleaks:v8.30.1` (latest release per GitHub API, published 2026-03-21), digest sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f.

## B. gitleaks full-history scan (--redact, backup copy mounted :ro, no git config edits)
| Branch | Commits scanned | Findings |
|---|---|---|
| feat/crm-mvp-ui | 167 | 1 |
| anvil/campaign-01-reveal | 107 | 1 |
| spike/better-auth-b0 | 114 | 1 |
All three are the SAME finding:
| Path | Rule | Commit | Call |
|---|---|---|---|
| CRM_APP/evidence/M2_VALIDATION.json L38 | generic-api-key | ba841c9 | FALSE POSITIVE. Value is a 64-hex SHA-256 file hash inside the `source_sha256` map (key `src/jobs.ts`). Checked without printing it. |
CRM_APP/.env.example (flagged by name earlier) was not flagged by gitleaks; local-dev placeholders only. Reports (redacted): C:\Work\gl-out\*.json.

## C. Push
`git push origin feat/crm-mvp-ui spike/better-auth-b0` -> both `[new branch]`, no force. Verified with ls-remote: origin tips = 4015129 and 5175a91 (equal to local).

## D. anvil scrub (Option A) - fresh clone C:\Work\scrub-anvil (git clone --no-local from the gitdir), git-filter-repo 2.47.0 (pip, pinned)
- Removed exactly 10 paths (--invert-paths, exact paths) under TSST/brands/anvil/projects/rollup-pre-hell/: work/08_master_cmyk.tif (194 MB), work/01_plate_extended.png (71), work/04_main_cells_chains.png (70), work/07_master_rgb.png (66), final/anvil-rollup-pre-hell-80x200.pdf (41.5), plates/plate-b-4x.jpg (17), ai-pass/v2.png (11.8), plates/plate-a.png (11.7), ai-pass/v1.png (11.2), plates/plate-b.png (11.0). Types: tif, png, jpg, pdf. All were added in 7f4c530 only.
- First attempt (plain `--refs <branch>`) changed 147db3f too, because filter-repo drops the GitHub PGP signature on the PR #1 merge commit (a39529b) and everything after it changes. Per your requirement that was NOT used; re-cloned and re-ran with `--refs 147db3f..refs/heads/anvil/campaign-01-reveal`, which rewrites only the 13 unpushed commits.
- Result: 147db3f and 3c5d3e4 unchanged; 147db3f is an ancestor of the new tip. 12 commits rewritten. Added commit 99117da: .gitignore rules (tif/tiff/psd/psb/ai anywhere in that project, final/*.pdf, and the 7 big png/jpg by exact path; small files like cutouts still trackable; check-ignore verified on all 10). Nothing deleted from Drive.
- Re-scan of the scrubbed branch: 108 commits, same single false positive (ba841c9). Largest blob now 11.77 MB (chatgpt-pack/01_layout-reference.png, same bytes as the removed v2.png, different path, kept); blobs >50 MB: 0.
- Push: `git push github anvil/campaign-01-reveal:anvil/campaign-01-reveal` from the clone -> `147db3f..99117da` (fast-forward, no force). origin tip = 99117da.
- Main repo untouched: local anvil/campaign-01-reveal still unscrubbed (now 0385ce5, 3 commits past 4bfcde5 made by other sessions, none with blobs >5 MB); working tree not touched; backup untouched.

### Commit mapping (old -> new), only changed ones; full file C:\Work\anvil-commit-map.txt
7f4c530->a929210  d5bb15e->402ec33  9552aab->936a023  772b985->8486a5c  15c6865->49cd67c  5d40e8e->44afe8a
a6580a0->22c4db8  6479f4b->ba58edb  1bdb2b9->6248d05  ae494ad->21d75e2  d6b834d->d7a2696  4bfcde5->267e1a2  (+ new 99117da)
Local-sync options for Lead/Ahmed (not done): in main repo, with a clean plan, `git rebase --onto 99117da 4bfcde5 anvil/campaign-01-reveal` moves the 3 newer local commits (14f7471, 0f95d46, 0385ce5) onto the scrubbed history. Local tracked copies of the 10 files would then show as deleted in the working tree on checkout (files are on Drive; rebase/checkout would delete them from the folder unless backed up first) - copy them out before any sync. Remember the .gitignore rule only applies after the sync.

## Notes
- Clone's `origin` = local gitdir; I added a `github` remote in the scratch clone only (no main-repo config change).
- skill_friction: SK-011 is a testing skill, not git hygiene; verification part (run, report real output) was applied manually. Missing: git-hygiene skill (history rewrite with signed-merge caveat, fresh-clone check, remote handling) - the filter-repo signed-merge pitfall belongs in it.

## Step 1b - status checkpoint (re-verified live after coordinator resume request)
All of A-D were already complete before the request; nothing remains. Pushes made (only these, no force):
- `git push origin feat/crm-mvp-ui spike/better-auth-b0` -> `* [new branch] feat/crm-mvp-ui`, `* [new branch] spike/better-auth-b0`
- `git push github anvil/campaign-01-reveal:anvil/campaign-01-reveal` (from clone) -> `147db3f..99117da`
Live ls-remote: anvil 99117da, feat/crm-mvp-ui 4015129, spike/better-auth-b0 5175a91. master not touched (local 4d8ddae).
C:\Work\scrub-anvil: clean working tree, HEAD 99117da, remotes: origin = local gitdir, github = GitHub. Kept for reference; deletable on Lead's word.
Main repo: local anvil still 0385ce5 (unscrubbed, unchanged by me).

---
# Step 2 - sync (2026-10-11)
Agent: DEV_AG | Skill: TSST-DEV-SK-011 (verification discipline only) | Status: NOT_READY
Verdict: 1 OK | 2 OK | 3 OK | 4 OK | 5 OK | 6 OK | 7 OK (nothing deleted). No force push.
- Backups: gitdir -> C:\Work\backup\gitmeta-2026-10-11b (874,797,338 bytes both sides, 38 refs both sides, tips match, fsck ok); 10 big files -> C:\Work\backup\anvil-big-files (sizes equal, TIF hash equal).
- Commits 4bfcde5..old-anvil (8): non-ANVIL only: 0f95d46, 0385ce5, 2e42b03, a54ca35. Mixed (split by path): 14f7471, 3fc8b57, 0829776, 9688160. ANVIL-only: none.
- tsst-core (9 new commits + L-006/R21-R22 note f53676c). rules.md conflict in 0f95d46: kept ours (R18-R40; R18-R20 text identical to a54ca35). Branch rules/lessons/sessions == main-tree files. Non-ANVIL tree == a54ca35 except rules.md (+R21-R40) and root .gitignore (scrub rules).
- anvil-sync-tmp: 4 ANVIL-path commits on top; tree == a54ca35 minus the 10 big files, plus .gitignore/core files.
- Checks: gitleaks v8.30.1 --redact on 13 new commits: no leaks (C:\Work\gl-out2\step2-new-commits.json). Largest blob on master/tsst-core/anvil-sync-tmp = 11.77 MB (0 over 50 MB). origin/master is ancestor of tip.
- Pushes (ff only): master 4d8ddae..f53676c; tsst-core/owner-rules ffbb7b2..f53676c; anvil/campaign-01-reveal 99117da..f4fe2e1. Local master fetched ff.
- Main tree: `git reset --mixed origin/anvil/campaign-01-reveal`; root .gitignore restored to committed version (it lacked the scrub rules; only a missing-lines diff). 10 big files present on disk, sizes unchanged, ignored. git status = only other sessions' WIP.
Refs (local/remote): master f53676c/f53676c | tsst-core/owner-rules f53676c/f53676c | anvil/campaign-01-reveal f4fe2e1/f4fe2e1 | anvil-sync-tmp f4fe2e1/(local only).
Cleanup candidates (not touched): worktrees C:/Work/tsst-core-owner-rules, C:/Work/anvil-sync; branch anvil-sync-tmp; C:/Work/scrub-anvil; C:/Work/gl-out, gl-out2.
skill_friction: SK-011 is a testing skill; no git-hygiene skill. Gaps: splitting mixed commits by path (use `git diff --binary -M c^ c -- <paths> | git apply --index --3way`, not cherry-pick -n + restore, which conflicts on renames), docker gitleaks needs GIT_CONFIG_COUNT env for safe.directory, Git Bash mangles robocopy flags.
