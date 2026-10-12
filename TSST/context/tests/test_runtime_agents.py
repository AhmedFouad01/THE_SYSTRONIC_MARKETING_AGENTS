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
    utility = subagent.lower() in ('tsst-reader', 'explore')
    prompt += f'\nAGENT: {subagent}\nSKILLS: none\nNOT_SELECTED: none\nTIER: FAST\nACCEPTANCE: read-only fixture\nSKILL_GAP: none' if utility else ''
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
    expect("roster runtime agents = lens spark creative motion dev reader",
           sorted(agents) == ["creative", "dev", "lens", "motion", "reader", "spark"])
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
    expect("route motion -> tsst-motion", af("motion", ["TSST-MOTION-SK-001"]) == "tsst-motion")
    expect("route build -> tsst-dev", af("build", ["TSST-DEV-SK-005"]) == "tsst-dev")
    expect("route lead -> lead-main", af("lead", ["TSST-LEAD-SK-001"]) == "lead-main")
    rts = bus.runtimes()
    expect("gemini status retired", rts["gemini"].get("status") == "retired")
    t = {"id": "T-X", "status": "ready", "to": "any", "kind": "work", "needs": [], "after": [], "write": []}
    errs = bus.claim_errors(t, "gemini")
    expect("gemini retired is never claimable", any("retired" in e for e in errs))
    # claimability is tested against a fixture registry, never the live one (codex may be legitimately limited)
    live_runtimes = bus.runtimes
    fixture = {
        "avail": {"status": "available", "until": "", "caps": ["fs_read"], "unverified": []},
        "limited": {"status": "limited", "until": "2099-12-31T23:59Z", "caps": ["fs_read"], "unverified": []},
        "lapsed": {"status": "limited", "until": "2000-01-01T00:00Z", "caps": ["fs_read"], "unverified": []},
    }
    try:
        bus.runtimes = lambda: fixture
        expect("available runtime is claimable (no errors)", bus.claim_errors(t, "avail") == [])
        expect("limited runtime is refused until its `until`",
               any("limited until 2099-12-31T23:59Z" in e for e in bus.claim_errors(t, "limited")))
        expect("lapsed limit (until in the past) is claimable again", bus.claim_errors(t, "lapsed") == [])
    finally:
        bus.runtimes = live_runtimes
    r = py(BUS, "ls")
    gl = [l for l in r.stdout.splitlines() if l.startswith("rt gemini")]
    expect("bus ls shows gemini as retired, not available", len(gl) == 1 and "retired" in gl[0] and "available" not in gl[0])
    expect("limit --clear cannot revive retired runtime",
           py(BUS, "limit", "gemini", "--me", "claude", "--clear").returncode == 2 and bus.runtimes()["gemini"]["status"] == "retired")


