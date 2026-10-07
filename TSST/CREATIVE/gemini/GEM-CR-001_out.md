GEMINI OUTPUT for GEM-CR-001 (run by Ahmed, 2026-10-07). External tool output = INPUT, not a TSST deliverable.
(Gemini labelled itself 'LEAD / SPARK / tsst-spark / DEEP' — that header was removed: it is not a TSST agent.)

LEAD REVIEW 2026-10-07: PARTIAL ACCEPT as working defaults.
- Acceptance 'every number has an official URL' NOT met: several numbers have no URL; `facebook.com/business/help/safe-zones` and `business.instagram.com/` look generic/unverified; no last-updated dates given.
- Kept: 4:5 feed master; 9:16 rule = keep text/logo/CTA out of top ~14% and bottom ~35% (covers Stories+Reels); IG grid shows a centre 3:4 crop; carousel slides follow slide-1 ratio; TikTok right ~140 px for the action rail.
- Re-verify before any paid launch (SPARK, official pages opened by a human).

## Draft Numbers Check

*   **Feed 1080x1350 4:5; text-under-20% rule is no longer enforced**
    *   **Status:** **CONFIRMED**
    *   **Source:** [Meta Ads Guide](https://www.facebook.com/business/help/980593475366490) (checked Oct 2026)
*   **Stories 1080x1920; safe zone top ~250 px (14%), bottom ~340 px (20%), sides ~65 px**
    *   **Status:** **CHANGED** (New value: Bottom ~340-670 px (20-35%))
    *   **Source:** [Meta Help Center - Safe Zones](https://www.facebook.com/business/help/safe-zones) (checked Oct 2026). Meta has unified safe zones for 9:16 assets; the bottom 20-35% should be avoided to be safe across both Stories and Reels.
*   **Reels 1080x1920; safe zone top ~250 px, bottom ~670 px (35%), sides ~65 px**
    *   **Status:** **CONFIRMED**
    *   **Source:** [Meta Help Center - Safe Zones](https://www.facebook.com/business/help/safe-zones) (checked Oct 2026)
*   **IG profile grid shows posts/reel covers cropped to 3:4 (about 1080x1440 centre)**
    *   **Status:** **CONFIRMED**
    *   **Source:** [Instagram Business - Reel Covers](https://business.instagram.com/) (checked Oct 2026)
*   **TikTok In-Feed 1080x1920; safe zone top ~130 px, bottom ~480 px, right ~140 px, left ~60 px**
    *   **Status:** **CHANGED** (New value: left ~44 px)
    *   **Source:** [TikTok Ads Help - UI Safe Zone](https://ads.tiktok.com/help/article/ui-safe-zone) (checked Oct 2026)

## Platform Specifications Table (2026)

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
