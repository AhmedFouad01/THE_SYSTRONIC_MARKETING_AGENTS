#!/usr/bin/env python3
"""TSST bus — file-based task bus shared by every runtime (stdlib only).

Protocol: TSST/context/bus.md.   Usage: python TSST/bus/bus.py <cmd> -h
Rules are enforced here, not trusted to prose: scopes, leases, rounds, roles, hashes.
"""
import argparse
import datetime as dt
import hashlib
import fnmatch
import json
import os
import re
import sys
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BUS = os.path.join(ROOT, "TSST", "bus")
TASKS = os.path.join(BUS, "tasks")
CLOSED = os.path.join(BUS, "closed")
OUT_REL = "TSST/bus/out/"
LOG = os.path.join(BUS, "log.tsv")
RUNTIMES = os.path.join(BUS, "runtimes.yaml")
ROSTER = os.path.join(ROOT, "TSST", "context", "roster.yaml")
LOCK = os.path.join(BUS, ".lock")
# Client work is not in git (R42/R48): it is reached in the clone as TSST/brands, a folder link to the
# client Drive folder. It is the one sanctioned link out of the repo, and it is absent in a git clone / CI.
CLIENT_REL = "TSST/brands"
CLIENT_LINK = os.path.join(ROOT, "TSST", "brands")
CLIENT_SKIP_REASON = "client folders are not in git (R48): TSST/brands is absent in this checkout"

FIELDS = ["id", "title", "kind", "status", "to", "needs", "tier", "team", "skills", "brand", "spec", "read",
          "write", "after", "done_when", "issued_by", "created", "rounds", "max_rounds",
          "claimed_by", "lease_until", "progress", "skills_used", "result", "sha256", "note"]
LISTS = {"needs", "read", "write", "after", "skills", "skills_used"}
TEAMS = {"marketing", "studio", "motion", "build", "lead"}
NEED_SKILLS = {"work", "review"}          # kinds that must name a team + skills (TSST rule 9)
SKILLS_FROM = "2026-10-05T09:00Z"         # tasks created from here on are bound by rule 9
# What a worker loads before touching a task (team file first, then the team's agent files).
TEAM_LOAD = {
    "marketing": ["TSST/teams/marketing/team.md", "TSST/LENS/AGENT.md"],
    "studio": ["TSST/teams/studio/team.md", "TSST/CREATIVE/AGENT.md",
               "TSST/CREATIVE/CREATIVE_PRODUCTION_STANDARD.md", "TSST/CREATIVE/FINAL_ASSET_GATE.md"],
    "motion": ["TSST/teams/motion/team.md", "TSST/MOTION/AGENT.md",
               "TSST/CREATIVE/CREATIVE_PRODUCTION_STANDARD.md", "TSST/CREATIVE/FINAL_ASSET_GATE.md"],
    "build": ["TSST/teams/build/team.md", "TSST/DEV/AGENT.md"],
    "lead": ["TSST/LEAD/AGENT.md"],      # the lead has no teams/ folder; its agent file is the team file
}
KINDS = {"work", "source-read", "review", "probe"}
TIERS = {"FAST", "WORK", "CODE", "DEEP"}
STATUSES = {"ready", "claimed", "done", "blocked", "escalated", "closed", "cancelled"}
# Never delegable through the bus: the operating system itself, governance, runtime config.
PROTECTED = ["TSST/context/", ".codex/", "TSST/skills/index.yaml", "TSST/core/", "TSST/bus/bus.py", "TSST/bus/runtimes.yaml",
             "TSST/bus/log.tsv", "TSST/bus/tasks/", "TSST/bus/closed/", "TSST/TSST_DECISION_RIGHTS.md", "AGENTS.md", "CLAUDE.md",
             "GEMINI.md", ".claude/", ".agents/", ".git"]
ID_RE = re.compile(r"[A-Z][A-Z0-9-]{1,31}")   # no separators or dots: ids are never paths
MAX_NOTE = 200          # chars per note/progress line
MAX_TASK_BYTES = 2048   # a task envelope stays small
MAX_OUT_BYTES = 4096    # a result/review file stays small


# ------------------------------------------------------------------ tiny YAML subset
def _val(s):
    s = s.strip()
    if not s:
        return ""
    if s[0] == '"':
        return json.loads(s)
    if s[0] == "[" and s[-1] == "]":
        return [x.strip() for x in s[1:-1].split(",") if x.strip()]
    if s.isdigit():
        return int(s)
    return s


def parse(text):
    """Flat `key: value` plus one nesting level (`key:` then indented children)."""
    rows = []
    for raw in text.splitlines():
        line = raw.split(" #", 1)[0] if '"' not in raw else raw
        if line.strip() and not line.lstrip().startswith("#"):
            rows.append(line.rstrip())
    out, cur = {}, None
    for i, line in enumerate(rows):
        key, _, val = line.strip().partition(":")
        nested_next = i + 1 < len(rows) and rows[i + 1].startswith((" ", "\t"))
        if line.startswith((" ", "\t")) and cur is not None:
            out[cur][key.strip()] = _val(val)
        elif val.strip() == "" and nested_next:
            cur = key.strip()
            out[cur] = {}
        else:
            cur = None
            out[key.strip()] = _val(val)
    return out


def _dump_val(v):
    if isinstance(v, list):
        return "[" + ", ".join(v) + "]"
    s = str(v)
    if any(c in s for c in "#:\"[") or s != s.strip():
        return json.dumps(s, ensure_ascii=False)
    return s


