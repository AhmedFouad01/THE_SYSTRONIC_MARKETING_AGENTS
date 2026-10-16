#!/usr/bin/env python3
"""Read-only job structure and derived status consistency checks (R18-R20).

Usage: python TSST/services/delivery/job_check.py <job_folder> [--structure-only]
Default requires exact TSST_JOB_SYNC comments in the nearest existing ancestor
project.md (or brand/project.md), brand/status.md and core/portfolio.yaml. Their
version/brand/job/status/source/SHA256 must match the authoritative DELIVERY.json.
Normal sync_jobs.py refreshes these derived snapshots via status_sync.py.
JOBS.md must contain exactly one job row with the same known manifest status.

PASS verifies structured_status_sync only; narrative review is separate. Page
freshness uses mtime only and does not prove rendering/content correctness.
Legacy --structure-only checks name mentions and emits STRUCTURE_PASS with
SEMANTIC_SYNC_UNVERIFIED; it never asserts full R20 semantic consistency.
Missing/unknown manifest status fails in both modes. Exit 1 on any failure.
"""
import argparse
import json
import re
import sys
from pathlib import Path
import status_sync

ROOT = Path(__file__).resolve().parents[3]  # TSST/services/delivery/job_check.py -> repo root
results = []
LAYOUT_FILE = re.compile(r"^0[0-8]b?_[A-Z0-9_]+\.(md|csv)$")
LAYOUT_DIRS = {"files", "work", "observations"}


def check(name, ok, detail=""):
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f" - {detail}" if detail else ""))


def read(path):
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("job_folder", type=Path)
    parser.add_argument("--structure-only", action="store_true")
    args = parser.parse_args(argv)
    results.clear()
    job = args.job_folder.resolve()
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
    expected = None
    status = None
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
        check("b) DELIVERY.json exists and parses as object", isinstance(data, dict))
        status = data.get("status") if isinstance(data, dict) else None
        valid_status = isinstance(status, str) and status in status_sync.STATUSES
        check("b) manifest has known explicit status", valid_status, repr(status))
        if brand is not None and valid_status:
            expected = status_sync.manifest_evidence(job, ROOT)
    except (OSError, UnicodeError, ValueError) as e:
        check("b) DELIVERY.json exists and parses", False, str(e)[:160])

    # c) built pages, not older than the manifest
    for page in ("DELIVERY.html", "DELIVERY_INTERNAL.html"):
        f = job / page
        if not f.is_file():
            check(f"c) {page} exists", False, "missing")
        elif manifest.is_file() and f.stat().st_mtime < manifest.stat().st_mtime:
            check(f"c) {page} up to date", False, "older than DELIVERY.json - rebuild")
        else:
            check(f"c) {page} exists and mtime >= manifest (content unverified)", True)

    # d) Legacy presence checks are structural, never semantic evidence.
    if brand is None:
        check("d) project.md / status.md / portfolio.yaml", False, "brand unknown (see a)")
    else:
        bdir = ROOT / "TSST" / "brands" / brand
        files = list((bdir / "projects").rglob("project.md")) + [bdir / "project.md"]
        in_project = [f for f in files if name in read(f) or job.name in read(f)]
        check("d) job named in a brand project.md", bool(in_project), name)
        status_text = read(bdir / "status.md")
        check("d) job named in brand status.md", name in status_text or job.name in status_text, name)
        # R43 soft guard: brand status.md = current state only (<=250 words). Warn, never fail.
        status_words = sum(len(line.split()) for line in status_text.splitlines()
                           if not status_sync.MARKER_RE.fullmatch(line.strip()))
        if status_words > 300:
            print(f"WARN  d) brand status.md {status_words} words > 300 (R43: current state only, <=250)")
        portfolio = read(ROOT / "TSST" / "core" / "portfolio.yaml")
        check("d) brand has entry in core/portfolio.yaml",
              re.search(rf"^\s+{re.escape(brand)}:", portfolio, re.M) is not None, brand)

    if args.structure_only:
        print("INFO  SEMANTIC_SYNC_UNVERIFIED (--structure-only; narrative review separate)")
    elif expected is None:
        check("d) structured_status_sync", False, "SEMANTIC_SYNC_UNVERIFIED: valid manifest identity/status required")
    else:
        try:
            mirrors = status_sync.surfaces(job, ROOT)
        except (OSError, UnicodeError, ValueError) as exc:
            check("d) structured_status_sync", False, "SEMANTIC_SYNC_UNVERIFIED: " + str(exc))
        else:
            for surface in mirrors:
                valid, detail = status_sync.verify_surface(surface, expected)
                check("d) structured_status_sync " + surface.relative_to(ROOT).as_posix(), valid,
                      detail if valid else "SEMANTIC_SYNC_UNVERIFIED: " + detail)
        print("INFO  structured markers compare identity/status/source/hash only; narrative review separate")

    # e) layout (JOB_LAYOUT.md)
    check("e) README.md exists", (job / "README.md").is_file(),
          "" if (job / "README.md").is_file() else "missing - start-here file")
    top = sorted(job.iterdir(), key=lambda f: f.name) if job.is_dir() else []
    bad = [f.name for f in top if f.is_file() and f.name != "README.md"
           and not f.name.startswith("DELIVERY") and f.name != "desktop.ini"
           and not LAYOUT_FILE.match(f.name)]
    legacy = re.search(r"layout:\s*legacy", read(job / "README.md")) is not None
    if bad and legacy:
        print("WARN  e) legacy layout (pre R18, not re-laid out); file names not NN_NAME.ext: " + ", ".join(bad))
    else:
        check("e) top-level file names match NN_NAME.ext", not bad, ", ".join(bad))
    stray = [f.name for f in top if f.is_dir() and f.name not in LAYOUT_DIRS]
    if stray:
        print("WARN  e) unexpected top-level folders (allowed: files/ work/ observations/): " + ", ".join(stray))

    # f) JOBS.md index (R20)
    if brand is None:
        check("f) brand JOBS.md lists this job with the same status", False, "brand unknown (see a)")
    else:
        jobs = ROOT / "TSST" / "brands" / brand / "JOBS.md"
        rows = [ln for ln in read(jobs).splitlines() if ln.startswith(f"| `{name}` |")]
        row = rows[0] if len(rows) == 1 else None
        cells = [c.strip() for c in row.strip().strip("|").split("|")] if row else []
        if not jobs.is_file():
            check("f) brand JOBS.md lists this job with the same status", False, "JOBS.md missing - run sync_jobs.py " + brand)
        elif not row:
            check("f) brand JOBS.md lists this job with the same status", False, f"expected exactly one job row, found {len(rows)} - run sync_jobs.py " + brand)
        else:
            check("f) brand JOBS.md lists this job with the same status", len(cells) > 3 and cells[3] == status,
                  f"JOBS.md={cells[3] if len(cells) > 3 else '?'} DELIVERY.json={status}" + ("" if len(cells) > 3 and cells[3] == status else " - run sync_jobs.py " + brand))

    ok = all(results)
    if args.structure_only:
        print("RESULT: " + ("STRUCTURE_PASS" if ok else "FAIL") + " | SEMANTIC_SYNC_UNVERIFIED")
    else:
        print("RESULT: " + ("PASS | structured_status_sync verified; narrative review separate" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
