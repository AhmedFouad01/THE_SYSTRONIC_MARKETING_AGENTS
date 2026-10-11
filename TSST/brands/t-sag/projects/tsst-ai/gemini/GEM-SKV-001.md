# GEM-SKV-001 · Skill validation, heavy pass (all rounds)
SURFACE: Antigravity
Owner decision 2026-10-11: Antigravity does the heavy work. Claude Lead and Codex only review the packets, to save their tokens.
How to run: open Antigravity on the repo folder `G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS`, paste everything between the lines, and let it run. If it stops, paste "continue from TSST/skills/validation/PROGRESS.md".

---
ROLE: EXTERNAL TOOL — skill-validation evidence + preliminary scoring.
You are NOT a TSST agent. Do not claim TSST roles, teams, agents, skills or tiers. Do not run the TSST boot. Do not create bus tasks. Do not commit.
WRITE: only inside `TSST/skills/validation/`.
DO NOT: edit, move or delete any other file. Do not edit SKILL.md files, index.yaml or status fields. Do not touch REAL_MEMORY, .git, the bus or brand folders.
Your output is INPUT for the TSST Lead (Claude) and Codex reviewers. Every score is a PROPOSAL.

## Read
1. `TSST/skills/VALIDATION_PLAN.md`. It sets the rounds, methods and Round 1 list. Its last section holds the owner decisions (P1, P2 and P3), which are binding.
2. `TSST/skills/validation_tracker.csv`. It has 120 skills, with their priority, method and existing evidence.
3. `TSST/context_os/skills/TSST-CTX-SK-018-skill-evaluator/SKILL.md`. Use it as the evaluation method.
4. For each skill: its SKILL.md (path is in `TSST/skills/index.yaml`), plus only the evidence files listed for it in the tracker.

## Do
Work round by round, 1 to 12. Skip round 13 (MOTION): mark those skills `BLOCKED — needs pilot job`.

For each skill:
- **(a) Dossier.** Write `round-NN/<id>.md`, ≤ 40 lines:
  - the skill's acceptance criteria, as a checklist;
  - for each criterion: ✓, ✗ or ? (no evidence), with the exact evidence file path and line or section;
  - one trigger-negative check: a task this skill must NOT fire on, and whether its trigger text would wrongly match it.
- **(b) Preliminary score.** Give a score from 0 to 5 and a verdict of PASS / PARTIAL / FAIL / BLOCKED.
- **(c) Proposed status.** Follow P1 exactly:
  - VALIDATED only when the evidence is a real client job.
  - Fixture or synthetic evidence goes no higher than LAB_VALIDATED.
  - A high-risk skill needs 2 evidence items.
  - If you cannot find evidence, the verdict is BLOCKED with the reason. Never guess, and never invent evidence.
- **(d) Code skills (DEV).** Run the tests the tracker names and paste the real output in the dossier. Shell is allowed for read-only commands and tests only.

## Outputs (in `TSST/skills/validation/`)
1. `results.csv`: one row per skill. Columns:
   - `round, id, team, priority, method, evidence, score_0_5, criteria_passed, criteria_total, verdict, proposed_status, blocked_reason, scorer=antigravity, notes_1_line`
2. `RESULTS.html`: the owner's review sheet. Self-contained, no external assets, readable on phone, RTL-safe.
   - Top: count tiles ✅ PASS · ⚠️ PARTIAL · ❌ FAIL · ⏸ BLOCKED, plus % done.
   - One table per team (Lead, Core, LENS, SPARK, CREATIVE, MOTION, DEV), sorted FAIL first and then by priority. Columns:
     - ✓/✗ icon
     - id + short name
     - score
     - proposed status
     - one-line reason
     - dossier link
   - A "Needs owner decision" table: taste, Arabic ear, high-risk promotions and conflicts.
   - A "Needs reviewer check" column flag on every PASS that proposes VALIDATED.
   - Plain colours only: green / amber / red / grey.
3. `PROGRESS.md`: the last finished skill, the current round, and the time per round. Update it after every round, so a stop can resume.
4. `REVIEW_PACKETS/round-NN.md`: ≤ 25 lines per round, containing the table of that round's verdicts plus the 3 weakest claims. These packets are what the Claude and Codex reviewers will read.

## Done when
- Rounds 1–12 have dossiers, and round 13 is marked BLOCKED.
- `results.csv` has 120 rows, `RESULTS.html` is complete, and there are 12 review packets.
- `python TSST/context/tests/validate_spine.py` still shows 27/29. Run it read-only and report the result.
---
