#!/usr/bin/env python3
"""The Systronic Delivery System v1.1 - delivery-page generator (stdlib only).

Usage:  python build_delivery.py <job_folder> [--audience client|internal|both] [--link-logo]
        reads  <job>/DELIVERY.json, i18n/{en,ar}.json, systronic.json
        writes <job>/DELIVERY.html           (audience client:   formal, safe to send)
               <job>/DELIVERY_INTERNAL.html  (audience internal: everything, for the team)
               <job>/files/                  (client media under neutral names; the client page links here)
        default audience = both. Prints missing files, missing Arabic fields, an HTML structure check and,
        for the client page, a leak scan of internal terms (exit code 1 on a leak).
        v1.1: brand sync (client name from core/portfolio.yaml when the manifest omits "client"), optional plan
        sections (marketing_plan, roadmap, milestones, tasks), and an internal-only "Job files" section.

ONE file, TWO languages (English / Arabic). Every translatable string is rendered twice
(<span class="l-en"> / <span class="l-ar">) and CSS shows the active one, so the header switch (EN | ع)
flips lang/dir on <html> with no reload. The language opens as: ?lang= override > localStorage > manifest
"default_lang". Chrome strings live in i18n/{en,ar}.json (never concatenate English into Arabic sentences).
Arabic mode is a full RTL mirror (logical CSS properties). Latin runs inside Arabic are isolated with
<bdi dir="ltr">. Verbatim copy blocks (bios, captions, hashtags) are never translated or reformatted.

DELIVERY.json schema (paths relative to the job folder; "../" works)
{
  "client": "VILL Studio", "service": "SV-01 ...", "job": "social-setup-01", "date": "2026-10-09",
                                 # "client" may be omitted inside TSST/brands/<id>/: then name: from core/portfolio.yaml; "job" -> folder name
  "default_lang": "en" | "ar",                                   # the client's language
  "title": "..", "subtitle": "..", "status": "approved|review|progress|production|published",
  "status_label": "Approved", "status_detail": "optional line",
  "logo": "auto" | "<path>",
  "arabic_font": {"family": "...", "files": {"400": "path.ttf"}},   # optional override; default = IBM Plex Sans Arabic
  "about": {"paragraphs": [..], "voice": "..", "facts": [["label","value"]],
            "internal_paragraphs": [..], "internal_facts": [..]},
  "items": [{"id": "stable_slug", "title", "desc", "group", "file"|"href", "type", "status", "internal": true,
             "int_note", "who", "date"}],
  "texts_intro": "..", "texts": [{"id","title","platform","status","dir":"ltr|rtl","lang","body":"verbatim",
                                  "note","int_note","internal"}],
  "options": {"title","label","items":[{"ar","tag"}],"int_note"},
  "next": [..], "internal_next": [..],
  "decisions": [{"date","item","status":"Approved|Rejected|Noted","who","int_note","internal"}],
  "checks": [{"title","state":"pass|open|fail|na","note"}],      # internal page only
  "sources": [{"label","path"|"url"}],                           # internal page only
  # plan sections (all optional; absent = hidden). Spec: specs/PLAN_SECTIONS_SPEC_v0.1.md. Every entry has a stable "id".
  "marketing_plan": {"objective","audience","channels":[{"id","name","role"}],"messages":[{"id","text"}],
                     "kpis":[{"id","name","target","source","status","int_note"}],"int_note","internal_paragraphs":[..]},
  "roadmap": [{"id","title","desc","status":"approved|review|progress|production|published|planned","owner":"client|team",
               "depends_on":[ids],"window","internal","int_note"}],
  "milestones": [{"id","title","date","date_basis":"confirmed|planned","status","stage":"<roadmap id>","gate","internal","int_note"}],
  "tasks": [{"id","title","owner":"client|team","due","status":"open|done|blocked","ref":"item:<id>|text:<id>","internal","int_note"}],
  # items without "file"/"href": a text card (no media box); only status "production" keeps the "In production" placeholder
  # client page drops internal:true entries, every task not owned by the client, all int_note / internal_paragraphs
  "ar": {                                                       # Arabic block (from CLIENT_COPY_AR.md)
    "marketing_plan": {"objective","audience","channels":{"<id>":{"name","role"}},"messages":{"<id>":".."},
                       "kpis":{"<id>":{"name","target","source"}}},
    "roadmap": {"<id>":{"title","desc","window"}}, "milestones": {"<id>":{"title","gate"}}, "tasks": {"<id>":{"title"}},
    "title","subtitle","status_label","status_detail","texts_intro","next":[..],"internal_next":[..],
    "about": {"paragraphs","voice","facts":{"<en label>":[label,value]},"internal_paragraphs","internal_facts":[[l,v]]},
    "items": {"<id>": {"group","title","desc","int_note","who"}},
    "texts": {"<id>": {"title","platform","note","int_note"}},
    "decisions": [{"item","int_note","who"}], "checks": [{"title","note"}],
    "sources": {"<en label>": "<ar label>"}, "options": {"title","label","int_note","tag0"}}
}
"""
import base64, datetime, html, json, os, re, shutil, struct, sys
from html.parser import HTMLParser
from urllib.parse import quote

VERSION = "1.1"
HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = ("en", "ar")
I18N = {l: json.load(open(os.path.join(HERE, "i18n", l + ".json"), encoding="utf-8")) for l in LANGS}
ST_CLS = {"approved": "d-ok", "review": "d-rev", "production": "d-prod", "published": "d-pub",
          "rejected": "d-rej", "progress": "d-rev", "noted": "d-prod", "draft": "d-prod"}
CK_CLS = {"pass": ("c-pass", "✓"), "open": ("c-open", "○"), "fail": ("c-fail", "✕"), "na": ("c-na", "–")}
IMG = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
VID = {".mp4", ".mov", ".webm", ".m4v"}
LEAK = ["Ahmed", "Magnific", "SV-0", "LENS", "SPARK", "CREATIVE", "EDA", "v03", "Gemini", "ChatGPT",
        "ffmpeg", "Claude", "Opus", "TSST", "Bukra", "Myriad", "أحمد", "ماغنفيك"]
AR_RUN = re.compile(r"[֐-ࣿﭐ-﻿]+(?:[  ]+[֐-ࣿﭐ-﻿]+)*")
_L = r"[A-Za-z0-9@#][A-Za-z0-9@#_./:+&'\-]*"
LAT_RUN = re.compile(_L + r"(?:[  ·×]+" + _L + r")*")
CHAP_AR = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"]
e = html.escape
missing, missing_ar = [], []


# ---------------------------------------------------------------- text helpers
def rich(s):
    """English text: escape, isolate any Arabic run."""
    return AR_RUN.sub(lambda m: f'<bdi lang="ar" dir="rtl" class="ar">{m.group(0)}</bdi>', e(str(s)))


_MON = "|".join(I18N["ar"]["months"])
AR_DATE = re.compile(r"\d{1,2} (?:" + _MON + r") \d{4}")


TRAIL = ".:,;!?/'’-_&+"


def ltr(s, nw=True):
    """one LTR isolate; trailing punctuation stays OUTSIDE it (in RTL a period or colon inside would land on the wrong side).
    Short multi-word runs (brand names) get class nw so chrome/plan text cannot break them across lines."""
    core = s.rstrip(TRAIL)
    if not core:
        return e(s)
    cls = ' class="nw"' if nw and len(core) <= 28 and re.search(r"\s", core) else ""
    return f'<bdi dir="ltr"{cls}>{e(core)}</bdi>{e(s[len(core):])}'


def _lat_plain(t):
    out, pos = [], 0
    for m in LAT_RUN.finditer(t):
        out.append(e(t[pos:m.start()]))
        out.append(ltr(m.group(0)))
        pos = m.end()
    out.append(e(t[pos:]))
    return "".join(out)


def _lat_dates(t):
    """Arabic dates ('9 أكتوبر 2026') become one RTL isolate so the day never detaches from its month"""
    out, pos = [], 0
    for m in AR_DATE.finditer(t):
        out.append(_lat_plain(t[pos:m.start()]))
        out.append(f'<bdi dir="rtl">{e(m.group(0))}</bdi>')
        pos = m.end()
    out.append(_lat_plain(t[pos:]))
    return "".join(out)


def lat(s):
    """Arabic text: isolate every Latin/number run, every Arabic date, and every mixed ' · ' segment."""
    s = str(s)
    if " · " in s and AR_RUN.search(s):
        segs = s.split(" · ")
        return " · ".join(f'<bdi dir="rtl">{_lat_dates(x.rstrip(TRAIL))}</bdi>{e(x[len(x.rstrip(TRAIL)):])}' if AR_RUN.search(x) else ltr(x) for x in segs)
    return _lat_dates(s)


def T(en, ar, auto=False):
    d = ' dir="auto"' if auto else ""
    return f'<span class="l-en"{d}>{en}</span><span class="l-ar" lang="ar"{d}>{ar}</span>'


INT_WHAT = re.compile(r"int_note|internal_|^ifact|^checks\[|\.who$")


def S(key, **kw):
    """chrome string from i18n (both languages)"""
    return T(*(fmt(l, key, **kw) for l in LANGS))


def fmt(lang, key, **kw):
    v = I18N[lang][key].format(**kw) if kw else I18N[lang][key]
    return e(v) if lang == "en" else lat(v)


def DL(key):
    return f'data-l-en="{e(I18N["en"][key])}" data-l-ar="{e(I18N["ar"][key])}"'


def rights(year):
    out = []
    for l in LANGS:
        t = I18N[l]["foot_rights"].format(year=year, name=I18N[l]["foot_name"])
        mm = re.match(r"^(© \d+ [A-Za-z ]+\.?)(.*)$", t)
        out.append(f'{ltr(mm.group(1), False)}{e(mm.group(2)) if l == "en" else lat(mm.group(2))}' if mm else (e(t) if l == "en" else lat(t)))
    return T(*out)


def fdate_l(d, lang):
    try:
        t = datetime.date.fromisoformat(d)
    except Exception:
        return d or ""
    return I18N[lang]["date_format"].format(d=t.day, m=I18N[lang]["months"][t.month - 1], y=t.year)


def D(d):
    return T(e(fdate_l(d, "en")), f'<bdi dir="rtl">{e(fdate_l(d, "ar"))}</bdi>' if AR_DATE.fullmatch(fdate_l(d, "ar")) else lat(fdate_l(d, "ar")))


def lookup(obj, *path):
    for p in path:
        try:
            obj = obj[p]
        except (KeyError, IndexError, TypeError):
            return None
    return obj


class Ctx:
    def __init__(self, m):
        self.m = m
        self.ar = m.get("ar", {})

    def bi(self, en, ar, what=""):
        if en is None or en == "":
            return ""
        if not ar:
            missing_ar.append(what or str(en)[:40])
            ar = en
        return T(rich(en), lat(ar), bool(INT_WHAT.search(what or "")))


