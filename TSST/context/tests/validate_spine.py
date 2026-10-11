#!/usr/bin/env python3
"""Validate the provider-neutral TSST spine (stdlib only; PyYAML used if importable).

Checks: structural integrity, provider neutrality, brand isolation / no duplication,
and a cold-start router simulation with byte-size accounting against a naive baseline.
Exit code is non-zero on any failure.

Run from anywhere:  python TSST/context/tests/validate_spine.py
"""
import glob
import hashlib
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
TSST = os.path.join(REPO, "TSST")
# CI / git clone: Drive-native `.gdoc` stubs are not in git (.gitignore), and Drive folders
# holding only stubs do not exist. Their existence is checked only where Drive is mounted.
NO_DRIVE = bool(os.environ.get("TSST_NO_DRIVE") or os.environ.get("CI"))


def drive_only(tok):
    return NO_DRIVE and (tok.endswith(".gdoc") or (tok.startswith("REAL_MEMORY/") and tok.endswith("/")))


WARNINGS = []  # non-failing warnings (printed)
NOTES = []  # informational lines (expected-absent Drive stubs); printed, never failures


def gdoc_expected_absent(tok, export=None):
    """True when `tok` is a Drive-native `*.gdoc` stub that is absent here but whose repo-native
    export exists (boot.md: absent .gdoc outside Drive = SOURCE_UNREADABLE_IN_CURRENT_RUNTIME, not
    a broken pointer). `export` = the manifest's export path; otherwise the sibling `X` / `X.md`
    of `X.gdoc`. Stays False (so the caller fails) when the paired export is also missing."""
    if not tok.endswith(".gdoc") or os.path.exists(P(tok)):
        return False
    base = tok[:-5]
    cands = [export] if export else [base, base + ".md"]
    if any(c and os.path.isfile(P(c)) for c in cands):
        NOTES.append(f"{tok} (export present, stub absent: SOURCE_UNREADABLE_IN_CURRENT_RUNTIME)")
        return True
    return False


def P(rel):
    if os.path.isabs(rel):  # already absolute (files_under results); splitting "/" breaks it on POSIX
        return rel
    return os.path.join(REPO, *rel.split("/"))


def rel(path):
    return os.path.relpath(path, REPO).replace(os.sep, "/")


def read(rel_path):
    with open(P(rel_path), encoding="utf-8") as f:
        return f.read()


def size(rel_path):
    return os.path.getsize(P(rel_path))


# ---------------------------------------------------------------- YAML loading
def _strip_comment(line):
    out, q = [], None
    for i, ch in enumerate(line):
        if q:
            if ch == q:
                q = None
        elif ch in "\"'" and (i == 0 or line[i - 1] in " [,:"):
            q = ch
        elif ch == "#" and (i == 0 or line[i - 1] in " \t"):
            break
        out.append(ch)
    return "".join(out).rstrip()


def _scalar(s):
    s = s.strip()
    if s == "{}":
        return {}
    if s == "[]":
        return []
    if s.startswith("[") and s.endswith("]"):
        inner = s[1:-1].strip()
        return [x.strip() for x in inner.split(",") if x.strip()] if inner else []
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'":
        return s[1:-1]
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if s in ("true", "false"):
        return s == "true"
    return s


def _split_key(text):
    """Split 'key: value' at the first colon followed by space/EOL (outside quotes)."""
    q = None
    for i, ch in enumerate(text):
        if q:
            if ch == q:
                q = None
        elif ch in "\"'" and (i == 0 or text[i - 1] == " "):
            q = ch
        elif ch == ":" and (i + 1 == len(text) or text[i + 1] == " "):
            return text[:i].strip(), text[i + 1:].strip()
    return None, text


def mini_yaml(text):
    """Minimal YAML subset: nested maps, block lists of scalars, inline [a, b], {}."""
    lines = []
    for raw in text.splitlines():
        s = _strip_comment(raw)
        if s.strip():
            lines.append((len(s) - len(s.lstrip(" ")), s.strip()))

    def parse(idx, indent):
        if lines[idx][1].startswith("- "):
            out = []
            while idx < len(lines) and lines[idx][0] == indent and lines[idx][1].startswith("- "):
                out.append(_scalar(lines[idx][1][2:]))
                idx += 1
            return out, idx
        out = {}
        while idx < len(lines) and lines[idx][0] == indent and not lines[idx][1].startswith("- "):
            key, val = _split_key(lines[idx][1])
            key = _scalar(key) if key else key
            idx += 1
            if val == "":
                if idx < len(lines) and lines[idx][0] > indent:
                    out[key], idx = parse(idx, lines[idx][0])
                else:
                    out[key] = None
            else:
                out[key] = _scalar(val)
        return out, idx

    return parse(0, lines[0][0])[0] if lines else {}


