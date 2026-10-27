# GEM-DASH-001 output (Gemini app Deep Research)
Source: https://share.gemini.google/rRNjaNaX3ELt (shared by Ahmed 2026-10-27). Verbatim page text. INPUT only.
Lead review 2026-10-27: 9 links opened, all live and matching (Meta: help 682655495435254, 980593475366490, 817989058548892,
1438417719786914; ads-guide image facebook-feed, instagram-story, facebook-right-hand-column; B: grid34sync.com, meta-ads.si).
Verdict: usable. What the spec takes is in `DASH-POST-ADS-001-SPEC.md` "Facts (G1)".

Meta Platform Ad and Organic Rendering Specifications (2026 Edition)

Building an accurate social-media and advertising preview engine for Facebook, Instagram, Messenger, Threads, WhatsApp, and the Meta Audience Network requires accounting for a split rendering architecture. Across the 2024–2026 release cycles, Meta decoupled several upload specifications from viewport display geometries, introduced higher-density pixel baselines (1440 px width replacing legacy 1080 px masters), expanded feed surfaces to include the Facebook Friends tab, and re-engineered the Instagram profile grid around a 3:4 vertical rectangle while leaving developer API upload endpoints locked at 4:5. For a pre-publication preview tool, faithful simulation depends on modeling three distinct layers: the raw asset ingestion constraints (aspect ratio tolerances and minimum pixel dimensions), the placement-specific viewport transformations (center-cropping, letterboxing, pillarboxing, or taller-screen zoom), and the user interface (UI) chrome overlays that dictate safe zones and text truncation thresholds.   

Part 1: Meta Ad Placement Specifications (Facebook, Instagram, Messenger, Threads, WhatsApp, and Audience Network)

Meta's ad rendering pipeline evaluates creative assets against three master aspect ratios that collectively service all active placements: 4:5 vertical (1440 x 1800 px) for primary feed and discovery surfaces, 9:16 full-screen vertical (1440 x 2560 px) for Stories, Reels, and Status placements, and 1:1 square (1080 x 1080 px minimum) for carousel cards, collection covers, Marketplace, and universal fallback delivery. When an advertiser supplies an asset within the accepted aspect ratio range that does not match the native viewport of the placement, Meta applies deterministic container rules. In full-screen 9:16 placements such as Facebook Stories and Reels, a 1:1 or 4:5 asset is rendered smaller within the frame using background padding (letterboxing), whereas on mobile devices with physical screens taller than 9:16, Meta either zooms into the 9:16 canvas—cropping out any pixels outside the designated safe zone—or displays the original 9:16 frame against black background bars. Conversely, on desktop viewports for Facebook Feed, a 4:5 video is forced into a 1:1 container, introducing vertical black bars (pillarboxing) on the left and right sides. In the Threads Feed, the cropping engine acts aggressively on vertical overflow: although the placement accepts aspect ratios from 1.91:1 to 9:16, any single image or video taller than 4:5 is vertically center-cropped to 4:5, and any carousel card that deviates from 1:1 is center-cropped to a 1:1 square.   

Safe-zone enforcement is equally critical for preview accuracy. While Meta eliminated its historical 20% text-in-image rejection rule, cluttered text overlays still suppress auction delivery, and Ads Manager provides a yellow "Safe zone guardrail" overlay to warn advertisers when key elements intrude into UI regions reserved for profile avatars, "Sponsored" tags, audio tickers, captions, and call-to-action (CTA) buttons. For standard 9:16 vertical placements (Facebook Stories images, Instagram Stories, Facebook Reels, and Instagram Reels—as well as 9:16 videos served inside Instagram Feed), the preview tool must mask the top 14% (358 px on a 1440 x 2560 px canvas; 269 px on a 1080 x 1920 px canvas), the bottom 35% (896 px at 1440 x 2560 px; 672 px at 1080 x 1920 px), and 6% on both left and right sides (86 px at 1440 x 2560 px; 65 px at 1080 x 1920 px), leaving a central safe area of 1267 x 1306 px (or 950 x 979 px at 1080p). If an advertiser attaches a regulatory or political disclaimer to a Reels ad, the bottom exclusion zone expands from 35% to 40%. For non-9:16 assets (1:1 or 4:5) rendered in the Instagram Feed, Meta instructs keeping the bottom and side edges clear of logos and text.   

The table below catalogs every placement active in Meta Ads Manager in 2026—incorporating placements added to Meta's specification matrices (such as Facebook Profile Feed, Facebook Business Explore, Facebook In-Stream Video, Facebook In-Stream Reels, Instagram Search Results, WhatsApp Status, and Audience Network Rewarded Videos) as well as retired placements and their deprecation dates. In accordance with strict verification standards, any parameter not explicitly documented in the official Meta pages or verified secondary sources is marked as unknown.   

Placement Name (and Status)	Accepted Ad Formats	Recommended Aspect Ratio(s) & Resolution	Accepted Ratio Range & Out-of-Range Behavior	Safe Zone (% and Pixel Margins)	Text Shown & Character Count Before Truncation ("See more")	Included in Advantage+ by Default	Source URL, Last Updated Date & Grade

Facebook Feed (Includes Facebook Friends tab starting March 2026)

	

Single image (JPG/PNG up to 30 MB), single video (MP4/MOV/GIF up to 4 GB, 1s–241 min), carousel (2–10 cards, image up to 30 MB, video up to 4 GB / 1s–240 min), collection (cover image/video + 3 or 2–4 product tiles; mobile only), 360/panorama photos

	

Single Image/Video: 4:5 at 1440 x 1800 px (1080 x 1350 px same ratio; min 600 x 750 px image with 3% tolerance; min width 120 px video; 1:1 min 1080 x 1080 px). Carousel: 1:1 at >=1080 x 1080 px (3% tolerance). Collection Cover: 1.91:1 to 1:1 at >=1080 x 1080 px (or 4:5 at 1080 x 1350 px)

	

Accepted: 1.91:1, 16:9, 1:1, 4:5. Behavior: Meta crops or pads to fit; on desktop Facebook Feed, 4:5 videos are forced into a 1:1 player, adding vertical black bars (pillarboxing) on the sides. Non-1:1 carousel cards crop unpredictably across devices.

	

No safe zone listed for standard Feed (1:1 or 4:5). If 9:16 video is used in Feed, keep top, bottom, and side edges clear.

	

Single Image/Video: Primary text 50–150 chars (125 chars optimal on mobile before "See more"); Headline 27 chars (up to 40 on some mobile views); Description: n/a. Carousel: Primary 80 (or 125), Headline 20 (or 40), Description 18. Collection: Primary 125, Headline 40.

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/817989058548892, https://www.facebook.com/business/ads-guide/update/image/facebook-feed, https://www.facebook.com/business/ads-guide/update/video/facebook-feed (Date: unknown, Grade: A); https://www.wittelsbach.ai/blog/facebook-ad-sizes-and-specs (Updated: 2 Oct 2026, Grade: B); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

Facebook Profile Feed (Added current placement)

	

Image, video (other formats: unknown)

	

Recommended ratio and resolution: unknown

	

Accepted: 1.91:1, 1:1, 4:5. Out-of-range behavior: unknown

	

