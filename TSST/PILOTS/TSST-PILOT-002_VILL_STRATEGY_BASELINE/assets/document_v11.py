from pathlib import Path
import json, hashlib
from PIL import Image,ImageOps
p=Path('TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE');a=p/'assets'
t=json.loads((a/'tokens.json').read_text(encoding='utf-8')); pal=t['palette']
def lum(c):
 v=[int(c[i:i+2],16)/255 for i in (1,3,5)];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v];return sum(x*w for x,w in zip(v,[.2126,.7152,.0722]))
def ratio(c,d): x,y=sorted([lum(c),lum(d)]);return (y+.05)/(x+.05)
pairs=[('white','navy','All reversed headlines, footers and CONCEPT panels'),('orange','navy','All kickers'),('navy-tint-80','navy','Carousel 02 and kitchen-ad support'),('navy','orange','Kitchen CTA'),('navy','white','Single-post heading, label and footer'),('navy-tint-20','white','Single-post support')]
rows='\n'.join(f'| {x} {pal[x]} / {y} {pal[y]} | {ratio(pal[x],pal[y]):.2f}:1 | PASS / PASS | {where} |' for x,y,where in pairs)
checks=json.loads((a/'qa/render-checks.json').read_text(encoding='utf-8'))
assert len(checks)==7 and all(all(c['fonts']) and all(i['loaded'] for i in c['images']) and not c['overflow'] for c in checks)
used=[]
for c in checks:
 for item in c['textPairs']:
  fg='#'+''.join(f'{int(v.strip()):02X}' for v in item['foreground'][4:-1].split(','))
  assert fg in pal.values(),(c['name'],item)
  bg='white' if c['name']=='single-post' and item['role'] in ['ar','label','small','foot'] else 'orange' if item['role']=='cta' else 'navy'
  r=ratio(fg,pal[bg]);assert r>=4.5,(c['name'],item,r)
  used.append({'asset':c['name'],**item,'resolved_background':pal[bg],'ratio':round(r,4),'normal_AA':r>=4.5})