def body_html(body, d):
    """verbatim text; in RTL blocks, lines with no Arabic (hashtags, brand lines) get a display-only LTR isolate
    (no characters are added, so the copied text stays identical)"""
    if d != "rtl":
        return e(body)
    return chr(10).join(ltr(l, False) if l.strip() and not AR_RUN.search(l) else e(l) for l in body.split(chr(10)))


def url(p):
    return quote(p.replace("\\", "/"), safe="/:#?=&")


def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()


def asset(name):
    return "data:image/png;base64," + b64(os.path.join(HERE, "assets", name))


def find_logo(job, spec):
    if spec and spec != "auto":
        return os.path.join(job, spec)
    d = os.path.abspath(job)
    for _ in range(8):
        c = os.path.join(d, "TSST", "brands", "t-sag", "assets", "final", "logo", "systronic_logo_white_transparent.png")
        if os.path.exists(c):
            return c
        d = os.path.dirname(d)
    return None


def font_css(job, m):
    out = []
    for fam, w, f in (("Poppins", 400, "Poppins-Regular.ttf"), ("Poppins", 600, "Poppins-SemiBold.ttf"), ("Poppins", 700, "Poppins-Bold.ttf"),
                      ("IBM Plex Sans Arabic", 400, "IBMPlexSansArabic-Regular.ttf"), ("IBM Plex Sans Arabic", 500, "IBMPlexSansArabic-Medium.ttf"),
                      ("IBM Plex Sans Arabic", 600, "IBMPlexSansArabic-SemiBold.ttf"), ("IBM Plex Sans Arabic", 700, "IBMPlexSansArabic-Bold.ttf")):
        p = os.path.join(HERE, "fonts", f)
        if os.path.exists(p):
            out.append(f'@font-face{{font-family:"{fam}";font-weight:{w};font-display:swap;src:url(data:font/ttf;base64,{b64(p)}) format("truetype")}}')
        else:
            missing.append("font " + f)
    return "".join(out)