def load_yaml(rel_path):
    text = read(rel_path)
    try:
        import yaml  # type: ignore
        return yaml.safe_load(text)
    except ImportError:
        return mini_yaml(text)


# ---------------------------------------------------------------- file helpers
def files_under(rel_dir, exts=None):
    base = P(rel_dir)
    res = []
    for root, _dirs, names in os.walk(base):
        for n in names:
            if n.lower() == "desktop.ini":
                continue
            if exts and os.path.splitext(n)[1].lower() not in exts:
                continue
            res.append(os.path.join(root, n))
    return sorted(res)


def is_text_spine(path):
    return os.path.splitext(path)[1].lower() in (".md", ".yaml", ".yml", ".py", ".txt")


# ---------------------------------------------------------------- results
RESULTS = []  # (group, name, ok, detail)


def check(group, name, ok, detail=""):
    RESULTS.append((group, name, bool(ok), detail))


# ---------------------------------------------------------------- 1. structural
def structural(portfolio):
    brands = portfolio["brands"]
    missing = []
    for bid in brands:
        for sub in ("brand.md", "rules.md", "scope.md", "status.md", "memory/source.md"):
            if not os.path.isfile(P(f"TSST/brands/{bid}/{sub}")):
                missing.append(f"{bid}/{sub}")
        if not os.path.isdir(P(f"TSST/brands/{bid}/projects")):
            missing.append(f"{bid}/projects/")
    check("structural", "brand folders complete", not missing, ", ".join(missing))

    bad = []
    for bid, b in brands.items():
        ptrs = [b.get("memory")]
        for pid, pr in (b.get("projects") or {}).items():
            ptrs += [pr.get("checkpoint"), pr.get("memory")]
        for ptr in ptrs:
            if ptr and not os.path.exists(P(ptr)):
                bad.append(f"{bid}:{ptr}")
    check("structural", "portfolio checkpoint/memory paths exist", not bad, ", ".join(bad))

    # backticked repo paths
    files = (
        files_under("TSST/teams", {".md"})
        + files_under("TSST/brands", {".md"})
        + [f for f in glob.glob(P("TSST/context/*.md"))]
    )
    prefixes = ("TSST/", "CRM_", "REAL_MEMORY/", ".agents/", ".claude/")
    broken, n_checked = [], 0
    for f in files:
        if os.path.basename(f).startswith(("bridge-request-", "MORNING_QUESTIONS")):
            # bridge requests list future targets; MORNING_QUESTIONS cite unmerged feature-branch paths
            continue
        txt = open(f, encoding="utf-8").read()
        for line in txt.splitlines():
            parent_dir = None
            for m in re.finditer(r"`([^`\n]+)`", line):
                # Marker convention: a path span directly followed by `(planned)`, `(to be created)`,
                # `(pattern)` (placeholder name) or `(branch-only)` (only in the app worktree/branch) need not exist.
                marked = re.match(r"\s*\((?:planned|to be created|pattern|branch-only)\)", line[m.end():]) is not None
                for tok in m.group(1).split():
                    tok = tok.strip(",;()").lstrip("/") if tok.startswith("/") else tok.strip(",;()")
                    tok = tok.split("#", 1)[0]
                    tok = re.sub(r":\d+(?:-\d+)?$", "", tok)  # `path:12` / `path:12-20` line refs
                    if any(c in tok for c in "<*…{") or tok.startswith("drive:"):
                        continue
                    if tok.startswith("CRM_") and "/" not in tok and "." in tok:
                        tok = "CRM_APP/" + tok  # bare doc name in CRM_APP
                    if tok.startswith(prefixes):
                        parent_dir = os.path.dirname(tok.rstrip("/"))
                        n_checked += 1
                        # Drive-native stubs: `X.md` may exist only as `X.md.gdoc` (documented)
                        if not (marked or os.path.exists(P(tok)) or os.path.exists(P(tok + ".gdoc")) or drive_only(tok)
                                or gdoc_expected_absent(tok)):
                            broken.append(f"{rel(f)} -> {tok}")
                    elif parent_dir and re.fullmatch(r"[A-Za-z0-9_.\-]+", tok) and "/" not in tok \
                            and "." not in tok and tok.startswith(("tsst-",)) and "-sk-" in tok:
                        # bare sibling skill names (`tsst-<team>-sk-NNN-...`) after a prefixed path in the
                        # same row; agent names like `tsst-dev` are not siblings
                        n_checked += 1
                        if not os.path.exists(P(f"{parent_dir}/{tok}")):
                            broken.append(f"{rel(f)} -> {parent_dir}/{tok}")
    check("structural", f"backticked repo paths exist ({n_checked} checked)", not broken,
          "; ".join(broken[:40]))

    # skill ids in studio / build maps
    def ids_for(team_file, section_dir_glob, prefix):
        txt = read(team_file)
        unresolved, total = [], 0
        for line in txt.splitlines():
            if not line.startswith("|") or "`" in line:
                continue
            cells = [c.strip() for c in line.strip("|").split("|")]
            if len(cells) < 2:
                continue
            for part in re.split(r"[,\s]+", cells[-1]):
                m = re.fullmatch(r"(\d{3})(?:[–-](\d{3}))?", part)
                if not m:
                    continue
                lo, hi = int(m.group(1)), int(m.group(2) or m.group(1))
                for n in range(lo, hi + 1):
                    total += 1
                    if not glob.glob(P(f"{section_dir_glob}/{prefix}{n:03d}-*")):
                        unresolved.append(f"{prefix}{n:03d}")
        return total, unresolved

    for team, d, pre in (("TSST/teams/studio/team.md", "TSST/CREATIVE/skills", "tsst-creative-sk-"),
                         ("TSST/teams/motion/team.md", "TSST/MOTION/skills", "tsst-motion-sk-"),
                         ("TSST/teams/build/team.md", "TSST/DEV/skills", "tsst-dev-sk-")):
        total, unresolved = ids_for(team, d, pre)
        check("structural", f"skill ids resolve: {team.split('/')[2]} ({total} ids)",
              total > 0 and not unresolved, ", ".join(unresolved))


