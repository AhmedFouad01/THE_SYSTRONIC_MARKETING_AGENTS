# ANVIL SUPPS — Reveal V2 / Production Report
Date: 2026-10-10  
TEAM: studio / CREATIVE_AG / MOTION_AG  
Status: **PRODUCTION_DRAFT — NOT APPROVED FOR RELEASE**  

## Deliverables in this folder
- `ANVIL_reveal_v2_15s.mp4` — 15-second **local-compositing review draft**. The video is assembled from locked source plates with deterministic motion, animation and original approved mark files. **It does not incorporate Magnific's 4 newly-generated moving plates** because their signed CDN MP4 links could not be downloaded into the local compositing runtime. Do not misrepresent it as the fully motion-generated final.
- `frames/shot1.png` through `frames/shot6.png` — contact points from the review draft.
- `frame_strip.jpg` — timeline contact sheet.
- `M_shark.png`, `M_products.png`, `M_hero.png`, `S1b_tag.png`, `hero_endcard.png` — compositing stills.

## Financial actual (Magnific)
- Four Google Veo 3.1 Lite videos, 1080×1920, 24 fps: 4s + 4s + 6s + 4s = **720 credits**.
- One Google Lyria 3 music generation, ~31 seconds: **80 credits**.
- Total spent on this approved run: **800 credits**.
- Re-roll reserve approved: 240 credits. **Not used**.
- Remaining Magnific balance after generation: **335,962**.

## Magnific AI moving plates — generated and QA inspected
1. Shot 1, covered tower / camera move: https://www.magnific.com/app/creation/KLZKOAmkqp  
   QA: minor fabric texture crawl, no fictional marks/products.
2. Shot 2, cloth lifts bottom-to-top: https://www.magnific.com/app/creation/lJcl3M3gv9  
   QA: **moderate-to-high physics problem**: lifting cloth splits to the sides ~1.6–2.8s and crane cable disappears; **not suitable for final unaltered**. The review draft uses a controlled deterministic cloth wipe instead.
3. Shots 3+4, clean tower static/vertical orange lighting: https://www.magnific.com/app/creation/KLZKOnakqp  
   QA: rigid four-ledge structure, slight light fluctuation ~1.7–2.6s. A suitable background plate for final compositing.
4. Shot 5, upper-face push: https://www.magnific.com/app/creation/5jR5JYeKxe  
   QA: stable rigid monument; suitable as a clean background plate.
5. Soundtrack generated separately (Magnific Lyria 3), title `Steel Shadows`: https://www.magnific.com/app/creation/aFJaxWrfSh

**Media bridge limitation:** Magnific returns private signed media URLs but not a directly transferable `file_uri` in this runtime. Drive and local ffmpeg cannot consume those URLs through the available connectors. The deliverable video uses a clearly identified locally synthesized industrial guide audio track (120 BPM, hit markers at 3, 5 and 11 seconds), **not the paid Lyria master**. Final sound selection and rights clearance remain OPEN.

## Approved original brand assets composited without AI rewriting
- `M_master.png` (2160×3840), source `post-2-reveal/plates/` — source tower.
- Original ANVIL `Wordmark Dark.png` and `IconicMark Dark-Staged.png` pixels, cropped and keyed for overlays; never typeset/redrawn.
- Original legacy Shark artwork `10_ASSETS/VI/Old/شارك-اكس.png` with native transparency, modest opacity on pale concrete base face.
- Genuine RAW product photographs: Tractor Creatine `053392F3-FA47-4D95-AD09-1EEB3E45B865.jpeg` and Premium Creatine `A14903A1-9172-4957-AFB5-4289154EF832.jpeg`, hand-cut from source photographs, labels unchanged, contact shadows on lower-left and upper-left ledges.
- In this draft, the lower-right gift ledge and upper-right bundle ledge remain empty rather than inventing products.

