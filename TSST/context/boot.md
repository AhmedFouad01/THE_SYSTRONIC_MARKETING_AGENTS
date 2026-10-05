# TSST Boot — portable operating entry point

Provider-neutral. No model names, no provider tools. Runtime specifics live only in
`TSST/context/adapters/<runtime>.md`. Every runtime (and every future runtime) runs this
same sequence.

Principle: **pointer first, context second.** Load the smallest authoritative slice that
answers the current task. Large context is not better context.

## Boot sequence

| # | Step | Read | Stop condition |
|---|------|------|----------------|
| 0 | Bus check | `python TSST/bus/bus.py ls --me <runtime-id>` (`TSST/context/bus.md`) | user said continue → claim top `*` task; else continue with the user's task |
| 1 | Resolve TSST | this file + `TSST/context/router.yaml` | — |
| 2 | Resolve brand | `TSST/core/portfolio.yaml` → `router.yaml#brand_aliases` | ambiguous brand → ask user (one question); brand but no task → `router.yaml#brand_only_entry` |
| 3 | Resolve project / workstream | `portfolio.yaml#brands.<id>.projects` → `TSST/brands/<id>/projects/<p>/project.md` | — |
| 4 | Load portfolio pointer | the single brand + project entry only | never read other brand entries in depth |
| 5 | Resolve canonical memory source | `TSST/brands/<id>/memory/source.md` | access state per runtime (see Memory resolution) |
| 6 | Recover current status / checkpoint | `TSST/brands/<id>/status.md`, then the project's `checkpoint` pointer | — |
| 7 | Apply source authority | `router.yaml#source_authority` | conflict → newest verified evidence wins; record it |
| 8 | Apply do_not_repeat | `project.md#do_not_repeat` + `status.md#do_not_repeat` | — |
| 9 | Apply rules | `TSST/core/rules.md`, then `TSST/brands/<id>/rules.md` | brand rule never overrides a core safety rule |
| 10 | Build minimum context pack | only files named by steps 3–9 for this task | budget: `router.yaml#context_budget` |
| 11 | Route team | `router.yaml#team_routing` → `TSST/teams/<team>/team.md` (team `lead` → `TSST/LEAD/AGENT.md`) | fixed roster only (rules R1–R2); runtime agent per adapter |
| 12 | Route skills | `TSST/skills/index.yaml` (team slice) + team map → Skill Plan; load only the matched skill(s) | never load a whole registry; **mandatory — no ad-hoc work without team + skills** (`TSST/core/rules.md` 9) |
| 13 | Route logical model tier | `TSST/context/models.yaml` (FAST/WORK/CODE/DEEP/IMAGE/VIDEO) | adapter maps tier → actual model |
| 14 | Verify authority | `TSST/TSST_DECISION_RIGHTS.md` (relevant row only) | not authorised → ask user |
| 15 | Execute | — | — |
| 16 | Checkpoint | update `status.md` / project checkpoint pointer (repo) | durable Real Memory writes need approval |
| 17 | Learning / memory gate | `TSST/core/lessons.md#promotion_gate` | brand-specific → brand `rules.md`; reusable → global lesson candidate |

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
