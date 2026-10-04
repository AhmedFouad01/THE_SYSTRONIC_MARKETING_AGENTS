# TSST Claude Runtime Model Router v0.1

Status: C7 controlled runtime integration.

## Actual runtime design

- Main Claude Code conversation: TSST Lead / EXECUTIVE context. The user may keep Opus selected.
- `Explore`: Haiku, read-only, codebase search.
- `tsst-fast-worker`: Haiku, read-only low-risk extraction/classification.
- `tsst-execution-worker`: Sonnet, normal execution.
- `tsst-code-worker`: Sonnet with higher effort, code-heavy execution/audits.
- Unspecified/general-purpose subagents default to Sonnet through `.claude/settings.json`.

This is real subagent model binding, not only a conceptual tier label. Claude Code supports per-subagent `model:` frontmatter and resolves it before the default subagent model.

## Cost behavior

The main Opus conversation still consumes Opus usage for orchestration turns. Savings come from moving high-volume reads, tests, code exploration, and implementation into Haiku/Sonnet isolated contexts. This is not equivalent to switching the visible main-session model mid-turn.

For maximum economy later, the main session can be changed to Sonnet and an Opus-only executive subagent can be introduced, but that is a separate operating decision because the user originally selected Opus as TSST Lead.

## Verification

After the first creation of `.claude/agents/`, restart the Claude Code session because Claude Code may not discover a newly-created agents directory mid-session. Then run a delegated task and inspect `/tasks`; it reports the actual subagent model.
