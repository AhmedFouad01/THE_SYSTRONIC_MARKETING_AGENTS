# GEM-REPO-001 · Existing agent skills and tools for git repo cleanup and local/GitHub sync
SURFACE: Gemini Desktop (Deep Research, new chat)
ROLE B — external research tool (Gemini Desktop), not a team runtime.
Paste everything between the lines into a NEW chat. Save the answer as `GEM-REPO-001_out.md` next to this file (TSST/handoffs/repo-cleanup/).
Next: LENS grades sources (TSST-LENS-SK-002) and writes the top-5 report. Needs Ahmed's go.

---
ROLE B — external research only. No local files, no file writing, text reply only. Every claim needs a live URL and the date you checked it; write "unverified" instead of guessing. Do not invent repos, star counts, dates or licences. Separate observed facts (from the repo page/API) from your interpretation.

**Who we are:** a small agency using Claude Code, Codex and Gemini agents on Windows 11 with Git Bash/PowerShell. One repo lives on Google Drive and syncs to GitHub. It has: unpushed local branches, 7 git worktrees outside the repo, stale merged branches (local and remote), a stash, untracked folders, and no secrets scan yet before the first full push. Our agent team has no git-hygiene skill.

**Find on GitHub** (agent skills first, then CLI tools):
- A. Claude Code skills / agent skills / SKILL.md / AGENTS.md / MCP repos for git hygiene.
- B. CLI tools and gh extensions, e.g. git-trim, git-sweep, git-cleanup, gh extensions for branches/PRs, git-filter-repo, gitleaks, trufflehog, detect-secrets, pre-commit hooks. Add better ones you find.

**Topics to cover** (note which candidate covers which):
1. Local branch hygiene (merged/stale/unpushed detection).
2. Worktree and stash handling (list, prune, remove safely).
3. Safe delete order (what to verify and back up before deleting).
4. Remote pruning (stale remote branches, closed PRs).
5. Local-to-GitHub sync (safe push/backup, divergence checks, dry-run).
6. Pre-push secrets scanning (before the first push of a long-lived repo; history scan too).

**For each candidate give:** repo URL; stars; last commit date; licence; open-issues signal; what it covers (topics 1-6); Windows / Git Bash compatibility (confirmed, reported, or unverified); install method; has dry-run/safe mode (yes/no); maintenance signal (active / slow / abandoned, with the evidence). Aim for 10-15 candidates, at least 4 of them agent skills.

**Then:** rank the top 5 for our case with stated criteria (safety/dry-run, Windows support, maintenance, licence, coverage of topics 1-6, ease for non-engineers). Say which combination covers all six topics and what gaps remain. Flag any candidate that deletes without confirmation or asks for credentials/tokens.

**Output format:** (1) top-5 table with ranking rationale; (2) full candidate table; (3) coverage matrix candidate x topic; (4) "unverified / contested" list; (5) source list: title, URL, date checked, primary (repo/official docs) or secondary (blog).
---