CSS = """
:root{--navy:#181D36;--deep:#000627;--deep2:#000D3C;--red:#E7213A;--redtx:#B3122A;--cyan:#29BCEF;
--body:#33394F;--mut:#585F7A;--rule:#D5D9E4;--tint:#F3F5FA;--ok:#1F9D5B;--rev:#E8A917;--g:clamp(16px,4vw,40px);--sg:1}
html[dir=rtl]{--sg:-1}
*{box-sizing:border-box}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
html[lang=en] .l-ar,html[lang=ar] .l-en{display:none!important}
body{margin:0;background:#fff;color:var(--body);font:400 16px/1.8 "Poppins","Segoe UI",system-ui,sans-serif;overflow-x:hidden}
img,video{display:block}
.wrap{width:min(1200px,calc(100% - 2*var(--g)));margin-inline:auto}
:focus-visible{outline:3px solid var(--navy);outline-offset:3px}
.dark :focus-visible{outline-color:#fff}
bdi,.ar{unicode-bidi:isolate}
/* arabic mode: IBM Plex Sans Arabic, no tracking, no caps (measured: Plex x-height ~= Poppins, so 1.04 ratio) */
html[lang=ar] body{font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:16.6px;line-height:1.9}
html[lang=ar] *{letter-spacing:0!important;text-transform:none!important}
html[lang=ar] bdi[dir=ltr]{font-family:"Poppins","Segoe UI",sans-serif;font-size:.94em}
html[lang=ar] h1{line-height:1.3;font-weight:700}html[lang=ar] h2,html[lang=ar] h3{line-height:1.45}
html[lang=ar] .sub,html[lang=ar] .lead{line-height:1.9}
html[lang=ar] .card .ds,html[lang=ar] .tx .nt,html[lang=ar] .int,html[lang=ar] td{line-height:1.8}
html[lang=ar] .eyebrow,html[lang=ar] dl.f dt,html[lang=ar] .facts-row dt,html[lang=ar] th,html[lang=ar] .fc dt,html[lang=ar] .rail p,html[lang=ar] .cl .k,html[lang=ar] .int b,html[lang=ar] .top .dl{font-size:15px;font-weight:600}
html[lang=ar] .tx pre[dir=ltr]{font-family:"Poppins","Segoe UI",sans-serif}
.arr{display:inline-block}html[dir=rtl] .arr{transform:scaleX(-1)}
/* hero */
.band{background:#B3122A;color:#fff;font-weight:600;font-size:14px;letter-spacing:.1em;text-transform:uppercase;padding:9px 0;line-height:1.5}
.hero{background:linear-gradient(135deg,var(--deep),var(--deep2));color:#fff;padding:32px 0 0}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px}
.top img{height:232px;width:auto;margin-block:-16px -72px;margin-inline-start:-50px}
.tr{display:flex;align-items:center;gap:24px}
.top .dl{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#AEB6D6;font-weight:600}
.lsw{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.35);border-radius:2px}
.lsw button{font:inherit;font-size:14px;font-weight:600;color:#D6DBF0;background:none;border:0;min-height:40px;min-width:48px;padding:0 12px;cursor:pointer;letter-spacing:.06em}
.lsw button[aria-pressed=true]{background:#fff;color:var(--navy)}
.lsw button:not([aria-pressed=true]):hover{color:#fff;background:rgba(255,255,255,.12)}
.hero-body{padding:72px 0 56px;display:grid;grid-template-columns:1fr 280px;gap:48px;align-items:end}.hero-body>div:first-child{min-width:0}
.idx{border-top:1px solid rgba(255,255,255,.22);padding-top:16px;margin:0 0 8px}.idx a{display:flex;gap:16px;color:#fff;text-decoration:none;font-weight:600;font-size:16px;line-height:1.5;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12)}.idx a span.nn{color:#AEB6D6;font-size:14px;letter-spacing:.1em;min-width:24px;padding-top:2px}.idx a:hover{color:var(--cyan)}.idx p{margin:0 0 8px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#AEB6D6;font-weight:600}
.bar{width:64px;height:5px;background:var(--red);margin-bottom:28px}
.eyebrow{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#AEB6D6;font-weight:600;margin:0 0 12px;line-height:1.5}
h1{font-weight:700;font-size:clamp(36px,6.2vw,64px);line-height:1.1;letter-spacing:-.02em;margin:0 0 20px;max-width:18em;text-wrap:balance}
.sub{font-size:clamp(17px,2vw,20px);line-height:1.6;color:#D6DBF0;margin:0;max-width:44em}
.facts-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0 32px;border-top:1px solid rgba(255,255,255,.22);padding:24px 0 36px;margin:0}
.facts-row div{padding:6px 0}
.facts-row dt{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#AEB6D6;font-weight:600;line-height:1.5}
.facts-row dd{margin:4px 0 0;font-size:19px;font-weight:600;color:#fff;line-height:1.5}
.facts-row dd small{display:block;font-size:15px;font-weight:400;color:#C3CAE6;margin-top:2px}
/* status */
.d{display:inline-block;width:12px;height:12px;border-radius:50%;flex:none;margin-inline-end:8px;vertical-align:baseline;position:relative;top:1px;border:1.5px solid var(--navy)}.dark .d{border-color:transparent}
.d-ok{background:var(--ok)}.d-rev{background:var(--rev)}.d-pub{background:var(--cyan)}.d-rej{background:var(--red)}
.d-prod{background:transparent}.dark .d-prod{border:1.5px solid #fff}
.st{display:inline-flex;align-items:center;font-weight:600;color:var(--navy);font-size:15px;line-height:1.4}
.dark .st{color:#fff;font-size:19px}
/* sections */
section{padding:80px 0;border-top:1px solid var(--rule)}
section:first-of-type{border-top:0}
.sh{display:flex;align-items:baseline;gap:16px;margin-bottom:40px}
.sh .n{font-size:15px;font-weight:700;color:var(--redtx);letter-spacing:.08em}
h2{font-size:clamp(26px,3.4vw,36px);font-weight:600;line-height:1.2;letter-spacing:-.01em;color:var(--navy);margin:0}
.sh .ct{margin-inline-start:auto;font-size:15px;color:var(--mut)}
.ov{display:grid;grid-template-columns:1.25fr 1fr;gap:64px}
.lead{font-size:clamp(18px,2vw,22px);line-height:1.7;color:var(--navy);margin:0 0 20px}
.ov p{margin:0 0 16px}
dl.f{margin:0}
dl.f div{display:flex;justify-content:space-between;gap:20px;padding:14px 0;border-top:1px solid var(--rule)}
dl.f div:last-child{border-bottom:1px solid var(--rule)}
dl.f dt{white-space:nowrap;flex:none;font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);font-weight:600;line-height:1.7}
dl.f dd{margin:0;font-weight:600;color:var(--navy);text-align:end}
/* filters */
.bar-f{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.97);border-bottom:1px solid var(--rule);margin-bottom:40px;padding:6px 0 0}
.frow{display:flex;gap:4px 28px;flex-wrap:wrap;align-items:center}
.fb{font:inherit;font-size:15px;font-weight:600;background:none;border:0;border-bottom:3px solid transparent;color:var(--mut);padding:10px 0 8px;cursor:pointer;display:inline-flex;align-items:center;min-height:44px}
.fb em{font-style:normal;font-weight:400;margin-inline-start:6px;opacity:.8}.fb em::before{content:'('}.fb em::after{content:')'}
.fb[aria-pressed=true]{color:var(--navy);border-bottom-color:var(--red)}
.fb:hover{color:var(--navy)}
.frow.s .fb{font-weight:500;font-size:14px;min-height:38px;padding:6px 0}
.frow.s .d{width:9px;height:9px;margin-inline-end:7px}
/* chapters + cards */
.chap{display:grid;grid-template-columns:232px 1fr;gap:40px;padding:48px 0;border-top:1px solid var(--rule)}.bar-f+.chap{border-top:0;padding-top:8px}.chap.hide{display:none}
.chap.one .grid{grid-template-columns:1fr}.chap.one .card{flex-direction:row;gap:48px;align-items:flex-start}.chap.one .well{flex:0 0 min(46%,400px)}.chap.one .tb{flex:1;align-self:center}
.tb{display:flex;flex-direction:column;flex:1;min-width:0}
.cl{align-self:start;position:sticky;top:104px}.cl .k{font-size:14px;font-weight:700;letter-spacing:.1em;color:var(--redtx)}.cl h3{font-size:28px;font-weight:600;line-height:1.2;letter-spacing:-.01em;color:var(--navy);margin:8px 0 8px}.cl p{margin:0;font-size:15px;color:var(--mut);line-height:1.6}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,264px),1fr));gap:48px 32px}
.card{min-width:0;display:flex;flex-direction:column}
.card.hide{display:none}
.card.wide{grid-column:1/-1}
.well{background:#050A2A;height:400px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:2px;text-decoration:none;position:relative}
.well img{max-width:100%;max-height:100%;width:auto;height:auto}
.well video{width:100%;height:100%;object-fit:contain;background:#050A2A}
a.well{cursor:zoom-in}
.card.wide .well{height:280px}.well.ph.sm{height:176px}.well.ph.sm img.mk{height:52px;margin-bottom:8px}
.well.ph{background:linear-gradient(140deg,#000627,#0A1650);flex-direction:column;gap:6px;text-align:center;color:#fff;padding:24px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.well.ph img.mk{height:98px;width:auto;margin-bottom:14px}
.well.ph b{font-size:20px;font-weight:600;line-height:1.4}
.well.ph span.s{font-size:15px;color:#BCC4E2;line-height:1.5}
.dots{display:inline-flex;gap:7px;margin-top:16px}.dots i{width:9px;height:9px;border-radius:50%;display:block}
.dots i:nth-child(1){background:#fff}.dots i:nth-child(2){background:var(--cyan)}.dots i:nth-child(3){background:var(--red)}
.card h3{margin:24px 0 8px;font-size:20px;font-weight:600;line-height:1.3;color:var(--navy);letter-spacing:-.005em}
.card .ds{text-wrap:pretty;margin:0 0 16px;font-size:16px;line-height:1.65}
.cf{margin-top:auto;padding-top:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid var(--rule)}
.lk{font-size:15px;font-weight:600;color:var(--navy);text-decoration:underline;text-decoration-color:var(--red);text-decoration-thickness:2px;text-underline-offset:5px}
.lk:hover{text-decoration-color:var(--navy)}
.card.rejected .well{opacity:.55;filter:grayscale(.6)}
.int{border-inline-start:3px solid var(--red);padding:2px 0 2px 0;padding-inline-start:16px;margin:16px 0 0;font-size:15px;line-height:1.65;color:var(--body)}
.int b{display:block;color:var(--redtx);font-size:14px;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
.empty{display:none;color:var(--mut);padding:12px 0}
/* copy */
.intro{font-size:18px;color:var(--navy);margin:-12px 0 40px;max-width:46em}
.texts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:48px 40px}
.tx{min-width:0;border-top:3px solid var(--navy);padding-top:18px;display:flex;flex-direction:column}
.txh{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.txh .g{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);font-weight:600;line-height:1.5}
.txh h3{font-size:20px;font-weight:600;line-height:1.35;color:var(--navy);margin:2px 0 0}
.tx pre{margin:18px 0 0;padding:22px 24px;background:var(--tint);border-inline-start:4px solid var(--red);white-space:pre-wrap;overflow-wrap:anywhere;font:400 16px/1.85 "Poppins","Segoe UI",sans-serif;color:var(--navy);unicode-bidi:isolate;flex:1}
.tx pre[dir=rtl]{font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:17.5px;line-height:2}
.tx .nt{margin:12px 0 0;font-size:15px;line-height:1.65;color:var(--body)}
.tx .stl{margin-top:14px}
.btn{font:inherit;font-size:14px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:#fff;color:var(--navy);border:1.5px solid var(--navy);border-radius:2px;padding:0 20px;min-height:44px;cursor:pointer;white-space:nowrap}
.btn:hover{background:var(--navy);color:#fff}
.btn .bd{display:none}.btn.done{background:#1B6B42;border-color:#1B6B42;color:#fff}.btn.done .bc{display:none}.btn.done .bd{display:inline}
.opt{list-style:none;margin:18px 0 0;padding:0}
.opt li{display:flex;align-items:baseline;gap:16px;padding:16px 0;border-top:1px solid var(--rule);font-size:19px;line-height:1.8}
.opt li:last-child{border-bottom:1px solid var(--rule)}
.opt .no{font-size:14px;font-weight:700;color:var(--redtx);min-width:24px}
.opt .tg{margin-inline-start:auto;font-size:14px;color:var(--mut)}
.opt .a{font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif}
/* next */
.todo{list-style:none;margin:0;padding:0;max-width:52em}
.todo li{display:flex;gap:16px;align-items:flex-start;padding:16px 0;border-top:1px solid var(--rule);font-size:17px;line-height:1.65;color:var(--navy)}
.todo li:last-child{border-bottom:1px solid var(--rule)}
.todo li::before{content:"";width:20px;height:20px;border:2px solid var(--navy);border-radius:2px;flex:none;margin-top:3px}
.todo+h3,.ia{margin:40px 0 14px;font-size:20px;color:var(--redtx)}
/* tables */
table{width:100%;border-collapse:collapse}
th{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut);font-weight:600;text-align:start;padding:0 0 12px;padding-inline-end:16px;border-bottom:2px solid var(--navy);line-height:1.5}
td{padding:16px 0;padding-inline-end:16px;border-bottom:1px solid var(--rule);vertical-align:top;font-size:16px;line-height:1.6}
td.dt{white-space:nowrap;color:var(--mut)}
td .sm{display:block;margin-top:4px;font-size:15px;color:var(--mut)}
td.w{white-space:nowrap}
.ck{font-weight:700;font-size:18px;display:inline-block;width:22px}
.c-pass .ck{color:#1B6B42}.c-open .ck{color:var(--mut)}.c-fail .ck{color:var(--redtx)}.c-na .ck{color:var(--mut)}
.src{display:flex;flex-wrap:wrap;gap:10px 28px}
.src a{font-size:16px}.src a.miss{color:var(--mut);text-decoration-style:dashed}
/* contents rail */
.rail{position:fixed;z-index:20;inset-inline-start:16px;top:112px;width:148px}
.rail p{margin:0 0 8px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);font-weight:600;border-bottom:2px solid var(--navy);padding-bottom:8px;line-height:1.5}
.rail a{display:flex;gap:12px;align-items:baseline;color:var(--navy);text-decoration:none;font-size:15px;font-weight:500;line-height:1.4;padding:10px 0;padding-inline-start:12px;border-bottom:1px solid var(--rule);position:relative}
.rail a span.nn{font-size:14px;font-weight:700;color:var(--mut);min-width:22px;letter-spacing:.06em}
.rail a[aria-current=location]{font-weight:700}.rail a[aria-current=location]::before{content:"";position:absolute;inset-inline-start:0;top:6px;bottom:6px;width:3px;background:var(--red)}
.rail a[aria-current=location] span.nn{color:var(--redtx)}.rail a:hover{color:var(--redtx)}
.rb{display:none;position:fixed;z-index:20;inset-inline-end:16px;bottom:16px;font:inherit;font-size:14px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;background:var(--navy);color:#fff;border:0;border-radius:2px;min-height:44px;padding:0 20px;cursor:pointer;align-items:center;gap:10px}
.rb img{height:22px;width:auto}
.scrim{position:fixed;inset:0;z-index:25;background:rgba(0,6,39,.55);opacity:0;pointer-events:none;transition:opacity .28s ease-out}.scrim.open{opacity:1;pointer-events:auto}
@media(min-width:1000px){
 .rail{opacity:0;visibility:hidden;transform:translateX(calc(var(--sg) * -14px));transition:opacity .28s ease-out,transform .28s ease-out,visibility 0s .28s}
 .rail.on{opacity:1;visibility:visible;transform:none;transition:opacity .28s ease-out,transform .28s ease-out}.scrim{display:none}}
@media(min-width:1000px) and (max-width:1499px){
 .wrap{width:calc(100% - 2*var(--g) - 48px);margin-inline-start:calc(var(--g) + 48px);margin-inline-end:var(--g)}
 .rail{inset-inline-start:0;width:48px}.rail p,.rail a span.l-en,.rail a span.l-ar{display:none!important}.rail a{padding-inline-start:12px}
 .rail:hover,.rail:focus-within{width:208px;background:#fff;border-inline-end:1px solid var(--rule);padding-inline-end:12px}
 .rail:hover p,.rail:focus-within p{display:block}
 html[lang=en] .rail:hover a span.l-en,html[lang=en] .rail:focus-within a span.l-en,html[lang=ar] .rail:hover a span.l-ar,html[lang=ar] .rail:focus-within a span.l-ar{display:inline!important}}
/* footer */
footer{background:linear-gradient(135deg,var(--deep),var(--deep2));color:#fff;padding:72px 0 32px}
footer img.lg{height:200px;width:auto;margin-block:-40px -56px;margin-inline-start:-44px}
.ft{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;padding-bottom:40px}
.ft .tg{font-size:clamp(18px,2.4vw,24px);font-weight:600;letter-spacing:-.005em;margin:0;line-height:1.4}.ft .tg::before{content:"";display:block;width:48px;height:5px;background:var(--red);margin-bottom:16px}
.fc{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0 32px;border-top:1px solid rgba(255,255,255,.22);padding:32px 0;margin:0}
.fc div{padding:8px 0;min-width:0}.fc dt{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#AEB6D6;font-weight:600;line-height:1.5}
.fc dd{margin:4px 0 0;font-size:16px;line-height:1.6;color:#fff;overflow-wrap:anywhere}.fc dd a{color:#fff;text-decoration:underline;text-decoration-color:var(--cyan);text-decoration-thickness:2px;text-underline-offset:4px}.fc dd a:hover{text-decoration-color:var(--red)}
.fc .ns{color:#AEB6D6;font-style:italic;font-size:15px}
.fb2{display:flex;justify-content:space-between;align-items:center;gap:16px 32px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.22);padding-top:24px;font-size:15px;color:#C3CAE6;line-height:1.6}.fb2 p{margin:0}
.fb2 .vs{display:flex;align-items:center;gap:12px}.fb2 .vs img{height:24px;width:auto;opacity:.9}
@media(max-width:1000px){.chap{grid-template-columns:1fr;gap:24px;padding:40px 0}.chap.one .card{flex-direction:column;gap:0}.chap.one .well{flex:none;width:100%}.chap.one .tb{align-self:stretch}.cl{position:static}.cl h3{font-size:24px}.hero-body{grid-template-columns:1fr}.idx{display:none}}
@media(max-width:999px){
 .rail{inset-inline-start:0;top:0;bottom:0;width:min(320px,86vw);background:#fff;padding:32px 24px;transform:translateX(calc(var(--sg) * -100%));visibility:hidden;transition:transform .28s ease-out,visibility 0s .28s;overflow:auto;border-inline-end:1px solid var(--rule);z-index:30}
 .rail.open{transform:none;visibility:visible;transition:transform .28s ease-out}.rail a{font-size:18px;padding-block:16px}
 .rb.on{display:inline-flex}.rb.hid{display:none}}
@media(max-width:860px){.top img{height:152px;margin-block:-8px -44px;margin-inline-start:-34px}footer img.lg{height:144px;margin-block:-28px -40px;margin-inline-start:-32px}footer{padding:48px 0 24px}
 .ov{grid-template-columns:1fr;gap:32px}section{padding:56px 0}.hero-body{padding:48px 0 40px}.well{height:420px}.card.wide .well{height:240px}.sh{margin-bottom:28px}.tr{gap:12px}}
@media(max-width:600px){
 .bar-f{position:static;margin-bottom:24px}.frow{gap:0 24px}.chap{padding:32px 0}
 .grid{gap:44px 0}.tx pre{padding:18px 16px}
 .tbl-s thead{display:none}.tbl-s tr{display:block;border-bottom:1px solid var(--rule);padding:14px 0}.tbl-s td{display:block;border:0;padding:2px 0}
 .tbl-s td::before{content:attr(data-l-en);display:block;font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut);font-weight:600;margin-top:6px}
 .top .dl{display:none}}
html[lang=ar] .tbl-s td::before{content:attr(data-l-ar)}
@media(prefers-reduced-motion:reduce){.rail,.rail.on,.rail.open,.scrim{transition:none!important}}
/* plan sections + job files (v1.1): rule lists, label/value rows, dot + word status; no boxes, pills, cards or timelines */
.kvs{margin:0 0 40px}
.kv{display:grid;grid-template-columns:minmax(120px,200px) minmax(0,1fr);gap:4px 24px;padding:14px 0;border-top:1px solid var(--rule)}
.kv:last-child{border-bottom:1px solid var(--rule)}
.kv .k{font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);font-weight:600;line-height:1.7}
.kv .v{color:var(--navy);font-size:17px;line-height:1.7}
.kv .v ul{list-style:none;margin:0;padding:0}.kv .v li{padding:2px 0}
.pl{list-style:none;margin:0;padding:0}
.pr{display:grid;gap:6px 16px;align-items:start;padding:16px 0;border-top:1px solid var(--rule)}
.pl>.pr:last-child{border-bottom:1px solid var(--rule)}
.pr.n{grid-template-columns:36px minmax(0,1fr) auto}
.pr.t{grid-template-columns:minmax(0,1fr) 220px auto}
.pr.f{grid-template-columns:minmax(0,300px) minmax(0,1fr)}
.pr>div{min-width:0}
.pr .no{font-size:15px;font-weight:700;color:var(--redtx);line-height:1.9}
.pr .ti{color:var(--navy);font-size:17px;line-height:1.6}
.pr.cur .ti{font-weight:700}
.pr .cu{display:inline-block;white-space:nowrap;margin-inline-start:10px;font-size:14px;color:var(--mut)}
.pr .nw,.kv .nw,.facts-row .nw,.rail .nw,.idx .nw,.top .nw,.fb2 .nw,.sh .nw,.eyebrow .nw,td .nw{white-space:nowrap}
.pr .sm{display:block;margin-top:2px;font-size:15px;line-height:1.6;color:var(--mut)}
.pr .sm a.lk{color:var(--navy)}
.pr .ps{display:flex;flex-wrap:wrap;align-items:center;gap:0 8px;justify-self:end;white-space:nowrap;color:var(--navy);font-size:15px;line-height:1.7}
.pr .dt2,.pr .dl2{color:var(--mut);font-size:15px;line-height:1.7}
.itag{color:var(--redtx);font-weight:700;font-size:14px;margin-inline-start:8px}
.ns2{color:var(--mut);font-style:italic;margin:0;font-size:15px}
.rc{margin-inline-start:auto;font-size:14px;font-weight:500;color:var(--mut)}
.idx a .rc{color:#AEB6D6}
.facts-row dd small a{color:#fff;text-decoration:underline;text-decoration-color:var(--cyan);text-decoration-thickness:2px;text-underline-offset:4px}
html[lang=ar] .kv .k{font-size:15px;font-weight:600}
.card.nm{border-top:3px solid var(--navy);padding-top:18px}.card.nm h3{margin-top:0}
@media(min-width:601px){html[lang=ar] .tbl-s td::before{content:none}}
@media(min-width:1000px) and (max-width:1499px){.rail .rc{display:none}.rail:hover .rc,.rail:focus-within .rc{display:inline}}
@media(max-width:600px){.kv{grid-template-columns:1fr}.pr.t,.pr.f{grid-template-columns:minmax(0,1fr)}
 .pr.n{grid-template-columns:28px minmax(0,1fr)}.pr.n .ps{grid-column:2;justify-self:start}
 .pr.t .ps{justify-self:start;white-space:normal}}
"""