# ---------------------------------------------------------------- 2. neutrality
NEUTRAL_PATTERNS = [
    ("haiku", r"haiku"), ("sonnet", r"sonnet"), ("opus", r"\bopus\b"),
    ("gpt-", r"(?<![a-z])gpt-"), ("gemini-", r"gemini-"), ("claude-", r"claude-"),
    ("o3", r"\bo3\b"), ("veo", r"\bveo\b"),
]


# Report/brief material may name tools and models (external-tool briefs, run reports, benchmark results).
# Exempt: any `/codex/` or `/reports/` folder, the local-ai-bench results folder, and external-tool brief
# files (basename `BRIEF_*.md` or `*_BRIEF_*.md`). Spine files (status.md, rules.md, memory/, project.md...) stay strict.
BENCH_DIR = "TSST/brands/t-sag/projects/tsst-ai/local-ai-bench/"


def neutrality_exempt(rp):
    return ("/codex/" in rp or "/reports/" in rp or rp.startswith(BENCH_DIR)
            or re.search(r"(^|_)BRIEF_[^/]*$", rp.rsplit("/", 1)[-1]) is not None)


def neutrality():
    targets = [P("TSST/context/boot.md"), P("TSST/context/router.yaml"), P("TSST/context/models.yaml"),
               P("TSST/context/bus.md"), P("TSST/context/bridge.md")]
    targets += files_under("TSST/core") + files_under("TSST/teams") + files_under("TSST/brands")
    hits = []
    for f in targets:
        if not is_text_spine(f) or neutrality_exempt(rel(f)):
            continue
        txt = open(f, encoding="utf-8").read()
        for name, pat in NEUTRAL_PATTERNS:
            for m in re.finditer(pat, txt, re.I):
                hits.append(f"{rel(f)}:{name}")
                break
    check("neutrality", f"no provider model names ({len(targets)} files)", not hits, ", ".join(hits))


