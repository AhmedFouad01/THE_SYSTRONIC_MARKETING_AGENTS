#!/usr/bin/env python3
"""Generate runtime agent files from the neutral roster (TSST-ADR-004). Stdlib only.

Inputs : TSST/context/roster.yaml, TSST/context/agent-contract.md, TSST/bus/runtimes.yaml
Outputs: .claude/agents/tsst-<id>.md  and  .codex/agents/tsst-<id>.toml   (one pair per agent with runtime_agent != false)

  python TSST/context/gen_runtime_agents.py            write/refresh generated files
  python TSST/context/gen_runtime_agents.py --check    exit 1 on drift, missing or stale files (writes nothing)
  python TSST/context/gen_runtime_agents.py --prune    also delete stale tsst-* files not in the roster
"""
import glob
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ROSTER = os.path.join(ROOT, "TSST", "context", "roster.yaml")
CONTRACT = os.path.join(ROOT, "TSST", "context", "agent-contract.md")
RUNTIMES = os.path.join(ROOT, "TSST", "bus", "runtimes.yaml")
CLAUDE_DIR = os.path.join(ROOT, ".claude", "agents")
CODEX_DIR = os.path.join(ROOT, ".codex", "agents")
MAX_TURNS = {"FAST": 16, "WORK": 30, "CODE": 36}
READ_TOOLS = ["Read", "Grep", "Glob"]
WRITE_TOOLS = ["Read", "Grep", "Glob", "Bash", "PowerShell", "Edit", "Write", "Skill"]
WEB_TOOLS = ["WebSearch", "WebFetch"]
MAX_DESC = 300


# ------------------------------------------------------------------ roster subset parser
def _scalar(s):
    s = s.strip()
    if s in ("true", "false"):
        return s == "true"
    if s.startswith("[") and s.endswith("]"):
        return [x.strip() for x in s[1:-1].split(",") if x.strip()]
    if s.isdigit():
        return int(s)
    if len(s) > 1 and s[0] == s[-1] and s[0] in "\"'":
        return s[1:-1]
    return s


def parse_roster(text):
    """Block mappings, inline lists, `- item` lists, scalars, `#` comments (no PyYAML needed)."""
    rows = []
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        body = re.sub(r"\s+#.*$", "", raw.rstrip())
        rows.append((len(body) - len(body.lstrip(" ")), body.strip()))

    def block(i, indent):
        if rows[i][1].startswith("- "):
            out = []
            while i < len(rows) and rows[i][0] == indent and rows[i][1].startswith("- "):
                out.append(_scalar(rows[i][1][2:]))
                i += 1
            return out, i
        out = {}
        while i < len(rows) and rows[i][0] == indent and not rows[i][1].startswith("- "):
            key, _, val = rows[i][1].partition(":")
            i += 1
            if val.strip():
                out[key.strip()] = _scalar(val)
            elif i < len(rows) and rows[i][0] > indent:
                out[key.strip()], i = block(i, rows[i][0])
            else:
                out[key.strip()] = ""
        return out, i

    parsed, end = block(0, rows[0][0])
    if end != len(rows):
        raise ValueError(f"roster.yaml: unparsed content near row {end}: {rows[end][1]!r}")
    return parsed


