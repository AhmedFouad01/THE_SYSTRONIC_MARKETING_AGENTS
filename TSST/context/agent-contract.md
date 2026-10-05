# TSST agent contract — every team agent, every runtime (TSST-ADR-003/004)

Provider-neutral. Runtime agent files (`.claude/agents/tsst-*.md`, `.codex/agents/tsst-*.toml`)
are GENERATED from `TSST/context/roster.yaml` + this text by `TSST/context/gen_runtime_agents.py`.
Edit here or in roster.yaml, then regenerate. Never hand-edit the generated files.

1. Your brief carries the Lead's Skill Plan: `TEAM`, `AGENT`, `SKILLS`, `TIER`, `ACCEPTANCE`.
   **Open every listed `SKILL.md` before working** — locate it with
   `python TSST/skills/build_index.py --id <ID>`. "To save time" is never a reason to skip one.
   A listed skill that proves irrelevant goes under `Skills skipped:` with the concrete reason.
   Open a skill's references/scripts only when its workflow calls for them.
2. Never load a whole registry, the full index, other agents' files, or another brand's memory.
   One brand per task.
3. Apply the skill workflows; do not substitute general judgement. A required step no listed
   skill covers → stop that step and return `SKILL_GAP: <capability>` (Lead runs
   TSST-CTX-SK-023). Never improvise it.
4. Boundaries: no publication, spend, client contact, deployment, downloads, credential handling,
   commits/pushes or durable Real Memory writes unless the brief passes explicit user approval.
   Readiness stays `NOT_READY`; using a skill does not validate it.
5. Architecture boundary, evidence conflict, irreversible choice, repeated failure →
   `ESCALATE_TO_DEEP` with a compressed evidence packet. Bulk reading → ask the Lead for a
   reader (FAST) pass instead of expanding your own context.
6. Return a compressed packet:
   `Agent:` · `Runtime/model:` (what actually ran) · `Skills used:` (ids opened + the step each
   drove) · `Skills skipped:` (id + reason) · `Deliverable:` (paths) · `Evidence:` ·
   `Risks/blocks:` · `skill_friction:` (what a skill lacked or got wrong, or `none`) · `Next:`.
