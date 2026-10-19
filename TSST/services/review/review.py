#!/usr/bin/env python3
"""review.py - owner review board (REVIEW-001). Stdlib only, binds 127.0.0.1 only.

Usage: python TSST/services/review/review.py [--port 8790] [--open] [--root <brands dir>] [--read-only]

--read-only (REVIEW.bat): decisions are made in the portal; POST /api/decision answers 403 and the board hides
its decision buttons. The "review" block is then a mirror written only by pull_decisions.py.

Shows every brand/job under TSST/brands (a folder link to the client store) with all media and
copy found in each job's work/ and final/ - nothing has to be registered by hand. Per file the
owner can approve / request changes / comment; the decision is written to that job's DELIVERY.json under
"review". Round 4: the POST returns at once; sync_jobs.py runs later in ONE debounced background worker
(SyncWorker, per brand, status at /api/sync).

Round 2: each brand also lists view-only sections approved/ photos/ archive/ (entries = first-level
subfolders; archive/outside/* and archive/pilot-001/* one level deeper). Entries take no decisions and
are counted lazily (one scandir walk per entry, cached until the refresh button).

Write surface (the only one): <job>/DELIVERY.json, written atomically. No deletes, no moves.
Paths are validated against TSST/brands/<brand>/projects/<job>/ with os.path.abspath (never
Path.resolve(): TSST/brands is a junction). Page: board.html (same folder).
"""
import argparse
import datetime
import hashlib
import http.server
import json
import mimetypes
import os
import re
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

try:                                   # Round 6: thumbnails need Pillow; without it the original file is served
    from PIL import Image
except Exception:                      # pragma: no cover - depends on the machine
    Image = None

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
DEFAULT_ROOT = os.path.join(REPO, "TSST", "brands")
PORTAL_URL = "https://portal.the-systronic.duckdns.org"
READ_ONLY_MSG = "القرارات بقت من البوابة: " + PORTAL_URL
SYNC_SCRIPT = os.path.join(REPO, "TSST", "services", "delivery", "sync_jobs.py")
BUILD_SCRIPT = os.path.join(REPO, "TSST", "services", "delivery", "build_delivery.py")
FONTS_DIR = os.path.join(REPO, "TSST", "services", "delivery", "fonts")
ASSETS_DIR = os.path.join(REPO, "TSST", "services", "delivery", "assets")
PORTFOLIO = os.path.join(REPO, "TSST", "core", "portfolio.yaml")
ASSET_FILES = ("mark_white_96.png", "favicon_64.png")
DEFAULT_PORT = 8790
APP_ID = "tsst-review-board"

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
VIDEO_EXT = {".mp4", ".webm", ".mov"}
TEXT_EXT = {".md", ".txt"}
JOB_MARKERS = ("brief.md", "README.md", "DELIVERY.json", "project.md")
JOB_MARKER_DIRS = ("work", "final")
CONTENT_DIRS = ("work", "final")
BRIEF_FILES = ("brief.md", "00_BRIEF.md", "project.md")
# Round 2: brand-level view-only sections, in display order (id, Arabic label).
SECTIONS = (("approved", "المعتمد"), ("photos", "الصور"), ("archive", "الأرشيف"))
SECTION_IDS = tuple(x[0] for x in SECTIONS)
SPLIT_DIRS = {"archive": ("outside", "pilot-001")}   # their children are entries, not the folder itself
ALWAYS_SKIP = {"node_modules", "__pycache__"}
# Round 4: thumbnail / cache clutter is never listed or counted (files by name, folders by name).
SKIP_DIRS = ALWAYS_SKIP | {"cache", "thumbnails", "__thumbs__", ".thumbnails"}
SKIP_SUFFIX = (".tmp", ".pyc", ".pyo")
MAX_ENTRY_FILES = 20000
# Round 6 zones (folder names at any level): qa = internal checks (their media goes to the notes tab), ref =
# reference material (stays in the images tab, collapsed, view only), old = rejected / superseded (shown last,
# not reviewable).
QA_DIRS = {"qa", "_qa", "observations", "inspection_crops", "contact_sheets", "thumbs", "_catalog", "scripts"}
REF_DIRS = {"refs", "inputs", "parts", "shots"}
OLD_DIRS = {"rejected", "old", "archive", "superseded", "unused", "trash"}
NOISE_DIRS = QA_DIRS | REF_DIRS
ZONE_RANK = {"": 0, "ref": 1, "qa": 2, "old": 3}
SKIP_DISCOVERY = {"qa", "_qa", "observations", "external", "inputs", "refs", "parts", "shots", "files", "assets",
                  "node_modules", "__pycache__"}
SKIP_FILES = {"thumbs.db", "ehthumbs.db", "ehthumbs_vista.db", "desktop.ini", ".ds_store"}
SYNC_DELAY = 3.0          # seconds after the last decision before the background sync starts
SYNC_MAX_WAIT = 30.0      # a steady stream of clicks cannot postpone the sync longer than this
BIG_GROUP = 40
MAX_BATCH = 500
MAX_TEXT = 20000
# "changes_requested" is the Dash word (not shippable as is, redo per the note); "rejected" is the old word of the same status.
# Both are read and counted alike; the payloads of this board keep "rejected" as the one internal name.
CHANGES = ("rejected", "changes_requested")
STATUSES = ("approved", "rejected", "changes_requested", "pending")
SEG_BAD = re.compile(r'[\x00-\x1f<>:"|?*\\]')
BRAND_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*$")

mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("video/webm", ".webm")
mimetypes.add_type("video/quicktime", ".mov")
mimetypes.add_type("image/webp", ".webp")

WRITE_LOCK = threading.Lock()
COUNT_CACHE = {}          # (root, brand, entry key) -> file count; cleared by the refresh button
COUNT_LOCK = threading.Lock()


class BadRequest(Exception):
    def __init__(self, msg, code=400):
        super().__init__(msg)
        self.code = code


# ---------------------------------------------------------------- paths

def check_segments(rel):
    """Split a relative posix path; reject anything that could leave its parent."""
    if not isinstance(rel, str) or not rel or len(rel) > 600:
        raise BadRequest("bad path")
    segs = rel.split("/")
    for s in segs:
        if not s or s in (".", "..") or s.startswith(".") or SEG_BAD.search(s) or s != s.strip():
            raise BadRequest("bad path")
    return segs


def inside(parent, child):
    parent = os.path.normcase(os.path.abspath(parent))
    child = os.path.normcase(os.path.abspath(child))
    try:
        return child != parent and os.path.commonpath([parent, child]) == parent
    except ValueError:          # different drives
        return False


def job_dir(root, brand, job):
    if not isinstance(brand, str) or not BRAND_RE.match(brand):
        raise BadRequest("bad brand")
    segs = check_segments(job)
    projects = os.path.join(root, brand, "projects")
    path = os.path.join(projects, *segs)
    if not inside(projects, path) or not os.path.isdir(path):
        raise BadRequest("unknown job", 404)
    return path


def content_file(root, brand, job, rel):
    """Absolute path of a file the board may read or decide on (work/, final/, brief only)."""
    jd = job_dir(root, brand, job)
    segs = check_segments(rel)
    if not ((len(segs) == 1 and segs[0] in BRIEF_FILES) or (len(segs) > 1 and segs[0] in CONTENT_DIRS)):
        raise BadRequest("path outside work/final")
    path = os.path.join(jd, *segs)
    if not inside(jd, path) or not os.path.isfile(path):
        raise BadRequest("unknown file", 404)
    if not inside(os.path.realpath(jd), os.path.realpath(path)):
        raise BadRequest("path escapes job")
    return path


