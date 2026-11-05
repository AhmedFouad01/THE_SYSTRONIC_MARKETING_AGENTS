---
name: tsst-motion-sk-005-ai-shot-list-and-prompts
description: Use when a LENS story must become an Egyptian script, JSON shot list, master frames and image-to-video prompts for AI generation (manual by Ahmed, or by the runtime under Ahmed's credit cap), with one credit quote.
id: TSST-MOTION-SK-005
team: motion
owner: MOTION_AG
status: UNVALIDATED
version: 0.2
trigger: Use when a LENS story must become an Egyptian script, JSON shot list, master frames and image-to-video prompts for AI generation (manual by Ahmed, or by the runtime under Ahmed's credit cap), with one credit quote.
---

# TSST-MOTION-SK-005 - AI Shot List and Prompts

Status: `UNVALIDATED` | Version 0.2 (2026-11-05) | Owner: `MOTION_AG` | Sources: LENS-MO-001, SPARK-MO-001 (Lead-accepted 2026-10-10); v0.2 field evidence EX-MO-001 (`TSST/MOTION/examples/EX-MO-001_sale-offers-40s.md`). NC = not confirmed, T = charged on Ahmed's account.

## Objective
Turn an approved LENS story into an AI shot pack: script, shot JSON, master frames, image-to-video prompts, one credit quote, then the picked takes. AI makes pictures only; text, numbers, logos and transitions are built in code (R53, SK-007). PREVIS until render QA.

## Triggers
New ad/teaser/reel job after the LENS story (angle, proof, hook options). Not for voice (SK-006), on-screen text (SK-007), edit (SK-002).

## Method
1. **Intake gate:** LENS story, market EG, placements, length set (6/15/30/40 s). No story -> hand back to LENS.
2. **Egyptian script (Masry):** one line per beat, fit checked against the scene (~13 Arabic letters/s, SK-002). Ahmed OKs the script before step 3. Voice rules: SK-006.
3. **Decide what AI makes.** AI is for what has no product and no text: empty sets, studios, textures, atmosphere, people when allowed (step 10). **Products appear only as the client's approved product photos** (edited by Ahmed in ChatGPT when needed, R54); MOTION's image/video models never generate, re-render or "enhance" a product. Printed prices/stickers on product photos are covered by a code-drawn sticker at the measured position (SK-007), never repainted.
4. **JSON shot list**, one object per shot:
   `{"id","beat","subject","camera","light","action","negatives","duration_s","ratio":"9:16","master_frame","model","text_overlay_ref"}`
   Each shot has a purpose (hook / proof / reveal / CTA) and a visual event in its first seconds.
5. **Durations:** Veo clips are 4, 6 or 8 s only; 1080p needs 8 s. Kling 3.0 (Magnific) gives 5 s at 1080p. Plan the usable middle: EX-MO-001 used 1.0–4.3 s of a 5 s take (the first second settles, the end can drift).
6. **Master frame per subject:** build a **style reference from the campaign's own pixels** (background colour + textures, no product, no text); generate 3 still variations; pick the cleanest (no halos, no smeared texture, no pseudo-letters); Ahmed approves. Every shot of that subject starts from it (image-to-video). Frame prompts contain no Arabic text and no logo.
7. **Image-to-video prompt** per shot: frame ref + one camera move + one action + light + negatives. Standing negatives: text, letters, logo, watermark, distorted hands, children, new objects appearing. Make the two takes differ by camera move (EX-MO-001: dolly forward vs slow push-in) so the pick is a real choice.
8. **Review every take frame by frame** (`video_view_frames` or extracted frames): fake letters, warping, objects appearing, colour drift. Keep the runner-up take in the job's `ai/` folder.
9. **Model pick:**

| Need | Model | Note |
|---|---|---|
| proven i2v for sets/studios | Kling 3.0 (Magnific) | 5 s 1080p 9:16, 450 credits/take (T 2026-11-03), owner-accepted on EX-MO-001 |
| start frames | Nano Banana 2.1 (Magnific) 2k | 65 credits/image (T); takes a style reference |
| cheapest tests, quota only | Veo 3.1 Lite | 720p, "limited trial", quality unproven |
| default with native audio | Veo 3.1 Fast | list $0.12/s; verify credits in Ahmed's account |
| refs / audio control | Seedance 2.5 | needs Ahmed's OK per job (not approved on EX-MO-001); $/s NC |

   Run the same frames and shot JSON on two models only for a pilot or A/B.
10. **MENA rule:** adult people only (Veo `allow_adult` in MENA). Never prompt children, including family scenes. Real person or public figure = written consent, else stop.
11. **Locked-video variants:** lock the picture after Ahmed picks takes. A hook variant changes ONE variable (voice OR text) on the same picture; 3 hooks x 2 variants = 6 per platform max. Name per SPARK: `CLIENT_CAMPAIGN_CONCEPT_HOOK_VAR_DUR_RATIO_LANG_TOOL_AI_Rn`.
12. **One credit quote** per job: shots x takes x per-take rate + stills + music + voice + SFX. Rates seen 2026-11-03 (T): Kling 3.0 450/take, Nano Banana 2.1 65/image, Lyria 3 Pro 160/take, eleven_v4 TTS ~130 per 40 s script and 40 for four short lines, SFX ~7/effect. EX-MO-001 actual: 1,550 credits for the final-assets phase (2 Kling + 3 stills + 2 music + cutdown VO + 13 SFX). Unknown rates stay NC. Quote once per job, not per retry.
13. **Who generates:** by default Ahmed, by hand, from the prompt pack. The runtime generates itself only when Ahmed's OK in chat gives this job a credit cap and the Magnific connector is attached; then: `simulate_cost` before every call, one log row per creation (id, model, credits), a heads-up at 75% of the cap, never past it, and at the end the log total compared with the account balance drop (EX-MO-001: log 1,550 vs balance -2,210 on a shared account; report the gap, never absorb it).

## Failure patterns
Static-card slideshow; 5 s clips on Veo; no first-seconds event; Arabic or logo inside a generated frame; **AI on product images**; product colour drift between shots; generated children; no master frame; style reference with text or product in it; one take only or two takes with the same move; takes not reviewed frame by frame; generation without a cap or a log; two quotes or unlabelled prices; prompts called final video.

## Output contract
`script.md` (Masry + English gloss), `shots.json`, `frames_prompts.md`, `shot_prompts.md`, `quote.md`, `credits.md` (log per creation, when the runtime generates), picked takes + runner-ups in `ai/`, handoff note. Readiness `NOT_READY` until render QA and CREATIVE brand check.

## Acceptance checks
- No AI on product pixels; every AI shot has no product and no text.
- Every shot: duration valid for its model, ratio 9:16.
- Each recurring subject has one master frame (from a text-free style reference); negatives on all prompts.
- No Arabic/logo text and no children in any prompt.
- Every take reviewed frame by frame; runner-up kept.
- Quote has formula, source labels, one total; when the runtime generated, the log total and the balance check are reported.
- Ahmed checkpoints listed: script OK, frames OK, take pick.

## Handoffs
LENS story in; SK-006 voice; SK-007 text; SK-002 edit; CREATIVE brand check; SPARK specs and AI-disclosure.

## Changelog
- 0.2 (2026-11-05): R53 split (AI pictures only, no AI on product), style reference from campaign pixels, Kling 3.0 / Nano Banana 2.1 rows with charged rates, frame-by-frame take review, runtime generation under a cap with a credit log. Material change: stays `UNVALIDATED`.
- 0.1 (2026-10-10): installed.
