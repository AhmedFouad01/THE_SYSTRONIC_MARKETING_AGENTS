#!/usr/bin/env python3
"""Claude Code PreToolUse guard for the Agent/Task tool (TSST-ADR-003, rule R1).

stdin : {"tool_name": "...", "tool_input": {"subagent_type": "...", "prompt": "..."}}
exit 0: allow.  exit 2 + reason on stderr: deny.  Any internal error: allow + warning (fail-open).
Stdlib only.
"""
import json
import os
import re
import sys

REPO = os.environ.get("CLAUDE_PROJECT_DIR") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
INDEX = os.path.join(REPO, "TSST", "skills", "index.yaml")
# Must equal the runtime agents of TSST/context/roster.yaml (tested in test_runtime_agents.py).
TEAM_AGENTS = {"tsst-lens": "marketing", "tsst-spark": "marketing", "tsst-creative": "studio", "tsst-dev": "build"}
UTILITY = {"tsst-reader", "explore"}
RETIRED = {"tsst-fast-worker": "tsst-reader"}   # TSST-ADR-004: replaced
ALLOWED = {"claude-code-guide", "statusline-setup"}
TEAMS = {"marketing", "studio", "build", "lead"}
DENY_R1 = "TSST R1: use a team agent (tsst-lens/spark/creative/dev) with a Skill Plan, or tsst-reader/Explore for reads"
ID_RE = re.compile(r"TSST-[A-Z]+-SK-\d{3}")
LINE = re.compile(r'^\s*- \{id: (?P<id>[^,]+), team: (?P<team>[^,]+), owner: [^,]+, status: (?P<status>[^,]+),')


def load_index(path=INDEX):
    out = {}
    with open(path, encoding="utf-8-sig") as f:
        for ln in f:
            m = LINE.match(ln)
            if m:
                out[m.group("id").strip().upper()] = (m.group("team").strip(), m.group("status").strip())
    if not out:
        raise ValueError("no skills parsed from index")
    return out


def line_value(prompt, key):
    # key at line start (optionally decorated) or inline after whitespace/punctuation ("TEAM: x. SKILLS: y")
    m = re.search(r"(?:^|[\s.;|])[>*#_`-]*%s[*_`]*[ \t]*:[ \t*_`]*(.*)$" % key, prompt, re.M)
    return m.group(1).strip() if m else None


def decide(data, index_loader=load_index):
    """Return None to allow, or a deny-reason string."""
    ti = data.get("tool_input") or {}
    sub = (ti.get("subagent_type") or "general-purpose").strip()
    low = sub.lower()
    prompt = ti.get("prompt") or ""
    if low in ALLOWED:
        return None
    if low in RETIRED:
        return f"{DENY_R1}. '{sub}' is retired (TSST-ADR-004); use {RETIRED[low]}."
    if low in UTILITY:
        if line_value(prompt, "TEAM") is None:
            return f"{DENY_R1}. Utility agent '{sub}' needs a 'TEAM: <marketing|studio|build|lead>' line in the prompt."
        return None
    if low not in TEAM_AGENTS:
        return f"{DENY_R1}. Refused subagent_type '{sub}'."
    team = (line_value(prompt, "TEAM") or "").lower()
    team = re.split(r"[\s,;(]", team)[0] if team else ""
    if team not in TEAMS:
        return f"{DENY_R1}. Agent '{sub}' needs a 'TEAM: <marketing|studio|build|lead>' line."
    if team != "lead" and team != TEAM_AGENTS[low]:
        return f"{DENY_R1}. Agent '{sub}' serves team {TEAM_AGENTS[low]}, prompt says TEAM: {team}."
    sk = line_value(prompt, "SKILLS")
    ids = ID_RE.findall(sk.upper()) if sk else []
    if not ids:
        return f"{DENY_R1}. Agent '{sub}' needs a 'SKILLS:' line with >=1 skill ID (TSST-<X>-SK-NNN) from TSST/skills/index.yaml."
    index = index_loader()
    for sid in dict.fromkeys(ids):
        if sid not in index:
            return f"TSST R1: skill {sid} is not in TSST/skills/index.yaml (SKILL_GAP -> TSST-CTX-SK-023 intake)."
        sk_team, status = index[sid]
        if status == "DEPRECATED":
            return f"TSST R1: skill {sid} is DEPRECATED; pick a current skill."
        if team != "lead" and sk_team not in (team, "core"):
            return f"TSST R1: skill {sid} belongs to team {sk_team}, dispatch TEAM is {team}."
    return None


def main():
    try:
        data = json.loads(sys.stdin.read() or "{}")
        tool = data.get("tool_name")
        if tool not in (None, "Agent", "Task"):
            return 0
        reason = decide(data)
    except Exception as exc:  # fail-open: never brick the session
        print(f"agent_dispatch_guard WARNING (allowing, guard error): {exc!r}", file=sys.stderr)
        return 0
    if reason:
        print(reason, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