# ---------------------------------------------------------------- 3. isolation
def isolation():
    extra = []
    for bdir in glob.glob(P("TSST/brands/*/memory")):
        for n in os.listdir(bdir):
            if n.lower() in ("source.md", "desktop.ini"):
                continue
            extra.append(rel(os.path.join(bdir, n)))
    check("isolation", "brand memory/ holds only source.md", not extra, ", ".join(extra))

    rm_files = files_under("REAL_MEMORY/TSST_REAL_MEMORY", {".md"})
    rm_hash = {hashlib.sha256(open(f, "rb").read()).hexdigest() for f in rm_files}
    rm_names = {os.path.basename(f).lower() for f in rm_files}
    dup = []
    for f in files_under("TSST/brands/t-sag/memory"):
        if hashlib.sha256(open(f, "rb").read()).hexdigest() in rm_hash:
            dup.append(rel(f))
        # source.md is the fixed pointer name in every brand tree (incl. exported RM drafts);
        # for it only identical content (hash, above) counts as a copy.
        elif os.path.basename(f).lower() in rm_names and os.path.basename(f).lower() != "source.md":
            dup.append(rel(f) + " (same filename as RM file)")
    check("isolation", "t-sag/memory has no copied Real Memory files", not dup, ", ".join(dup))

    # Size budget = the boot/spine files the router loads at task start (see resolve() below):
    # per brand status.md, memory/source.md, rules.md and each projects/*/project.md. Project work docs
    # (handoffs, briefs, reports, specs) and assets/ are NOT counted: they load only on demand.
    spine = []
    for bdir in glob.glob(P("TSST/brands/*/")):
        for sub in ("status.md", "rules.md", "memory/source.md"):
            f = os.path.join(bdir, *sub.split("/"))
            if os.path.isfile(f):
                spine.append(f)
        spine += glob.glob(os.path.join(bdir, "projects", "*", "project.md"))
    spine.append(P("TSST/core/portfolio.yaml"))
    total = sum(os.path.getsize(f) for f in spine)
    check("isolation", f"brand spine (router-loaded boot files, {len(spine)} files) < 60 KB ({total} bytes)",
          total < 60 * 1024)

    # WARNING (printed, not failing): media/binary files under TSST/brands outside assets/ belong in assets/.
    media = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4", ".mov", ".webm", ".mp3", ".wav",
             ".zip", ".pdf", ".ttf", ".otf", ".woff", ".woff2", ".psd", ".ai", ".docx", ".xlsx", ".pptx")
    for f in files_under("TSST/brands"):
        if os.path.splitext(f)[1].lower() in media and "/assets/" not in f.replace(os.sep, "/"):
            WARNINGS.append(f"media/binary outside assets/: {rel(f)}")


# ---------------------------------------------------------------- 4. router simulation
LATIN = re.compile(r"[a-z0-9]")


def norm(s):
    s = unicodedata.normalize("NFKC", s).lower()
    s = s.replace("ـ", "")  # tatweel
    s = re.sub(r"[ً-ٰٟ]", "", s)  # arabic diacritics
    s = re.sub(r"\s+", " ", s)
    return s


def alias_match(alias, text):
    a = norm(alias)
    if re.search(r"[؀-ۿ]", a):
        # Arabic: substring on normalized text, but not followed by another Arabic letter
        # (prevents e.g. "فيل" matching inside "فيلم"); left side open for clitics (ل/ب/و).
        return re.search(re.escape(a) + r"(?![؀-ۿ])", text) is not None
    return re.search(r"(?<![a-z0-9])" + re.escape(a) + r"(?![a-z0-9])", text) is not None


def keyword_match(kw, text):
    kw = norm(kw)
    words = kw.split()
    if all(alias_match(w, text) for w in words):
        return True
    return False


def team_from_text(text, router):
    best, score = None, 0
    for team, kws in router["team_routing"].items():
        if team == "multi_team_order":
            continue
        s = 0
        for kw in kws:
            if keyword_match(kw, text):
                s += 1
            else:  # generic head-word match, e.g. "campaign" for "campaign plan"
                w = norm(kw).split()
                if len(w) > 1 and alias_match(w[0], text) and w[0] not in ("content", "agent", "paid"):
                    s += 1
        if s > score:
            best, score = team, s
    return best


