# TSST Skill Validation Plan (PLAN ONLY, 2026-10-11)

Author: DEV_AG for TSST Lead. Status: proposal for owner approval. No evaluation has been run and no skill status changed. Tracker: `TSST/skills/validation_tracker.csv` (one row per skill, 120 rows).
Sources: CTX-SK-018, `TEAM_CONSTITUTION.md` (skill lifecycle), `EVALUATION_SCORECARD.md`, `EVALUATION_INDEX.md`, `core/rules.md` R9-R14, `core/friction-log.md`, `bus/` (closed + tasks), `skills/index.yaml`.
Items marked **(proposed)** are not in the repo today and need owner approval.

## 1. Status ladder

Today (index.yaml, 120 active skills; 11 backlog skills excluded): 1 `VALIDATED` (CREATIVE-SK-001), 2 `LAB_VALIDATED` (CREATIVE-SK-002, -008), 117 `UNVALIDATED`. Work = 119 skills (117 plus 2 upgrades).

| Step | State (source) | Entry criteria (source) |
| --- | --- | --- |
| 0 | `UNVALIDATED` (Constitution) | Default. Package exists; file existence is never validation (SK-018 guardrail). |
| 1 | Evaluation record `QUEUED` (EVALUATION_INDEX) | Record exists with fixture; record state only, not a skill status. |
| 2 | Run `PASS/PARTIAL/BLOCKED/FAIL` (SK-018 return) | SK-018 steps 1-5 done: trigger-positive and trigger-negative fixtures, expected outputs and critical failures, practical run, scored on correctness, scope, evidence, cost, run artifacts preserved. |
| 3 | `LAB_VALIDATED` (Constitution) | Bounded synthetic/lab evaluation passed; fixture and validation ceiling preserved. Precedent: EV-002 94, EV-011 88. |
| 4 | `VALIDATED` (Constitution + Scorecard) | Total >= 85/100, every category at its minimum, no critical failure; Lead records score, evidence, reviewer, date, artifact path. Precedent: EV-001 95. |
| - | `REVALIDATION_REQUIRED` / `DEPRECATED` | Material source/platform/policy/method change; Lead records replacement or reason. |

Rules already in force: only authorized Lead/governance promotes (SK-018 step 6); a result applies only to the tested skill version, and a material edit returns the skill to `UNVALIDATED` unless Lead documents why it is non-material (Constitution); promotion needs SK-018 evidence (R9); a failed run is remediated and re-run, not edited away (precedent EV-008: 82 FAIL then 88 PASS, append-only).

SK-018 and the Constitution are silent on the points below. **(proposed)**:
- P1. Real-job evidence (a real deliverable, Lead-scored) counts toward `VALIDATED`; fixture-only or synthetic evidence caps at `LAB_VALIDATED`. This matches EV-001 vs EV-002 but is not written anywhere.
- P2. One passing evidence item suffices for low/medium-risk skills; high-risk skills (see section 3) need two independent items before `VALIDATED`.
- P3. Retro-scoring of past real jobs is allowed: the evidence dossier is locked, a trigger-negative fixture is added, and the scorer is not the producer. The scope actually tested is written on the record as the ceiling.
- P4. A scored result of 70-84 or any category below minimum = `PARTIAL`: stays `UNVALIDATED` with a remediation list and a retest ID (EV-008 pattern).
- P5. Tracker-only stages: QUEUED > DOSSIER_READY > RUN_DONE > SCORED > RECOMMENDED > PROMOTED. They live in the CSV, not as skill statuses.

## 2. Methods by skill type

Every method includes a trigger-negative fixture (SK-018 step 1) and is scored with the existing 100-point scorecard. Evidence is reused before anything is re-run.

