# BRIEF · SKV-ALL — Codex Lead runs the full skill validation (13 rounds, non-stop)
> **SUPERSEDED 2026-10-11** by `TSST/brands/t-sag/projects/tsst-ai/gemini/GEM-SKV-001.md` (Antigravity heavy pass; Claude + Codex review only).
ROLE A — TEAM RUNTIME: Codex = **acting Lead for this track only** (owner decision 2026-10-11, in chat to Claude Lead).
Follow AGENTS.md → TSST/context/boot.md. Bus task: `SKV-ALL`.

## Authority (owner)
- Run all rounds of `TSST/skills/VALIDATION_PLAN.md` **back to back without stopping for approvals**.
- You take every decision the plan leaves to "Lead" or "Ahmed": per-round go, fixtures, material/non-material fix calls, taste and Arabic calls. Record each one in the decision log (below).
- Owner decisions already fixed (see the plan's end section):
  - P1: VALIDATED needs a real job; fixtures cap at LAB_VALIDATED; high-risk skills need 2 evidence items.
  - P2: retro-scoring is allowed with a locked dossier, a scorer who is not the producer, and a trigger-negative fixture.
  - Ahmed reviews ALL results at the end.
- **You do NOT change any skill's status.** Write a `proposed_status` only. Ahmed signs off, then the Claude Lead applies.

## Rules
- **No spend.** No publication, client contact, ad accounts, deploy, or credentials.
- **No real Real Memory writes.**
- **Round 13 (MOTION-001..007):** needs the pilot teaser, which means generation credits and Ahmed. Do not run it. Mark every motion skill `BLOCKED — needs pilot job`.
- **Anything else that needs Ahmed, money or an external action:** mark it `BLOCKED — <reason>`, then continue with the next skill. Never stop the whole run.
- **Delegate to your team agents** (`.codex/agents/tsst-*.toml`) with a Skill Plan, as `AGENTS.md#universal-task-routing` says. The scorer must never be the agent that produced the evidence.
- **Usage limits:** if you hit one, write a checkpoint in `TSST/skills/validation/PROGRESS.md` and `release` the bus task with a resume note. On resume, continue from that checkpoint.
- **Commits:** one commit per round, prefix `chore(tsst-skills): validation round N`. Do not push; the Claude Lead pushes after review.

## Outputs (all in `TSST/skills/validation/`)
1. `results.csv`: one row per skill (120). Columns:
   - `round, id, team, priority, method, evidence (paths), score_0_5, criteria_passed, criteria_total, verdict, proposed_status, blocked_reason, scorer, notes_1_line`
   - `verdict` is one of: PASS / PARTIAL / FAIL / BLOCKED.
2. **`RESULTS.html`: the owner's review sheet.** Self-contained, no external assets, RTL-safe.
   - **Top:** total counts as tiles: ✅ PASS · ⚠️ PARTIAL · ❌ FAIL · ⏸ BLOCKED, plus % done.
   - **Then one table per team** (Lead, Core, LENS, SPARK, CREATIVE, MOTION, DEV), sorted by verdict (FAIL first) and then priority. Columns:
     - ✓/✗ icon
     - id + short name
     - score
     - proposed status
     - one-line reason
     - evidence link (relative path)
   - **"Needs your decision" table:** only the rows where Ahmed must decide or look (taste, Arabic, high-risk promotion, conflicts).
   - **Decision log table:** every decision you took for Ahmed, each with date, decision and reason.
   - Plain colours: green / amber / red / grey. Readable on phone.
   - Also write `RESULTS.xlsx` with the same tables, if `pip install openpyxl` works. Optional.
3. `PROGRESS.md`: the current round, a checkpoint, and per-round actual effort. This replaces the plan's cost guesses with measured numbers.
4. Per-round dossiers in `round-NN/`.
5. Final report, ≤ 15 lines: `TSST/handoffs/codex-lead/REPORT_SKV.md`, with `Skills used:` + `skill_friction:`.

## Done when
- All rounds 1–12 are scored. Round 13 is marked BLOCKED.
- `RESULTS.html` opens and is complete, and `results.csv` has 120 rows.
- `python TSST/context/tests/validate_spine.py` shows no new failures (baseline 27/29).
- The bus task is marked `done`.