# ---------------------------------------------------------------- discovery

def list_brands(root):
    out = []
    try:
        names = sorted(os.listdir(root))
    except OSError:
        return out
    for n in names:
        if n[0] in "._" or not BRAND_RE.match(n):
            continue
        if any(os.path.isdir(os.path.join(root, n, d)) for d in ("projects",) + SECTION_IDS):
            out.append(n)
    return out


def is_job(path):
    for m in JOB_MARKERS:
        if os.path.isfile(os.path.join(path, m)):
            return True
    return any(os.path.isdir(os.path.join(path, d)) for d in JOB_MARKER_DIRS)


def discover_jobs(root, brand):
    """Relative posix paths of jobs under <brand>/projects. Every first-level folder is a job (even with
    only project.md); deeper folders are jobs when they hold a marker (nested jobs)."""
    projects = os.path.join(root, brand, "projects")
    jobs = []

    def walk(path, rel):
        try:
            entries = sorted(os.scandir(path), key=lambda e: e.name)
        except OSError:
            return
        for e in entries:
            n = e.name
            if n.startswith(".") or n in CONTENT_DIRS or n.lower() in ALWAYS_SKIP:
                continue
            if rel and n.lower() in SKIP_DISCOVERY:
                continue
            try:
                if not e.is_dir():
                    continue
            except OSError:
                continue
            r = rel + "/" + n if rel else n
            if not rel or is_job(e.path):
                jobs.append(r)
            walk(e.path, r)

    walk(projects, "")
    return jobs


def skip_file(name):
    low = name.lower()
    return name.startswith(".") or low in SKIP_FILES or low.startswith("~$") or low.endswith(SKIP_SUFFIX)


def skip_dir(name):
    return name.startswith(".") or name.lower() in SKIP_DIRS


def classify(name):
    ext = os.path.splitext(name)[1].lower()
    if ext in IMAGE_EXT:
        return "image"
    if ext in VIDEO_EXT:
        return "video"
    if ext in TEXT_EXT:
        return "text"
    return "other"


# Round 5: text files are split into three tabs by file name. This is the ONE classification function.
# Keywords match the base name (lower-case, separators -/./space folded to "_") from the start of a word,
# so "description" is not "script" and "explanation" is not "plan". qa / log / bio need whole words.
_COPY_RE = re.compile(r"(?<![a-z])(copy|caption|script|beat_sheet|hashtag)|(?<![a-z])bios?(?![a-z])")
_PLAN_RE = re.compile(r"(?<![a-z])(strategy|plan|calendar|measurement|creative_brief|shot_list|look_direction|scorecard|content_strategy)")
_NOT_RE = re.compile(r"review|request|checkpoint|(?<![a-z])(qa|logs?)(?![a-z])|(?<![a-z])client_copy")  # CLIENT_COPY* = delivery-page source
COPY_DIRS = {"copy", "captions", "caption"}
JOB_BRIEFS = ("brief.md", "00_brief.md")
TAB_ORDER = ("image", "video", "copy", "plan", "notes", "other")
REVIEW_TABS = ("image", "video", "copy", "plan")   # tabs with decision buttons (counted as pending)


def tab_of(name, folder="", job_brief=False):
    """Tab of a file: image | video | copy | plan | notes | other. `folder` = its dir relative to the job."""
    kind = classify(name)
    if kind in ("image", "video"):                       # Round 6 (F4): QA screenshots / contact sheets are work notes
        return "notes" if any(seg.lower() in QA_DIRS for seg in folder.split("/") if seg) else kind
    if kind != "text":
        return kind
    low = os.path.splitext(name)[0].lower()
    base = re.sub(r"[\s.\-]+", "_", low)
    if job_brief and name.lower() in JOB_BRIEFS:
        return "plan"
    if _NOT_RE.search(base):
        return "notes"
    in_copy_dir = any(seg.lower() in COPY_DIRS for seg in folder.split("/") if seg)
    if _COPY_RE.search(base) or in_copy_dir:
        return "copy"
    if _PLAN_RE.search(base):
        return "plan"
    return "notes"


def zone_of(path):
    """old | qa | ref | '' - by folder names anywhere in the path (old wins, then qa, then ref)."""
    segs = [s.lower() for s in path.split("/") if s]
    for zone, names in (("old", OLD_DIRS), ("qa", QA_DIRS), ("ref", REF_DIRS)):
        if any(s in names for s in segs):
            return zone
    return ""


def group_key(dirpath, keep):
    """Round 6 (F1): a group is the folder path up to `keep` segments (jobs: work + 2 levels = 3, final = 1,
    entries: 2). A zone folder (rejected/qa/refs...) deeper than that extends the key so zones never mix."""
    segs = dirpath.split("/") if dirpath else []
    if len(segs) <= keep:
        return dirpath
    special = OLD_DIRS | QA_DIRS | REF_DIRS
    for i in range(keep, len(segs)):
        if segs[i].lower() in special:
            return "/".join(segs[:i + 1])
    return "/".join(segs[:keep])


def _file_row(path, name, rel, st, brief, keep):
    gk = group_key(rel, keep)
    return {"path": path, "name": name, "dir": rel, "kind": classify(name), "tab": tab_of(name, rel, brief and not rel),
            "size": st.st_size, "mtime": st.st_mtime, "brief": brief,
            "gkey": gk, "sub": rel[len(gk) + 1:] if rel.startswith(gk + "/") else ""}


def scan_files(jd):
    """All reviewable files of a job: work/, final/ and the brief. Sorted newest first."""
    files = []
    for n in BRIEF_FILES:
        p = os.path.join(jd, n)
        if os.path.isfile(p):
            files.append(_file_row(n, n, "", os.stat(p), True, 0))
    for top in CONTENT_DIRS:
        base = os.path.join(jd, top)
        if not os.path.isdir(base):
            continue
        keep = 1 if top == "final" else 3
        stack = [(base, top)]
        while stack:
            path, rel = stack.pop()
            try:
                entries = list(os.scandir(path))
            except OSError:
                continue
            for e in entries:
                try:
                    if e.is_dir(follow_symlinks=False):
                        if not skip_dir(e.name):
                            stack.append((e.path, rel + "/" + e.name))
                        continue
                    if skip_file(e.name):
                        continue
                    if not e.is_file():
                        continue
                    st = e.stat()
                except OSError:
                    continue
                files.append(_file_row(rel + "/" + e.name, e.name, rel, st, False, keep))
    files.sort(key=lambda f: (-f["mtime"], f["path"]))
    return files


def build_groups(files):
    """One group per gkey (F1). Zones: ref/qa collapsed + view only, old collapsed + not reviewable + shown last;
    other groups collapse when more than BIG_GROUP files sit in them. Sets f["zone"] and f["reviewable"]."""
    groups = {}
    for f in files:
        key = f.get("gkey", f["dir"])
        g = groups.setdefault(key, {"dir": key, "count": 0, "newest": 0.0})
        g["count"] += 1
        g["newest"] = max(g["newest"], f["mtime"])
    for g in groups.values():
        g["zone"] = zone_of(g["dir"])
        g["noise"] = g["zone"] in ("qa", "ref")
        g["collapsed"] = g["zone"] != "" or g["count"] > BIG_GROUP
    for f in files:
        zone = groups[f.get("gkey", f["dir"])]["zone"]
        f["zone"] = zone
        f["reviewable"] = zone == "" and f["tab"] in REVIEW_TABS
    return sorted(groups.values(), key=lambda g: (ZONE_RANK[g["zone"]], -g["newest"], g["dir"]))


