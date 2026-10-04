# TSST C7 — Claude Runtime Model Router Installation

Date: 2026-10-04
Status: INSTALLED / RUNTIME VERIFICATION PENDING SESSION RESTART

## Installed project runtime files

- `.claude/settings.json`
  - `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` as fallback only.
- `.claude/agents/Explore.md`
  - model: `haiku`
  - read-only exploration.
- `.claude/agents/tsst-fast-worker.md`
  - model: `haiku`
  - low-risk extraction/classification/bulk first pass.
- `.claude/agents/tsst-execution-worker.md`
  - model: `sonnet`
  - normal analysis/research/debugging/bounded execution.
- `.claude/agents/tsst-code-worker.md`
  - model: `sonnet`
  - code-heavy execution/audit/remediation/tests.
- Root `AGENTS.md`
  - runtime routing contract appended.

## Routing policy

- FAST -> Haiku worker.
- Codebase exploration -> Haiku Explore.
- EXECUTION -> Sonnet worker.
- CODE -> Sonnet code worker, higher effort.
- EXECUTIVE -> remain in main TSST Lead context (user-selected Opus at current operating choice).

The default subagent model setting is not forced, so explicit agent frontmatter can still select Haiku/Sonnet as designed.

## Installation verification

Raw Drive readback was compared against intended installation bytes:

- root `AGENTS.md`: MATCH
- `.claude/settings.json`: MATCH
- `Explore.md`: MATCH
- `tsst-fast-worker.md`: MATCH
- `tsst-execution-worker.md`: MATCH
- `tsst-code-worker.md`: MATCH

Result: 6/6 MATCH.

## Runtime verification gate

The current Claude Code session may not discover `.claude/agents/` because the directory was created after the session started. Start a fresh Claude Code session for the same repository/branch.

Run a read-only routing smoke test and inspect `/tasks` while workers are running. Expected actual models:

- Explore -> Haiku
- tsst-fast-worker -> Haiku
- tsst-execution-worker -> Sonnet
- tsst-code-worker -> Sonnet

If Claude Code substitutes any requested model because of account/organization availability, `/tasks` is authoritative for the actual runtime model. Do not claim automatic switching passed until the runtime rows are observed.

## Readiness impact

None. This installation does not promote TSST Lead, specialists, DEV_AG, or Context OS skills to PILOT_READY or PRODUCTION_READY. Existing decision rights continue to govern all mutations and external actions.
