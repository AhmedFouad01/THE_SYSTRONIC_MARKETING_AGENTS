# SPARK-MO-001 · Ad requirements, AI-label rules and setup scoring for Motion AG · 2026-10-10
Agent: tsst-spark (SPARK_AG) · Skills: SPARK-SK-004 (Meta specs, hypotheses, QA), SPARK-SK-006 (TikTok specs, policy preflight), SPARK-SK-001 (KPI/test logic, decision cadence) · Brand t-sag / tsst-ai · Status NOT_READY · Plans only: no launch, no account touched, no spend.
Labels (as LENS): **O** official page read; **O\*** official domain, snippet only (Lead: open it); **T** third party; **NC** not confirmed. [n] = source below. All checked 2026-10-10. Tool facts and prices are LENS-MO-001 as given; not repeated.

## 1. Specs and safe zones (what the agent's output must satisfy)
| Item | Meta (Reels / Stories / Feed) | TikTok (In-Feed) | YouTube Shorts (cheap add) |
|---|---|---|---|
| Aspect | 9:16 for Reels/Stories O [1][3] | 9:16 recommended; 1:1, 16:9 allowed O [10] | 9:16 recommended O\* [25] |
| Resolution | Reels ad spec 1440x2560 O [2]; Stories rec. 1080x1920, min 600x1067 O\* [4]; Feed 1080x1920 O\* [4]. Whether 1080x1920 is accepted for Reels = NC | min 540x960 O [10]; 720x1280 suggested O\* [12] | 1080x1920 O\* [25] |
| Length | Reels ad 0 s to 15 min O [2]; Stories length NC | 5-60 s, recommended 9-15 s O\* [11][12]; **conflict**: auction page says up to 10 min O [10] (page is old) | 6-60 s; only first 60 s show O\* [25] |
| File | MP4, MOV, 4 GB O [2]; Stories file size NC | mp4/mov/mpeg/3gp/avi, 500 MB, bitrate >=516 kbps O [10] (reservation page says >=2,500 kbps O\* [11]) | NC (Demand Gen snippet only) |
| Sound | On by default in Reels O [1] | Video must have sound O\* [12] | On by default O\* [25] |
| Safe zone | **Reels: 14% top, 35% bottom, 6% each side, no text/logos/key elements** O [2]. At 1080x1920 = 269 px top, 672 px bottom, 65 px sides, leaving a 950x979 px safe box (calculated from the O percentages). Stories-specific zone = NC | **No pixel values published**: only downloadable files; **Arabic region has its own RTL safe-zone file** O [10]. Ad caption max 4 lines, about 100 chars O\* [18]; non-Spark captions are white, no links/hashtags O [10] | NC |
- Rule for one master: use the Meta Reels 14/35/6 box for all placements (conservative, our inference), then check TikTok's RTL file in the Ads Manager preview. Text overlays are HTML from code-motion, so move them by one parameter.
- Volume guidance. **TikTok:** 3-5 meaningfully different creatives per ad group and 3-5 ad groups O\* [18] (older page says 5-10); refresh when delivery declines, no fixed day count; do not duplicate ad groups to extend life O\* [18]; Smart Creative tests new videos 3-5 days at <=10% of budget O\* [19]. **Meta:** no per-ad-set creative count found (NC). App-campaign page: up to 50 assets and "refresh a few times a month" O\* [20]. A/B tests: one variable, 2 weeks up to 30 days, assets must differ enough O\* [20]. These are platform hints, not laws; our own test sizes are SPARK recommendations below.
- **Durations worth producing: 6 / 15 / 30 s.** 15 s = primary (inside TikTok's 9-15 s advice, easy for Meta). 6 s = hook-only cutdown (above TikTok 5 s minimum; Veo clips are 4/6/8 s [21]). 30 s = story/proof cut for retargeting and Stories/Shorts. Reasoning is SPARK judgement from the specs above, not a platform rule.

## 2. AI-content rules (launch-blocking)
| Question | Meta | TikTok |
|---|---|---|
| Must advertiser disclose? | **Mandatory only for social-issue, electoral or political ads** with digitally created/altered image, video or audio, including third-party AI tools O [5][6]. Full trigger list (photorealistic person/event that did not happen, altered real footage, real person saying/doing what they did not; resize/sharpen exempt) is T only [8]; official full text NC | **Mandatory for all ads**: media "completely AI-generated" or significantly AI-modified O [13][14]. Also: primary subject doing/saying what they did not (voice clone). Minor edits (lighting, background removal, denoise) exempt O [13]. "If uncertain, label" O [13] |
| How | No advertiser toggle found for commercial ads; Meta labels itself | "AI-generated content" toggle in Ads Manager (label at bottom of in-feed ad for whole ad) or own clear caption/watermark/sticker O [13][14]. Toggle locks after submit and **resets on campaign duplication** O\* [15]; feature may be missing on some accounts (ask sales rep) O [14] |
| Auto-label | "AI info" on ads made with Meta's gen-AI features, **and images created/edited with third-party tools** O [5] (en-GB version of the same page says third-party is not labelled: pages differ, treat third-party as labelable). Video-ad labelling = NC. Organic: labels from "industry standard indicators" or self-disclosure O [7]; C2PA/IPTC named only in the 2024 post O\* [9]. Rollout gradual | TikTok reads C2PA Content Credentials and auto-labels, images and video first O [16] (2024-05-09); an auto-label cannot be removed O\* [17]. Ads page does not mention C2PA O [13] |
| Penalty | Undisclosed political/social ad is rejected; repeat = penalties O\* [6][8] | Undisclosed AIGC ad "rejected or restricted" O [13] |
| Egypt-specific | Searched for Egyptian AI-labelling or advertising rules: **none found = NC.** Ask a local lawyer before any political, religious or public-figure content. Not a launch clearance | same |

**What it means for our tools**
- **Veo:** "watermarked using SynthID" O [21]. **C2PA on Veo output = NC** (Google blog [22] names Search/Ads/YouTube, not generators; Vertex Content Credentials page [28] exists but body unread). Runway: platforms read C2PA O [23], but Runway embedding is only a safety-page claim O\* [24]. Seedance/Kling C2PA = T only [26]. ElevenLabs/Gemini TTS = NC. SynthID is invisible; Meta/TikTok are not shown to read it.
- **Does it change the setup pick? No.** (1) Our final file is re-encoded by ffmpeg/code-motion overlay, which can strip metadata, so no tool gives a reliable C2PA trail either way. (2) The decision follows the content: TikTok needs the toggle for any fully AI video regardless of metadata. (3) Meta commercial ads: no advertiser rule found, but expect "AI info" on detection; political/social needs disclosure. So **default = disclose on TikTok; on Meta follow the decision step in section 4.** Test one real upload on each platform in the pilot to see if any auto-label appears.
- **Veo region limit:** in EU/UK/CH/MENA, only `allow_adult` is allowed for person generation O [21]: no generated children in Egyptian family scenes (Egypt not named; MENA is).
- Veo 3.1 IDs are Preview O [21]: policy and output can change; recheck before each batch.

## 3. Scoring of LENS's 3 setups (1 = worst, 5 = best)
Weights (SPARK judgement, sum 100): variant throughput 25 · AI-label compliance risk 25 · cost per tested creative 20 · spec/safe-zone fit 15 · speed brief-to-test-ready 15.
| Criterion (weight) | Budget | Balanced | Premium | Basis |
|---|---|---|---|---|
| Throughput/month (25) | 2 | 4 | 2 | Budget: 3-5 ads from Flow quota, Ahmed clicks; Balanced: prepaid credits ~4 ads at $50 but locked video x5 hooks; Premium: ~4 ads at $150 |
| Label risk (25) | 3 | 3 | 2 | All carry SynthID, C2PA NC. Premium adds lip-sync/identity refs = more photoreal people, more modified output |
| Cost per tested creative (20) | 5 | 4 | 1 | 5 variants: $0 cash / $11.20 (=$2.24 each) / $48.85 (=$9.77 each; $7.28 voice-over only) |
| Spec + safe-zone fit (15) | 3 | 4 | 5 | Budget: Veo Lite 720p default, 1080p only at 8 s [21]; Premium reaches 1080p/4K and is closest to Meta's 1440x2560 |
| Speed to test-ready (15) | 2 | 3 | 2 | Budget manual, quota-gated; Balanced automatable via connector later; Premium shot QA + AE |
| **Weighted total /5** | **3.00** | **3.60** | **2.25** | e.g. Balanced = (4x25+3x25+4x20+4x15+3x15)/100 |
**Verdict: I agree with LENS: Balanced as spec, run Budget-first.** Budget wins on cost but loses on volume and speed; Premium loses on cost and label risk. Scores are judgement on LENS numbers, not measured; only the cost row is arithmetic. Platform results will not prove incrementality.

## 4. Motion AG v1 ad-delivery checklist (every ad job)
1. **Brief gate:** objective, market (EG, Arabic/Egyptian), placement list, conversion event valid (else stop), landing page ready.
2. **Masters:** 9:16, 1080x1920 min, MP4 H.264, audio on, sound-designed. Upscale to 1440x2560 only if Meta rejects or flags 1080 (NC).
3. **Cutdowns:** 6 s hook / 15 s main / 30 s proof. Meta: Reels + Stories + Feed 9:16; TikTok: In-Feed; Shorts only if the client buys it.
4. **Hooks x variants:** 3 hooks (different first 3 s) x 2 variants (voice or text, one variable) = **6 per platform max**; 3-5 live per ad group; hold the rest as refresh stock.
5. **Safe zone:** text/logo/CTA inside 950x979 box (269 top / 672 bottom / 65 sides); TikTok caption <=4 lines; no static still >50% of time; check TikTok Arabic RTL file.
6. **Captions:** Arabic overlay by code-motion, RTL checked, on-screen text readable muted on Meta (sound is default-on but not guaranteed), voice present for TikTok.
7. **AI-disclosure decision:** (a) fully/mostly AI video or voice-cloned or realistic person? **TikTok: toggle ON** (re-tick after every duplicate). (b) Political/social/electoral topic? **Meta: disclose, plus Egypt legal check.** (c) Real person or public figure? Written consent, else stop. (d) Record decision + screenshot in the job file.
8. **Rights/QA:** licensed music only, no unsupported claims, CREATIVE_AG visual QA, no generated children (MENA limit).
9. **Naming:** `CLIENT_CAMPAIGN_CONCEPT_HOOK_VAR_DUR_RATIO_LANG_TOOL_AI_Rn`, e.g. `CL01_TEASER_C1_H2_V1_15s_9x16_arEG_VEO31F_AI1_R1`. Fields: H=hook, V=variant (voice/text), AI1 = disclosure on, TOOL = model for later cost/quality reads. Use the same string as Meta ad name and TikTok ad name, so UTMs join to results.
10. **Test rule:** one variable per test, predeclared metric and stop rule, Meta 2-4 weeks; no winner call from platform-attributed numbers alone.

## 5. Pilot add-on: 15 s Egyptian teaser (check only, no launch)
- **Spec pass:** 9:16, 1080x1920, MP4, sound present, 15.0 s, file <500 MB. **Flag:** LENS plans 3 x 5 s shots, but Veo makes only 4/6/8 s clips [21]: use 4+4+8 or 6+6+4 and trim; 1080p on Lite/Fast needs 8 s clips.
- **Safe zones:** export a frame at 1s, 7s, 14s and overlay the 269/672/65 px box; Arabic text and CTA inside; check TikTok RTL file in preview.
- **Label decision:** per step 7; log whether footage has realistic people; on TikTok toggle ON; upload once to each platform in a draft/preview state only to see any auto-label (no spend, Ahmed's go needed).
- **Hook variants ready:** 3 hooks (voice and text only, video locked), named per step 9, each tied to a one-line hypothesis (for example H1 question, H2 price/offer, H3 social proof) and a primary metric (3-s hold / CTR) chosen before launch.
- Also confirm: Egyptian voice approved by Ahmed, no on-camera Arabic speech, music license, Veo Preview status recheck.

## Sources (checked 2026-10-10)
1. O · facebook.com/business/ads/facebook-instagram-reels-ads
2. O · facebook.com/business/ads-guide/update/video/instagram-reels
3. O\* · facebook.com/business/help/103816146375741 (aspect-ratio best practices; fetch returned title only, snippet used)
4. O\* · facebook.com/business/help/2222978001316177 (Stories requirements; title only, snippet used) and facebook.com/business/ads-guide/update/video/instagram-feed
5. O · meta.com/help/artificial-intelligence/355108217670024 (AI info for ads; en-GB and default versions differ)
6. O · about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/
7. O · transparency.meta.com/governance/tracking-impact/labeling-ai-content (updated 2025-02-19)
8. T · socialmediatoday.com and nbcnews.com on Meta's 2023-24 AI political-ad disclosure trigger list
9. O\* · about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/ (C2PA/IPTC detection, snippet)
10. O · ads.tiktok.com/help/article/tiktok-auction-in-feed-ads?lang=en
11. O\* · ads.tiktok.com/help/article/tiktok-reservation-in-feed-ads-reach-frequency
12. O\* · ads.tiktok.com/help/article/video-ads-specifications and /resources/help/article/tiktok-ads-policy-ad-format-and-functionality
13. O · ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content
14. O · ads.tiktok.com/help/article/about-ad-disclaimers-in-tiktok-ads-manager
15. O\* · ads.tiktok.com/help/article/add-disclaimers-to-ads (toggle lock/reset, snippet)
16. O · newsroom.tiktok.com/en-us/partnering-with-our-industry-to-advance-ai-transparency-and-literacy (2024-05-09)
17. O\* · support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content (redirects; body unread; snippet)
18. O\* · ads.tiktok.com/help/article/creative-best-practices (snippet; also TopView/in-feed safe-zone and caption notes)
19. O\* · ads.tiktok.com/resources/help/article/smart-creative
20. O\* · facebook.com/business/help/711378409718185 (app ads volume/refresh) and /135668260430624 (A/B tips)
21. O · ai.google.dev/gemini-api/docs/veo (SynthID, 9:16, 4/6/8 s, personGeneration MENA, Preview)
22. O · blog.google/innovation-and-ai/products/google-gen-ai-content-transparency-c2pa/ (2024-09-17; no generator named)
23. O · dev.runwayml.com/learn/commercial-use (platforms read C2PA)
24. O\* · runwayml.com/safety (Runway C2PA, snippet)
25. O\* · support.google.com/google-ads/answer/16041697 and /13704860 (Shorts, snippet)
26. T · mindstudio.ai, c2paviewer.com (Seedance/Kling C2PA claims)
27. L · LENS-MO-001_video-agent-setups.md (tool facts, prices, setups)
28. O\* · docs.cloud.google.com/vertex-ai/generative-ai/docs/content-credentials (page exists; body not read = NC)
Count: 12 O, 13 O\*, 2 T, 1 L. Not found or NC: Egypt rule; Meta per-ad-set creative count; Stories length/safe zone; TikTok safe-zone pixels; Veo/Flow/Gemini TTS C2PA; Meta C2PA trigger for video ads; Reels acceptance of 1080x1920.

---
**Lead review 2026-10-10:** ACCEPTED as input. Opened 9 cited URLs ([2] [4] [5] [10] [12] [13] [14] [15] [21]). 7 match; [4] still shows the title only (stays NC). **One correction:** the TikTok spec page [12] says "up to 10 minutes", gives no 5-60 s range and no sound rule. So TikTok length = up to 10 min (O, [10]+[12] agree); the "5-60 s / must have sound" claim = NC. The 6/15/30 s set still stands as SPARK judgement. Scoring maths and safe-zone pixels re-checked: correct. Friction logged (SK-004, SK-006).
