# TSST Boot — reference

Provider-neutral. Model names live only in `TSST/context/adapters/<runtime>.md`.
The short start is root `AGENTS.md` + `TSST/core/rules.md`; this file is the reference behind it.
Pointer first, context second: load the smallest slice that answers the current task.

## Start sequence (same five steps as `AGENTS.md`)

| # | Step | Read / run | Notes |
|---|------|-----------|-------|
| 1 | Branch | `git branch --show-current` | must match the track (R21/R42); shared folder = one branch for all chats |
| 2 | Brand → project → state | `TSST/core/portfolio.yaml` → `router.yaml#brand_aliases` → `TSST/brands/<id>/status.md` → project checkpoint | ambiguous brand → one question; apply `do_not_repeat`; conflicts → `router.yaml#source_authority` (newest verified evidence wins); job home R18 |
| 3 | Route | `router.yaml#team_routing` + `TSST/context/roster.yaml`; skills via `TSST/skills/build_index.py`; tier via `TSST/context/models.yaml` | ≤3 skills; matching rules pack; authority row in `TSST/TSST_DECISION_RIGHTS.md` only when unsure |
| 4 | Before mutation | `preflight.py --plan <plan.json> --mutate --json` (`workflow.md`) | failure stops the affected write; reads need no plan file |
| 5 | Checkpoint | brand `status.md` / project checkpoint; client job → delivery pack (R18–R20) | durable Real Memory writes need approval; lessons gate `TSST/core/lessons.md#promotion_gate` |

Conditional: queued cross-runtime work → `python TSST/bus/bus.py ls --me <runtime-id>` (`bus.md`);
daily board → `python TSST/daily/day.py show` only after Ahmed says "ابدأ اليوم" (R17).

## Memory resolution (mandatory)

```
brand → canonical memory source → current status → latest relevant checkpoint
      → relevant decisions/rules → minimum required source files → execute
```

- Brand `memory/` folders hold **pointers only**. Never copy, merge, or preload a brand's
  Real Memory tree.
- The *address* of a memory source is provider-neutral (Drive path / Drive file).
  The *access method* is defined by the runtime adapter.
- Access is resolved per runtime, never globally:

  ```
  canonical source → runtime capability check (adapter) → direct read if supported
    → authorised bridge/export adapter if not (see TSST/context/bridge.md)
    → SOURCE_UNAVAILABLE only if no authorised access path exists
  ```

  | state | meaning | action |
  |---|---|---|
  | `SOURCE_AVAILABLE` | this runtime can read the source | read the minimum slice |
  | `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME` | source exists and is readable elsewhere (e.g. `.gdoc` in a filesystem runtime) | use a repo-native export if present (`bridge.md`); else a `source-read` bus task to any runtime with the verified capability (`bus.md`); pause only the dependent step |
  | `SOURCE_UNAVAILABLE` | no authorised access path in any runtime | return `MEMORY_SOURCE_UNAVAILABLE: <brand>/<source> — <reason>`; do not proceed on that state |

  A project's state is never reported as globally UNKNOWN because one runtime cannot
  read its source. In every case: do not guess, reconstruct from chat history, or
  substitute another brand.
- Multiple memory roots (e.g. YAKEBDA_MS): resolve authority by explicit current
  checkpoint → newest dated status → repository evidence. Never load all roots.

## Isolation

- One brand per task unless the user explicitly names more.
- `TSST` (this operating system) ≠ `TSST-AI` (an internal T.SAG project). Do not mix
  their state.
- Global lessons must not contain client-private facts (see `TSST/core/lessons.md`).

## Fixed boundaries (never bypassed by routing)

No publication, spend, client contact, deployment, credential handling, deletion of
historical evidence, or durable Real Memory apply without explicit user approval.
A bus task never widens these boundaries (`bus.md` rule 8).
TSST readiness is governed by `TSST/READINESS_REPORT.md`; routing never claims
PRODUCTION_READY.

## Relation to existing structures

`TSST/context_os/` holds the detailed Context OS policies, contracts, skills
(TSST-CTX-SK-001…022) and reference tests. This boot is the compact entry point that
invokes them; it does not replace them. See `router.yaml#context_os_skills`.
