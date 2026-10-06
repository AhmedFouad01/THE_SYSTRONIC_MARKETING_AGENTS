# Runtime adapter — Claude (Claude Code desktop/CLI)

Entry: root `AGENTS.md` / `CLAUDE.md` → `TSST/context/boot.md`. This file only maps
runtime mechanics; the operating method lives in boot.md.

Bus runtime id: `claude` (lead). Near a usage limit: `release` open claims with a resume
note and `limit claude --until <UTC>` (`TSST/context/bus.md`).

## Plan: Claude Pro — roster → runtime agent (ADR-003/004)
Routing follows `AGENTS.md#universal-task-routing`. Agent files are generated from
`TSST/context/roster.yaml` (`gen_runtime_agents.py`); never hand-edit them.

| TSST agent | Claude subagent | default tier |
|---|---|---|
| LENS_AG (MARKETING manager) | `tsst-lens` | WORK (Sonnet · medium) |
| SPARK_AG (MARKETING performance) | `tsst-spark` | WORK (Sonnet) |
| CREATIVE_AG (+DESIGNER/MOTION) | `tsst-creative` | WORK (Sonnet) |
| DEV_AG (BUILD manager) | `tsst-dev` | CODE (Sonnet, high effort) |
| utility reader (R2) | `tsst-reader` / `Explore` | FAST (Haiku) |
| TSST Lead | main conversation (current Opus) | DEEP — Skill Plan, architecture, conflict, acceptance |
| IMAGE / VIDEO | not native — route to a runtime/tool that has them (e.g. `gemini-desktop.md`, manual); never fake | — |

- Dispatch guard: `.claude/settings.json` PreToolUse hook on `Agent` →
  `TSST/context/hooks/agent_dispatch_guard.py` (team agents need `TEAM:` + indexed `SKILLS:`;
  generic/retired agents refused; fails open on internal error).
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
Working tree in Drive; gitdir external `C:\GitMetadata\THE_SYSTRONIC_MARKETING_AGENTS.git`.
Never recreate `.git` in Drive; `desktop.ini` stays ignored.
Fresh clones on Windows: `git clone -c core.longpaths=true …`