def tier_for(text, team):
    if re.search(r"architect|conflict|acceptance|irreversible", text):
        return "DEEP"
    if re.search(r"\b(image|logo)\b", text):
        return "IMAGE"
    if re.search(r"\bvideo\b", text):
        return "VIDEO"
    if re.search(r"where are we|status|inventory|grep|classif", text):
        return "FAST"
    if re.search(r"\b(code|tests?|migration|audit)\b", text) or team == "build":
        return "CODE"
    return "WORK"


def resolve(request, router, portfolio):
    text = norm(request)
    brands = portfolio["brands"]
    matched = [b for b, al in router["brand_aliases"].items() if any(alias_match(a, text) for a in al)]
    if len(matched) > 1:
        return {"clarify": True, "reason": f"several brands matched: {matched}"}
    if not matched and re.search(r"(?<![a-z0-9])tsst(?![a-z0-9])", text):
        matched = ["t-sag"]
    if not matched:
        return {"clarify": True, "reason": "no brand matched"}
    brand = matched[0]

    # project: alias inside brand; else the brand's only project
    project = None
    for key, al in router["project_aliases"].items():
        b, p = key.split("/")
        if b == brand and any(alias_match(a, text) for a in al):
            project = p
            break
    projects = list((brands[brand].get("projects") or {}).keys())
    if project is None and len(projects) == 1:
        project = projects[0]

    files = ["TSST/core/portfolio.yaml", f"TSST/brands/{brand}/status.md",
             f"TSST/brands/{brand}/memory/source.md"]
    proj_md = None
    if project:
        proj_md = f"TSST/brands/{brand}/projects/{project}/project.md"
        files.append(proj_md)
    files += ["TSST/core/rules.md", f"TSST/brands/{brand}/rules.md"]

    team = None
    if proj_md and os.path.isfile(P(proj_md)):
        m = re.search(r"(?:^|·\s*)teams?:\s*([a-z]+)", read(proj_md), re.M)
        if m:
            team = m.group(1)
    if team is None:
        team = team_from_text(text, router) or "lead"  # no signal -> lead intake
    overhead = ["TSST/context/boot.md", "TSST/context/router.yaml"]
    if team:
        # lead has no team.md; its record is TSST/LEAD/AGENT.md (see teams/README.md)
        overhead.append("TSST/LEAD/AGENT.md" if team == "lead" else f"TSST/teams/{team}/team.md")
    return {"clarify": False, "brand": brand, "project": project, "files_to_load": files,
            "overhead": overhead, "team": team, "tier": tier_for(text, team),
            "other_brands_loaded": [b for b in brands if b != brand and any(f"/brands/{b}/" in x for x in files)]}


def baseline_bytes():
    paths = set(files_under("TSST/brands")) | set(files_under("TSST/context_os"))
    paths |= set(files_under("REAL_MEMORY/TSST_REAL_MEMORY", {".md"}))
    paths = {p for p in paths if os.path.splitext(p)[1].lower() in (".md", ".yaml", ".yml", ".py", ".json", ".txt", ".csv", ".ts", ".js")}
    for root, _d, names in os.walk(TSST):
        for n in names:
            if n == "AGENT.md":
                paths.add(os.path.join(root, n))
    return len(paths), sum(os.path.getsize(p) for p in paths)


CASES = []


