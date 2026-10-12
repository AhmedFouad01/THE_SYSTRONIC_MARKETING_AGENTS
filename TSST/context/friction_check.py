#!/usr/bin/env python3
"""Surface repeated skill friction as lesson CANDIDATE lines (read-only, stdlib only).

Reads TSST/core/friction-log.md, groups rows by skill_id + explicit gap ID (when present), otherwise normalised friction text, and prints a
lessons.md-format candidate line for every group seen in >= 2 distinct tasks. The next free L-id comes from
TSST/core/lessons.md. Never writes to lessons.md or any skill; the Lead/user still approve
(lessons.md promotion_gate).

Run:  python TSST/context/friction_check.py [--path LOG] [--lessons LESSONS]
Exit: 0 = report printed (even with no candidates); 1 = malformed row or unreadable file.
"""
import argparse
import datetime
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_LOG = ROOT / "TSST" / "core" / "friction-log.md"
DEFAULT_LESSONS = ROOT / "TSST" / "core" / "lessons.md"
COLUMNS = ["date", "team", "skill_id", "friction", "task"]
SKILL_RE = re.compile(r"^TSST-[A-Z]+-SK-\d{3}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
NOT_FRICTION = {"", "none", "n/a", "n-a", "na", "-"}
THRESHOLD = 2
GAP_RE = re.compile(r"^\[gap:([a-z][a-z0-9-]*)\](?:\s|$)")
DATED_RECORD_RE = re.compile(r"^(?:[-*+]\s+)?\d{4}-")


def norm(text):
    return re.sub(r"\s+", " ", text).strip().lower()


def split_row(line):
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    return [c.strip() for c in s.split("|")]


def parse(text):
    """Return (rows, errors). rows = list of dicts; errors = list of 'line N: reason'."""
    rows, errors = [], []
    fence = None
    for n, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        opening = re.match(r"^(`{3,}|~{3,})", stripped)
        if opening:
            token = opening.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence):
                fence = None
            continue
        if fence:
            continue  # clearly fenced historical originals/examples are inactive
        if not stripped.startswith("|"):
            if DATED_RECORD_RE.match(stripped):
                errors.append(f"line {n}: dated record outside five-column table schema")
            continue
        cells = split_row(line)
        if [c.lower() for c in cells] == COLUMNS:
            continue
        if all(re.fullmatch(r":?-{3,}:?", c) for c in cells):
            continue
        if len(cells) != len(COLUMNS):
            errors.append(f"line {n}: expected {len(COLUMNS)} columns, got {len(cells)}")
            continue
        row = dict(zip(COLUMNS, cells))
        row["line"] = n
        try:
            if not DATE_RE.match(row["date"]):
                raise ValueError
            datetime.date.fromisoformat(row["date"])
        except ValueError:
            errors.append(f"line {n}: bad date {row['date']!r} (want YYYY-MM-DD)")
            continue
        if not SKILL_RE.match(row["skill_id"]):
            errors.append(f"line {n}: bad skill_id {row['skill_id']!r} (want TSST-<TEAM>-SK-NNN)")
            continue
        if norm(row["friction"]) in NOT_FRICTION:
            errors.append(f"line {n}: friction is empty/none/n-a - only real friction is logged")
            continue
        if not row["team"] or norm(row["task"]) in NOT_FRICTION:
            errors.append(f"line {n}: team and task must be nonempty identifiers")
            continue
        gap = GAP_RE.match(row["friction"])
        if row["friction"].startswith("[gap:") and gap is None:
            errors.append(f"line {n}: malformed explicit gap ID (want [gap:lowercase-slug])")
            continue
        row["gap_id"] = gap.group(1) if gap else None
        rows.append(row)
    if fence:
        errors.append("unclosed fenced history/example block; active records may be hidden")
    return rows, errors


def next_lesson_id(lessons_text):
    ids = [int(m) for m in re.findall(r"^\|\s*L-(\d+)\s*\|", lessons_text, re.M)]
    return (max(ids) if ids else 0) + 1


def candidates(rows):
    groups = {}
    for r in rows:
        key = (r["skill_id"], ("gap", r["gap_id"]) if r.get("gap_id") else ("text", norm(r["friction"])))
        # Repeated records from one task are one observation, even on different dates.
        groups.setdefault(key, {}).setdefault(norm(r["task"]), r)
    return [list(g.values()) for g in groups.values() if len(g) >= THRESHOLD]


def candidate_line(lid, group):
    first = group[0]
    friction = (f"[gap:{first['gap_id']}] explicit gap repeats; review all task evidence" if first.get("gap_id")
                else re.sub(r"\s+", " ", first["friction"]).strip())
    tasks = ", ".join(r["task"] for r in group)
    dates = sorted(r["date"] for r in group)
    evidence = f"friction-log x{len(group)} ({dates[0]}..{dates[-1]}; tasks: {tasks})"
    return f"| L-{lid:03d} | CANDIDATE | {first['skill_id']}: {friction} | {evidence} | — |"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--path", type=Path, default=DEFAULT_LOG, help="friction log to read")
    ap.add_argument("--lessons", type=Path, default=DEFAULT_LESSONS, help="lessons.md (for next L-id)")
    args = ap.parse_args(argv)
    try:
        log_text = args.path.read_text(encoding="utf-8")
        lessons_text = args.lessons.read_text(encoding="utf-8")
    except OSError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    rows, errors = parse(log_text)
    if errors:
        for e in errors:
            print(f"MALFORMED {args.path.name} {e}", file=sys.stderr)
        return 1
    groups = candidates(rows)
    print(f"friction rows: {len(rows)} | repeated (>= {THRESHOLD} distinct tasks): {len(groups)}")
    gaps = {}
    for row in rows:
        if row.get("gap_id"):
            gaps.setdefault((row["skill_id"], row["gap_id"]), set()).add(norm(row["task"]))
    for (skill, gap), tasks in sorted(gaps.items()):
        print(f"GAP {gap} | skill={skill} | distinct tasks={len(tasks)} | evidence only; closure not inferred")
    lid = next_lesson_id(lessons_text)
    for g in groups:
        print(candidate_line(lid, g))
        lid += 1
    if groups:
        print("Suggested only - add to lessons.md after Lead/user approval (promotion_gate).")
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    sys.exit(main())