def dump(d, order=None):
    lines = []
    for k in order or d:
        v = d.get(k, [] if k in LISTS else "")
        if isinstance(v, dict):
            lines.append(f"{k}:")
            lines += [f"  {ck}: {_dump_val(cv)}".rstrip() for ck, cv in v.items()]
        else:
            lines.append(f"{k}: {_dump_val(v)}".rstrip())
    return "\n".join(lines) + "\n"


# ------------------------------------------------------------------ helpers
def now():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")


def ts(s):
    return dt.datetime.strptime(s, "%Y-%m-%dT%H:%MZ").replace(tzinfo=dt.timezone.utc)


def expired(t):
    return not t.get("lease_until") or ts(t["lease_until"]) <= dt.datetime.now(dt.timezone.utc)


def die(msg):
    print("REFUSED: " + msg)
    sys.exit(2)


def sha(rel):
    # Line endings are normalised so a git checkout (CRLF on Windows) never looks like an edit.
    with open(repo_path(rel), "rb") as f:
        return hashlib.sha256(f.read().replace(b"\r\n", b"\n")).hexdigest()


def same(rel, recorded):
    """Result unchanged since done? Accepts hashes recorded before EOL normalisation."""
    with open(repo_path(rel), "rb") as f:
        raw = f.read()
    return recorded in (sha(rel), hashlib.sha256(raw).hexdigest())


def norm_skill(p):
    return p.strip().replace("\\", "/").rstrip("/")


def skill_aliases(p):
    """Ways a worker may cite a skill: full path, folder/file basename, or id (…-sk-010)."""
    base = norm_skill(p).rsplit("/", 1)[-1]
    out = {norm_skill(p).lower(), base.lower()}
    m = re.match(r"(.+?-sk-\d+)", base, re.I)
    if m:
        out.add(m.group(1).lower())
    return out


def skills_unused(skills, used):
    cited = {norm_skill(u).lower() for u in used}
    return [s for s in skills if not (skill_aliases(s) & cited)]


def prefix(pattern):
    pattern = norm_scope(pattern).casefold()
    cut = min([i for i, c in enumerate(pattern) if c in "*?["] + [len(pattern)])
    return pattern[:cut].split("#", 1)[0]


def overlaps(a, b):
    try:
        aa, bb = (norm_scope(a), resolved_scope(a)), (norm_scope(b), resolved_scope(b))
    except (OSError, ValueError, TypeError):
        # Historical malformed scopes remain inspectable, but cannot evade conflict checks.
        # task_errors/scope_errors supply the diagnostic; ambiguous scopes conflict safely.
        return True
    for left in aa:
        for right in bb:
            pa, pb = prefix(left), prefix(right)
            ga, gb = any(c in left for c in '*?['), any(c in right for c in '*?[')
            if (pa == pb or pa.startswith(pb.rstrip('/') + '/') or pb.startswith(pa.rstrip('/') + '/')
                    or (ga and pb.startswith(pa)) or (gb and pa.startswith(pb))):
                return True
    return False


def norm_scope(path, allow_drive=False):
    """Canonical repository-relative spelling. Reject traversal before any filesystem access."""
    if not isinstance(path, str) or not path.strip():
        raise ValueError('empty scope')
    if path != path.strip():
        raise ValueError('leading/trailing whitespace in scope: ' + path)
    path = path.replace('\\', '/')
    if allow_drive and path.startswith('drive:'):
        return path
    if path.startswith('/') or ':' in path or '\x00' in path:
        raise ValueError('path outside repo: ' + path)
    parts = []
    for part in path.split('/'):
        if part in ('', '.'):
            continue
        if part == '..' or part.endswith((' ', '.')):
            raise ValueError('unsafe path component: ' + path)
        if re.search(r'~\d+(?:\.|$)', part):
            raise ValueError('ambiguous Windows short-name spelling refused: ' + path)
        if part.split('.')[0].upper() in {'CON', 'PRN', 'AUX', 'NUL', *('COM' + str(i) for i in range(1, 10)),
                                         *('LPT' + str(i) for i in range(1, 10))}:
            raise ValueError('Windows device path refused: ' + path)
        parts.append(part)
    if not parts:
        raise ValueError('empty scope')
    return '/'.join(parts)


def _relative_inside(path, root):
    """`path` relative to `root` ('/'-separated) when it lies inside it, else None."""
    try:
        if os.path.normcase(os.path.commonpath([root, path])) != os.path.normcase(root):
            return None
    except ValueError:  # different drives
        return None
    return os.path.relpath(path, root).replace('\\', '/')


def is_client(relative):
    """True for a repo-relative path inside the client folders (TSST/brands)."""
    r = str(relative).replace('\\', '/').strip('/').casefold()
    return r == CLIENT_REL.casefold() or r.startswith(CLIENT_REL.casefold() + '/')


def clients_present():
    return os.path.isdir(CLIENT_LINK)


def resolved_scope(relative):
    """Resolve literal components before a glob, then return a repo-relative scope.

    Does not enumerate globs. Concrete result paths are resolved again before use.
    Links can change after validation; this workflow check is not an OS sandbox.
    A path that resolves into the client folders through the TSST/brands link (R42) is
    returned in its `TSST/brands/...` spelling; every other path out of the repo is refused.
    """
    rel = norm_scope(relative)
    parts = rel.split('/')
    first_glob = next((i for i, part in enumerate(parts) if any(c in part for c in '*?[')), len(parts))
    path = os.path.realpath(os.path.join(ROOT, *parts[:first_glob]))
    target = _relative_inside(path, ROOT)
    if target is None and clients_present():
        client_root = os.path.realpath(CLIENT_LINK)
        sub = _relative_inside(path, client_root)
        if sub is not None:
            target = CLIENT_REL if sub == '.' else CLIENT_REL + '/' + sub
    if target is None:
        raise ValueError('resolved path outside repo: ' + rel)
    suffix = '/'.join(parts[first_glob:])
    return norm_scope('/'.join(p for p in ('' if target == '.' else target, suffix) if p))


