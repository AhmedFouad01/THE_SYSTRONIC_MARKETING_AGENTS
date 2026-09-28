import pathlib,sys,json,os
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'speech_tools'))
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING']='1'
from faster_whisper import WhisperModel
model=WhisperModel('base',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(ROOT/'speech_models'))
result={}
for p in sorted((ROOT/'audio').glob('*.mp3')):
 segments,info=model.transcribe(str(p),language='ar',word_timestamps=True,beam_size=5,initial_prompt='شارك إكس ستور. آنفيل سبس. اسم جديد وامتداد لنفس الحكاية.')
 rows=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'start':w.start,'end':w.end,'word':w.word} for w in s.words]} for s in segments]
 result[p.stem]=rows
 (ROOT/'qa/narration_transcripts.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 print(p.stem, ' '.join(s['text'] for s in rows),flush=True)
