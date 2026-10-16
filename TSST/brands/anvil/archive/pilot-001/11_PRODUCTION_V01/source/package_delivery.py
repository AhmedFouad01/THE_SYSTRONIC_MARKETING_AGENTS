import pathlib,json,shutil,html,re,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'delivery';OUT.mkdir(exist_ok=True)
for name in ['stills','covers','videos','subtitles','audio','scenes','source','qa']:
 shutil.copytree(ROOT/name,OUT/name,dirs_exist_ok=True)
(OUT/'sources').mkdir(exist_ok=True)
for name in ['video_timelines.json','approved_production_briefs.md']:shutil.copy2(ROOT/'sources'/name,OUT/'sources'/name)
narr=json.loads((ROOT/'sources/narration_downloads.json').read_text('utf-8'))
for item in narr:item.pop('url',None);item.pop('result',None)
(OUT/'sources/narration_provenance.json').write_text(json.dumps({'provider':'Magnific / ElevenLabs','catalogVoice':'Yusuf Al-Mansour','model':'eleven_v3','existingCreditsConsumed':258,'synthetic':True,'voiceClone':False,'items':narr},ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(ROOT/'static-contact-sheet.jpg',OUT/'qa/static-contact-sheet.jpg')
brief=(OUT/'sources/approved_production_briefs.md').read_text('utf-8')
captions={}
for day in range(1,8):
 section=re.search(r'## D'+str(day)+r' —.*?(?=\n## D|\n## Shoot|\Z)',brief,re.S)[0]
 cap=re.search(r'Caption:\s*[«“](.*?)[»”]',section,re.S)
 if cap:captions[day]=cap[1].replace('بعد يومين','قريب').replace('بكرة','قريب')
(OUT/'CAPTIONS_AR.md').write_text('# كابشن الحملة — V01\n\nنسخة الإنتاج تستخدم «قريب» لحين تثبيت موعد الإطلاق. تُستخدم صياغة اليوم نفسها على نسخة TikTok المقابلة.\n\n'+'\n\n'.join(f'## اليوم {d}\n\n{c}' for d,c in captions.items()),encoding='utf-8')
items=[]
for folder,kind in [('videos','video'),('stills','still'),('covers','cover')]:
 for p in sorted((OUT/folder).glob('*')):
  if p.suffix not in ['.png','.mp4']:continue
  day=int(re.search(r'SW-D(\d+)',p.name)[1]);items.append({'day':day,'kind':kind,'name':p.stem,'path':folder+'/'+p.name})
cards=[]
for item in sorted(items,key=lambda x:(x['day'],{'video':0,'still':1,'cover':2}[x['kind']],x['name'])):
 u=html.escape(item['path']);n=html.escape(item['name']);typ={'video':'فيديو','still':'تصميم','cover':'غلاف'}[item['kind']]
 media=f'<video controls preload="metadata" playsinline src="{u}"></video>' if item['kind']=='video' else f'<a href="{u}" target="_blank"><img loading="lazy" src="{u}" alt="{n}"></a>'
 cards.append(f'<article data-day="{item["day"]}" data-kind="{item["kind"]}"><div class="meta">اليوم {item["day"]} · {typ}</div>{media}<div class="label" dir="ltr">{n}</div><a download href="{u}">تنزيل الملف</a></article>')
page='''<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ANVIL — The Switch / Production V01</title><style>
@font-face{font-family:Cairo;src:url('source/fonts/Cairo-Regular.ttf')}@font-face{font-family:Cairo;src:url('source/fonts/Cairo-Bold.ttf');font-weight:700}*{box-sizing:border-box}body{margin:0;background:#101010;color:#fff;font:16px/1.8 Cairo,Arial,sans-serif}header,main{max-width:1400px;margin:auto;padding:32px}header{border-bottom:1px solid #333}h1{font-size:36px;margin:4px 0}p{max-width:950px;color:#ccc}.eyebrow{color:#ff6a00;font-weight:700}.filters{position:sticky;top:0;z-index:2;background:#101010ef;border-bottom:1px solid #333;padding:14px 0;display:flex;gap:9px;flex-wrap:wrap}button{font:inherit;background:#222;border:1px solid #444;color:#fff;padding:6px 16px;cursor:pointer}button.active{background:#ff6a00;color:#080808;border-color:#ff6a00}#grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:26px}article{background:#181818;border:1px solid #333;padding:12px;min-width:0}article video,article img{width:100%;height:440px;object-fit:contain;background:#080808}.meta{font-weight:700;padding-bottom:10px}.label{font:11px/1.6 monospace;color:#aaa;overflow-wrap:anywhere;margin-top:8px}a{color:#ff9957}details{padding:12px 0}summary{cursor:pointer;font-weight:700}.note{border-right:3px solid #ff6a00;padding-right:16px}footer{padding:30px;color:#aaa;text-align:center}</style>
<header><div class="eyebrow">ANVIL SUPPS / THE SWITCH</div><h1>نسخة الإنتاج الأولى</h1><p>43 ملف محتوى: 30 تصميمًا ثابتًا و13 فيديو. ومعها 11 غلافًا، ترجمة SRT، ملفات قابلة للتعديل ومسارات صوت منفصلة. اضغط على الصور لتكبيرها، وشغّل الفيديوهات من نفس الصفحة.</p><p class="note">المعالجة المنفّذة جرافيك ونصوص متحركة مع تعليق صوتي اصطناعي مصري. لا تحتوي على تصوير بشري أو توثيق عمليات. اللوجو مستخرج من المصدر الأصلي؛ استُخدم Cairo وInter. النسخة للمراجعة قبل النشر، خصوصًا نطق اسم البراند ومعاينة مواضع المنصات.</p><a href="README_AR.md">تقرير التسليم والملاحظات</a> · <a href="CAPTIONS_AR.md">الكابشن</a> · <a href="qa/static-contact-sheet.jpg">كل التصميمات</a> · <a href="qa/video-contact-sheet.jpg">معاينة الفيديوهات</a></header><main>
<div class="filters" id="days"><button class="active" data-day="all">كل الأيام</button>'''+''.join(f'<button data-day="{d}">اليوم {d}</button>' for d in range(1,8))+'''</div><div class="filters" id="types"><button class="active" data-kind="all">كل الملفات</button><button data-kind="video">الفيديوهات</button><button data-kind="still">التصميمات</button><button data-kind="cover">الأغلفة</button></div><p id="count"></p><section id="grid">'''+''.join(cards)+'''</section><section><h2>الكابشن اليومي</h2>'''+''.join(f'<details><summary>اليوم {d}</summary><p>{html.escape(c)}</p></details>' for d,c in captions.items())+'''</section></main><footer>TSST-PILOT-001 · CREATIVE production V01 · لم يتم نشر محتوى أو تشغيل إعلانات</footer><script>let day='all',kind='all';function filter(){let n=0;document.querySelectorAll('article').forEach(a=>{const show=(day==='all'||a.dataset.day===day)&&(kind==='all'||a.dataset.kind===kind);a.hidden=!show;if(show)n++});document.getElementById('count').textContent=n+' ملف معروض'}document.querySelectorAll('#days button').forEach(b=>b.onclick=()=>{day=b.dataset.day;document.querySelectorAll('#days button').forEach(x=>x.classList.toggle('active',x===b));filter()});document.querySelectorAll('#types button').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;document.querySelectorAll('#types button').forEach(x=>x.classList.toggle('active',x===b));filter()});filter();</script></html>'''
(OUT/'PREVIEW.html').write_text(page,encoding='utf-8')
print(json.dumps({'contentFiles':len([x for x in items if x['kind']!='cover']),'covers':len([x for x in items if x['kind']=='cover']),'captions':len(captions),'destination':str(OUT)}))