HEAD_JS = """(function(){var d=document.documentElement,k='tsst-lang-'+d.getAttribute('data-job'),l=d.getAttribute('data-default'),q=null;
try{q=new URLSearchParams(location.search).get('lang')}catch(e){}
try{if(!q){var s=localStorage.getItem(k);if(s)l=s}}catch(e){}
if(q==='en'||q==='ar')l=q;if(l!=='en'&&l!=='ar')l=d.getAttribute('data-default');
d.setAttribute('lang',l);d.setAttribute('dir',l==='ar'?'rtl':'ltr')})();"""

JS = """
(function(){
var d=document.documentElement,K='tsst-lang-'+d.getAttribute('data-job');
function setLang(l,save){d.setAttribute('lang',l);d.setAttribute('dir',l==='ar'?'rtl':'ltr');
 if(save){try{localStorage.setItem(K,l)}catch(e){}}
 var t=document.querySelector('title');if(t)t.textContent=t.getAttribute('data-'+l);
 [].forEach.call(document.querySelectorAll('[data-alt-en]'),function(i){i.setAttribute('alt',i.getAttribute('data-alt-'+l))});
 [].forEach.call(document.querySelectorAll('[data-lbl-en]'),function(i){i.setAttribute('aria-label',i.getAttribute('data-lbl-'+l))});
 [].forEach.call(document.querySelectorAll('.lsw button'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-lang')===l)})}
setLang(d.getAttribute('lang'),false);
[].forEach.call(document.querySelectorAll('.lsw button'),function(b){b.addEventListener('click',function(){setLang(b.getAttribute('data-lang'),true)})});
var cards=[].slice.call(document.querySelectorAll('.card')),F={g:'all',s:'all'};
function apply(){var n=0;cards.forEach(function(c){var ok=(F.g=='all'||c.dataset.group==F.g)&&(F.s=='all'||c.dataset.status==F.s);c.classList.toggle('hide',!ok);if(ok)n++});
[].forEach.call(document.querySelectorAll('.chap'),function(ch){ch.classList.toggle('hide',!ch.querySelector('.card:not(.hide)'))});
var m=document.getElementById('none');if(m)m.style.display=n?'none':'block'}
[].forEach.call(document.querySelectorAll('.fb[data-f]'),function(b){b.addEventListener('click',function(){var k=b.dataset.f;F[k]=b.dataset.v;
[].forEach.call(document.querySelectorAll('.fb[data-f="'+k+'"]'),function(x){x.setAttribute('aria-pressed',x===b)});apply()})});
[].forEach.call(document.querySelectorAll('.btn[data-copy]'),function(b){b.addEventListener('click',function(){
var t=document.getElementById(b.dataset.copy).innerText;
function ok(){b.classList.add('done');setTimeout(function(){b.classList.remove('done')},1600)}
function fb(){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){}document.body.removeChild(a)}
if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(ok,fb)}else{fb()}})});
})();
(function(){var r=document.getElementById('rail'),b=document.getElementById('rb'),sc=document.getElementById('scrim');if(!r||!('IntersectionObserver' in window))return;
var st={h:true,f:false},L={};[].forEach.call(r.querySelectorAll('a'),function(a){L[a.getAttribute('href').slice(1)]=a;a.addEventListener('click',close)});
function close(){r.classList.remove('open');sc.classList.remove('open');b.setAttribute('aria-expanded','false');b.classList.remove('hid')}
function open(){r.classList.add('open');sc.classList.add('open');b.setAttribute('aria-expanded','true');b.classList.add('hid');var f=r.querySelector('a');if(f)f.focus()}
function upd(){var on=!st.h&&!st.f;r.classList.toggle('on',on);b.classList.toggle('on',on);if(!on)close()}
b.addEventListener('click',open);sc.addEventListener('click',close);document.addEventListener('keydown',function(e){if(e.key==='Escape'&&r.classList.contains('open')){close();b.focus()}});
new IntersectionObserver(function(en){st.h=en[0].isIntersecting;upd()}).observe(document.querySelector('header.hero'));
new IntersectionObserver(function(en){st.f=en[0].isIntersecting;upd()}).observe(document.querySelector('footer'));
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){for(var k in L)L[k].removeAttribute('aria-current');if(L[x.target.id])L[x.target.id].setAttribute('aria-current','location')}})},{rootMargin:'-30% 0px -60% 0px'});
Object.keys(L).forEach(function(k){var el=document.getElementById(k);if(el)io.observe(el)});})();
"""


def mark_img(cls="mk"):
    return f'<img class="{cls}" src="{asset("mark_lavender_196.png")}" alt="">'


def dims(job, it):
    for key in ("desc", "format"):
        mm = re.search(r"(\d{3,5})\s*[x×]\s*(\d{3,5})", it.get(key, "") or "")
        if mm:
            return int(mm.group(1)), int(mm.group(2))
    f = it.get("file")
    if f and f.lower().endswith(".png") and os.path.exists(os.path.join(job, f)):
        d = open(os.path.join(job, f), "rb").read(24)
        if d[:8] == b"\x89PNG\r\n\x1a\n":
            return struct.unpack(">II", d[16:24])
    return None


def sdot(st):
    st = st if st in ST_CLS else "production"
    return f'<span class="st"><i class="d {ST_CLS[st]}"></i>{S("st_" + st)}</span>'


def publish(job, it, n):
    src = os.path.join(job, it["file"])
    name = (it.get("id") or f"item{n}") + os.path.splitext(it["file"])[1].lower()
    dst = os.path.join(job, "files", name)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src) or os.path.getmtime(dst) < os.path.getmtime(src):
        shutil.copyfile(src, dst)
    return "files/" + name


# ---------------------------------------------------------------- brand sync (v1.1)
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
brand_sync = []


def brand_of(job):
    mm = re.search(r"[/\\]TSST[/\\]brands[/\\]([^/\\]+)[/\\]", os.path.abspath(job) + os.sep)
    return mm.group(1) if mm else None


def portfolio_name(brand):
    """name: of brands.<brand> in TSST/core/portfolio.yaml (tiny line parser, no YAML library)"""
    try:
        lines = open(os.path.join(ROOT, "TSST", "core", "portfolio.yaml"), encoding="utf-8").read().splitlines()
    except OSError:
        return None
    inside = False
    for ln in lines:
        if re.match(r"^  " + re.escape(brand) + r":\s*(#.*)?$", ln):
            inside = True
        elif inside and re.match(r"^  \S", ln):
            return None
        elif inside:
            mm = re.match(r"^    name:\s*(.*?)\s*$", ln)
            if mm:
                return re.sub(r"\s+#.*$", "", mm.group(1)).strip("\"'") or None
    return None


# ---------------------------------------------------------------- plan sections (v1.1, specs/PLAN_SECTIONS_SPEC_v0.1.md)
PLAN_ST = {"approved": "d-ok", "review": "d-rev", "progress": "d-rev", "production": "d-prod", "published": "d-pub",
           "planned": "d-prod", "open": "d-prod", "done": "d-ok", "blocked": "d-rev", "overdue": "d-rej"}
