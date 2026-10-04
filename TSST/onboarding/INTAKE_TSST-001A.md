# Intake — Gate TSST-001A (Requirements & Governance)

Started 2026-10-05 · protocol `TSST/LEAD/DEEP_ONBOARDING.md` · baseline `TSST/TSST_OPERATING_PROFILE.md` v1.0.
Deferred-by-user items stay deferred; each row: value · source · state.

## Stage 1 — mission and success (2026-10-05, chat)
| field | value | state |
|---|---|---|
| mission (next 3 months) | both in parallel: marketing for brands + building T.SAG products (CRM, TSST) | CONFIRMED |
| success criteria | quality, speed, cost, commercial results — all four selected | CONFIRMED |
| tie-break order | quality → cost → speed | CONFIRMED (stage 2) |
| C7 pilot project | VILL Studio | CONFIRMED |

## Stage 2 — authority and risk (2026-10-05, chat)
Decision rights proposed for the baseline (lead = TSST Lead runtime; effective on baseline freeze; approver = user):
| action | lead may do alone | needs user approval | escalation trigger |
|---|---|---|---|
| git / GitHub | commit, push feature branches, open PRs | merge to `master` | CI red after one fix attempt |
| Real Memory | checkpoints, status, pointers | decisions, brand facts, change sets (RM-CS-*) | conflict between sources |
| bus / model spend | queue FAST/WORK/CODE tasks on their tier models | top-cost models (gpt-6-astra, Opus in Antigravity), image/video generation | task escalated (rounds exceeded) |
| fixed boundaries (unchanged) | — | publish, spend, client contact, deploy, credentials, deleting evidence | always |

## Stage 3 — quality, failure, reporting (2026-10-05, chat)
| field | value | state |
|---|---|---|
| acceptance gate | important work (code, creative, strategy) gets an independent review by a runtime other than the producer; then lead accepts | CONFIRMED |
| failure handling | escalated task → lead reroutes once to another runtime/tier; second failure → user, with a short summary | CONFIRMED |
| reporting | end of each phase: done, files, QA, remaining, decisions — Arabic/English mix, short | CONFIRMED (matches profile v1.0) |

## Stage 4 — tools, KPIs, team (2026-10-05, chat)
| field | value | state |
|---|---|---|
| external tools (Drive, browser, GitHub, Shopify, Apps Script, …) | read/research alone; any write outside the repo (share, trash, product edit, form submit) needs user approval | CONFIRMED |
| KPI review cadence | at the end of each pilot/project; first review at end of C7 (VILL) sets the first numeric baselines | CONFIRMED |
| team composition | Lead + CREATIVE_AG + LENS_AG + SPARK_AG + DEV_AG (approved 2026-09-28); no new agents before C7 | CONFIRMED |

## Coverage of TSST-001A open items
mission/success ✓ · scope per agent ✓ (TEAM_CONSTITUTION) · authority/thresholds ✓ (stage 2) · escalation ✓ (stages 2–3) ·
QC/acceptance ✓ (stage 3) · tool permissions ✓ (stage 4) · handoff contract ✓ (`TSST/context/bus.md`) ·
task-level isolation ✓ (`TSST/context/boot.md`) · output/doc standards ✓ (profile v1.0) · KPIs/cadence ✓ (numbers at C7) ·
additional agents ✓ (none before C7).

## Outcome
User approved 2026-10-05: Operating Baseline v0.1 frozen; TSST-001A CLOSED (TSD-013). Next: C7 pilot on VILL Studio.
