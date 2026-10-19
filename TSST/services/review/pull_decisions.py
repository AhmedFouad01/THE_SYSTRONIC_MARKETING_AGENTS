#!/usr/bin/env python3
"""pull_decisions.py - mirror the portal decisions into the job manifests (R3b). Stdlib only.

Usage: python TSST/services/review/pull_decisions.py [--dry-run] [--root <brands dir>] [--quiet]

The portal database is the source of truth for review decisions. This script asks the server for the current
decisions (ssh -> `sudo -u tsst tsst-portal-run export:decisions`, one JSON line) and writes them into each job's
DELIVERY.json "review" block (review.py's manifest read / atomic write, indent and newline style kept). It writes a
job only when something changed; for a changed job that has a DELIVERY.html it then runs build_delivery.py, and
finally sync_jobs.py once per brand. Keys that exist only in the local file are kept (and logged), never dropped.
--dry-run prints the planned changes and writes nothing. Offline / ssh trouble: quiet exit 0 (logged).

Log: %LOCALAPPDATA%\\tsst-review\\pull.log (rotated at 100 KB, one backup). Overrides: TSST_KEY, TSST_HOST.
"""
import argparse
import datetime
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import review  # noqa: E402  (manifest read/atomic write, run_build, run_sync, job_dir)

KEY = os.environ.get("TSST_KEY") or os.path.join(os.path.expanduser("~"), ".ssh", "tsst-portal-key-fra.pem")
HOST = os.environ.get("TSST_HOST") or "ubuntu@54.93.60.74"
REMOTE_CMD = "sudo -u tsst tsst-portal-run export:decisions"
FIELDS = ("status", "note", "date", "by")
# "changes_requested" (Dash word) and "rejected" (old word) are one status. A file that says "changes_requested" is not
# rewritten while the server still sends "rejected"; a file that says "rejected" is rewritten to the new word as soon as
# the server sends it (expected).
LOG_MAX = 100_000
LOCK_STALE = 20 * 60


def log_dir():
    base = os.environ.get("LOCALAPPDATA") or os.path.join(os.path.expanduser("~"), ".cache")
    return os.path.join(base, "tsst-review")


class Log:
    def __init__(self, directory, echo=True):
        self.path = os.path.join(directory, "pull.log")
        self.echo = echo and sys.stdout is not None
        try:
            os.makedirs(directory, exist_ok=True)
            if os.path.isfile(self.path) and os.path.getsize(self.path) > LOG_MAX:
                os.replace(self.path, self.path + ".1")
        except OSError:
            pass

    def __call__(self, msg):
        line = f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} {msg}"
        try:
            with open(self.path, "a", encoding="utf-8") as fh:
                fh.write(line + "\n")
        except OSError:
            pass
        if self.echo:
            try:
                print(msg)
            except (OSError, UnicodeError):
                pass


# ---------------------------------------------------------------- the export

def fetch_export(runner=subprocess.run, key=None, host=None, timeout=60):
    """The server's current decisions as a list of dicts, or None when the server cannot be reached / answers badly."""
    cmd = ["ssh", "-i", key or KEY, "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", host or HOST, REMOTE_CMD]
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        p = runner(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout, creationflags=flags)
    except (OSError, subprocess.SubprocessError):
        return None
    if p.returncode != 0:
        return None
    return parse_export(p.stdout)


def parse_export(text):
    """The last line that starts with '[' and parses as a JSON list (npm prints a banner before it)."""
    for line in reversed((text or "").splitlines()):
        line = line.strip()
        if line.startswith("["):
            try:
                data = json.loads(line)
            except ValueError:
                return None
            return data if isinstance(data, list) else None
    return None


def group_rows(rows):
    """{(brand, job): {key: {status, note, date, by}}}; rows that are malformed are ignored."""
    out = {}
    for r in rows:
        if not isinstance(r, dict) or not all(isinstance(r.get(k), str) for k in ("brand", "job", "key", "status", "note", "date", "by")):
            continue
        out.setdefault((r["brand"], r["job"]), {})[r["key"]] = {k: r[k] for k in FIELDS}
    return out


# ---------------------------------------------------------------- planning and writing