| Type | Skills | Method | Pass looks like |
| --- | --- | --- | --- |
| Craft / production | CREATIVE (except 001), MOTION 001-007, LENS-011/012/013/016 | One real deliverable made with the skill, plus Lead QA (render inspection per CREATIVE-SK-010 for visuals; per-page/per-frame). Owner judges taste and Arabic ear. | Scorecard >= 85, no critical failure, Lead + Ahmed sign-off on the artifact. |
| Research / strategy | LENS-001-006, 014, 015; SPARK-001-006 | Fixed fixture question plus source checks: Lead re-fetches a sample of cited sources, checks grades, freshness date and the fact/assumption/hypothesis split. Platform skills use official pages only. | No fabricated or unsupported claim; sample claims reproduce. |
| Code | DEV-001-016 | A scoped task on CRM_APP or a fixture repo plus real test output (command and result), run by Codex or the Lead, never self-scored by DEV_AG. Negative fixture: a seeded defect the skill must catch. | Tests green, seeded defect caught, report matches the output. |
| Lead / core | LEAD-001-030, CTX-001-023 | Scenario replay: take a real past case (bus task, pilot decision, handoff), run the skill, compare with the recorded outcome; check the guardrail on a scenario where the skill must refuse or defer. | Same or better decision, boundary respected, no critical failure. |

Reuse map (details per skill in the tracker):
- VILL C7-VILL-11/12 (guidelines v1.0, Lead reviews, 24-page QA): CREATIVE-002, -005, -008, -010.
- ANVIL PILOT-001 (reveal stills, v2 composites, AE text scenes, roll-up spec): CREATIVE-009, -011, -012, -013, -014, -019, LENS-016.
- CRM (CRM_APP tests, CRM_UI_HANDOFF, CRM_BLUEPRINT, 50 closed DEV bus tasks, house theme, wireframes): DEV-001-016, CREATIVE-003, -006, -020-028, SPARK-002/003, LENS-004.
- Motion research 2026-10-10 (LENS-MO-001, SPARK-MO-001, GEM-MO-001): LENS-001/002/003, SPARK-001/004/006. MOTION-001-007 have no job yet; they wait for the pilot 15 s teaser.
- Gaps (no evidence found, need fresh fixtures): CREATIVE-029/030, LENS-014/015, SPARK-005, MOTION-001-007, most LEAD and CTX skills (CTX use is implicit in every task but never scored).

Version caveat: friction items were recorded against current text (CREATIVE-005: 5, CREATIVE-014: 4, LENS-002/CREATIVE-006/-010/-020: 3 each). If a friction fix is material, the old job evidence no longer covers the new version. Rule for each round: Lead marks every fix material or non-material before the run; material fixes need a fresh mini-fixture on top of the reused evidence.

## 3. Priority order and rounds

Priority (computed in the tracker): P0 = used in >= 10 bus tasks, or >= 3 friction items, or high risk with any use or friction; P1 = used or friction >= 1, or medium risk, or core spine; P2 = no use located. High-risk skills: DEV 005-009/011/013/015, CTX-005/006/012/013/014/023, SPARK 001-006, LEAD-010, CREATIVE-010, LENS-002. Counts today: P0 18, P1 33, P2 68, DONE 1.

Usage evidence: DEV-005/011 = 50 bus tasks each, DEV-015 = 46, everything else <= 4. Friction log: CREATIVE-005 (5), -014 (4), LENS-002 / CREATIVE-006 / -010 / -020 (3 each). Round order also follows existing dependency order (LENS-001 before -002; SPARK-002 before 001/004/006).

