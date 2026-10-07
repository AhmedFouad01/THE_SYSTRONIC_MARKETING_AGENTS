# Post-finishing AI footage, export, frame-strip QA

Distilled from GEM-CR-004 PART 3 sections 5-6 (2026-10-08). UNVALIDATED. Gemini listed tools without URLs; only items with a URL or a local test are marked confirmed.

## Pass order for AI clips
| # | Pass | Why / when | Tool | Status |
|---|---|---|---|---|
| 1 | Pick the usable window | trim first/last 0.3-0.5 s (settling, drift) | AE / Premiere | TSST practice |
| 2 | Upscale to 1080x1920 (or above) | only if the generated clip is below delivery size; avoid double upscaling | Magnific video upscale, Topaz Video AI | tools named by Gemini; quality not confirmed |
| 3 | Deflicker | lighting pulses between frames | ffmpeg `deflicker`; Resolve Studio Deflicker; AE plugins | ffmpeg filter ran OK on s06 clip (2026-10-08), docs https://ffmpeg.org/ffmpeg-filters.html |
| 4 | Speed / frame interpolation | smooth choppy motion; speed ramps to land cut on beat | Premiere Optical Flow, AE Pixel Motion, ffmpeg `minterpolate`, Flowframes | warps geometry on architecture: inspect after |
| 5 | Colour match across models | clips from different models differ in tint/contrast | Resolve Color Match / one shared grade; AE Lumetri | method; Gemini tool claim not confirmed |
| 6 | Unified grain | binds shots, hides smooth AI texture | AE grain, Resolve film grain | light touch (quiet premium); do not add over text/logo |
| 7 | Titles, logo | approved logo is composited, never regenerated | AE / ExtendScript (`build_reel.jsx` ran in AE 2026) | confirmed locally |

Speed ramps: ease in/out around the cut, never ramp an already subtle move into a stutter; keep the ramp under a second. Cut-to-beat maths: SK-016 `ref/cuts-rhythm.md`.

## Tool split (pilot-proven)
| Task | Tool |
|---|---|
| Assembly, timing, titles, logo, end card | After Effects via ExtendScript (reproducible build script) |
| Prep (trim, scale, fps), contact sheets, QA strips, deflicker | ffmpeg |
| Grade across shots | AE Lumetri or Resolve |
Pricing/licensing of these tools: not confirmed (no official pages checked).

## Export spec (vertical short-form)
| Item | Value | Status |
|---|---|---|
| Frame size | 1080x1920, 9:16 | platform convention; current platform specs not confirmed, check before delivery |
| Frame rate | match the cut grid (24/25/30); do not mix | TSST |
| Codec | H.264 MP4, AAC audio, constant frame rate | common delivery default; official per-platform limits not confirmed |
| Naming | brand_project_shot_vNN, deterministic, with source manifest (SK-019 required method) | TSST |
| Variants | master + per-placement exports; do not resize blindly | SK-019 |
Review: first and last frame, muted pass, sound-on pass, 360 px phone preview.

## Frame-strip QA (ffmpeg, tested 2026-10-08 on s06 video_v1.mp4)
```
ffmpeg -y -i clip.mp4 -vf "fps=1.2,scale=270:-1,tile=6x1" -frames:v 1 strip.png
```
`tile` filter: https://ffmpeg.org/ffmpeg-filters.html (tile anchor present in docs). For longer clips use `tile=6x2` or more rows; for suspected flicker also compare mean brightness per frame with `signalstats`.
| Check on the strip | Reject if |
|---|---|
| Geometry stability (lines, edges, window, wall corners) | straight lines bend or drift between tiles |
| Morphing | objects appear, vanish or change shape (lamps, furniture counts) |
| Flicker | brightness or colour pulses between neighbours |
| Texture | stone/wood turns smooth or swims |
| Motion | move is invisible (s06 lesson: too subtle) or stacked moves |
| Frame 1 / last frame | different from the approved still beyond intended move |
Record: file, date, tile image path, verdict, defect named with its number (SK-014 rule 6).

## Rights and AI labelling
Rule: "check before publishing" (owner: SPARK/Lead). CREATIVE flags, does not decide.
| Platform | Source | Status |
|---|---|---|
| YouTube | https://support.google.com/youtube/answer/14328491 "Disclosing use of GenAI content" (page title seen 2026-10-08; rules text not read) | URL reachable, rules not confirmed |
| TikTok | https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content (reachable; content not verified) | not confirmed |
| Meta | official page not found (tried help article 1033790244056562: 404) | not confirmed |
| Vendor commercial-use terms (Magnific, Kling, Seedance) | per plan/tier | not confirmed; check licence before paid use |
| EU AI Act labelling (Gemini cited europa.eu) | no URL | not confirmed |
Also log in the manifest: model, version, date, source reference, that the final is AI-generated from client photos, and that it is internally labelled as a render, not the physical project (SK-014 acceptance rule 8).
