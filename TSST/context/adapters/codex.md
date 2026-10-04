# Runtime adapter — Codex

Entry: root `AGENTS.md` → `TSST/context/boot.md`.

Bus runtime id: `codex`. Run locally on this working tree (a cloud sandbox sees only
pushed commits, not the bus). First bus task is its cold-start probe (`REVIEW-001`).
Near a usage limit: `release` with a resume note, then `limit codex --until <UTC>`.

## Tier → model
Profiles in `~/.codex/config.toml` (default = `work`); source of truth for the mapping is
`TSST/bus/runtimes.yaml#codex.tier_*`:

| tier | profile | model / effort |
|---|---|---|
| FAST | `codex --profile fast` | gpt-6-luna / low |
| WORK | `codex --profile work` (default) | gpt-6.1-sol / medium |
| CODE | `codex --profile code` | gpt-6.1-sol / high |
| DEEP | `codex --profile deep` | gpt-6-astra / high |

Codex can spawn agents on a chosen model: keep the main session on gpt-6.1-sol · medium as
coordinator and run each bus task inside an agent on the task's `open on:` model.
Claim with `--model <the model you run on>`; the bus prints the expected one and warns on
mismatch (`TSST/context/bus.md#model-per-tier`). Temporary Codex task labels/workers are **not** TSST agents
and are never written to durable memory (packet TSST-SYNC-20261002-0129, proposed).

## Memory access
- Filesystem: repo working tree; `drive:` paths only if the Drive folder is mounted.
- `.gdoc` → `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME`: use the repo-native export if its
  `EXPORTS.yaml` row exists, else ask the lead for a `source-read` bus task.
- No push, merge or deploy without user approval.
- Write files with LF line endings (repo files are hashed byte-exact; CRLF rewrites whole files).

Status: UNVALIDATED. Cold-start not yet executed in this runtime.
