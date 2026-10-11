# Ground truth (computed by DEV_AG with own tools; 2026-10-06)

## T1 - real top-level folders under TSST/ (folders only)

Count: 19

| path | purpose (ground truth, approximate) |
|---|---|
| TSST/CREATIVE/ | CREATIVE_AG agent contract + production standards/briefs |
| TSST/DEV/ | DEV_AG agent contract, skill registry, 16 dev skills |
| TSST/LEAD/ | TSST Lead agent contract, onboarding, lead skills |
| TSST/LENS/ | LENS_AG agent + evaluations + skills (research/insight) |
| TSST/PILOTS/ | Pilot projects (PILOT-001 ANVIL switch, PILOT-002 VILL strategy baseline) |
| TSST/SPARK/ | SPARK_AG agent + evaluations + skills (strategy/ideation) |
| TSST/audits/ | Operations/roster audit reports |
| TSST/brands/ | Per-brand memory/projects/assets (anvil, vill-studio, t-sag, akyro-studio, yakebda-ms, _template) |
| TSST/bus/ | Multi-runtime task bus: bus.py, log.tsv, closed tasks, outputs |
| TSST/context/ | Boot/bridge/bus docs, adapters, hooks, tests, agent contract |
| TSST/context_os/ | C7 Context OS installation records/manifests |
| TSST/core/ | Global rules, lessons, portfolio, sessions, brand-assets |
| TSST/decisions/ | ADRs (TSST-ADR-001..004) |
| TSST/handoffs/ | Handoff template |
| TSST/migration/ | Preservation manifest and preview images from migration |
| TSST/onboarding/ | Onboarding intake and records |
| TSST/projects/ | Projects README (cross-brand project index) |
| TSST/skills/ | Skill index (index.yaml), build_index.py, core/marketing skill files |
| TSST/teams/ | Team maps (build, marketing, studio) |

## T2 - real locations (grep, 1-based lines)

