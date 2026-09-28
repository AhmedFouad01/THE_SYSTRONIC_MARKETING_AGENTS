"""Reproducible local video renderer; editable JSON timelines + HTML scene masters.
Audio aligns source narration at quiet boundaries to authored scene timing.
No synthetic documentary footage. No external publication.
"""
import json,pathlib,subprocess,re,sys,wave,math,struct,itertools
ROOT=pathlib.Path(__file__).resolve().parents[1]
FF=ROOT/'tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
PLANS=json.loads((ROOT/'sources/video_timelines.json').read_text('utf-8'))
for p in ['videos','audio/stems','subtitles','qa','temp']:(ROOT/p).mkdir(parents=True,exist_ok=True)
def run(args):
 r=subprocess.run([str(FF),'-hide_banner','-y',*map(str,args)],capture_output=True,text=True,encoding='utf-8',errors='replace')
 if r.returncode: raise RuntimeError(r.stderr[-7000:])
 return r.stderr
def fmt(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
def aligned_voice(p):
 src=ROOT/'audio'/f"{p['id']}.mp3"
 stderr=run(['-i',src,'-af','silencedetect=noise=-35dB:d=0.17','-f','null','NUL'])
 m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',stderr);duration=int(m[1])*3600+int(m[2])*60+float(m[3])
 starts=[float(v) for v in re.findall(r'silence_start: ([\d.]+)',stderr)]
 ends=[float(v) for v in re.findall(r'silence_end: ([\d.]+)',stderr)]
 candidates=[(a+b)/2 for a,b in zip(starts,ends) if a>0.3 and b<duration-.3]
 # Use relative spoken-text length to choose only silence boundaries; preserve full original recording.
 lens=[len(s['subtitle'].replace('ANVIL SUPPS','آنفل سبس').replace('Shark X Store','شارك اكس ستور')) for s in p['scenes']]
 desired=[duration*sum(lens[:i])/sum(lens) for i in range(1,len(lens))]
 overrides={'SW-D03-C01':[2.85466,5.6921205,7.6885715,10.234671], 'SW-D07-C01':[2.825828,5.6004195,8.694059]}
 if p['id'] in overrides:
  boundaries=overrides[p['id']]
 elif len(candidates)>=len(desired):
  boundaries=min(itertools.combinations(candidates,len(desired)),key=lambda bs:sum((a-b)**2 for a,b in zip(bs,desired)))
 else: boundaries=desired
 bounds=[0,*boundaries,duration]
 filters=[];notes=[]
 for i,s in enumerate(p['scenes']):
  length=s['end']-s['start'];original=bounds[i+1]-bounds[i]
  tempo=max(1,original/(length-.10));notes.append({'scene':i,'sourceStart':bounds[i],'sourceEnd':bounds[i+1],'targetStart':s['start'],'targetEnd':s['end'],'atempo':tempo})
  filters.append(f'[0:a]atrim=start={bounds[i]}:end={bounds[i+1]},asetpts=PTS-STARTPTS,atempo={tempo},apad,atrim=duration={length},afade=t=in:d=0.008,afade=t=out:st={length-.025}:d=0.025[a{i}]')
 filters.append(''.join(f'[a{i}]' for i in range(len(lens)))+f'concat=n={len(lens)}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9[out]')
 target=ROOT/'audio/stems'/f"{p['id']}_voice.wav"
 run(['-i',src,'-filter_complex',';'.join(filters),'-map','[out]','-ar','48000','-ac','1',target])
 return notes
def soundbed(p):
 # Original restrained cue: low pulse and soft transient. No third-party music samples.
 sr=48000;duration=p['duration'];dest=ROOT/'audio/stems'/f"{p['id']}_music.wav"
 with wave.open(str(dest),'wb') as f:
  f.setparams((1,2,sr,0,'NONE','not compressed'))
  data=bytearray()
  for n in range(int(sr*duration)):
   t=n/sr;beat=t%2;envelope=math.exp(-beat*13);tone=math.sin(2*math.pi*(53*t))+0.25*math.sin(2*math.pi*106*t)
   fade=min(1,t/.35,max(0,(duration-t)/.6));value=.027*envelope*tone*fade
   data+=struct.pack('<h',max(-32767,min(32767,round(value*32767))))
  f.writeframes(data)
def render(p,h):
 dest=ROOT/'videos'/f"TSST-PILOT-001_{p['id']}_{'9x16' if h==1920 else '4x5'}_AR_v01.mp4"
 args=[];scenes=p['scenes'];trans=8/30
 for i,s in enumerate(scenes):args+=['-loop','1','-framerate','30','-t',s['end']-s['start']+(trans if i<len(scenes)-1 else 0),'-i',ROOT/'scenes'/f"{p['id']}_{h}_{i}.png"]
 args+=['-i',ROOT/'audio/stems'/f"{p['id']}_voice.wav",'-i',ROOT/'audio/stems'/f"{p['id']}_music.wav"]
 filters=[]
 for i in range(len(scenes)):filters.append(f'[{i}:v]format=yuv444p,setpts=PTS-STARTPTS,fps=30,settb=1/30[v{i}]')
 prev='v0'
 for i in range(1,len(scenes)):
  filters.append(f'[{prev}][v{i}]xfade=transition=wipeleft:duration={trans}:offset={scenes[i]["start"]},fps=30,settb=1/30[x{i}]');prev=f'x{i}'
 n=len(scenes);filters.append(f'[{n}:a][{n+1}:a]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.94[aout]')
 run([*args,'-filter_complex_threads','1','-filter_complex',';'.join(filters),'-map',f'[{prev}]','-map','[aout]','-t',p['duration'],'-r','30','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart','-threads','4',dest])
 print('EXPORTED',dest.name,flush=True)
 return {'file':str(dest),'width':1080,'height':h,'duration':p['duration'],'fps':30,'bytes':dest.stat().st_size}
if __name__=='__main__':
 report=[];alignment={}
 selected=PLANS if len(sys.argv)<2 else [p for p in PLANS if p['id']==sys.argv[1]]
 for p in selected:
  alignment[p['id']]=aligned_voice(p);soundbed(p)
  (ROOT/'subtitles'/f"{p['id']}.srt").write_text('\n\n'.join(f"{i+1}\n{fmt(s['start'])} --> {fmt(s['end'])}\n{s['subtitle']}" for i,s in enumerate(p['scenes']))+'\n',encoding='utf-8-sig')
  for h in ([1920,1350] if p['id'] in ['SW-D03-C01','SW-D07-C01'] else [1920]):report.append(render(p,h))
 report_path=ROOT/'qa/video_export_report.json';align_path=ROOT/'qa/audio_alignment.json'
 if len(sys.argv)>1 and report_path.exists():
  old=json.loads(report_path.read_text('utf-8'));names={r['file'] for r in report};report=[r for r in old if r['file'] not in names]+report
 if len(sys.argv)>1 and align_path.exists():
  old=json.loads(align_path.read_text('utf-8'));old.update(alignment);alignment=old
 report_path.write_text(json.dumps(report,indent=2),encoding='utf-8')
 align_path.write_text(json.dumps(alignment,indent=2),encoding='utf-8')


