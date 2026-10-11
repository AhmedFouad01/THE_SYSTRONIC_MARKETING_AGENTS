---
name: tsst-motion-sk-005-ai-shot-list-and-prompts
description: Use when a LENS story must become an Egyptian script, JSON shot list, master frames and image-to-video prompts for manual generation by Ahmed, with one credit quote.
id: TSST-MOTION-SK-005
team: motion
owner: MOTION_AG
status: UNVALIDATED
version: 0.1
trigger: Use when a LENS story must become an Egyptian script, JSON shot list, master frames and image-to-video prompts for manual generation by Ahmed, with one credit quote.
---

# TSST-MOTION-SK-005 - AI Shot List and Prompts

Status: `UNVALIDATED` | Owner: `MOTION_AG` | Sources: LENS-MO-001, SPARK-MO-001 (Lead-accepted 2026-10-10). NC = not confirmed.

## Objective
Turn an approved LENS story into a prompt pack Ahmed can run by hand: script, shot JSON, master frames, image-to-video prompts, one credit quote. PREVIS only; final video needs render QA.

## Triggers
New ad/teaser/reel job after the LENS story (angle, proof, hook options). Not for voice (SK-006), overlay text (SK-007), edit (SK-002).

## Method
1. **Intake gate:** LENS story, market EG, placements, length set (6/15/30 s). No story -> hand back to LENS.
2. **Egyptian script (Masry):** one line per beat, length checked against the cut (about 2.5 words/s, estimate). Ahmed OKs the script before step 3. Voice rules: SK-006.
3. **JSON shot list**, one object per shot:
   `{"id","beat","subject","camera","light","action","negatives","duration_s","ratio":"9:16","master_frame","model","text_overlay_ref"}`
   Each shot has a purpose (hook / proof / reveal / CTA) and a visual event in its first seconds.
4. **Durations:** Veo clips are 4, 6 or 8 s only. 1080p needs 8 s (Lite/Fast default to 720p). Plan 15 s as 4+4+8 or 6+6+4 and trim in edit; never 3x5 s.
5. **Master frame per subject:** one approved still per recurring subject/product (identity, colour, wardrobe, set). Every shot of that subject starts from it (image-to-video). Ahmed approves frames before shot prompts are final. Frame prompts contain no Arabic text and no logo.
6. **Image-to-video prompt** per shot: frame ref + one camera move + one action + light + ambient audio note + negatives. Standing negatives: text, letters, logo, watermark, distorted hands, children.
7. **Model pick** (default Veo 3.1 Fast; Veo 3.1 IDs are Preview, recheck before each batch):

| Need | Model | Note |
|---|---|---|
| cheapest tests, quota only | Veo 3.1 Lite | 720p, "limited trial", quality unproven |
| default final, native audio | Veo 3.1 Fast | list $0.12/s; credits per gen disagree between Google pages, verify in Ahmed's account |
| refs / audio control | Seedance 2.5 | image+video+audio refs; official $/s NC |
| extra silent clips, cheap | Kling (2.5 via Magnific, 3.0) | official $ NC; paid plans allow commercial use |

   Run the same frames and shot JSON on two models only for a pilot or A/B.
8. **Locked-video variants:** lock the picture after Ahmed picks takes. A hook variant changes ONE variable (voice OR text) on the same picture; 3 hooks x 2 variants = 6 per platform max. Name per SPARK: `CLIENT_CAMPAIGN_CONCEPT_HOOK_VAR_DUR_RATIO_LANG_TOOL_AI_Rn`.
9. **MENA rule:** adult people only (Veo `allow_adult` in MENA). Never prompt children, including family scenes. Real person or public figure = written consent, else stop.
10. **One credit quote:** shots x seconds x iteration ratio (default 3x) x per-second rate, plus voice. Show the formula, source label (O/T/NC) and one total against the package. LENS example (30 s, 6 shots, 3x): Veo Fast 90 s x $0.12 = $10.80. Unknown rates stay NC. Quote once per job, not per retry.

## Failure patterns
Static-card slideshow; 5 s clips on Veo; no first-seconds event; Arabic or logo inside a generated frame; product colour drift between shots; generated children; no master frame; two quotes or unlabelled prices; prompts called final video.

## Output contract
`script.md` (Masry + English gloss), `shots.json`, `frames_prompts.md`, `shot_prompts.md`, `quote.md`, handoff note (Ahmed generates, returns files, picks best take per shot). Readiness `NOT_READY` until render QA and CREATIVE brand check.

## Acceptance checks
- Every shot: duration in {4,6,8}, ratio 9:16; 1080p shots are 8 s.
- Each recurring subject has one master frame prompt; negatives on all prompts.
- No Arabic/logo text and no children in any prompt.
- Quote has formula, source labels, one total.
- Variants differ by one variable; names follow the SPARK pattern.
- Ahmed checkpoints listed: script OK, frames OK, take pick.

## Handoffs
LENS story in; SK-006 voice; SK-007 text; SK-002 edit; CREATIVE brand check; SPARK specs and AI-disclosure.