def repo_path(relative):
    rel = norm_scope(relative)
    if any(c in rel for c in '*?['):
        raise ValueError('file path cannot contain glob: ' + rel)
    return os.path.join(ROOT, resolved_scope(rel))


def result_in_scope(result, scope):
    r, s = norm_scope(result).casefold(), norm_scope(scope).casefold()
    return r == s or r.startswith(s.rstrip('/') + '/') or fnmatch.fnmatchcase(r, s)


def scope_errors(paths, writing):
    errs = []
    if not isinstance(paths, (list, tuple)):
        return ['scope list must be an array']
    for p in paths:
        try:
            p = norm_scope(p, allow_drive=not writing)
            if p.startswith('drive:') and not writing:
                continue
            resolved_scope(p)  # root containment, including cross-drive and junction failures
        except (OSError, ValueError, TypeError) as exc:
            errs.append(str(exc))
            continue
        if writing and any(overlaps(p, x) for x in PROTECTED):
            errs.append(f"protected path not delegable: {p}")
    return errs


def scope_items(value):
    """Never iterate a malformed historical scope container as paths.

    Its diagnostic comes from scope_errors; the invalid sentinel conservatively
    conflicts through overlaps instead of dropping the row or trusting dictionary keys.
    """
    return value if isinstance(value, (list, tuple)) else (None,)


def validated_result(task, relative):
    """Check concrete lexical AND resolved boundaries before file access/hash/acceptance."""
    rel = norm_scope(relative)
    if any(c in rel for c in '*?['):
        raise ValueError('result path cannot contain glob: ' + rel)
    scopes = task.get('write', [])
    errors = scope_errors([rel], True) + scope_errors(scopes, True)
    if errors:
        raise ValueError('; '.join(errors))
    resolved = resolved_scope(rel)
    allowed = result_in_scope(rel, OUT_REL) and result_in_scope(resolved, OUT_REL)
    for scope in scopes:
        actual_scope = resolved_scope(scope)
        # New results are stored canonically; unchanged historical alias scopes must still
        # recognize that canonical spelling, while the resolved target stays within scope.
        lexical_match = result_in_scope(rel, scope) or result_in_scope(rel, actual_scope)
        allowed = allowed or (lexical_match and result_in_scope(resolved, actual_scope))
    if not allowed:
        raise ValueError('result outside lexical/resolved write scope: ' + rel)
    return resolved, repo_path(resolved)


class Lock:
    def __enter__(self):
        for _ in range(100):
            try:
                self.fd = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                return self
            except FileExistsError:
                try:
                    if time.time() - os.path.getmtime(LOCK) > 30:
                        os.remove(LOCK)
                except OSError:
                    pass
                time.sleep(0.1)
        die("bus busy (TSST/bus/.lock)")

    def __exit__(self, *a):
        os.close(self.fd)
        os.remove(LOCK)


def runtimes():
    with open(RUNTIMES, encoding="utf-8") as f:
        return parse(f.read())


def rt(me):
    r = runtimes().get(me)
    if not isinstance(r, dict):
        die(f"unknown runtime '{me}' (see TSST/bus/runtimes.yaml)")
    return r


