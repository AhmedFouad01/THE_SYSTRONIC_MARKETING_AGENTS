"""Build the English + French study booklets (HTML) from GEM-LANG-001b_out.md.

Usage: python build_booklets.py <sprint_dir>
Writes <sprint_dir>/build/English.html and French.html. Page numbers for the
table of contents come from build/pages_<lang>.json (written by finish.py after pass 1).
"""
import html
import io
import json
import re
import sys
from pathlib import Path

import qrcode
import qrcode.image.svg

SPRINT = Path(sys.argv[1])
PAGES = {}
SRC = (SPRINT / "GEM-LANG-001b_out.md").read_text(encoding="utf-8").splitlines()

AR = re.compile(r"[؀-ۿ]")
LAT_RUN = re.compile(r"[(«\"“'\[]?[A-Za-zÀ-ÖØ-öø-ÿŒœ0-9$€£@#][^؀-ۿ]*")
URL = re.compile(r"https?://[^\s)]+")
BOLD = re.compile(r"\*\*(.+?)\*\*")


# ---------------------------------------------------------------- text helpers
def esc_link(s):
    out, last = [], 0
    for m in URL.finditer(s):
        out.append(html.escape(s[last:m.start()]))
        u = m.group(0).rstrip(".,")
        short = re.sub(r"^https?://(www\.)?", "", u)
        if len(short) > 28:
            short = short.split("/")[0] + " ↗"
        out.append(f'<a href="{html.escape(u)}">{html.escape(short)}</a>')
        last = m.start() + len(u)
    out.append(html.escape(s[last:]))
    return "".join(out)


def balance(run):
    """Cut a Latin run so it never holds an unmatched bracket (keeps bidi mirroring right)."""
    stack = []
    for i, ch in enumerate(run):
        if ch == "(":
            stack.append(i)
        elif ch == ")":
            if not stack:
                return run[:i]
            stack.pop()
    return run[:stack[0]] if stack else run


def nb(s):
    """French spacing: keep the space before ? ! : ; from breaking the line."""
    return re.sub(r" ([?!:;»])", " \\1", s.replace("« ", "« "))


def rich(s):
    """Arabic-context text: wrap Latin runs as LTR isolates, keep bold + links."""
    s = s.strip()
    parts, last, pos = [], 0, 0
    while True:
        m = LAT_RUN.search(s, pos)
        if not m:
            break
        core = balance(m.group(0)).rstrip(" ([«\"“-—:·،")
        if not re.search(r"[A-Za-zÀ-ÿ0-9]", core):
            pos = m.start() + 1
            continue
        # a short term or (bracket) ending an Arabic sentence: its period belongs to the Arabic side
        if core.endswith(".") and not core.endswith("...") and AR.search(s[:m.start()]) and (len(core.split()) <= 2 or core.startswith("(")):
            core = core[:-1]
        parts.append(("ar", s[last:m.start()]))
        parts.append(("lat", core))
        last = pos = m.start() + len(core)
    parts.append(("ar", s[last:]))
    out = []
    for kind, txt in parts:
        if not txt:
            continue
        t = esc_link(nb(txt) if kind == "lat" else txt)
        t = BOLD.sub(r"<b>\1</b>", t)
        nw = ' class="nw"' if kind == "lat" and len(txt) <= 24 and "://" not in txt else ""
        out.append(f'<bdi dir="ltr"{nw}>{t}</bdi>' if kind == "lat" else t)
    return "".join(out).replace("**", "")


def latin(s):
    t = BOLD.sub(r"<b>\1</b>", esc_link(nb(s.strip())))
    return t.replace("**", "")


def auto(s):
    """Pick direction by content: Arabic present -> RTL rich, else LTR block."""
    return (f'<span dir="rtl">{rich(s)}</span>' if AR.search(s)
            else f'<span dir="ltr" class="ltr">{latin(s)}</span>')


def qr_svg(url):
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=8, border=1)
    buf = io.BytesIO()
    img.save(buf)
    svg = buf.getvalue().decode("utf-8")
    return svg[svg.index("<svg"):]


