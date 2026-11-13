# Runtime adapter — Claude (Claude Code desktop/CLI)

Entry: `CLAUDE.md` → root `AGENTS.md` → `TSST/core/rules.md`. This file only maps runtime
mechanics; read it when you need model, agent, Drive or Git details.

Bus runtime id: `claude` (lead).
Requests the Lead sends to other tools/runtimes carry a ROLE block: `TSST/context/request-role.md`.
Near a usage limit: `release` open claims with a resume
note and `limit claude --until <UTC>` (`TSST/context/bus.md`).

## Plan and usage (Ahmed's account)
- Claude Ultra since 2026-11-03 (renews 2026-12-03). `get_usage` labels it "Pro": that label is wrong, never repeat it.
  The meter is Ultra: weekly limit only (no 5-hour window), reset Mondays 14:00 Cairo.
- API credits: $200/month once Ahmed links a Console org (claude.ai → Settings → Billing; he clicks, it accepts terms;
  one org, ever). They cover the API, Agent SDK and Managed Agents, not Claude Code; no rollover.
- On the Mac (`~/Work/TSST`) `preflight.py` rejects the root (canonical `C:/Work/TSST`); the Lead runs the same checks
  through `inspect_plan(..., expected_root=ROOT)` and says so.

## Roster → runtime agent (ADR-003/004)
Routing follows root `AGENTS.md`. Agent files are generated from
`TSST/context/roster.yaml` (`gen_runtime_agents.py`); never hand-edit them.

| TSST agent | Claude subagent | default tier |
|---|---|---|
| LENS_AG (MARKETING manager) | `tsst-lens` | WORK (Sonnet · medium) |
| SPARK_AG (MARKETING performance) | `tsst-spark` | WORK (Sonnet) |
| CREATIVE_AG (+DESIGNER) | `tsst-creative` | WORK (Sonnet) |
| MOTION_AG (MOTION manager) | `tsst-motion` | WORK (Sonnet) |
| DEV_AG (BUILD manager) | `tsst-dev` | CODE (Sonnet, high effort) |
| utility reader (R2) | `tsst-reader` / `Explore` | FAST (Haiku) |
| TSST Lead | main conversation (current Opus) | DEEP — Skill Plan, architecture, conflict, acceptance |
| IMAGE / VIDEO | not native — route to a runtime/tool that has them (e.g. `gemini-desktop.md`, manual); never fake | — |

- Dispatch guard: `.claude/settings.json` PreToolUse hook on `Agent|Task` →
  `TSST/context/hooks/agent_dispatch_guard.py` (complete Skill Plan, team/skill validation, skill cap;
  generic/retired agents refused; validation/internal errors fail closed for that dispatch).
  It does not intercept ordinary main-session shell/edit calls; do not claim blanket enforcement.
- New/edited `.claude/agents/*` files are picked up by the running session after a short delay
  (observed 2026-10-05); if a dispatch says "agent type not found", wait or start a new session.
- `.claude/settings.json` `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is a fallback only.
- Do not pass ad-hoc model overrides to TSST agents. Verify with `/tasks`.
- Agents return compressed packets with `Skills used:` and `skill_friction:`; subagent turn
  limits are short, so give bounded tasks.

## Memory access
- `drive:<path>` → local Google Drive for desktop: `G:\My Drive\<path>`.
- `.md` files: readable directly.
- `.gdoc` (Google-native Docs): **not readable** from the filesystem ("Invalid request
  code"), and the attached Google Drive connector currently exposes only
  share/trash/update (no read). State = `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME`
  (not unavailable): use the repo-native export beside the `.gdoc` if its
  `EXPORTS.yaml` row exists; otherwise issue a `source-read` bus task
  (`TSST/context/bus.md`) and pause only the dependent step.
- Never trash/share/move Drive files as part of memory recovery.

## Git
Working tree `C:\Work\TSST` (own `.git`). `TSST/brands` is a junction to `G:\My Drive\TSST-Clients`
(client work, not in git; media stays on Drive). Never put a `.git` inside Drive.
Fresh clones on Windows: `git clone -c core.longpaths=true …`
