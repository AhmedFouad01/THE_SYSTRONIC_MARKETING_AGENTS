# GEM-SKV-001 · Skill validation: Antigravity evidence + test runs (method v1, one round per paste)
SURFACE: Antigravity
Owner decision 2026-10-11. Method v1 is based on GEM-SKV-002 (research) and LENS-SKV-001 (option C).
- **Antigravity** does the heavy work: evidence collection and test runs. It **does not score**.
- **ChatGPT** judges ✓/✗ from the judge packet (separate request: `GEM-SKV-003`, prepared after round 1).
- **Claude Lead** reviews a sample. **Ahmed** reviews FAILs, Arabic and the final sheet.

How to run:
1. Open Antigravity on `G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS`.
2. Paste everything between the lines, replacing `ROUND = 1` with the round number you are running.
3. One round per paste. When it finishes, tell Claude.

---
ROLE: EXTERNAL TOOL — skill-validation evidence + test runs for ONE round. No scoring.
You are NOT a TSST agent. Do not claim TSST roles, teams, agents, skills or tiers. Do not run the TSST boot. Do not create bus tasks. Do not commit. Do not do any web search.
WRITE: only inside `TSST/skills/validation/`.
DO NOT: edit, move or delete any other file. In particular, never touch SKILL.md files, index.yaml, status fields, REAL_MEMORY, .git, the bus or brand folders.
Your output is INPUT for an independent judge and the TSST Lead.

ROUND = 1

## Read
1. `TSST/skills/VALIDATION_PLAN.md`: section 3 (rounds) and section 6 (Round 1 list), plus the end section "Owner decisions".
2. `TSST/skills/validation_tracker.csv`. Use the rows where `round == ROUND` (columns: id, priority, method, existing_evidence).
3. For each skill, its SKILL.md. The path is in `TSST/skills/index.yaml`.

## Step 0 (round 1 only): write `TSST/skills/validation/check_locators.py`
- Input: a judge-packet .md file.
- For every `LOCATOR: <path>#L<start>-L<end>` line followed by an `EXCERPT:` block, check that the file exists and that the excerpt text appears in those lines. Ignore whitespace differences.
- Output: a table with OK or MISSING for each locator, and exit code 1 if anything is MISSING.
- Python standard library only.

## For each skill in this round
1. **Checklist.** Turn the skill's acceptance or validation criteria into **3–5 binary checks** (PASS/FAIL questions that a reader can answer from the output alone). Copy the wording from the SKILL.md. Do not invent new requirements.
2. **Evidence.** What counts as evidence depends on the skill's priority:
   - **P0:** run **5 fresh positive tests**. Write 5 realistic task prompts for the skill (Egyptian/Arabic context where relevant), follow the SKILL.md yourself, and save each raw output unedited. Code skills: run the real tests the tracker names and paste their real output.
   - **P1/P2:** find **1 real past job** in `existing_evidence`. Use the **RAW agent output, not the human-edited final.** Look for the earliest version in the job folder (drafts, round-1 files, `_v0`/`_draft`, review notes), or the first git version (`git log --follow`, `git show <first-commit>:<path>` are allowed read-only). If only a human-edited final exists, use it, but mark it `EDITED_FINAL`.
3. **Negative tests.** Write **2 near-miss prompts**: similar words, but a different job. For each, state whether this skill's trigger/description would wrongly fire (YES/NO) and which skill should own the prompt instead.
4. **Arabic flag.** If the output contains Arabic or Egyptian text, mark it `ARABIC_HUMAN_REVIEW`. The judge only checks structure; Ahmed judges dialect and tone.
5. **No evidence found:** write `BLOCKED — <reason>` and move on to the next skill. Never invent evidence. Motion skills: `BLOCKED — needs pilot job`.

## Outputs (in `TSST/skills/validation/round-ROUND/`)
- `JUDGE_PACKET.md`: **this is what the judge reads.** It must be self-contained, with no need to open other files. For each skill:
  - id + one-line purpose;
  - the 3–5 checks;
  - the evidence, either the fresh outputs inline or a past-job excerpt in the form `LOCATOR: path#Lx-Ly` + `EXCERPT:` (verbatim, ≤ 30 lines each);
  - the 2 negative tests with your YES/NO;
  - flags: `EDITED_FINAL`, `ARABIC_HUMAN_REVIEW`, `BLOCKED`.
  - Do NOT include your opinion of pass or fail.
- `runs/<id>-test-N.md`: each fresh test prompt and its raw output.
- `RUN_LOG.md`: the skills done, the time spent, anything skipped and why.
- Last step: run `python TSST/skills/validation/check_locators.py TSST/skills/validation/round-ROUND/JUDGE_PACKET.md` and `git status --short`. Paste both outputs at the end of RUN_LOG.md. If git status shows any changed file outside `TSST/skills/validation/`, list it clearly as `OUT_OF_SCOPE_EDIT`.

## Done when
- JUDGE_PACKET.md covers every skill of the round.
- check_locators reports all OK, or each MISSING is explained.
- RUN_LOG.md is written.
---