## Missing or unusable packshots
- **No usable RAW packshots verified:** Furiux Mass 3 kg; whey 7 servings; Premium Pre-Hell; Farah Secrets GainSecret 5 kg; gift shaker.
- **Marvelous Creatine:** REAL RAW photo exists (`ChatGPT Image Oct 1, 2026, 06_14_39 PM.jpg`), but the jar is physically obscured by a different can stacked directly above it. Not suitable for a faithful isolated packshot without changing the original packaging; omitted.
- The two present RAW packshots are hand-held shop photographs rather than production packshots; fine edge extraction is a known refinement before release.

## Technical verification
- Review file: H.264 / yuv420p / 1080×1920 / 24 fps / MP4, audio AAC stereo 48 kHz.
- Measured duration: **15.000 seconds**.
- Storyboard cuts at 3 / 5 / 8 / 11 / 13 seconds. Reels safe-zone text confined to last end card.
- No AI-drawn marks, product labels, invented offers, prices or claims.
- Do **not** publish until a real-motion edit, licensed final sound, all asset sourcing, and frame-level QA are approved.

## Next edit gate
1. Bridge/download approved Magnific clips locally or provide file exports to editor for compositing.
2. Replace cloth shot 2's problematic middle section with the controlled deterministic wipe or masked VFX.
3. Supply unobstructed real packshots for missing bundle items, especially 5 kg and 3 kg hero SKUs.
4. Recut the timeline over the AI moving plates and replace guide audio with licensed `Steel Shadows` if usage terms clear.
5. Run full-release QA and ask owner to approve. No posting/ads authorized.

**Skills used:** TSST-CREATIVE-SK-014, SK-015, SK-016, SK-013, SK-017, SK-019.  
**skill_friction:** signed Magnific MP4 egress cannot be consumed locally; missing valid source packshots; S2 cloth motion artifact.  

## Final local edit (2026-10-10, ffmpeg only, zero AI credits)
Output: `ANVIL_reveal_FINAL_15s.mp4` (1080x1920, 24 fps, 360 frames, H.264 High yuv420p, AAC 48 kHz, +faststart, 15.000 s). QA: `QA_tile.jpg`. Status: PRODUCTION_DRAFT, NOT_READY (no publication approval).
Rebuilt stills (existing hero/endcard contained product cutouts and a broken end card): `hero_clean.png` = `M_shark.png` + original ANVIL mark pixels from `M_hero.png` (box 330,730-740,980 feathered; pixels outside box identical, ledges empty); `endcard_clean.png` = original `Wordmark Dark.png` crop (bg #171717 native, no keying) + "Shark is now" Inter SemiBold; text/logo in y 700-1330 (safe zone).
Cut list (timeline): 0.00-3.00 src 0-3.00 covered tower dolly-in | hard cut at 3.00 on the original music cut point | 3.00-12.25 src 4.00-13.25 clean tower with orange seams (source 3.00-4.00 dropped: cloth fragments flying = defect; cloth split section gone) | 12.00-12.25 6-frame dissolve | 12.00-13.50 hero_clean, push-in 4%, light colour match (G x0.95, B x0.965) | 13.50-15.00 end card (hard cut).
Audio: original "Steel Shadows", src 0-15 s untouched timeline (not cut with the video), +1.5 dB, fade-out 14.2-15.0. Measured: -13.9 LUFS integrated, true peak -1.2 dBTP.
QA: no black frames (blackdetect), duration 15.000, no AI-invented letters in footage (clip has none), logos from original files.
Known limits: (1) src 3.00 reveal shot has no clean start (cloth fragments from first frame) so the cover-to-tower is a hard cut; (2) framing jump footage->hero (hero is a closer/taller view than the footage) is masked only by the 6-frame dissolve; (3) footage 4-13 s is nearly static (slow push only); (4) audio stays in source time so music does not shift with the cut; (5) Lyria licence for platform use still unverified; (6) the old S1b/M_hero stills with products remain in folder, unused.
