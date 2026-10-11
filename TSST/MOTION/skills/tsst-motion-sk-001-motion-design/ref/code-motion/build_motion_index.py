import json, csv, sys, re, ast, collections, os
dl, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
AD = re.compile(r"\b(ad|ads|advert\w*|commercial|promo\w*|launch\w*|product|brand\w*|logo|campaign|marketing|trailer|app store|landing|saas|startup|sale)\b", re.I)
rows = []
# yihui: 513 prompts with tech tags
v = json.load(open(f"{dl}/yihui/data/videos.json", encoding="utf-8"))
for x in v:
    tags = x.get("tech_tags") or []
    if isinstance(tags, str):
        try: tags = ast.literal_eval(tags)
        except Exception: tags = [tags]
    p = x.get("prompt") or ""
    rows.append({"source": "yihui", "id": x.get("slug"), "category": x.get("category"),
        "style": "", "tech": "|".join(tags), "prompt_words": len(p.split()),
        "prompt_partial": x.get("prompt_partial"), "ad_like": "yes" if AD.search(p) else "",
        "topic": "", "post_url": x.get("post_url"), "prompt_page": x.get("skillry_url"), "added": x.get("added")})
# athemeroy: domain/style atlas
for r in csv.DictReader(open(f"{dl}/athemeroy/data/domain-style.csv", encoding="utf-8")):
    rows.append({"source": "athemeroy", "id": r["post_url"].rsplit("/", 1)[-1], "category": r["domain"],
        "style": "|".join(s for s in (r["style"], r["style2"]) if s), "tech": "", "prompt_words": "",
        "prompt_partial": "", "ad_like": "yes" if r["domain"] == "product_ad" or AD.search(r["topic_en"]) else "",
        "topic": r["topic_en"], "post_url": r["post_url"], "prompt_page": "", "added": ""})
# production paths
paths = collections.Counter(r["primary_path"] for r in csv.DictReader(open(f"{dl}/athemeroy/data/cases.csv", encoding="utf-8")))
fields = list(rows[0].keys())
with open(f"{out}/code-motion-index.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
y = [r for r in rows if r["source"] == "yihui"]; a = [r for r in rows if r["source"] == "athemeroy"]
cat = collections.Counter(r["category"] for r in y)
tech = collections.Counter(t for r in y for t in r["tech"].split("|") if t)
dom = collections.Counter(r["category"] for r in a)
sty = collections.Counter(s for r in a for s in r["style"].split("|") if s)
pw = sorted(r["prompt_words"] for r in y if r["prompt_words"])
med = pw[len(pw)//2] if pw else 0
ads = [r for r in rows if r["ad_like"]]
def tbl(c, h): return f"| {h} | count |\n|---|---|\n" + "\n".join(f"| {k} | {n} |" for k, n in c.most_common())
md = f"""# Code-drawn motion: index of public examples (auto-built, no video watched)

Built by script from the text files of two public lists (downloaded 2026-10-08, text only, no media):
- yihui-dev/awesome-opus5-5-videos (MIT for the repo; every prompt and video belongs to its creator)
- athemeroy/awesome-claude-5-5-videos (annotations CC BY 4.0; linked works belong to their creators)
Rule: we link and learn patterns; we never copy a creator's prompt into TSST skills.
Full row list: `code-motion-index.csv` ({len(rows)} rows; {len(ads)} flagged ad-like).

## yihui list: {len(y)} prompts
Prompt length (words): min {pw[0] if pw else 0}, median {med}, max {pw[-1] if pw else 0}.

{tbl(cat, "category")}

{tbl(tech, "tech tag")}

## athemeroy atlas: {len(a)} reviewed cases
{tbl(dom, "domain")}

{tbl(sty, "visual style")}

{tbl(paths, "production path")}

## Where to look first (for TSST ads / brands)
Filter `code-motion-index.csv` by `ad_like = yes`, or athemeroy `category = product_ad`. Open only the rows you need (post_url / prompt_page); do not batch-watch videos.
"""
open(f"{out}/code-motion-stats.md", "w", encoding="utf-8").write(md)
print(len(rows), "rows;", len(ads), "ad-like; yihui", len(y), "athemeroy", len(a))
