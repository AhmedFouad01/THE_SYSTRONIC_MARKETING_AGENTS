# Runtime adapter — Gemini / Antigravity

Entry: root `AGENTS.md` (auto-loaded) → `TSST/core/rules.md`. This file only maps runtime mechanics.

Bus runtime id: `gemini`. Run locally on this working tree (`C:\Work\TSST`, branch `master`).
First bus task is its cold-start probe (`AG-012-PROBE`). Near a usage limit: `release` with a resume note, then `limit gemini --until <UTC>`.

## Plan: Antigravity — roster → Gemini runtime (ADR-005/007)
Routing follows root `AGENTS.md`. The Claude Lead orchestrates and reviews. Antigravity operates as a team runtime (ROLE A) for heavy implementation.
Antigravity does not spawn autonomous sub-agents and cannot switch models dynamically; every brief explicitly specifies TEAM / AGENT / SKILLS / TIER and the model to run.
Team work is done by the routed TSST team agent and its loaded skills.

| TSST agent | Antigravity role | tier | model · effort (`TSST/bus/runtimes.yaml#gemini`) |
|---|---|---|---|
| reads/inventory (R2) | `tsst-reader` (read-only) | FAST | Gemini 3.8 Flash · low |
| LENS_AG | `tsst-lens` | WORK | Gemini Pro · high |
| SPARK_AG | `tsst-spark` | WORK | Gemini Pro · high |
| CREATIVE_AG | `tsst-creative` | WORK | Gemini Pro · high |
| MOTION_AG | `tsst-motion` | WORK | Gemini Pro · high |
| DEV_AG | `tsst-dev` | CODE | Gemini Pro · high |
| Lead DEEP-only decision | main session | DEEP | Gemini Pro · high (or bus task to the Claude Lead) |

- Model ids come from Antigravity's own model picker (Gemini 3.8 Flash, Gemini Pro), never from memory.
  Model and effort level are selected in the UI before running the task; the brief must specify them.
- Skills: loaded via `TSST/skills/index.yaml` (`python TSST/skills/build_index.py --team <team> --id <ID>`), ≤3 per task.
- Bus: `claim` prints `AGENT:` and `RUN ON:`; claim with `--model <what actually ran>`; `done --skills-used` is mandatory.
- Unattended work: tool execution policies and permission grants are configured in Antigravity settings; prompts remain known costs per ADR-004.
- Report format: Egyptian Arabic, short, verdict first. 3 lines for intermediate progress/status, end with one next step. Full reports only when requested.

## Memory access
- Filesystem: open the project at `C:\Work\TSST` on `master` (R21/R42). `TSST/brands` is a junction to `G:\My Drive\TSST-Clients`; `drive:` paths need the Drive mounted.
- `.gdoc` → `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME`: use repo-native export if in `EXPORTS.yaml`, else ask Lead for a `source-read` bus task.
- Git authority comes from `TSST/TSST_DECISION_RIGHTS.md`: commits only within approved scope; merging to master, push, deployment, publication and spend remain strictly reserved to Ahmed.
- Shared preflight: run `python -B TSST/context/preflight.py --plan <plan.json> --mutate --json` before code mutation.
- Write files with LF line endings.

Status: PROPOSED / ACTIVE PILOT.
