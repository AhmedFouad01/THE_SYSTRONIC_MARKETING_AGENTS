# Runtime adapter — Codex

Entry: root `AGENTS.md` (Universal task routing) → `TSST/context/boot.md`.

Request role: every request to Codex states ROLE A (team runtime) or ROLE B (external tool) — `TSST/context/request-role.md`. Codex is ROLE A only for a claimed bus task; ad-hoc use is ROLE B.

Bus runtime id: `codex`. Run locally on this working tree (a cloud sandbox sees only
pushed commits, not the bus). First bus task is its cold-start probe (`REVIEW-001`).
Near a usage limit: `release` with a resume note, then `limit codex --until <UTC>`.

## Plan: ChatGPT Plus — roster → Codex agent (ADR-004)
Routing follows `AGENTS.md#universal-task-routing`. The main Codex session is the **Lead**
(boot, Skill Plan, acceptance) on the default `work` profile. Team work is done only by the
generated custom agents in `.codex/agents/` — each file already pins its model:

| TSST agent | Codex agent | tier | model · effort (`TSST/bus/runtimes.yaml#codex`) |
|---|---|---|---|
| reads/inventory (R2) | `tsst-reader` (read-only sandbox) | FAST | gpt-6-luna · low |
| LENS_AG | `tsst-lens` | WORK | gpt-6.1-sol · medium |
| SPARK_AG | `tsst-spark` | WORK | gpt-6.1-sol · medium |
| CREATIVE_AG | `tsst-creative` | WORK | gpt-6.1-sol · medium |
| DEV_AG | `tsst-dev` | CODE | gpt-6.1-sol · high |
| Lead DEEP-only decision | main session `codex --profile deep` | DEEP | gpt-6-astra · high (few messages per 5 h on Plus — use sparingly, or bus task to the Claude Lead) |

- Model ids come from Codex's own list (`~/.codex/models_cache.json`, `/model`), never from memory.
  If a mapped model disappears (e.g. `gpt-5.5` retires 2026-10-14), use the next tier up, say so,
  and ask the Lead to update `runtimes.yaml` + regenerate agents.
- Skills: Codex preloads `.agents/skills/*` descriptions; only `tsst-router` lives there. TSST
  skills are found through `TSST/skills/index.yaml` (`build_index.py --team/--id`), ≤3 per task.
- Bus: `claim` prints `AGENT:` and `RUN ON:`; claim with `--model <what actually ran>`;
  `done --skills-used` is mandatory. Temporary Codex workers that are not `tsst-*` agents are
  **not** TSST agents and never deliver TSST work (rule R1).
- Fewer prompts for unattended work: `sandbox_mode = "workspace-write"` keeps writes inside the
  workspace; approval settings are the user's choice in `~/.codex/config.toml` (TSST never edits it).

## Memory access
- Filesystem: repo working tree; `drive:` paths only if the Drive folder is mounted.
- `.gdoc` → `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME`: use the repo-native export if its
  `EXPORTS.yaml` row exists, else ask the lead for a `source-read` bus task.
- No push, merge or deploy without user approval.
- Write files with LF line endings (repo files are hashed byte-exact; CRLF rewrites whole files).
- Fresh clones on Windows: `git clone -c core.longpaths=true …`

Status: UNVALIDATED. Cold-start not yet executed in this runtime.
