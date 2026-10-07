# Video models (Magnific catalog)

Source: Magnific video model catalog, fetched 2026-10-08 via MCP `video_models_list` (46 models; this table is the relevant ~11). Authoritative for what Ahmed's Magnific account exposes; it replaces Gemini's model table (GEM-CR-004: no URLs, several wrong). Catalogs change: re-fetch before planning a new reel. Vendor-side quality claims (artefacts, realism): not confirmed, test per shot. UNVALIDATED.

| Model (slug) | Durations (s) | Resolutions | Start / End frame | References (limit) | Sound | Catalog recommendation |
|---|---|---|---|---|---|---|
| Seedance 2.5 (bytedance-seedance-pro-2.5) | 4-30 | 1080p, 720p, 480p, Draft | yes / yes | image 30, video 10, character 30, product 1, style 1, audio 10 | native audio, lip sync | tier SOTA, rank 1: "best overall video model"; realistic, references, complex motion, directed camera |
| Seedance 2.0 (-pro-2.0) | 4-15 | 4K, 1080p, 720p, 480p | yes / yes | image 9, video 3, character 9, product 1, style 1, audio 3 | native audio | rank 2: 4K, native audio, multimodal references |
| Seedance 2.0 Fast (-fast-2.0) | 4-15 | 720p, 480p | yes / yes | as 2.0 | native audio | rank 3: fast drafts, max quality not required |
| Kling 2.5 (kling-25) | 5, 10 | 1080p, 720p | yes / yes | none | no (silent) | rank 2: "best quality/price", silent 5-10 s, fast iteration, start/end-frame control |
| Kling 3.0 (kling-30) | 3-15 | 720p, 1080p, 4K | yes / yes | character 3, product 3, image 3 | yes | no recommendation block |
| Kling 3.0 Omni (kling-omni3) | 3-15 | 720p, 1080p, 4K | yes / yes | image, video, character (multi-shot supported) | yes | no recommendation block |
| Google Veo 3.1 (google-veo3_1) | 4, 6, 8 | 4K, 1080p, 720p | yes / yes | image 3 | yes | no recommendation block |
| Veo 3.1 Fast (google-veo3_1-fast) | 4, 6, 8 | 4K, 1080p, 720p | yes / yes | none | yes | no recommendation block |
| MiniMax H3 Max (minimax-video-3_0-max) | 5-15 | 768p, 480p | yes / yes | image 9, character 9, video 3, audio 3 | no | rank 3: fast 5-15 s drafts; "prefer Seedance for final visual quality" |
| Wan 3.0 (wan-3-0) | 2-30 | 1080p, 720p, 480p | yes / yes | video 5, image 10, audio 5, character 1 | yes | no recommendation block |
| Runway Gen 4.5 (runway-gen45) | 5, 8, 10 | 720p only | yes / no | none | no | no recommendation block |

All models above list 9:16 as an aspect ratio. Veo 3.1 accepts only 16:9 and 9:16.

## Measured cost (Magnific credits, one shot, 2026-10-08)
| Job | Credits | Evidence |
|---|---|---|
| Kling 2.5, 5 s, 1080p, 9:16, start frame only | 325 | s06-stonewall real run |
| Seedance 2.5, 6 s, 1080p | 4,740 | `simulate_cost` quote, not generated; about 15x Kling |
| Expand to 9:16 | 50 | s06 real run |
| Upscale creative 2x (736x1312 to 1472x2624) | 90 | s06 real run |
All other models: cost not measured, "not confirmed". Always run `simulate_cost` first.

## Pick rule
| Need | Model | Why |
|---|---|---|
| Subtle architectural move, cheap, 9:16 | Kling 2.5 | proven in s06, 325 credits |
| Final-quality hero, references or audio | Seedance 2.5 | catalog rank 1 but about 15x cost: only after owner approval of the credit quote |
| Many draft angles | MiniMax H3 Max or Seedance 2.0 Fast | catalog marks as draft/fast |
| First/last frame interpolation between two stills | Kling 2.5 / 3.0, Seedance | all support end frame; Runway Gen 4.5 does not |
