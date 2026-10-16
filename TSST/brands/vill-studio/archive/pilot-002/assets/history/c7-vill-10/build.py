from pathlib import Path
from PIL import Image
import json,hashlib
p=Path('TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE');a=p/'assets';(a/'images').mkdir(exist_ok=True);(a/'renders').mkdir(exist_ok=True);(a/'sources').mkdir(exist_ok=True);(a/'qa').mkdir(exist_ok=True)
crops={'kitchen':('Port_ (1).png',(457,38,1084,753)),'living':('CP (4).png',(763,39,1640,580)),'dining':('CP (4).png',(763,595,1188,900)),'joinery':('Port_ (1).png',(748,781,1083,1106))}
for name,(src,box) in crops.items(): Image.open(p/'inputs/company-profile'/src).crop(box).save(a/'images'/f'{name}.png')
N='#040136';O='#EE8C01';W='#F3F4F6'
def mix(c,d,t):return '#'+''.join(f'{round(int(c[i:i+2],16)*(1-t)+int(d[i:i+2],16)*t):02X}' for i in (1,3,5))
tokens={'navy':N,'orange':O,'white':W,'navy-tint-20':mix(N,W,.2),'navy-tint-80':mix(N,W,.8),'orange-tint-40':mix(O,W,.4),'orange-shade-20':mix(O,N,.2)}
def lum(c):
 v=[int(c[i:i+2],16)/255 for i in (1,3,5)];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v];return sum(x*w for x,w in zip(v,[.2126,.7152,.0722]))
