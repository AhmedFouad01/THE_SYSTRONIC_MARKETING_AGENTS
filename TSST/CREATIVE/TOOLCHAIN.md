# CREATIVE Toolchain & Routing

## Principle

Choose tools based on the final medium, not on convenience. A tool limitation must be surfaced as a production limitation; it must not silently lower the requested quality standard.

## Stills / social graphics

Preferred capability sequence:

1. **Asset/reference inspection** — inspect brand masters and approved references.
2. **Image sourcing/generation** — rights-cleared original photography, approved stock, or a controlled generative image workflow.
3. **Image editing/compositing** — subject isolation, masking, perspective/crop, retouching, light/shadow matching, tonal/color adjustment.
4. **Layout/typesetting** — professional design/layout environment capable of Arabic/Latin composition.
5. **Final render** — PNG/JPG/SVG only when SVG itself is the intended vector deliverable.

Adobe/Photoshop-style non-destructive masking and compositing principles are preferred for image assembly. Generated imagery is source material, not an excuse to bake critical logos/text into generated pixels.

## Motion / video

Preferred sequence:

1. footage/asset preflight;
2. edit map and timeline;
3. edit/cut structure;
4. motion graphics and compositing;
5. subtitles;
6. sound mix;
7. color correction/grading;
8. final render and phone-scale QA.

Where available, use a real timeline/video renderer for MP4/MOV. A storyboard, animated HTML or series of static PNGs remains `PREVIS` unless the final requested medium is itself static.

## Current supported production capabilities in ChatGPT-connected workflows

- image generation/editing can supply source imagery and compositing steps;
- Adobe-connected image tools support masking, crop/reframe, generative edit, tone/color, grain and related finishing;
- Adobe-connected video timeline rendering can produce actual rendered video from available source assets;
- if the execution environment lacks a required video/compositing operation, label the result `PREVIS` and hand off the timeline/edit spec—do not call it final.

## Platform checks

TikTok: favor true vertical 9:16 production, high-resolution footage and UI-safe placement; key elements must avoid interface obstruction.  
Meta/Reels: render dedicated vertical/feed adapters and inspect each enabled placement rather than assuming an automatic crop preserves hierarchy.

### Platform Specifications Table (2026)

Status: WORKING DEFAULTS from Gemini (GEM-CR-001_out.md, Lead partial accept 2026-10-07); URLs not independently verified. Safe default for any 9:16: no text/logo/CTA in the top 14% or bottom 35%. Re-verify on official pages before paid launch.

| Placement | Canvas (px) | Aspect Ratio(s) Accepted | Recommended Ratio | Safe Zone (px from top / bottom / left / right) | Max Video Length | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Meta Feed (FB+IG)** | 1080 x 1350 | 1.91:1 to 4:5 | 4:5 | N/A | 241 min (FB) / 60 min (IG) | text-under-20% rule is no longer enforced. |
| **Meta Stories** | 1080 x 1920 | 1.91:1 to 9:16 | 9:16 | Top ~250 (14%) / Bottom ~340-670 (20-35%) / Sides ~65 (6%) | 120s (FB Ad) / 60s per clip (IG) | Safe zones unified across Stories/Reels; avoid bottom 35% to be safe for both. |
| **Meta Reels** | 1080 x 1920 | 1.91:1 to 9:16 | 9:16 | Top ~250 (14%) / Bottom ~670 (35%) / Sides ~65 (6%) | No hard limit (FB) / 20 min (IG) | Bottom 35% safe zone accounts for engagement stack and captions. |
| **Facebook Right Column** | 1080 x 1080 | 1:1, 16:9 | 1:1 | N/A | 241 min | Desktop only placement; keep text concise. |
| **Instagram Organic Post** | 1080 x 1350 | 1.91:1 to 4:5 | 4:5 | N/A | 60 min | Center critical content; crops to 3:4 on profile grid. |
| **Instagram Carousel** | 1080 x 1350 | 1.91:1 to 4:5 | 4:5 | N/A | 60 min | All subsequent slides automatically crop to match the aspect ratio of the first slide. |
| **Instagram Story (organic)** | 1080 x 1920 | 1.91:1 to 9:16 | 9:16 | Top ~250 (14%) / Bottom ~340 (20%) / Sides ~65 (6%) | 60s per clip | Longer videos automatically split into 60s segments. |
| **Instagram Reel Cover (Profile Grid)** | 1080 x 1920 (upload) | 9:16 (upload) | 3:4 (Grid) | Keep all critical elements within center 1080 x 1440 px (3:4) | N/A | The profile grid crops the center of the 9:16 image to a 3:4 rectangle. |
| **TikTok In-Feed Ad** | 1080 x 1920 | 9:16, 1:1, 16:9 | 9:16 | Top ~130 / Bottom ~480 / Left ~44 / Right ~140 | No strict max (60s rec); up to 10 min for Spark Ads | Bottom safe zone is larger than organic to account for CTA and Sponsored labels. |
| **TikTok Organic** | 1080 x 1920 | 9:16 | 9:16 | Top ~130 / Bottom ~320 / Left ~44 / Right ~140 | 10 min (in-app) / 60 min (upload) | Bottom UI takes less space without the ad CTA buttons. |

## Manual image bridge

Creative writes one recipe per image for a user-run tool (ChatGPT image edit, Magnific; flow: `TSST/context/adapters/gemini-desktop.md`); Ahmed runs it; Creative QAs the output side by side. See SK-014. Blender (3D re-staging) is deferred to a later phase. Helpers: `TSST/CREATIVE/tools/` (`contrast.py`, `phone_preview.py`).

## Rights

No stock/music/talent/source asset is considered cleared merely because it is technically accessible. Preserve source/provenance and release status.
