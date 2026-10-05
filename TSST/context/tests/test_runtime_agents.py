#!/usr/bin/env python3
"""Tests for the runtime-neutral roster generator, tier mapping, dispatch guard and bus routing (TSST-ADR-004).

Run: python TSST/context/tests/test_runtime_agents.py   (stdlib only, Python >= 3.11 for tomllib;
read-only on the live repo except short-lived tamper/stale files that are always restored/removed)
"""
import importlib.util
import json
import os
import re
import subprocess
import sys
import tomllib

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
GEN = os.path.join(REPO, "TSST", "context", "gen_runtime_agents.py")
HOOK = os.path.join(REPO, "TSST", "context", "hooks", "agent_dispatch_guard.py")
BUS = os.path.join(REPO, "TSST", "bus", "bus.py")
CLAUDE_DIR = os.path.join(REPO, ".claude", "agents")
CODEX_DIR = os.path.join(REPO, ".codex", "agents")
FAILS = []
MAX_TURNS = {"FAST": 16, "WORK": 30, "CODE": 36}


def expect(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        FAILS.append(name)


def py(*args, stdin=None):
    return subprocess.run([sys.executable, *args], input=stdin, capture_output=True, text=True, encoding="utf-8",
                          cwd=REPO, env={**os.environ, "CLAUDE_PROJECT_DIR": REPO})


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def frontmatter(text):
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    fm = {}
    for ln in m.group(1).splitlines():
        k, _, v = ln.partition(":")
        v = v.strip()
        fm[k.strip()] = json.loads(v) if v.startswith('"') else v
    return fm, m.group(2)


def guard(subagent, prompt):
    payload = {"tool_name": "Agent", "tool_input": {"subagent_type": subagent, "prompt": prompt}}
    r = py(HOOK, stdin=json.dumps(payload))
    return r.returncode, r.stderr


def test_generator_and_files():
    gen = load(GEN, "gen_runtime_agents")
    roster = gen.parse_roster(open(os.path.join(REPO, "TSST", "context", "roster.yaml"), encoding="utf-8").read())
    bus = load(BUS, "tsst_bus_ra")
    rts = bus.runtimes()
    r = py(GEN, "--check")
    expect("generator --check exits 0 (no drift)", r.returncode == 0)
    agents = {k: v for k, v in roster["agents"].items() if v.get("runtime_agent") is not False}
    expect("roster runtime agents = lens spark creative dev reader",
           sorted(agents) == ["creative", "dev", "lens", "reader", "spark"])
    expect("lead is never a spawned agent", "lead" in roster["agents"] and "lead" not in agents)
    for aid, a in agents.items():
        name = "tsst-" + aid
        cpath, xpath = os.path.join(CLAUDE_DIR, name + ".md"), os.path.join(CODEX_DIR, name + ".toml")
        expect(f"{name}: both runtime files exist", os.path.isfile(cpath) and os.path.isfile(xpath))
        if not (os.path.isfile(cpath) and os.path.isfile(xpath)):
            continue
        cm, cm_effort = [x.strip() for x in rts["claude"]["tier_" + a["tier"]].split("·")]
        xm, xm_effort = [x.strip() for x in rts["codex"]["tier_" + a["tier"]].split("·")]
        fm, body = frontmatter(open(cpath, encoding="utf-8").read())
        expect(f"{name}: claude name/model/effort match runtimes.yaml",
               fm["name"] == name and fm["model"] == cm and fm["effort"] == cm_effort)
        expect(f"{name}: claude maxTurns by tier", fm["maxTurns"] == str(MAX_TURNS[a["tier"]]))
        expect(f"{name}: description <= 300 and has Skill Plan hook",
               len(fm["description"]) <= 300 and "Dispatch with" in fm["description"] and "TEAM:" in fm["description"])
        tools = [t.strip() for t in fm["tools"].split(",")]
        t = tomllib.loads(open(xpath, encoding="utf-8").read())
        expect(f"{name}: codex toml model/effort match runtimes.yaml",
               t["name"] == name and t["model"] == xm and t["model_reasoning_effort"] == xm_effort)
        expect(f"{name}: codex developer_instructions == claude body",
               t["developer_instructions"].strip() == body.strip())
        expect(f"{name}: body carries contract + generated marker",
               "Open every listed `SKILL.md`" in body and "do not hand-edit" in body.lower()
               and "## Role-specific" in body and a["tsst_id"] in body)
        if a.get("write"):
            expect(f"{name}: writer has edit tools + workspace-write",
                   {"Edit", "Write", "Bash", "Skill"} <= set(tools) and t["sandbox_mode"] == "workspace-write")
            expect(f"{name}: web tools iff roster web", ("WebSearch" in tools) == bool(a.get("web")))
        else:
            expect(f"{name}: read-only in both runtimes",
                   tools == ["Read", "Grep", "Glob"] and t["sandbox_mode"] == "read-only")
    expect("old tsst-fast-worker.md deleted", not os.path.exists(os.path.join(CLAUDE_DIR, "tsst-fast-worker.md")))
    expect("Explore.md untouched (still present)", os.path.isfile(os.path.join(CLAUDE_DIR, "Explore.md")))
    # tier mapping content (ADR-004)
    expect("runtimes claude plan + tiers",
           rts["claude"].get("plan") == "claude-pro" and rts["claude"]["tier_FAST"] == "haiku · low"
           and rts["claude"]["tier_WORK"] == "sonnet · medium" and rts["claude"]["tier_CODE"] == "sonnet · high"
           and rts["claude"]["tier_DEEP"] == "opus · high")
    expect("runtimes codex plan + tiers + source",
           rts["codex"].get("plan") == "chatgpt-plus" and rts["codex"]["tier_FAST"] == "gpt-6-luna · low"
           and rts["codex"]["tier_WORK"] == "gpt-6.1-sol · medium" and rts["codex"]["tier_CODE"] == "gpt-6.1-sol · high"
           and rts["codex"]["tier_DEEP"] == "gpt-6-astra · high" and "models_cache.json" in rts["codex"].get("models_source", ""))
    expect("lead_order unchanged", rts["lead_order"] == ["claude"])


def test_drift_and_prune():
    target = os.path.join(CLAUDE_DIR, "tsst-reader.md")
    original = open(target, "rb").read()
    try:
        with open(target, "ab") as f:
            f.write(b"\nhand edit\n")
        expect("--check exits 1 on drifted claude file", py(GEN, "--check").returncode == 1)
    finally:
        with open(target, "wb") as f:
            f.write(original)
    expect("--check green after restore", py(GEN, "--check").returncode == 0)
    stale = os.path.join(CODEX_DIR, "tsst-zzz-stale.toml")
    try:
        with open(stale, "w", encoding="utf-8") as f:
            f.write("name = 'x'\n")
        r = py(GEN, "--check")
        expect("stale file reported + exit 1", r.returncode == 1 and "tsst-zzz-stale.toml" in (r.stdout + r.stderr))
        expect("stale not removed without --prune", os.path.exists(stale))
        py(GEN, "--prune")
        expect("--prune removes stale", not os.path.exists(stale))
    finally:
        if os.path.exists(stale):
            os.remove(stale)
    expect("--check green after prune", py(GEN, "--check").returncode == 0)


def test_hook():
    ok = "TEAM: build\nread these files"
    rc, _ = guard("tsst-reader", ok)
    expect("hook allows tsst-reader with TEAM", rc == 0)
    rc, err = guard("tsst-reader", "no team here")
    expect("hook denies tsst-reader without TEAM", rc == 2)
    rc, err = guard("tsst-fast-worker", ok)
    expect("hook blocks retired tsst-fast-worker -> points to tsst-reader",
           rc == 2 and "tsst-reader" in err and "TSST R1" in err)
    rc, _ = guard("Explore", ok)
    expect("hook still allows Explore with TEAM", rc == 0)
    g = load(HOOK, "guard_ra")
    roster = load(GEN, "gen_runtime_agents_h").parse_roster(
        open(os.path.join(REPO, "TSST", "context", "roster.yaml"), encoding="utf-8").read())
    want = {"tsst-" + k: v["team"] for k, v in roster["agents"].items()
            if v.get("runtime_agent") is not False and v["team"] != "any"}
    expect("hook TEAM_AGENTS table matches roster.yaml", g.TEAM_AGENTS == want)
    expect("hook utility set = reader + Explore", g.UTILITY == {"tsst-reader", "explore"})


def test_bus_routing():
    bus = load(BUS, "tsst_bus_route")
    af = bus.agent_for
    expect("route marketing + LENS skills -> tsst-lens", af("marketing", ["TSST-LENS-SK-001"]) == "tsst-lens")
    expect("route marketing + only SPARK skills -> tsst-spark", af("marketing", ["TSST-SPARK-SK-001", "TSST-SPARK-SK-002"]) == "tsst-spark")
    expect("route marketing + SPARK path skill -> tsst-spark",
           af("marketing", ["TSST/SPARK/skills/tsst-spark-sk-001-paid-media-strategy"]) == "tsst-spark")
    expect("route marketing + mixed LENS/SPARK -> tsst-lens", af("marketing", ["TSST-LENS-SK-001", "TSST-SPARK-SK-001"]) == "tsst-lens")
    expect("route studio -> tsst-creative", af("studio", ["TSST-CREATIVE-SK-003"]) == "tsst-creative")
    expect("route build -> tsst-dev", af("build", ["TSST-DEV-SK-005"]) == "tsst-dev")
    expect("route lead -> lead-main", af("lead", ["TSST-LEAD-SK-001"]) == "lead-main")
    rts = bus.runtimes()
    expect("gemini status retired", rts["gemini"].get("status") == "retired")
    t = {"id": "T-X", "status": "ready", "to": "any", "kind": "work", "needs": [], "after": [], "write": []}
    errs = bus.claim_errors(t, "gemini")
    expect("gemini retired is never claimable", any("retired" in e for e in errs))
    expect("claude still claimable (no errors)", bus.claim_errors(t, "claude") == [])
    expect("codex still claimable (no errors)", bus.claim_errors(t, "codex") == [])
    r = py(BUS, "ls")
    gl = [l for l in r.stdout.splitlines() if l.startswith("rt gemini")]
    expect("bus ls shows gemini as retired, not available", len(gl) == 1 and "retired" in gl[0] and "available" not in gl[0])
    expect("limit --clear cannot revive retired runtime",
           py(BUS, "limit", "gemini", "--me", "claude", "--clear").returncode == 2 and bus.runtimes()["gemini"]["status"] == "retired")


def main():
    for t in (test_generator_and_files, test_drift_and_prune, test_hook, test_bus_routing):
        t()
    print(f"\n{'all runtime-agent tests passed' if not FAILS else str(len(FAILS)) + ' FAILED'}")
    for f in FAILS:
        print("  " + f)
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