def contrast(c,d):x,y=sorted([lum(c),lum(d)]);return (y+.05)/(x+.05)
table='\n'.join(f'| {x} / {y} | {contrast(tokens[x],tokens[y]):.2f}:1 |' for x,y in [('white','navy'),('orange','navy'),('navy','orange'),('white','orange'),('navy','white'),('navy-tint-20','white'),('orange-shade-20','white')])
brand=f'''# VILL Studio — Brand Look v1.0

2026-10-05 · C7-VILL-10 · RECOMMENDATION / production specification for independent review.

## Authority and character

FACT: Phase 2b of [BRIEF.md](BRIEF.md) makes `inputs/Logo.png` the only identity authority; navy {N}, orange {O}, white {W} are Lead-sampled. VI and v0.3 are superseded. Strategic containment and proof/RTL rules come from v0.2 §§4,7,8 and current BRIEF.

RECOMMENDATION: Read the angular cut V, heavy italic silhouette and advancing baseline as decisive, structured and energetic. Translate the cut into a diagonal image aperture, not decorative luxury trims. Keep interiors truthful; use orange to identify a decision or next action. Typography is assertive, photography remains calm. Never turn the logo into a font wordmark.

## Palette

Only identity colours and their derived mixtures are design tokens (photographic material colours are not brand tokens). Mix each sRGB channel as `round((1-t)*A + t*B)`; no added black or unrelated neutral.

| Token | Hex | Formula / role |
|---|---|---|
| Navy | {N} | Primary canvas / text |
| Orange | {O} | ≤10% of graphic area; CTA, index, diagonal edge |
| White | {W} | Light canvas / reversed text |
| Navy tint 20 | {tokens['navy-tint-20']} | 80% navy + 20% white; secondary dark surface |
| Navy tint 80 | {tokens['navy-tint-80']} | 20% navy + 80% white; light panel |
| Orange tint 40 | {tokens['orange-tint-40']} | 60% orange + 40% white; decorative only |
| Orange shade 20 | {tokens['orange-shade-20']} | 80% orange + 20% navy; decorative only |

FACT: opaque sRGB WCAG relative-luminance pair calculations, reproducible in `assets/build.py`:

| Foreground / background | Ratio |
|---|---|
{table}

Use white or orange on solid navy; navy on orange/white. White on orange fails normal text: never use. All photo text sits on solid navy/white panels. The logo is an image, never recoloured to improve contrast. No whole-design WCAG certification claimed.

## Typography

RECOMMENDATION: Barlow Condensed Bold 700 / Bold Italic 700 for Latin display, Cairo 700 for Arabic display and Cairo 500 for supporting Arabic. Heavy condensed Latin relates to the logo's forward geometry; Cairo's Kufi construction offers firm horizontal rhythm without distorting Arabic. Body Latin uses Cairo 500. Raleway is excluded.

FACT: Both fonts are SIL Open Font License 1.1. Full fonts and unmodified licence texts are bundled in `assets/fonts/`. Primary sources: [Barlow Condensed](https://github.com/google/fonts/tree/main/ofl/barlowcondensed), [Cairo](https://github.com/google/fonts/tree/main/ofl/cairo). Fonts were downloaded 2026-10-05; hashes are in QA inventory. Font files are not a logo substitute.

| Role at 1080-wide export | Latin | Arabic |
|---|---|---|
| Display | 100–124 px / 1.0 / 700 italic | 72–88 px / 1.35 / 700 |
| Heading | 64–80 px / 1.05 / 700 | 56–68 px / 1.4 / 700 |
| Support | 38–44 px / 1.35 / 500 | 40–44 px / 1.5 / 500 |
| Disclosure / label | 34–36 px / 1.3 / 700 | 34–36 px / 1.5 / 600 |

Arabic RTL, right alignment, zero tracking; no tatweel, fake italic, stretch or faux-bold. Isolate complete English/number runs with `bdi dir=ltr`. Primary and secondary languages are grouped, never interleaved line by line. Western digits are an ASSUMPTION. Never mirror logo/photos. Local bundled fonts are required for fidelity; Arial/Tahoma fallbacks are for emergency viewing, not certified substitutes.

## Grid and image grammar

RECOMMENDATION: 1080×1350 feed, 1080×1920 cover. 12-column mental grid; 72 px margins, 24 px gutters, 12 px base spacing. Common gaps 24/36/48/72. A single slanted aperture echoes the V cut; preserve a clear subject and use distinct photo crops, scales and layouts across a sequence. Solid panels hold copy. Carousel narrative: whole-home view → material/detail question → kitchen as optional entry. Kitchen ad remains kitchen-specific and offers Project Assessment; it implies no whole-home obligation.

Reel cover is a still PNG, not a video. Important cover content lies centrally; included central-square and 4:5 crop simulations are internal checks, not verified current-platform overlays. Keep release pending placement-specific review.

## Logo usage

Use the real `inputs/Logo.png` intact. No retyping, recolour, shear, outline, crop of mark, or regeneration. On navy: place its original square at matching navy. On white: retain its navy holding square; do not extract or recolour a white-background variant. Define V height H from its visible V; exclusion zone ≥H around the visible mark. The delivered original-square placements plus surrounding empty canvas meet this optically (QA measurements). Minimum visible mark width recommended 140 px on 1080 exports / 44 px at 360 preview; smaller labels inside the logo are secondary. For print recommend ≥30 mm visible mark width, proof required. Never overlay busy imagery.

## Imagery and evidence

FACT: supplied profile pages contain kitchen/living/detail visuals; screenshot provenance alone does not prove they are photographs or completed projects. Crops in `assets/images/` have recorded coordinates and no material retouching. No generated imagery is used. ASSUMPTION: source visuals may be used for this private review mockup only. Since image type, original resolution and release rights are unverified, every relevant layout is explicitly labelled CONCEPT and every export remains PRODUCTION_DRAFT. No completion, QC, dimensional, warranty, location, date or testimonial claims are carried into creative.

## ملخص بالعربي

الشكل الجديد مبني على اللوجو فقط: كحلي وبرتقالي وأبيض، مع درجات مشتقة منهم. القطع المائل في حرف V يتحول لإطار للصورة، والخط العربي Cairo مع Barlow Condensed للإنجليزي. العربي RTL بدون مط أو تباعد للحروف، واللوجو والصور لا تُعكس. إعلان المطبخ يركز على المطبخ وProject Assessment، والبيت كله امتداد اختياري. الصور الموجودة في البروفايل مصدر للمراجعة فقط؛ نوعها وحقوق نشرها غير موثقين، لذلك مكتوب عليها CONCEPT. الملفات مسودات إنتاج للمراجعة، ولا يوجد إذن نشر.

## Assumptions and review dependencies

- Conservative use of profile crops for private mockups; no execution-proof claims.
- Numerals 0–9; copy is proposed, no user-only decision blocks the run.
- Independent review after overnight run remains required; production approval and source release records are outstanding.
- Actual exports, phone previews and inspection findings: `assets/README.md`, `assets/qa/`.
'''
(p/'BRAND_LOOK_v1.0.md').write_text(brand,encoding='utf-8',newline='\n');(a/'tokens.json').write_text(json.dumps(tokens,indent=2)+'\n',encoding='utf-8',newline='\n')
css='''@font-face{font-family:Barlow;src:url('../fonts/barlow-condensed-bold.ttf');font-weight:700}@font-face{font-family:Barlow;src:url('../fonts/barlow-condensed-bold-italic.ttf');font-weight:700;font-style:italic}@font-face{font-family:Cairo;src:url('../fonts/cairo.ttf');font-weight:200 1000}*{box-sizing:border-box}html,body{margin:0;background:#040136;color:#F3F4F6}main{width:1080px;position:relative;overflow:hidden;background:#040136;font-family:Cairo} .logo{position:absolute;left:48px;top:0;width:300px;height:300px;object-fit:contain}.kicker{position:absolute;right:72px;top:118px;font:700 36px Barlow;letter-spacing:2px;color:#EE8C01}.en{font:italic 700 110px/1 Barlow}.ar{font:700 76px/1.38 Cairo;direction:rtl;text-align:right;letter-spacing:0}.small{font:500 40px/1.5 Cairo}.label{font:700 34px/1.3 Barlow;letter-spacing:1px}.photo{position:absolute;object-fit:cover}.foot{position:absolute;left:72px;right:72px;bottom:50px;font:700 34px/1.35 Barlow;display:flex;justify-content:space-between}.concept{position:absolute;background:#040136;color:#F3F4F6;padding:8px 16px;font:700 34px/1.25 Barlow;z-index:3}.rule{background:#EE8C01;position:absolute}.cta{background:#EE8C01;color:#040136;font:700 42px/1.3 Barlow;padding:20px 30px}.white{background:#F3F4F6;color:#040136}'''
def wrap(name,h,kicker,body,footer='INTERIOR DESIGN & FIT-OUT'):
 s=f'''<!doctype html><html lang="ar"><meta charset="utf-8"><title>VILL {name} — PRODUCTION_DRAFT</title><style>{css}</style><main style="height:{h}px"><img class="logo" src="../../inputs/Logo.png" alt="Official VILL logo"><div class="kicker">{kicker}</div>{body}<div class="foot"><span>{footer}</span><span>VILL / CONCEPT</span></div></main></html>''';s=s.replace('</style>', '.foot{color:#040136}</style>') if name=='single-post' else s; (a/'sources'/f'{name}.html').write_text(s,encoding='utf-8',newline='\n')