def router_sim(router, portfolio):
    base_n, base_b = baseline_bytes()
    rows = []

    def run(label, req):
        r = resolve(req, router, portfolio)
        r["label"], r["req"] = label, req
        if not r["clarify"]:
            allf = r["files_to_load"] + r["overhead"]
            r["n"] = len(allf)
            r["bytes"] = sum(size(f) for f in allf)
            r["ratio"] = base_b / r["bytes"]
        rows.append(r)
        return r

    A = run("A", "كمل CRM")
    ok = (not A["clarify"] and A["brand"] == "t-sag" and A["project"] == "crm"
          and A["other_brands_loaded"] == [] and A["tier"] != "DEEP")
    if ok:
        pm = read(A["files_to_load"][3])
        m = re.search(r"## do_not_repeat\s*(.*?)(?:\n## |\Z)", pm, re.S)
        ok = bool(m) and "UI discovery" in m.group(1)
    check("router", "A  كمل CRM -> t-sag/crm, do_not_repeat has UI discovery", ok)

    B = run("B", "كمل ANVIL")
    ok = (not B["clarify"] and B["brand"] == "anvil" and B["project"] == "switch-pilot"
          and B["other_brands_loaded"] == []
          and not any("/brands/" in f and "/anvil/" not in f for f in B["files_to_load"]))
    check("router", "B  كمل ANVIL -> anvil/switch-pilot, no other brand files", ok)

    C = run("C", "اعمل Campaign لـ VILL")
    ok = (not C["clarify"] and C["brand"] == "vill-studio" and C["team"] == "marketing"
          and not any(k in f.lower() for f in C["files_to_load"] for k in ("anvil", "yakebda", "crm")))
    src = read("TSST/brands/vill-studio/memory/source.md") if not C["clarify"] else ""
    ok = ok and (".gdoc" in src.lower() or "Google-native" in src) and \
        "SOURCE_UNREADABLE_IN_CURRENT_RUNTIME" in src and "SOURCE_AVAILABLE" in src
    check("router", "C  Campaign لـ VILL -> vill-studio/marketing, per-runtime source state", ok)

    D = run("D", "كمل YAKEBDA_MS")
    ok = not D["clarify"] and D["brand"] == "yakebda-ms" and \
        not any("akyro" in f.lower() for f in D["files_to_load"]) and D["other_brands_loaded"] == []
    if ok:
        src = read("TSST/brands/yakebda-ms/memory/source.md")
        roots = len(re.findall(r"^\|\s*R\d\s*\|", src, re.M))
        ok = roots >= 2 and "Authority resolution" in src
    check("router", "D  كمل YAKEBDA_MS -> yakebda-ms, multi-root + authority rule", ok)

    E = run("E", "كمل")
    check("router", "E  ambiguous 'كمل' -> clarification, no brand", E["clarify"] and "brand" not in E)

    # extra guards
    X = resolve("اعمل فيلم لـ ANVIL", router, portfolio)
    check("router", "guard: Arabic 'فيلم' does not match alias 'فيل'",
          not X["clarify"] and X["brand"] == "anvil")
    Y = resolve("update the crmatic widget", router, portfolio)
    check("router", "guard: Latin 'crm' not matched inside other words", Y["clarify"])
    Z = resolve("كمل ANVIL و VILL", router, portfolio)
    check("router", "guard: two brands named -> clarification", Z["clarify"])
    T = resolve("راجع TSST", router, portfolio)
    check("router", "guard: 'TSST' itself -> t-sag", not T["clarify"] and T["brand"] == "t-sag")

    return rows, base_n, base_b


# ---------------------------------------------------------------- main

STATES = ("SOURCE_AVAILABLE", "SOURCE_UNREADABLE_IN_CURRENT_RUNTIME", "SOURCE_UNAVAILABLE")


def source_semantics():
    boot = read("TSST/context/boot.md")
    check("semantics", "boot.md defines the 3 per-runtime source states",
          all(st in boot for st in STATES) and "bridge" in boot.lower())
    bad = []
    for b in ("vill-studio", "yakebda-ms"):
        src = read(f"TSST/brands/{b}/memory/source.md")
        if "SOURCE_UNREADABLE_IN_CURRENT_RUNTIME" not in src or "MEMORY_SOURCE_UNAVAILABLE" in src:
            bad.append(b)
    check("semantics", "gdoc brands use runtime-specific state, not global unavailable", not bad, ", ".join(bad))
    glob_unknown = [f for f in files_under("TSST/brands", (".md",)) if "UNKNOWN in repo" in read(f)]
    check("semantics", "no brand state reported as globally UNKNOWN", not glob_unknown, ", ".join(glob_unknown))
    gd = [a for a in ("claude", "codex") if "SOURCE_UNREADABLE_IN_CURRENT_RUNTIME" not in read(f"TSST/context/adapters/{a}.md")]
    check("semantics", "filesystem adapters map .gdoc to UNREADABLE_IN_CURRENT_RUNTIME", not gd, ", ".join(gd))
    check("semantics", "chatgpt adapter declares Drive bridge",
          "bridge" in read("TSST/context/adapters/chatgpt.md").lower())


MANIFESTS = ["CRM_UI_HANDOFF/EXPORTS.yaml", "CRM_APP/EXPORTS.yaml",
             "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/EXPORTS.yaml",
             "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/EXPORTS.yaml", "TSST/CREATIVE/EXPORTS.yaml",
             "REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/EXPORTS.yaml"]


