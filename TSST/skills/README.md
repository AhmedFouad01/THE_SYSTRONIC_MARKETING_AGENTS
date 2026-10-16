# TSST skills - the one entry point (TSST-ADR-003)

`index.yaml` lists every skill: id, team, owner, status, version, trigger, path (+ `backlog:` of
registered-but-unpackaged IDs). It is GENERATED - never edit it by hand.

## Rules
- Lead reads only the needed team slice of `index.yaml` (grep `team: marketing|studio|motion|build|lead|core`).
- Read-only lookups (never rewrite the index): `python TSST/skills/build_index.py --team <team>` prints compact `ID | status | trigger` rows; `--id <ID>` prints that skill's path + full trigger.
- Agents load at most 3 `SKILL.md` files, by path from the index. Do not scan skill folders.
- Every dispatch references one complete Skill Plan: TEAM / AGENT / SKILLS / NOT_SELECTED / TIER / ACCEPTANCE / SKILL_GAP. See `TSST/context/workflow.md` and shared preflight; the hook checks plan fields, the bus checks its own envelope. Neither citation nor hash alone proves skill application.
- DEPRECATED skills are refused. Team must match the task team (or be `core`; `lead` may use any).

## Add or change a skill
1. Create `TSST/skills/<team>/<id-slug>/SKILL.md` (team = marketing|studio|motion|build|lead|core).
2. Frontmatter: `name, description ("Use when ..."), id, team, owner, status, version`.
3. Regenerate: `python TSST/skills/build_index.py`; verify: `python TSST/skills/build_index.py --check`.
4. New skills start `UNVALIDATED`; promotion only via TSST-CTX-SK-018 evidence.

## External skills
Only through intake `TSST-CTX-SK-023` (gap, scout, compare, user approval, adapt to TSST format, index).

Legacy folders (context_os/LEAD/LENS/SPARK/CREATIVE/DEV `skills/`) stay in place; the index points to them.
`.agents/skills` (Gemini runtime wrappers) is not indexed.