def read_manifest(jd):
    """(data, indent, crlf, trailing_newline, exists). Raises BadRequest on a manifest we must not touch."""
    p = os.path.join(jd, "DELIVERY.json")
    if not os.path.isfile(p):
        return {}, 2, False, True, False
    with open(p, "rb") as fh:
        raw = fh.read()
    try:
        text = raw.decode("utf-8-sig")
        data = json.loads(text)
    except (UnicodeError, ValueError):
        raise BadRequest("DELIVERY.json is not valid JSON - fix it by hand first", 409)
    if not isinstance(data, dict):
        raise BadRequest("DELIVERY.json is not an object", 409)
    return data, detect_indent(text), "\r\n" in text, text.endswith("\n"), True


def detect_indent(text):
    m = re.search(r'^([ \t]+)\S', text, re.M)
    if not m:
        return 2
    ws = m.group(1)
    if "\t" in ws:
        return "\t"
    return len(ws)


def read_review(jd):
    try:
        data = read_manifest(jd)[0]
    except BadRequest:
        return {}, "DELIVERY.json unreadable"
    rv = data.get("review")
    return (rv if isinstance(rv, dict) else {}), ""


# ---------------------------------------------------------------- Round 6: posts (copy + plans split into cards)

HEAD_RE = re.compile(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$")
FENCE_RE = re.compile(r"^\s{0,3}(```|~~~)")
META_RES = tuple(re.compile(p, re.I) for p in (
    r"skills used", r"TSST-[A-Z]+-SK", r"NOT_?READY", r"\bDRAFT\b", r"\bPENDING\b", r"_AG\b",
    r"^[\s>*_`-]*(Agent|Team|Role|State|Status|Date)\s*:", r"^[\s>*_`-]*(الحالة|التاريخ|الدور)\s*:",
    r"Reuse map", r"^[\s>*_`-]*Source:"))
_INT_LAT = (r"(?<![a-z0-9])(?:policy|risk|bidi|qa(?![a-z])|check|proof|why|pick|source|decision|next|page|about|items|"
            r"texts_intro|{opt}gloss|internal)")
INT_TITLE_RE = re.compile(_INT_LAT.replace("{opt}", "options|"), re.I)
INT_PARENT_RE = re.compile(_INT_LAT.replace("{opt}", ""), re.I)        # a ## that only groups ### options is not internal
INT_TITLE_AR = ("الإثبات", "اختبار", "مراجعة", "ملاحظ", "داخلي", "مصادر", "قرارات")
INT_LABEL_RE = re.compile(r"ملاحظة|داخلي|(?<![a-z])(?:gloss|internal|notes?)(?![a-z])", re.I)
PLATFORM_RE = re.compile(r"(?<![a-z])(?:facebook|instagram|tiktok|linkedin|stories|story|x|snapchat|reels?|fb|ig|tt|youtube|"
                         r"whatsapp)(?![a-z])|كابشن|بطاقات|سيناريو", re.I)
LABEL_RE = re.compile(r"^\*\*([^*\n]{1,160}?)\s*[:：]\s*\*\*\s*(.*)$|^\*\*([^*\n]{1,160}?)\*\*\s*[:：]\s*(.*)$")
MAX_DOC_BYTES = 400000
DOC_CACHE = {}
DOC_LOCK = threading.Lock()


def clean_inline(t):
    return re.sub(r"[*`]+", "", t).strip()


def pretty_name(name):
    base = os.path.splitext(os.path.basename(name or ""))[0]
    return re.sub(r"[-_]+", " ", base).strip() or "text"


def slugify(title):
    """Anchor text: Arabic letters kept, spaces -> '-', Latin lower-cased, other punctuation dropped."""
    t = re.sub(r"[*`~]+", "", title).strip().lower()
    t = re.sub(r"\s+", "-", t)
    t = re.sub(r"[^\w-]", "", t)
    t = re.sub(r"-{2,}", "-", t).strip("-")
    return t or "section"


class AnchorMaker:
    def __init__(self):
        self.seen = {}

    def __call__(self, title):
        base = slugify(title)
        n = self.seen.get(base, 0) + 1
        self.seen[base] = n
        return base if n == 1 else f"{base}-{n}"


def is_meta(line):
    return any(r.search(line) for r in META_RES)


def split_meta(lines):
    """(kept lines, metadata lines). Code fences are left alone."""
    kept, meta, fence = [], [], False
    for l in lines:
        if FENCE_RE.match(l):
            fence = not fence
            kept.append(l)
        elif not fence and l.strip() and is_meta(l):
            meta.append(l.strip())
        else:
            kept.append(l)
    return kept, meta


def trim(lines):
    a, b = 0, len(lines)
    while a < b and not lines[a].strip():
        a += 1
    while b > a and not lines[b - 1].strip():
        b -= 1
    return lines[a:b]


def is_internal_title(title, parent=False):
    t = re.sub(r"\([^)]*\)|（[^）]*）", " ", title)
    if any(w in t for w in INT_TITLE_AR):
        return True
    return bool((INT_PARENT_RE if parent else INT_TITLE_RE).search(t))


def split_segments(lines):
    """Body lines -> (segments, notes, chips). `**Label:**` starts a segment; platform labels become chips,
    internal labels become notes under the card."""
    segs = [{"kind": "text", "label": "", "chip": "", "sub": "", "lines": []}]
    for l in lines:
        m = LABEL_RE.match(l.strip())
        if m and not l.startswith((" ", "\t")):
            label = (m.group(1) or m.group(3) or "").strip()
            rest = (m.group(2) if m.group(1) is not None else m.group(4)) or ""
            kind = "internal" if INT_LABEL_RE.search(label) else "platform" if PLATFORM_RE.search(label) else "label"
            parts = re.split(r"\s+[—–-]\s+", label, maxsplit=1)
            segs.append({"kind": kind, "label": label, "chip": parts[0].strip() if kind == "platform" else "",
                         "sub": parts[1].strip() if kind == "platform" and len(parts) > 1 else "",
                         "lines": [rest] if rest.strip() else []})
        else:
            segs[-1]["lines"].append(l)
    out, notes, chips = [], [], []
    for sg in segs:
        md = "\n".join(trim(sg["lines"]))
        if sg["kind"] == "text" and not md:
            continue
        if sg["kind"] == "internal":
            notes.append({"label": sg["label"], "md": md})
            continue
        if sg["kind"] == "platform" and sg["chip"] and sg["chip"] not in chips:
            chips.append(sg["chip"])
        out.append({"kind": sg["kind"], "label": sg["label"], "chip": sg["chip"], "sub": sg["sub"], "md": md})
    return out, notes, chips


def make_card(anchor, title, parent, lines):
    segs, notes, chips = split_segments(trim(lines))
    return {"anchor": anchor, "title": title, "parent": parent, "chips": chips, "segments": segs, "notes": notes}


def parse_doc(text, name=""):
    """Split a copy / plan text into post cards (F10). Returns
    {title, details[], internal[{title, md}], cards[{anchor,title,parent,chips,segments,notes}], single}."""
    lines = text.lstrip("﻿").splitlines()
    details = []
    if lines and lines[0].strip() == "---":
        end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
        if end:
            details += [l.strip() for l in lines[1:end] if l.strip()]
            lines = lines[end + 1:]
    heads, fence = [], False
    for i, l in enumerate(lines):
        if FENCE_RE.match(l):
            fence = not fence
            continue
        m = None if fence else HEAD_RE.match(l)
        if m:
            heads.append((i, len(m.group(1)), clean_inline(m.group(2))))
    first_h2 = next((h for h in heads if h[1] == 2), None)
    h1 = next((h for h in heads if h[1] == 1 and (first_h2 is None or h[0] < first_h2[0])), None)
    title = h1[2] if h1 else pretty_name(name)
    if first_h2 is None:                                   # no ## : the whole file is one card
        body = [l for i, l in enumerate(lines) if not (h1 and i == h1[0])]
        body, meta = split_meta(body)
        details += meta
        return {"title": title, "details": details, "internal": [],
                "cards": [make_card(None, title, None, body)], "single": True}
    details += [l.strip() for i, l in enumerate(lines[:first_h2[0]]) if l.strip() and not (h1 and i == h1[0])]
    sec = [h for h in heads if h[1] <= 2 and h[0] >= first_h2[0]]
    anchor = AnchorMaker()
    cards, internal = [], []

    def add(a, t, parent, body, is_int):
        if is_int:
            md = "\n".join(trim(body))
            if md or t:
                internal.append({"title": (parent + " › " + t) if parent else t, "md": md})
            return
        body, meta = split_meta(body)
        details.extend(meta)
        if any(l.strip() for l in body):
            cards.append(make_card(a, t, parent, body))

    for n, h in enumerate(sec):
        end = sec[n + 1][0] if n + 1 < len(sec) else len(lines)
        kids = [k for k in heads if k[1] == 3 and h[0] < k[0] < end]
        a2 = anchor(h[2])
        if not kids:
            add(a2, h[2], None, lines[h[0] + 1:end], is_internal_title(h[2]))
            continue
        par_int = is_internal_title(h[2], parent=True)
        add(a2, h[2], None, lines[h[0] + 1:kids[0][0]], par_int)
        for m, k in enumerate(kids):
            kend = kids[m + 1][0] if m + 1 < len(kids) else end
            ak = anchor(k[2])
            add(ak, k[2], h[2], lines[k[0] + 1:kend], par_int or is_internal_title(k[2]))
    return {"title": title, "details": details, "internal": internal, "cards": cards, "single": False}


def load_doc(abs_path, rel_path):
    """Parsed doc of a text file with card keys (`<path>` for a single card, `<path>#<anchor>` otherwise)."""
    st = os.stat(abs_path)
    ck = (abs_path, st.st_mtime_ns, st.st_size)
    with DOC_LOCK:
        parsed = DOC_CACHE.get(ck)
    if parsed is None:
        with open(abs_path, "rb") as fh:
            raw = fh.read(MAX_DOC_BYTES)
        parsed = parse_doc(raw.decode("utf-8-sig", errors="replace"), os.path.basename(abs_path))
        with DOC_LOCK:
            if len(DOC_CACHE) > 600:
                DOC_CACHE.clear()
            DOC_CACHE[ck] = parsed
    doc = dict(parsed)
    doc["cards"] = [dict(c, key=rel_path if c["anchor"] is None else rel_path + "#" + c["anchor"]) for c in parsed["cards"]]
    return doc


def attach_docs(jd, files):
    for f in files:
        if f["reviewable"] and f["kind"] == "text":
            try:
                f["doc"] = load_doc(os.path.join(jd, *f["path"].split("/")), f["path"])
            except OSError:
                f["doc"] = {"title": pretty_name(f["name"]), "details": [], "internal": [], "single": True,
                            "cards": [{"anchor": None, "key": f["path"], "title": pretty_name(f["name"]), "parent": None,
                                       "chips": [], "segments": [], "notes": []}]}


def eff_status(review, key, path=None):
    """(status, inherited). A card with no decision of its own inherits an approved / changes-requested whole-file decision.
    changes_requested (new word) and rejected (old word) are one status, reported as "rejected"."""
    d = review.get(key)
    st = d.get("status") if isinstance(d, dict) else None
    if st in ("approved",) + CHANGES:
        return ("rejected" if st in CHANGES else st), False
    if path and path != key:
        d2 = review.get(path)
        st2 = d2.get("status") if isinstance(d2, dict) else None
        if st2 in ("approved",) + CHANGES:
            return ("rejected" if st2 in CHANGES else st2), True
    return "pending", False


def build_units(files, review):
    """Everything that waits for a decision: one unit per image / video / post card (never notes, other, zones)."""
    units = []
    for f in files:
        if not f["reviewable"]:
            continue
        keys = [c["key"] for c in f["doc"]["cards"]] if f.get("doc") else [f["path"]]
        for k in keys:
            st, inh = eff_status(review, k, f["path"])
            units.append({"key": k, "path": f["path"], "tab": f["tab"], "status": st, "inherited": inh})
    return units


def tab_summary(files, units):
    tabs = {t: {"files": 0, "pending": 0} for t in TAB_ORDER}
    for f in files:
        tabs[f["tab"]]["files"] += 1
    for u in units:
        if u["status"] == "pending":
            tabs[u["tab"]]["pending"] += 1
    return tabs


def default_tab(tabs):
    """F5: first tab (in tab order) with something pending, else the first non-empty one."""
    for t in TAB_ORDER:
        if tabs.get(t, {}).get("pending", 0) > 0:
            return t
    for t in TAB_ORDER:
        if tabs.get(t, {}).get("files", 0) > 0:
            return t
    return TAB_ORDER[0]


def job_state(jd):
    files = scan_files(jd)
    groups = build_groups(files)
    attach_docs(jd, files)
    review, _ = read_review(jd)
    units = build_units(files, review)
    summ = {
        "files": len(files),
        "pending": sum(1 for u in units if u["status"] == "pending"),
        "approved": sum(1 for u in units if u["status"] == "approved"),
        "rejected": sum(1 for u in units if u["status"] == "rejected"),
        "newest": max([f["mtime"] for f in files] or [0]),
    }
    return summ, files, groups, review, units


def job_summary(jd):
    summ, files, groups, review, _ = job_state(jd)
    return summ, files, groups, review


def pretty_slug(slug):
    return re.sub(r"[-_]+", " ", slug.split("/")[-1]).strip().title() or slug


def job_title(jd, slug):
    """F2: DELIVERY.json ar.title, else title, else first # heading of brief.md, else a prettified slug."""
    try:
        data = read_manifest(jd)[0]
    except BadRequest:
        data = {}
    ar = data.get("ar")
    if isinstance(ar, dict) and isinstance(ar.get("title"), str) and ar["title"].strip():
        return ar["title"].strip()
    if isinstance(data.get("title"), str) and data["title"].strip():
        return data["title"].strip()
    try:
        with open(os.path.join(jd, "brief.md"), "rb") as fh:
            head = fh.read(4000).decode("utf-8-sig", errors="replace")
        m = re.search(r"^#[ \t]+(.+?)\s*$", head, re.M)
        if m and clean_inline(m.group(1)):
            return clean_inline(m.group(1))
    except OSError:
        pass
    return pretty_slug(slug)


_PORTFOLIO_CACHE = {}


def brand_name(brand):
    """name: of brands.<brand> in TSST/core/portfolio.yaml (tiny line parser, no YAML library); else the slug."""
    try:
        mt = os.stat(PORTFOLIO).st_mtime_ns
        if _PORTFOLIO_CACHE.get("mt") != (PORTFOLIO, mt):
            with open(PORTFOLIO, encoding="utf-8") as fh:
                _PORTFOLIO_CACHE.update(mt=(PORTFOLIO, mt), lines=fh.read().splitlines())
        lines = _PORTFOLIO_CACHE["lines"]
    except OSError:
        return brand
    inside_brand = False
    for ln in lines:
        if re.match(r"^  " + re.escape(brand) + r":\s*(#.*)?$", ln):
            inside_brand = True
        elif inside_brand and re.match(r"^  \S", ln):
            break
        elif inside_brand:
            mm = re.match(r"^    name:\s*(.*?)\s*$", ln)
            if mm:
                return re.sub(r"\s+#.*$", "", mm.group(1)).strip("\"'") or brand
    return brand


def api_tree(root, refresh=False):
    if refresh:
        with COUNT_LOCK:
            COUNT_CACHE.clear()
    brands = []
    for b in list_brands(root):
        jobs = []
        for j in discover_jobs(root, b):
            jd = os.path.join(root, b, "projects", *j.split("/"))
            summ = job_summary(jd)[0]
            jobs.append(dict(summ, job=j, title=job_title(jd, j),
                             has_manifest=os.path.isfile(os.path.join(jd, "DELIVERY.json"))))
        sections = []
        for sid, label in SECTIONS:
            entries = discover_entries(root, b, sid)
            with COUNT_LOCK:
                for e in entries:
                    e["count"] = COUNT_CACHE.get((root, b, e["key"]))   # None until counted lazily
            sections.append({"id": sid, "label": label, "entries": entries})
        brands.append({"brand": b, "name": brand_name(b), "pending": sum(j["pending"] for j in jobs), "jobs": jobs,
                       "sections": sections})
    return {"app": APP_ID, "brands": brands}


def api_job(root, brand, job):
    jd = job_dir(root, brand, job)
    summ, files, groups, review, units = job_state(jd)
    for f in files:
        d = review.get(f["path"])
        f["decision"] = d if isinstance(d, dict) else None
    tabs = tab_summary(files, units)
    return {"brand": brand, "job": job, "title": job_title(jd, job), "summary": summ,
            "files": files, "groups": groups, "big_group": BIG_GROUP, "units": units, "review": review,
            "tabs": tabs, "default_tab": default_tab(tabs)}


def api_text(root, brand, job, rel, entry=None, limit=None):
    """Text of a .md/.txt file. `limit` (characters, 1..MAX_TEXT) serves the small card previews."""
    path = entry_file(root, brand, entry, rel) if entry else content_file(root, brand, job, rel)
    if classify(path) != "text":
        raise BadRequest("not a text file")
    cap = MAX_TEXT
    if limit not in (None, ""):
        try:
            cap = max(1, min(MAX_TEXT, int(limit)))
        except (TypeError, ValueError):
            raise BadRequest("bad limit")
    with open(path, "rb") as fh:
        raw = fh.read(cap * 4 + 1)
    text = raw.decode("utf-8", errors="replace")
    return {"text": text[:cap], "truncated": len(text) > cap or os.path.getsize(path) > len(raw)}


# ---------------------------------------------------------------- brand-level entries (view-only)

def is_shallow(segs):
    """Section roots and split containers list only their own loose files; other entries are recursive."""
    return len(segs) == 1 or (len(segs) == 2 and segs[1] in SPLIT_DIRS.get(segs[0], ()))


def entry_dir(root, brand, key):
    """Absolute dir of a brand-level entry (approved/photos/archive...). Raises BadRequest otherwise."""
    if not isinstance(brand, str) or not BRAND_RE.match(brand):
        raise BadRequest("bad brand")
    segs = check_segments(key)
    if segs[0] not in SECTION_IDS or len(segs) > 3:
        raise BadRequest("unknown entry", 404)
    section = os.path.join(root, brand, segs[0])
    path = os.path.join(root, brand, *segs)
    if len(segs) > 1 and not inside(section, path):
        raise BadRequest("unknown entry", 404)
    if not os.path.isdir(path):
        raise BadRequest("unknown entry", 404)
    return path, segs


def entry_file(root, brand, key, rel):
    """Absolute path of a file inside a view-only entry (never a job, never writable)."""
    ed, segs = entry_dir(root, brand, key)
    rsegs = check_segments(rel)
    if is_shallow(segs) and len(rsegs) != 1:
        raise BadRequest("path outside entry")
    path = os.path.join(ed, *rsegs)
    if not inside(ed, path) or not os.path.isfile(path):
        raise BadRequest("unknown file", 404)
    if not inside(os.path.realpath(ed), os.path.realpath(path)):
        raise BadRequest("path escapes entry")
    return path


def _listdir(path):
    try:
        return sorted(os.scandir(path), key=lambda e: e.name)
    except OSError:
        return []


def _loose_files(path):
    n = 0
    for e in _listdir(path):
        if skip_file(e.name):
            continue
        try:
            if e.is_file():
                n += 1
        except OSError:
            pass
    return n


def _subdirs(path):
    out = []
    for e in _listdir(path):
        if e.name.startswith("."):
            continue
        try:
            if e.is_dir():
                out.append(e.name)
        except OSError:
            pass
    return out


def discover_entries(root, brand, section):
    """Entries of one section: [{key, name, shallow}]. Listing only - no file is counted or stat-ed."""
    base = os.path.join(root, brand, section)
    if not os.path.isdir(base):
        return []
    out = []
    if _loose_files(base):
        out.append({"key": section, "name": section, "shallow": True})
    for d in _subdirs(base):
        if d in SPLIT_DIRS.get(section, ()):
            sub = os.path.join(base, d)
            if _loose_files(sub):
                out.append({"key": f"{section}/{d}", "name": d, "shallow": True})
            for c in _subdirs(sub):
                out.append({"key": f"{section}/{d}/{c}", "name": f"{d}/{c}", "shallow": False})
        else:
            out.append({"key": f"{section}/{d}", "name": d, "shallow": False})
    return out


def count_files(path, shallow=False):
    """One scandir walk, no stat. Hidden names and Thumbs.db skipped, directory links not followed."""
    n = 0
    stack = [path]
    while stack:
        cur = stack.pop()
        for e in _listdir(cur):
            try:
                if e.is_dir(follow_symlinks=False):
                    if not shallow and not skip_dir(e.name):
                        stack.append(e.path)
                elif e.is_file() and not skip_file(e.name):
                    n += 1
            except OSError:
                pass
    return n


def entry_count(root, brand, key):
    ck = (root, brand, key)
    with COUNT_LOCK:
        if ck in COUNT_CACHE:
            return COUNT_CACHE[ck]
    ed, segs = entry_dir(root, brand, key)
    n = count_files(ed, is_shallow(segs))
    with COUNT_LOCK:
        COUNT_CACHE[ck] = n
    return n


def scan_entry(ed, shallow):
    """Files of a view-only entry (recursive unless shallow), newest first. Paths relative to the entry."""
    files = []
    stack = [(ed, "")]
    while stack and len(files) < MAX_ENTRY_FILES:
        path, rel = stack.pop()
        for e in _listdir(path):
            try:
                if e.is_dir(follow_symlinks=False):
                    if not shallow and not skip_dir(e.name):
                        stack.append((e.path, rel + "/" + e.name if rel else e.name))
                    continue
                if not e.is_file() or skip_file(e.name):
                    continue
                st = e.stat()
            except OSError:
                continue
            files.append(_file_row(rel + "/" + e.name if rel else e.name, e.name, rel, st, False, 2))
    files.sort(key=lambda f: (-f["mtime"], f["path"]))
    return files


def api_entry(root, brand, key):
    ed, segs = entry_dir(root, brand, key)
    files = scan_entry(ed, is_shallow(segs))
    groups = build_groups(files)
    for f in files:
        f["reviewable"] = False      # view-only: nothing here waits for a decision
        f["decision"] = None
    if len(files) < MAX_ENTRY_FILES:
        with COUNT_LOCK:
            COUNT_CACHE[(root, brand, key)] = len(files)
    tabs = tab_summary(files, [])
    return {"brand": brand, "entry": key, "view_only": True, "title": "/".join(segs[1:]) or segs[0],
            "summary": {"files": len(files), "newest": max([f["mtime"] for f in files] or [0])},
            "files": files, "groups": groups, "big_group": BIG_GROUP, "truncated": len(files) >= MAX_ENTRY_FILES,
            "tabs": tabs, "default_tab": default_tab(tabs)}


def api_counts(root, brand, section):
    if section not in SECTION_IDS:
        raise BadRequest("unknown section", 404)
    if not isinstance(brand, str) or not BRAND_RE.match(brand):
        raise BadRequest("bad brand")
    return {"brand": brand, "section": section,
            "counts": {e["key"]: entry_count(root, brand, e["key"]) for e in discover_entries(root, brand, section)}}


# ---------------------------------------------------------------- decisions

def write_json_atomic(path, data, indent, crlf, trailing):
    text = json.dumps(data, ensure_ascii=False, indent=indent)
    if trailing:
        text += "\n"
    if crlf:
        text = text.replace("\n", "\r\n")
    fd, tmp = tempfile.mkstemp(prefix=".DELIVERY.json.", suffix=".tmp", dir=os.path.dirname(path))
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(text.encode("utf-8"))
            fh.flush()
            os.fsync(fh.fileno())
        for attempt in range(6):
            try:
                os.replace(tmp, path)
                break
            except PermissionError:
                if attempt == 5:
                    raise
                time.sleep(0.25)
    except BaseException:
        if os.path.exists(tmp):
            try:
                os.remove(tmp)
            except OSError:
                pass
        raise


def resolve_key(root, brand, job, key):
    """Validate a decision key: an existing work/final file, or `<text file>#<anchor>` of a card in it.
    Returns the key (unchanged). Raises BadRequest otherwise."""
    try:
        content_file(root, brand, job, key)
        return key
    except BadRequest as exc:
        if exc.code != 404 or not isinstance(key, str) or "#" not in key:
            raise
    base, anchor = key.rsplit("#", 1)
    path = content_file(root, brand, job, base)
    if classify(path) != "text":
        raise BadRequest("unknown file", 404)
    doc = load_doc(path, base)
    if anchor not in {c["anchor"] for c in doc["cards"] if c["anchor"]}:
        raise BadRequest("unknown card", 404)
    return key


def save_decision(root, payload, sync=None, today=None):
    """Validate, merge into <job>/DELIVERY.json "review", write atomically, then run sync (if given).
    `path` = one key, `paths` = a batch (bulk approve/reject: one write). A key is a file path or `<file>#<anchor>`."""
    if not isinstance(payload, dict):
        raise BadRequest("bad body")
    if payload.get("entry") is not None or payload.get("section") is not None:
        raise BadRequest("view-only: approved/photos/archive entries take no decisions", 403)
    brand, job = payload.get("brand"), payload.get("job")
    status, note = payload.get("status"), payload.get("note")
    if status is not None and status not in STATUSES:
        raise BadRequest("bad status")
    if note is not None and (not isinstance(note, str) or len(note) > 2000):
        raise BadRequest("bad note")
    if status is None and note is None:
        raise BadRequest("nothing to save")
    paths = payload.get("paths")
    if paths is None:
        paths = [payload.get("path")]
    elif not isinstance(paths, list) or not paths or len(paths) > MAX_BATCH or not all(isinstance(x, str) for x in paths):
        raise BadRequest("bad paths")
    paths = list(dict.fromkeys(paths))
    for rel in paths:
        resolve_key(root, brand, job, rel)                # validates job, path, existence, card anchor
    jd = job_dir(root, brand, job)
    with WRITE_LOCK:
        data, indent, crlf, trailing, exists = read_manifest(jd)
        if not exists:
            data = {"title": os.path.basename(jd), "status": "progress"}
        review = data.get("review")
        if review is None:
            review = {}
        elif not isinstance(review, dict):
            raise BadRequest("DELIVERY.json review is not an object", 409)
        entries = {}
        for rel in paths:
            old = review.get(rel) if isinstance(review.get(rel), dict) else {}
            entry = dict(old)
            entry["status"] = status or old.get("status") or "pending"
            entry["note"] = note.strip() if note is not None else old.get("note", "")
            entry["date"] = today or datetime.date.today().isoformat()
            entry["by"] = "Ahmed"
            review[rel] = entry
            entries[rel] = entry
        data["review"] = review
        write_json_atomic(os.path.join(jd, "DELIVERY.json"), data, indent, crlf, trailing)
    result = {"ok": True, "entry": entries[paths[0]], "entries": entries, "created_manifest": not exists, "sync": None}
    if sync is not None:
        result["sync"] = sync(brand)
    return result


def run_sync(brand):
    """Run sync_jobs.py for one brand; return {ok, line}."""
    try:
        p = subprocess.run([sys.executable, SYNC_SCRIPT, brand], capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=300, cwd=REPO)
    except (OSError, subprocess.SubprocessError) as exc:
        return {"ok": False, "line": f"sync failed to start: {exc}"}
    lines = [ln for ln in (p.stdout + "\n" + p.stderr).splitlines() if ln.strip()]
    return {"ok": p.returncode == 0, "line": lines[-1] if lines else f"sync exit {p.returncode}"}


def run_build(root, brand, job, runner=subprocess.run):
    """F7: a decision rewrites DELIVERY.json, so a job that already has a delivery page needs its pages rebuilt
    (both audiences) before the brand sync, or job_check fails 'page older than manifest'. Jobs without a page:
    nothing to do (sync only)."""
    jd = job_dir(root, brand, job)
    if not os.path.isfile(os.path.join(jd, "DELIVERY.html")):
        return {"ok": True, "line": f"{job}: no page", "skipped": True}
    try:
        p = runner([sys.executable, BUILD_SCRIPT, jd], capture_output=True, text=True, encoding="utf-8",
                   errors="replace", timeout=300, cwd=REPO)
    except (OSError, subprocess.SubprocessError) as exc:
        return {"ok": False, "line": f"{job}: build failed to start: {exc}"}
    lines = [ln.strip() for ln in (p.stdout + "\n" + p.stderr).splitlines() if ln.strip()]
    bad = [ln for ln in lines if "LEAK" in ln or "FAIL" in ln or "PROBLEMS" in ln]
    tail = (bad or lines or [f"exit {p.returncode}"])[-1]
    return {"ok": p.returncode == 0, "line": f"{job}: {tail}"}


class SyncWorker:
    """ONE background thread runs the brand sync, debounced per brand (Round 4).

    schedule(brand) returns at once. The sync starts SYNC_DELAY after the last schedule for that brand
    (never later than SYNC_MAX_WAIT after the first unsynced one), so a burst of clicks is one sync. A decision
    that lands while a sync runs queues exactly one more run, so the final state is always synced. A failed or
    crashed sync is kept in status() (last[brand]) until the next run - it is never silently dropped."""

    def __init__(self, sync, delay=SYNC_DELAY, max_wait=SYNC_MAX_WAIT, build=None):
        self.sync, self.delay, self.max_wait, self.build = sync, delay, max_wait, build
        self.jobs = {}      # brand -> jobs touched since the last run (their pages are rebuilt before the sync)
        self.cv = threading.Condition()
        self.due = {}       # brand -> monotonic time the sync may start
        self.first = {}     # brand -> monotonic time of the first unsynced decision
        self.running = None
        self.last = {}      # brand -> {ok, line, at}
        self.runs = 0
        self.closed = False
        self.thread = None

    def schedule(self, brand, job=None):
        now = time.monotonic()
        with self.cv:
            if job:
                self.jobs.setdefault(brand, set()).add(job)
            first = self.first.setdefault(brand, now)
            self.due[brand] = min(now + self.delay, first + self.max_wait)
            if self.thread is None or not self.thread.is_alive():
                self.thread = threading.Thread(target=self._loop, name="review-sync", daemon=True)
                self.thread.start()
            self.cv.notify_all()

    def _loop(self):
        while True:
            with self.cv:
                brand = None
                while not self.closed:
                    if self.due:
                        brand = min(self.due, key=self.due.get)
                        wait = self.due[brand] - time.monotonic()
                        if wait <= 0:
                            break
                        self.cv.wait(wait)
                    else:
                        self.cv.wait(60)
                if self.closed:
                    return
                del self.due[brand]
                self.first.pop(brand, None)
                jobs = sorted(self.jobs.pop(brand, ()))
                self.running = brand
            try:
                bad = []
                for job in jobs if self.build else ():          # pages first, so the sync's job_check sees them fresh
                    try:
                        r = self.build(brand, job)
                        if not r.get("ok"):
                            bad.append(str(r.get("line", job)))
                    except Exception as exc:
                        bad.append(f"{job}: build failed: {type(exc).__name__}: {exc}")
                res = self.sync(brand)
                res = {"ok": bool(res.get("ok")) and not bad, "line": "; ".join(bad + [str(res.get("line", ""))]) if bad else str(res.get("line", ""))}
            except Exception as exc:  # the worker must outlive any sync failure
                res = {"ok": False, "line": f"sync failed: {type(exc).__name__}: {exc}"}
            with self.cv:
                self.running = None
                self.runs += 1
                self.last[brand] = dict(res, at=time.time())
                self.cv.notify_all()

    def status(self):
        with self.cv:
            return {"busy": bool(self.due) or self.running is not None, "running": self.running,
                    "waiting": sorted(self.due), "last": {b: dict(v) for b, v in self.last.items()}}

    def wait_idle(self, timeout=10.0):
        end = time.monotonic() + timeout
        with self.cv:
            while self.due or self.running is not None:
                left = end - time.monotonic()
                if left <= 0:
                    return False
                self.cv.wait(min(left, 0.2))
        return True

    def close(self):
        with self.cv:
            self.closed = True
            self.cv.notify_all()


# ---------------------------------------------------------------- thumbnails (F14)

THUMB_EXT = (".png", ".jpg", ".jpeg", ".webp")      # gif stays original (animation)
THUMB_MIN, THUMB_MAX, THUMB_DEFAULT = 64, 1600, 480


def thumb_cache_dir():
    """Outside every client folder: %LOCALAPPDATA%\\tsst-review\\thumbs (TSST_REVIEW_CACHE overrides, for tests)."""
    d = os.environ.get("TSST_REVIEW_CACHE")
    if not d:
        base = os.environ.get("LOCALAPPDATA") or os.path.join(os.path.expanduser("~"), ".cache")
        d = os.path.join(base, "tsst-review", "thumbs")
    return os.path.abspath(d)


def thumb_for(root, path, w):
    """Cached JPEG for an image, keyed sha1(abs path + mtime + size + w). None -> serve the original file
    (no Pillow, unsupported type, already small, cache dir inside the client folders, any read error)."""
    if Image is None or os.path.splitext(path)[1].lower() not in THUMB_EXT or not (THUMB_MIN <= w <= THUMB_MAX):
        return None
    cache = thumb_cache_dir()
    for r in (root, os.path.realpath(root)):
        if os.path.normcase(os.path.abspath(cache)) == os.path.normcase(os.path.abspath(r)) or inside(r, cache):
            return None                                   # never write inside client folders
    try:
        st = os.stat(path)
        key = hashlib.sha1(f"{os.path.abspath(path)}|{st.st_mtime_ns}|{st.st_size}|{w}".encode("utf-8")).hexdigest()
        out = os.path.join(cache, key + ".jpg")
        if os.path.isfile(out):
            return out
        os.makedirs(cache, exist_ok=True)
        with Image.open(path) as im:
            if max(im.size) <= w:
                return None                               # already small: the original is as light as a thumbnail
            try:
                im.draft("RGB", (w * 2, w * 2))
            except Exception:
                pass
            try:
                from PIL import ImageOps
                im = ImageOps.exif_transpose(im)
            except Exception:
                pass
            if im.mode in ("RGBA", "LA", "P"):
                im = im.convert("RGBA")
                bg = Image.new("RGB", im.size, (255, 255, 255))
                bg.paste(im, mask=im.getchannel("A"))
                im = bg
            else:
                im = im.convert("RGB")
            im.thumbnail((w, w))
            fd, tmp = tempfile.mkstemp(prefix=".t", suffix=".tmp", dir=cache)
            os.close(fd)
            try:
                im.save(tmp, "JPEG", quality=82)
                os.replace(tmp, out)
            finally:
                if os.path.exists(tmp):
                    os.remove(tmp)
        return out
    except Exception:
        return None


def static_path(base, allowed, name):
    """Whitelist lookup: the requested name must equal an existing allowed file name exactly (no traversal)."""
    if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9_.-]+", name) or name.startswith("."):
        raise BadRequest("not found", 404)
    try:
        listing = os.listdir(base)
    except OSError:
        raise BadRequest("not found", 404)
    if name not in listing or not allowed(name) or not os.path.isfile(os.path.join(base, name)):
        raise BadRequest("not found", 404)
    return os.path.join(base, name)


