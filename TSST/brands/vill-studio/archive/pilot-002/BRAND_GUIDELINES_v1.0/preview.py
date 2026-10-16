from pathlib import Path
from PIL import Image,ImageDraw
import json
p=Path('TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0');files=sorted((p/'renders').glob('*.png'))
for batch in range(4):
 fs=files[batch*6:(batch+1)*6];sheet=Image.new('RGB',(1440,900),'#C3C3D0');d=ImageDraw.Draw(sheet)
 for i,f in enumerate(fs):
  im=Image.open(f);im.thumbnail((700,394));x=i%2*720;y=i//2*300;im.resize((500,281)).save(p/'qa'/f'{f.stem}-review.png');sheet.paste(im.resize((500,281)),(x,y+18));d.text((x,y),f.stem,fill='#040136')
 sheet.save(p/'qa'/f'contact-{batch+1}.png')
for f in (p/'applications').glob('*.png'):
 im=Image.open(f);im.resize((360,round(im.height/3))).save(p/'qa'/f'{f.stem}-phone.png')
print('Contact sheets created.')

strip=Image.new('RGB',(1920,1710),'#C3C3D0');d=ImageDraw.Draw(strip)
for i,n in enumerate(['01-cover','06-language','15-graphic-device']):
 for j,folder in enumerate(['qa/before','renders']):
  im=Image.open(p/folder/f'{n}.png').resize((940,529));strip.paste(im,(j*960,i*570+25));d.text((j*960,i*570+4),n+(' / BEFORE' if j==0 else ' / AFTER'),fill='#040136')
strip.save(p/'qa/before-after-three.png')
im=Image.open(p/'applications/avatar.png').convert('RGBA');mask=Image.new('L',im.size,0);ImageDraw.Draw(mask).ellipse((0,0,1080,1080),fill=255);im.putalpha(mask);im.resize((360,360)).save(p/'qa/avatar-circle.png')
im=Image.open(p/'applications/story-cover.png');im.crop((0,420,1080,1500)).resize((360,360)).save(p/'qa/story-square.png');im.crop((0,285,1080,1635)).resize((360,450)).save(p/'qa/story-feed.png')
