GEMINI REQUEST GEM-DASH-001 · TSST product (Dash) · DASH-POST-ADS-001 step G1 · from Lead · 2026-10-27
SURFACE: Gemini app (Deep Research, NEW chat)
ROLE: EXTERNAL TOOL — research. Not a TSST agent; reply with text only, write no files. Output is INPUT for the Lead / SPARK.
OBJECTIVE: current Meta (Facebook + Instagram) ad placements and organic post specs, with official sources, so the Dash can draw correct previews.
CONTEXT: spec `DASH-POST-ADS-001-SPEC.md` (steps 3–4 + Status); open items from `DASH-POST-SPECS-001.md`.
FILES/ASSETS: none to upload.
OUTPUT: Ahmed exports the answer and saves it beside this file as `GEM-DASH-001_out.md`.
ACCEPTANCE (Lead, on return): every row has a source + grade; Lead opens 8+ URLs; grade-A rows must be on a Meta domain
(facebook.com/business, developers.facebook.com, help.instagram.com, about.meta.com) and live. Anything that would block a
build and is not grade A goes to SPARK for a WebFetch check in S1. Dead or non-Meta links for "A" = row rejected.

## PROMPT (paste everything below the line into a new Gemini chat, Deep Research on)
---
I am building a social-media preview tool. It shows how a post or an ad will look on Facebook and Instagram before it is published. It does not publish or buy ads. I need the CURRENT official specs (2026). Use Meta's own pages first (Meta Business Help Center, Meta for Developers, Instagram Help Center, Meta Ads Guide). Do not guess: if a value has no source, write "unknown".

For every row give: the value, the source URL, the date the page was last updated (if shown), and a grade: A = official Meta page, B = reputable secondary source, C = not confirmed.

Part 1. Ad placements (Facebook, Instagram, Messenger). One row per placement as named in Ads Manager today (for example Facebook Feed, Instagram Feed, Instagram Profile feed, Instagram Explore, Instagram Explore home, Facebook Stories, Instagram Stories, Messenger Stories, Facebook Reels, Instagram Reels, ads on Facebook Reels (overlay), Facebook Marketplace, Facebook Right column, Facebook Search results, Messenger Inbox, Facebook Video feeds, Threads, Audience Network). Add any placement that exists now and remove any that Meta retired (say when). Columns:
- placement name; which ad formats it accepts (single image, single video, carousel, collection, other);
- recommended aspect ratio(s) and resolution; accepted ratio range; what happens outside the range (crop, letterbox);
- safe zone: % of the frame to keep free of text/logos at top and bottom (Stories, Reels), and side margins if any;
- text shown: primary text / headline / description, and the character count before truncation ("See more");
- whether it is included in Advantage+ placements by default.

Part 2. Organic posts (not ads), Facebook Page and Instagram professional account:
- Instagram feed photo: allowed ratios, portrait limit (is it 4:5 or 3:4 now?), how the profile grid crops thumbnails (3:4?);
- Instagram carousel: max items, can slides have different ratios, does slide 1 set the ratio for all;
- Instagram Reel and Facebook Reel: ratio, max length for posting, cover image crop in the profile grid;
- Instagram and Facebook Story: ratio, top and bottom safe-zone % for text;
- Facebook photo post and Facebook multi-photo post ("album" style): allowed ratios, max photos in one post, and how Facebook lays out 2, 3, 4 and 5+ photos in the feed;
- caption length limit for Instagram and for Facebook Page posts, and where the caption is cut with "more".

Part 3. Campaign objectives and statuses in Ads Manager:
- the current list of campaign objectives (I believe: Awareness, Traffic, Engagement, Leads, App promotion, Sales) — confirm or correct;
- the delivery statuses an ad can show (for example Active, In review, Rejected, Paused, Completed, Not delivering, Learning) with one line each on what they mean.

Format: three tables (Part 1, 2, 3), then a short list "Conflicts and changes since 2024" (sources that disagree, or rules that changed), then the full list of sources. English only.
