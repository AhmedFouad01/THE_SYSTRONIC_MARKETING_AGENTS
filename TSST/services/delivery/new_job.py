#!/usr/bin/env python3
"""new_job.py - start a new job already on the approved structure (R18-R20, JOB_LAYOUT.md).

Usage: python TSST/services/delivery/new_job.py <brand-id> <job-path> --service "SV-04 Content strategy"
           --title "Title" [--lang en|ar] [--dry-run] [--root <repo-root>]
<job-path> is relative to TSST/brands/<brand-id>/projects/, may be nested (campaign-01/marketing-week-02),
every segment a lowercase slug [a-z0-9-]+. Creates only README.md, 00_BRIEF.md, DELIVERY.json (never other
slot files), registers the job (brand status.md; nested: parent project.md/README.md), then runs
sync_jobs.py and job_check.py. Refuses (exit 1) on: unknown brand, existing folder, PILOTS / TSST/projects
path, bad slug, missing --lang with no earlier DELIVERY.json. --root is for tests (default = this repo).
Stdlib only. Each touched file keeps its own line endings.
"""
import argparse
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

SLUG = re.compile(r"^[a-z0-9-]+$")
HEADING = "## New jobs (new_job.py)"


def refuse(msg):
    print(f"REFUSED: {msg}")
    sys.exit(1)


def append_line(path, line, section=None):
    """Append `line` (to the end of `section` heading if given) keeping the file's line endings and content."""
    raw = path.read_bytes().decode("utf-8") if path.is_file() else ""
    eol = "\r\n" if "\r\n" in raw else "\n"
    lines = raw.split(eol) if raw else []
    if lines and lines[-1] == "":
        lines.pop()
    if section is None or section not in lines:
        if section is not None:
            lines += ([""] if lines else []) + [section]
        lines.append(line)
    else:
        i = lines.index(section) + 1
        while i < len(lines) and not lines[i].startswith("## "):
            i += 1
        while lines[i - 1].strip() == "":
            i -= 1
        lines.insert(i, line)
    path.write_bytes((eol.join(lines) + eol).encode("utf-8"))


def brand_lang(pdir):
    for mf in sorted(pdir.rglob("DELIVERY.json")):
        try:
            lang = json.loads(mf.read_text(encoding="utf-8")).get("default_lang")
        except (OSError, ValueError):
            continue
        if lang in ("en", "ar"):
            return lang
    return None


