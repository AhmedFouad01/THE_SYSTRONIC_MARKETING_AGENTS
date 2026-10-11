# Step 3: branch separation (handoff to Codex, 2026-10-11)

Owner OK (Ahmed, 2026-10-11): finish separating and cleaning the branches. **No CRM merge.** Claude limit is near, so this track goes to Codex as backup Lead (R32). The Lead reviews the result on return.
State: `STEP1-RESULT.md` (Step 1, 1b, 2). master = tsst-core/owner-rules = f53676c; anvil/campaign-01-reveal = f4fe2e1. All three are pushed.

**Codex prompt (ROLE A, team runtime; local git + file work only):**
```
ROLE A — team runtime (Codex, backup Lead, `roles: [lead]` in TSST/bus/runtimes.yaml; runtime map TSST/context/adapters/codex.md). Track: repo cleanup only — do not touch brand work. Repo: G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS
(gitdir C:/GitMetadata/THE_SYSTRONIC_MARKETING_AGENTS.git). Boot: AGENTS.md → TSST/context/boot.md. Read TSST/core/rules.md (R15–R16, R21, R22, R33) and
TSST/handoffs/repo-cleanup/ASSESSMENT.md + STEP1-RESULT.md first.
HARD LIMITS: no git push of any kind, no force, no merge into master, no rebase, no history rewrite,
no `git branch -D` (only -d), no git config edits. Do not touch feat/crm-mvp-ui, the crm lane branches,
C:/Work/tsst-crm-* worktrees, or uncommitted files in the main working tree (other sessions' WIP).
Before every delete: list → confirm it matches this list → then delete. Log every command + output.

1. Commit the Lead's files on tsst-core/owner-rules (worktree C:/Work/tsst-core-owner-rules):
   copy TSST/handoffs/repo-cleanup/*.md (not desktop.ini) , TSST/core/friction-log.md and TSST/handoffs/LIMIT_FALLBACK.md from the main tree,
   commit "docs(tsst-core): repo-cleanup handoffs + friction rows". Local only.
2. Delete local branches already merged into master, with `git branch -d` only:
   crm-m0-foundation, crm-m1-core, crm-m2-journey-reporting, crm-m2-post-close-hardening,
   dev-ag-v0.2, tsst-core-v0.2-sync, anvil-sync-tmp. If -d refuses one, skip it and report.
3. Spike: `git tag archive/spike-better-auth-b0 spike/better-auth-b0` (local tag; branch stays).
4. Temp worktrees/folders (verify `git status` clean in each first; skip if not clean):
   `git worktree remove C:/Work/anvil-sync`, `git worktree remove C:/Work/tsst-core-owner-rules` (after step 1),
   then delete folders C:/Work/scrub-anvil, C:/Work/gl-out, C:/Work/gl-out2. Keep C:/Work/backup/* untouched.
   Then `git worktree prune`.
5. Stash: `git stash show -p stash@{0}`; report what it holds. Do NOT drop it.
6. Report only (do not change): remote branches merged into master (`git branch -r --merged origin/master`),
   the CRM lane branches contained in feat/crm-mvp-ui, the remaining worktrees, and main-tree WIP grouped by track
   (ANVIL / skill validation / SCC / font zip) with the branch each one should go to under R21.
Ask Ahmed before starting (R16); reply to him in Egyptian Arabic (R23).
Write the result to TSST/handoffs/repo-cleanup/STEP3-RESULT.md: a verdict per item, the commands run,
and a final `git branch -vv` + `git worktree list`.
```

**On Claude return (Lead):** review STEP3-RESULT.md → push tsst-core/owner-rules (+ff master) → delete the merged remote branches after owner OK → push the archive tag → decide on WIP branches per track. The CRM merge stays a separate track (owner said not now).
