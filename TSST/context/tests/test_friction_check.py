#!/usr/bin/env python3
"""Tests for TSST/context/friction_check.py using temp files only (stdlib only).

Run: python TSST/context/tests/test_friction_check.py   (never touches the live friction log or lessons.md)
"""
import os
import shutil
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SCRIPT = os.path.join(REPO, "TSST", "context", "friction_check.py")
FAILS = []

HEADER = ("# log\n\n| date | team | skill_id | friction | task |\n"
          "|------|------|----------|----------|------|\n")
LESSONS = ("| id | status | lesson | evidence | folded into |\n|----|----|----|----|----|\n"
           "| L-001 | ACCEPTED | a | b | c |\n| L-007 | CANDIDATE | d | e | — |\n")


def expect(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        FAILS.append(name)


def run(tmp, log_text, lessons_text=LESSONS):
    log = os.path.join(tmp, "friction-log.md")
    les = os.path.join(tmp, "lessons.md")
    with open(log, "w", encoding="utf-8") as f:
        f.write(log_text)
    with open(les, "w", encoding="utf-8") as f:
        f.write(lessons_text)
    return subprocess.run([sys.executable, SCRIPT, "--path", log, "--lessons", les],
                          capture_output=True, text=True, encoding="utf-8")


def main():
    tmp = tempfile.mkdtemp(prefix="tsst-friction-")
    try:
        r = run(tmp, HEADER)
        expect("empty log: exit 0, no candidate", r.returncode == 0 and "CANDIDATE" not in r.stdout)

        one = HEADER + "| 2026-10-09 | build | TSST-DEV-SK-011 | no fixture guidance | T-1 |\n"
        r = run(tmp, one)
        expect("single entry: exit 0, no suggestion", r.returncode == 0 and "CANDIDATE" not in r.stdout)

        rep = one + "| 2026-10-10 | build | TSST-DEV-SK-011 |  No  FIXTURE   guidance | T-2 |\n"
        r = run(tmp, rep)
        lines = [l for l in r.stdout.splitlines() if "CANDIDATE" in l]
        expect("repeat (case/whitespace-normalised): exit 0, one suggestion", r.returncode == 0 and len(lines) == 1)
        expect("suggestion uses next free L-id (L-008)", bool(lines) and lines[0].startswith("| L-008 | CANDIDATE |"))
        expect("suggestion names skill and both tasks",
               bool(lines) and "TSST-DEV-SK-011" in lines[0] and "T-1" in lines[0] and "T-2" in lines[0])

        diff_skill = one + "| 2026-10-10 | build | TSST-DEV-SK-015 | no fixture guidance | T-2 |\n"
        r = run(tmp, diff_skill)
        expect("same text, different skill: no suggestion", r.returncode == 0 and "CANDIDATE" not in r.stdout)

        les_path = os.path.join(tmp, "lessons.md")
        run(tmp, rep)
        with open(les_path, encoding="utf-8") as f:
            expect("lessons.md untouched (read-only)", f.read() == LESSONS)

        bad = {
            "wrong column count": HEADER + "| 2026-10-09 | build | TSST-DEV-SK-011 | only four |\n",
            "bad date": HEADER + "| 09-10-2026 | build | TSST-DEV-SK-011 | x | T-1 |\n",
            "impossible date": HEADER + "| 2026-13-40 | build | TSST-DEV-SK-011 | x | T-1 |\n",
            "bad skill_id": HEADER + "| 2026-10-09 | build | dev-sk-11 | x | T-1 |\n",
            "friction none": HEADER + "| 2026-10-09 | build | TSST-DEV-SK-011 | none | T-1 |\n",
            "friction n/a": HEADER + "| 2026-10-09 | build | TSST-DEV-SK-011 | n/a | T-1 |\n",
        }
        for name, text in bad.items():
            r = run(tmp, text)
            expect(f"malformed ({name}): exit 1", r.returncode == 1 and "MALFORMED" in r.stderr)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    live = subprocess.run([sys.executable, SCRIPT], capture_output=True, text=True, encoding="utf-8")
    expect("live (default paths) log parses clean, exit 0", live.returncode == 0)
    print(f"\n{'all friction_check tests passed' if not FAILS else str(len(FAILS)) + ' FAILED'}")
    for f in FAILS:
        print("  " + f)
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
