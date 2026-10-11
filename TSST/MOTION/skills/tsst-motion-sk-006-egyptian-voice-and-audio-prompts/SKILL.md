---
name: tsst-motion-sk-006-egyptian-voice-and-audio-prompts
description: Use when an ad needs Egyptian Arabic voice-over, an A/B voice test, hook voice variants, or a rights-safe music and SFX plan.
id: TSST-MOTION-SK-006
team: motion
owner: MOTION_AG
status: UNVALIDATED
version: 0.1
trigger: Use when an ad needs Egyptian Arabic voice-over, an A/B voice test, hook voice variants, or a rights-safe music and SFX plan.
---

# TSST-MOTION-SK-006 - Egyptian Voice and Audio Prompts

Status: `UNVALIDATED` | Owner: `MOTION_AG` | Sources: LENS-MO-001 section 2, SPARK-MO-001 sections 2 and 4 (Lead-accepted). Mixing and finishing: TSST-MOTION-SK-003.

## Objective
Produce a Masry voice script, voice prompts for Ahmed to render, and a rights-safe audio plan, with no on-camera Arabic speech until proven.

## Method
1. **Script in Masry**, not Modern Standard: spoken rhythm, short lines, numbers and brand names written as spoken. Diacritics only where a word is ambiguous. Latin brand terms marked for pronunciation. Ahmed OKs the script.
2. **A/B voice test** before any batch: one 8-12 s Egyptian line rendered on
   - A: Gemini TTS (gemini-3.8-flash-tts / flash-lite-tts). Google docs list "Egyptian Arabic": the only official Egyptian claim found. Price NC.
   - B: ElevenLabs Voice Library voice with accent "Egypt". Egyptian is not in the model docs (blog only), voice names unconfirmed. List $0.08/1K chars (v3), $0.04 Flash. Commercial TTS terms NC.
   Give Ahmed both files unlabelled, order randomised. **Ahmed's ear decides.** Record winner, tool, voice id, settings in the job file. Never pick by price.
3. **Voice prompt:** text + style line (age, energy, pace, warmth, Cairo Egyptian), one take set, up to 2 retakes. Listen at phone volume.
4. **No on-camera Arabic speech** (no visible talking mouths) until a **5 s Arabic lip-sync test** passes with native review. Sync Labs claims any language (Arabic NC); OmniHuman and Kling list no Arabic. Run it as a side check on a free trial; any spend needs Ahmed's OK. Until then: voice-over on shots without visible mouths.
5. **Hook variants:** ONE variable per variant (voice line OR on-screen text; picture locked). 3 hooks (different first 3 s) x 2 variants max. Each hook gets a one-line hypothesis and a metric fixed before launch (3-s hold / CTR). Voice variants re-render the voice only.
6. **Music and SFX rights:** licensed music only. Record source, licence and file per item in the job file. No ripped or unlicensed audio in paid ads. Whether platform sound libraries cover paid use = NC; do not assume. Veo native ambient audio is part of its output. Output rights for ElevenLabs/Gemini TTS = NC: confirm in the account terms before client delivery.
7. **Mix intent** (handoff to SK-003): voice first, music ducked under speech, muted cut still readable through overlay text (Meta sound is on by default but not guaranteed; TikTok "must have sound" = NC, so keep a voice anyway).
8. **AI-disclosure:** AI or cloned voice feeds the SPARK step 7 decision (TikTok toggle ON for AI-generated media). Log it per job. No clone of a real person's voice without written consent.

## Failure patterns
MSA instead of Masry; A/B files labelled so Ahmed is biased; voice chosen by price; on-camera Arabic speech before the test; music masking speech; unlicensed track; a variant changing voice and text together; voice-over longer than the shot plan.

## Output contract
`voice_script.md`, `voice_prompts.md`, `ab_test.md` (files, winner, decider), `audio_rights.md` (item, source, licence), hook table (hook, variant, variable, hypothesis, metric).

## Acceptance checks
- Script is Masry and fits the cut length (about 2.5 words/s, estimate).
- A/B uses both tools, the same line, with Ahmed's decision recorded.
- No visible-mouth Arabic shot unless a lip-sync pass is on file.
- Every audio item has a licence line.
- Each variant changes exactly one variable.
- Disclosure decision logged.