(a/'qa/contrast-checks.json').write_text(json.dumps(used,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
for name in ['contact-sheet','reel-cover-square-crop','reel-cover-feed-crop']:
 ImageOps.grayscale(Image.open(a/'qa'/f'{name}.png')).save(a/'qa'/f'{name}-grayscale.png')
# Logo-only evidence region inspected separately at native size.
sheet=Image.new('RGB',(900,600),pal['navy'])
for i,n in enumerate(['carousel-01','carousel-02','carousel-03','kitchen-ad','single-post','whole-home']):sheet.paste(Image.open(a/'renders'/f'{n}.png').crop((48,0,348,300)),((i%3)*300,(i//3)*300))
sheet.save(a/'qa/logo-evidence.png')
brand=f'''# VILL Studio — Brand Look v1.1

2026-10-05 · C7-VILL-11 · identity specification for Lead/user review. Supersedes v1.0; historical files remain intact. Creative gate: PREVIS (rendered template drafts), not release approval. TSST readiness: NOT_READY.

## Authority and brief trace

FACT: [current brief](BRIEF_C7-VILL-11.md) and `TSST/brands/vill-studio/assets/ASSETS.yaml` authorize only `TSST/brands/vill-studio/assets/final/Logo.png` and its read-only PSD. Approved PNG SHA-256: F743A268847ED6E278274B43FD3DDB0B02BEAD64662F45BE57CDA4FE7AE697C7; historical inputs copy matches. Every master references the approved final path directly; neither approved file is edited.

RECOMMENDATION: precise structure and calm, truthful interiors translate the approved strategy's design intelligence, transparency and accountability. Navy organizes; white clarifies; orange points to a decision or action. The existing angled aperture is a layout device, not a logo recreation or sufficient campaign idea. Kitchen entry stays kitchen-specific; whole-home is optional. No positioning/discovery rewrite or invented proof.

Retired VI colours (history only): Obsidian #0E0E0F, Ink Blue #0F1E34, Warm Ivory #F2EFE6, Aged Bronze #B07A3C, Smoked Oak #2A2119, Soft Stone #B8B6B0. Earlier v0.1/v0.2 proposed palettes are also superseded. Photographic material colours are not identity tokens and must not be recoloured.

## Base palette and derivations

Opaque sRGB channel mixing: `mix(A,B,t) = round((1-t)*A+t*B)` independently for R/G/B, using Python ties-to-even rounding. “Tint” mixes toward approved white; “shade” toward approved navy, never added black.

| Base token | Hex | Formula / permitted purpose |
|---|---|---|
| navy | #040136 | Approved original; dominant dark canvas, light-ground text |
| orange | #EE8C01 | Approved original; action and index accent |
| white | #F3F4F6 | Approved original; light canvas and reversed text |
| navy-tint-20 | #34325C | mix(navy,white,0.20); dark surface / muted light-ground text |
| navy-tint-80 | #C3C3D0 | mix(navy,white,0.80); light surface / muted dark-ground text |
| orange-tint-40 | #F0B663 | mix(orange,white,0.40); decorative reserve, no current text use |
| orange-shade-20 | #BF700C | mix(orange,navy,0.20); decorative reserve, no current text use |

RECOMMENDATION: dark graphic area target navy 70%, white/derived light 25%, orange 5% (maximum 10%); light variant white 70%, navy/derived dark 25%, orange 5%. These guide graphic area excluding photos and untouched logo, not pixel quotas. Do not add hues, gradients or translucent text.

## Semantic roles and states

`assets/tokens.json` separates palette values from aliases; generated HTML uses CSS variables. Renderer also injects the current token map so token edits propagate to every master. The single post retains a dark header and has explicit light-panel text aliases.

| Role | Dark | Light |
|---|---|---|
| background | navy | white |
| surface | navy-tint-20 | navy-tint-80 |
| text | white | navy |
| muted-text | navy-tint-80 | navy-tint-20 |
| accent | orange | orange (decoration only on white) |
| CTA | orange | orange |
| on-CTA / on-orange text | navy | navy |
| border | navy-tint-80 | navy-tint-20 |

No interactive interface or chart is delivered. For later applications: default/hover/pressed CTA retain orange/navy and add underline/outline/pressed position, without opacity lowering; focus uses white on dark or navy on light, offset around the CTA. Disabled retains legible foreground and adds an explicit disabled label. Status/validation use written labels and icons, never orange alone to distinguish success/error. Charts require directly labelled categories plus shapes/patterns, not additional status hues. Re-test actual interactive/chart implementations; mappings are specification, not tested UI certification.

## Measured text/background contrast

FACT: all resolved pairs actually used in seven PNG masters and the RTL QA specimen are below. Ratios use WCAG relative luminance `(Lmax+0.05)/(Lmin+0.05)`, opaque solid panels. Normal AA 4.5:1; large AA 3:1. Rendered foreground records and resolved panel backgrounds: `assets/qa/contrast-checks.json`. Transparent CSS text sits on the opaque navy canvas or explicit white single-post panel; no untested photo text.

| Actual foreground / background | Ratio | Normal / large AA | Usage |
|---|---|---|---|
{rows}

| Prohibited or reserve pair | Ratio | Result / required fix |
|---|---|---|
| white / orange | {ratio(pal['white'],pal['orange']):.2f}:1 | FAIL normal and large; use navy on-orange |
| orange / white | {ratio(pal['orange'],pal['white']):.2f}:1 | FAIL normal and large; use navy text, keep orange decorative |
| orange-shade-20 / white | {ratio(pal['orange-shade-20'],pal['white']):.2f}:1 | FAIL normal; reserve decorative, use navy text |

Meaningful borders: navy-tint-80/navy {ratio(pal['navy-tint-80'],pal['navy']):.2f}:1 and navy-tint-20/white {ratio(pal['navy-tint-20'],pal['white']):.2f}:1 pass 3:1. Current orange rules on navy pass {ratio(pal['orange'],pal['navy']):.2f}:1; orange bar on white fails 3:1 and is decorative only (no status or sole boundary). Dark text on dark surface, muted dark text on dark surface, and light-theme text/muted text on light surface must use tested aliases; reserve combinations need revalidation. The original logo is an unchanged image; logo lettering is not a claim of WCAG whole-design conformance.

## Original logo rules

Use approved PNG intact at its native square ratio; PSD is read-only source. On navy retain original navy square. On white keep the original navy holding square; no extraction, retyping, replacement wordmark, recolour, opacity effect, crop of visible mark, distortion, shear, mirror or generation. Never place over busy imagery without its solid holding field.

Let H be visible V height. Keep exclusion space ≥H around the visible mark, measured to text/photo/frame edges. Current 300 px square displays roughly 200 px mark width / 76 px V height; native PNG and phone inspections confirm geometry. Minimum recommended visible mark 140 px at 1080 export / 44 px at 360 preview, print ≥30 mm with proof; tiny STUDIO descriptor is supporting, never the only service description. On white allow extra navy holding field outside the original square to maintain H; this changes the panel, never the logo.

Cover logo is now inside the central square and 4:5 crops: square source y420–1500; 4:5 y285–1635. The original logo sits above the headline inside one integrated navy panel at y650; the kitchen hero remains continuous behind the panel. Headline and CONCEPT survive both. These are internal simulations, not verified current-platform overlays.

## Typography, layouts and imagery

Keep bundled Cairo 700 Arabic display / 500 support and Barlow Condensed 700/Bold Italic Latin, SIL OFL 1.1 licences in `assets/fonts/`. Barlow is an existing layout family, not asserted as a geometric match to the wide logo; prior type/art-direction criticism remains an unresolved concept issue outside this colour revision. No new font downloads. Arabic RTL/right-aligned with tracking 0; isolate English, full number+unit, dates and currency using `bdi dir=ltr`; no faux italic, tatweel/stretch or mirroring of images/mark. English and Arabic remain grouped. Western digits are a stated assumption.

1080×1350 feed masters, 1080×1920 still cover; 72 px nominal margins, 24 px gutters, 12 px spacing base. Vary subject, crop, scale and light/dark panel; the current template pack still lacks a differentiated campaign key visual per historical review. Social: a native crop and opaque copy panel; deck/web: the same role aliases and isolated bilingual runs, with re-tested dimensions and UI states before implementation. Web/deck deliverables are not part of this task.

Future release imagery: original licensed photo/render, recommend ≥2400 px long side with native crop resolution adequate for delivered placement; aligned architectural verticals, controlled natural light, one focal subject, no material-changing retouch. Current crops are unchanged screenshot evidence: kitchen 627×715, living 877×541, dining 425×305, joinery 335×325. Softness remains visible; no upscaling claim or fabricated completed-project status. Every asset retains CONCEPT / SOURCE VISUAL per the newer brief. Proof captions require project/source/date/signer/permission, otherwise omit.

## QA and limitations

All seven actual PNGs and 360 px previews inspected; joining/bidi/diacritics specimen and cover crops inspected; foreground inheritance defect fixed and re-rendered. Fonts/images loaded, no text canvas overflow, all six actual text pairs pass AA. Grayscale previews preserve headings, CTA shape, indices and disclosure without colour-only meaning. Full colour-vision simulation is unavailable in this existing pipeline; no such certification claimed.

Identity/token completion does not close `REVIEW_TEAM_2026-10-05.md` high-severity concept/imagery/type/copy findings. Creative gate remains PREVIS even though actual PNGs exist (historical v1.0 called them PRODUCTION_DRAFT). Rights, source type/high resolution, proof, channel CTA and independent Lead/LENS strategic review remain open before production acceptance. No publication, spending, external contact, Real Memory or git changes.

Skills used: TSST-CREATIVE-SK-006 — palette/semantic aliases, all actual pairs and grayscale; TSST-CREATIVE-SK-001 — authority inventory and cross-surface rules; TSST-CREATIVE-SK-010 — actual PNG/phone/RTL/logo/crop checks and defect dispositions. Skills skipped: SK-003 folded into SK-006; SK-005 retained existing typography and recorded unresolved art-direction criticism; SK-014 no generation. skill_friction: SK-006 supplies no concrete colour-vision simulation tool; recorded limitation, no invented test. Next: Lead independently inspects bounded task and judges identity; future key-visual work needs a separate brief/assets/proof.

## ملخص بالعربي

الهوية v1.1 مبنية على اللوجو المعتمد فقط: كحلي #040136 وبرتقالي #EE8C01 وأبيض #F3F4F6، والدرجات الإضافية خلط محسوب منهم. الخلفية والنص والزر والحدود لها أدوار ثابتة؛ النص فوق البرتقالي كحلي، وليس أبيض. اللوجو الأصلي محفوظ بدون تعديل، والماسترز تشير للنسخة المعتمدة مباشرة. أعدنا إخراج الملفات السبعة وفحصنا المقاس والعربي ونسخ الموبايل؛ لوجو غلاف الريل يظهر في قصتي المربع و4:5. مراجعة الفكرة والصور السابقة مازالت مفتوحة: القوالب PREVIS وليست حملة نهائية، والصور CONCEPT وحقوقها ودقتها الأصلية غير موثقة. هذه نهاية تعديل الهوية والألوان للمراجعة، وليست موافقة نشر.
'''
(p/'BRAND_LOOK_v1.1.md').write_text(brand,encoding='utf-8',newline='\n')
print('v1.1 identity written; '+str(len(used))+' actual text elements pass normal AA.')