def route_table():
    """The `route:` block of roster.yaml (team -> agent id). {} if the roster is missing."""
    try:
        with open(ROSTER, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except OSError:
        return {}
    out, inside = {}, False
    for ln in lines:
        if not inside:
            inside = ln.strip() == "route:"
        elif ln.strip() and not ln.lstrip().startswith("#"):
            if not ln.startswith((" ", "\t")):
                break
            k, _, v = ln.split(" #", 1)[0].partition(":")
            out[k.strip()] = v.strip()
    return out


def agent_for(team, skills):
    """Team agent for a task (roster.yaml route): marketing with only SPARK skills -> spark, else lens."""
    if team == "lead":
        return "lead-main"
    route = route_table()
    if team == "marketing":
        groups = {m.group(1) for sk in skills or []
                  for m in [re.search(r"tsst-([a-z]+)-sk-", norm_skill(sk).lower())] if m} & {"lens", "spark"}
        key = "marketing_performance" if groups == {"spark"} else "marketing"
    else:
        key = team
    return "tsst-" + route[key] if route.get(key) else None


def is_lead(me):
    return "lead" in (rt(me).get("roles") or [])


def path_of(tid):
    if not ID_RE.fullmatch(tid or ""):
        die(f"bad task id {tid!r} (A-Z, 0-9, '-')")
    for d in (TASKS, CLOSED):
        p = os.path.join(d, tid + ".yaml")
        if os.path.exists(p):
            return p
    return None


def load(tid):
    p = path_of(tid)
    if not p:
        die(f"no task {tid}")
    with open(p, encoding="utf-8") as f:
        return parse(f.read())


def ensure_dirs():
    # git keeps no empty folders: recreate the queue dirs in a fresh clone
    for d in (TASKS, CLOSED, os.path.join(BUS, "out")):
        os.makedirs(d, exist_ok=True)


def all_tasks(include_closed=False):
    dirs = [TASKS] + ([CLOSED] if include_closed else [])
    out = []
    for d in dirs:
        for n in sorted(os.listdir(d)):
            if n.endswith(".yaml"):
                with open(os.path.join(d, n), encoding="utf-8") as f:
                    out.append(parse(f.read()))
    return out


def save(t, me, transition, note=""):
    if len(note) > MAX_NOTE:
        die(f"note > {MAX_NOTE} chars — compress it")
    text = dump(t, FIELDS)
    if len(text.encode("utf-8")) > MAX_TASK_BYTES:
        die(f"task envelope > {MAX_TASK_BYTES} bytes — use pointers")
    target = CLOSED if t["status"] in ("closed", "cancelled") else TASKS
    old = path_of(t["id"])
    with open(os.path.join(target, t["id"] + ".yaml"), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    if old and os.path.dirname(old) != target:
        os.remove(old)
    with open(LOG, "a", encoding="utf-8", newline="\n") as f:
        f.write("\t".join([now(), t["id"], me, transition, note.replace("\t", " ")]) + "\n")
    print(f"OK {t['id']} {transition}" + (f" — {note}" if note else ""))


def need_claimer(t, me):
    if t.get("status") != "claimed" or t.get("claimed_by") != me:
        die(f"{t['id']} is not claimed by {me}")


def need_lead(me):
    if not is_lead(me):
        die(f"{me} has no lead role")


# ------------------------------------------------------------------ commands
def cmd_ls(a):
    rts = runtimes()
    for name, r in rts.items():
        if isinstance(r, dict):
            lim = f" until {r['until']}" if r.get("until") else ""
            print(f"rt {name:8} {r.get('status', '?')}{lim}  roles={r.get('roles') or []}")
    tasks = all_tasks()
    if not tasks:
        print("no open tasks")
    for t in tasks:
        mark = " "
        invalid = scope_errors(t.get('read', []), False) + scope_errors(t.get('write', []), True)
        if invalid:
            print(f"WARN {t['id']}: invalid scope: {'; '.join(invalid)}")
        if a.me and t["status"] in ("ready", "claimed"):
            mark = "*" if not claim_errors(t, a.me) else " "
        if a.me and t["status"] in ("done", "blocked", "escalated") and is_lead(a.me):
            mark = "!"  # needs the lead
        who = t.get("claimed_by") or t.get("to")
        print(f"{mark} {t['id']:14} {t['status']:9} {t.get('tier', ''):4} {who:8} {t.get('title', '')}")
        if mark == "*":
            print(f"    open on: {(rts.get(a.me) or {}).get('tier_' + t.get('tier', ''), '-')}")
    if a.me:
        print("legend: * you can claim (open on = model for its tier) · ! needs lead action")


def claim_errors(t, me):
    errs = []
    errs += scope_errors(t.get('read', []), False)
    errs += scope_errors(t.get('write', []), True)
    r = runtimes().get(me) or {}
    if t["status"] == "claimed" and not expired(t):
        errs.append(f"claimed by {t['claimed_by']} until {t['lease_until']}")
    elif t["status"] not in ("ready", "claimed"):
        errs.append(f"status {t['status']}")
    if t.get("to") not in ("any", me):
        errs.append(f"addressed to {t['to']}")
    if r.get("status") == "off":
        errs.append(f"{me} is off")
    if r.get("status") == "retired":
        errs.append(f"{me} is retired (TSST-ADR-004)")
    if r.get("status") == "limited" and r.get("until") and ts(r["until"]) > dt.datetime.now(dt.timezone.utc):
        errs.append(f"{me} limited until {r['until']}")
    have = set(r.get("caps") or [])
    if t.get("kind") == "probe":
        have |= set(r.get("unverified") or [])
    missing = set(t.get("needs") or []) - have
    if missing:
        errs.append(f"missing verified caps {sorted(missing)}")
    for dep in t.get("after") or []:
        p = path_of(dep)
        if not p or os.path.dirname(p) != CLOSED or load(dep)["status"] != "closed":
            errs.append(f"waits for {dep}")
    for o in all_tasks():
        if o["id"] != t["id"] and o["status"] == "claimed" and not expired(o):
            if any(overlaps(w, x) for w in scope_items(t.get('write', [])) for x in scope_items(o.get('write', []))):
                errs.append(f"write scope locked by {o['id']}")
    return errs


def cmd_new(a):
    need_lead(a.me)
    if path_of(a.id):
        die(f"{a.id} exists")
    lst = lambda s: [x.strip() for x in (s or "").split(",") if x.strip()]
    t = {"id": a.id, "title": a.title, "kind": a.kind, "status": "ready", "to": a.to,
         "needs": lst(a.needs), "tier": a.tier, "team": a.team or "", "skills": lst(a.skills),
         "brand": a.brand, "spec": a.spec,
         "read": lst(a.read), "write": lst(a.write), "after": lst(a.after),
         "done_when": a.done_when, "issued_by": a.me, "created": now(), "rounds": 0,
         "max_rounds": a.max_rounds}
    errs = task_errors(t)
    if (runtimes().get(a.to) or {}).get("status") == "retired":
        errs.append(f"{a.to} is retired (TSST-ADR-004)")
    if errs:
        die("; ".join(errs))
    # Only newly issued envelopes are canonicalized; historical rows remain readable.
    t['read'] = [norm_scope(p, allow_drive=True) if p.startswith('drive:') else resolved_scope(p) for p in t['read']]
    t['write'] = [resolved_scope(p) for p in t['write']]
    spec, sep, anchor = t['spec'].partition('#')
    t['spec'] = norm_scope(spec) + (sep + anchor if sep else '')
    with Lock():
        save(t, a.me, "new")


def cmd_claim(a):
    with Lock():
        t = load(a.id)
        errs = claim_errors(t, a.me)
        if errs:
            die("; ".join(errs))
        prev = t.get("claimed_by")
        t.update(status="claimed", claimed_by=a.me, lease_until=lease(a.hours))
        run_on = rt(a.me).get("tier_" + t["tier"]) or "-"
        if a.model and a.model.lower() not in run_on.lower():
            print(f"WARN running on {a.model}; tier {t['tier']} expects: {run_on} — switch, or release if under-powered")
        save(t, a.me, "claim" + (f" on {a.model}" if a.model else "")
             + (f" (lease from {prev} expired)" if prev and prev != a.me else ""))
    print(f"tier: {t['tier']} -> run on: {run_on}\nspec: {t['spec']}\nresume: {t.get('progress') or '-'}\n"
          f"done_when: {t['done_when']}")
    if t.get("team"):
        print(f"AGENT: {agent_for(t['team'], t.get('skills')) or '-'}\nRUN ON: {run_on}")
    if t.get("team") or t.get("skills"):
        print("LOAD BEFORE WORK (TSST rule: team + skills, no ad-hoc work):")
        for x in TEAM_LOAD.get(t.get("team"), []) + list(t.get("skills") or []):
            print(f"  {x}")


def lease(hours):
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%MZ")


def cmd_progress(a):
    with Lock():
        t = load(a.id)
        need_claimer(t, a.me)
        t.update(progress=a.note, lease_until=lease(a.hours))
        save(t, a.me, "progress", a.note)


def cmd_release(a):
    """Hand the task to any other capable runtime (limit reached, context full)."""
    with Lock():
        t = load(a.id)
        need_claimer(t, a.me)
        t.update(status="ready", claimed_by="", lease_until="", progress=a.note)
        save(t, a.me, "release", a.note)


def cmd_done(a):
    with Lock():
        t = load(a.id)
        need_claimer(t, a.me)
        if t.get("kind") in NEED_SKILLS:
            used = [x.strip() for x in (a.skills_used or "").split(",") if x.strip()]
            if not used:
                die("--skills-used required for work/review tasks (list the skills you applied)")
            missing = skills_unused(t.get("skills") or [], used)
            if missing:
                die(f"--skills-used must cite every task skill; missing: {', '.join(missing)}")
            t["skills_used"] = used
        try:
            res, result_path = validated_result(t, a.result)
        except (OSError, ValueError, TypeError) as exc:
            die(str(exc))
        if not os.path.isfile(result_path):
            die(f"result file missing: {res}")
        if result_in_scope(res, OUT_REL) and os.path.getsize(result_path) > MAX_OUT_BYTES:
            die(f"result file > {MAX_OUT_BYTES} bytes — compress it")
        t.update(status="done", result=res, sha256=sha(res), lease_until="", note=a.note or "")
        save(t, a.me, "done", a.note or "")


def cmd_block(a):
    with Lock():
        t = load(a.id)
        need_claimer(t, a.me)
        t.update(status="blocked", lease_until="", note=a.note)
        save(t, a.me, "block", a.note)


def cmd_close(a):
    need_lead(a.me)
    with Lock():
        t = load(a.id)
        if t["status"] != "done":
            die(f"{a.id} is {t['status']}, not done")
        if t.get("kind") in NEED_SKILLS and not t.get("skills_used") and (t.get("created") or "") >= SKILLS_FROM:
            die(f"{a.id} has no skills_used — reopen: work must show use of its team skills")
        if t.get("claimed_by") == a.me:
            die("no self-acceptance: the runtime that did the work cannot close it")
        try:
            validated_result(t, t.get('result'))
        except (OSError, ValueError, TypeError) as exc:
            die(str(exc))
        if not same(t["result"], t["sha256"]):
            die("result changed after done (sha256 mismatch) — reopen instead")
        t.update(status="closed", note=a.note or t.get("note", ""))
        save(t, a.me, "close", a.note or "")


def cmd_reopen(a):
    """Lead answers a block or rejects a result. Each reopen is one round."""
    need_lead(a.me)
    with Lock():
        t = load(a.id)
        if t["status"] == "escalated" and not a.user_approved:
            die("escalated: only the user can reopen (--user-approved)")
        if t["status"] not in ("done", "blocked", "escalated"):
            die(f"{a.id} is {t['status']}")
        t["rounds"] = int(t.get("rounds") or 0) + 1
        if t["rounds"] > int(t.get("max_rounds") or 1) and not a.user_approved:
            t.update(status="escalated", note=a.note)
            save(t, a.me, "escalate", a.note)
            return
        t.update(status="ready", claimed_by="", lease_until="", result="", sha256="", note=a.note)
        save(t, a.me, "reopen", a.note)


def cmd_rehash(a):
    """Lead re-records the sha256 of a done task's result after a deliberate, Lead-verified edit."""
    need_lead(a.me)
    if not (a.note or "").strip():
        die("--note required: say why the result changed and how the change was verified")
    with Lock():
        t = load(a.id)
        if t["status"] != "done":
            die(f"{a.id} is {t['status']}, not done — rehash only applies to done tasks")
        res, old = t.get("result"), t.get("sha256")
        if not res or not old:
            die(f"{a.id} has no recorded result/sha256")
        try:
            _, result_path = validated_result(t, res)
        except (OSError, ValueError, TypeError) as exc:
            die(str(exc))
        if not os.path.isfile(result_path):
            die(f"result file missing: {res}")
        if same(res, old):
            print(f"OK {a.id} rehash no-op — sha256 already matches")
            return
        new = sha(res)
        t["sha256"] = new
        save(t, a.me, "rehash", f"{old[:8]}->{new[:8]}: {a.note}")


def cmd_cancel(a):
    need_lead(a.me)
    with Lock():
        t = load(a.id)
        t["status"] = "cancelled"
        save(t, a.me, "cancel", a.note)


def _split_inline(rest):
    """`value   # comment` -> (value, '   # comment'); a quoted value may itself contain ' #'."""
    rest = rest.rstrip()
    if rest.startswith('"'):
        try:
            _, end = json.JSONDecoder().raw_decode(rest)
        except ValueError:
            end = 0
        return rest[:end].strip(), rest[end:] if rest[end:].lstrip().startswith("#") else ""
    i = rest.find(" #")
    return (rest[:i].rstrip(), rest[i:]) if i >= 0 else (rest.strip(), "")


def edit_runtime(text, runtime, updates):
    """Targeted line edits inside one top-level runtime block; every other byte (comments, order,
    spacing, other runtimes) is preserved. Missing keys are appended to the end of the block."""
    lines = text.split("\n")
    start = next((i for i, l in enumerate(lines) if re.match(rf"{re.escape(runtime)}:\s*(#.*)?$", l)), None)
    if start is None:
        raise KeyError(runtime)
    end = start + 1
    while end < len(lines) and (not lines[end].strip() or lines[end].startswith((" ", "\t", "#"))):
        end += 1
    while end > start + 1 and (not lines[end - 1].strip() or lines[end - 1].startswith("#")):
        end -= 1                                  # trailing blank/column-0 comment lines are not part of the block
    for key, val in updates.items():
        v = _dump_val(val)
        for i in range(start + 1, end):
            m = re.match(rf"(\s+){re.escape(key)}:(\s*)(.*)$", lines[i])
            if m:
                comment = _split_inline(m.group(3))[1]
                lines[i] = f"{m.group(1)}{key}:" + (f" {v}" if v else "") + comment
                break
        else:
            lines.insert(end, f"  {key}:" + (f" {v}" if v else ""))
            end += 1
    return "\n".join(lines)


def save_runtime(runtime, updates):
    with open(RUNTIMES, encoding="utf-8") as f:
        text = f.read()
    with open(RUNTIMES, "w", encoding="utf-8", newline="\n") as f:
        f.write(edit_runtime(text, runtime, updates))


def cmd_limit(a):
    """Mark a runtime limited/available so routing moves work elsewhere."""
    if a.runtime != a.me:
        need_lead(a.me)
    with Lock():
        data = runtimes()
        r = data.get(a.runtime)
        if not isinstance(r, dict):
            die(f"unknown runtime {a.runtime}")
        if r.get("status") == "retired":
            die(f"{a.runtime} is retired (TSST-ADR-004) — edit runtimes.yaml with a new ADR to revive it")
        if not a.clear:
            try:
                ts(a.until)
            except ValueError:
                die("--until must be UTC like 2026-10-04T18:00Z")
        r.update(status="available", until="") if a.clear else r.update(status="limited", until=a.until)
        save_runtime(a.runtime, {"status": r["status"], "until": r["until"]})
        with open(LOG, "a", encoding="utf-8", newline="\n") as f:
            f.write("\t".join([now(), "-", a.me, f"limit {a.runtime}", r["status"] + " " + r.get("until", "")]) + "\n")
    print(f"OK {a.runtime} {r['status']} {r.get('until', '')}")


def cmd_verify(a):
    """Lead promotes a capability from unverified to caps after a closed probe."""
    need_lead(a.me)
    with Lock():
        data = runtimes()
        r = data.get(a.runtime)
        if not isinstance(r, dict):
            die(f"unknown runtime {a.runtime}")
        unv = r.get("unverified") or []
        if a.cap not in unv:
            die(f"{a.cap} not in {a.runtime}.unverified")
        p = path_of(a.evidence)
        ev = load(a.evidence) if p else {}
        proven = set(ev.get("needs") or []) | ({"fs_write"} if ev.get("result") else set())
        if not p or os.path.dirname(p) != CLOSED or ev.get("status") != "closed":
            die(f"evidence must be a closed task, got {a.evidence}")
        if ev.get("kind") != "probe" or ev.get("claimed_by") != a.runtime:
            die(f"{a.evidence} is not a probe done by {a.runtime}")
        if a.cap not in proven:
            die(f"{a.evidence} did not exercise {a.cap}")
        try:
            validated_result(ev, ev.get('result'))
        except (OSError, ValueError, TypeError) as exc:
            die(str(exc))
        if not same(ev["result"], ev.get("sha256")):
            die(f"{a.evidence} result changed since close")
        r["unverified"] = [c for c in unv if c != a.cap]
        r["caps"] = (r.get("caps") or []) + [a.cap]
        r["verified"] = now()[:10]
        save_runtime(a.runtime, {"unverified": r["unverified"], "caps": r["caps"], "verified": r["verified"]})
        with open(LOG, "a", encoding="utf-8", newline="\n") as f:
            f.write("\t".join([now(), "-", a.me, f"verify {a.runtime}.{a.cap}", a.evidence]) + "\n")
    print(f"OK {a.runtime}.{a.cap} verified")


# ------------------------------------------------------------------ validation
def task_errors(t, skipped=None):
    """`skipped` (a list, passed only by `check`) collects the client-folder files that cannot be
    looked at in a checkout without client folders; every other caller keeps the strict answer."""
    e = []
    tid = t.get("id", "?")
    for k in ("id", "title", "kind", "status", "to", "tier", "spec", "done_when", "issued_by"):
        if not t.get(k):
            e.append(f"{tid}: missing {k}")
    if t.get("kind") not in KINDS:
        e.append(f"{tid}: kind must be one of {sorted(KINDS)}")
    if t.get("tier") not in TIERS:
        e.append(f"{tid}: tier must be one of {sorted(TIERS)}")
    if t.get("tier") == "DEEP":
        e.append(f"{tid}: DEEP work stays with the lead, never queued")
    if t.get("status") not in STATUSES:
        e.append(f"{tid}: bad status")
    spec = (t.get("spec") or "").split("#", 1)[0]
    if spec:
        try:
            if skipped is not None and is_client(spec) and not clients_present():
                norm_scope(spec)  # the spelling is still checked
                skipped.append(f"{tid}: spec {spec}")
            elif not os.path.exists(repo_path(spec)):
                e.append(f"{tid}: spec not found {spec}")
        except ValueError as exc:
            e.append(f'{tid}: {exc}')
    e += [f"{tid}: {x}" for x in scope_errors(t.get('read', []), False)]
    e += [f"{tid}: {x}" for x in scope_errors(t.get('write', []), True)]
    if t.get("kind") in NEED_SKILLS and (t.get("created") or "") >= SKILLS_FROM and t.get("status") != "cancelled":
        e += team_skill_errors(t)
        if t.get("status") in ("done", "closed") and not t.get("skills_used"):
            e.append(f"{tid}: done/closed work needs skills_used")
    if t.get("to") != "any" and not isinstance(runtimes().get(t.get("to")), dict):
        e.append(f"{tid}: unknown runtime {t.get('to')}")
    return e


def team_skill_errors(t):
    tid, e = t.get("id", "?"), []
    team = t.get("team")
    if team not in TEAMS:
        e.append(f"{tid}: team must be one of {sorted(TEAMS)} (TSST rule: team + skills)")
    elif not os.path.isfile(os.path.join(ROOT, TEAM_LOAD[team][0])):
        e.append(f"{tid}: team file not found {TEAM_LOAD[team][0]}")
    if not t.get("skills"):
        e.append(f"{tid}: skills required for {t.get('kind')} tasks (TSST rule: team + skills)")
    e += [f"{tid}: {x}" for x in scope_errors(t.get("skills") or [], False)]
    index = skill_index() if t.get("skills") else []
    for sk in t.get("skills") or []:
        if index is None:
            e.append(f"{tid}: skill index missing ({SKILL_INDEX_REL}); run python TSST/skills/build_index.py")
            break
        hit = lookup_skill(index, sk)
        if not hit:
            e.append(f"{tid}: skill not in {SKILL_INDEX_REL}: {sk}")
        elif not os.path.isdir(os.path.join(ROOT, hit["path"])):
            e.append(f"{tid}: skill {hit['id']} package missing on disk: {hit['path']}")
        elif hit["status"] == "DEPRECATED":
            e.append(f"{tid}: skill {hit['id']} is DEPRECATED")
        elif team in TEAMS and team != "lead" and hit["team"] not in (team, "core"):
            e.append(f"{tid}: skill {hit['id']} belongs to team {hit['team']}, task team is {team}")
    return e


SKILL_INDEX_REL = "TSST/skills/index.yaml"
_INDEX_LINE = re.compile(r'^\s*- \{id: (?P<id>[^,]+), team: (?P<team>[^,]+), owner: (?P<owner>[^,]+), '
                         r'status: (?P<status>[^,]+), version: "[^"]*", trigger: ".*", path: (?P<path>"[^"]*")\}\s*$')


def skill_index():
    """Parse the generated flow-style index (no PyYAML). Returns list of dicts, or None if missing/unreadable."""
    try:
        with open(os.path.join(ROOT, SKILL_INDEX_REL), encoding="utf-8-sig") as f:
            lines = f.read().splitlines()
    except OSError:
        return None
    out = []
    for ln in lines:
        m = _INDEX_LINE.match(ln)
        if m:
            d = m.groupdict()
            d["path"] = json.loads(d["path"])
            out.append({k: v.strip() for k, v in d.items()})
    return out or None


def lookup_skill(index, ref):
    """Find an index entry by id, full path (optionally /SKILL.md), or folder basename."""
    r = norm_skill(ref)
    if r.lower().endswith("/skill.md"):
        r = r[: -len("/SKILL.md")]
    rl = r.lower()
    for s in index:
        if rl in (s["id"].lower(), s["path"].lower(), s["path"].rsplit("/", 1)[-1].lower()):
            return s
    return None


def check_all(skipped=None):
    """Audit the whole queue. Returns (errors, warnings).

    Pass a list as `skipped` to audit a checkout without client folders (a git clone, CI): the spec
    and result files that live under TSST/brands are then listed there instead of being reported as
    missing. Nothing is skipped where the client folders are present, or when `skipped` is None.
    """
    ensure_dirs()
    errs, warns = [], []
    no_clients = skipped is not None and not clients_present()
    rts = runtimes()
    for name, r in rts.items():
        if isinstance(r, dict) and set(r.get("caps") or []) & set(r.get("unverified") or []):
            errs.append(f"runtime {name}: cap both verified and unverified")
    for d in (TASKS, CLOSED):
        for n in os.listdir(d):
            if n.endswith(".yaml") and os.path.getsize(os.path.join(d, n)) > MAX_TASK_BYTES:
                errs.append(f"{n}: > {MAX_TASK_BYTES} bytes")
    active = []
    for t in all_tasks(include_closed=True):
        if not ID_RE.fullmatch(str(t.get("id", ""))) or not path_of(t["id"]):
            errs.append(f"task id/file mismatch: {t.get('id')!r}")
            continue
        errs += task_errors(t, skipped)
        if t["status"] in ("done", "closed"):
            try:
                resolved, result_path = validated_result(t, t.get('result'))
                if no_clients and is_client(resolved):
                    skipped.append(f"{t['id']}: result {resolved}")  # scope was still validated above
                elif not os.path.isfile(result_path):
                    errs.append(f"{t['id']}: result missing")
                elif not same(t['result'], t.get('sha256')):
                    errs.append(f"{t['id']}: result sha256 mismatch (edited after done)")
            except (OSError, ValueError, TypeError) as exc:
                errs.append(f"{t['id']}: {exc}")
        if t["status"] == "claimed":
            if expired(t):
                warns.append(f"{t['id']}: lease expired ({t['claimed_by']}) — reclaimable")
            else:
                active.append(t)
        if t["status"] in ("done", "blocked", "escalated"):
            warns.append(f"{t['id']}: {t['status']} — waiting for lead")
    for i, x in enumerate(active):
        for y in active[i + 1:]:
            if any(overlaps(w, v) for w in scope_items(x.get('write', [])) for v in scope_items(y.get('write', []))):
                errs.append(f"write-scope conflict {x['id']} / {y['id']}")
    out = os.path.join(BUS, "out")
    for n in os.listdir(out):
        if n != "desktop.ini" and os.path.getsize(os.path.join(out, n)) > MAX_OUT_BYTES:
            errs.append(f"out/{n}: > {MAX_OUT_BYTES} bytes")
    return errs, warns


def cmd_check(a):
    skipped = []
    errs, warns = check_all(skipped)
    for w in warns:
        print("WARN " + w)
    for e in errs:
        print("FAIL " + e)
    if skipped:
        # never counted as passed: these files exist only where the client folders are
        print(f"SKIP {len(skipped)} spec/result files not checked: {CLIENT_SKIP_REASON}")
        for x in skipped[:5]:
            print("  skip: " + x)
        if len(skipped) > 5:
            print(f"  skip: ... +{len(skipped) - 5} more")
    print(("bus OK" if not errs else f"bus FAILED ({len(errs)})")
          + (f" - {len(skipped)} skipped" if skipped else ""))
    sys.exit(1 if errs else 0)


def main():
    ensure_dirs()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(prog="bus.py", description="TSST task bus (TSST/context/bus.md)")
    sub = p.add_subparsers(dest="cmd", required=True)

    def c(name, fn, *args):
        s = sub.add_parser(name)
        s.set_defaults(fn=fn)
        for a in args:
            s.add_argument(*a[0], **a[1])
        return s

    me = (["--me"], dict(required=True, help="your runtime id (runtimes.yaml)"))
    # evidence = closed probe task id
    tid = (["id"], {})
    note = (["--note"], dict(required=True, help=f"≤{MAX_NOTE} chars"))
    hours = (["--hours"], dict(type=float, default=2.0, help="lease length"))
    c("ls", cmd_ls, (["--me"], dict(default="")))
    c("check", cmd_check)
    c("new", cmd_new, tid, me, (["--title"], dict(required=True)), (["--kind"], dict(default="work")),
      (["--to"], dict(default="any")), (["--needs"], {}), (["--tier"], dict(default="WORK")),
      (["--team"], dict(default="", help="marketing|studio|motion|build|lead (required for work/review)")),
      (["--skills"], dict(default="", help="comma list of skill paths (required for work/review)")),
      (["--brand"], dict(default="t-sag")), (["--spec"], dict(required=True)), (["--read"], {}),
      (["--write"], {}), (["--after"], {}), (["--done-when"], dict(required=True)),
      (["--max-rounds"], dict(type=int, default=1)))
    c("claim", cmd_claim, tid, me, hours, (["--model"], dict(default="", help="model you are actually running on")))
    c("progress", cmd_progress, tid, me, note, hours)
    c("release", cmd_release, tid, me, note)
    c("done", cmd_done, tid, me, (["--result"], dict(required=True)), (["--note"], dict(default="")),
      (["--skills-used"], dict(default="", help="comma list: every task skill you applied (work/review)")))
    c("block", cmd_block, tid, me, note)
    c("close", cmd_close, tid, me, (["--note"], dict(default="")))
    c("reopen", cmd_reopen, tid, me, note, (["--user-approved"], dict(action="store_true")))
    c("cancel", cmd_cancel, tid, me, note)
    c("rehash", cmd_rehash, tid, me, note)
    c("limit", cmd_limit, (["runtime"], {}), me, (["--until"], dict(default="")),
      (["--clear"], dict(action="store_true")))
    c("verify", cmd_verify, (["runtime"], {}), (["cap"], {}), me, (["--evidence"], dict(required=True, help="closed probe task id")))
    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
