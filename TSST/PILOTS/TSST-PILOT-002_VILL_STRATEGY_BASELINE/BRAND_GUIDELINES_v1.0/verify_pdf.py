from pathlib import Path
import json,hashlib
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image,ImageDraw
p=Path('TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0');f=p/'VILL_Brand_Guidelines_v1.0.pdf';r=PdfReader(str(f));assert len(r.pages)==24
pdf=pdfium.PdfDocument(str(f));report=[]
for i in range(len(pdf)):
 pg=pdf[i];im=pg.render(scale=4/3).to_pil().convert('RGB');im.save(p/'qa/pdf-pages'/f'{i+1:02d}.png');text=r.pages[i].extract_text();report.append({'page':i+1,'points':[float(r.pages[i].mediabox.width),float(r.pages[i].mediabox.height)],'raster_px':im.size,'text_characters':len(text),'arabic_present':any('\u0600'<=c<='\u06ff' for c in text)});assert im.size==(1920,1080) and len(text)>100
(p/'qa/pdf-checks.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
for b in range(4):
 sheet=Image.new('RGB',(1440,900),'#C3C3D0');d=ImageDraw.Draw(sheet)
 for j in range(6):
  idx=b*6+j;im=Image.open(p/'qa/pdf-pages'/f'{idx+1:02d}.png').resize((500,281));x=j%2*720;y=j//2*300;sheet.paste(im,(x,y+18));d.text((x,y),str(idx+1),fill='#040136')
 sheet.save(p/'qa'/f'pdf-contact-{b+1}.png')
print('24-page PDF verified and rasterized; Arabic extractable on',sum(x['arabic_present'] for x in report),'pages.')