| Rnd | Skills (n) | Focus | Executor (Claude tokens saved) | Claude load* | Ahmed |
| --- | --- | --- | --- | --- | --- |
| 1 | 8 | Reuse-only seed: C7-VILL + motion research + DEV top usage | Claude reader builds dossiers; Lead scores | M | 30 min taste/Arabic on VILL pages |
| 2 | 9 | DEV-001-007, 013, 016 (CRM) | **Codex** runs tests; Lead scores packet | S | none |
| 3 | 9 | Core spine: CTX-001, 002, 005, 006, 008, 009, 016, 017, 023 | **Codex** replays; Lead judges | S-M | approve scenarios |
| 4 | 10 | LENS-003-006, SPARK-001-006 (platform specs) | **Gemini** fixtures and source checks; Lead samples 5 sources each | M | none |
| 5 | 9 | CREATIVE-003, 004, 006, 009, 011-014, 019 (ANVIL, theme) | Claude tsst-creative | L | taste review |
| 6 | 9 | CREATIVE-020-028 (CRM UX, RTL) | Claude tsst-creative | L | taste + Arabic ear |
| 7 | 9 | CREATIVE-029-031, LENS-011-016 (copy, content, lifecycle) | Gemini drafts, Claude Arabic pass | M | **Arabic ear** (LENS-012, -011, -016) |
| 8 | 9 | DEV-008, 009, 010, 012, 014; CTX-003, 004, 007, 011 | **Codex** | S | none |
| 9-11 | 10 each | LEAD-001-030 (decision memos, review literacy) | **Gemini** independent run; Lead scores; spot-check 20% by Ahmed | M each | business-judgment spot-check |
| 12 | 10 | Remaining CTX (010, 012-015, 018-022); CTX-018 last (meta) | **Codex** | S | none |
| 13 | 7 | MOTION-001-007, gated on the pilot teaser job | Claude tsst-motion | L | taste + Egyptian ear |

*Load legend (assumption, not measured): S under 1/3 of a Claude Pro 5-hour window, M about 1 window, L 1.5-2 windows. Round 1 doubles as calibration; re-estimate after it.

Codex/Gemini candidates: rounds 2, 3, 4, 8, 9-11, 12 (7 of 13) run outside Claude; Claude is limited to scoring compact packets. This follows R14 (cheapest reader first) and R11 (one-pass batches: one dossier per round, explicit file list and test command).

## 4. Cost, time and owner involvement

Rough, unmeasured (no prior validation run to calibrate; the CRM audit in rules.md shows cost comes from re-read context, hence dossiers and one-pass batches):
- Total Claude: about 7-10 Pro windows across 13 rounds, i.e. roughly 2 weeks at one round per day or two. Codex/Gemini rounds cost the other tools' quota, not Claude's.
- Per skill: reuse-only dossier scoring about 20-40k Claude output-light tokens; fresh fixture about 100-250k.
- Calendar: one round per 1-2 days; session closed at each round end with a checkpoint (R13). One track at a time (owner rule).

Ahmed approves: this plan and proposed rules P1-P5; each round's go/cost (R16); fixtures for rounds 3 and 9-11. Ahmed judges himself: visual taste (rounds 1, 5, 6, 13), Arabic/Egyptian ear (rounds 1 partly, 6, 7, 13), business judgment spot-checks on LEAD skills, and final sign-off for every P0/high-risk promotion. Lead never promotes a skill it produced or dispatched without independent scoring.

## 5. Re-review

Triggers (each sets `REVALIDATION_REQUIRED` for the affected skill; Lead decides material vs non-material):
1. Friction repeat: `python TSST/context/friction_check.py` flags a skill with a second matching friction item after validation.
2. Skill text change: any change to workflow, guardrail or output contract (Constitution); version bump + changelog (R9).
3. Tool/platform/policy change: Meta/Google/TikTok specs or policy, model/video tool versions, API versions (DEV-005), Drive/runtime limits. **Cadence (proposed):** 90 days for platform- or tool-dependent skills (SPARK, MOTION, CREATIVE-014, LENS-002/003, DEV-005/013); 180 days for the rest; none for pure method skills until a trigger fires.
4. A critical failure in a real job that used the skill (record as FAIL on the existing record, append-only).

Reviewer: Lead scores and recommends (SK-018 step 6); owner signs off on taste/Arabic skills, all P0/high-risk promotions and every downgrade. Re-review is a cheap re-run of the original fixture plus the new case, not a full programme.

## 6. Round 1 proposal (8 skills)

Reason: each reuses closed work, covers all four methods except lead/core, and calibrates cost. Phase-1 records already reserved in EVALUATION_INDEX are used where they exist (EV-005 for CREATIVE-005, LENS-EV-001/002).