def readme_text(a, name, files):
    fmap = "\n".join(f"- `{f}`" for f in files)
    return (f"# {a.title}\n\nservice: {a.service}\nstate: draft\nnext: (write the next step here)\n\n"
            f"## File map\n{fmap}\n\nAdd slots 01-08 only when content arrives, by the JOB_LAYOUT.md names "
            "(01_STRATEGY, 02_PLAN, 03_COPY, 04_CREATIVE_BRIEFS, 05_MEASUREMENT, 06_SCORECARD.csv, "
            "07_DECISIONS, 08_LEAD_CHECKPOINT). Never create empty files.\n\n"
            f"## Finish checklist (R18-R20)\n- [ ] `python TSST/services/delivery/build_delivery.py <job folder>`\n"
            f"- [ ] `python TSST/services/delivery/sync_jobs.py {a.brand}`\n"
            f"- [ ] `python TSST/services/delivery/job_check.py <job folder>` passes ({name})\n")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="Start a new TSST job on the approved structure.")
    ap.add_argument("brand")
    ap.add_argument("job_path")
    ap.add_argument("--service", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--lang", choices=["en", "ar"])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[3]))
    a = ap.parse_args()
    root = Path(a.root).resolve()
    name = a.job_path.replace("\\", "/").strip("/")
    parts = name.split("/")

    if name.upper().startswith(("TSST/", "PILOTS")) or any(p.lower() in ("pilots", "..") for p in parts):
        refuse("jobs never live in TSST/PILOTS/ or TSST/projects/ (R18). Give a path relative to TSST/brands/<id>/projects/.")
    bad = [p for p in parts if not SLUG.match(p)]
    if bad:
        refuse(f"invalid slug {bad!r}: each path segment must match [a-z0-9-]+ (lowercase).")
    bdir = root / "TSST" / "brands" / a.brand
    portfolio = (root / "TSST" / "core" / "portfolio.yaml").read_text(encoding="utf-8", errors="replace")
    if not re.search(rf"^  {re.escape(a.brand)}:", portfolio, re.M) or not bdir.is_dir():
        refuse(f"unknown brand {a.brand!r}: needs an entry in TSST/core/portfolio.yaml and a TSST/brands/{a.brand}/ folder.")
    pdir = bdir / "projects"
    job = pdir.joinpath(*parts)
    if job.exists():
        refuse(f"{job.relative_to(root).as_posix()} already exists (never overwrite or merge).")
    parent = job.parent
    if len(parts) > 1 and not parent.is_dir():
        refuse(f"parent folder {parent.relative_to(root).as_posix()} does not exist; create the parent job first.")
    lang = a.lang or brand_lang(pdir)
    if not lang:
        refuse(f"no DELIVERY.json found for {a.brand}: pass --lang en|ar.")

    today = datetime.date.today().isoformat()
    rel = job.relative_to(root).as_posix()
    files = ["README.md", "00_BRIEF.md", "DELIVERY.json"]
    brief = ("# Brief\n\n## Request\n\n## Scope\n\n## Inputs\n\n## Gates\n\n## Done when\n")
    stub = {"service": a.service, "job": parts[-1], "date": today, "title": a.title, "status": "progress",
            "default_lang": lang, "items": [], "texts": [], "ar": {}}
    texts = {"README.md": readme_text(a, name, files), "00_BRIEF.md": brief,
             "DELIVERY.json": json.dumps(stub, ensure_ascii=False, indent=1) + "\n"}
    status_line = f"- {today}: new job `{name}` ({a.service}), state draft. README: `{rel}/README.md`"
    reg = [(bdir / "status.md", status_line, HEADING)]
    if len(parts) > 1:
        pfile = next((parent / f for f in ("project.md", "README.md") if (parent / f).is_file()), None)
        if pfile:
            reg.append((pfile, f"- {today}: new job `{name}` ({a.title}), state draft. See `{parts[-1]}/README.md`", None))
        else:
            print(f"NOTE: {parent.relative_to(root).as_posix()} has no project.md or README.md; add the job there by hand.")
    else:
        print(f"REMINDER (Lead): list `{name}` in the brand's active project.md under TSST/brands/{a.brand}/projects/ (see portfolio.yaml; check d fails until it is listed).")

    print(("DRY RUN - nothing written. Plan:" if a.dry_run else "Creating:") + f"\n  folder {rel}/")
    for f, t in texts.items():
        print(f"  create {f} ({len(t.splitlines())} lines)")
    for f, line, sec in reg:
        print(f"  append to {f.relative_to(root).as_posix()}" + (f" under '{sec}'" if sec else "") + f": {line}")
    if a.dry_run:
        print("  then: sync_jobs.py " + a.brand + " and job_check.py " + rel)
        return 0
    job.mkdir(parents=True)
    for f, t in texts.items():
        (job / f).write_bytes(t.encode("utf-8"))
    for f, line, sec in reg:
        append_line(f, line, sec)
    tools = root / "TSST" / "services" / "delivery"
    for cmd in (["sync_jobs.py", a.brand], ["job_check.py", str(job)]):
        print(f"\n$ {cmd[0]} {cmd[1] if cmd[0] == 'sync_jobs.py' else name}")
        p = subprocess.run([sys.executable, str(tools / cmd[0]), cmd[1]], capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
        print(p.stdout.rstrip() + (p.stderr.rstrip() if p.stderr else ""))
    print("\nEXPECTED right now: check c) FAILS (pages not built yet; run build_delivery.py)"
          + ("" if len(parts) > 1 else ", and d) fails until the job is added to a project.md") + ".")
    return 0


if __name__ == "__main__":
    sys.exit(main())