def _rows(text):
    rows, cur = [], None
    for line in text.splitlines():
        t = _strip_comment(line).strip()
        if t.startswith("- source:"):
            cur = {"source": t.split(":", 1)[1].strip()}; rows.append(cur)
        elif cur is not None and ":" in t and not t.startswith("-"):
            k, v = t.split(":", 1); cur[k.strip()] = v.strip().strip('"')
    return rows


def bridge_manifests():
    import hashlib
    missing = [m for m in MANIFESTS if not os.path.exists(P(m))]
    check("bridge", f"export manifests prepared ({len(MANIFESTS)})", not missing, ", ".join(missing))
    errs, n = [], 0
    for m in MANIFESTS:
        if not os.path.exists(P(m)):
            continue
        for r in _rows(read(m)):
            n += 1
            src, exp = r.get("source", ""), r.get("export", "")
            if not os.path.exists(P(src)) and not drive_only(src) and not gdoc_expected_absent(src, exp):
                errs.append(f"{m}: source missing {src}")
            if not exp or not os.path.exists(P(exp)):
                errs.append(f"{m}: export missing {exp}"); continue
            base = src[:-5] if src.endswith(".gdoc") else None
            if base is None or exp not in (base, base + ".md"):
                errs.append(f"{m}: bad naming {exp}")
            h = r.get("sha256", "")
            if h and h != hashlib.sha256(open(P(exp), "rb").read()).hexdigest():
                errs.append(f"{m}: sha256 mismatch {exp}")
    check("bridge", f"manifest rows valid ({n} rows)", not errs, "; ".join(errs[:5]))

def bus_protocol():
    import importlib.util
    spec = importlib.util.spec_from_file_location("tsst_bus", P("TSST/bus/bus.py"))
    bus = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bus)
    errs, _warns = bus.check_all()
    check("bus", "bus tasks valid (scopes, locks, hashes, sizes)", not errs, "; ".join(errs[:5]))
    boot = read("TSST/context/boot.md")
    check("bus", "boot.md runs the bus check", "TSST/bus/bus.py ls" in boot)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    portfolio = load_yaml("TSST/core/portfolio.yaml")
    router = load_yaml("TSST/context/router.yaml")
    load_yaml("TSST/context/models.yaml")
    check("structural", "yaml parse (portfolio/router/models)",
          "brands" in portfolio and "brand_aliases" in router)

    structural(portfolio)
    neutrality()
    isolation()
    source_semantics()
    bridge_manifests()
    bus_protocol()
    rows, base_n, base_b = router_sim(router, portfolio)

    w = max(len(r[1]) for r in RESULTS)
    print(f"{'RESULT':6} {'GROUP':11} CHECK")
    for g, n, ok, d in RESULTS:
        print(f"{'PASS' if ok else 'FAIL':6} {g:11} {n}" + (f"  <-- {d}" if (d and not ok) else ""))

    print("\nCold-start cases (files/bytes include boot.md + router.yaml + team.md overhead; bytes, not tokens)")
    print(f"{'case':4} {'brand':13} {'project':14} {'team':10} {'tier':5} {'files':5} {'bytes':6} baseline/pack")
    for r in rows:
        if r["clarify"]:
            print(f"{r['label']:4} CLARIFY ({r['reason']})")
        else:
            print(f"{r['label']:4} {r['brand']:13} {str(r['project']):14} {str(r['team']):10} "
                  f"{r['tier']:5} {r['n']:5} {r['bytes']:6} {r['ratio']:.0f}x")
    print(f"naive baseline: {base_n} files, {base_b} bytes")
    if WARNINGS:
        print(f"\nWARNING: {len(WARNINGS)} item(s) (not failing)")
        for w_ in WARNINGS[:10]:
            print(f"  warn: {w_}")
        if len(WARNINGS) > 10:
            print(f"  warn: ... +{len(WARNINGS) - 10} more")
    if NOTES:
        print(f"\nNOTE:{len(NOTES)} Drive-native .gdoc stub(s) absent in this runtime; repo-native export present")
        for n in sorted(set(NOTES))[:5]:
            print(f"  note: {n}")
        if len(set(NOTES)) > 5:
            print(f"  note: ... +{len(set(NOTES)) - 5} more")

    failed = [r for r in RESULTS if not r[2]]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
