---
name: tsst-motion-sk-002-short-form-video-editing
description: Edit Reels/TikTok/short video with strong opening, beat structure, shot purpose, pacing, captions and platform-native visual behavior.
version: 0.3
---

# TSST-MOTION-SK-002 — Short-form Video Editing

Status: `UNVALIDATED` | Version 0.3 (2026-11-05, EX-MO-001 + practice run MOTION-TRAIN-001)  
Training installed: 2026-09-24  
Owner: `MOTION_AG`  
Formerly TSST-CREATIVE-SK-016 (moved to the Motion AG team, TSST-ADR-005, 2026-10-11)

## Objective

Edit Reels/TikTok/short video with strong opening, beat structure, shot purpose, pacing, captions and platform-native visual behavior.

## Source / provenance

Adobe Premiere official editing/export workflow + TikTok official vertical/native creative guidance. v0.2: EX-MO-001 (40 s sale ad, owner-accepted checkpoint, `TSST/MOTION/examples/EX-MO-001_sale-offers-40s.md`).

## Required method

1. Write an edit map: hook, proof/context, reveal/value, memory/CTA. In the kit it is `src/job/timeline.ts`: one scene table in seconds, one place; the total is asserted (e.g. 1200 f = 40.0 s).
2. **Order of work, stop at each gate:** plan (scene plan + execution plan, every number and VO line checked by a script) → direction pack (0 credits) → animatic at 540×960 with temp VO and a code beat bed (0 credits) → Ahmed review → final assets (SK-005/006) → master render → checkpoint report → **stop** → cutdowns only after Ahmed approves the master.
3. Choose cuts from action, gaze, beat, information change or emotional shift—not arbitrary timer intervals. Cuts and key hits sit on the music's beat grid (SK-001).
4. **VO drives the timing.** Each VO line belongs to one scene; speech starts at max(scene cut + lead, previous line end + 6 f); a line that runs past its scene is fixed in the script, not by speeding the voice. Fit check: ~13 Arabic letters per second for the approved Masry voice (measured on EX-MO-001; replaces the 2.5 words/s estimate).
5. Keep the first seconds immediately understandable while preserving intrigue: brand from frame 0, the strongest number landed by 2 s.
6. Use B-roll/detail/scale changes to create rhythm and hide cuts; do not rely on static slide sequences. AI shots carry a scene only when they serve the message (EX-MO-001: one 3 s studio shot under the brand line), never as filler.
7. **Captions** only on the scenes the plan names (EX-MO-001: 5 of 12), timed from the VO line (start at the first word, out with an EXIT fade); none on an end card that carries its own text. When an older plan table disagrees with a later caption decision, the later decision wins (MOTION-TRAIN-001's brief copied an end-card caption from a plan written before that decision).
8. **Variants are full renders.** A variant changes one scene or one variable (SK-006) and is exported as its own full-length file for its own ad set (EX-MO-001: scene 11 A = landing page, B = Click-to-WhatsApp).
9. **Cutdowns** (15 s, 6 s, 1:1, 16:9) are recomposed from the approved master as their own compositions with their own timeline, never cropped; their extra VO lines are recorded in the same session and voice as the master. **Plan the cutdown's scene lengths from the recorded lines** (`lines.json` speech + lead); the kit's `assertFits` stops the build when a line does not fit. If lines do not fit the planned scenes and re-recording is not allowed: keep the total, re-time the scenes, and report the change with numbers for Ahmed (MOTION-TRAIN-001: DM-01 2.0→3.0 s, wall 2.0→2.5 s, end card 4.5→3.0 s).
10. Render and review the final piece muted and with sound; review stills at each scene's start + 15 f (the first frame is often still the previous scene's cross-fade); run `qa/check_video.py` and `qa/mix_check.py`; send a checkpoint (files, stills with safe box, contact sheet, notes with credits per item, take choices, QA results) and stop.

## Failure patterns

- slideshow of near-identical cards
- opening logo before any viewer value (a logo + the offer in frame 0 is value; a logo sting alone is not)
- repeated same-duration cuts with no rhythm
- text too dense for viewing time; a VO line spilling into the next scene
- cross-platform watermarks and unsafe UI placement (check the placement's safe box, SK-007)
- cutdowns cropped from the master; cutdown VO recorded later in another session/voice
- spending credits before the animatic is approved

## References (distilled from GEM-CR-004, 2026-10-08; unvalidated)

- `ref/cuts-rhythm.md` - cut types, shot-length norms (unconfirmed), BPM-to-frames table, Murch rule of six, finishing order with gates.
- `ref/shot-grammar.md` - shot sizes, angles, camera moves, sequencing, 180 deg rule, LENS beat to shot-list row.
- Kit: `TSST/MOTION/tools/remotion-kit/README.md` (render, stills, QA commands).

## Practical evaluation

Edit a 15–20s short in the Remotion kit from mixed footage/stills/AI shots into a native vertical story with a distinct first-3-second hook, VO-driven timing and a final rendered video that passes `qa/check_video.py`.

## Validation rule

Package installation and study do not validate the skill. Validation requires actual evidence appropriate to the medium. Render-dependent skills cannot pass on briefs, prompts, HTML previews or unrendered storyboards alone.

## Changelog

- 0.3 (2026-11-05): cutdown fit rule (plan from recorded lines, re-time and report), later caption decision wins over an older plan, stills at scene start + 15 f. From MOTION-TRAIN-001 friction. Stays `UNVALIDATED`.
- 0.2 (2026-11-05): gated order of work, VO-driven timing (13 letters/s), captions by plan, variants as full renders, cutdown rules, checkpoint-and-stop; kit commands. Material change: stays `UNVALIDATED`.
- 0.1 (2026-09-24): installed.
