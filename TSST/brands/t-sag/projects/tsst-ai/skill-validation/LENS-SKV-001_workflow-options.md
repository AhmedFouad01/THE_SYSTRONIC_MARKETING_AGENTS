# LENS-SKV-001 · Skill validation workflow options (2026-10-11)
From LENS_AG to Lead. Basis: repo files and the facts in the brief only; no web research (that is GEM-SKV-002). Skills: LENS-SK-001 (decision, bounded questions, evidence need), LENS-SK-002 (claims in this memo are repo-grounded; scores are my judgement, not measured), CTX-SK-018 (independent scorer, trigger-negative, no self-scoring).

## 1. Options
- **A. Antigravity does all** (GEM-SKV-001 as written): builds dossiers, runs tests, scores, builds RESULTS.html in one 12-round run.
- **B. Three steps across tools**: ChatGPT writes test sheet (Drive read) > Antigravity executes > ChatGPT scores > Claude samples > Ahmed.
- **C. Evidence / verify / judge split (new)**: Antigravity only collects evidence per round (no scores); a free script checks every locator; ChatGPT, blind to Antigravity's view, scores from the dossiers; Claude reviews only a sample plus every proposed VALIDATED and every disagreement; Ahmed approves.
- **D. Claude Lead does it all** (baseline from the plan): best context, but costs 7-10 Pro windows and the Lead would score jobs it dispatched.

Why not B as stated: the test sheet is mostly already written (tracker columns method/evidence_needed + SK-018 steps), so ChatGPT's first step adds a paste for little value; its Drive read of 120 skills is the shallowest link. C keeps B's useful part (a second model scores) and drops that step.

## 2. Weighted scores (1 = bad, 5 = good; my judgement)
| Criterion | Wt | A | B | C | D |
|---|---|---|---|---|---|
| Result quality: independence, evidence reliability, Arabic/taste coverage | 35 | 2 (one tool builds and scores; fabrication and scope-drift history GEM-SV-001/003; no Arabic ear) | 3 (second scorer, but sheet and pasted text are shallow) | 4 (evidence builder differs from scorer; locators machine-checked; Arabic/taste routed to Ahmed) | 3 (strong judge, but scores work Claude produced; plan forbids it) |
| Claude tokens | 20 | 4 | 4 | 4 (sample ~15-20%) | 1 |
| Codex tokens | 10 | 5 | 5 | 5 (script is tiny; Antigravity can write it) | 5 |
| Ahmed manual effort per round | 15 | 5 (one paste) | 2 (3-4 pastes/round) | 3 (1 paste to ChatGPT, 1 back) | 5 |
| Speed | 10 | 3 (one huge run, stalls) | 2 | 3 | 4 |
| Failure risk | 10 | 2 | 3 | 4 | 3 |
| **Weighted /5** | 100 | **3.25** | **3.15** | **3.85** | **3.20** |

Ceiling note: no option covers Arabic/Egyptian ear or taste except Ahmed; every option keeps those to the plan's short list (VILL pages, LENS-011/012/016, CREATIVE-005, round 6/7).

## 3. Recommendation: C
Fits owner decisions: P1 real job for VALIDATED, P2 scorer is not the producer, P3 Ahmed reviews everything last.

### Per-round flow (12 rounds, 13 stays BLOCKED)
1. Lead/Ahmed: go for round N (R16). Ahmed pastes the round-N prompt into Antigravity (ROLE B, repo folder).
2. Antigravity writes `TSST/skills/validation/round-NN/<id>.md` (evidence only: criteria with pass/fail/no-evidence, locator + 1-2 verbatim lines, trigger-negative candidate, evidence type real/fixture/none) and `round-NN/evidence.csv`. DEV: command, exit code, last 20 lines. No scores, no status. Stops after the round.
3. Script `check_locators.py` (read-only; Antigravity writes it once in round 1, Lead reads it): every cited path exists, quoted line appears there, no file outside `TSST/skills/validation/` changed (git status). Output `round-NN/CHECK.md`. Failing dossiers return to step 2.
4. ChatGPT (new chat, ROLE B block, Drive read of `round-NN/` dossiers and the skill files only; NOT evidence.csv notes): scores 0-5 per skill against the SK-018 criteria, verdict, proposed status per P1/P2, one line reason, flags trigger-negative failures. Ahmed pastes reply to `round-NN/JUDGE_out.md`.
5. Claude (cheap session): reads only `round-NN/CHECK.md` + JUDGE_out + a sample: all proposed VALIDATED, all high-risk, all disagreements with evidence, plus ~15% random. Writes `round-NN/REVIEW.md` (<= 25 lines).
6. After round 12: script merges to `results.csv`; RESULTS.html built from it (Antigravity or Codex, small). Ahmed reviews all results; Lead records status changes only then.

### Change GEM-SKV-001
- Run one round per paste; end with "stop, update PROGRESS.md".
- Delete scoring, verdict, proposed_status and RESULTS.html from its job (self-scoring breaks P2 independence); keep `evidence_type` and `evidence_strength` fields.
- Require locator + verbatim excerpt per criterion; "no evidence" is legal, guessing is not.
- No web searches. Trigger-negative: it proposes the case; the judge decides.
- Add: first task = write `check_locators.py`; final report lists any file touched outside the write scope (git status); it must not edit tracker/index.
- DEV: tests only for named suites, paste raw output; Lead (not DEV_AG) reads.
- Keep: ROLE B, write scope, validate_spine 27/29 read-only check, MOTION BLOCKED.

### Wait for GEM-SKV-002 before locking
Judge scale (binary checklist vs 0-5 vs pairwise); one judge vs two on high-risk; sample rate (15% is my guess); cases per skill and whether one real job is enough for statistics; cross-model bias mitigations (blind, order); whether a free harness replaces ChatGPT step; Arabic judge reliability (decides how much goes to Ahmed). Round 1 can proceed as calibration since plan marks it so.

## 4. Top failure risks (C)
1. ChatGPT Drive sync lag/stale reads or role drift ("TSST Lead"); mitigate with ROLE B and checking file names it cites.
2. Antigravity fabricates locators or edits out of scope; the script catches the first, git status the second.
3. Judge leniency/self-preference and Arabic blind spot make PASS inflated; mitigated by Claude sample on VALIDATED items and Ahmed's end review.
