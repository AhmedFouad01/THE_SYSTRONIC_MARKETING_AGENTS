# public/ — the job's assets (served with staticFile)

- `fonts/` — Alexandria (SIL OFL, `OFL.txt`) ships as the default Arabic face. Brand fonts go here after their licence is checked.
- `logos/` — approved logo files only (composited, never regenerated).
- `ai/` — AI shots picked by Ahmed (start frame + i2v take), never product images.
- `audio/vo/` — `line-XX.wav` + `lines.json` from `audio/cut_vo.py` (copy `lines.json` into `src/job/vo.json`).
- `audio/music/` — the licensed music take (licence line in the job notes before it is used).
- `audio/sfx/` — normalised SFX from `audio/sfx_prep.py`.

Client media stays on Drive (`TSST/brands/...`); a job copies what it needs into its own `work/` kit copy. Nothing in here except the fonts is committed.
