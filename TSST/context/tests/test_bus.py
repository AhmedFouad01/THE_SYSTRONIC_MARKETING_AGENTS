#!/usr/bin/env python3
"""Negative/positive regression tests for TSST/bus/bus.py on a throwaway copy (stdlib only).

Run: python TSST/context/tests/test_bus.py   (never touches the live bus)
"""
import os
import shutil
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
FAILS = []


def setup():
    root = tempfile.mkdtemp(prefix="tsst-bus-")
    bus = os.path.join(root, "TSST", "bus")
    for d in ("tasks", "closed", "out"):
        os.makedirs(os.path.join(bus, d))
    for f in ("bus.py", "runtimes.yaml"):
        shutil.copy(os.path.join(REPO, "TSST", "bus", f), bus)
    # gemini is retired in the live registry (ADR-004); these protocol tests use it as a generic second runtime
    rp = os.path.join(bus, "runtimes.yaml")
    with open(rp, encoding="utf-8") as fh:
        txt = fh.read()
    assert "status: retired" in txt
    with open(rp, "w", encoding="utf-8", newline=NL) as fh:
        fh.write(txt.replace("status: retired", "status: available"))
    os.makedirs(os.path.join(root, "TSST", "context"))
    shutil.copy(os.path.join(REPO, "TSST", "context", "roster.yaml"), os.path.join(root, "TSST", "context"))
    open(os.path.join(bus, "log.tsv"), "w").close()
    os.makedirs(os.path.join(root, "docs"))
    os.makedirs(os.path.join(root, "out"))
    write(root, "docs/spec.md", "spec")
    # team + skills fixtures (bus.py checks they exist in the repo root)
    for team in ("marketing", "studio", "build"):
        os.makedirs(os.path.join(root, "TSST", "teams", team))
        write(root, f"TSST/teams/{team}/team.md", team)
    os.makedirs(os.path.join(root, "TSST", "skills"))   # central skill index (bus validates skills against it)
    shutil.copy(os.path.join(REPO, "TSST", "skills", "index.yaml"), os.path.join(root, "TSST", "skills"))
    os.makedirs(os.path.join(root, SKILL))
    write(root, SKILL + "/SKILL.md", "skill")
    os.makedirs(os.path.join(root, SKILL2))
    write(root, SKILL2 + "/SKILL.md", "skill2")
    return root


def write(root, rel, text):
    with open(os.path.join(root, rel), "w", encoding="utf-8") as f:
        f.write(text)


def run(root, *args):
    r = subprocess.run([sys.executable, "TSST/bus/bus.py", *args], cwd=root,
                       capture_output=True, text=True, encoding="utf-8")
    return r.stdout + r.stderr


def expect(name, out, ok):
    good = ("REFUSED" not in out) if ok else ("REFUSED" in out)
    if not good:
        FAILS.append(f"{name}: {out.strip()[:160]}")
    print(f"{'PASS' if good else 'FAIL'} {name}")