def table_cells(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


# ---------------------------------------------------------------- parsing
def parse_days():
    days, cur, sec = {}, None, None
    stop = False
    for line in SRC:
        m = re.match(r"^#{1,2} اليوم (\d+) \(([^)]+)\): (.+)$", line)
        if m:
            n = int(m.group(1))
            cur = days[n] = {"n": n, "title": m.group(3).strip(), "time": [], "rule": [], "words": [],
                             "videos": [], "listen": {}, "script": [], "script_bullets": [], "prompt": [],
                             "quiz": []}
            sec = None
            continue
        if line.startswith("# الملحقات"):
            cur = None
            continue
        if cur is None:
            continue
        m = re.match(r"^### (\d)\. ", line)
        if m:
            sec = int(m.group(1))
            mode = None
            continue
        if sec == 1:
            m = re.match(r"^- (\d+) (?:دقيقة|دقائق): (.+)$", line)
            if m:
                cur["time"].append((int(m.group(1)), m.group(2)))
            elif line.startswith(">"):
                cur["rule"].append(line.lstrip("> ").strip())
        elif sec == 2:
            if line.startswith("| ") and not line.startswith("| Term") and not line.startswith("|---"):
                cur["words"].append(table_cells(line))
        elif sec == 3:
            m = re.match(r"^- \*\*الفيديو[^:]*:\*\* (.+)$", line)
            if m:
                cur["videos"].append({"title": m.group(1).strip(), "lang": "fr" if "(French)" in line else ("en" if "(English)" in line else None)})
                continue
            m = re.match(r"^\s+- (القناة|الرابط|المدة الإجمالية|تركز على إيه): (.+)$", line)
            if m and cur["videos"]:
                v = cur["videos"][-1]
                k, val = m.group(1), m.group(2).strip()
                if k == "القناة":
                    v["channel"] = val
                elif k == "الرابط":
                    v["url"] = URL.search(val).group(0)
                elif k == "المدة الإجمالية":
                    a, _, b = val.partition("·")
                    v["length"] = a.strip()
                    v["watch"] = b.replace("المطلوب مشاهدته:", "").strip()
                else:
                    v["focus"] = val
        elif sec == 4:
            m = re.match(r"^- (الرابط الصوتي|تعليمات الـ Shadowing|سماع كلمة مفردة): (.+)$", line)
            if m:
                cur["listen"][m.group(1)] = m.group(2).strip()
        elif sec == 5:
            if line.startswith("**سكريبت"):
                mode = "script"
            elif line.startswith("**الـ Prompt"):
                mode = "prompt"
            elif line.startswith(">") and mode:
                cur[mode].append(line.lstrip("> ").strip())
            elif line.startswith("- ") and mode == "script":
                cur["script_bullets"].append(line[2:].strip())
        elif sec == 6:
            m = re.match(r"^\d+\. (.+)$", line)
            if m:
                cur["quiz"].append(m.group(1).strip())
    return days


def parse_answers():
    ans = {}
    for line in SRC:
        m = re.match(r"^\*\*اليوم (\d+)(?: \(النهائي\))?:\*\* (.+)$", line)
        if m:
            items = [re.sub(r"^\d+\.\s*", "", x).strip() for x in m.group(2).split(" · ")]
            ans[int(m.group(1))] = items
    return ans


def parse_block_tables(start_marker, stop_prefix="#"):
    rows, on = [], False
    for line in SRC:
        if line.startswith(start_marker):
            on = True
            continue
        if on and line.startswith(stop_prefix) and not line.startswith(start_marker):
            break
        if on and line.startswith("| ") and not line.startswith("|---") and not line.startswith("| الموقف") and not line.startswith("| اليوم |"):
            rows.append(table_cells(line))
    return rows


def realistic(lang):
    key = "**في الإنجليزي" if lang == "en" else "**في الفرنساوي"
    for line in SRC:
        if line.startswith(key):
            head, _, body = line.partition(":**")
            return head.strip("* "), body.strip()
    return "", ""


DAYS = parse_days()
ANS = parse_answers()


def renumber_fr(s):
    """French booklet counts its own days 1-7: map program days 8-14 -> 1-7."""
    def f(m):
        n = int(m.group(2))
        if 8 <= n <= 14:
            return f"{m.group(1)} {n - 7}"
        if n <= 7 and m.group(1) == "يوم":
            return f"يوم {n} في كتيب الإنجليزي"
        return m.group(0)
    return re.sub(r"(اليوم|يوم) (\d+)", f, s)


for _n in range(8, 15):
    _d = DAYS[_n]
    _d["time"] = [(m, renumber_fr(t)) for m, t in _d["time"]]
    _d["quiz"] = [renumber_fr(q) for q in _d["quiz"]]
    ANS[_n] = [renumber_fr(a) for a in ANS[_n]]
SURV_EN = parse_block_tables("### 🇬🇧")
SURV_FR = parse_block_tables("### 🇫🇷")
ANKI = parse_block_tables("## أولاً: خطة المراجعة")

# ---------------------------------------------------------------- per-language config
SUB_EN = {1: "Introductions & Agency Pitch", 2: "Meeting Language", 3: "Numbers, Prices & Deadlines",
          4: "Presenting Campaign Results", 5: "Client Calls & Clarifying", 6: "Emails & WhatsApp",
          7: "Full Mock Meeting"}
SUB_FR = {8: "Les sons, les salutations et se présenter", 9: "Les nombres, les prix et les dates",
          10: "Présenter l'agence", 11: "Les bases de la réunion", 12: "Appels et rendez-vous",
          13: "E-mails et messages", 14: "Réunion simulée"}

d15 = DAYS[15]
REVIEW = {
    "en": {
        "phrases": [[w[0].replace("[EN] ", "")] + w[1:] for w in d15["words"] if w[0].startswith("[EN]")],
        "video": next(v for v in d15["videos"] if v["lang"] == "en"),
        "time": [(20, "راجع الـ 10 جمل الذهبية + الكروت اللي غلطت فيها في Anki."),
                 (25, "اتفرج على فيديو المراجعة من غير ترجمة."),
                 (30, "استماع + Shadowing على درس بيزنس من British Council."),
                 (25, "أعد الاجتماع التجريبي الكامل بتاع اليوم 7 وقارن درجتك."),
                 (20, "الاختبار النهائي + قيّم مستواك.")],
        "listen": {"الرابط الصوتي": "اسمع 10 دقائق من درس استماع بيزنس على British Council (https://learnenglish.britishcouncil.org/free-resources/business).",
                   "تعليمات الـ Shadowing": "اختار 5 جمل من الدرس، وقف بعد كل جملة وقولها بصوت عالي 3 مرات بنفس السرعة والنبرة.",
                   "سماع كلمة مفردة": "راجع أي كلمة علقت معاك طول الأسبوع على Forvo أو Google Translate."},
        "speak_note": "النهارده هتعيد الاجتماع التجريبي الكامل بتاع اليوم 7 بنفس الـ Prompt. الهدف: درجتك تعلى عن أول مرة، وتستخدم جمل أكتر من الأسبوع كله.",
        "script": [], "prompt": DAYS[7]["prompt"],
        "quiz": ['قول "أنا مؤسس وكالة تسويق في القاهرة".',
                 "العميل بيتكلم بسرعة جداً، وقفه بأدب واطلب منه يتكلم أبطأ.",
                 'عايز تقول "مرفق لحضرتك عرض السعر" في إيميل.',
                 "عايز تشارك شاشتك وتتأكد إن العميل شايفها.",
                 "العميل بيسألك سؤال محتاج ترجع فيه للتيم بتاعك، رد عليه.",
                 'قول "الميزانية 1500 دولار شهرياً، و50% دفعة مقدمة".',
                 'العميل بعت تعديل على الواتساب، قوله "شغالين عليه وهبلغك بكل جديد".',
                 "اعترض بشياكة على فكرة العميل.",
                 "اطلب تأجيل الـ Deadline يومين.",
                 "اختم إيميل رسمي."],
    },
    "fr": {
        "phrases": [[w[0].replace("[FR] ", "")] + w[1:] for w in d15["words"] if w[0].startswith("[FR]")],
        "video": next(v for v in d15["videos"] if v["lang"] == "fr"),
        "time": [(20, "راجع الـ 10 جمل الذهبية بالفرنساوي + الكروت اللي غلطت فيها في Anki."),
                 (25, "اتفرج على فيديو المراجعة من غير ما توقفه."),
                 (30, "استماع + Shadowing: Coffee Break French Episode 1 كامل + محادثة من أرشيف الموسم الأول."),
                 (25, "التحدي المزدوج: اجتماع يبدأ فرنساوي ويكمل إنجليزي."),
                 (20, "الاختبار النهائي + قيّم مستواك.")],
        "listen": {"الرابط الصوتي": "Coffee Break French Episode 1 كامل (https://www.youtube.com/watch?v=1Ukf7m7VTIE — المدة 4:23)، وبعدين محادثة من أرشيف الموسم الأول (https://coffeebreaklanguages.com/tag/cbf-season-1/).",
                   "تعليمات الـ Shadowing": "تدريب التحويل السريع (Code-Switching): انطق جملة بالفرنساوي وبعدها فوراً انطق مقابلها بالإنجليزي بصوت عالي.",
                   "سماع كلمة مفردة": "راجع أي كلمة علقت معاك طول الأسبوع على Forvo أو Google Translate."},
        "speak_note": "ده التحدي الأخير: عميل بيبدأ الاجتماع بالفرنساوي، وإنت تكسر الجليد وتقدم الوكالة بالفرنساوي، وبعدين تستأذن تكمل التفاصيل بالإنجليزي.",
        "script": d15["script"], "prompt": d15["prompt"],
        "quiz": ['قول "أنا مؤسس وكالة تسويق في القاهرة" بالفرنساوي.',
                 "العميل بيتكلم بسرعة جداً، وقفه بأدب واطلب منه يتكلم أبطأ.",
                 'عايز تقول "مرفق لحضرتك عرض السعر" في إيميل.',
                 "عايز تشارك شاشتك وتتأكد إن العميل شايفها.",
                 "العميل بيسألك سؤال محتاج ترجع فيه للتيم بتاعك، رد عليه.",
                 'قول "الميزانية 1000 يورو شهرياً".',
                 'العميل بعت تعديل على الواتساب، قوله "شغالين عليه وهبلغك بكل جديد".',
                 "وافق تماماً على فكرة العميل.",
                 "احجز ميعاد يوم التلات الساعة 10 الصبح.",
                 "اختم إيميل رسمي."],
    },
}


def split_final(lang):
    out = []
    for item in ANS[15]:
        en = re.search(r"EN:\s*(.+?)(?=\s*/\s*FR:|$)", item)
        fr = re.search(r"FR:\s*(.+?)(?=\s*/\s*EN:|$)", item)
        m = en if lang == "en" else fr
        out.append(m.group(1).strip() if m else item)
    return out


CFG = {
    "en": {
        "file": "English", "name_ar": "الإنجليزي", "days": list(range(1, 8)), "sub": SUB_EN,
        "accent": "#0E7C7B", "accent2": "#E3F2F1", "ink": "#12304A",
        "title_ar": "الإنجليزي للشغل والاجتماعات", "title_lat": "Business English", "tag": "7-Day Intensive",
        "surv": SURV_EN, "flag": "EN",
    },
    "fr": {
        "file": "French", "name_ar": "الفرنساوي", "days": list(range(8, 15)), "sub": SUB_FR,
        "accent": "#2F5BB7", "accent2": "#E8EEFA", "ink": "#16244A",
        "title_ar": "الفرنساوي للشغل والاجتماعات", "title_lat": "Le français des affaires", "tag": "7 jours intensifs",
        "surv": SURV_FR, "flag": "FR",
    },
}

HOWTO = [
    ("الكلمات (20 دقيقة)", "اقرا الكلمة ومعناها، اسمع نطقها على Forvo أو Google Translate، قولها بصوت عالي 3 مرات، وبعدين اقرا جملة المثال كأنك في اجتماع فعلاً."),
    ("الفيديو (25 دقيقة)", "اتفرج على الدقايق المحددة بس. أول مرة للفهم، وتاني مرة وقّف واكتب أي جملة تقدر تستخدمها في شغلك."),
    ("الاستماع والترديد (30 دقيقة)", "ده أهم بلوك لتحسين النطق والسرعة. اسمع جملة ← وقّف ← قولها بصوت عالي بنفس السرعة والنبرة 3 مرات ← كمّل."),
    ("التحدث مع الـ AI (25 دقيقة)", "اقرا السكريبت بصوت عالي الأول. بعدين انسخ الأمر الإنجليزي من صندوق «انسخ ده» في Gemini أو ChatGPT، وافتح وضع الصوت (Gemini Live / ChatGPT Voice) واتكلم من غير ورقة."),
    ("الاختبار (20 دقيقة)", "جاوب بصوت عالي أو اكتب على السطور من غير ما تبص فوق. صحّح من مفتاح الإجابات في آخر الكتيب، واللي غلطت فيه علّم عليه في Anki."),
]

SECTION_TIPS = {
    "time": "امشي على البلوكات بالترتيب، وما تأجلش التحدث لآخر اليوم — هو أكتر حاجة بتفرق.",
    "words": "النطق المكتوب بالعربي تقريبي. ودنك هي المرجع: اسمع الكلمة الأول وبعدين قلّد.",
    "video": "امسح الـ QR بالموبايل أو دوس على الرابط. اتفرج على الدقايق المحددة بس.",
    "listen": "Shadowing = تكرر ورا المتحدث فوراً بصوت عالي، بنفس السرعة والنبرة.",
    "speak": "انسخ الأمر كما هو، وبعدين اتكلم بالصوت. خلّي الـ AI يصححلك بعد كل رد.",
    "quiz": "جاوب الأول، وبعدين صحّح من مفتاح الإجابات في آخر الكتيب.",
}

TIPS = {
    "en": {
        "title": "أهم نصايح النطق للمتكلم المصري",
        "intro": "دي أكتر الأخطاء اللي بتخلي الطرف التاني يسألك «Sorry?». ركّز عليها من أول يوم.",
        "rows": [
            ("P مش B", "الـ P بتطلع بنفَس هوا خفيف. project, price, proposal مش «بروجيكت» بالـ B التقيلة.", "price · pen ≠ ben"),
            ("V مش F", "الـ V بالسنان على الشفة اللي تحت مع صوت. video, value, deliverables.", "video · very"),
            ("TH", "think, thanks = «ث» · this, that = «ذ». مش «س» ولا «ز».", "thanks · that"),
            ("-teen ≠ -ty", "fifTEEN: الضغط والمد في الآخر · FIFty: الضغط في الأول وآخرها قصير. مهم جداً في الأسعار.", "15 ≠ 50"),
            ("نهاية -ed", "worked = «ووركت» · launched = «لونشت» · needed = «نيديد» (بتتنطق «إد» بس بعد t أو d).", "dropped · increased"),
            ("الاختصارات", "في الاجتماعات بيقولوا I'm, we're, let's, didn't, that's — اتعود تنطقها وتسمعها كده.", "Let's move on"),
            ("ربط الكلام", "Could you → «كودجو» · Let me → «لِمي» · What do you → «وادَيو». ده اللي بيخلي الكلام السريع صعب في الفهم.", "Could you clarify?"),
            ("نبرة السؤال", "سؤال إجابته yes/no صوتك بيطلع في الآخر ↗. سؤال بـ What/When صوتك بينزل ↘.", "Is this a good time? ↗"),
        ],
    },
    "fr": {
        "title": "دليل نطق الفرنساوي السريع",
        "intro": "الفرنساوي بيتكتب حاجة ويتنطق حاجة تانية. القواعد دي بتحل 80% من مشاكل النطق للمبتدئ.",
        "rows": [
            ("r", "«غ» خفيفة من الزور.", "bonjour (بونجوغ) · merci"),
            ("ou", "«أو» مضمومة.", "vous (فو) · pour (بوغ)"),
            ("oi", "«وا».", "moi (موا) · voici (فواسي)"),
            ("u", "صوت مش موجود في العربي: قول «إي» وشفايفك مدورة كأنك بتقول «أو».", "tu · résumé"),
            ("é", "«إيه» قصيرة ومشدودة.", "réunion · café"),
            ("an / en", "«أون» من الأنف، من غير ما تنطق الـ n كاملة.", "enchanté · comment"),
            ("on", "«أون» مدورة من الأنف.", "bonjour · réunion"),
            ("in / ain / un", "«آن» من الأنف.", "vingt (فان) · demain"),
            ("الحرف الأخير", "الحروف الساكنة في آخر الكلمة غالباً ما بتتنطقش (s, t, d, x, z). غالباً بيتنطق c, r, f, l.", "devis (دوفي) · objectif"),
            ("h", "دايماً ساكتة.", "heure (أوغ)"),
            ("ç / gn / ch", "ç = «س» · gn = «نيه» · ch = «ش».", "ça · campagne · marché"),
            ("Liaison", "لو الكلمة اللي بعدها بتبدأ بحرف متحرك، الحرف الساكن بيتوصل بيها.", "vous‿êtes (فوزيت)"),
            ("Vous", "في الشغل دايماً vous (حضرتك)، مش tu.", "Comment allez-vous ?"),
        ],
    },
}


# ---------------------------------------------------------------- rendering
def mark(key):
    return f'<span class="mk">@@{key}@@</span>'


def pg(key):
    return PAGES.get(key, "")


def timebar(items):
    total = sum(m for m, _ in items) or 1
    bar = "".join(f'<div class="seg s{i}" style="flex:{m}"><b>{m}</b><small>MIN</small></div>' for i, (m, _) in enumerate(items))
    rows = "".join(f'<li><span class="dot s{i}"></span><span class="mins">{m} د</span><span>{rich(t)}</span></li>' for i, (m, t) in enumerate(items))
    return f'<div class="timebar" dir="ltr">{bar}</div><ol class="timelist">{rows}</ol>'


def words_table(rows, fr):
    head = "<tr><th class='c-term'>Term" + (" (m/f)" if fr else "") + "</th><th>المعنى</th><th>النطق بالعربي</th><th class='c-ex'>Example</th></tr>"
    body = ""
    for i, r in enumerate(rows, 1):
        term, mean, pron, ex = (r + ["", "", "", ""])[:4]
        body += (f"<tr><td class='c-term' dir='ltr'><span class='num'>{i:02d}</span>{latin(term)}</td>"
                 f"<td class='c-mean'>{rich(mean)}</td><td class='c-pron'>{rich(pron)}</td>"
                 f"<td class='c-ex' dir='ltr'>{latin(ex)}</td></tr>")
    return f'<table class="words"><thead>{head}</thead><tbody>{body}</tbody></table>'


def video_card(v, idx):
    rows = [("القناة", v.get("channel", "")), ("المدة", v.get("length", "")), ("اتفرج على", v.get("watch", ""))]
    meta = "".join(f"<div><span>{k}</span><b>{rich(val)}</b></div>" for k, val in rows if val)
    focus = f'<p class="focus"><span>ركّز على:</span> {rich(v["focus"])}</p>' if v.get("focus") else ""
    return (f'<div class="card video"><div class="qr">{qr_svg(v["url"])}<small>امسح للفتح</small></div>'
            f'<div class="vbody"><div class="vk">فيديو {idx}</div><h4 dir="ltr">{latin(v["title"])}</h4>'
            f'<div class="meta">{meta}</div>{focus}<a class="open" href="{html.escape(v["url"])}">▶ افتح الفيديو</a></div></div>')


def listen_block(L):
    lab = {"الرابط الصوتي": "المصدر", "تعليمات الـ Shadowing": "إزاي تعمل Shadowing", "سماع كلمة مفردة": "نطق كلمة لوحدها"}
    rows = ""
    for k, v in L.items():
        body = rich(v)
        u = URL.search(v) if k == "الرابط الصوتي" else None
        if u:
            body = f'<div class="lsrc"><div class="qr">{qr_svg(u.group(0).rstrip(".,"))}</div><div>{body}</div></div>'
        rows += f'<div class="lrow"><span class="lk">{lab[k]}</span><div>{body}</div></div>'
    return f'<div class="card listen">{rows}</div>'


def speak_block(script, bullets, prompt, note=""):
    s = ""
    if note:
        s += f'<p class="note">{rich(note)}</p>'
    if script or bullets:
        inner = "".join(f'<p dir="ltr">{latin(x.replace("You:", "").strip())}</p>' for x in script)
        if bullets:
            inner += "<ul class='steps'>" + "".join(f"<li>{rich(b)}</li>" for b in bullets) + "</ul>"
        s += f'<div class="script"><div class="bk">السكريبت · اقراه بصوت عالي 5 مرات</div>{inner}</div>'
    if prompt:
        s += (f'<div class="prompt"><div class="bk">انسخ ده · في Gemini Live أو ChatGPT Voice</div>'
              f'<p dir="ltr">{latin(" ".join(prompt))}</p></div>')
    return s


def quiz_block(qs):
    return '<ol class="quiz">' + "".join(f"<li><div class='q'>{rich(q)}</div><div class='wl'></div></li>" for q in qs) + "</ol>"


def sec(num, title, tip_key, body, cls=""):
    tip = f'<p class="tip">💡 {rich(SECTION_TIPS[tip_key])}</p>' if tip_key else ""
    return f'<section class="blk {cls}"><h3><span class="sn">{num}</span>{title}</h3>{tip}{body}</section>'


def day_page(lang, idx, d, review=False):
    c = CFG[lang]
    fr = lang == "fr"
    if review:
        R = REVIEW[lang]
        title_ar, sub = "مراجعة نهائية + الاختبار الشامل", ("Final Review" if lang == "en" else "Révision finale")
        orig = "اليوم 15 في البرنامج"
        time, words, videos, listen = R["time"], R["phrases"], [R["video"]], R["listen"]
        speak = speak_block(R["script"], [], R["prompt"], R["speak_note"])
        quiz = R["quiz"]
        words_title = "02 — الجمل الذهبية (10 جمل)"
    else:
        title_ar, sub = d["title"], c["sub"][d["n"]]
        orig = f"اليوم {d['n']} في البرنامج" if fr else ""
        time, words, videos, listen = d["time"], d["words"], d["videos"], d["listen"]
        speak = speak_block(d["script"], d["script_bullets"], d["prompt"])
        quiz = d["quiz"]
        words_title = f"02 — كلمات وعبارات اليوم ({len(words)})"
    rule = ""
    if d and d.get("rule"):
        rule = f'<div class="rule">{rich(" ".join(d["rule"]).replace("**", ""))}</div>'
    key = f"D{idx}"
    head = (f'<header class="dayhead">{mark(key)}<div class="dnum"><small>اليوم</small><b>{idx}</b></div>'
            f'<div class="dtitle"><h2>{rich(title_ar)}</h2><p dir="ltr">{html.escape(sub)}</p>'
            + (f'<span class="orig">{orig}</span>' if orig else "") + "</div></header>")
    vids = "".join(video_card(v, i) for i, v in enumerate(videos, 1))
    return (f'<article class="day" id="{key}">{head}'
            + sec("01", "جدول الساعتين", "time", timebar(time) + rule)
            + sec("02", words_title[5:], "words", words_table(words, fr), "wordsec")
            + sec("03", "الفيديوهات", "video", vids)
            + sec("04", "الاستماع والترديد", "listen", listen_block(listen))
            + sec("05", "مهمة التحدث", "speak", speak)
            + sec("06", "اختبار نهاية اليوم", "quiz", quiz_block(quiz))
            + "</article>")


def cover(lang):
    c = CFG[lang]
    return (f'<section class="cover"><div class="cv-top" dir="ltr">{c["flag"]} · {html.escape(c["tag"])}</div>'
            f'<div class="cv-mid"><p class="cv-lat" dir="ltr">{html.escape(c["title_lat"])}</p><h1>{c["title_ar"]}</h1>'
            f'<p class="cv-sub">برنامج مكثف · 7 أيام × ساعتين + يوم مراجعة</p>'
            f'<div class="cv-stats"><div><b>8</b><span>أيام</span></div><div><b>16</b><span>ساعة</span></div>'
            f'<div><b>150</b><span>كلمة وجملة</span></div><div><b>80</b><span>سؤال</span></div></div></div>'
            f'<div class="cv-bot">كلمات · فيديوهات · استماع وترديد · تحدث مع الـ AI · اختبارات يومية</div></section>')


def intro_page(lang):
    c = CFG[lang]
    head, body = realistic(lang)
    days = c["days"]
    tools = ('<ul class="tools">'
             f'<li><b dir="ltr">Forvo</b> — اكتب الكلمة واسمعها بصوت ناس من أهل اللغة. <a href="https://forvo.com/languages/{"fr" if lang == "fr" else "en"}/">forvo.com</a></li>'
             '<li><b dir="ltr">YouGlish</b> — بيفتحلك فيديوهات حقيقية في الثانية اللي اتقالت فيها الكلمة. <a href="https://youglish.com">youglish.com</a></li>'
             '<li><b dir="ltr">Google Translate</b> — دوس على السماعة، ودوسة تانية بينطقها بالبطيء. <a href="https://translate.google.com">translate.google.com</a></li></ul>')
    wk = "".join(f'<li><span class="wd">اليوم {i}</span><span>{rich(DAYS[n]["title"])}</span><span class="ws" dir="ltr">{html.escape(c["sub"][n])}</span></li>'
                 for i, n in enumerate(days, 1))
    wk += ('<li><span class="wd">اليوم 8</span><span>مراجعة نهائية + الاختبار الشامل</span>'
           f'<span class="ws" dir="ltr">{"Final Review" if lang == "en" else "Révision finale"}</span></li>')
    return (f'<section class="page intro" id="INTRO">{mark("INTRO")}<div class="kicker">ابدأ من هنا</div><h2 class="ph">هتوصل لإيه في الأسبوع ده؟</h2>'
            f'<div class="result"><h4>{rich(head)}</h4><p>{rich(body)}</p></div>'
            f'<h3 class="h3">خريطة الأسبوع</h3><ol class="week">{wk}</ol>'
            f'<h3 class="h3">أدوات النطق (هتستخدمها كل يوم)</h3>{tools}</section>')


def howto_page(lang):
    steps = "".join(f'<li><b>{rich(t)}</b><p>{rich(d)}</p></li>' for t, d in HOWTO)
    anatomy = ('<div class="anatomy"><div><span class="sn">01</span>جدول الساعتين</div><div><span class="sn">02</span>الكلمات</div>'
               '<div><span class="sn">03</span>الفيديوهات</div><div><span class="sn">04</span>الاستماع</div>'
               '<div><span class="sn">05</span>التحدث</div><div><span class="sn">06</span>الاختبار</div></div>')
    return (f'<section class="page howto" id="HOWTO">{mark("HOWTO")}<div class="kicker">طريقة المذاكرة</div><h2 class="ph">إزاي تستخدم الكتيب ده</h2>'
            '<p class="lead">كل يوم ليه نفس الترتيب الثابت: 6 أجزاء في ساعتين. التزم بالترتيب ومتنطش جزء — التحدث بصوت عالي هو اللي بيعمل الفرق، مش القراءة.</p>'
            f'{anatomy}<ol class="howsteps">{steps}</ol>'
            '<div class="callout"><b>قاعدة ذهبية:</b> أي حاجة في الكتيب ده اتقرت بصوت عالي، مش في سرك. سجّل صوتك مرة في اليوم واسمعه — هتلاحظ أخطائك بنفسك.</div>'
            '<div class="callout soft"><b>Shadowing يعني إيه؟</b> بتسمع جملة من متحدث أصلي، توقّف، وتكررها فوراً بصوت عالي بنفس السرعة والنبرة والوقفات — كأنك صداه. بيدرّب لسانك وودنك في نفس الوقت.</div>'
            '</section>')


def tips_page(lang):
    t = TIPS[lang]
    rows = "".join(f'<tr><td class="tk" dir="ltr">{html.escape(a)}</td><td>{rich(b)}</td><td class="tx" dir="ltr">{html.escape(c)}</td></tr>' for a, b, c in t["rows"])
    return (f'<section class="page tips" id="TIPS">{mark("TIPS")}<div class="kicker">قبل ما تبدأ</div><h2 class="ph">{t["title"]}</h2>'
            f'<p class="lead">{rich(t["intro"])}</p><table class="tipt"><thead><tr><th>الصوت</th><th>إزاي تنطقه</th><th>مثال</th></tr></thead><tbody>{rows}</tbody></table></section>')


def toc_page(lang):
    c = CFG[lang]
    items = [("INTRO", "هتوصل لإيه + خريطة الأسبوع", ""), ("HOWTO", "إزاي تستخدم الكتيب", ""),
             ("TIPS", TIPS[lang]["title"], ""), ("TRACK", "جدول المتابعة", "")]
    for i, n in enumerate(c["days"], 1):
        items.append((f"D{i}", f"اليوم {i} — {DAYS[n]['title']}", c["sub"][n]))
    items += [("D8", "اليوم 8 — مراجعة نهائية + الاختبار الشامل", "Final Review" if lang == "en" else "Révision finale"),
              ("SURV", "ورقة جمل الإنقاذ", "Survival sheet"), ("ANKI", "خطة المراجعة في Anki", "Anki plan"),
              ("ANS", "مفتاح الإجابات", "Answer key")]
    lis = "".join(f'<li><a href="#{k}"><span class="tt">{rich(t)}</span><span class="ts" dir="ltr">{html.escape(s)}</span>'
                  f'<span class="lead-dots"></span><span class="tp">{pg(k)}</span></a></li>' for k, t, s in items)
    return f'<section class="page toc">{mark("TOC")}<div class="kicker">المحتوى</div><h2 class="ph">الفهرس</h2><ol class="tocl">{lis}</ol></section>'


def tracker_page(lang):
    cols = ["الكلمات", "الفيديو", "الاستماع", "التحدث", "الاختبار", "Anki", "درجتي /10"]
    head = "<tr><th>اليوم</th>" + "".join(f"<th>{x}</th>" for x in cols) + "</tr>"
    body = "".join(f"<tr><td class='tdn'>اليوم {i}</td>" + "".join("<td><span class='box'></span></td>" for _ in cols[:-1]) + "<td class='score'></td></tr>" for i in range(1, 9))
    return (f'<section class="page track" id="TRACK">{mark("TRACK")}<div class="kicker">اطبعها وعلّم بإيدك</div><h2 class="ph">جدول المتابعة</h2>'
            '<p class="lead">علّم على كل جزء خلصته، واكتب درجة الاختبار. لو يوم فيه أقل من 7/10، راجع كلماته في Anki قبل ما تبدأ اليوم اللي بعده.</p>'
            f'<table class="trk"><thead>{head}</thead><tbody>{body}</tbody></table>'
            '<div class="notes"><h4>ملاحظاتي</h4><div class="wl"></div><div class="wl"></div><div class="wl"></div><div class="wl"></div><div class="wl"></div></div></section>')


def survival_page(lang):
    c = CFG[lang]
    rows = "".join(f'<tr><td class="sit">{rich(a)}</td><td class="say" dir="ltr">{latin(b.strip("\""))}</td><td class="pr">{rich(p)}</td></tr>' for a, b, p in c["surv"])
    return (f'<section class="page surv" id="SURV">{mark("SURV")}<div class="kicker">اطبعها وحطها جنب اللابتوب</div>'
            f'<h2 class="ph">ورقة جمل الإنقاذ <span class="phl" dir="ltr">Survival Sheet</span></h2>'
            '<p class="lead">الجمل دي بتنقذك في أي اجتماع حقيقي: لما الكلام يبقى سريع، أو كلمة تتوه منك، أو تحتاج وقت تفكر.</p>'
            f'<table class="sv"><thead><tr><th>الموقف</th><th>قول فوراً</th><th>النطق</th></tr></thead><tbody>{rows}</tbody></table></section>')


def anki_page(lang):
    rows = []
    for r in ANKI:
        m = re.match(r"اليوم (\d+)", r[0])
        if not m:
            continue
        n = int(m.group(1))
        if lang == "en" and n <= 7:
            rows.append((f"اليوم {n}", r[1], r[2], r[3]))
        if lang == "fr" and 8 <= n <= 14:
            fix = lambda s: re.sub(r"(\d+)–(\d+)", lambda m: f"{int(m.group(1)) - 7}–{int(m.group(2)) - 7}", re.sub(r"\(يوم (\d+)\)", lambda m: f"(يوم {int(m.group(1)) - 7})", s))
            rows.append((f"اليوم {n - 7}", fix(r[1]), fix(r[2]), r[3]))
    last = next(r for r in ANKI if r[0].startswith("اليوم 15"))
    rows.append(("اليوم 8 +", "الـ 10 جمل الذهبية", last[2], last[3]))
    body = "".join("<tr>" + "".join(f"<td>{rich(x)}</td>" for x in r) + "</tr>" for r in rows)
    return (f'<section class="page anki" id="ANKI">{mark("ANKI")}<div class="kicker">عشان الكلام يثبت</div><h2 class="ph">خطة المراجعة في Anki</h2>'
            '<p class="lead">Anki برنامج كروت مجاني بيوريك الكلمة في الوقت اللي إنت على وشك تنساها فيه. 10 دقايق في أول بلوك المراجعة كل يوم.</p>'
            '<ol class="howsteps small"><li><b>نزّل Anki</b><p>على الكمبيوتر من apps.ankiweb.net أو AnkiDroid على الموبايل.</p></li>'
            '<li><b>استورد ملف الكلمات</b><p>File ← Import ← اختار ملف <bdi dir="ltr">agency_study_cards.csv</bdi> ← Field separator: Comma. أول سطر عناوين، خلّي Anki يتجاهله.</p></li>'
            '<li><b>كل يوم</b><p>ضيف كلمات اليوم الجديدة، وراجع العدد اللي في الجدول. الكارت اللي غلطت فيه دوس عليه Again.</p></li></ol>'
            f'<table class="ak"><thead><tr><th>اليوم</th><th>كلمات جديدة</th><th>تراجع قد إيه</th><th>الوقت</th></tr></thead><tbody>{body}</tbody></table></section>')


def answers_page(lang):
    c = CFG[lang]
    blocks = ""
    for i, n in enumerate(c["days"], 1):
        items = "".join(f"<li>{auto(a)}</li>" for a in ANS[n])
        blocks += f'<div class="ansday"><h4>اليوم {i} <span dir="ltr">· {html.escape(c["sub"][n])}</span></h4><ol>{items}</ol></div>'
    items = "".join(f"<li>{auto(a)}</li>" for a in split_final(lang))
    blocks += f'<div class="ansday"><h4>اليوم 8 <span dir="ltr">· {"Final Review" if lang == "en" else "Révision finale"}</span></h4><ol>{items}</ol></div>'
    return (f'<section class="page answers" id="ANS">{mark("ANS")}<div class="kicker">صحّح بعد ما تخلص، مش قبل</div><h2 class="ph">مفتاح الإجابات</h2>'
            '<p class="lead">بعض الأسئلة ليها أكتر من إجابة صح. لو إجابتك مختلفة بس المعنى واصل وصح لغوياً، اعتبرها صح.</p>'
            f'<div class="anscols">{blocks}</div></section>')


CSS = Path(__file__).with_name("booklet.css").read_text(encoding="utf-8")


def build(lang):
    c = CFG[lang]
    pj = SPRINT / "build" / f"pages_{lang}.json"
    PAGES.clear()
    if pj.exists():
        PAGES.update(json.loads(pj.read_text(encoding="utf-8")))
    days = "".join(day_page(lang, i, DAYS[n]) for i, n in enumerate(c["days"], 1))
    days += day_page(lang, 8, None, review=True)
    css = CSS.replace("--accent:#0E7C7B", f"--accent:{c['accent']}").replace("--accent2:#E3F2F1", f"--accent2:{c['accent2']}").replace("--ink:#12304A", f"--ink:{c['ink']}")
    doc = f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>{c['title_ar']}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>{css}</style></head><body>
{cover(lang)}{intro_page(lang)}{howto_page(lang)}{tips_page(lang)}{toc_page(lang)}{tracker_page(lang)}
{days}{survival_page(lang)}{anki_page(lang)}{answers_page(lang)}
</body></html>"""
    out = SPRINT / "build" / f"{c['file']}.html"
    out.write_text(doc, encoding="utf-8")
    return out


if __name__ == "__main__":
    for lang in ("en", "fr"):
        n = CFG[lang]["days"]
        assert all(len(DAYS[d]["words"]) == 20 and len(DAYS[d]["quiz"]) == 10 and DAYS[d]["videos"] for d in n), lang
        assert len(REVIEW[lang]["phrases"]) == 10, lang
        print(build(lang))
