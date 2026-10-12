# Request role: say what the tool is FOR this request (all tools)

User direction 2026-10-07. The same tool can be a team member in one request and an
external tool in the next (Codex, ChatGPT, Gemini/Antigravity, a second Claude session, …).
The **request decides the role, not the tool**. The Lead (or the agent preparing a handoff)
states the role at the top of every request to a tool that can read/write files or might
claim TSST roles. Single-purpose tools (Magnific, image-edit prompts) need only the job and
its invariants.

## Role A — TEAM RUNTIME (عضو في الفريق)
```
ROLE: TEAM RUNTIME — <tsst-agent> for bus task <ID>   (or: Lead session)
Follow AGENTS.md → TSST/context/boot.md. TEAM / SKILLS as in the Skill Plan.
WRITE: only the task's write scope: <paths>
RETURN: the standard packet with Skills used / skill_friction.
```

## Role B — EXTERNAL TOOL (أداة خارجية)
```
ROLE: EXTERNAL TOOL — <one job: research | image edit | translation | export | …>
You are NOT a TSST agent: do not claim TSST roles, teams, agents, skills or tiers, and do not run the TSST boot.
WRITE: only <exact output path>   (or: "reply with text only, write no files")
DO NOT: edit, move or delete any other file; create bus tasks; commit.
Your output is INPUT for <responsible agent>; the Lead reviews it before anything enters TSST.
```

## Rules
1. No role line means the request is not ready. Fix it before sending.
2. Role B output never edits team files directly. A useful change is applied by the
   responsible TSST agent after Lead review. If a tool edits files anyway, the Lead reviews
   the diff, marks provenance and keeps or reverts it (first case: GEM-CR-001, 2026-10-07).
3. Role A is only for runtimes in `TSST/bus/runtimes.yaml` with the role they hold there.
   Anything else is Role B.
4. The role grants no authority. Boundaries in `boot.md` and `TSST_DECISION_RIGHTS.md` apply.

## Owner-approved production/delivery bridge — 2026-10-12
See `external-production.md` (R41). A separately owner-authorized delivery request may explicitly allow ROLE B to update named packaging/index files via existing delivery scripts after visual review. State the exact allowlist; all other team files remain outside its write scope. This narrow exception does not reinstate a runtime, permit boot/roster claims, or authorize commits, memory changes or publication. The production-stage request never includes delivery integration authority.