SKILL = "TSST/CREATIVE/skills/tsst-creative-sk-010-visual-qa-brand-compliance"
SKILL2 = "TSST/CREATIVE/skills/tsst-creative-sk-004-visual-hierarchy-layout"
NEW = ["--spec", "docs/spec.md", "--done-when", "d", "--title", "t"]
TS = ["--team", "studio", "--skills", SKILL]      # team + skills for work/review tasks
NL = chr(10)
USED = ["--skills-used", "tsst-creative-sk-010"]


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    R = setup()
    try:
        expect("non-lead cannot issue", run(R, "new", "X-1", "--me", "gemini", *NEW), False)
        expect("protected write scope refused", run(R, "new", "X-1", "--me", "claude", *NEW, "--write", "TSST/context/boot.md"), False)
        expect("bus internals protected", run(R, "new", "X-1", "--me", "claude", *NEW, "--write", "TSST/bus/tasks/"), False)
        expect("outside repo refused", run(R, "new", "X-1", "--me", "claude", *NEW, "--write", "../x"), False)
        expect("DEEP never queued", run(R, "new", "X-1", "--me", "claude", *NEW, "--tier", "DEEP"), False)
        expect("id traversal refused", run(R, "new", "../out/ESCAPE", "--me", "claude", *NEW), False)
        expect("no file escaped", "ESCAPE" if os.path.exists(os.path.join(R, "TSST/bus/out/ESCAPE.yaml")) else "REFUSED", False)

        expect("issue probe", run(R, "new", "P-1", "--me", "claude", *NEW, "--kind", "probe", "--to", "gemini",
                                  "--needs", "fs_read,drive_docs_read", "--write", "out/a.md"), True)
        expect("issue dependent", run(R, "new", "W-1", "--me", "claude", *NEW, "--needs", "drive_docs_read",
                                      "--write", "out/*.md", "--after", "P-1", *TS), True)
        expect("wrong addressee", run(R, "claim", "P-1", "--me", "codex"), False)
        expect("unverified cap + after", run(R, "claim", "W-1", "--me", "gemini"), False)
        expect("probe may use unverified", run(R, "claim", "P-1", "--me", "gemini"), True)
        expect("note size cap", run(R, "progress", "P-1", "--me", "gemini", "--note", "x" * 250), False)
        expect("release with resume", run(R, "release", "P-1", "--me", "gemini", "--note", "next: write"), True)
        run(R, "limit", "gemini", "--me", "gemini", "--until", "2099-01-01T00:00Z")
        expect("limited runtime cannot claim", run(R, "claim", "P-1", "--me", "gemini"), False)
        expect("other runtime cannot set limit", run(R, "limit", "gemini", "--me", "chatgpt", "--clear"), False)
        run(R, "limit", "gemini", "--me", "gemini", "--clear")
        expect("reclaim after limit", run(R, "claim", "P-1", "--me", "gemini"), True)
        write(R, "docs/other.md", "x")
        expect("result outside scope", run(R, "done", "P-1", "--me", "gemini", "--result", "docs/other.md"), False)
        write(R, "out/a.md", "export")
        expect("done", run(R, "done", "P-1", "--me", "gemini", "--result", "out/a.md"), True)
        expect("verify before close refused", run(R, "verify", "gemini", "drive_docs_read", "--me", "claude", "--evidence", "P-1"), False)
        write(R, "out/a.md", "tampered")
        expect("tampered result not closable", run(R, "close", "P-1", "--me", "claude"), False)
        expect("reopen = round 1", run(R, "reopen", "P-1", "--me", "claude", "--note", "redo"), True)
        run(R, "claim", "P-1", "--me", "gemini")
        run(R, "done", "P-1", "--me", "gemini", "--result", "out/a.md")
        out = run(R, "reopen", "P-1", "--me", "claude", "--note", "again")
        expect("round 2 escalates", "REFUSED" if "escalate" in out else "missing escalate", False)
        expect("escalated needs user", run(R, "reopen", "P-1", "--me", "claude", "--note", "x"), False)
        run(R, "reopen", "P-1", "--me", "claude", "--note", "user ok", "--user-approved")
        run(R, "claim", "P-1", "--me", "gemini")
        run(R, "done", "P-1", "--me", "gemini", "--result", "out/a.md")
        expect("close", run(R, "close", "P-1", "--me", "claude"), True)
        expect("verify needs real evidence", run(R, "verify", "gemini", "drive_docs_read", "--me", "claude", "--evidence", "NOPE-1"), False)
        expect("verify cap not exercised", run(R, "verify", "gemini", "image", "--me", "claude", "--evidence", "P-1"), False)
        expect("verify ok", run(R, "verify", "gemini", "drive_docs_read", "--me", "claude", "--evidence", "P-1"), True)
        run(R, "verify", "gemini", "fs_write", "--me", "claude", "--evidence", "P-1")

        expect("dependent now claimable", run(R, "claim", "W-1", "--me", "gemini"), True)
        run(R, "new", "W-2", "--me", "claude", *NEW, *TS, "--write", "out/b.md")
        expect("overlapping write scope locked", run(R, "claim", "W-2", "--me", "claude"), False)
        run(R, "new", "S-1", "--me", "claude", *NEW, *TS, "--write", "docs/s.md")
        run(R, "claim", "S-1", "--me", "claude")
        write(R, "docs/s.md", "self")
        run(R, "done", "S-1", "--me", "claude", "--result", "docs/s.md", *USED)
        expect("no self-acceptance", run(R, "close", "S-1", "--me", "claude"), False)
        run(R, "new", "M-1", "--me", "claude", *NEW, *TS, "--tier", "FAST", "--write", "docs/m.md")
        out = run(R, "claim", "M-1", "--me", "claude", "--model", "opus")
        expect("claim prints tier model + warns on mismatch",
               "" if "run on: haiku · low" in out and "WARN running on opus" in out else "REFUSED", True)
        expect("claim prints AGENT + RUN ON (studio -> tsst-creative)",
               "" if "AGENT: tsst-creative" in out and "RUN ON: haiku · low" in out else "REFUSED", True)
        # --- team + skills rule (bus.md rule 9)
        expect("work without team refused", run(R, "new", "T-1", "--me", "claude", *NEW, "--skills", SKILL), False)
        expect("work without skills refused", run(R, "new", "T-1", "--me", "claude", *NEW, "--team", "studio"), False)
        expect("nonexistent skill refused", run(R, "new", "T-1", "--me", "claude", *NEW, "--team", "studio",
                                                "--skills", "TSST/CREATIVE/skills/nope"), False)
        expect("unknown team refused", run(R, "new", "T-1", "--me", "claude", *NEW, "--team", "wizards", "--skills", SKILL), False)
        expect("review without team refused", run(R, "new", "T-1", "--me", "claude", *NEW, "--kind", "review"), False)
        expect("probe needs no team", run(R, "new", "T-2", "--me", "claude", *NEW, "--kind", "probe", "--write", "out/p.md"), True)
        run(R, "new", "T-3", "--me", "claude", *NEW, "--team", "studio", "--skills", f"{SKILL},{SKILL2}", "--write", "docs/t3.md")
        out = run(R, "claim", "T-3", "--me", "gemini")
        expect("claim prints LOAD BEFORE WORK", "" if "LOAD BEFORE WORK" in out and "TSST/teams/studio/team.md" in out
               and SKILL in out and "FINAL_ASSET_GATE.md" in out else "REFUSED", True)
        expect("claim prints AGENT for studio task on other runtime", "" if "AGENT: tsst-creative" in out else "REFUSED", True)
        write(R, "docs/t3.md", "work")
        expect("done without --skills-used refused", run(R, "done", "T-3", "--me", "gemini", "--result", "docs/t3.md"), False)
        expect("done with a listed skill missing refused",
               run(R, "done", "T-3", "--me", "gemini", "--result", "docs/t3.md", *USED), False)
        expect("done citing path + id ok", run(R, "done", "T-3", "--me", "gemini", "--result", "docs/t3.md",
                                               "--skills-used", f"{SKILL}, tsst-creative-sk-004"), True)
        # a done task whose skills_used was stripped must not be closable
        tp = os.path.join(R, "TSST/bus/tasks/T-3.yaml")
        with open(tp, encoding="utf-8") as f:
            txt = f.read()
        write(R, "TSST/bus/tasks/T-3.yaml", NL.join(l for l in txt.splitlines() if not l.startswith("skills_used")) + NL)
        expect("close without skills_used refused", run(R, "close", "T-3", "--me", "claude"), False)
        expect("check flags missing skills_used", "" if "needs skills_used" in run(R, "check") else "REFUSED", True)
        write(R, "TSST/bus/tasks/T-3.yaml", txt)
        expect("close with skills_used", run(R, "close", "T-3", "--me", "claude"), True)
        out = run(R, "check")
        expect("check clean", "REFUSED" if "bus OK" not in out else "", True)
        # --- rehash (Lead re-records the hash of a done task's result after a verified edit)
        run(R, "new", "H-1", "--me", "claude", *NEW, "--kind", "probe", "--to", "gemini", "--write", "docs/h.md")
        expect("rehash on ready task refused", run(R, "rehash", "H-1", "--me", "claude", "--note", "n"), False)
        run(R, "claim", "H-1", "--me", "gemini")
        write(R, "docs/h.md", "original")
        run(R, "done", "H-1", "--me", "gemini", "--result", "docs/h.md")
        logp = os.path.join(R, "TSST/bus/log.tsv")
        log_lines = lambda: open(logp, encoding="utf-8").read().splitlines()
        expect("rehash matching hash is a no-op", run(R, "rehash", "H-1", "--me", "claude", "--note", "n"), True)
        expect("no-op writes no log line", "" if not any("	rehash	" in l for l in log_lines()) else "REFUSED", True)
        write(R, "docs/h.md", "edited by lead")
        expect("check flags edited result", "" if "H-1: result sha256 mismatch" in run(R, "check") else "REFUSED", True)
        n0 = len(log_lines())
        expect("non-lead rehash refused", run(R, "rehash", "H-1", "--me", "gemini", "--note", "n"), False)
        expect("rehash with blank note refused", run(R, "rehash", "H-1", "--me", "claude", "--note", "  "), False)
        expect("rehash unknown task refused", run(R, "rehash", "NOPE-1", "--me", "claude", "--note", "n"), False)
        expect("refusals write no log line", "" if len(log_lines()) == n0 else "REFUSED", True)
        expect("lead rehash ok", run(R, "rehash", "H-1", "--me", "claude", "--note", "lead edit verified"), True)
        last = log_lines()[-1].split("	")
        expect("rehash logged (event + old->new + note)",
               "" if len(last) == 5 and last[1:4] == ["H-1", "claude", "rehash"] and "->" in last[4]
               and "lead edit verified" in last[4] else "REFUSED", True)
        expect("check has no mismatch after rehash",
               "" if "H-1: result sha256 mismatch" not in run(R, "check") else "REFUSED", True)
        n1 = len(log_lines())
        expect("second rehash is a no-op", run(R, "rehash", "H-1", "--me", "claude", "--note", "again"), True)
        expect("second rehash logs nothing", "" if len(log_lines()) == n1 else "REFUSED", True)
    finally:
        shutil.rmtree(R, ignore_errors=True)
    print(f"\n{'all bus tests passed' if not FAILS else str(len(FAILS)) + ' FAILED'}")
    for f in FAILS:
        print("  " + f)
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