ROAD_ST = ("approved", "review", "progress", "production", "published", "planned")
TASK_ST = ("open", "done", "blocked")
LAYOUT_FILE = re.compile(r"^0[0-8]b?_[A-Z0-9_]+\.(md|csv)$")
LAYOUT_DIRS = ("files", "work", "observations")
plan_warn, REF_IDS = [], set()


def H(tag, cls, inner):
    return f'<{tag} class="{cls}">{inner}</{tag}>'


def pdot(st):
    return f'<span class="st"><i class="d {PLAN_ST[st]}"></i>{S("st_" + st)}</span>'


def nbi(en, ar):
    """proper names (channels, measurement sources): Arabic falls back to the same name"""
    return T(rich(en), lat(ar or en))


def tgt_html(cx, en, ar, what):
    """KPI target: units/numbers stay one LTR isolate in Arabic ('2,799 EGP'); empty = 'To be agreed'"""
    if not en:
        return H("span", "ns2", S("target_tbd"))
    if ar and not AR_RUN.search(ar):
        return T(rich(en), f'<bdi dir="ltr">{e(ar)}</bdi>')
    if not ar and not AR_RUN.search(en) and re.search(r"\d", en):
        return T(rich(en), f'<bdi dir="ltr">{e(en)}</bdi>')
    return cx.bi(en, ar, what)


def owner_w(o):
    return S("owner_client" if o == "client" else "owner_team")


def itag(x, internal):
    return f' <b class="itag">{S("internal_tag")}</b>' if internal and x.get("internal") else ""


def intbox(cx, internal, x, ax, what):
    if internal and x.get("int_note"):
        return f'<p class="int"><b>{S("internal_label")}</b>{cx.bi(x["int_note"], (ax or {}).get("int_note"), what + ".int_note")}</p>'
    return ""


def plan_prep(m, internal):
    """visible plan data for one audience. Client page drops internal:true entries, every task not owned by the
    client (even when the flag is missing), all int_note and internal_paragraphs."""
    REF_IDS.clear()
    del plan_warn[:]
    today = datetime.date.today()

    def norm(key):
        res = []
        for n, x in enumerate(m.get(key) or [], 1):
            x = dict(x)
            if not x.get("id"):
                plan_warn.append(f"{key}[{n}] has no id")
                x["id"] = f"{key}{n}"
            res.append(x)
        return res

    rm, ms, tk = norm("roadmap"), norm("milestones"), norm("tasks")
    empty = {"task due dates": 0, "milestone dates": 0, "KPI targets": 0}
    for x in rm + ms:
        x.setdefault("status", "planned")
        if x["status"] not in ROAD_ST:
            plan_warn.append(f"{x['id']}: unknown status {x['status']!r} -> planned")
            x["status"] = "planned"
    for x in tk:
        if x.get("owner") not in ("client", "team"):
            plan_warn.append(f"{x['id']}: owner {x.get('owner')!r} is not client|team -> treated as team (hidden on client page)")
        st = x.get("status", "open")
        if st not in TASK_ST:
            plan_warn.append(f"{x['id']}: unknown status {st!r} -> open")
            st = "open"
        x["_st"] = st
        try:
            if st != "done" and x.get("due") and datetime.date.fromisoformat(x["due"]) < today:
                x["_st"] = "overdue"
        except ValueError:
            plan_warn.append(f"{x['id']}: bad due date {x.get('due')!r}")
        if not x.get("due"):
            empty["task due dates"] += 1
    for x in ms:
        if not x.get("date"):
            empty["milestone dates"] += 1
    mp = m.get("marketing_plan") if isinstance(m.get("marketing_plan"), dict) else None
    for k in (mp or {}).get("kpis", []) or []:
        if not k.get("target"):
            empty["KPI targets"] += 1
    bits = [f"{n} {k}" for k, n in empty.items() if n]
    if bits:
        plan_warn.append("empty (shown as 'Date to be set' / 'To be agreed', never guessed): " + ", ".join(bits))
    rmv = [x for x in rm if internal or not x.get("internal")]
    msv = [x for x in ms if internal or not x.get("internal")]
    tkv = [x for x in tk if internal or (not x.get("internal") and x.get("owner") == "client")]
    REF_IDS.update(x["ref"] for x in tkv if x.get("ref"))
    mp_has = bool(mp) and any(mp.get(k) for k in ("objective", "audience", "channels", "messages", "kpis"))
    pend = sum(1 for x in tkv if x.get("owner") == "client" and x["_st"] != "done")
    return {"mp": mp, "rm": rmv, "ms": msv, "tk": tkv,
            "show_mp": (mp is not None) if internal else mp_has,
            "show_rm": ("roadmap" in m) if internal else bool(rmv),
            "show_ms": ("milestones" in m) if internal else bool(msv),
            "show_tk": ("tasks" in m) if internal else bool(tkv),
            "pending": pend}


def tasks_line(pl):
    if not pl["show_tk"] or not pl["pending"]:
        return ""
    k = S("tasks_pending_one") if pl["pending"] == 1 else S("tasks_pending_n", n=pl["pending"])
    return f'<small><a href="#tasks">{k}</a></small>'


def navlinks(secs):
    return "".join(f'<a href="#{i}"><span class="nn">{n+1:02d}</span><span>{S(k)}</span>{H("span", "rc", str(c)) if c else ""}</a>'
                   for n, (i, k, c) in enumerate(secs))


def r_plan(pl, cx, internal, sec):
    mp, amp = pl["mp"] or {}, cx.ar.get("marketing_plan") or {}
    o = [sec("plan", "sec_plan")]
    rows = []

    def kv(key, val):
        rows.append(f'<div class="kv"><b class="k">{S(key)}</b><div class="v">{val}</div></div>')

    if mp.get("objective"):
        kv("plan_objective", cx.bi(mp["objective"], amp.get("objective"), "marketing_plan.objective"))
    if mp.get("audience"):
        kv("plan_audience", cx.bi(mp["audience"], amp.get("audience"), "marketing_plan.audience"))
    if mp.get("channels"):
        lis = []
        for c in mp["channels"]:
            ac = (amp.get("channels") or {}).get(c.get("id"), {})
            role = " · " + cx.bi(c["role"], ac.get("role"), "marketing_plan.channels." + str(c.get("id")) + ".role") if c.get("role") else ""
            lis.append(f'<li><b>{nbi(c.get("name", ""), ac.get("name"))}</b>{role}</li>')
        kv("plan_channels", "<ul>" + "".join(lis) + "</ul>")
    if mp.get("messages"):
        kv("plan_messages", "<ul>" + "".join(
            f'<li>{cx.bi(x.get("text", ""), (amp.get("messages") or {}).get(x.get("id")), "marketing_plan.messages." + str(x.get("id")))}</li>' for x in mp["messages"]) + "</ul>")
    if rows:
        o.append('<div class="kvs">' + "".join(rows) + "</div>")
    if mp.get("kpis"):
        o.append(f'<h3 class="ia">{S("plan_kpis")}</h3><table class="tbl-s"><thead><tr>' + "".join(
            f'<th>{S(h)}</th>' for h in ("th_kpi", "th_target", "th_source", "th_status")) + '</tr></thead><tbody>')
        for k in mp["kpis"]:
            ak = (amp.get("kpis") or {}).get(k.get("id"), {})
            st = k.get("status", "planned")
            st = st if st in ROAD_ST else "planned"
            src = nbi(k["source"], ak.get("source")) if k.get("source") else ""
            w = "marketing_plan.kpis." + str(k.get("id"))
            o.append(f'<tr><td {DL("th_kpi")}><b>{cx.bi(k.get("name", ""), ak.get("name"), w + ".name")}</b>{intbox(cx, internal, k, ak, w)}</td>'
                     f'<td {DL("th_target")}>{tgt_html(cx, k.get("target", ""), ak.get("target"), w + ".target")}</td>'
                     f'<td {DL("th_source")}>{src}</td><td class="w" {DL("th_status")}>{pdot(st)}</td></tr>')
        o.append("</tbody></table>")
    has_int = internal and (mp.get("internal_paragraphs") or mp.get("int_note"))
    if has_int:
        parts = [f'<p>{cx.bi(p, lookup(amp, "internal_paragraphs", i), f"marketing_plan.internal_paragraphs[{i}]")}</p>' for i, p in enumerate(mp.get("internal_paragraphs") or [])]
        if mp.get("int_note"):
            parts.append(f'<p>{cx.bi(mp["int_note"], amp.get("int_note"), "marketing_plan.int_note")}</p>')
        o.append(f'<div class="int"><b>{S("internal_label")}</b>' + "".join(parts) + "</div>")
    if not rows and not mp.get("kpis") and not has_int:
        o.append(H("p", "ns2", S("not_set")))
    o.append("</div></section>")
    return "".join(o)


def r_road(pl, cx, internal, sec):
    rows, ar = pl["rm"], cx.ar.get("roadmap") or {}
    o = [sec("roadmap", "sec_roadmap", S("count_items", n=len(rows)) if rows else "")]
    if not rows:
        o.append(H("p", "ns2", S("not_set")))
    else:
        num = {x["id"]: n for n, x in enumerate(rows, 1)}
        cur = next((x["id"] for x in rows if x["status"] in ("progress", "production", "review")), None)
        o.append('<ol class="pl">')
        for n, x in enumerate(rows, 1):
            ax = ar.get(x["id"], {})
            w = "roadmap." + x["id"]
            meta = []
            if x.get("window"):
                meta.append(cx.bi(x["window"], ax.get("window"), w + ".window"))
            deps = [str(num[d]) for d in (x.get("depends_on") or []) if d in num]
            if deps:
                meta.append(T(*(fmt(l, "plan_depends_n", n=I18N[l]["list_sep"].join(deps)) for l in LANGS)))
            is_cur = x["id"] == cur
            body = (H("span", "ti", cx.bi(x.get("title", ""), ax.get("title"), w + ".title")) + itag(x, internal)
                    + (H("span", "cu", S("plan_current_stage")) if is_cur else "")
                    + (H("span", "sm", cx.bi(x["desc"], ax.get("desc"), w + ".desc")) if x.get("desc") else "")
                    + (H("span", "sm", " · ".join(meta)) if meta else "")
                    + intbox(cx, internal, x, ax, w))
            o.append(f'<li class="pr n{" cur" if is_cur else ""}" id="rm-{e(x["id"])}">{H("span", "no", str(n))}<div>{body}</div>'
                     f'<div class="ps">{pdot(x["status"])}<span>·</span><span>{owner_w(x.get("owner"))}</span></div></li>')
        o.append("</ol>")
    o.append("</div></section>")
    return "".join(o)


