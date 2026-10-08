# SOCIAL PROFILE SPECS (SV-01, VILL kit input)

Status: UNVALIDATED working record. Accessed 2026-10-08 by SPARK_AG. Method (LENS-SK-002): only the platform's own pages count; CONFIRMED = page text opened with WebFetch and the figure read on that page. NOT CONFIRMED = figure only seen in a WebSearch summary or third-party page, or the page would not render. Neither an Instagram nor a Meta Business help page rendered through WebFetch (they return only "Help Center" / a title); so every Instagram row is NOT CONFIRMED until someone opens the page in a real browser (Ahmed manual bridge).

Page dates: none of the pages shows an absolute update date except where stated.

## Table

| Platform | Item | Spec | Exact URL | Page date | Accessed | Status |
|---|---|---|---|---|---|---|
| Instagram | Profile picture | Not read. Help page only describes the steps. Third-party leads say 320x320 min, square, shown as circle | https://help.instagram.com/557544397610546 | no date shown (page not rendered) | 2026-10-08 | NOT CONFIRMED |
| Instagram | Highlight cover | Help page says only how to set a cover; no pixel size found. Third-party leads: 1080x1920 source, circle crop | https://help.instagram.com/369113370200735 | no date shown | 2026-10-08 | NOT CONFIRMED |
| Instagram | Story safe zone (organic) | No organic page found. Meta Ads guidance (snippet): Stories ads keep ~14% top / ~20% bottom clear, 1080x1920 | https://www.facebook.com/business/help/2222978001316177 ; https://help.instagram.com/2281642782069520 | no date shown (page not rendered) | 2026-10-08 | NOT CONFIRMED |
| Instagram | Reel size and cover | Reel ratio 1.91:1 to 9:16 (snippet). Cover recommended 420x654 px (1:1.55) (snippet). Not 1080x1920 | https://help.instagram.com/1038071743007909 | no date shown (page not rendered) | 2026-10-08 | NOT CONFIRMED |
| Instagram | Profile-grid crop / current grid ratio | No official page found. Third-party: 3:4 thumbnails (1080x1440), 9:16 reels lose top and bottom | none official (lead: https://www.oktopost.com/blog/instagram-grid-size-guide/) | n/a | 2026-10-08 | NOT CONFIRMED |
| Instagram | Feed photo sizes | Snippet of the image-resolution article: original resolution kept for 1.91:1 to 3:4 (1080 wide, 566-1440 high). Older/other help pages still say 1.91:1 to 4:5 (566-1350). 1:1 inside both ranges | https://help.instagram.com/1631821640426723/ | no date shown (page not rendered) | 2026-10-08 | NOT CONFIRMED (Lead already saw this page in a browser: resolution page is right, upper bound needs a look) |
| Instagram | Pinned posts | Up to 3 posts pinned to top of profile (snippet) | https://help.instagram.com/318456537074409/ | no date shown | 2026-10-08 | NOT CONFIRMED |
| Facebook Page | Profile picture | Upload 320x320; shown 176x176 on computer, 196x196 on smartphone; cropped to a circle | https://www.facebook.com/help/125379114252045?locale=en_US | no date shown (footer (c) 2026 Meta) | 2026-10-08 | CONFIRMED |
| Facebook Page | Cover photo desktop vs mobile | Desktop 16:9; mobile 2.4:1; min 400x150; fast-load file sRGB JPG 851x315, under 100 KB; profile pic overlaps cover ~40 px on mobile; left side partly covered by profile pic (English page). Arabic-locale page of the same article says right-aligned, right side covered, circle 170/128 px. Treat alignment as mirrored for RTL pages; check on a real Arabic Page | same URL (English) | no date shown | 2026-10-08 | CONFIRMED (alignment/size variance across locales flagged) |
| Facebook | Story | Not searched on an official page in this budget. Meta Stories ads guidance applies (see Instagram story row) | none | n/a | 2026-10-08 | NOT CONFIRMED |
| TikTok | Profile photo (organic) | Organic spec not on the pages opened. Ad profile image: 98x98, 1:1, jpg/jpeg/png, under 50 KB, key element in centre 66x66 | https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads?lang=en | Last updated: June 2026 | 2026-10-08 | Organic NOT CONFIRMED; ad profile image CONFIRMED |
| TikTok | Video safe zones | Page gives no pixel margins; they are in downloadable safe-zone zips (standard and a separate Arabic RTL version: "In-Feed - Arabic Version RTL .zip", "In Feed with Anchor-Arabic Version RTL .zip"). Size of zone depends on dimension, caption length and add-ons. 9:16 min 540x960; ads up to 10 min | same URL | Last updated: June 2026 | 2026-10-08 | CONFIRMED that RTL uses a different template; pixel margins NOT CONFIRMED (zip not opened, download needs Ahmed) |
| LinkedIn Page | Logo | Min 268x268, recommended 400x400; transparent logos show on white | https://www.linkedin.com/help/linkedin/answer/a563309/image-specifications-for-your-linkedin-pages-and-career-pages | "Last updated: 2 months ago" (no absolute date) | 2026-10-08 | CONFIRMED |
| LinkedIn Page | Cover / banner | Min and recommended 1512x256 px; may be trimmed horizontally or vertically; keep key details central (a WebSearch summary of the same page said 4200x700; the page text read by WebFetch says 1512x256, which is used here; re-check in browser) | same URL | "Last updated: 2 months ago" | 2026-10-08 | CONFIRMED (size conflict flagged) |
| LinkedIn Page | Area hidden by logo | Page gives no pixel area. Practical rule for design: logo sits at the lower-left; keep lower-left clear | same URL | same | 2026-10-08 | NOT CONFIRMED |
| YouTube | Profile picture | Renders 98x98; JPG/GIF/BMP/PNG (no animated GIF); max 15 MB; square or round | https://support.google.com/youtube/answer/10456525?hl=en&co=GENIE.Platform%3DDesktop ; https://support.google.com/youtube/answer/12950272?hl=en | no date shown (footer (c) 2026 Google) | 2026-10-08 | CONFIRMED |
| YouTube | Banner and safe area | Min upload 2048x1152 (16:9); safe area for text and logos 1235x338 at that size; recommended 2560x1440 (TV); max 6 MB; no shadows/borders/frames. Page gives one safe area, not separate numbers per device (same banner on computer, mobile, TV, cropped differently) | same as above | no date shown | 2026-10-08 | CONFIRMED (per-device safe areas NOT CONFIRMED) |

Attribution limit: none of these specs says anything about performance; they are display rules only. Platforms change them without notice, so re-check on the day of build.

## Differences vs TSST/CREATIVE/TOOLCHAIN.md (platform table)

1. Instagram feed/carousel range: TOOLCHAIN says 1.91:1 to 4:5, canvas 1080x1350. Image-resolution help article (snippet) says up to 3:4 (1080x1440); other help pages still say 4:5. Unresolved. Keep 1080x1350 (4:5) as the safe default; 3:4 (1080x1440) only after a browser check. Note TOOLCHAIN also says "crops to 3:4 on profile grid", so a 3:4 upload would equal the grid shape.
2. Reel cover: TOOLCHAIN says upload 1080x1920 and keep critical elements in the centre 1080x1440. Reels help page (snippet) recommends cover 420x654 (1:1.55). Different size and ratio; design in 1080x1920 for the video frame, but check the cover step in the app. The 3:4 grid crop is NOT CONFIRMED from an official page.
3. Story / Reel safe zones (14/20 and 14/35/6): consistent with Meta Ads guidance (Stories 14% top, 20% bottom; Reels ads 14% top, 35% bottom, 6% sides), but that guidance is for ADS, and Meta ads pages also quote 1440x2560 for Reels ads. No official organic Story figure was found. TOOLCHAIN's px numbers (250/340/670/65) are the percentages of 1920 and 1080, fine as defaults.
4. TikTok margins (130/320 or 480/44/140): not on TikTok's page; only zips. Ad length: TOOLCHAIN "no strict max (60s rec); up to 10 min for Spark Ads". TikTok page: non-Spark ads up to 10 minutes; Spark Ads no restriction. TOOLCHAIN also has no RTL note; add: Arabic ads use a separate RTL safe-zone template.
5. Missing from TOOLCHAIN: Facebook Page profile/cover, LinkedIn logo/cover, YouTube profile/banner, TikTok profile photo, Instagram profile picture, highlight covers, pinned posts (3). This file supplies them.
6. TOOLCHAIN video limits for Meta (241 min FB, 20 min IG Reels, 120s FB ad) were not checked here.

## Kit file list (designer can build from)

Build from master artwork with a centred subject; export PNG (JPG for photo covers) sRGB.

1. profile-square-1000.png: 1000x1000 master logo mark, centre inside a circle with 10% padding. Exports: 320x320 (Facebook, Instagram), 400x400 (LinkedIn, transparent allowed; shows on white), 800x800 (YouTube; shows at 98), 98x98 minimum check (TikTok ad). Check legibility at 36 px.
2. highlight-cover-1080x1920.png x N: icon in the centre circle (keep inside centre ~600 px). Spec NOT CONFIRMED; verify in app.
3. story-template-1080x1920.png: no text/logo in top 250 px, bottom 340 px (stories) or 670 px (reels), 65 px sides.
4. reel-cover-1080x1920.png: critical content inside the centre 1080x1440 band; also try a 420x654 variant check.
5. feed-4x5-1080x1350.png (default) and feed-1x1-1080x1080.png; 3:4 1080x1440 only after verification. Keep key content centred so a 3:4 grid crop is safe.
6. facebook-cover-851x315.jpg (fast-load size, under 100 KB) built on a larger master; keep mobile (2.4:1) centre area free of the ~40 px profile overlap and the profile-pic corner (left in LTR, right in Arabic locale).
7. linkedin-cover-1512x256.png; keep logo corner (lower-left) and edges clear.
8. youtube-banner-2560x1440.png (under 6 MB); all text and logo inside the centre 1235x338 safe area scaled to the master (about 1543x422 at 2560 wide).
9. tiktok-safe-zone-overlay: use TikTok's own zip (standard and Arabic RTL) downloaded by Ahmed.
10. Pinned posts: plan 3 pinned post slots (max 3), content from the VILL brief.

## Lead verification 2026-10-08 (built-in browser, official pages read in full)
| Platform | Item | Spec | URL | Status |
|---|---|---|---|---|
| Instagram | Feed photo ratios | width 320–1080 kept as-is if ratio is **1.91:1 to 3:4**; 1080 wide → height 566–1440. **3:4 (1080×1440) is supported** | https://help.instagram.com/1631821640426723 | CONFIRMED (no date shown) |
| Instagram | Reels ratio + minimums | upload ratio 1.91:1 to 9:16; ≥30 fps; ≥720 px | https://help.instagram.com/1038071743007909 | CONFIRMED (no date shown) |
| Instagram | Reel cover | recommended **420×654 (1:1.55)**; cannot be edited after upload | https://help.instagram.com/1038071743007909 | CONFIRMED (no date shown) |
| Instagram | Profile picture size, highlight cover size, grid thumbnail crop | **not published** by Instagram Help (search found how-to pages only: 557544397610546, 369113370200735) | — | NOT CONFIRMED → use practice defaults below |

Practice defaults (not platform facts, mark as such in the kit):
- Profile picture: export 1080×1080, key mark inside the central circle with ~10 % margin. Test it at 110 px in a circle.
- Highlight covers: 1080×1920 story frame, with the icon centred inside a ~600 px circle-safe area.
- Grid: design feed posts at 3:4 (1080×1440) or 4:5, keeping the key content inside the central 3:4 area, because the profile grid shows a 3:4 thumbnail (not on a help page; verify on a real profile after the first upload).