def load_runtimes():
    spec = importlib.util.spec_from_file_location("tsst_bus_for_gen", os.path.join(ROOT, "TSST", "bus", "bus.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    with open(RUNTIMES, encoding="utf-8") as f:
        return mod.parse(f.read())


def tier(runtimes, runtime, name):
    raw = runtimes[runtime].get("tier_" + name)
    if not raw or "·" not in raw:
        raise ValueError(f"runtimes.yaml {runtime}.tier_{name} must be '<model> · <effort>', got {raw!r}")
    model, effort = [x.strip() for x in raw.split("·", 1)]
    return model, effort


# ------------------------------------------------------------------ text builders
def contract_items():
    with open(CONTRACT, encoding="utf-8") as f:
        text = f.read().replace("\r\n", "\n")
    m = re.search(r"^1\. ", text, re.M)
    if not m:
        raise ValueError("agent-contract.md: numbered contract items not found")
    return text[m.start():].strip("\n")


def skills_prefix(a):
    sk = a.get("skills") or []
    return ", ".join(sk) if sk else "none"


def description(a):
    does = a["does"].strip().rstrip(".")
    team = a["team"] if a["team"] != "any" else "<named team>"
    tail = (f". Dispatch with a Skill Plan (TEAM: {team}, SKILLS: {skills_prefix(a)})" if a.get("skills")
            else f". Dispatch with TEAM: {team} (read-only utility, no skills)")
    head = f"{a['tsst_id']} — "
    room = MAX_DESC - len(head) - len(tail)
    if len(does) > room:
        cut = does[:room - 1]
        does = (cut.rsplit(",", 1)[0] if "," in cut else cut.rsplit(" ", 1)[0]) + " …"
    return head + does + tail


def body(a, contract):
    tid = a["tsst_id"]
    if a.get("identity"):
        team = a["team"].upper()
        who = (f"You are **{tid}**, manager of the TSST {team} team, subordinate to TSST Lead. "
               f"Identity and limits: `{a['identity']}` (read Mission/Owns/Does-not-own sections only); "
               f"team map: `{a['team_file']}`.")
    else:
        who = (f"You are **{tid}**, the TSST FAST-tier utility reader (rule R2), subordinate to TSST Lead. "
               "You have no identity file; your scope is the Role-specific section below.")
    rules = "\n".join(f"- {r}" for r in a.get("role_rules") or [])
    return (f"{who}\n\n## Operating contract (TSST-ADR-003/004, rules R1–R10)\n"
            "Generated from roster.yaml + agent-contract.md — do not hand-edit "
            "(edit those, then run `python TSST/context/gen_runtime_agents.py`).\n\n"
            f"{contract}\n\n## Role-specific\n- Scope: {a['does'].strip()}\n{rules}\n")


def claude_file(aid, a, runtimes, contract):
    model, effort = tier(runtimes, "claude", a["tier"])
    tools = list(WRITE_TOOLS if a.get("write") else READ_TOOLS) + (WEB_TOOLS if a.get("web") else [])
    head = ("---\n"
            f"name: tsst-{aid}\n"
            f"description: {json.dumps(description(a), ensure_ascii=False)}\n"
            f"tools: {', '.join(tools)}\n"
            f"model: {model}\n"
            f"effort: {effort}\n"
            f"maxTurns: {MAX_TURNS[a['tier']]}\n"
            "---\n\n")
    return head + body(a, contract)


def codex_file(aid, a, runtimes, contract):
    model, effort = tier(runtimes, "codex", a["tier"])
    instr = body(a, contract)
    if "'''" in instr:
        raise ValueError(f"tsst-{aid}: body contains ''' (cannot use TOML literal string)")
    return ("# GENERATED from TSST/context/roster.yaml + agent-contract.md by gen_runtime_agents.py — do not hand-edit\n"
            f"name = \"tsst-{aid}\"\n"
            f"description = {json.dumps(description(a), ensure_ascii=False)}\n"
            f"model = \"{model}\"\n"
            f"model_reasoning_effort = \"{effort}\"\n"
            f"sandbox_mode = \"{'workspace-write' if a.get('write') else 'read-only'}\"\n"
            f"developer_instructions = '''\n{instr}'''\n")


def expected():
    with open(ROSTER, encoding="utf-8") as f:
        roster = parse_roster(f.read())
    runtimes, contract = load_runtimes(), contract_items()
    out = {}
    for aid, a in roster["agents"].items():
        if a.get("runtime_agent") is False:
            continue
        out[os.path.join(CLAUDE_DIR, f"tsst-{aid}.md")] = claude_file(aid, a, runtimes, contract)
        out[os.path.join(CODEX_DIR, f"tsst-{aid}.toml")] = codex_file(aid, a, runtimes, contract)
    return out


def read_norm(path):
    with open(path, "rb") as f:
        return f.read().decode("utf-8").replace("\r\n", "\n")


def main(argv):
    check, prune = "--check" in argv, "--prune" in argv
    want = expected()
    problems = []
    for path, text in want.items():
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        if not os.path.isfile(path):
            problems.append(f"MISSING {rel}")
        elif read_norm(path) != text:
            problems.append(f"DRIFT   {rel}")
        else:
            continue
        if not check:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
            print(f"wrote   {rel}")
    stale = []
    for d, ext in ((CLAUDE_DIR, ".md"), (CODEX_DIR, ".toml")):
        for p in glob.glob(os.path.join(d, "tsst-*" + ext)):
            if p not in want:
                stale.append(p)
    for p in stale:
        rel = os.path.relpath(p, ROOT).replace("\\", "/")
        if prune and not check:
            os.remove(p)
            print(f"pruned  {rel}")
        else:
            problems.append(f"STALE   {rel} (not in roster; --prune removes)")
    if check:
        for p in problems:
            print(p)
        print("runtime agents OK" if not problems else f"runtime agents DRIFT ({len(problems)})")
        return 1 if problems else 0
    for p in problems:
        if p.startswith("STALE"):
            print(p)
    print(f"generated {len(want)} files")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(sys.argv[1:]))