unknown

	

unknown

	

Yes (part of Facebook placements)

	

https://www.facebook.com/business/help/682655495435254 (Date: unknown, Grade: A)

Instagram Feed	

Single image (up to 30 MB), single video (up to 4 GB, 1s–60 min), carousel (2–10 cards), collection

	

Image: 4:5 at 1440 x 1800 px (min width 500 px, 1% tolerance; 1080 x 1350 px also used). Video: 9:16 at 1080 x 1920 px (min width 250 px; 4:5 at 1080 x 1350 px also cited). Carousel: 1:1 at >=1080 x 1080 px.

	

Accepted (Help Center): 1.91:1, 16:9, 1:1, 4:5, 2:3, 9:16. Accepted (Ads Guide Image): 1.91:1 to 4:5 (400 x 500 to 191 x 100). Behavior: unknown on official page; non-1:1 carousel cards are cropped.

	

9:16 Video in IG Feed: Same as Reels/Stories (top 14%, bottom 35%, sides 6% clear). 1:1 or 4:5 in IG Feed: Keep bottom and side edges clear of text/logos.

	

Image: Primary text 125 chars (max 30 hashtags); Headline 40 chars; Description: n/a. Video: Primary text 125 chars; Headline: n/a; Description: n/a.

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/980593475366490, https://www.facebook.com/business/help/817989058548892, https://www.facebook.com/business/ads-guide/update/image/instagram-feed, https://www.facebook.com/business/ads-guide/update/video/instagram-feed (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

Instagram Profile Feed	unknown	unknown	unknown	unknown	unknown	

unknown (Instagram placements generally included)

	

Not listed in https://www.facebook.com/business/help/682655495435254 (Date: unknown, Grade: C)

Instagram Explore	

Single image (up to 30 MB), single video (up to 4 GB, max 60 min)

	

4:5 at 1440 x 1800 px (or 1080 x 1350 px) or 1:1 at 1080 x 1080 px (serves in Feed dimensions in detail view)

	

Accepted: 1:1 or 4:5 (Feed dimensions; exact range unknown on official table). Behavior: unknown.

	unknown	

Primary text 125 chars; Headline 40 chars; Description: n/a

	

Yes

	

https://www.facebook.com/business/help/817989058548892 (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B); https://www.tryvizup.com/blog/meta-ad-specs-2026-every-dimension-size-you-need (Date: 2026, Grade: B)

Instagram Explore Home	

Single image (up to 30 MB), single video

	

Image: 4:5 at 1440 x 1800 px (min width 500 px). Video: 9:16 recommended

	

Accepted (Help Center): 4:5, 9:16. Accepted (Ads Guide Image): 1.91:1 to 4:5. Behavior: unknown.

	

unknown

	

