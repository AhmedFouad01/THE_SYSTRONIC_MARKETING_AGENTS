#!/usr/bin/env python3
"""Tests: a missing Drive-native *.gdoc is expected-absent ONLY when its repo-native export exists.

Run: python TSST/context/tests/test_gdoc_expected_absent.py   (stdlib only; uses a temp dir, repo untouched)
"""
import importlib.util
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("validate_spine", os.path.join(HERE, "validate_spine.py"))
vs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vs)

FAILS = []


def expect(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        FAILS.append(name)


def touch(root, rel_path):
    full = os.path.join(root, *rel_path.split("/"))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf-8").write("x")


with tempfile.TemporaryDirectory() as tmp:
    real_repo = vs.REPO
    vs.REPO = tmp
    try:
        touch(tmp, "docs/A.md")            # export beside missing docs/A.md.gdoc
        touch(tmp, "docs/B")               # extensionless export for docs/B.gdoc
        touch(tmp, "docs/C.md")            # for docs/C.gdoc -> C.md
        touch(tmp, "docs/present.md.gdoc") # stub present
        touch(tmp, "docs/other.md")

        vs.NOTES.clear()
        expect("absent stub + paired export (X.md.gdoc -> X.md) is expected-absent",
               vs.gdoc_expected_absent("docs/A.md.gdoc"))
        expect("absent stub + extensionless export (X.gdoc -> X)", vs.gdoc_expected_absent("docs/B.gdoc"))
        expect("absent stub + X.md export (X.gdoc -> X.md)", vs.gdoc_expected_absent("docs/C.gdoc"))
        expect("expected-absent is reported as a note", len(vs.NOTES) == 3)
        expect("manifest export given and present -> expected-absent",
               vs.gdoc_expected_absent("docs/Z.md.gdoc", "docs/other.md"))

        vs.NOTES.clear()
        expect("absent stub + export ALSO missing -> still a failure",
               not vs.gdoc_expected_absent("docs/MISSING.md.gdoc"))
        expect("manifest export given but missing -> still a failure",
               not vs.gdoc_expected_absent("docs/A.md.gdoc", "docs/nope.md"))
        expect("no note recorded for failures", vs.NOTES == [])
        expect("stub present -> not 'expected-absent' (normal exists path handles it)",
               not vs.gdoc_expected_absent("docs/present.md.gdoc"))
        expect("non-.gdoc path is never excused", not vs.gdoc_expected_absent("docs/ghost.md"))

        # end to end: bridge manifest check via _rows/bridge_manifests uses the same rule
        os.makedirs(os.path.join(tmp, "m"), exist_ok=True)
        vs.MANIFESTS[:] = ["m/EXPORTS.yaml"]
        open(os.path.join(tmp, "m", "EXPORTS.yaml"), "w", encoding="utf-8").write(
            "- source: docs/A.md.gdoc\n  export: docs/A.md\n- source: docs/D.md.gdoc\n  export: docs/D.md\n")
        vs.RESULTS.clear()
        vs.bridge_manifests()
        rows = [r for r in vs.RESULTS if r[1].startswith("manifest rows valid")]
        expect("bridge: row with missing export fails, row with export passes",
               rows and not rows[0][2] and "docs/D.md" in rows[0][3] and "source missing docs/A" not in rows[0][3])
    finally:
        vs.REPO = real_repo

print(f"\n{len(FAILS)} failure(s)")
sys.exit(1 if FAILS else 0)