wrap('carousel-01',1350,'01 / THE WHOLE VIEW','''<div class="en" style="position:absolute;left:72px;top:275px">ONE HOME.<br>ONE VISION.</div><div class="ar" style="position:absolute;right:72px;top:498px;font-size:64px">البيت يبدأ برؤية</div><img class="photo" src="../images/living.png" style="left:72px;top:620px;width:936px;height:540px;clip-path:polygon(9% 0,100% 0,100% 100%,0 100%)"><div class="rule" style="left:70px;top:620px;width:16px;height:540px;transform:skewX(-9deg);transform-origin:bottom"></div><div class="concept" style="right:84px;top:1100px">CONCEPT / SOURCE VISUAL</div>''')
wrap('carousel-02',1350,'02 / THE DETAIL','''<div class="ar" style="position:absolute;right:72px;top:268px">تفاصيل تخدم حياتك</div><div class="label" style="position:absolute;left:72px;top:390px">DESIGN STARTS WITH HOW YOU LIVE.</div><img class="photo" src="../images/joinery.png" style="left:72px;top:480px;width:490px;height:690px"><div class="rule" style="left:588px;top:480px;width:8px;height:690px"></div><div class="small" dir="rtl" style="position:absolute;right:72px;top:605px;width:364px">اسأل عن الحركة<br>والتخزين<br>وعلاقة الخامات</div><div class="en" style="position:absolute;right:74px;top:975px;font-size:96px">LIVE.<br>BETTER.</div><div class="concept" style="left:86px;top:1105px;font-size:30px">CONCEPT / SOURCE VISUAL</div>''')
wrap('carousel-03',1350,'03 / YOUR START','''<img class="photo" src="../images/kitchen.png" style="left:72px;top:300px;width:570px;height:730px;clip-path:polygon(14% 0,100% 0,100% 100%,0 100%)"><div class="en" style="position:absolute;right:72px;top:350px;font-size:96px">START<br>WITH<br>YOUR<br>KITCHEN.</div><div class="concept" style="left:84px;top:965px;font-size:30px">CONCEPT / SOURCE VISUAL</div><div class="ar" style="position:absolute;right:72px;top:1054px;font-size:58px">ابدأ بمطبخك</div><div class="label" style="position:absolute;left:72px;top:1163px">WHOLE HOME? AN OPTIONAL NEXT STEP.</div>''')
wrap('reel-cover',1920,'DESIGN / EVERYDAY','''<img class="photo" src="../images/kitchen.png" style="left:108px;top:360px;width:864px;height:1120px;clip-path:polygon(14% 0,100% 0,100% 100%,0 100%)"><div style="position:absolute;left:72px;top:880px;width:850px;background:#040136;padding:38px"><div class="en" style="font-size:120px">A KITCHEN.<br>A BETTER DAY.</div><div class="ar" style="font-size:76px;margin-top:22px">مطبخ ليومك</div></div><div class="concept" style="right:126px;top:1396px">CONCEPT / SOURCE VISUAL</div><div class="label" style="position:absolute;left:108px;top:1536px">INTERIOR DESIGN & FIT-OUT</div>''',footer='REEL COVER / STILL')
wrap('single-post',1350,'DESIGN / DETAIL','''<div class="white" style="position:absolute;left:0;top:300px;width:1080px;height:1050px"></div><div class="ar" style="position:absolute;right:72px;top:350px;color:#040136">المساحة في التفاصيل</div><div class="label" style="position:absolute;left:72px;top:475px;color:#040136">THINK THROUGH EVERYDAY LIVING.</div><img class="photo" src="../images/joinery.png" style="left:72px;top:555px;width:596px;height:540px"><img class="photo" src="../images/dining.png" style="left:698px;top:684px;width:310px;height:410px"><div class="rule" style="left:698px;top:555px;width:310px;height:18px"></div><div class="concept" style="left:86px;top:1015px">CONCEPT / SOURCE VISUAL</div><div class="small" dir="rtl" style="position:absolute;right:72px;top:1140px;color:#040136;font-size:40px">تصميم يبدأ من طريقة استخدامك للبيت</div>''')
wrap('kitchen-ad',1350,'KITCHEN / PROJECT ASSESSMENT','''<img class="photo" src="../images/kitchen.png" style="left:72px;top:300px;width:936px;height:610px;object-position:50% 60%;clip-path:polygon(7% 0,100% 0,100% 100%,0 100%)"><div class="concept" style="right:84px;top:838px">CONCEPT / SOURCE VISUAL</div><div class="ar" style="position:absolute;right:72px;top:954px;font-size:74px">مطبخ على مقاس يومك</div><div class="cta" style="position:absolute;left:72px;top:1102px">PROJECT ASSESSMENT</div><div class="small" dir="rtl" style="position:absolute;right:72px;top:1120px;font-size:40px">ابدأ بتقييم مشروعك</div>''')
wrap('whole-home',1350,'WHOLE HOME / ONE VISION','''<div class="ar" style="position:absolute;right:72px;top:277px">رؤية واحدة للبيت كله</div><img class="photo" src="../images/living.png" style="left:72px;top:420px;width:936px;height:490px;clip-path:polygon(6% 0,100% 0,100% 100%,0 100%)"><img class="photo" src="../images/dining.png" style="left:72px;top:934px;width:400px;height:235px"><img class="photo" src="../images/kitchen.png" style="left:496px;top:934px;width:250px;height:235px;object-position:50% 38%"><img class="photo" src="../images/joinery.png" style="left:770px;top:934px;width:238px;height:235px"><div class="concept" style="right:84px;top:837px">CONCEPT / SOURCE VISUAL</div>''')
(a/'crop-manifest.json').write_text(json.dumps(crops,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Brand Look + 7 editable HTML masters created.')
