# tsst-ai — project manifest

brand: t-sag · team: build (DEV) + lead
Scope: development of the TSST agent operating system itself (Context OS, routing,
adapters, agents, skills). Not the same state scope as the TSST *operating system* that
runs brand work — this project changes it; brand tasks only use it.

| pointer | value |
|---|---|
| spine | `TSST/context/`, `TSST/core/`, `TSST/teams/`, `TSST/brands/` |
| context os | `TSST/context_os/` (v0.6 RC1, 22 UNVALIDATED skills, reference tests C2–C6) |
| governance | `TSST/TEAM_CONSTITUTION.md`, `TSST/TSST_DECISION_RIGHTS.md`, `TSST/READINESS_REPORT.md`, `TSST/decisions/` |
| memory | `TSST/brands/t-sag/memory/source.md` |
| checkpoint | `session-1-checkpoint.md` (this folder) |
| RM proposal | `rm-reconciliation.md` (RM-CS-001, awaiting approval) |

## State
Core consolidation session 1 complete (2026-10-04). TSST overall NOT_READY.
2026-10-05 — TSST-ADR-003 applied: fixed roster `tsst-lens|spark|creative|dev` (+ fast/Explore
readers), central index `TSST/skills/index.yaml` (115 skills), rules R1–R10, dispatch hook live,
intake CTX-SK-023, P1 marketing skills LENS-SK-011…015 (UNVALIDATED). Report:
`TSST/audits/TSST_CORE_ROSTER_SKILLS_2026-10-05.md`. Uncommitted.
2026-10-05 — TSST-ADR-004: one roster for Claude Pro + Codex/ChatGPT Plus (`TSST/context/roster.yaml` →
`gen_runtime_agents.py` → `.claude/agents` + `.codex/agents`), plan-aware tiers in `TSST/bus/runtimes.yaml`,
Gemini/Antigravity retired. Pending: user trusts the G: repo in Codex; first Codex `/agents` check.

2026-10-11 — TSST-ADR-005: new team `motion` / MOTION_AG (`tsst-motion`), skills TSST-MOTION-SK-001..004 (ex CREATIVE-SK-015..018, UNVALIDATED), NOT_READY; CREATIVE no longer owns video/motion; generation manual via Ahmed; v1 spec = Balanced setup, run Budget-first (`motion-ag/LENS-MO-001_*.md`, `SPARK-MO-001_*.md`, Lead-accepted 2026-10-10); commit `d5bb15e`. Real Memory updated 2026-10-11 (CURRENT_STATUS, TSD-022).

## do_not_repeat
Context OS C0–C6 evaluations; runtime router install (C7 record); consolidation
inventory of 2026-10-04 (see checkpoint); 2026-10-05 skill inventory (use the index).

## Next
0. (2026-10-11) MOTION_AG: 6 new motion skills (2 rounds) -> pilot 15 s Egyptian teaser as first job.  
1. Native review of LENS-SK-012 Arabic examples (user). 2. CTX-SK-018 fixtures for LENS-SK-011…015.
3. P2 backlog skills (SPARK-007/008/011, LENS-007) via CTX-SK-023. 4. Commit/PR on user request.
Older items: `session-1-checkpoint.md#session-2`.
