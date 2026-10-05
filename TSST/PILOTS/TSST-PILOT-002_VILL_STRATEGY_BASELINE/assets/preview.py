from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
p=Path('TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/assets'); sheet=Image.new('RGB',(1440,1380),'#d0d0d0');d=ImageDraw.Draw(sheet);report=[]
for i,f in enumerate(sorted((p/'renders').glob('*.png'))):
 im=Image.open(f); im.resize((360,round(im.height/3)),Image.Resampling.LANCZOS).save(p/'qa'/f'{f.stem}-phone.png');t=im.copy();t.thumbnail((350,640));x=(i%4)*360;y=(i//4)*690;sheet.paste(t,(x,y+25));d.text((x+8,y+5),f.stem,fill='black');pixels=list(im.convert('RGB').crop((48,0,348,300)).getdata());white=sum(1 for r,g,b in pixels if r>200 and g>200 and b>200);report.append({'name':f.stem,'size':im.size,'logo_light_pixels':white});assert white>1000,(f.stem,'missing logo')
sheet.save(p/'qa/contact-sheet.png');im=Image.open(p/'renders/reel-cover.png');im.crop((0,420,1080,1500)).resize((360,360)).save(p/'qa/reel-cover-square-crop.png');im.crop((0,285,1080,1635)).resize((360,450)).save(p/'qa/reel-cover-feed-crop.png');(p/'qa/pixel-checks.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n');print(report)