def font_path(name):
    return static_path(FONTS_DIR, lambda n: n.lower().endswith(".ttf"), name)


def asset_path(name):
    return static_path(ASSETS_DIR, lambda n: n in ASSET_FILES, name)


# ---------------------------------------------------------------- http

class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "TSSTReview/1"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    # -- helpers
    def host_ok(self):
        host = (self.headers.get("Host") or "").lower()
        return host in (f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}")

    def send_bytes(self, code, body, ctype, extra=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def send_json(self, code, obj):
        self.send_bytes(code, json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def fail(self, exc):
        self.send_json(exc.code, {"ok": False, "error": str(exc)})

    # -- GET
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        if not self.host_ok():
            return self.send_json(403, {"ok": False, "error": "bad host"})
        url = urllib.parse.urlsplit(self.path)
        q = {k: v[0] for k, v in urllib.parse.parse_qs(url.query, keep_blank_values=True).items()}
        root = self.server.root
        try:
            if url.path in ("/", "/index.html"):
                with open(os.path.join(HERE, "board.html"), "rb") as fh:
                    return self.send_bytes(200, fh.read(), "text/html; charset=utf-8",
                                           {"Content-Security-Policy": "default-src 'self'; img-src 'self' data:; media-src 'self'; "
                                            "style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'unsafe-inline'"})
            if url.path == "/api/ping":
                return self.send_json(200, {"app": APP_ID, "read_only": self.server.read_only})
            if url.path == "/api/tree":
                return self.send_json(200, dict(api_tree(root, refresh=q.get("refresh") == "1"), read_only=self.server.read_only))
            if url.path == "/api/entry":
                return self.send_json(200, api_entry(root, q.get("brand"), q.get("entry")))
            if url.path == "/api/counts":
                return self.send_json(200, api_counts(root, q.get("brand"), q.get("section")))
            if url.path == "/api/sync":
                return self.send_json(200, self.server.syncer.status())
            if url.path == "/api/job":
                return self.send_json(200, api_job(root, q.get("brand"), q.get("job")))
            if url.path == "/api/text":
                return self.send_json(200, api_text(root, q.get("brand"), q.get("job"), q.get("path"), q.get("entry"), q.get("limit")))
            if url.path == "/file" or url.path == "/thumb":
                if q.get("entry"):
                    path = entry_file(root, q.get("brand"), q.get("entry"), q.get("path"))
                else:
                    path = content_file(root, q.get("brand"), q.get("job"), q.get("path"))
                if url.path == "/file":
                    return self.serve_file(path)
                if classify(path) != "image":
                    raise BadRequest("not an image")
                try:
                    w = int(q.get("w") or THUMB_DEFAULT)
                except ValueError:
                    raise BadRequest("bad width")
                return self.serve_file(thumb_for(root, path, w) or path, cache="private, max-age=600")
            if url.path.startswith("/fonts/"):
                return self.serve_file(font_path(urllib.parse.unquote(url.path[7:])), cache="public, max-age=86400")
            if url.path.startswith("/assets/"):
                return self.serve_file(asset_path(urllib.parse.unquote(url.path[8:])), cache="public, max-age=86400")
            return self.send_json(404, {"ok": False, "error": "not found"})
        except BadRequest as exc:
            return self.fail(exc)
        except (BrokenPipeError, ConnectionError):
            return None
        except Exception as exc:  # keep the board alive
            return self.send_json(500, {"ok": False, "error": f"{type(exc).__name__}: {exc}"})

    def serve_file(self, path, cache="no-cache"):
        st = os.stat(path)
        size = st.st_size
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        extra = {"Accept-Ranges": "bytes", "Last-Modified": self.date_time_string(st.st_mtime)}
        if ctype in ("text/html", "image/svg+xml", "application/xhtml+xml", "text/xml", "application/xml"):
            extra["Content-Security-Policy"] = "sandbox allow-scripts"
        if ctype.startswith("text/") or ctype.endswith("json"):
            ctype += "; charset=utf-8"
        start, end, code = 0, size - 1, 200
        rng = self.headers.get("Range")
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
            if m and (m.group(1) or m.group(2)):
                if m.group(1):
                    start = int(m.group(1))
                    end = int(m.group(2)) if m.group(2) else size - 1
                else:
                    start = max(0, size - int(m.group(2)))
                end = min(end, size - 1)
                if start > end or start >= size:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{size}")
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                code = 206
                extra["Content-Range"] = f"bytes {start}-{end}/{size}"
        length = end - start + 1 if size else 0
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(length))
        self.send_header("Cache-Control", cache)
        self.send_header("X-Content-Type-Options", "nosniff")
        for k, v in extra.items():
            self.send_header(k, v)
        self.end_headers()
        if self.command == "HEAD" or not length:
            return
        try:
            with open(path, "rb") as fh:
                fh.seek(start)
                left = length
                while left > 0:
                    chunk = fh.read(min(262144, left))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)
        except (BrokenPipeError, ConnectionError):
            pass

    # -- POST
    def do_POST(self):
        if not self.host_ok():
            return self.send_json(403, {"ok": False, "error": "bad host"})
        url = urllib.parse.urlsplit(self.path)
        try:
            if url.path != "/api/decision":
                raise BadRequest("not found", 404)
            if self.server.read_only:
                raise BadRequest(READ_ONLY_MSG, 403)
            if not (self.headers.get("Content-Type") or "").lower().startswith("application/json"):
                raise BadRequest("json only", 415)
            origin = self.headers.get("Origin")
            if origin and origin not in (f"http://127.0.0.1:{self.server.server_port}", f"http://localhost:{self.server.server_port}"):
                raise BadRequest("bad origin", 403)
            n = int(self.headers.get("Content-Length") or 0)
            if n <= 0 or n > 150000:
                raise BadRequest("bad size")
            try:
                payload = json.loads(self.rfile.read(n).decode("utf-8"))
            except (UnicodeError, ValueError):
                raise BadRequest("bad json")
            result = save_decision(self.server.root, payload)          # write only; the sync runs in the background
            self.server.syncer.schedule(payload["brand"], payload["job"])
            result["sync"] = {"queued": True, "delay": self.server.syncer.delay}
            return self.send_json(200, result)
        except BadRequest as exc:
            return self.fail(exc)
        except Exception as exc:
            return self.send_json(500, {"ok": False, "error": f"{type(exc).__name__}: {exc}"})


