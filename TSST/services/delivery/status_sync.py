#!/usr/bin/env python3
"""Derived status mirrors for R20; DELIVERY.json is the sole status source.

Markdown: <!-- TSST_JOB_SYNC {JSON object} -->
YAML:     # TSST_JOB_SYNC {JSON object}
JSON fields: version=1, brand, job (relative to brand/projects), status, source
(repository-relative DELIVERY.json path), manifest_sha256 (raw source bytes).
Comments must stand alone outside fenced examples. Exact identity, status and
hash verify structured status only; contradictory narrative still needs review.

Usage: python status_sync.py BRAND [--write] [--dry-run]
Default/dry-run prints planned changes. --write refreshes derived comments only.
Uses the nearest existing ancestor project.md, then brand/project.md; never
creates a project/status/portfolio pointer. Malformed/duplicate markers fail.
"""
import argparse
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[3]
# build_delivery.ST_CLS vocabulary, without importing the rendering engine.
STATUSES = frozenset({"approved", "review", "production", "published", "rejected", "progress", "noted", "draft"})
TOKEN = "TSST_JOB_SYNC"
MARKER_RE = re.compile(r"^(?:<!-- TSST_JOB_SYNC (.+) -->|# TSST_JOB_SYNC (.+))$")


def read(path):
    return path.read_bytes().decode("utf-8")


def manifest_evidence(job, root=ROOT):
    job, root = Path(os.path.abspath(job)), Path(root).resolve()  # TSST/brands may be a folder link (R48)
    parts = job.relative_to(root / "TSST/brands").parts
    if len(parts) < 3 or parts[1] != "projects":
        raise ValueError("job must be under TSST/brands/<brand>/projects/")
    manifest = job / "DELIVERY.json"
    raw = manifest.read_bytes()
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("status"), str) or data["status"] not in STATUSES:
        raise ValueError("DELIVERY.json requires a known status: " + ", ".join(sorted(STATUSES)))
    return {"version": 1, "brand": parts[0], "job": "/".join(parts[2:]), "status": data["status"],
            "source": manifest.relative_to(root).as_posix(), "manifest_sha256": hashlib.sha256(raw).hexdigest()}


def project_for(job, brand_dir):
    current, stop = Path(job), Path(brand_dir) / "projects"
    while current != stop and current.is_relative_to(stop):
        candidate = current / "project.md"
        if candidate.is_file():
            return candidate
        current = current.parent
    fallback = Path(brand_dir) / "project.md"
    if fallback.is_file():
        return fallback
    raise ValueError("missing existing ancestor project.md or brand/project.md")


def surfaces(job, root=ROOT):
    evidence = manifest_evidence(job, root)
    brand_dir = Path(root) / "TSST/brands" / evidence["brand"]
    return (project_for(job, brand_dir), brand_dir / "status.md", Path(root) / "TSST/core/portfolio.yaml")


def markers(text):
    """Return (line index, object) records; fail on malformed active markers."""
    records, fence = [], None
    for index, line in enumerate(text.splitlines()):
        stripped = line.strip()
        opening = re.match(r"^(`{3,}|~{3,})", stripped)
        if opening:
            token = opening.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence):
                fence = None
            continue
        if fence or TOKEN not in stripped:
            continue
        match = MARKER_RE.fullmatch(stripped)
        if not match:
            raise ValueError(f"line {index + 1}: malformed {TOKEN} comment")
        try:
            data = json.loads(match.group(1) or match.group(2))
        except ValueError as exc:
            raise ValueError(f"line {index + 1}: malformed {TOKEN} JSON") from exc
        if not isinstance(data, dict) or not isinstance(data.get("brand"), str) or not isinstance(data.get("job"), str):
            raise ValueError(f"line {index + 1}: marker must contain brand/job string identity")
        records.append((index, data))
    if fence:
        raise ValueError("unclosed fenced example/history block may hide status markers")
    return records


def target_records(text, expected):
    return [(index, data) for index, data in markers(text)
            if (data["brand"], data["job"]) == (expected["brand"], expected["job"])]


def verify_surface(path, expected):
    try:
        matches = target_records(read(path), expected)
    except (OSError, UnicodeError, ValueError) as exc:
        return False, str(exc)
    if len(matches) != 1:
        return False, f"expected one exact job marker, found {len(matches)}"
    actual = matches[0][1]
    mismatches = sorted(k for k in expected if type(actual.get(k)) is not type(expected[k]) or actual.get(k) != expected[k])
    if set(actual) != set(expected):
        mismatches.append("schema fields")
    return not mismatches, "matches current manifest identity/status/hash" if not mismatches else "mismatch: " + ", ".join(mismatches)


def replace_marker(text, expected, yaml=False):
    matches = target_records(text, expected)
    if len(matches) > 1:
        raise ValueError("duplicate exact job markers; resolve before sync")
    payload = json.dumps(expected, sort_keys=True, separators=(",", ":"))
    marker = "# TSST_JOB_SYNC " + payload if yaml else "<!-- TSST_JOB_SYNC " + payload + " -->"
    newline = "\r\n" if "\r\n" in text else "\n"
    if matches:
        lines = text.splitlines(keepends=True)
        index = matches[0][0]
        ending = "\r\n" if lines[index].endswith("\r\n") else "\n" if lines[index].endswith("\n") else ""
        lines[index] = marker + ending
        return "".join(lines)
    return text + ("" if not text or text.endswith("\n") else newline) + marker + newline


def plan_brand(brand, root=ROOT):
    """Prepare all edits first. Missing/malformed evidence aborts before any write."""
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", brand):
        raise ValueError("invalid brand ID")
    root = Path(root).resolve()
    project_dir = root / "TSST/brands" / brand / "projects"
    if not project_dir.is_dir():
        raise ValueError("missing brand projects directory")
    original, planned = {}, {}
    for manifest in sorted(project_dir.rglob("DELIVERY.json")):
        job = manifest.parent
        expected = manifest_evidence(job, root)
        for path in surfaces(job, root):
            if path not in original:
                original[path] = read(path)  # never fabricate missing pointers
                planned[path] = original[path]
            planned[path] = replace_marker(planned[path], expected, yaml=path.suffix == ".yaml")
    return {path: (original[path], text) for path, text in planned.items() if text != original[path]}


def sync_brand(brand, root=ROOT, write=False):
    changes = plan_brand(brand, root)
    for path, (before, after) in changes.items():
        if write:
            path.write_bytes(after.encode("utf-8"))
        else:
            print("".join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                            fromfile=str(path), tofile=str(path))), end="")
    return changes


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("brand")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    try:
        changes = sync_brand(args.brand, write=args.write)
    except (OSError, UnicodeError, ValueError) as exc:
        print("FAIL status mirrors: " + str(exc), file=sys.stderr)
        return 1
    print(f"{'wrote' if args.write else 'dry-run'} {len(changes)} derived status mirror file(s); narrative review separate")
    return 0


if __name__ == "__main__":
    sys.exit(main())