| Skill | Method | Reused evidence | Extra work | Judge |
| --- | --- | --- | --- | --- |
| CREATIVE-SK-002 (upgrade LAB > VALIDATED) | Real job + Lead QA | C7-VILL-12 guidelines v1.0 (final accepted round, not the round-1 draft the Lead rejected as not client-ready), EV-002 record | Another agent uses the guideline cold on a new page (usability); trigger-negative fixture | Lead + Ahmed |
| CREATIVE-SK-008 (upgrade LAB > VALIDATED) | Real job + Lead QA | C7-VILL-12 look direction (BRAND_LOOK v1.0/1.1), EV-008/EV-011 | Distinctiveness check against the recorded failure mode of run 01 | Lead + Ahmed taste |
| CREATIVE-SK-005 | Real job + Lead QA | C7-VILL-12 type system, delivery system v1 bilingual | Mark the 5 friction fixes material or not; font_metrics gap for Plex Arabic noted as ceiling | Lead + Ahmed Arabic ear |
| CREATIVE-SK-010 | Real job + Lead QA | C7-VILL-12 24-page render QA, C7-VILL-11 REVIEW_STUDIO, ANVIL reveal QA | Seeded-defect page the skill must catch (negative fixture) | Lead |
| LENS-SK-001 | Fixture + source check | LENS-MO-001 question plan, VB-1/VB-2 | Trigger-negative fixture (task that should not trigger it) | Lead |
| LENS-SK-002 | Fixture + source check | LENS-MO-001 claim grading, CRM competitor study | Lead re-fetches >= 5 graded claims; JS-rendered pages recorded as ceiling (3 friction items) | Lead |
| DEV-SK-011 | Task + tests | CRM_APP test suites, 50 closed bus tasks | Codex re-runs the suite (real output); seeded regression must be caught; Lead samples 5 bus tasks | Codex + Lead (not DEV_AG) |
| DEV-SK-015 | Task + tests | 46 closed bus tasks with verification output | Sample 5 for claim-vs-output match; seeded false "done" claim must be rejected | Codex + Lead |

Round 1 expected: dossiers by `tsst-reader` (FAST), one Codex run, Lead scoring in one session; M load, 1-2 days.

## 7. Open governance questions for the owner

1. Approve proposed rules P1-P5 (real-job evidence = VALIDATED, lab = LAB_VALIDATED; one vs two evidence items; retro-scoring; PARTIAL band; tracker-only stages).
2. Who promotes: Lead alone for P1/P2, owner sign-off for P0/high-risk? Skills the Lead itself uses (LEAD, CTX): owner spot-check 20% (proposed).
3. Executor independence: is a Codex or Gemini run scored by Lead acceptable as the "practical evaluation"?
4. Cadence: 90 days platform/tool skills, 180 days others, or event-only?
5. Does validating skills move team readiness? Under the Scorecard `PILOT_READY` still needs the 18 Phase-1 evaluations (covered by rounds 1, 4, 5) plus a Lead-approved pilot scope; this plan does not change `NOT_READY`.

---
## Owner decisions 2026-10-11
- P1 VALIDATED needs a real job; fixtures cap at LAB_VALIDATED; high-risk skills need 2 evidence items — APPROVED.
- P2 retro-scoring of past jobs (locked dossier, scorer != producer, trigger-negative fixture) — APPROVED.
- P3 promotion: Lead scores; **Ahmed reviews ALL results at the end before any status change** (replaces the proposed split).
- Round 1: ON HOLD until Ahmed reviews the plan.

## Method v1 (owner 2026-10-11, from GEM-SKV-002 + LENS-SKV-001)
- Binary 3-5 checks per skill (no 0-5 scale). Cross-model: Antigravity runs, ChatGPT judges, Claude samples.
- P0: 5 fresh positive tests + 2 near-miss negatives. P1/P2: 1 RAW past-job output (not human-edited final) + 2 negatives.
- Arabic/Egyptian dialect + tone = Ahmed only; LLM judge checks structure.
- Ahmed reviews all FAILs + all Arabic; Claude samples PASSes + disagreements; >2 disagreements on a skill -> full manual review.
- Re-run the same tests after any skill edit (regression).
- Runner: `TSST/archive/research/tsst-ai/gemini/GEM-SKV-001.md` (one round per paste).
