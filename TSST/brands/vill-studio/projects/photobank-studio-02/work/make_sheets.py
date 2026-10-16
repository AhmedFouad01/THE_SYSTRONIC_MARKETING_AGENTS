from pathlib import Path
import csv,json
from PIL import Image,ImageOps,ImageDraw
base=Path('TSST/brands/vill-studio/projects/photobank-studio-02')
raw=Path(r'G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\vill-studio\assets\source\portfolio')
rows=list(csv.DictReader(open('TSST/brands/vill-studio/assets/source/portfolio/CATALOG.csv',encoding='utf-8-sig')))
manifest=[]
for prefix in ('04-','17-','38-'):
    group=[r for r in rows if r['folder'].startswith(prefix) and Path(r['file']).suffix.lower() in ('.jpg','.jpeg','.png','.webp')]
    sheet=Image.new('RGB',(1500, ((len(group)+5)//6)*220),(245,243,238))
    d=ImageDraw.Draw(sheet)
    for i,r in enumerate(group):
        p=raw/r['folder']/r['file']
        x=(i%6)*250;y=(i//6)*220
        try:
            with Image.open(p) as im:
                t=ImageOps.contain(ImageOps.exif_transpose(im).convert('RGB'),(240,180))
                sheet.paste(t,(x+(240-t.width)//2,y))
            d.text((x+5,y+181),f'{i+1:02} {r["file"][:26]}',fill='black')
            d.text((x+5,y+198),r['piece'][:30],fill='black')
            manifest.append(dict(id=prefix[:2]+'-'+str(i+1).zfill(2),source=str(p),**r))
        except Exception as e:d.text((x+5,y+30),str(e)[:30],fill='red')
    sheet.save(base/'files'/f'candidate-{prefix[:2]}.jpg',quality=88)
    print(prefix,len(group),group[0]['folder'] if group else 'NONE')
(base/'work'/'source-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
