# Runtime adapter — Claude (Claude Code desktop/CLI)

Entry: root `AGENTS.md` / `CLAUDE.md` → `TSST/context/boot.md`. This file only maps
runtime mechanics; the operating method lives in boot.md.

Bus runtime id: `claude` (lead). Near a usage limit: `release` open claims with a resume
note and `limit claude --until <UTC>` (`TSST/context/bus.md`).

## Tier → model (runtime configuration, not TSST truth)
| tier | Claude Code mechanism |
|---|---|
| FAST | `tsst-fast-worker` / `Explore` subagents (Haiku) — `.claude/agents/` |
| WORK | `tsst-execution-worker` (Sonnet) |
| CODE | `tsst-code-worker` (Sonnet, higher effort) |
| DEEP | main conversation (current Opus) — architecture, conflict, acceptance only |
| IMAGE / VIDEO | not native — route to a runtime/tool that has them; never fake |

- `.claude/settings.json` `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is a fallback only.
- Do not pass ad-hoc model overrides to TSST workers. Verify with `/tasks`.
- Workers return compressed evidence packets; subagent turn limits are short, so give
  bounded tasks and ask for the report before the limit.

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
