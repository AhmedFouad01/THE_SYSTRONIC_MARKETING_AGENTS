import pathlib,json,subprocess,re,hashlib
from PIL import Image,ImageDraw
ROOT=pathlib.Path(__file__).resolve().parents[1];FF=ROOT/'tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
plans={p['id']:p for p in json.loads((ROOT/'sources/video_timelines.json').read_text('utf-8'))}
report={'stills':[],'covers':[],'videos':[],'issues':[]}
for folder in ['stills','covers']:
 for p in sorted((ROOT/folder).glob('*.png')):
  with Image.open(p) as im: w,h=im.size;im.verify()
  expected=1350 if '_4x5_' in p.name else 1920
  row={'file':folder+'/'+p.name,'width':w,'height':h,'ok':w==1080 and h==expected};report[folder].append(row)
  if not row['ok']:report['issues'].append(row)
thumbs=[]
for p in sorted((ROOT/'videos').glob('*.mp4')):
 r=subprocess.run([str(FF),'-hide_banner','-i',str(p),'-f','null','NUL'],capture_output=True,text=True)
 m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',r.stderr);duration=int(m[1])*3600+int(m[2])*60+float(m[3]) if m else 0
 asset=re.search(r'(SW-D\d\d-C01(?:-TT)?)_',p.name)[1];expected=plans[asset]['duration'];h=1350 if '_4x5_' in p.name else 1920
 frames=re.findall(r'frame=\s*(\d+)',r.stderr);frames=int(frames[-1]) if frames else 0
 row={'file':'videos/'+p.name,'duration':duration,'expectedDuration':expected,'decodedFrames':frames,'expectedFrames':expected*30,'decodeExit':r.returncode,'hasH264':'h264' in r.stderr,'hasAAC':'Audio: aac' in r.stderr,'expectedSizePresent':f'1080x{h}' in r.stderr}
 row['ok']=r.returncode==0 and abs(duration-expected)<.05 and frames==expected*30 and row['hasH264'] and row['hasAAC'] and row['expectedSizePresent'];report['videos'].append(row)
 if not row['ok']:report['issues'].append(row)
 thumb=ROOT/'qa'/f'{p.stem}_frame.png';subprocess.run([str(FF),'-hide_banner','-loglevel','error','-y','-ss','1','-i',str(p),'-frames:v','1',str(thumb)],check=True);thumbs.append((thumb,p.name))
 print('CHECKED',p.name,row['ok'],flush=True)
canvas=Image.new('RGB',(1500,math_h:=((len(thumbs)+4)//5)*570),(25,25,25));draw=ImageDraw.Draw(canvas)
for i,(p,name) in enumerate(thumbs):
 im=Image.open(p).convert('RGB');im.thumbnail((270,500));x=(i%5)*300+(300-im.width)//2;y=(i//5)*570;canvas.paste(im,(x,y));draw.text(((i%5)*300+10,y+510),name.replace('TSST-PILOT-001_','')[:34],fill='white')
canvas.save(ROOT/'qa/video-contact-sheet.jpg',quality=92)
(ROOT/'qa/media_checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'stills':len(report['stills']),'covers':len(report['covers']),'videos':len(report['videos']),'issues':report['issues']}))