def r_miles(pl, cx, internal, sec):
    rows, ar = pl["ms"], cx.ar.get("milestones") or {}
    o = [sec("milestones", "sec_milestones", S("count_items", n=len(rows)) if rows else "")]
    if not rows:
        o.append(H("p", "ns2", S("not_set")))
    else:
        num = {x["id"]: n for n, x in enumerate(pl["rm"], 1)}
        o.append('<ul class="pl">')
        for x in rows:
            ax = ar.get(x["id"], {})
            w = "milestones." + x["id"]
            sub = []
            if x.get("stage") in num:
                sub.append(S("stage_n", n=num[x["stage"]]))
            if x.get("gate"):
                sub.append(S("th_gate") + " · " + cx.bi(x["gate"], ax.get("gate"), w + ".gate"))
            dt = D(x["date"]) if x.get("date") else H("span", "ns2", S("date_tbd"))
            basis = H("span", "sm", S("date_basis_planned")) if x.get("date") and x.get("date_basis") == "planned" else ""
            body = (H("span", "ti", cx.bi(x.get("title", ""), ax.get("title"), w + ".title")) + itag(x, internal)
                    + "".join(H("span", "sm", s_) for s_ in sub) + intbox(cx, internal, x, ax, w))
            o.append(f'<li class="pr t" id="ms-{e(x["id"])}"><div>{body}</div><div class="dt2">{dt}{basis}</div><div class="ps">{pdot(x["status"])}</div></li>')
        o.append("</ul>")
    o.append("</div></section>")
    return "".join(o)


def r_tasks(pl, cx, internal, sec, refs):
    rows, ar = pl["tk"], cx.ar.get("tasks") or {}
    o = [sec("tasks", "sec_tasks_internal" if internal else "sec_tasks", S("count_items", n=len(rows)) if rows else "")]

    def one(x):
        ax = ar.get(x["id"], {})
        w = "tasks." + x["id"]
        ref = ""
        if x.get("ref") and x["ref"] not in refs:
            plan_warn.append(f"{x['id']}: ref {x['ref']!r} matches no visible item:<id> / text:<id> -> no link")
        if x.get("ref") in refs:
            t_en, t_ar = refs[x["ref"]]
            ref = H("span", "sm", f'<a class="lk" href="#{e(x["ref"].replace(":", "-", 1))}">{T(rich(t_en), lat(t_ar or t_en))}</a>')
        dt = (H("span", "dl2", S("th_due")) + " " + D(x["due"])) if x.get("due") else S("date_tbd")
        own = f'<span>·</span><span>{owner_w(x.get("owner"))}</span>' if internal else ""
        body = H("span", "ti", cx.bi(x.get("title", ""), ax.get("title"), w + ".title")) + itag(x, internal) + ref + intbox(cx, internal, x, ax, w)
        return f'<li class="pr t" id="tk-{e(x["id"])}"><div>{body}</div><div class="dt2">{dt}</div><div class="ps">{pdot(x["_st"])}{own}</div></li>'

    if not rows:
        o.append(H("p", "ns2", S("not_set")))
    elif internal:
        for lab, own in (("tasks_client_label", True), ("tasks_team_label", False)):
            grp = [x for x in rows if (x.get("owner") == "client") == own]
            if grp:
                o.append(f'<h3 class="ia">{S(lab)}</h3><ul class="pl">' + "".join(one(x) for x in grp) + "</ul>")
    else:
        o.append('<ul class="pl">' + "".join(one(x) for x in rows) + "</ul>")
    o.append("</div></section>")
    return "".join(o)


def jobfiles(job):
    """layout files that exist in the job folder (JOB_LAYOUT.md): README, 00-08 slots, files/ work/ observations/"""
    out = []
    for n in sorted(os.listdir(job)):
        p = os.path.join(job, n)
        if n == "README.md":
            out.append((n, "jf_readme"))
        elif os.path.isfile(p) and LAYOUT_FILE.match(n):
            out.append((n, "jf_" + n[:2]))
        elif os.path.isdir(p) and n in LAYOUT_DIRS:
            out.append((n + "/", "jf_dir_" + n))
    out.sort(key=lambda t: (t[1] != "jf_readme", t[0]))
    return out


def r_jobfiles(files, sec):
    rows = "".join(f'<li class="pr f"><a class="lk" href="{e(url(n))}" target="_blank"><bdi dir="ltr">{e(n)}</bdi></a>{H("span", "dt2", S(k))}</li>' for n, k in files)
    return sec("jobfiles", "sec_jobfiles", S("count_items", n=len(files))) + f'<ul class="pl">{rows}</ul></div></section>'


def card(n, it, job, internal, cx):
    st = it.get("status", "production")
    st = "production" if st == "draft" else st
    ai = lookup(cx.ar, "items", it.get("id", ""), ) or {}
    f, href = it.get("file"), it.get("href")
    ext = os.path.splitext(f)[1].lower() if f else ""
    typ = it.get("type") or ("image" if ext in IMG else "video" if ext in VID else "link" if href and not f else "doc")
    exists = bool(f) and os.path.exists(os.path.join(job, f))
    if f and not exists:
        missing.append(f)
    link = None
    if exists:
        link = url(it["file"]) if internal else url(publish(job, it, n))
    elif href and internal:
        link = href
    title = it.get("title", "")
    tar = ai.get("title") or title
    if exists and typ == "image":
        media = (f'<a class="well" href="{e(link)}" target="_blank" rel="noopener"><img loading="lazy" src="{e(link)}" alt="{e(title)}" '
                 f'data-alt-en="{e(title)}" data-alt-ar="{e(tar)}"></a>')
    elif exists and typ == "video":
        media = f'<div class="well"><video controls preload="metadata" playsinline src="{e(link)}"></video></div>'
    elif internal and (exists or href):
        media = (f'<div class="well ph sm">{mark_img()}<b>{S("type_" + typ if typ in ("image", "video", "doc", "link") else "type_file")}</b>'
                 f'<span class="s">{S("ph_internal_reference")}</span></div>')
    elif not f and not href and st != "production":
        media = ""  # document-type item with no media (e.g. a source .md): text card, no empty media box
    else:
        media = (f'<div class="well ph">{mark_img()}<b>{S("ph_in_production")}</b><span class="s">{S("ph_preview_to_follow")}</span>'
                 f'<span class="dots"><i></i><i></i><i></i></span></div>')
    d = dims(job, it)
    wide = " wide" if d and d[0] / d[1] >= 2.2 else ""
    grp = it.get("group", "")
    cf = ""
    arrow = '<span class="arr">↗</span>'
    if link and exists and typ in ("image", "video"):
        cf = f'<a class="lk" href="{e(link)}" download>{S("btn_download")}</a>'
    elif link and internal:
        cf = f'<a class="lk" href="{e(link)}" target="_blank" rel="noopener">{S("btn_open")} {arrow}</a>'
    intn = ""
    if internal:
        bits = []
        if it.get("internal"):
            bits.append(S("internal_item_flag"))
        if it.get("int_note"):
            bits.append(cx.bi(it["int_note"], ai.get("int_note"), f"items.{it.get('id')}.int_note"))
        who = cx.bi(it.get("who"), ai.get("who"), f"items.{it.get('id')}.who") if it.get("who") else ""
        dt = D(it["date"]) if it.get("date") else ""
        wd = (who + " · " + dt) if who and dt else (who or dt)
        if wd:
            bits.append(wd)
        if bits:
            intn = f'<p class="int"><b>{S("internal_label")}</b>' + "<br>".join(bits) + '</p>'
    aid = f' id="item-{e(it["id"])}"' if it.get("id") and "item:" + it["id"] in REF_IDS else ""
    nm = " nm" if not media else ""
    return (f'<article{aid} class="card{wide}{nm} {e(st)}" data-status="{e(st)}" data-group="{e(grp)}">{media}'
            f'<div class="tb"><h3>{cx.bi(title, ai.get("title"), f"items.{it.get(chr(105)+chr(100))}.title")}</h3>'
            f'<p class="ds">{cx.bi(it.get("desc", ""), ai.get("desc"), f"items.{it.get(chr(105)+chr(100))}.desc")}</p>{intn}'
            f'<div class="cf">{sdot(st)}{cf}</div></div></article>')


