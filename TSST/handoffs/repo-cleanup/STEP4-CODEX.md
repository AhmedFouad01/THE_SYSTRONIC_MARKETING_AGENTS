# Step 4: last branch moves + REAL_MEMORY (handoff to Codex, 2026-10-11)

Owner OK (Ahmed, 2026-10-11). Prior state: `STEP3-RESULT.md`. Now: master = origin/master = tsst-core/owner-rules = 3184e36 (pushed). The 9 merged remote branches are deleted by Ahmed by hand. The CRM merge stays out of scope.

**Codex prompt (ROLE A, team runtime; local git + file work only):**
```
ROLE A — team runtime (Codex, backup Lead; runtime map TSST/context/adapters/codex.md). Track: repo cleanup only.
Repo: G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS. Boot: AGENTS.md → TSST/context/boot.md; rules R15–R40 in TSST/core/rules.md.
Read TSST/handoffs/repo-cleanup/STEP3-RESULT.md first. Ask Ahmed before starting (R16); reply in Egyptian Arabic (R23).
HARD LIMITS: no git push, no force, no rebase of pushed commits, no `branch -D`, no git config edits, no CRM branches or
C:/Work/tsst-crm-* worktrees, no other sessions' uncommitted WIP in the main tree. Log every command + output (R33 file id).

1. Move TSST commits off anvil (R21). Local anvil/campaign-01-reveal has 2 unpushed commits above origin:
   5973ad7 (new_job.py, delivery README/JOB_LAYOUT, rules.md, tsst-router SKILL) and d97fb10 (REAL_MEMORY + friction-log).
   Both are TSST core/delivery, not ANVIL. In a new worktree on tsst-core/owner-rules, cherry-pick both
   (rules.md / friction-log conflicts: keep both sides' added lines). Then, ONLY if anvil has no other unpushed commits,
   move the main tree's anvil branch back with `git reset --mixed origin/anvil/campaign-01-reveal` (keeps working files;
   verify the other sessions' WIP is unchanged and the main-tree files equal tsst-core's versions). Remove the worktree.
2. Update REAL_MEMORY/TSST_REAL_MEMORY (01_CURRENT_STATUS, 02_PROJECT_MEMORY/PROJECT_DECISIONS, 05_TIMELINE) with a short
   2026-10-11 repo-cleanup entry: what was wrong (mixed tracks on anvil, CRM never pushed, 185MB TIF), what was fixed
   (gitleaks clean, CRM + spike pushed, anvil scrubbed, master linear, merged branches deleted), and the new rules
   R21 branch-per-track, R22 one Lead memory, R23–R40 moved from Claude memory. Point to lessons.md L-006 and
   TSST/handoffs/repo-cleanup/. Commit on tsst-core/owner-rules (local only).
3. Leftovers: `git branch -d anvil-sync-tmp` (it is contained in anvil; -d only). Delete C:/Work/gl-out and C:/Work/gl-out2
   (scan reports, not repos). C:/Work/scrub-anvil: try `git -C C:/Work/scrub-anvil status` clean → remove with
   PowerShell `Remove-Item -Recurse -Force` (read-only pack files); keep C:/Work/backup/*.
Write TSST/handoffs/repo-cleanup/STEP4-RESULT.md: verdict per item, commands, final `git branch -vv`, `git log --oneline -3 tsst-core/owner-rules`.
```

**On Claude return (Lead):** review STEP4-RESULT.md → push tsst-core/owner-rules + ff master → tell the Delivery System session to work on tsst-core (R21).