- `TSST/context/hooks/agent_dispatch_guard.py` (99 lines) - the guard implementation (PreToolUse hook).
- `.claude/settings.json` line(s): 12: "command": "python \"$CLAUDE_PROJECT_DIR/TSST/context/hooks/agent_dispatch_guard.py\"" - wires the hook.
- `TSST/core/rules.md` - defines R1-R10 (lines 23-43) and R11-R14 (lines 45-57):
    - 24: - **R1 Fixed roster, every runtime.** Deliverables come only from LENS_AG, SPARK_AG, CREATIVE_AG, DEV_AG
    - 27: - **R2 Utility readers.** `tsst-reader` (Claude: also `Explore`) only read, inventory, classify;
    - 29: - **R3 Skill Plan first.** No dispatch without `TEAM / AGENT / SKILLS / NOT_SELECTED / TIER /
    - 32: - **R4 ≤3 skills** per dispatch unless the plan names and justifies more.
    - 33: - **R5 Index only.** Find skills through `TSST/skills/index.yaml` (team slice). Never load a
    - 35: - **R6 Lead judges, team executes.** Lead skills (TSST-LEAD-*) are for decision and review;
    - 37: - **R7 Gap → intake.** No matching skill = `SKILL_GAP` → `TSST-CTX-SK-023`. Never fill a gap
    - 39: - **R8 External skills** = security review → user approval → `UNVALIDATED`. File existence is
    - 41: - **R9 Evolution.** Skills change by version + changelog line; agents report `skill_friction`;
    - 43: - **R10 Evidence.** Every deliverable lists `Skills used:`; the Lead rejects work without it.
    - 48: - **R11 One-pass batches.** Size each dispatch so the agent finishes and verifies in one run
    - 51: - **R12 Resume, don't restart.** An unfinished agent is continued (SendMessage / same agent
    - 53: - **R13 Phase-bounded sessions.** Close the Lead session at each phase end with a short
    - 55: - **R14 Cheapest reader first.** Exploration, inventory and evidence gathering go to
- Supporting/mentions: `TSST/context/adapters/claude.md` line 24; `TSST/decisions/TSST-ADR-003.md` line 42; tests `TSST/context/tests/test_skill_index_and_guard.py`, `TSST/context/tests/test_runtime_agents.py`; `TSST/skills/README.md`; `TSST/audits/TSST_CORE_ROSTER_SKILLS_2026-10-05.md`.

## T4 - real counts for TSST/bus/log.tsv

- total rows: 109 (all 5 columns, no header row)
- by event (first word of col 4): {'new': 22, 'claim': 21, 'done': 19, 'close': 13, 'progress': 12, 'cancel': 8, 'verify': 7, 'reopen': 4, 'block': 2, 'limit': 1}
- by runtime: {'claude': 55, 'codex': 38, 'gemini': 16}
- distinct task ids (excluding '-'): 22; last event per task: {'cancel': 8, 'close': 13, 'done': 1}
- tasks whose last event is not close/cancel: ['C7-VILL-12']
- anomaly rows (block/limit/reopen):
    - line 7: PROBE-001 | gemini | block | Cannot read local .gdoc stubs: OS Errno 22 / Incorrect function without Drive API extension.
    - line 18: BR-003 | codex | block | 63 rows valid; spine 27/28: basename-only source.md collision. Can lead fix isolation() and reopen? 
    - line 19: BR-003 | claude | reopen | isolation() fixed (source.md: hash-only). Re-run validate_spine; if 28/28 mark done with the same re
    - line 36: COLD-GEMINI | claude | reopen | rejected: out file is COLD-CODEX.md copied (identical lines, 1 min). Re-run A-D yourself; never read
    - line 57: C7-VILL-02 | claude | reopen | keep the 8 findings; ADD a 6-row table: each FACT in v0.1 | cited source | verified / not found / di
    - line 81: C7-VILL-07 | claude | reopen | hex+contrast correct; fix 5 items in LEAD_NOTES_v0.3.md (VI p05 Raleway/grid, colour roles, logo whi
    - line 109: - | claude | limit codex | limited 2099-12-31T23:59Z

## T5 - real VILL files

- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/ACCEPTANCE.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_LOOK_DIRECTION_v0.1.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_LOOK_DIRECTION_v0.2.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_LOOK_DIRECTION_v0.3.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_LOOK_v1.0.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_LOOK_v1.1.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRIEF.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRIEF_C7-VILL-11.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRIEF_C7-VILL-12.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/LEAD_NOTES_v0.3.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/LEAD_REVIEW_C7-VILL-11.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/LEAD_REVIEW_C7-VILL-12.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/OPEN_DATA_REQUESTS.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/REVIEW_BRAND_LOOK_v0.1.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/REVIEW_STRATEGY_v0.1.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/REVIEW_STUDIO_C7-VILL-11.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/REVIEW_TEAM_2026-10-05.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/STRATEGY_BASELINE_v0.1.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/STRATEGY_BASELINE_v0.2.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/VERBAL_IDENTITY_v1.0.md
- TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/VILL_CHANGE_SET.md
- TSST/brands/vill-studio/assets/final/Logo.png
- TSST/brands/vill-studio/assets/final/Logo.psd
- TSST/brands/vill-studio/assets/final/palette-v1.1.json
- Latest by version: BRAND_GUIDELINES_v1.0.md; VERBAL_IDENTITY_v1.0.md; BRAND_LOOK_v1.1.md (newer than v1.0 and BRAND_LOOK_DIRECTION_v0.1-0.3); STRATEGY_BASELINE_v0.2.md; BRIEF_C7-VILL-12.md + LEAD_REVIEW_C7-VILL-12.md (newest C7-VILL); logo: TSST/brands/vill-studio/assets/final/Logo.png (+Logo.psd, palette-v1.1.json).