def build(job, audience="client", link_logo=False, manifest=None, write=True):
    del missing[:]
    del missing_ar[:]
    del brand_sync[:]
    internal = audience == "internal"
    m = manifest if manifest is not None else json.load(open(os.path.join(job, "DELIVERY.json"), encoding="utf-8"))
    brand = brand_of(job)
    if not m.get("client"):  # brand sync: the manifest value always wins
        nm = portfolio_name(brand) if brand else None
        m["client"] = nm or brand or os.path.basename(os.path.abspath(job))
        brand_sync.append(f'client = {m["client"]!r} from ' + ("core/portfolio.yaml" if nm else "brand id/folder name (no portfolio entry)"))
    if not m.get("job"):
        m["job"] = os.path.basename(os.path.abspath(job))
        brand_sync.append(f'job = {m["job"]!r} from folder name')
    cx = Ctx(m)
    ar = cx.ar
    out = "DELIVERY_INTERNAL.html" if internal else "DELIVERY.html"
    vis = lambda x: internal or not x.get("internal")
    logo = find_logo(job, m.get("logo", "auto"))
    if logo and not link_logo:
        src = "data:image/png;base64," + b64(logo)
    elif logo:
        src = url(os.path.relpath(logo, job))
    else:
        src = ""
        missing.append("systronic logo")
    img = f'<img src="{src}" alt="The Systronic">' if src else ""
    ab, aab = m.get("about", {}), ar.get("about", {})
    items = [(i, it) for i, it in enumerate(m.get("items", [])) if vis(it)]
    texts = [t for t in m.get("texts", []) if vis(t)]
    decs = [(i, d) for i, d in enumerate(m.get("decisions", [])) if vis(d)]
    dl = m.get("default_lang", "en")
    ttl_en = f'{m.get("title") or m["job"]} · {m["client"]} · The Systronic' + (f' · {I18N["en"]["html_title_internal_suffix"]}' if internal else "")
    ttl_ar = f'{ar.get("title") or m.get("title")} · {m["client"]} · The Systronic' + (f' · {I18N["ar"]["html_title_internal_suffix"]}' if internal else "")
    P = []
    a = P.append
    a(f'<!doctype html><html lang="{dl}" dir="{"rtl" if dl == "ar" else "ltr"}" data-default="{dl}" data-job="{e(re.sub(chr(91)+chr(94)+"a-z0-9"+chr(93)+"+", "-", m["job"].lower()))}">'
      f'<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">'
      f'<meta name="generator" content="The Systronic Delivery System v{VERSION}">'
      f'<script>{HEAD_JS}</script>'
      f'<title data-en="{e(ttl_en)}" data-ar="{e(ttl_ar)}">{e(ttl_en if dl == "en" else ttl_ar)}</title>'
      f'<link rel="icon" type="image/png" href="{asset("favicon_64.png")}">'
      f'<style>{font_css(job, m)}{CSS}</style></head><body>')
    if internal:
        a(f'<div class="band"><div class="wrap">{S("internal_band")}</div></div>')
    a(f'<header class="hero dark"><div class="wrap"><div class="top">{img}<div class="tr"><span class="dl">{S("delivery")}</span>'
      f'<div class="lsw" role="group" data-lbl-en="{e(I18N["en"]["lang_switch_label"])}" data-lbl-ar="{e(I18N["ar"]["lang_switch_label"])}" aria-label="{e(I18N["en"]["lang_switch_label"])}">'
      f'<button type="button" data-lang="en" aria-pressed="{str(dl == "en").lower()}">EN</button>'
      f'<button type="button" data-lang="ar" lang="ar" aria-pressed="{str(dl == "ar").lower()}">ع</button></div></div></div>'
      f'<div class="hero-body"><div><div class="bar"></div><p class="eyebrow">{S("prepared_for")} <bdi dir="ltr" class="nw">{e(m["client"])}</bdi></p>'
      f'<h1>{cx.bi(m.get("title") or m["job"], ar.get("title"), "title")}</h1>')
    if manifest is None and brand:
        from pathlib import Path
        home = next((p for p in Path(job).resolve().parents if p.name == brand and p.parent.name == "brands"), None)
        if home and (home / out).is_file():
            a(f'<p><a class="lk" style="color:inherit" href="{e(url(os.path.relpath(home / out, job)))}" data-brand-link>{S("brand_back")}</a></p>')
    if m.get("subtitle"):
        a(f'<p class="sub">{cx.bi(m["subtitle"], ar.get("subtitle"), "subtitle")}</p>')
    a('</div>')
    pl = plan_prep(m, internal)
    refs = {"item:" + it["id"]: (it.get("title", ""), lookup(ar, "items", it["id"], "title")) for _, it in items if it.get("id")}
    refs.update({"text:" + t["id"]: (t.get("title", ""), lookup(ar, "texts", t["id"], "title")) for t in texts if t.get("id")})
    jf = jobfiles(job) if internal else []
    secs = []
    if m.get("brand_work") is not None:
        secs.append(("work", "brand_work", len(m["brand_work"])))
    if ab.get("paragraphs") or ab.get("facts"):
        secs.append(("overview", "sec_overview", None))
    if pl["show_mp"]:
        secs.append(("plan", "sec_plan", None))
    if pl["show_rm"]:
        secs.append(("roadmap", "sec_roadmap", len(pl["rm"])))
    if pl["show_ms"]:
        secs.append(("milestones", "sec_milestones", len(pl["ms"])))
    if items:
        secs.append(("deliverables", "sec_deliverables", None))
    if texts or m.get("options"):
        secs.append(("copy", "sec_copy", None))
    if pl["show_tk"]:
        secs.append(("tasks", "sec_tasks_internal" if internal else "sec_tasks", len(pl["tk"])))
    if m.get("next") or (internal and m.get("internal_next")):
        secs.append(("next", "sec_next", None))
    if decs:
        secs.append(("approvals", "sec_approvals", None))
    if internal and m.get("checks"):
        secs.append(("checks", "sec_checks", None))
    if internal and m.get("sources"):
        secs.append(("sources", "sec_sources", None))
    if jf:
        secs.append(("jobfiles", "sec_jobfiles", None))
    a(f'<nav class="idx" aria-label="{e(I18N["en"]["contents"])}" data-lbl-en="{e(I18N["en"]["contents"])}" data-lbl-ar="{e(I18N["ar"]["contents"])}"><p>{S("contents")}</p>'
      + navlinks(secs) + '</nav></div>')
    sk = m.get("status", "approved")
    sk = sk if sk in ST_CLS else "approved"
    sl = cx.bi(m.get("status_label") or I18N["en"]["st_" + sk], ar.get("status_label") or I18N["ar"]["st_" + sk], "status_label")
    det = f'<small>{cx.bi(m["status_detail"], ar.get("status_detail"), "status_detail")}</small>' if m.get("status_detail") else ""
    det += tasks_line(pl)
    a(f'<dl class="facts-row"><div><dt>{S("client")}</dt><dd><bdi dir="ltr" class="nw">{e(m["client"])}</bdi></dd></div>'
      f'<div><dt>{S("date")}</dt><dd>{D(m.get("date", ""))}</dd></div>'
      f'<div><dt>{S("status")}</dt><dd><span class="st"><i class="d {ST_CLS[sk]}"></i>{sl}</span>{det}</dd></div></dl>'
      f'</div></header><main>')
    num = [0]

    def sec(sid, key, count=""):
        num[0] += 1
        return (f'<section id="{sid}"><div class="wrap"><div class="sh"><span class="n">{num[0]:02d}</span>'
                f'<h2>{S(key)}</h2>{"<span class=ct>" + count + "</span>" if count else ""}</div>')

    # Brand landing pages use the same chrome, typography and audience renderer.
    if m.get("brand_work") is not None:
        a(sec("work", "brand_work"))
        a('<ul class="pl">')
        for row in m["brand_work"]:
            title = T(rich(row["title"]), lat(row["title_ar"]))
            status = row["status"]
            label = T(rich(row["label"]), lat(row["label_ar"]))
            details = T(rich(row.get("detail", "")), lat(row.get("detail_ar", "")))
            group = T(rich(row.get("group", "")), lat(row.get("group_ar", "")))
            link = f'<a class="ti lk" href="{e(row["href"])}" data-work-link>{title}</a>' if row.get("href") else f'<span class="ti">{title}</span>'
            a(f'<li class="pr t"><div>{group}<br>{link}<span class="sm">{details}</span></div>'
              f'<div class="dt2">{D(row.get("date", ""))}</div>'
              f'<div class="ps"><i class="d {ST_CLS.get(status, "d-prod")}"></i>{label}</div></li>')
        a('</ul></div></section>')
    # overview
    if ab.get("paragraphs") or ab.get("facts"):
        a(sec("overview", "sec_overview"))
        a('<div class="ov"><div>')
        for i, p in enumerate(ab.get("paragraphs", [])):
            a(f'<p class="{"lead" if i == 0 else ""}">{cx.bi(p, lookup(aab, "paragraphs", i), f"about.paragraphs[{i}]")}</p>')
        if ab.get("voice"):
            a(f'<p>{cx.bi(ab["voice"], aab.get("voice"), "about.voice")}</p>')
        if internal and ab.get("internal_paragraphs"):
            a(f'<div class="int"><b>{S("internal_label")}</b>' + "".join(
                f'<p>{cx.bi(p, lookup(aab, "internal_paragraphs", i), f"about.internal_paragraphs[{i}]")}</p>' for i, p in enumerate(ab["internal_paragraphs"])) + '</div>')
        a('</div>')
        rows = []
        for k, v in ab.get("facts", []):
            af = (aab.get("facts") or {}).get(k) or [None, None]
            rows.append(f'<div><dt>{cx.bi(k, af[0], "fact:" + k)}</dt><dd>{cx.bi(v, af[1], "factv:" + k)}</dd></div>')
        if internal:
            for i, (k, v) in enumerate(ab.get("internal_facts", [])):
                af = lookup(aab, "internal_facts", i) or [None, None]
                rows.append(f'<div><dt>{cx.bi(k, af[0], "ifact")}</dt><dd>{cx.bi(v, af[1], "ifactv")}</dd></div>')
        if rows:
            a('<dl class="f">' + "".join(rows) + '</dl>')
        a('</div></div></section>')
    if pl["show_mp"]:
        a(r_plan(pl, cx, internal, sec))
    if pl["show_rm"]:
        a(r_road(pl, cx, internal, sec))
    if pl["show_ms"]:
        a(r_miles(pl, cx, internal, sec))
    # deliverables
    if items:
        cards = [card(i, it, job, internal, cx) for i, it in items]
        gc, sc, garb = {}, {}, {}
        for _, it in items:
            g = it.get("group", "")
            gc[g] = gc.get(g, 0) + 1
            garb.setdefault(g, (lookup(ar, "items", it.get("id", ""), "group") or ""))
            k = it.get("status", "production")
            k = "production" if k == "draft" else k
            sc[k] = sc.get(k, 0) + 1
        gl = lambda g: cx.bi(g, garb.get(g), "group:" + g) if g else S("group_fallback")
        a(sec("deliverables", "sec_deliverables", S("count_items", n=len(items))))
        a('<div class="bar-f">')
        if len([g for g in gc if g]) > 1:
            a(f'<div class="frow"><button class="fb" aria-pressed="true" data-f="g" data-v="all">{S("filter_all")}</button>' + "".join(
                f'<button class="fb" aria-pressed="false" data-f="g" data-v="{e(g)}">{gl(g)}<em>{n}</em></button>' for g, n in gc.items() if g) + '</div>')
        if len(sc) > 1:
            a(f'<div class="frow s"><button class="fb" aria-pressed="true" data-f="s" data-v="all">{S("filter_any_status")}</button>' + "".join(
                f'<button class="fb" aria-pressed="false" data-f="s" data-v="{k}"><i class="d {ST_CLS[k]}"></i>{S("st_" + k)}<em>{n}</em></button>' for k, n in sc.items()) + '</div>')
        a('</div>')
        order = []
        for (_, it), c in zip(items, cards):
            g = it.get("group", "")
            if g not in [x[0] for x in order]:
                order.append((g, []))
            dict(order)[g].append((it, c))
        for k, (g, lst) in enumerate(order):
            sts = {}
            for it, _ in lst:
                s_ = it.get("status", "production")
                s_ = "production" if s_ == "draft" else s_
                sts[s_] = sts.get(s_, 0) + 1
            summ = " · ".join(T(e(I18N["en"]["chapter_summary_item"].format(n=n, label=I18N["en"]["st_" + s_].lower())),
                                lat(I18N["ar"]["chapter_summary_item"].format(n=n, label=I18N["ar"]["st_" + s_]))) for s_, n in sts.items())
            one = " one" if len(lst) == 1 and not (dims(job, lst[0][0]) and dims(job, lst[0][0])[0] / dims(job, lst[0][0])[1] >= 2.2) else ""
            a(f'<div class="chap{one}" data-group="{e(g)}"><div class="cl"><span class="k">{T(chr(65 + k), CHAP_AR[k % len(CHAP_AR)])}</span><h3>{gl(g)}</h3>'
              f'<p>{S("chapter_count", n=len(lst))}<br>{summ}</p></div><div class="grid">' + "".join(c for _, c in lst) + '</div></div>')
        a(f'<div class="empty" id="none">{S("filter_empty")}</div></div></section>')
    # copy
    opt = m.get("options")
    if texts or opt:
        a(sec("copy", "sec_copy", S("count_blocks", n=len(texts)) if texts else ""))
        if m.get("texts_intro"):
            a(f'<p class="intro">{cx.bi(m["texts_intro"], ar.get("texts_intro"), "texts_intro")}</p>')
        a('<div class="texts">')
        for i, t in enumerate(texts):
            at = lookup(ar, "texts", t.get("id", "")) or {}
            dr = t.get("dir", "ltr")
            lang = t.get("lang") or ("ar" if dr == "rtl" else "en")
            ints = f'<p class="int"><b>{S("internal_label")}</b>{cx.bi(t["int_note"], at.get("int_note"), "texts." + t.get("id", "") + ".int_note")}</p>' if internal and t.get("int_note") else ""
            plat = f'<div class="g">{cx.bi(t["platform"], at.get("platform"), "texts." + t.get("id", "") + ".platform")}</div>' if t.get("platform") else ""
            nt = f'<p class="nt">{cx.bi(t["note"], at.get("note"), "texts." + t.get("id", "") + ".note")}</p>' if t.get("note") else ""
            tid = f' id="text-{e(t["id"])}"' if t.get("id") and "text:" + t["id"] in REF_IDS else ""
            a(f'<div{tid} class="tx"><div class="txh"><div>{plat}<h3>{cx.bi(t.get("title", ""), at.get("title"), "texts." + t.get("id", "") + ".title")}</h3></div>'
              f'<button class="btn" data-copy="tx{i}"><span class="bc">{S("btn_copy")}</span><span class="bd">{S("btn_copied")}</span></button></div>'
              f'<pre id="tx{i}" dir="{e(dr)}" lang="{e(lang)}">{body_html(t["body"], dr)}</pre>{nt}{ints}'
              f'{"<div class=stl>" + sdot(t["status"]) + "</div>" if t.get("status") else ""}</div>')
        if opt:
            ao = ar.get("options", {})
            ints = f'<p class="int"><b>{S("internal_label")}</b>{cx.bi(opt["int_note"], ao.get("int_note"), "options.int_note")}</p>' if internal and opt.get("int_note") else ""
            lis = "".join(f'<li><span class="no">{k+1}</span><bdi lang="ar" dir="rtl" class="a">{e(o["ar"])}</bdi>'
                          f'{"<span class=tg>" + cx.bi(o["tag"], ao.get("tag0"), "options.tag") + "</span>" if o.get("tag") else ""}</li>' for k, o in enumerate(opt["items"]))
            a(f'<div class="tx"><div class="txh"><div><div class="g">{S("selection")}</div><h3>{cx.bi(opt["title"], ao.get("title"), "options.title")}</h3></div></div>'
              f'<ul class="opt">{lis}</ul><p class="nt">{cx.bi(opt["label"], ao.get("label"), "options.label")}</p>{ints}</div>')
        a('</div></div></section>')
    if pl["show_tk"]:
        a(r_tasks(pl, cx, internal, sec, refs))
    # next steps
    if m.get("next") or (internal and m.get("internal_next")):
        a(sec("next", "sec_next"))
        if m.get("next"):
            a('<ul class="todo">' + "".join(f'<li><span>{cx.bi(x, lookup(ar, "next", i), f"next[{i}]")}</span></li>' for i, x in enumerate(m["next"])) + '</ul>')
        if internal and m.get("internal_next"):
            a(f'<h3 class="ia">{S("internal_actions")}</h3><ul class="todo">' + "".join(
                f'<li><span>{cx.bi(x, lookup(ar, "internal_next", i), f"internal_next[{i}]")}</span></li>' for i, x in enumerate(m["internal_next"])) + '</ul>')
        a('</div></section>')
    # approvals
    if decs:
        a(sec("approvals", "sec_approvals"))
        hdr = ["th_date", "th_item", "th_status"] + (["th_by"] if internal else [])
        a('<table class="tbl-s"><thead><tr>' + "".join(f'<th>{S(h)}</th>' for h in hdr) + '</tr></thead><tbody>')
        for i, d in decs:
            ad = lookup(ar, "decisions", i) or {}
            stk = d.get("status", "approved").lower()
            nt = f'<span class="sm">{cx.bi(d["int_note"], ad.get("int_note"), f"decisions[{i}].int_note")}</span>' if internal and d.get("int_note") else ""
            tag = f' <b style="color:var(--redtx)">{S("internal_tag")}</b>' if internal and d.get("internal") else ""
            by = f'<td {DL("th_by")}>{cx.bi(d.get("who", ""), ad.get("who"), "decisions.who")}</td>' if internal else ""
            a(f'<tr><td class="dt" {DL("th_date")}>{D(d["date"])}</td><td {DL("th_item")}>{cx.bi(d["item"], ad.get("item"), f"decisions[{i}].item")}{tag}{nt}</td>'
              f'<td class="w" {DL("th_status")}>{sdot(stk)}</td>{by}</tr>')
        a('</tbody></table></div></section>')
    # internal-only
    if internal and m.get("checks"):
        a(sec("checks", "sec_checks", S("count_items", n=len(m["checks"]))))
        a('<table class="tbl-s"><thead><tr>' + "".join(f'<th>{S(h)}</th>' for h in ("th_state", "th_check", "th_note")) + '</tr></thead><tbody>')
        for i, c in enumerate(m["checks"]):
            k, g = CK_CLS.get(c.get("state", "open"), CK_CLS["open"])
            ac = lookup(ar, "checks", i) or {}
            a(f'<tr class="{k}"><td class="w"><span class="ck">{g}</span>{S("ck_" + c.get("state", "open"))}</td>'
              f'<td><b>{cx.bi(c["title"], ac.get("title"), f"checks[{i}].title")}</b></td><td>{cx.bi(c.get("note", ""), ac.get("note"), f"checks[{i}].note")}</td></tr>')
        a('</tbody></table></div></section>')
    if internal and m.get("sources"):
        a(sec("sources", "sec_sources"))
        a('<div class="src">')
        for s_ in m["sources"]:
            lab = cx.bi(s_["label"], (ar.get("sources") or {}).get(s_["label"]), "sources:" + s_["label"])
            if s_.get("url"):
                a(f'<a class="lk" target="_blank" rel="noopener" href="{e(s_["url"])}">{lab} <span class="arr">↗</span></a>')
            else:
                ok = os.path.exists(os.path.join(job, s_["path"]))
                if not ok:
                    missing.append(s_["path"])
                a(f'<a class="lk {"" if ok else "miss"}" target="_blank" href="{e(url(s_["path"]))}">{lab}</a>')
        a('</div></div></section>')
    if jf:
        a(r_jobfiles(jf, sec))
    # footer
    cfg = json.load(open(os.path.join(HERE, "systronic.json"), encoding="utf-8"))
    ns = f'<span class="ns">{S("not_set")}</span>'

    def fcell(key, val_html):
        if not val_html and not internal:
            return ""
        return f'<div><dt>{S(key)}</dt><dd>{val_html or ns}</dd></div>'

    def lk(v, scheme=""):
        return f'<a href="{e(scheme + v)}"><bdi dir="ltr">{e(v)}</bdi></a>' if v else ""

    web = cfg.get("website", "")
    wl = (f'<a href="{e(web if web.startswith("http") else "https://" + web)}"><bdi dir="ltr">{e(web)}</bdi></a>') if web else ""
    soc = " · ".join(f'<a href="{e(x["url"])}"><bdi dir="ltr">{e(x["label"])}</bdi></a>' for x in cfg.get("social", []) if x.get("url"))
    cells = (fcell("foot_website", wl) + fcell("foot_email", lk(cfg.get("email", ""), "mailto:")) + fcell("foot_phone", lk(cfg.get("phone", ""), "tel:"))
             + fcell("foot_whatsapp", lk(cfg.get("whatsapp", ""), "https://wa.me/")) + fcell("foot_address", e(cfg.get("address", "")))
             + fcell("foot_social", soc))
    yr = (m.get("date") or "")[:4] or str(datetime.date.today().year)
    sysname = I18N["en"]["system_name"].replace("v1", "v" + VERSION)
    a(f'</main><footer class="dark"><div class="wrap"><div class="ft">{img.replace("<img ", "<img class=lg ") if img else ""}<p class="tg">{S("foot_tagline")}</p></div>'
      f'{"<dl class=fc>" + cells + "</dl>" if cells else ""}'
      f'<div class="fb2"><p><bdi dir="ltr" class="nw">{e(m["client"])}</bdi> · {D(m.get("date", ""))}</p>'
      f'<p>{rights(yr)}</p>'
      f'<p class="vs"><img src="{asset("mark_white_96.png")}" alt=""><bdi dir="ltr">{e(sysname)}</bdi></p></div></div></footer>')
    a(f'<nav class="rail" id="rail" aria-label="{e(I18N["en"]["contents"])}" data-lbl-en="{e(I18N["en"]["contents"])}" data-lbl-ar="{e(I18N["ar"]["contents"])}"><p>{S("contents")}</p>'
      + navlinks(secs) + '</nav>'
      f'<button class="rb" id="rb" aria-expanded="false" aria-controls="rail"><img src="{asset("mark_white_96.png")}" alt="">{S("contents")}</button><div class="scrim" id="scrim"></div>'
      f'<script>{JS}</script></body></html>')
    doc = "".join(P)
    if write:
        with open(os.path.join(job, out), "w", encoding="utf-8") as fh:
            fh.write(doc)
    return out, doc