class Board(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = False

    def __init__(self, addr, root, sync, delay=SYNC_DELAY, build=None, read_only=False):
        super().__init__(addr, Handler)
        self.root = root
        self.read_only = bool(read_only)
        self.sync = sync
        self.syncer = SyncWorker(sync, delay, build=build)

    def server_close(self):
        self.syncer.close()
        super().server_close()


def make_server(root, port, sync, tries=20, delay=SYNC_DELAY, build=None, read_only=False):
    last = None
    for p in range(port, port + tries):
        try:
            return Board(("127.0.0.1", p), root, sync, delay, build, read_only)
        except OSError as exc:
            last = exc
    raise last


def board_running(port):
    """None when no board answers, else {"read_only": bool}."""
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/ping", timeout=1.5) as r:
            info = json.loads(r.read().decode("utf-8"))
    except (OSError, ValueError, urllib.error.URLError):
        return None
    return {"read_only": bool(info.get("read_only"))} if info.get("app") == APP_ID else None


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    ap.add_argument("--open", action="store_true", help="open the browser")
    ap.add_argument("--sync-delay", type=float, default=SYNC_DELAY, help="seconds after the last decision before the background sync")
    ap.add_argument("--root", default=DEFAULT_ROOT, help="brands folder (tests / scratch copies only)")
    ap.add_argument("--read-only", action="store_true", help="view only: decisions are made in the portal (REVIEW.bat)")
    args = ap.parse_args(argv)
    for stream in (sys.stdout, sys.stderr):                 # Arabic folder names must not crash the console
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print(f"brands folder not found: {root}")
        return 1
    running = board_running(args.port)
    if running:
        url = f"http://127.0.0.1:{args.port}/"
        print(f"REVIEW_URL {url} (already running)")
        if args.read_only and not running["read_only"]:
            print("WARNING: the board already open is the old writable one - close its window and start REVIEW.bat again")
        if args.open:
            webbrowser.open(url)
        return 0
    # sync_jobs.py works on the real TSST/brands only; a scratch --root never triggers it.
    real = os.path.normcase(root) == os.path.normcase(DEFAULT_ROOT)
    sync = run_sync if real else (lambda b: {"ok": True, "line": "sync skipped (custom --root)"})
    build = (lambda b, j: run_build(root, b, j)) if real else None
    srv = make_server(root, args.port, sync, delay=max(0.0, args.sync_delay), build=build, read_only=args.read_only)
    url = f"http://127.0.0.1:{srv.server_port}/"
    note = "view only - decisions are made in the portal\n" if args.read_only else ""
    print(f"REVIEW_URL {url}\nroot {root}\n{note}Ctrl+C to stop", flush=True)
    if args.open:
        threading.Timer(0.4, webbrowser.open, args=(url,)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
