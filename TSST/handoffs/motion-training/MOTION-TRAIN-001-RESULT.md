# MOTION-TRAIN-001 result — MOTION_AG practice, 15 s cutdown of EX-MO-001

Date 2026-11-05 · plan `MOTION-TRAIN-001-PLAN.json` · runtime: Sonnet, explicit-contract mode (native `tsst-motion` not loaded in this session), 41 tool calls, 0 credits · scorer: Lead (re-ran every check; not the producer).
Evidence (outside the repo): `~/Downloads/Aldoctor market/video/training/motion-ag-15s/` (`BRIEF.md`, `NOTES.md`, `final/`, `work/stills/`, `work/mix/`).
This is practice, not a validation: no skill status changes; Ahmed reviews (owner decision 2026-10-11).

## Verdict: PASS as practice — 16 of 17 binary checks
| Skill | Check | Result |
|---|---|---|
| SK-002 | own 450-frame composition, master left intact | PASS |
| SK-002 | every VO line inside its scene | PASS |
| SK-002 | captions only where the brief said | PASS (the brief was wrong, see Lead errors) |
| SK-002 | hook as the master; end card still for the last 2 s | PASS (max change 0.001) |
| SK-002 | plan timing kept, or the change reported with numbers | PASS (DM-01 2→3 s, wall 2→2.5 s, end card 4.5→3 s, reported) |
| SK-003 | music measured, cut decision written with numbers | PASS (take from 47.10 s, last hit on the end-card button) |
| SK-003 | natural ending, no hard stop | PASS (-29 → -58 dB over 12–13.5 s) |
| SK-003 | mix: VO ≥ 8 dB over music, no clips, no clicks | PASS (+9.1 to +11.1 dB) |
| SK-003 | -14 ±1 LUFS, ≤ -1 dBTP, exact length | PASS (-14.06, -1.48; it fixed the kit's padding bug in its copy) |
| SK-003 | no SFX onset in the hold, tails silent | PASS (silent after 13.4 s) |
| SK-007 | numbers equal the data | PASS (caught a counter showing 10,098 and fixed it) |
| SK-007 | stills rendered, viewed, verdict each | PASS |
| SK-007 | all text inside the safe box | FAIL (legal line ends at x = 942 vs 940; inherited from the master; noted as "touches 940", not measured) |
| SK-007 | Arabic joined, RTL, digits in order | PASS |
| contract | skills opened; used/skipped listed | PASS |
| contract | scope: 0 credits, nothing written outside the job folder | PASS (Lead checked) |
| contract | concrete skill_friction | PASS (9 items, 8 acted on the same day) |

## Lead errors in the brief
- The end-card caption came from a plan table older than the decision to drop it.
- The plan's 2 s scenes were not fit-checked against the recorded cutdown lines before dispatch.

## Written back the same day
SK-002/003/007 → v0.3; kit: `assertFits`, `loudness_fix.py` cut to picture length, README cutdown section and tool notes; 6 rows in `TSST/core/friction-log.md`. Open: per-beat energy and ending positions in `music_analyze.py`.

## Waiting on Ahmed
Accept the re-timed 15 s or re-record two shorter lines; a human listen; the master fixes found by this training (VO line 4 duck, legal line 2 px, end-card caption in cutdowns, Meta bottom 35%).
