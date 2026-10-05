---
name: tsst-router
description: Use for ANY TSST task (brands, marketing, studio, build, CRM, TSST itself) — boot, Skill Plan, team agent, tier→model.
---

# TSST router (Codex + any runtime that loads `.agents/skills`)

Authority: `TSST/decisions/TSST-ADR-004.md`. Rules R1–R10: `TSST/core/rules.md`. You, the main session, are the
Lead for this runtime; team agents are spawned, never impersonated.

## Steps
1. **Boot.** Run the boot sequence in `AGENTS.md` (→ `TSST/context/boot.md`). One brand per task.
2. **Team.** Resolve it with `TSST/context/router.yaml` (marketing | studio | build | lead).
3. **Skills (max 3).** List the team's catalogue slice, never the whole index:
   `python TSST/skills/build_index.py --team <team>`; open details with `--id <ID>`.
4. **Skill Plan.** Write this block into the brief before any work:
   ```
   TEAM: <marketing|studio|build|lead>
   AGENT: tsst-<lens|spark|creative|dev|reader>   (roster.yaml route: marketing paid/measurement -> spark, else lens)
   SKILLS: <up to 3 ids>
   NOT_SELECTED: <id (reason)>
   TIER: <FAST|WORK|CODE|DEEP>
   ACCEPTANCE: <testable criteria>
   SKILL_GAP: none | <capability>
   ```
5. **Spawn the custom agent** `tsst-<id>` from `.codex/agents/` (Claude: `.claude/agents/`). It carries the right
   model and effort for its tier; do not override them. Tier→model per runtime and plan:
   `TSST/bus/runtimes.yaml` (Codex = ChatGPT Plus; never name a model that file does not list).
6. **Reads.** Bulk extraction/inventory/classification (FAST) goes to `tsst-reader` with a `TEAM:` line.
7. **DEEP stays here** in the main session (architecture, conflict, acceptance, user interface). Never spawn DEEP.
8. **Returns** must list `Skills used:` (ids opened + step) and `Skills skipped:` (+ reason), plus
   `Runtime/model:`. Reject a return without them. Readiness stays `NOT_READY` unless the user approves.
9. **Bus.** Queued work uses `python TSST/bus/bus.py claim <ID> --me codex`; it prints `AGENT:` and `RUN ON:`.

If no listed skill covers a required step, return `SKILL_GAP: <capability>`; do not improvise it.