def test_runtimes_yaml_comments_preserved():
    """bus.py limit/verify must edit only the changed keys: comments and every other line survive (regression)."""
    import shutil
    import tempfile
    live = open(os.path.join(REPO, "TSST", "bus", "runtimes.yaml"), encoding="utf-8", newline="").read()
    tmp = tempfile.mkdtemp(prefix="tsst-rt-")
    try:
        bdir = os.path.join(tmp, "TSST", "bus")
        os.makedirs(bdir)
        shutil.copy(BUS, bdir)
        rp = os.path.join(bdir, "runtimes.yaml")
        open(os.path.join(bdir, "log.tsv"), "w").close()

        def put(text):
            with open(rp, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)

        def get():
            return open(rp, encoding="utf-8", newline="").read()

        def tbus(*args):
            return subprocess.run([sys.executable, os.path.join(bdir, "bus.py"), *args], cwd=tmp,
                                  capture_output=True, text=True, encoding="utf-8")

        put(live)
        comments = [l for l in live.splitlines() if "#" in l]
        expect("fixture has header + inline comments to protect", len(comments) >= 5
               and any("tier_<TIER>" in l for l in comments) and any("never spawned" in l for l in comments))
        # claude is available in the live file: limit then clear must round-trip byte-for-byte
        r = tbus("limit", "claude", "--until", "2030-01-02T03:04Z", "--me", "claude")
        mid = get()
        expect("limit exits 0 and sets status/until on the right block",
               r.returncode == 0 and re.search(r"claude:\n(?:  .*\n)*?  status: limited\n  until: \"2030-01-02T03:04Z\"\n", mid) is not None)
        expect("limit preserved every comment line", all(c in mid.splitlines() for c in comments))
        expect("limit changed exactly 2 lines",
               sum(a != b for a, b in zip(live.splitlines(), mid.splitlines())) == 2
               and len(live.splitlines()) == len(mid.splitlines()))
        expect("limit kept other runtimes untouched (gemini block identical)",
               live.split("gemini:")[1] == mid.split("gemini:")[1])
        r = tbus("limit", "claude", "--clear", "--me", "claude")
        expect("limit --clear exits 0 and round-trip is byte-identical", r.returncode == 0 and get() == live)
        # codex: independent of its live state (limited or available) - first force a known limited baseline in the
        # temp copy, then re-limiting to the same instant is a no-op and clearing touches only status/until
        r = tbus("limit", "codex", "--until", "2099-12-31T23:59Z", "--me", "claude")
        cbase = get()
        expect("limit codex to a known baseline exits 0 and sets status/until",
               r.returncode == 0 and re.search(r"codex:\n(?:  .*\n)*?  status: limited\n  until: \"2099-12-31T23:59Z\"\n", cbase) is not None
               and len(cbase.splitlines()) == len(live.splitlines()))
        r = tbus("limit", "codex", "--until", "2099-12-31T23:59Z", "--me", "claude")
        expect("re-limit codex with same until is byte-identical", r.returncode == 0 and get() == cbase)
        r = tbus("limit", "codex", "--clear", "--me", "claude")
        cleared = get()
        expect("clear codex keeps comments, flips only status/until",
               r.returncode == 0 and all(c in cleared.splitlines() for c in comments)
               and sum(a != b for a, b in zip(cbase.splitlines(), cleared.splitlines())) == 2
               and len(cbase.splitlines()) == len(cleared.splitlines()))
        expect("retired gemini still refused and file untouched",
               tbus("limit", "gemini", "--me", "claude", "--clear").returncode == 2 and get() == cleared)
        expect("non-lead cannot limit another runtime", tbus("limit", "claude", "--me", "chatgpt", "--clear").returncode == 2)
        expect("bad --until refused", tbus("limit", "claude", "--until", "tomorrow", "--me", "claude").returncode == 2
               and get() == cleared)
        # verify path: same targeted-edit engine, exercised directly (a full probe needs a closed task)
        bus = load(BUS, "tsst_bus_edit")
        out = bus.edit_runtime(live, "codex", {"unverified": [], "caps": ["fs_read", "shell", "fs_write", "git", "image"],
                                               "verified": "2026-10-06"})
        expect("verify-style edit moves cap, bumps date, preserves comments",
               all(c in out.splitlines() for c in comments) and "  unverified: []" in out
               and "  caps: [fs_read, shell, fs_write, git, image]" in out and "  verified: 2026-10-06" in out
               and sum(a != b for a, b in zip(live.splitlines(), out.splitlines())) == 3)
        out = bus.edit_runtime(live, "chatgpt", {"unverified": ["x"]})
        expect("edit_runtime on the last block keeps trailing text", out.endswith("\n") and "  unverified: [x]" in out)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    for t in (test_generator_and_files, test_drift_and_prune, test_hook, test_bus_routing,
              test_runtimes_yaml_comments_preserved):
        t()
    print(f"\n{'all runtime-agent tests passed' if not FAILS else str(len(FAILS)) + ' FAILED'}")
    for f in FAILS:
        print("  " + f)
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
