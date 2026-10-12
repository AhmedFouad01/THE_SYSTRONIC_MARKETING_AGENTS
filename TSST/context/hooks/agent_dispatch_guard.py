#!/usr/bin/env python3
"""Claude Code PreToolUse guard for the Agent/Task tool (TSST-ADR-003, rule R1).

stdin : {"tool_name": "...", "tool_input": {"subagent_type": "...", "prompt": "..."}}
exit 0: allow. exit 2 + reason on stderr: deny, including invalid JSON/index/internal errors.
Complete R3 fields required; utility exception is SKILLS: none, TIER: FAST.
Stdlib only.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
try:
    from preflight import validate_plan, load_index as load_skill_index
except Exception as exc:
    # Claude requires exit 2 to deny; an uncaught import error exits 1 and may continue.
    print(f'agent_dispatch_guard DENIED (shared validator load error): {exc!r}', file=sys.stderr)
    sys.exit(2)

REPO = os.environ.get("CLAUDE_PROJECT_DIR") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
INDEX = os.path.join(REPO, "TSST", "skills", "index.yaml")
# Must equal the runtime agents of TSST/context/roster.yaml (tested in test_runtime_agents.py).
TEAM_AGENTS = {"tsst-lens": "marketing", "tsst-spark": "marketing", "tsst-creative": "studio", "tsst-motion": "motion",
               "tsst-dev": "build"}
UTILITY = {"tsst-reader", "explore"}
RETIRED = {"tsst-fast-worker": "tsst-reader"}   # TSST-ADR-004: replaced
ALLOWED = {"claude-code-guide", "statusline-setup"}
TEAMS = {"marketing", "studio", "motion", "build", "lead"}
DENY_R1 = "TSST R1: use a team agent (tsst-lens/spark/creative/motion/dev) with a Skill Plan, or tsst-reader/Explore for reads"
ID_RE = re.compile(r"TSST-[A-Z]+-SK-\d{3}")


def load_index(path=INDEX):
    return load_skill_index(index_path=path)


def line_value(prompt, key):
    # Stop at the next named field so a complete inline plan parses like a multiline plan.
    keys = 'TEAM|AGENT|SKILLS|NOT_SELECTED|TIER|ACCEPTANCE|SKILL_GAP|SKILL_LIMIT_REASON'
    marker = r'(?:^|[\s.;|])[>*#_`-]*(%s)[*_`]*[ \t]*:[ \t*_`]*' % keys
    matches = list(re.finditer(marker, prompt, re.I | re.M))
    for i, match in enumerate(matches):
        if match.group(1).upper() == key:
            end = matches[i + 1].start() if i + 1 < len(matches) else len(prompt)
            return prompt[match.end():end].splitlines()[0].strip().rstrip('.;|')
    return None


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
    if low not in TEAM_AGENTS and low not in UTILITY:
        return f"{DENY_R1}. Refused subagent_type '{sub}'."
    fields = ('TEAM', 'AGENT', 'SKILLS', 'NOT_SELECTED', 'TIER', 'ACCEPTANCE', 'SKILL_GAP', 'SKILL_LIMIT_REASON')
    plan = {key.lower(): line_value(prompt, key) for key in fields}
    if plan['agent'] and plan['agent'].lower() != low:
        return f'{DENY_R1}. AGENT field must match dispatched subagent_type {sub}.'
    if plan['team']:
        plan['team'] = re.split(r'[\s,;(]', plan['team'].lower())[0]
    sk = plan['skills']
    if sk is not None:
        plan['skills'] = [] if sk.lower() == 'none' else ID_RE.findall(sk.upper())
        if not plan['skills'] and sk.lower() != 'none':
            return f'{DENY_R1}. SKILLS must name indexed IDs, or none for a utility reader.'
    index = index_loader()
    errors = validate_plan(plan, index)
    if errors:
        return DENY_R1 + '. ' + '; '.join(errors)
    return None


def main():
    try:
        data = json.loads(sys.stdin.read() or "{}")
        tool = data.get("tool_name")
        if tool not in (None, "Agent", "Task"):
            return 0
        reason = decide(data)
    except Exception as exc:
        print(f"agent_dispatch_guard DENIED (guard error): {exc!r}", file=sys.stderr)
        return 2
    if reason:
        print(reason, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
