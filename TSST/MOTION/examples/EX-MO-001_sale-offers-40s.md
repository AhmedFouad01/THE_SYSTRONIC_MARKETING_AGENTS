# EX-MO-001 40 s sale-offers ad, AI shots + code motion (home-fixtures retailer, Upper Egypt)

Brand-neutral worked example of the R53 method (2026-11-05). Built 2026-11-03 by a Claude Code production session for the owner, before MOTION_AG was trained on it; it is the reference job for MOTION skills 001–007 v0.2 and the Remotion kit. Evidence (outside the repo, on the owner's Mac): `~/Downloads/Aldoctor market/video/` (`01-scene-plan.md`, `02-execution-plan.md`, `remotion/`, `qa/`, `exports/notes.md`, `exports/*_v1.mp4`). Status: checkpoint 1 delivered; owner review of the master pending; cutdowns not started.

## Asked
A 40 s 9:16 paid-social ad (Meta/TikTok) for a 44-offer sale (bathroom and kitchen fixtures), Egyptian Arabic VO, from the client's approved landing page and 44 printed offer images (each with a printed price sticker). CTA: WhatsApp (number unconfirmed) or the landing page. Budget set per phase by the owner (500 credits for the animatic phase, 4,000 cap with a 3,000 heads-up for final assets).

## Hard rules the brief set (now house rules)
No AI on product images; no Arabic text, prices or logos from AI; every number from the offers data; logo visible from frame 0; no white flashes, ≤ 2 flash-like transitions per second; captions only on named scenes; nothing installed system-wide, every npm version pinned; music licence read before generating.

## How it was built
| Step | Result | Credits |
|---|---|---|
| Plan | scene plan + execution plan in Egyptian Arabic; `plan_check.py` (178 checks: prices, %, VO fit, captions, safe zones) | 0 |
| Direction pack | 3 directions × (5 s hook + 3 stills), contact sheet; owner picked A base + B opening/wall/end card | 0 |
| Animatic v3–v5 | full 40 s at 540×960, temp VO, code beat bed; owner feedback on easing → motion tokens (before/after clip) | 0 |
| Voice test | 3 voices × 2 lines on eleven_v4; Karim Zaidan picked by ear; full take v2 after trimming 3 lines | 356 (phase total) |
| AI studio shot | style reference from campaign pixels → Nano Banana 2.1 ×3 → still 3 → Kling 3.0 i2v 5 s ×2 (dolly / push-in) → dolly, 1.0–4.3 s used under a navy scrim | 195 + 900 |
| Music | terms read first (Magnific §7 + Lyria section) → Lyria 3 Pro ×2 → take 1 (62 s, 120.04 BPM, first beat 0.10 s, breakdown 24–30 s) | 320 |
| VO final | take v2 promoted to final (same voice, model, script); 4 cutdown lines recorded in the same voice | 40 |
| SFX | 13 requests → 16 sounds, normalised, cued on animation frames | 95 |
| Master | Remotion: 12 scenes, 10 VO lines, captions on 5 scenes, ducked music, SFX; two full variants (scene 11 A landing page / B Click-to-WhatsApp) | — |

Edit map (s): hook slam + DM-28 0–3.5 · AI studio 3.5–6.5 · three hero offers 6.5–16 (zoom / slide / flip drops) · triple-drop montage 16–22.5 · offer wall 22.5–26 · trust (40 years, 4 showrooms) 26–30 · phone CTA 30–34.5 · end card 34.5–40 (last 2 s still).

Cover method: each printed sticker measured once (centre, radius); the new sticker is drawn exactly over it, the base disc never moves; a magenta debug render counted 0 leaking pixels on 17/17 frames.

## QA at checkpoint 1
1200 frames, 40.000 s, H.264 High yuv420p BT.709, AAC 48 kHz; -14.19 LUFS, -1.34 / -1.33 dBTP; 3 flash-like transitions, max 1 per second; end card still for the last 2 s; frame 0 = logo + "up to 48% off"; VO +8.2 to +18.8 dB over the music by the schedule-based check; no clipping or clicks; phone-to-caption gap 28 px (≥ 24 asked). Credits: 1,550 logged for the final-assets phase vs a balance drop of 2,210 on a shared account (gap reported to the owner, not absorbed).

## Found after the checkpoint (2026-11-05, while building the kit)
1. **VO line 4 starts under the music:** the TTS word timing was ~0.3 s late, so the duck (keyed to the scheduled first word) came after the voice started; for ~0.25 s the first word sits under a beat hit at about the same level. The schedule-based mix check measured from the scheduled word and missed it; the kit's `mix_check.py` (speech found in the VO stem) shows +6.9 dB for that region. Fix: duck from the VO file start (kit default now). Not yet fixed in the delivered master.
2. **Safe box:** the brief's box (top 250, bottom 350, right rail 140) puts the captions (y 1390–1550) inside Meta Reels' bottom 35%. Fine for TikTok-style placements; check with SPARK before Meta Reels delivery.
3. End-card CTA pulse stops mid-swing at 38.0 s (one-frame jump, minor).

## Lessons → skills
| Lesson | Skill |
|---|---|
| one motion-tokens file; per-word RTL; text never in a camera move; beat grid; flash limit | SK-001 |
| gated order (plan → directions → animatic → assets → master → stop); VO-driven timing at ~13 letters/s; variants as full renders; cutdown rules | SK-002 |
| measured duck (0.24 was too high), duck from the file start, stems QA, two-pass loudnorm, SFX prep and cueing | SK-003 |
| match AI at the source with a style reference from campaign pixels; scrim, not a darker grade; product pixels untouched | SK-004 |
| AI only for empty sets; frame-by-frame take review; charged rates; generation under a cap with a credit log and a balance check | SK-005 |
| trim, never speed; eleven_v4 Karim Zaidan by ear; same-session cutdown lines; licence before generation | SK-006 |
| numbers from data; `Ar`/`Words`; font gate; cover method; pending facts in one place; safe box per placement | SK-007 |
