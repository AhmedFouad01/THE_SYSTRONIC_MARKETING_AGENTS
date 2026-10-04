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
    open(os.path.join(bus, "log.tsv"), "w").close()
    os.makedirs(os.path.join(root, "docs"))
    os.makedirs(os.path.join(root, "out"))
    write(root, "docs/spec.md", "spec")
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


NEW = ["--spec", "docs/spec.md", "--done-when", "d", "--title", "t"]


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
                                      "--write", "out/*.md", "--after", "P-1"), True)
        expect("wrong addressee", run(R, "claim", "P-1", "--me", "codex"), False)
        expect("unverified cap + after", run(R, "claim", "W-1", "--me", "gemini"), False)
        expect("probe may use unverified", run(R, "claim", "P-1", "--me", "gemini"), True)
        expect("note size cap", run(R, "progress", "P-1", "--me", "gemini", "--note", "x" * 250), False)
        expect("release with resume", run(R, "release", "P-1", "--me", "gemini", "--note", "next: write"), True)
        run(R, "limit", "gemini", "--me", "gemini", "--until", "2099-01-01T00:00Z")
        expect("limited runtime cannot claim", run(R, "claim", "P-1", "--me", "gemini"), False)
        expect("other runtime cannot set limit", run(R, "limit", "gemini", "--me", "codex", "--clear"), False)
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
        run(R, "new", "W-2", "--me", "claude", *NEW, "--write", "out/b.md")
        expect("overlapping write scope locked", run(R, "claim", "W-2", "--me", "claude"), False)
        run(R, "new", "S-1", "--me", "claude", *NEW, "--write", "docs/s.md")
        run(R, "claim", "S-1", "--me", "claude")
        write(R, "docs/s.md", "self")
        run(R, "done", "S-1", "--me", "claude", "--result", "docs/s.md")
        expect("no self-acceptance", run(R, "close", "S-1", "--me", "claude"), False)
        run(R, "new", "M-1", "--me", "claude", *NEW, "--tier", "FAST", "--write", "docs/m.md")
        out = run(R, "claim", "M-1", "--me", "claude", "--model", "opus")
        expect("claim prints tier model + warns on mismatch",
               "" if "run on: subagent tsst-fast-worker" in out and "WARN running on opus" in out else "REFUSED", True)
        out = run(R, "check")
        expect("check clean", "REFUSED" if "bus OK" not in out else "", True)
    finally:
        shutil.rmtree(R, ignore_errors=True)
    print(f"\n{'all bus tests passed' if not FAILS else str(len(FAILS)) + ' FAILED'}")
    for f in FAILS:
        print("  " + f)
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