class Chk(HTMLParser):
    VOID = {"meta", "img", "br", "input", "link", "hr", "polygon"}

    def __init__(s):
        super().__init__()
        s.stack, s.err = [], []

    def handle_starttag(s, t, a):
        if t not in s.VOID:
            s.stack.append(t)

    def handle_endtag(s, t):
        if t in s.VOID:
            return
        if not s.stack or s.stack[-1] != t:
            s.err.append(f"unexpected </{t}> (open: {s.stack[-3:]})")
            if t in s.stack:
                while s.stack and s.stack.pop() != t:
                    pass
        else:
            s.stack.pop()


def leaks(doc):
    """scan the client page, ignoring inline base64 payloads"""
    plain = re.sub(r"base64,[A-Za-z0-9+/=]+", "base64,", doc)
    return [t for t in LEAK if t in plain]


if __name__ == "__main__":
    argv = sys.argv[1:]
    aud = "both"
    if "--audience" in argv:
        aud = argv[argv.index("--audience") + 1]
    args = [x for i, x in enumerate(argv) if not x.startswith("--") and (i == 0 or argv[i - 1] != "--audience")]
    if not args or aud not in ("client", "internal", "both"):
        sys.exit(__doc__)
    job = args[0]
    bad = 0
    for who in (["client", "internal"] if aud == "both" else [aud]):
        name, doc = build(job, who, "--link-logo" in argv)
        c = Chk()
        c.feed(doc)
        c.close()
        print(f"built {os.path.join(job, name)} ({len(doc)//1024} KB)")
        print("  structure:", "OK" if not c.err and not c.stack else f"PROBLEMS {c.err} unclosed={c.stack}")
        print("  missing files:", sorted(set(missing)) if missing else "none")
        print("  missing Arabic fields:", sorted(set(missing_ar)) if missing_ar else "none")
        if brand_sync:
            print("  brand sync:", "; ".join(brand_sync))
        if plan_warn:
            print("  plan warnings:", "; ".join(plan_warn))
        punct = len(re.findall(r"[.:,;]</bdi>", doc))
        print("  bidi punctuation check ([.:,;]</bdi>):", "OK" if not punct else f"FAIL {punct} hit(s)")
        bad += bool(punct)
        if who == "client":
            lk_ = leaks(doc)
            print("  leak scan:", "clean" if not lk_ else f"LEAK {lk_}")
            bad += bool(lk_)
    sys.exit(1 if bad else 0)
