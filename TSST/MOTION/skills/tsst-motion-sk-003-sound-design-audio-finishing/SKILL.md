---
name: tsst-motion-sk-003-sound-design-audio-finishing
description: Use voice, music, ambience and SFX to create clarity, rhythm and brand feel without masking the message or violating rights.
version: 0.3
---

# TSST-MOTION-SK-003 — Sound Design & Audio Finishing

Status: `UNVALIDATED` | Version 0.3 (2026-11-05, EX-MO-001 + practice run MOTION-TRAIN-001)  
Training installed: 2026-09-24  
Owner: `MOTION_AG`  
Formerly TSST-CREATIVE-SK-017 (moved to the Motion AG team, TSST-ADR-005, 2026-10-11)

## Objective

Use voice, music, ambience and SFX to create clarity, rhythm and brand feel without masking the message or violating rights.

## Source / provenance

Adobe Premiere official audio/mixing guidance + platform commercial-audio rights rules. v0.2: measured mix of EX-MO-001 (`TSST/MOTION/examples/EX-MO-001_sale-offers-40s.md`); tools in `TSST/MOTION/tools/remotion-kit/` (`audio/`, `qa/`).

## Required method

1. **Voice first.** One TTS take for the whole script, cut into one file per line at the quietest 20 ms between lines with 10 ms fades (`audio/cut_vo.py`). Re-do single lines only.
2. **Music fitted to the edit:** measure tempo, first-beat offset and energy per 2 s bar (`audio/music_analyze.py`); trim the offset so beats land on the frame grid; pick the take whose structure fits the edit map (quiet part under the quiet scenes, ending on the last frame). A take shorter than the cut is out. **Short cuts (15 s, 6 s):** use one of the take's natural endings (where the energy bars resolve) and line its final hit up with the end card's hit, instead of fading a middle section; when VO lines run back to back the music is ducked almost the whole time, which is fine (MOTION-TRAIN-001: take trimmed from 47.10 s so its last hit lands on the end-card button).
3. **Duck the music under every VO line, measured, not by ear.** Working values (EX-MO-001): music 0.5, duck 0.08 (~16 dB), smoothed over 9 f so it never pumps, faded over the last 12 f. Start the duck 4 f before the line's **file** starts, not at its scheduled first word: TTS word timings can be ~0.3 s late (EX-MO-001 line 4 began under unducked music and a beat hit).
4. **SFX on visual events only:** one sound per event type (impact, whoosh, swish, crack, stamp, pop, tick, tap, message, ching, riser, shimmer, flip), two variations for repeated ones; normalise them (`audio/sfx_prep.py`: onset trimmed, peak -6 dBFS) so each transient lands on its animation frame; cue list in `src/job/sfx.ts`, volumes 0.3–0.9, the heaviest hit on the biggest visual beat. "Nothing in the last 2 s" = no SFX onset inside the end-card hold and every tail faded out before the hold starts (SFX files ring 1–2 s).
5. **Measure the mix on stems** (render `stem` = vo / music / all as WAV; `qa/mix_check.py`): VO ≥ 8 dB over the music in every speech region, no full-scale samples, no clicks.
6. **Loudness:** -14 LUFS integrated (±1), true peak ≤ -1 dBTP. Two-pass loudnorm in linear mode aiming at -1.5 dBTP so the AAC encode stays under -1, with the picture copied and the audio cut to the picture's exact length (`qa/loudness_fix.py`; without the cut the AAC padding made a 15 s file 15.1 s long); confirm with `qa/check_video.py`.
7. Confirm music/SFX licensing for the actual target platform and paid/organic use, **before generating** (SK-006 step 6).
8. **Human listen** before release: tools measure levels; they do not hear pronunciation, energy, or whether an SFX is tasteful.

## Field lessons (EX-MO-001)

- First mix at duck 0.24 gave the VO only +1 to +4 dB over the music; it sounded "fine" on laptop speakers. Measuring caught it; duck 0.08 gave +8.2 to +18.8 dB.
- A schedule-based check measured from the scheduled first word and missed the late-onset line; the kit's check finds speech in the VO stem itself.
- Remotion's bundled ffmpeg has no `afade`, `volumedetect` or null video muxer: fades and analysis run in Python; loudness is measured audio-only (`-vn -f null`).

## Failure patterns

- music louder than speech; duck set by ear
- SFX on every transition; SFX in the end-card hold
- copyright status assumed from availability
- abrupt audio cuts; VO cut on word timings without snapping to silence
- same audio bed pasted across pieces with different pacing
- loudness normalised by re-encoding the picture

## Practical evaluation

Mix a 15–20s short with voice + music + 3–5 purposeful SFX in the Remotion kit; pass `qa/mix_check.py` and the loudness lines of `qa/check_video.py`; deliver a rights/level QA note.

## Validation rule

Package installation and study do not validate the skill. Validation requires actual evidence appropriate to the medium. Render-dependent skills cannot pass on briefs, prompts, HTML previews or unrendered storyboards alone.

## Changelog

- 0.3 (2026-11-05): short-cut music rule (natural ending on the end-card hit), definition of the SFX-free hold, loudness output cut to the picture. From MOTION-TRAIN-001 friction. Stays `UNVALIDATED`.
- 0.2 (2026-11-05): measured targets (VO ≥ 8 dB, -14 LUFS, ≤ -1 dBTP), duck from file start, music fitting, SFX prep and cueing, stems QA, kit tools. Material change: stays `UNVALIDATED`.
- 0.1 (2026-09-24): installed.
