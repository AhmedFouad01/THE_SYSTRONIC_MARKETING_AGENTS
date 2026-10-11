# HANDOFF · TSST Skill Validations session (opened 2026-10-11)
The Lead session for this track = Claude. Follow AGENTS.md → boot. Keep replies short, in Egyptian Arabic.

## Fixed loop (one round at a time, rounds 1–12; round 13 Motion stays BLOCKED until the pilot job)
1. **Ahmed runs Antigravity:** `TSST/brands/t-sag/projects/tsst-ai/gemini/GEM-SKV-001.md`, with `ROUND = N`.
2. **Claude reviews Antigravity's output, lightly:**
   - `TSST/skills/validation/round-N/RUN_LOG.md`: check_locators output + `git status`. Revert any `OUT_OF_SCOPE_EDIT` after checking it.
   - Spot-check `JUDGE_PACKET.md`.
3. **Claude writes the ChatGPT judge request** `GEM-SKV-003` (round 1; reuse it with ROUND = N afterwards). It must have:
   - a ROLE B block (ChatGPT is NOT TSST Lead);
   - "read `TSST/skills/validation/round-N/JUDGE_PACKET.md` from Drive";
   - ✓/✗ per check, PASS/PARTIAL/FAIL/BLOCKED per skill, a one-line reason, and a `proposed_status` per P1;
   - batches of 5–10 skills per message;
   - one golden-pass and one known-fail example for calibration;
   - "do not judge Egyptian dialect/tone; flag it for Ahmed";
   - its output pasted by Ahmed into `round-N/JUDGE_RESULTS.md`.
4. **Ahmed relays it:** runs it in ChatGPT, then saves the answer.
5. **Claude reviews:**
   - Sample the PASSes, check every disagreement, and add rows to `TSST/skills/validation/results.csv`.
   - Rebuild `RESULTS.html`: count tiles ✅⚠️❌⏸, one table per team sorted FAIL first, a "Needs your decision" table, and a decision log.
   - Commit and push.
6. **Ahmed:** looks at the FAILs and the Arabic items, then gives the go for round N+1.

## Rules (owner)
- P1: VALIDATED needs a real job; fixtures cap at LAB_VALIDATED; high-risk skills need 2 evidence items.
- P2: retro-scoring is allowed when the evidence is the RAW output, the scorer is not the producer, and negative tests are included.
- P3: no status change until Ahmed reviews ALL results at the end. Then Claude applies.
- Method v1: see the end of `TSST/skills/VALIDATION_PLAN.md`.
- Protect tokens: Claude only reviews; Codex is not used; Antigravity and ChatGPT do the heavy work.
- Log non-none friction in `TSST/core/friction-log.md`.

## State at handoff
- Round 1 (8 skills: CREATIVE-002/005/008/010, LENS-001/002, DEV-011/015) is ready to run. Antigravity has NOT run yet.
- Key files:
  - `TSST/skills/VALIDATION_PLAN.md`
  - `TSST/skills/validation_tracker.csv`
  - `GEM-SKV-001` (Antigravity runner)
  - `GEM-SKV-002_out.md` (research)
  - `TSST/brands/t-sag/projects/tsst-ai/skill-validation/LENS-SKV-001_workflow-options.md`
- Open, not in this track:
  - Motion AG pilot teaser.
  - The code-motion alpha-flag DEV task.
  - Ahmed still has to give the Magnific tier and the Flow credits.
