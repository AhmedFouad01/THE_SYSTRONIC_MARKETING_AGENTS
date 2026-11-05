---
name: tsst-motion-sk-006-egyptian-voice-and-audio-prompts
description: Use when an ad needs Egyptian Arabic voice-over, an A/B voice test, hook voice variants, or a rights-safe music and SFX plan.
id: TSST-MOTION-SK-006
team: motion
owner: MOTION_AG
status: UNVALIDATED
version: 0.2
trigger: Use when an ad needs Egyptian Arabic voice-over, an A/B voice test, hook voice variants, or a rights-safe music and SFX plan.
---

# TSST-MOTION-SK-006 - Egyptian Voice and Audio Prompts

Status: `UNVALIDATED` | Version 0.2 (2026-11-05) | Owner: `MOTION_AG` | Sources: LENS-MO-001 section 2, SPARK-MO-001 sections 2 and 4 (Lead-accepted); v0.2 field evidence EX-MO-001 (`TSST/MOTION/examples/EX-MO-001_sale-offers-40s.md`). Mixing and finishing: TSST-MOTION-SK-003.

## Objective
Produce a Masry voice script, the voice takes (by Ahmed, or by the runtime under his credit cap, SK-005 step 13), and a rights-safe audio plan, with no on-camera Arabic speech until proven.

## Method
1. **Script in Masry**, not Modern Standard: spoken rhythm, short lines, numbers and brand names written as spoken. Diacritics only where a word is ambiguous. Latin brand terms marked for pronunciation. Ahmed OKs the script.
2. **Fit before recording:** every line fits its scene at ~13 Arabic letters/s (natural pace of the approved voice on EX-MO-001). A line that does not fit is trimmed in the script; never sped up (take v1 needed tempo 1.08; trimming three lines gave v2 at 1.0).
3. **Voice choice:**
   - New brand: A/B before any batch: one 8-12 s Egyptian line on A: Gemini TTS (Google lists "Egyptian Arabic"; price NC) and B: ElevenLabs voice(s). Give Ahmed the files unlabelled, order randomised. **Ahmed's ear decides.** Record winner, tool, voice id, settings in the job file. Never pick by price.
   - Field result (EX-MO-001): ElevenLabs **eleven_v4** through Magnific, voice **Karim Zaidan** (Magnific voice 1334), picked by ear from 3 voices × 2 lines. A brand with an approved voice reuses it; the Gemini side of the A/B is still untested.
4. **Takes:** one take for the whole master script + one take for every cutdown line, **in the same session and voice**; re-do single lines only. Cut with `audio/cut_vo.py` (word timings from the TTS tool, snapped to silence). Word timings can be ~0.3 s off on a line: SK-003 ducks from the file start.
5. **Voice prompt:** text + style line (age, energy, pace, warmth, Cairo Egyptian). Listen at phone volume.
6. **No on-camera Arabic speech** (no visible talking mouths) until a **5 s Arabic lip-sync test** passes with native review. Sync Labs claims any language (Arabic NC); OmniHuman and Kling list no Arabic. Any spend needs Ahmed's OK. Until then: voice-over on shots without visible mouths.
7. **Hook variants:** ONE variable per variant (voice line OR on-screen text; picture locked). 3 hooks (different first 3 s) x 2 variants max. Each hook gets a one-line hypothesis and a metric fixed before launch (3-s hold / CTR). Voice variants re-render the voice only.
8. **Music and SFX rights, checked before generating:** licensed music only. Record source, licence, URL and date read per item in `audio_rights.md`. EX-MO-001: Magnific AI Products Terms (magnific.com/legal/ai-products, read 2026-11-03) §7 gives paid subscribers all rights to the output; the Lyria 3 section adds Google's terms and bans imitating a real artist → **allowed as background in a paid social ad**; no indemnity, no exclusivity. Re-read the terms per job (they change). Platform sound libraries for paid use = NC; do not assume. TTS output rights: confirm the provider's section the same way before client delivery.
9. **Music prompt:** genre, BPM matching the edit grid (120 BPM = 15 f at 30 fps), structure by time (hit, groove, breakdown under quiet scenes, natural ending at the cut length), no artist names. Two takes; SK-003 picks by measured fit.
10. **Mix intent** (handoff to SK-003): voice first, music ducked under speech, muted cut still readable through on-screen text.
11. **AI-disclosure:** AI voice/music feeds the SPARK decision (TikTok toggle ON for AI-generated media). Log it per job. No clone of a real person's voice without written consent.

## Failure patterns
MSA instead of Masry; a line that does not fit fixed by speeding the voice; A/B files labelled so Ahmed is biased; voice chosen by price; cutdown lines recorded later in another session; on-camera Arabic speech before the test; music masking speech; music generated before its terms were read; artist names in a music prompt; unlicensed track; a variant changing voice and text together; voice-over longer than the shot plan.

## Output contract
`voice_script.md`, `voice_prompts.md`, `ab_test.md` (files, winner, decider) or the reused approved voice, `audio_rights.md` (item, source, licence, URL, date read), cut lines + `lines.json`, hook table (hook, variant, variable, hypothesis, metric).

## Acceptance checks
- Script is Masry and every line fits its scene (~13 letters/s) at natural pace.
- Voice decided by Ahmed's ear (A/B recorded, or the brand's approved voice reused).
- Master and cutdown lines from the same voice and session.
- No visible-mouth Arabic shot unless a lip-sync pass is on file.
- Every audio item has a licence line written before it was generated.
- Each variant changes exactly one variable.
- Disclosure decision logged.

## Changelog
- 0.2 (2026-11-05): fit at 13 letters/s, trim-not-speed rule, field voice (eleven_v4 / Karim Zaidan), same-session cutdown lines, licence-before-generation with the Magnific/Lyria answer, music prompt rules. Material change: stays `UNVALIDATED`.
- 0.1 (2026-10-10): installed.
