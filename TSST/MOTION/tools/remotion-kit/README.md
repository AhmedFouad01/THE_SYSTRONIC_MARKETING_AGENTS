# MOTION_AG Remotion kit (R53)

Status: `UNVALIDATED` tool, added 2026-11-05 under the R46 exception for R53. Reference job: [EX-MO-001](../../examples/EX-MO-001_sale-offers-40s.md).

AI makes the pictures, music and voice. This kit builds everything that must be exact in code: Arabic text (per word, RTL), prices and numbers computed from data, approved logos, transitions, captions and the audio mix (VO lines, ducked music, SFX on animation frames). One render gives the final MP4: no alpha overlays, no After Effects, no drawtext.

## When to use
- Any MOTION_AG video with on-screen Arabic, prices, a logo or a CTA (that is every ad). Skills: SK-001 (motion tokens), SK-002 (edit map), SK-003 (mix), SK-007 (text).
- The HTML capture tool in `TSST/CREATIVE/tools/code-motion/` stays for quick single-overlay tests; this kit replaces it for full builds.
- Licence: Remotion is free for individuals and companies with up to 3 employees; a bigger company needs a Remotion Company License (remotion.dev/license). Ahmed confirms which applies before client delivery.

## Start a job
1. Copy this folder into the job: `TSST/brands/<id>/projects/<job>/work/remotion/` (or the brief's work folder). Never build inside `TSST/MOTION/tools/`.
2. `npm ci` there if a `package-lock.json` is present, otherwise `npm install` (versions are pinned exactly in `package.json`; nothing installs system-wide). Node 22.
3. Put the job's files in `public/` (see `public/README.md`): fonts, approved logos, picked AI shots, VO lines, licensed music, prepared SFX.
4. Edit only `src/job/`:
   - `brand.ts` — colours, font files, safe box, caption band, `CONTACT` and `LOGOS` (pending client facts live here, once).
   - `data.ts` — every number on screen, computed from the client's data snapshot (record its sha256 in the job notes).
   - `timeline.ts` — the edit map (scenes in seconds), VO lines and leads, BPM, variants, music file + trim.
   - `scenes.tsx` — one component per scene; every move uses `src/lib/motion.ts` tokens.
   - `sfx.ts` — the cue list, one sound per visual event, on its frame.
   - `vo.json` — copy of `lines.json` from `audio/cut_vo.py`.
5. `npx tsc --noEmit`, then `npm run studio` to review in the browser.

## Commands (run in the job's kit copy)
| Step | Command |
|---|---|
| Typecheck | `npx tsc --noEmit` |
| Review stills with the safe box (any composition id) | `node scripts/stills.mjs out/stills Master-9x16-A 0.5 1 f000:0 f045:45 mid:600 end:1190` |
| Animatic (half size) | `npx remotion render src/index.ts Master-9x16-A out/animatic.mp4 --scale=0.5 --codec=h264 --crf=23` |
| Final render | `npx remotion render src/index.ts Master-9x16-A out/master.mp4 --codec=h264 --crf=17 --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=320k` |
| Loudness to -14 LUFS / ≤ -1 dBTP (video copied) | `python qa/loudness_fix.py out/master.mp4 final/<name>.mp4` |
| Audio stems for the mix check | `npx remotion render src/index.ts Master-9x16-A out/mix/vo.wav --codec=wav --props='{"variant":"A","safe":false,"stem":"vo"}'` (same for `music`, `all`) |
| Mix check | `python qa/mix_check.py out/mix` |
| Final-file check | `python qa/check_video.py final/<name>.mp4 --frames <N>` |
| Cut a TTS take into lines | `python audio/cut_vo.py take.mp3 spans.json public/audio/vo` |
| Prepare SFX | `python audio/sfx_prep.py raw-sfx/ public/audio/sfx` |
| Music tempo / first beat / structure | `python audio/music_analyze.py take.mp3` |

All Python is standard library only (works on 3.9+). ffmpeg/ffprobe are the builds that ship with Remotion (`npx remotion ffmpeg`), run from the kit root: a minimal build with no null video muxer, no rawvideo or s16le muxer, no `hstack`, `afade` or `volumedetect`; write WAV instead of raw PCM. The scripts work around this (video through `image2pipe`, audio measured with `-vn ... -f null`, fades and analysis in Python). Add `-y` to any ffmpeg call that writes, or it waits for an answer. On macOS `sed -i` needs an explicit suffix (`sed -i ''`); prefer a short Python replace that asserts the old text exists once.

## Cutdowns (15 s, 6 s, other ratios)
- Each cutdown is its own composition with its own timeline module (scene table, VO table, SFX list); scene components are shared. Keep the master's timeline untouched.
- Scene components must take their length from `useVideoConfig().durationInFrames` (e.g. the end card's 2 s hold = `durationInFrames - 2 * fps`), never from a constant tied to the master.
- Plan the cutdown scene lengths from the recorded line lengths (`lines.json` "speech"): `assertFits` stops the build when a line does not fit. If re-recording is not allowed, keep the total, re-time the scenes and report the change with numbers.
- Music for a short cut: use one of the take's natural endings (`music_analyze.py` energy bars show where it resolves) and land its final hit on the end card's hit; a back-to-back VO cut is ducked almost all the time, which is fine.
- Review stills at each scene's start + 15 frames (a scene's first frame is often the previous scene's cross-fade).

## Pass bar (from EX-MO-001, owner-accepted)
- `check_video.py`: exact frame count and duration (`loudness_fix.py` trims the audio to the picture), H.264 High yuv420p, 30/1, AAC 48 kHz stereo, faststart, -14 ±1 LUFS, true peak ≤ -1 dBTP, ≤ 2 flash-like transitions in any second, last 2 s static, frame 0 not blank.
- `mix_check.py`: VO ≥ 8 dB over the music in every speech region, no full-scale samples, no clicks.
- Eyes: stills with the safe box at 1 s, 3 s, every scene, mid, end card; every AI frame checked for fake letters; then a human listen (no tool hears pronunciation, energy or SFX taste).

## Known limits
- 9:16 only out of the box; 1:1 and 16:9 are recomposed as their own compositions (`Root.tsx`), never cropped.
- `check_video.py` cannot judge taste or Arabic; `mix_check.py` finds speech from the VO stem's level, so a breathy lead-in counts as speech (intended: the music must be down before the first sound).
- `preflight.py` runs only on the canonical Windows root; on the Mac clone it stops at the workspace check.
