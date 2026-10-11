#!/usr/bin/env python3
"""Generate TSST/skills/index.yaml - the single central skill index (TSST-ADR-003).

Usage: python TSST/skills/build_index.py          # (re)write index.yaml
       python TSST/skills/build_index.py --check  # exit 1 if index.yaml is stale vs disk
       python TSST/skills/build_index.py --team <team>  # read-only: `ID | status | trigger(<=100)` rows of one team
       python TSST/skills/build_index.py --id <ID>      # read-only: that skill's path + full trigger

Stdlib only. Deterministic (sorted, no timestamps). Output is YAML flow-style, one skill per line.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "index.yaml")

# (repo-relative package root, default team, default owner)
SOURCES = [
    ("TSST/context_os/skills", "core", "CORE"),
    ("TSST/LEAD/skills", "lead", "LEAD"),
    ("TSST/LENS/skills", "marketing", "LENS_AG"),
    ("TSST/SPARK/skills", "marketing", "SPARK_AG"),
    ("TSST/CREATIVE/skills", "studio", "CREATIVE_AG"),
    ("TSST/MOTION/skills", "motion", "MOTION_AG"),
    ("TSST/DEV/skills", "build", "DEV_AG"),
]
# id prefix -> (team, owner)
PREFIX = {"CTX": ("core", "CORE"), "LEAD": ("lead", "LEAD"), "LENS": ("marketing", "LENS_AG"),
          "SPARK": ("marketing", "SPARK_AG"), "CREATIVE": ("studio", "CREATIVE_AG"), "MOTION": ("motion", "MOTION_AG"), "DEV": ("build", "DEV_AG")}
TEAM_ORDER = ["core", "lead", "marketing", "studio", "motion", "build"]
TEAM_OWNER = {"core": "CORE", "lead": "LEAD", "marketing": "LENS_AG/SPARK_AG", "studio": "CREATIVE_AG", "motion": "MOTION_AG", "build": "DEV_AG"}
REGISTRIES = ["TSST/SKILL_REGISTRY.md", "TSST/LEAD/SKILL_REGISTRY.md", "TSST/DEV/SKILL_REGISTRY.md"]
ID_RE = re.compile(r"(tsst-[a-z]+-sk-\d{3})", re.I)
STATUS_RE = re.compile(r"\b(UNVALIDATED|LAB_VALIDATED|VALIDATED|DEPRECATED|[A-Z]+_VALIDATED|[A-Z_]{5,})\b")
SKIP_FILES = {"desktop.ini"}


def read(path):
    with open(path, "rb") as f:
        return f.read().decode("utf-8-sig").replace("\r\n", "\n")


def frontmatter(text):
    """Return (dict, body). Minimal parser: `key: value` lines, quotes stripped, folded blocks joined."""
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---", 4)
    if end < 0:
        return {}, text
    fm, lines, key = {}, text[4:end].split("\n"), None
    for ln in lines:
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", ln)
        if m:
            key, val = m.group(1).lower(), m.group(2).strip()
            if val in (">", "|", ">-", "|-"):
                val = ""
            fm[key] = val
        elif key and ln.strip():
            fm[key] = (fm[key] + " " + ln.strip()).strip()
    for k, v in fm.items():
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            fm[k] = v[1:-1].replace('\\"', '"')
    return fm, text[end + 4:]


def status_token(s):
    s = (s or "").replace("`", "")
    m = STATUS_RE.search(s.upper())
    return m.group(1) if m else None


def load_registries():
    """Returns (status_by_id, backlog list of (id, title))."""
    status, backlog = {}, []
    for rel in REGISTRIES:
        p = os.path.join(REPO, rel)
        if not os.path.isfile(p):
            continue
        text = read(p)
        # section style: '### TSST-X-SK-NNN - Title' ... '- Package:' ... '- Status:'
        for m in re.finditer(r"^### (TSST-[A-Z]+-SK-\d{3}) [—-] (.+?)\s*$(.*?)(?=^### |^## |\Z)", text, re.M | re.S):
            sid, title, body = m.group(1), m.group(2).strip(), m.group(3)
            st = re.search(r"^- Status:\s*(.+)$", body, re.M)
            if st and status_token(st.group(1)):
                status[sid] = status_token(st.group(1))
            pk = re.search(r"^- Package:\s*(.+)$", body, re.M)
            if pk and pk.group(1).strip().strip("`").lower() == "backlog":
                backlog.append((sid, title))
        # table style: '| `TSST-X-SK-NNN` | ... | `STATUS` |'
        for ln in text.split("\n"):
            m = re.match(r"^\|\s*`(TSST-[A-Z]+-SK-\d{3})`\s*\|", ln)
            if m:
                tok = None
                for cell in reversed([c for c in ln.split("|") if c.strip()]):
                    if re.fullmatch(r"\s*`[A-Z_]{5,}`\s*", cell):
                        tok = status_token(cell)
                        break
                if tok:
                    status[m.group(1)] = tok
    return status, backlog


def one_line(s, n=160):
    s = re.sub(r"\s+", " ", (s or "")).strip()
    return s if len(s) <= n else s[: n - 3].rstrip() + "..."


def skill_version(fm, body):
    """Frontmatter `version:` wins, then a body line `Version: X`, then 0.1."""
    if fm.get("version"):
        return fm["version"]
    m = re.search(r"^Version:[ \t]*(\S+)", body, re.M)
    return m.group(1) if m else "0.1"


def body_trigger(body):
    m = re.search(r"^##+ .*?[Tt]rigger.*?\n+(.+?)(?:\n\s*\n|\Z)", body, re.S | re.M)
    return m.group(1) if m else ""


def scan():
    reg_status, backlog = load_registries()
    dirs = list(SOURCES)
    base = os.path.join(REPO, "TSST", "skills")
    for team in sorted(os.listdir(base)):  # future TSST/skills/<team>/<slug>/SKILL.md
        if os.path.isdir(os.path.join(base, team)):
            owner = {"marketing": "", "studio": "CREATIVE_AG", "motion": "MOTION_AG", "build": "DEV_AG", "lead": "LEAD", "core": "CORE"}.get(team, "")
            dirs.append((f"TSST/skills/{team}", team, owner))
    skills, seen = [], {}
    for rel, team0, owner0 in dirs:
        root = os.path.join(REPO, *rel.split("/"))
        if not os.path.isdir(root):
            continue
        for name in sorted(os.listdir(root)):
            if name in SKIP_FILES or name.endswith(".gdoc"):
                continue
            sk = os.path.join(root, name, "SKILL.md")
            if not os.path.isfile(sk):
                continue
            text = read(sk)
            fm, body = frontmatter(text)
            m = ID_RE.search(fm.get("id", "")) or ID_RE.search(name)
            sid = m.group(1).upper() if m else (fm.get("id") or name).upper()
            prefix = sid.split("-")[1] if sid.count("-") >= 3 else ""
            team, owner = PREFIX.get(prefix, (team0, owner0))
            if rel.startswith("TSST/skills/"):  # new skills carry their own metadata
                team, owner = fm.get("team") or team0, fm.get("owner") or PREFIX.get(prefix, (0, owner0))[1]
            st = status_token(fm.get("status"))
            if not st:
                mm = re.search(r"^Status:\s*(.+)$", body, re.M | re.I)
                st = status_token(mm.group(1)) if mm else None
            st = st or reg_status.get(sid) or "UNVALIDATED"
            trig = fm.get("description") or body_trigger(body)
            ent = {"id": sid, "team": team, "owner": owner or "UNASSIGNED", "status": st,
                   "version": skill_version(fm, body), "trigger": one_line(trig),
                   "path": f"{rel}/{name}"}
            if sid in seen:
                raise SystemExit(f"duplicate skill id {sid}: {seen[sid]} and {ent['path']}")
            seen[sid] = ent["path"]
            skills.append(ent)
    backlog = sorted({b for b in backlog if b[0] not in seen})
    return skills, backlog


def q(s):
    return json.dumps(s, ensure_ascii=False)


def render(skills, backlog):
    by = {t: sorted([s for s in skills if s["team"] == t], key=lambda s: s["id"]) for t in TEAM_ORDER}
    extra = sorted({s["team"] for s in skills} - set(TEAM_ORDER))
    teams = TEAM_ORDER + extra
    for t in extra:
        by[t] = sorted([s for s in skills if s["team"] == t], key=lambda s: s["id"])
    counts = " ".join(f"{t}={len(by[t])}" for t in teams)
    out = ["# GENERATED by TSST/skills/build_index.py - do not edit by hand",
           f"# generated: {counts} total={len(skills)} backlog={len(backlog)}",
           "# Regenerate: python TSST/skills/build_index.py   |   verify: python TSST/skills/build_index.py --check",
           "skills:"]
    for t in teams:
        out.append(f"  # ---- team: {t} ({TEAM_OWNER.get(t, '?')}) - {len(by[t])} skills ----")
        for s in by[t]:
            out.append("  - {id: %s, team: %s, owner: %s, status: %s, version: %s, trigger: %s, path: %s}" % (
                s["id"], s["team"], s["owner"], s["status"], q(str(s["version"])), q(s["trigger"]), q(s["path"])))
    out.append("# registered in a SKILL_REGISTRY but no package on disk yet")
    out.append("backlog:")
    for sid, title in backlog:
        out.append("  - {id: %s, title: %s}" % (sid, q(title)))
    return "\n".join(out) + "\n"


ROW_RE = re.compile(r'^  - \{id: (\S+?), team: (\S+?), owner: .*?, status: (\S+?), version: ".*?", '
                    r'trigger: ("(?:[^"\\]|\\.)*"), path: ("(?:[^"\\]|\\.)*")\}$')


def index_rows():
    """Parse index.yaml rows (read-only) -> list of dicts."""
    rows = []
    for ln in read(OUT).split("\n"):
        m = ROW_RE.match(ln)
        if m:
            rows.append({"id": m.group(1), "team": m.group(2), "status": m.group(3),
                         "trigger": json.loads(m.group(4)), "path": json.loads(m.group(5))})
    return rows


def lookup(argv):
    """Handle --team / --id. Never writes index.yaml. Returns exit code, or None if no lookup flag."""
    for flag in ("--team", "--id"):
        if flag not in argv:
            continue
        i = argv.index(flag)
        if i + 1 >= len(argv):
            print(f"usage: build_index.py {flag} <value>", file=sys.stderr)
            return 2
        val = argv[i + 1]
        rows = index_rows()
        if flag == "--team":
            hits = [r for r in rows if r["team"] == val.lower()]
            for r in hits:
                print(f"{r['id']} | {r['status']} | {one_line(r['trigger'], 100)}")
        else:
            hits = [r for r in rows if r["id"].upper() == val.upper()]
            for r in hits:
                print(f"{r['id']} | {r['status']} | {r['path']}\n{r['trigger']}")
        if not hits:
            print(f"no {flag[2:]} match: {val}", file=sys.stderr)
            return 1
        return 0
    return None


def main(argv):
    rc = lookup(argv)
    if rc is not None:
        return rc
    skills, backlog = scan()
    text = render(skills, backlog)
    if "--check" in argv:
        cur = read(OUT).replace("\r\n", "\n") if os.path.isfile(OUT) else None
        if cur != text:
            print("STALE: TSST/skills/index.yaml differs from disk. Run: python TSST/skills/build_index.py", file=sys.stderr)
            return 1
        print(f"index.yaml up to date ({len(skills)} skills, {len(backlog)} backlog)")
        return 0
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print(text.split("\n")[1])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