def plan_job(root, brand, job, decisions):
    """None when nothing changes, else a dict with the new manifest data and a short description."""
    try:
        jd = review.job_dir(root, brand, job)
        data, indent, crlf, trailing, exists = review.read_manifest(jd)
    except review.BadRequest as exc:
        return {"skip": f"{brand}/{job}: {exc}"}
    old = data.get("review")
    if old is None:
        old = {}
    elif not isinstance(old, dict):
        return {"skip": f"{brand}/{job}: DELIVERY.json review is not an object"}
    new = dict(old)
    changed = []
    for key, dec in decisions.items():
        cur = old.get(key) if isinstance(old.get(key), dict) else None
        if cur is not None and all(cur.get(f) == dec[f] for f in FIELDS):
            continue
        if cur is not None and dec["status"] == "rejected" and cur.get("status") == "changes_requested" \
                and all(cur.get(f) == dec[f] for f in FIELDS if f != "status"):
            continue                                  # old server word vs. our new word: same status, nothing to write
        entry = dict(cur or {})
        entry.update(dec)
        new[key] = entry
        changed.append(key)
    local_only = [k for k in old if k not in decisions]
    if not changed:
        return {"none": True, "local_only": local_only}
    if not exists:
        data = {"title": os.path.basename(jd), "status": "progress"}
    data["review"] = new
    return {"jd": jd, "data": data, "indent": indent, "crlf": crlf, "trailing": trailing, "exists": exists,
            "changed": changed, "local_only": local_only, "page": os.path.isfile(os.path.join(jd, "DELIVERY.html"))}


def pull(root, rows, dry_run=False, log=print, build=None, sync=None):
    """Apply the export to the tree. Returns {changed: [(brand, job, n)], errors: int}."""
    build = build or (lambda b, j: review.run_build(root, b, j))
    sync = sync or review.run_sync
    result = {"changed": [], "errors": 0}
    touched = []
    for (brand, job), decisions in sorted(group_rows(rows).items()):
        plan = plan_job(root, brand, job, decisions)
        if "skip" in plan:
            log(f"skip {plan['skip']}")
            continue
        if plan.get("local_only"):
            log(f"note {brand}/{job}: {len(plan['local_only'])} local-only review key(s) kept")
        if plan.get("none"):
            continue
        label = f"{brand}/{job}: {len(plan['changed'])} decision(s) " + ("(new DELIVERY.json)" if not plan["exists"] else "")
        if dry_run:
            log(f"would update {label.strip()}")
            for k in plan["changed"]:
                log(f"  {k} -> {decisions[k]['status']}")
            result["changed"].append((brand, job, len(plan["changed"])))
            continue
        try:
            review.write_json_atomic(os.path.join(plan["jd"], "DELIVERY.json"), plan["data"], plan["indent"], plan["crlf"], plan["trailing"])
        except OSError as exc:
            log(f"ERROR {brand}/{job}: write failed: {exc}")
            result["errors"] += 1
            continue
        log(f"updated {label.strip()}")
        result["changed"].append((brand, job, len(plan["changed"])))
        touched.append((brand, job, plan["page"]))
    if dry_run:
        if not result["changed"]:
            log("no changes")
        return result
    for brand, job, page in touched:
        if page:
            r = build(brand, job)
            log(f"build {r['line']}")
            if not r["ok"]:
                result["errors"] += 1
    for brand in sorted({b for b, _, _ in touched}):
        r = sync(brand)
        log(f"sync {brand}: {r['line']}")
        if not r["ok"]:
            result["errors"] += 1
    if not result["changed"]:
        log("no changes")
    return result


# ---------------------------------------------------------------- one run at a time

class Lock:
    def __init__(self, directory):
        self.path = os.path.join(directory, "pull.lock")
        self.held = False

    def __enter__(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        for _ in range(2):
            try:
                fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.close(fd)
                self.held = True
                return self
            except FileExistsError:
                try:
                    if time.time() - os.path.getmtime(self.path) > LOCK_STALE:
                        os.remove(self.path)
                        continue
                except OSError:
                    pass
                return self
            except OSError:
                return self
        return self

    def __exit__(self, *exc):
        if self.held:
            try:
                os.remove(self.path)
            except OSError:
                pass


def main(argv=None, fetch=None, directory=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true", help="print the planned changes, write nothing")
    ap.add_argument("--root", default=review.DEFAULT_ROOT, help="brands folder (tests / scratch copies only)")
    ap.add_argument("--quiet", action="store_true", help="no console output (the log is still written)")
    args = ap.parse_args(argv)
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    directory = directory or log_dir()
    log = Log(directory, echo=not args.quiet)
    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        log(f"brands folder not found: {root}")
        return 0
    with Lock(directory) as lock:
        if not lock.held:
            log("another pull is running - skipped")
            return 0
        rows = (fetch or fetch_export)()
        if rows is None:
            log("server not reachable - nothing done")
            return 0
        real = os.path.normcase(root) == os.path.normcase(review.DEFAULT_ROOT)
        kw = {}
        if not real:                     # sync_jobs.py / build_delivery.py work on the real tree only
            kw = {"build": lambda b, j: {"ok": True, "line": f"{j}: skipped (custom --root)"},
                  "sync": lambda b: {"ok": True, "line": "skipped (custom --root)"}}
        result = pull(root, rows, dry_run=args.dry_run, log=log, **kw)
    return 1 if result["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
