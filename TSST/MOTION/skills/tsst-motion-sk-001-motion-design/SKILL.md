---
name: tsst-motion-sk-001-motion-design
description: Animate brand/typographic/graphic systems with intentional timing, easing, hierarchy and narrative function.
version: 0.2
---

# TSST-MOTION-SK-001 — Motion Design

Status: `UNVALIDATED` | Version 0.2 (2026-11-05, field lessons from EX-MO-001)  
Training installed: 2026-09-24  
Owner: `MOTION_AG`  
Formerly TSST-CREATIVE-SK-015 (moved to the Motion AG team, TSST-ADR-005, 2026-10-11)

## Objective

Animate brand/typographic/graphic systems with intentional timing, easing, hierarchy and narrative function.

## Source / provenance

Adobe After Effects official keyframe/animation principles + professional motion-graphics practice. v0.2: the owner-approved motion spec of EX-MO-001 (`TSST/MOTION/examples/EX-MO-001_sale-offers-40s.md`), built in code per R53.

## Required method

1. Define what changes over time and why before choosing effects.
2. **One tokens file decides every move** (`TSST/MOTION/tools/remotion-kit/src/lib/motion.ts`, table below). Scene code never writes its own bezier, duration or spring; a new need = a new token, named, in that file.
3. Animate hierarchy: primary information moves/appears first, support second, signature last. Arabic enters **per word in RTL reading order** (right-most word first, 3 f apart, 2 f for lines over 3 words), never per letter. Every line has settled within ~0.5 s and then **holds still** while it is read.
4. **Text never rides a camera move.** Zoom, push or shake only the picture; text sits outside that container or inside `<Steady>` (counter-scale). Big scale moves belong to the opener only.
5. **Entrances land on the beat.** Measure the music first (`audio/music_analyze.py`), then BEAT = fps × 60 / BPM (15 f at 120 BPM, 30 fps); key hits (price stamp, badge, CTA button) go on beat frames.
6. Use masks, scale, position, opacity and transforms as compositional tools, not random decoration.
7. **Photosensitivity:** no white flashes; never more than 2 flash-like transitions (mean-luma jump ≥ 20%) in any second. `qa/check_video.py` counts them.
8. Inspect motion at normal playback speed and on a phone-sized frame; stills with the safe box at the hook, every scene and the end card.

## Motion tokens (EX-MO-001, owner-approved; frames at 30 fps)

| Token | Value | Use |
|---|---|---|
| ENTER | bezier(0.16, 1, 0.3, 1), 12 f (headline 14 f) | every text entrance; move and fade start on the same frame |
| FADE_IN | ease-out cubic, 7 f | opacity with ENTER |
| EXIT | bezier(0.7, 0, 0.84, 0), 7 f | always faster than the entrance; or a hard cut on the beat |
| strike | ENTER, 6 f | price strike-through draws in |
| caption | FADE_IN + 16 px rise, 8 f | burned-in captions; no scale, no bounce |
| distance | 28 px body, 56 px headline, 16 px caption | small moves only |
| scale from | 0.92 | scale-in elements |
| stagger | 3 f (2 f over 3 words) | between words/lines, RTL order |
| SNAP spring | damping 20, stiffness 240, mass 0.6 | badges, buttons (~3–5% overshoot) |
| STAMP spring | damping 14, stiffness 260, mass 0.6 | the new price (one overshoot, settled ~12 f) |

## Field lessons (EX-MO-001, 2026-11-03)

- **Direction pack before spending:** 3 directions × (5 s hook + 3 stills) at 0 credits; the owner picked a mix (A base, B opening/wall/end card). Cheap to make in code, saves a full rebuild.
- **Before/after clip** when the motion spec changes (hand-tuned vs tokens, side by side). The owner judged motion from it, not from a description.
- **Hook timing:** brand/logo visible from frame 0; frames 0–14 slam (logo + max discount), hard cut; the hero price landed by 2.0 s and its badge by 2.4 s.
- **End card:** everything freezes for the last 2 s (`f = min(f, still)`). A looping pulse must stop on its rest value: EX-MO-001's CTA pulse stopped mid-swing (one-frame jump at 38.0 s, minor).
- RTL scene transitions: the next scene comes in from the left (the way the Arabic reader's eye moves on).

## Failure patterns

- every element flying in independently
- default presets used as the concept; easing hand-written per scene instead of tokens
- logo animation longer than the message
- motion too fast to read Arabic; per-letter Arabic animation
- text riding a camera push or shake
- constant movement that competes with the focal point; a flash on every beat

## References (distilled from GEM-CR-002, 2026-10-08; unvalidated)

- `ref/principles.md` — 12 principles for motion graphics/UI, duration tokens, productive vs expressive, reduced motion, Arabic reading time.
- `ref/easing.md` — master easing table (CSS/GSAP/Motion), spot-test errors, Elastic/Bounce, springs.
- `ref/web.md` — web motion libraries, licences (GSAP, Remotion), performance, Arabic text animation rule.
- `ref/after-effects.md` — history only: After Effects is not used (R53).
- `ref/code-motion.md` — HTML capture for quick single-overlay tests; full builds use the Remotion kit (`TSST/MOTION/tools/remotion-kit/README.md`).

## Practical evaluation

Build an 8–12 second branded motion reveal in the Remotion kit with a clear visual mechanism, readable bilingual type and token-only easing; pass `qa/check_video.py`; inspect rendered key frames and full playback.

## Validation rule

Package installation and study do not validate the skill. Validation requires actual evidence appropriate to the medium. Render-dependent skills cannot pass on briefs, prompts, HTML previews or unrendered storyboards alone.

## Changelog

- 0.2 (2026-11-05): tokens table, per-word RTL, text-never-in-camera-move, beat grid, flash limit, field lessons from EX-MO-001; AE ref marked history (R53). Material change: stays `UNVALIDATED`.
- 0.1 (2026-09-24): installed.