Primary text 125 chars; Headline 40 chars; Description: n/a

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/ads-guide/update/image/instagram-explore-home (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

Facebook Stories	

Single image (up to 30 MB; displays 5s by default), single video (MP4/MOV/GIF up to 4 GB; 1s–120s per Help Center or 1s–3 min per Ads Guide; <=15s plays in full, longer splits into cards), carousel (3–10 image cards; video not supported in Stories carousel per Ads Guide)

	

9:16 at 1440 x 2560 px (1080 x 1920 px same ratio; min width 500 px image with 1% tolerance; min width 250 px video)

	

Accepted: 1.91:1, 16:9, 1:1, 4:5, 9:16. Behavior: Non-9:16 ratios render smaller with background padding/letterboxing. On screens taller than 9:16, Meta zooms in (cropping outside safe zone) or adds black bars.

	

Image: Top 14% (358 px at 1440p / 269 px at 1080p), Bottom 35% (896 px / 672 px), Sides 6% (86 px / 65 px) clear. Video: Top 14% (250 px), Bottom 20% (340 px) clear (or center 1080 x 1420 px / bottom 340–670 px).

	

Primary text 125 chars; Headline 40 chars; Description: n/a

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/817989058548892, https://www.facebook.com/business/help/980593475366490, https://www.facebook.com/business/ads-guide/update/image/facebook-story, https://www.facebook.com/business/ads-guide/update/video/facebook-story (Date: unknown, Grade: A); https://www.wittelsbach.ai/blog/facebook-ad-sizes-and-specs (Updated: 2 Oct 2026, Grade: B)

Instagram Stories	

Single image (up to 30 MB; 5s default), single video (up to 4 GB, 1s–60 min; <16s plays in full, longer may split into cards), carousel

	

9:16 at 1440 x 2560 px (1080 x 1920 px same ratio; min width 500 px image, 250 px video)

	

Accepted: 1.91:1, 16:9, 1:1, 4:5, 9:16. Behavior: Non-9:16 padded/letterboxed; on screens taller than 9:16, Meta zooms in (cropping outside safe zone) or displays black bars.

	

Top 14% (358 px at 1440p / 269 px at 1080p), Bottom 35% (896 px / 672 px), Sides 6% (86 px / 65 px) clear (leaving 1267 x 1306 px at 1440p or 950 x 979 px at 1080p).

	

Primary text 125 chars; Headline: n/a; Description: n/a

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/817989058548892, https://www.facebook.com/business/help/980593475366490, https://www.facebook.com/business/ads-guide/update/image/instagram-story, https://www.facebook.com/business/ads-guide/update/video/instagram-story (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

Messenger Stories (Active in Meta Help/Ads Guide; allplatforms.io claims retired Aug 2026)

	

Single image (JPG/PNG up to 30 MB), single video (up to 4 GB, 1–60s), carousel

	

9:16 recommended for image and video; Ads Guide lists >=1080 x 1080 px (1080 x 1920 px or 1440 x 2560 px satisfies 9:16; min width 500 px)

	

Accepted: 1.91:1, 9:16. Behavior: Taller screens may zoom/crop outside safe zone or pad with black bars.

	

Top 14% (250 px) and Bottom 20% (340 px) clear of text/logos (Safe area: 1080 x 1330 px on 1080 x 1920 px canvas; side margins: 0% / none listed).

	

Primary text 125 chars; Headline 40 chars; Description: n/a

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/ads-guide/update/image/messenger-story (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B); https://allplatforms.io/messenger/ (Date: unknown, Grade: B)

Facebook Reels	

Single image (up to 30 MB), single video (MP4/MOV/GIF up to 4 GB; no max length in Ads Guide; 90s or 15 min in secondary guides), carousel

	

9:16 at 1440 x 2560 px (1080 x 1920 px same ratio; image min 600 x 600 px)

	

Accepted: 1.91:1, 16:9, 1:1, 4:5, 2:3, 9:16. Behavior: Non-9:16 padded/letterboxed; taller screens zoom in (cropping outside safe zone) or display with black background bars.

	

Top 14% (358 px), Bottom 35% (896 px), Sides 6% (86 px) clear. With disclaimer: Leave bottom 40% clear. Images: Meta recommends no text on images.

	

Primary text 44 chars (per Reels spec; Headline: n/a; Description: n/a)

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/980593475366490, https://www.facebook.com/business/ads-guide/update/image/facebook-facebook-reels, https://www.facebook.com/business/ads-guide/update/video/facebook-facebook-reels (Date: unknown, Grade: A); https://www.wittelsbach.ai/blog/facebook-ad-sizes-and-specs (Updated: 2 Oct 2026, Grade: B)

Instagram Reels	

Single image (per Help Center ratio table), single video (MP4/MOV up to 4 GB, 0s–15 min per Ads Guide or 90s per secondary guides; min width 250 px <30s, 500 px >=30s)

	

9:16 at 1440 x 2560 px (1080 x 1920 px same ratio)

	

Accepted: 1.91:1, 16:9, 1:1, 4:5, 2:3, 9:16. Behavior: Non-9:16 padded; taller screens zoom in (cropping outside safe zone) or display black bars.

	

Top 14% (358 px at 1440p / 269 px at 1080p), Bottom 35% (896 px / 672 px), Sides 6% (86 px / 65 px) clear. With disclaimer: Leave bottom 40% clear.

	

Primary text 44 chars (truncates early because caption sits over video); Headline: n/a; Description: n/a

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/980593475366490, https://www.facebook.com/business/ads-guide/update/video/instagram-reels (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

Ads on Facebook Reels (Overlay)	

Overlay banner/sticker format (unknown if video/carousel supported inside overlay)

	

Recommended ratio and resolution: unknown

	

Accepted: 1.91:1, 1:1, 9:16. Out-of-range behavior: unknown

	

unknown

	

unknown

	

Yes

	

https://www.facebook.com/business/help/682655495435254 (Date: unknown, Grade: A)

Facebook In-Stream Reels (Added current placement)

	

Image, video

	

Image: 1:1 recommended. Video: 4:5 recommended (pixel resolution: unknown)

	

Accepted: 1.91:1, 1:1, 4:5. Out-of-range behavior: unknown

	

If 9:16 aspect ratio is used in Facebook In-Stream Reels, keep top, bottom, and side edges clear.

	

unknown

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/980593475366490 (Date: unknown, Grade: A)

Facebook Marketplace	

Single image (up to 30 MB), single video (up to 4 GB, 1s–241 min), carousel

	

1:1 at >=1080 x 1080 px for both images and videos

	

Accepted: 16:9, 1:1, 9:16. Behavior: A 4:5 feed image may be cropped/delivered as 1:1 on Marketplace.

	

No safe zone listed

	

Primary text 125 chars; Headline 40 chars; Description 30 chars

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/817989058548892, https://www.facebook.com/business/ads-guide/update/image/facebook-marketplace (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

Facebook Right Column (Desktop only)	

Single image (up to 30 MB), single video (1s–241 min, up to 4 GB), carousel

	

Conflict: Ads Guide recommends 1:1 at >=1080 x 1080 px (or 1440 x 1440 px / 1200 x 1200 px), while Help Center (682655495435254) recommends 1.91:1 for images and videos.

	

Accepted: 1.91:1, 1:1. Out-of-range behavior: unknown.

	

No percentage safe zone; Meta recommends keeping images free of text.

	

Exact Right Column text truncation: unknown (general desktop/feed headline 27–40 chars)

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/ads-guide/update/image/facebook-right-hand-column (Date: unknown, Grade: A); https://www.wittelsbach.ai/blog/facebook-ad-sizes-and-specs (Updated: 2 Oct 2026, Grade: B)

Facebook Search Results	

Image, video, carousel

	

1:1 at 1080 x 1080 px recommended by secondary guides; official ratio table lists no single recommendation

	

Accepted: 1.91:1, 1:1, 9:16. Out-of-range behavior: unknown.

	

unknown

	

unknown

	

Yes

	

https://www.facebook.com/business/help/682655495435254 (Date: unknown, Grade: A); https://moda.app/resources/sizes/facebook-ad (Updated: 28 Aug 2026, Grade: B)

Instagram Search Results (Added current placement)

	

Image, video

	

Image: 4:5 recommended. Video: 9:16 recommended (pixel resolution: unknown)

	

Accepted: 1.91:1, 16:9, 1:1, 4:5, 9:16. Out-of-range behavior: unknown.

	

unknown

	

unknown

	

Yes

	

https://www.facebook.com/business/help/682655495435254 (Date: unknown, Grade: A)

Facebook Business Explore (Added current placement)

	

Image, video

	

Recommended ratio and resolution: unknown

	

Accepted: 1.91:1, 1:1, 4:5. Out-of-range behavior: unknown.

	

unknown

	

unknown

	

Yes

	

https://www.facebook.com/business/help/682655495435254 (Date: unknown, Grade: A)

Facebook In-Stream Video (Replaces/covers legacy Facebook Video feeds in current spec tables)

	

Single video (MP4/MOV up to 4 GB; Desktop: 5–15s; Mobile: 5s–10 min), image

	

16:9 or 1:1 at >=1080 x 1080 px (16:9 example: 1920 x 1080 px)

	

Accepted: 16:9 or 1:1 (1:1 to 16:9). Out-of-range behavior: unknown.

	

unknown

	

Primary text 125 chars; Headline 40 chars; Description: n/a

	

Yes

	

https://www.facebook.com/business/help/817989058548892, https://www.facebook.com/business/ads-guide/update/video/facebook-instream-video (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

Facebook Video Feeds (Legacy placement name)	

Not listed in current 2026 Meta aspect ratio (682655495435254) or video length (817989058548892) help pages (unknown if completely retired or merged into In-Stream Video / Reels)

	unknown	unknown	unknown	unknown	unknown	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/817989058548892 (Date: unknown, Grade: C)

Threads Feed	

Single image, single video, carousel image

	

Single Image/Video: 4:5 at 1440 x 1800 px (or 1080 x 1350 px; min width 500 px). Carousel: 1:1 at >=1080 x 1080 px

	

Accepted: 1.91:1 to 9:16 (1.91:1, 16:9, 1:1, 4:5, 2:3, 9:16). Behavior: Single image or video taller than 4:5 is vertically center-cropped to 4:5; carousel card not 1:1 is center-cropped to 1:1.

	

Keep critical content within central 4:5 (single media) or 1:1 (carousel) crop window; no UI percentage overlay listed.

	

Primary text (caption): 80–160 chars recommended; 1,000 chars hard max (longer will not deliver; no hashtags or URLs supported in captions). Headline: n/a; Description: n/a.

	unknown	

https://www.facebook.com/business/help/682655495435254, https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

WhatsApp Status (Added current placement)

	

Image, video (up to 60 min)

	

9:16 recommended for both images and videos (pixel resolution: unknown)

	

Accepted: 1.91:1, 16:9, 1:1, 4:5, 9:16. Out-of-range behavior: unknown.

	

unknown

	

unknown

	

unknown

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/817989058548892 (Date: unknown, Grade: A)

Audience Network Native, Banner, and Interstitial	

Single image (up to 30 MB), single video (1–120s)

	

>=398 x 208 px (min width 398 px); ratio varies by ad unit

	

Accepted: 16:9, 4:5, 9:16. Out-of-range behavior: unknown.

	

unknown

	

Primary text 125 chars; Headline 40 chars; Description 30 chars

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/817989058548892, https://www.facebook.com/business/ads-guide/update/image/audience-network-native (Date: unknown, Grade: A); https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B)

Audience Network Rewarded Videos (Added current placement)

	

Video (3–61s)

	

Recommended ratio and resolution: unknown

	

Accepted: 1.91:1, 4:5. Out-of-range behavior: unknown.

	

unknown

	

unknown

	

Yes

	

https://www.facebook.com/business/help/682655495435254, https://www.facebook.com/business/help/817989058548892 (Date: unknown, Grade: A)

Messenger Inbox (Retired November 2025)

	

Retired placement (absent from Meta's 2026 ratio and video length help pages; retired November 2025 per allplatforms.io)

	

Retired (n/a)

	

Retired (n/a)

	

Retired (n/a)

	

Retired (n/a)

	

No (Retired)

	

https://allplatforms.io/messenger/ (Date: unknown, Grade: B); absent from https://www.facebook.com/business/help/682655495435254 (Grade: A)

Messenger Sponsored Messages (Retired 31 July 2024)

	

Deprecated ephemeral inbox ad format on 31 July 2024; replaced by paid persistent Marketing Messages / Marketing Message API (launched 1 July 2025)

	

Retired (n/a)

	

Retired (n/a)

	

Retired (n/a)

	

Retired (n/a)

	

No (Retired)

	

https://meta-ads.si/can-i-still-run-messenger-sponsored-messages/ citing Meta Messenger documentation (Checked: 2 Oct 2026, Grade: B)

Facebook Instant Articles (Retired 20 April 2023)

	

Retired placement starting 20 April 2023 (announced 2 Feb 2023 in Graph/Marketing API v16.0); ad sets using it exclusively were paused

	

Retired (n/a)

	

Retired (n/a)

	

Retired (n/a)

	

Retired (n/a)

	

No (Retired)

	

https://meta-ads.si/can-i-still-use-instant-articles-for-ads/ citing Meta Developer Post of 2 Feb 2023 (Checked: 2 Oct 2026, Grade: B)

  
Part 2: Organic Post Specifications (Facebook Pages and Instagram Professional Accounts)

Simulating organic posts requires modeling two divergent layout engines: Instagram's dual feed-versus-profile-grid geometry and Facebook's orientation-driven multi-photo collage builder. On Instagram, the primary architectural shift is the decoupling of the feed post container from the profile grid thumbnail. In the native Instagram mobile application, single-photo and carousel posts now support aspect ratios ranging from 1.91:1 landscape (1080 x 566 px) up to a tall 3:4 portrait ceiling (1080 x 1440 px) without cropping. However, Meta's developer publishing APIs—and consequently third-party scheduling platforms—continue to enforce a 4:5 (1080 x 1350 px) maximum vertical aspect ratio. Meanwhile, the Instagram profile grid renders every post thumbnail strictly as a 3:4 vertical rectangle. When a user uploads a native 3:4 (1080 x 1440 px) image directly in the app, the image populates both the feed and the profile grid with zero cropping. When a 4:5 (1080 x 1350 px) image is published, it displays in full 4:5 inside the main scrolling feed, but the 3:4 profile grid fits the 1350 px height and clips approximately 33 px (~3.1%) from both the left and right edges, rendering a central tile of ~1013 x 1350 px (roughly 93.8% of the horizontal width). Square 1:1 (1080 x 1080 px) and landscape 1.91:1 (1080 x 566 px) posts likewise display uncropped in the main feed while undergoing horizontal center-cropping to 3:4 on the profile grid.   

On Facebook Pages, single-image organic posts render across three primary aspect ratios: 1:1 square (1080 x 1080 px or 1440 x 1440 px, rendering at 492 x 492 px in the standard desktop feed container), 4:5 portrait (1080 x 1350 px or 1440 x 1800 px, up to 2048 x 3072 px max, rendering at 492 x 738 px), and 1.91:1 landscape (1200 x 630 px or 1080 x 566 px). When a creator uploads multiple images in a single post, Facebook's layout engine constructs a grid collage governed by the total photo count and the orientation of the first (hero) image. Once the photo count reaches five, Facebook standardizes on a 2-over-3 horizontal split (for square and portrait sets) or a 2-left-by-3-right vertical split (for landscape sets); for six or more photos, the layout remains frozen at the five-photo geometry while superimposing a translucent +N counter over the bottom-right tile.   

Organic Post Format & Parameter	Official / Verified Specification	Viewport Cropping, Safe Zone & Layout Behavior	Source URL, Last Updated Date & Grade
Instagram Feed Photo (Allowed ratios, portrait limit & profile grid thumbnail crop)	

Allowed Ratios: 1.91:1 (1080 x 566 px) up to 3:4 (1080 x 1440 px), including 16:9 (1080 x 608 px), 1:1 (1080 x 1080 px), and 4:5 (1080 x 1350 px); max file size 30 MB (JPG/PNG). Portrait Limit: 3:4 (1080 x 1440 px) in the native Instagram app; 4:5 (1080 x 1350 px) via Meta's developer API and third-party scheduling tools.

	

Profile Grid Crop: All posts render as a 3:4 vertical rectangle on the profile grid. A native 3:4 (1080 x 1440 px) post shows uncropped. A 4:5 (1080 x 1350 px) post displays full in the feed, but on the 3:4 profile grid it renders at ~1013 x 1350 px, clipping ~33 px (~3%) from the left and right edges (leaving the center ~93.8% width visible). 1:1 and 1.91:1 posts are center-cropped horizontally to fit the 3:4 grid tile.

	

https://grid34sync.com/instagram-grid-size (Date: 2026, Grade: B); https://mediasizes.com/instagram-photo-size/ (Date: 2026, Grade: B); https://camclo3d.com/tools/instagram-grid-maker (Date: unknown, Grade: B); https://spreadcast.app/resources/social-media-image-sizes (Date: unknown, Grade: B)

Instagram Carousel (Max items, mixed ratios & slide 1 behavior)	

Max Items: Up to 20 photos or videos in a single swipeable post (citing Instagram's help page on sharing multiple photos). Supported Ratios: 1:1, 4:5, 3:4, 1.91:1 (1080 x 1440 px 3:4 or 1080 x 1350 px 4:5 recommended; max 30 MB per image, 4 GB per video).

	

Mixed Ratios: Instagram now supports mixed aspect ratios within a single organic carousel post, though keeping all slides at the same dimensions (3:4 or 4:5) is recommended for smooth scrolling. Does Slide 1 Set Ratio for All: In-app mixed ratios are supported (mediasizes.com); whether Slide 1 still locks ratio in API/third-party publishing is unknown in the retrieved sources.

	

https://mediasizes.com/instagram-photo-size/ (Date: 2026, Grade: B); https://spreadcast.app/resources/social-media-image-sizes (Date: unknown, Grade: B)

Instagram Reel (Ratio, max posting length & profile grid cover crop)	

Ratio & Size: 9:16 at 1080 x 1920 px (formats: MP4, MOV; max file size: 4 GB; cinematic ultra-wide 5120 x 1080 px also noted). Max Length for Posting: 90 seconds in-app (up to 3 minutes for some accounts) / up to 60 minutes for uploaded videos.

	

Cover Image Crop in Profile Grid: Cover photo is 1080 x 1920 px (9:16), and the center 1080 x 1440 px (3:4) area is visible on the profile grid. Safe Zone: Keep text and logos within the center 1080 x 1420 px area (avoid top ~250 px and bottom ~340 px).

	

https://mediasizes.com/instagram-photo-size/ (Date: 2026, Grade: B); https://grid34sync.com/instagram-grid-size (Date: 2026, Grade: B)

Facebook Reel (Organic ratio, max length & cover crop)	

Ratio & Size: 9:16 at 1080 x 1920 px. Max Length for Organic Posting: unknown (ad specs list no max in Ads Guide or 90s / 15 min in secondary ad guides, but organic limit is unstated).

	

Cover Image Crop in Profile Grid: unknown for organic Facebook Reels. Safe Zone: Unified 9:16 Reel safe zone keeps top 14%, bottom 35% (40% with disclaimer), and sides 6% (or center 1080 x 1420 px) clear.

	

https://moda.app/resources/sizes/facebook-ad (Updated: 28 Aug 2026, Grade: B); https://www.facebook.com/business/help/980593475366490 (Date: unknown, Grade: A)

Instagram Story & Facebook Story (Organic ratio & safe-zone %)	

Ratio & Size: 9:16 at 1080 x 1920 px for both Instagram and Facebook Stories (IG Story max length: 60 seconds per slide; max 30 MB image JPG/PNG, 4 GB video MP4/MOV/GIF).

	

Safe Zone for Text: Keep text ~250 px (~13%–14%) from top and bottom edges on IG Stories (mediasizes.com), or apply Meta's unified 9:16 Story rule: top 14%, bottom 35% (images) or bottom 20% (340 px video), and sides 6% (or center 1080 x 1420 px / bottom 340–670 px).

	

https://mediasizes.com/instagram-photo-size/ (Date: 2026, Grade: B); https://buffer.com/resources/social-media-image-sizes/ (Date: unknown, Grade: B); https://www.facebook.com/business/help/980593475366490 (Date: unknown, Grade: A)

Facebook Photo Post (Single) & Multi-Photo Post ("Album" Style)	

Allowed Single-Photo Ratios & Sizes: Square (1:1): 1080 x 1080 px, 1200 x 1200 px, or 1440 x 1440 px (renders 492 x 492 px in desktop feed container). Portrait (4:5): 1080 x 1350 px or 1440 x 1800 px (max 2048 x 3072 px; renders 492 x 738 px). Landscape (1.91:1 / 16:9): 1200 x 630 px, 1200 x 627 px, or 1080 x 566 px (max file size 8 MB; album cover 1200 x 628 px). Max Photos in One Facebook Post: unknown (not stated in sources).

	

Feed Layout by Image Count (492 px reference container): 2 Photos: Square: Two 1:1 (245 x 246 px) side-by-side; Portrait: Two 1:2 (245 x 492 px) side-by-side; Landscape: Two 1.9:1 stacked vertically. 3 Photos: Square/Horizontal Hero: Top 2:1 (492 x 245 px or 1920 x 960 px upload; or 3:2 landscape) over two bottom 1:1 (245 x 245 px or 1920 x 1920 px) or two 1.9:1 side-by-side; Portrait Hero: Left 1:2 (327 x 492 px or 960 x 1920 px) beside two right stacked 163 x 245 px (1:1 / 4:5). 4 Photos: Square: 2x2 grid of four 1:1 (245 x 245 px / 1920 x 1920 px); Horizontal Hero: Top 3:2 (1920 x 1280 px) over three bottom 1:1 (1920 x 1920 px) side-by-side; Portrait Hero: Left 2:3 (327 x 492 px / 1280 x 1920 px) beside three right stacked (163 x 245 px top/bottom, 163 x 162 px middle). 5 Photos: Square/Portrait: Top two 1:1 (245 x 245 px / 1920 x 1920 px) over bottom three 1:1 (163 x 163 px left/right, 162 x 163 px middle / 1000 x 1000 px); Landscape: Left two stacked 1:1 (245 x 245 px) beside right three stacked 3:2 (163 x 163 px top/bottom, 145 x 162 px middle). 6+ Photos: Same as 5-photo layout, with a +N count overlay on the bottom-right image.

	

https://litcommerce.com/blog/facebook-image-sizes/ (Date: unknown, Grade: B); https://designsensory.com/insights/social-media-safe-zone/ (Date: unknown, Grade: B); https://sphereagency.com/articles/facebook-size-guide (Date: 2025, Grade: B); https://buffer.com/resources/social-media-image-sizes/ (Date: unknown, Grade: B)

Caption Length Limit & Truncation ("more" / "See more")	

Organic Max Caption Length (IG & FB Page): unknown (not stated in retrieved sources; note Threads hard max is 1,000 chars). Instagram Hashtag Cap: 30 hashtags max.

	

Where Caption Is Cut ("See more" / "more"): For Instagram Feed and Facebook Feed, copy truncates on mobile after 125 characters (Facebook Feed primary text specification also cites 50–150 characters before truncation; Instagram/Facebook Reels truncate at 44 characters).

	

https://www.addogs.ai/blog/meta-ad-sizes (Updated: 25 Oct 2026, Grade: B); https://moda.app/resources/sizes/facebook-ad (Updated: 28 Aug 2026, Grade: B); https://www.tryvizup.com/blog/meta-ad-specs-2026-every-dimension-size-you-need (Date: 2026, Grade: B)

  
Part 3: Ads Manager Campaign Objectives and Delivery Statuses

Meta Ads Manager organizes campaign creation around its six Outcome-Driven Ad Experiences (ODAX) objectives: Awareness, Traffic, Engagement, Leads, App promotion, and Sales. Selecting a campaign objective locks the underlying machine-learning optimization events available at the Ad Set level and restricts compatible ad formats and call-to-action buttons. Once a campaign is published, its objective is immutable; changing the business goal requires pausing the existing campaign and instantiating a new one.   

In the Ads Manager reporting interface, the Delivery column communicates real-time auction state across three hierarchical tiers: Campaign, Ad Set, and Ad. Because status labels are evaluated independently at each tier, a parent Campaign can display Active while a child Ad Set or individual Ad sits in In review, Learning limited, or Off. Meta categorizes every status label under one of five high-level status icons—Error, Warning, Pending, Active, and Inactive—and surfaces thirteen specific delivery statuses.   

Category	Item Name in Ads Manager	Official Definition & Operational Behavior	Source URL, Last Updated Date & Grade
Campaign Objective	Awareness	

Optimizes delivery to reach the maximum number of people in a target audience or maximize impressions and ad recall lift to build brand familiarity.

	

https://apzom.com/meta-ads-for-local-businesses/ citing Meta Business Help Center (Date: unknown, Grade: B); https://www.kontentino.com/social-media-urban-dictionary/campaign-objective/ (Date: unknown, Grade: B)

Campaign Objective	Traffic	

Optimizes delivery to send users to a designated destination (website, landing page, or app), prioritizing link clicks or landing page views.

	

https://docs.flamel.ai/solutions/paid/choose-the-right-meta-ad-yype-for-your-campaign (Date: unknown, Grade: B); https://www.adstellar.ai/blog/instagram-ad-campaign-setup-guide (Date: 2026, Grade: B)

Campaign Objective	Engagement	

Optimizes delivery for users likely to interact with content through likes, comments, shares, video views, or event and community responses.

	

https://docs.flamel.ai/solutions/paid/choose-the-right-meta-ad-yype-for-your-campaign (Date: unknown, Grade: B); https://apzom.com/meta-ads-for-local-businesses/ (Date: unknown, Grade: B)

Campaign Objective	Leads	

Optimizes delivery to capture prospect contact data, appointment requests, or phone inquiries via Instant Forms, website conversion tracking, or messaging.

	

https://docs.flamel.ai/solutions/paid/choose-the-right-meta-ad-yype-for-your-campaign (Date: unknown, Grade: B); https://www.adstellar.ai/blog/instagram-ad-campaign-setup-guide (Date: 2026, Grade: B)

Campaign Objective	App promotion	

Optimizes delivery to drive mobile or desktop application installs or specific in-app engagement events.

	

https://apzom.com/meta-ads-for-local-businesses/ citing Meta Business Help Center (Date: unknown, Grade: B); https://www.kontentino.com/social-media-urban-dictionary/campaign-objective/ (Date: unknown, Grade: B)

Campaign Objective	Sales	

Optimizes delivery for high-intent users likely to complete a transaction, such as online purchases, bookings, add-to-cart, or initiate-checkout events (requires Pixel/CAPI).

	

https://docs.flamel.ai/solutions/paid/choose-the-right-meta-ad-yype-for-your-campaign (Date: unknown, Grade: B); https://www.adstellar.ai/blog/instagram-ad-campaign-setup-guide (Date: 2026, Grade: B)

Delivery Status Icon	Error / Warning / Pending / Active / Inactive	

Error: Item cannot run because a blocking problem needs attention. Warning: Delivery is limited; fixing it may improve performance. Pending: Not running yet (in review or scheduled). Active: On and running as expected. Inactive: Stopped running (completed or switched off).

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ citing Meta Help Center "View campaign, ad set or ad delivery status in Meta Ads Manager" (Checked: 2 Oct 2026, Grade: B); https://leadenforce.com/blog/understanding-facebook-ad-statuses-common-issues-and-how-to-fix-them (Date: unknown, Grade: B)

Delivery Status	Active	

The ad is running normally as planned, or the parent campaign/ad set contains at least one child ad that is currently running normally.

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Learning	

The ad set and all its ads are in the learning phase while Meta's delivery system explores how best to deliver the ad; performance is less stable and CPAs are typically higher until ~50 optimization events occur within 7 days of the last significant edit.

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B); https://convertbomb.com/blog/facebook-ad-status-guide (Date: unknown, Grade: B)

Delivery Status	Learning limited	

The ad set is not generating enough optimization events to exit the learning phase (unlikely to reach ~50 results in 7 days after a significant edit, or for Shops ads, 17 website + 5 on-Meta purchases in 7 days) due to small audience, low budget/bid, or rare event.

	

https://leadenforce.com/blog/understanding-facebook-ad-statuses-common-issues-and-how-to-fix-them (Date: unknown, Grade: B); https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	In review	

The ad is currently being checked against Meta's Advertising Standards (typically within 24–48 hours), after which it becomes active and runs as scheduled.

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Processing	

The ad is being updated with recent user changes; typically takes a few minutes, though certain updates can take up to 8 hours before transitioning to active, in review, or error.

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Preparing	

The ad has passed policy review and the system is matching it to the right bid and audience; once it logs at least 1 impression, it enters Learning or Active (significant edits return an ad here).

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Scheduled	

The ad or ad set is configured to start delivering at a designated future date and time.

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Rejected	

The ad does not comply with Meta's Advertising Standards and is blocked from delivery.

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	No ads	

The campaign or ad set is switched on, but it contains no published or active ads to deliver.

	

https://leadenforce.com/blog/understanding-facebook-ad-statuses-common-issues-and-how-to-fix-them (Date: unknown, Grade: B); https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Ads off / Ad set off	

The parent campaign is switched on (Active), but one or more child ad sets or ads inside it have been turned off.

	

https://leadenforce.com/blog/understanding-facebook-ad-statuses-common-issues-and-how-to-fix-them (Date: unknown, Grade: B); https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Off (Replaces legacy "Paused" label in current UI)	

The item's toggle is switched off—either manually by the user, automatically by an automated rule, or upon reaching its scheduled end.

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Completed	

The scheduled end date and time for the campaign or ad set has elapsed.

	

https://meta-ads.si/facebook-ad-delivery-status-meanings/ (Checked: 2 Oct 2026, Grade: B)

Delivery Status	Not delivering	

The ad, ad set, or campaign is not running due to a non-policy operational issue—such as an unavailable or shared page post, an unpublished Page, an expired offer or event, a missing product ID or empty catalog set, or reaching the account spending limit.

	

https://leadenforce.com/blog/understanding-facebook-ad-statuses-common-issues-and-how-to-fix-them (Date: unknown, Grade: B); https://convertbomb.com/blog/facebook-ad-status-guide (Date: unknown, Grade: B)

  
Conflicts and Changes Since 2024

Between July 2024 and October 2026, Meta executed several structural updates to its advertising placements, organic profile grids, and API attribution windows, while leaving notable internal contradictions across its own Help Center and Ads Guide properties. A developer constructing a preview tool must account for these discrepancies by supporting both the updated 1440 px high-density specifications and the legacy 1080 px equivalents of identical aspect ratio, and by exposing toggleable viewport modes where official documentation conflicts.   

Master Ad Resolution Upgrade (1080 px vs. 1440 px Width): In 2026, Meta's Ads Guide updated recommended master resolutions from 1080 x 1350 px (4:5) and 1080 x 1920 px (9:16) to 1440 x 1800 px (4:5), 1440 x 2560 px (9:16), and 1440 x 1440 px (1:1 in select specs), increasing pixel count by 78% for high-density mobile screens. However, Meta's own Instagram Feed Video Ads Guide page still lists 1080 x 1920 px, and several secondary 2026 guides (tryvizup.com, growwithsakib.com, superscale.ai) continue to cite 1080 x 1350 px and 1080 x 1920 px.   

Instagram Profile Grid Shift (1:1 to 3:4) and API Portrait Ceiling (4:5 vs. 3:4): Instagram replaced its legacy 1:1 square profile grid (used from 2010–2024) with a 3:4 vertical rectangle grid, though secondary sources disagree on the exact completion date (citing January 2025 in layerproof.app, early 2025 in pixgrid.io, August 2025 in grid34sync.com, and late 2025 in mediasizes.com and linearity.io). Furthermore, while the native Instagram app accepts 3:4 (1080 x 1440 px) uploads uncropped, Meta's developer API still caps third-party schedulers at 4:5 (1080 x 1350 px). Secondary sources also conflict on how a 4:5 upload is cropped on the 3:4 grid: grid34sync.com demonstrates mathematically that 4:5 (1080 x 1350 px) is fitted vertically and clipped horizontally by ~33 px (~3%) per side to ~1013 x 1350 px, whereas pixgrid.io erroneously states that 4:5 posts are trimmed at the top and bottom.   

Facebook Right Column Aspect Ratio and Video Support Conflict: Meta's Ads Guide (facebook-right-hand-column) recommends a 1:1 square image (>=1080 x 1080 px), whereas Meta's Business Help Center table (682655495435254) recommends 1.91:1 for both images and videos while accepting both 1.91:1 and 1:1. Additionally, tryvizup.com claims Right Column does not support video (N/A), contradicting Meta's Help Center (682655495435254), wittelsbach.ai, and copyfy.io, which confirm video support from 1 second to 241 minutes.   

Vertical 9:16 Safe-Zone Variations Across Stories, Reels, and Disclaimers: Meta's Ads Guide specifies top 14% (358 px), bottom 35% (896 px), and sides 6% (86 px) on a 1440 x 2560 px canvas for Stories images and Reels, but lists top 14% (250 px) and bottom 20% (340 px) with no side margins for Facebook Stories videos and Messenger Stories. Meanwhile, growwithsakib.com cites a March 2026 unified safe zone of 1080 x 1420 px (top 250 px, bottom 340–670 px), and Meta's Help Center (980593475366490) requires leaving the bottom 40% clear on Reels ads that include a disclaimer.   

Stories and Reels Video Duration Discrepancies: Meta's Business Help Center (817989058548892) caps Facebook Stories video ads at 1 to 120 seconds, whereas Meta's Ads Guide lists 1 second to 3 minutes. For Reels ads, secondary guides (tryvizup.com, growwithsakib.com) cite a 90-second maximum, whereas Meta's Ads Guide lists 0 seconds to 15 minutes for Instagram Reels and lists no maximum length for Facebook Reels (and addogs.ai notes that the Facebook Reels Ads Guide URL returned "not found" in October 2026 testing).   

Messenger Ad Placement Retirements (2024–2026): Meta deprecated Messenger Sponsored Messages on 31 July 2024 and launched the replacement Marketing Message API on 1 July 2025. Secondary tracker allplatforms.io reports that Meta retired Messenger Inbox ads in November 2025 (corroborated by its absence from Meta's 2026 ratio and video length help pages) and claims Messenger Stories ads retired in August 2026, even though Messenger Stories remains actively listed in Meta's Help Center (682655495435254) and Ads Guide (messenger-story) as of October 2026.   

Facebook Feed Expansion and Collection UI Relocation (March 2026): Starting in March 2026, Meta expanded the Facebook Feed placement to automatically include the Facebook Friends tab. In March 2026, Meta also removed the Collection format from the main Ad Setup view and relocated it under Ad Creative > Format Display settings.   

Ads Insights API View-Through Attribution Deprecation (January 2026): Announced on 16 October 2025 and effective 12 January 2026, Meta removed the 7d_view (7-day view) and 28d_view (28-day view) attribution windows from the Ads Insights API, retaining 1d_click, 7d_click, 28d_click, 1d_engaged_view, and 1d_view.   

Full List of Sources
Grade A: Official Meta Pages (Meta Business Help Center, Meta for Developers, Meta Ads Guide)

Meta Business Help Center — Aspect ratios supported by placements: https://www.facebook.com/business/help/682655495435254 (Last updated date: not shown on page; verified October 2026; Grade: A).   

Meta Business Help Center — Video length specifications across placements: https://www.facebook.com/business/help/817989058548892 (Last updated date: not shown on page; verified October 2026; Grade: A).   

Meta Business Help Center — About text overlays and the Safe Zone: https://www.facebook.com/business/help/980593475366490 (Last updated date: not shown on page; verified October 2026; Grade: A).   

Meta Business Help Center — Best practices for aspect ratios: https://www.facebook.com/business/help/103816146375741 (Last updated date: not shown on page; checked 2 October 2026; Grade: A).   

Meta Business Help Center — Recommended minimum image pixel requirements: https://www.facebook.com/business/help/469767027114079 (Last updated date: not shown on page; checked 2 October 2026; Grade: A).   

Meta Business Help Center — About Advantage+ placements (Events Manager Help): https://eventsmanager.facebook.com/business/help/257909294629950 (Last updated date: not shown on page; notes March 2026 Facebook Friends tab update; Grade: A).   

Meta Business Help Center — About Advantage+ placements: https://www.facebook.com/business/help/ipad-app/1044825198987622?helpref=faq_content&locale=en_US (Last updated date: not shown on page; Grade: A).   

Meta for Developers — Marketing API Threads Ads Creation: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation (Last updated date: not shown on page; verified 25 October 2026; Grade: A).   

Meta Ads Guide — Facebook Feed (Image, Video, Carousel): https://www.facebook.com/business/ads-guide/update/image/facebook-feed, https://www.facebook.com/business/ads-guide/update/video/facebook-feed, https://www.facebook.com/business/ads-guide/update/carousel/facebook-feed, https://www.facebook.com/business/ads-guide/update/image, https://www.facebook.com/business/ads-guide/update/video (Last updated date: not shown on pages; verified October 2026; Grade: A).   

Meta Ads Guide — Facebook Stories (Image, Video, Carousel): https://www.facebook.com/business/ads-guide/update/image/facebook-story, https://www.facebook.com/business/ads-guide/update/video/facebook-story, https://www.facebook.com/business/ads-guide/update/carousel/facebook-story (Last updated date: not shown on pages; verified October 2026; Grade: A).   

Meta Ads Guide — Facebook Reels (Image, Video, Carousel): https://www.facebook.com/business/ads-guide/update/image/facebook-facebook-reels, https://www.facebook.com/business/ads-guide/update/video/facebook-facebook-reels, https://www.facebook.com/business/ads-guide/update/carousel/facebook-facebook-reels (Last updated date: not shown on pages; read 2 October 2026 by wittelsbach.ai, returned 404 on 25 October 2026 per addogs.ai; Grade: A).   

Meta Ads Guide — Instagram Placements (Feed Image, Feed Video, Explore Home Image, Stories Image, Stories Video, Reels Video): https://www.facebook.com/business/ads-guide/update/image/instagram-feed, https://www.facebook.com/business/ads-guide/update/video/instagram-feed, https://www.facebook.com/business/ads-guide/update/image/instagram-explore-home, https://www.facebook.com/business/ads-guide/update/image/instagram-story, https://www.facebook.com/business/ads-guide/update/video/instagram-story, https://www.facebook.com/business/ads-guide/update/video/instagram-reels (Last updated date: not shown on pages; verified October 2026; Grade: A).   

Meta Ads Guide — Marketplace, Right Column, In-Stream Video, Messenger Story, Audience Network, Carousel, and Collection: https://www.facebook.com/business/ads-guide/update/image/facebook-marketplace, https://www.facebook.com/business/ads-guide/update/image/facebook-right-hand-column, https://www.facebook.com/business/ads-guide/update/video/facebook-instream-video, https://www.facebook.com/business/ads-guide/update/image/messenger-story, https://www.facebook.com/business/ads-guide/update/image/audience-network-native, https://www.facebook.com/business/ads-guide/update/carousel, https://www.facebook.com/business/ads-guide/update/collection (Last updated date: not shown on pages; verified October 2026; Grade: A).   

Grade B: Reputable Secondary Sources

Wittelsbach AI — Facebook Ad Sizes and Specs: https://www.wittelsbach.ai/blog/facebook-ad-sizes-and-specs (Last updated: 2 October 2026; Grade: B).   

AdDogs — Meta Ad Sizes 2026 (Facebook, Instagram, Messenger, and Threads): https://www.addogs.ai/blog/meta-ad-sizes (Last updated: 25 October 2026; Grade: B).   

Moda — Facebook Ad Specs (1440x1800px Feed Ads 2026 Guide): https://moda.app/resources/sizes/facebook-ad (Last updated: 28 August 2026; Grade: B).   

Copyfy — Complete Guide to Facebook Ads Video Formats: https://www.copyfy.io/en/blog/video-size-facebook-ads (Last updated: not shown, 2026; Grade: B).   

TryVizup — Meta Ad Specs 2026: https://www.tryvizup.com/blog/meta-ad-specs-2026-every-dimension-size-you-need (Last updated: 2026; Grade: B).   

Grow With Sakib — Meta Ad Formats: https://growwithsakib.com/meta-ad-formats/ (Last updated: 2026; Grade: B).   

SuperScale AI — Meta Ad Sizes: https://superscale.ai/learn/meta-ad-sizes (Last updated: verified week of 12 May 2026; Grade: B).   

Grid34Sync — Instagram Grid Size 2026 (1080x1350px Upload, 3:4 Display): https://grid34sync.com/instagram-grid-size (Last updated: 2026; Grade: B).   

MediaSizes — Instagram Photo Size 2026: https://mediasizes.com/instagram-photo-size/ (Last updated: 2026; Grade: B).   

PixGrid — Instagram 3:4 Grid Maker: https://pixgrid.io/instagram-grid-3x4-maker (Last updated: not shown, 2026; Grade: B).   

CamClo3D — Instagram Grid Maker: https://camclo3d.com/tools/instagram-grid-maker (Last updated: not shown, 2026; Grade: B).   

LayerProof — Instagram Post Size & Social Media Image Sizes: https://layerproof.app/blog/instagram-post-size/, https://layerproof.app/blog/social-media-image-sizes/ (Last updated: 2026; Grade: B).   

Linearity — Instagram Size Guide: https://www.linearity.io/blog/instagram-size-guide?ref=vectornator-blog (Last updated: 2026; Grade: B).   

Luminest — Your Instagram Grid Went Vertical: https://luminest.io/post/instagram-grid-went-vertical (Last updated: 4 July 2026; Grade: B).   

SocialKit — Instagram Grid Changes: https://socialk.it/en/blog/instagram-grid-changes (Last updated: 21 July 2026; Grade: B).   

Viraly — Instagram Image Sizes: https://viraly.io/blog/instagram-image-sizes (Last updated: 2026; Grade: B).   

Spreadcast — Social Media Image Sizes: https://spreadcast.app/resources/social-media-image-sizes (Last updated: not shown, 2026; Grade: B).   

LitCommerce — Facebook Image Sizes: https://litcommerce.com/blog/facebook-image-sizes/ (Last updated: not shown; Grade: B).   

Buffer — Social Media Image Sizes: https://buffer.com/resources/social-media-image-sizes/ (Last updated: not shown; Grade: B).   

DesignSensory — Social Media Safe Zone: https://designsensory.com/insights/social-media-safe-zone/ (Last updated: not shown; Grade: B).   

Sphere Agency — Facebook Size Guide: https://sphereagency.com/articles/facebook-size-guide (Last updated: 2025; Grade: B).   

SO9 — The Common Social Media Image Sizes Cheat Sheet: https://so9.io/blog/the-common-social-media-image-sizes-cheat-sheet (Last updated: not shown; Grade: B).   

Pace — Facebook Image Sizes: https://www.pace.edu.vn/tin-kho-tri-thuc/kich-thuoc-anh-dang-facebook (Last updated: not shown; Grade: B).   

WikiHow — How to Post Multiple Photos on Facebook: https://www.wikihow.com/Post-Multiple-Photos-on-Facebook (Last updated: not shown; Grade: B).   

Flamel AI — Choose the Right Meta Ad Type for Your Campaign: https://docs.flamel.ai/solutions/paid/choose-the-right-meta-ad-yype-for-your-campaign (Last updated: not shown; Grade: B).   

Kontentino — Campaign Objective: https://www.kontentino.com/social-media-urban-dictionary/campaign-objective/ (Last updated: not shown; Grade: B).   

Apzom — Meta Ads for Local Businesses: https://apzom.com/meta-ads-for-local-businesses/ (Last updated: not shown; Grade: B).   

AdStellar AI — Instagram Ad Campaign Setup Guide: https://www.adstellar.ai/blog/instagram-ad-campaign-setup-guide (Last updated: 2026; Grade: B).   

Voice123 — Meta Ads Guide: https://voice123.com/blog/marketing-trends-tactics/meta-ads/ (Last updated: not shown; Grade: B).   

AllPlatforms — Messenger Ad Placements: https://allplatforms.io/messenger/ (Last updated: not shown, 2026; Grade: B).   

Meta-Ads.si — Delivery Statuses, Sponsored Messages, Instant Articles, and Attribution Updates: https://meta-ads.si/facebook-ad-delivery-status-meanings/, https://meta-ads.si/can-i-still-run-messenger-sponsored-messages/, https://meta-ads.si/can-i-still-use-instant-articles-for-ads/, https://meta-ads.si/why-did-28-day-view-attribution-stop/, https://meta-ads.si/what-replaced-the-relevance-score-for-judging-ads/ (Sources checked: 2 October 2026; Grade: B).   

LeadEnforce — Understanding Facebook Ad Statuses: https://leadenforce.com/blog/understanding-facebook-ad-statuses-common-issues-and-how-to-fix-them (Last updated: not shown; Grade: B).   

ConvertBomb — Facebook Ad Status Guide: https://convertbomb.com/blog/facebook-ad-status-guide (Last updated: not shown; Grade: B).   

Conclusion: Architectural Recommendations for Preview Tool Implementation

To ensure deterministic accuracy across all 2026 Meta surfaces, the preview tool's rendering engine should decouple asset validation from viewport simulation. At the ingestion layer, the validator should accept 1440 x 1800 px (4:5), 1440 x 2560 px (9:16), and 1080 x 1080 px (1:1) as primary ad masters while seamlessly permitting legacy 1080 x 1350 px and 1080 x 1920 px files without false resolution warnings. At the viewport simulation layer, the engine must implement conditional container transforms: applying horizontal side-clipping (~3.1% per side) when previewing a 4:5 upload inside Instagram's 3:4 profile grid, forcing vertical center-cropping to 4:5 (single media) or 1:1 (carousel) on Threads Feed, rendering 1:1 pillarboxing when previewing 4:5 video on Desktop Facebook Feed, and dynamically switching between the 35% and 40% bottom safe-zone masks on Reels whenever a disclaimer toggle is active. Finally, for organic Facebook multi-photo posts, inspecting the aspect ratio of the first uploaded image (1:1, <1:1 portrait, or >1:1 landscape) alongside the array length (1 through 6+) allows the preview canvas to render the exact 492 px collage geometry and +N overflow badge prior to publication.   

Report unsafe content
Opens in a new window
