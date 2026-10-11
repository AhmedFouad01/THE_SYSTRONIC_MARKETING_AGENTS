#!/usr/bin/env python3
"""job_check.py - does a job meet the job standard (rules R18-R20)?

Usage: python TSST/services/delivery/job_check.py <job_folder>
Prints PASS/FAIL per check; exit 1 if any FAIL. Stdlib only. Read-only.

Checks:
 a) job is under TSST/brands/<id>/projects/            (R18)
 b) DELIVERY.json exists and parses                    (R19)
 c) DELIVERY.html + DELIVERY_INTERNAL.html exist, not older than DELIVERY.json (R19)
 d) job named in a project.md of the brand, in the brand status.md, and the
    brand id has an entry in TSST/core/portfolio.yaml  (R20)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # TSST/services/delivery/job_check.py -> repo root
results = []


def check(name, ok, detail=""):
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f" - {detail}" if detail else ""))


def read(path):
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    job = Path(sys.argv[1]).resolve()
    print(f"job: {job}")
    check("job folder exists", job.is_dir())

    # a) location under TSST/brands/<id>/projects/<job...>
    brand, name = None, job.name
    try:
        parts = job.relative_to(ROOT / "TSST" / "brands").parts
        if len(parts) >= 3 and parts[1] == "projects":
            brand, name = parts[0], "/".join(parts[2:])
    except ValueError:
        pass
    check("a) job under TSST/brands/<id>/projects/", brand is not None,
          f"brand={brand}" if brand else "wrong home (R18)")

    # b) manifest
    manifest = job / "DELIVERY.json"
    try:
        json.loads(manifest.read_text(encoding="utf-8"))
        check("b) DELIVERY.json exists and parses", True)
    except (OSError, ValueError) as e:
        check("b) DELIVERY.json exists and parses", False, str(e)[:80])

    # c) built pages, not older than the manifest
    for page in ("DELIVERY.html", "DELIVERY_INTERNAL.html"):
        f = job / page
        if not f.is_file():
            check(f"c) {page} exists", False, "missing")
        elif manifest.is_file() and f.stat().st_mtime < manifest.stat().st_mtime:
            check(f"c) {page} up to date", False, "older than DELIVERY.json - rebuild")
        else:
            check(f"c) {page} exists and up to date", True)

    # d) four-way sync (DELIVERY.json statuses are checked by hand)
    if brand is None:
        check("d) project.md / status.md / portfolio.yaml", False, "brand unknown (see a)")
    else:
        bdir = ROOT / "TSST" / "brands" / brand
        files = list((bdir / "projects").rglob("project.md")) + [bdir / "project.md"]
        in_project = [f for f in files if name in read(f) or job.name in read(f)]
        check("d) job named in a brand project.md", bool(in_project), name)
        status = read(bdir / "status.md")
        check("d) job named in brand status.md", name in status or job.name in status, name)
        portfolio = read(ROOT / "TSST" / "core" / "portfolio.yaml")
        check("d) brand has entry in core/portfolio.yaml",
              re.search(rf"^\s+{re.escape(brand)}:", portfolio, re.M) is not None, brand)

    ok = all(results)
    print("RESULT: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
