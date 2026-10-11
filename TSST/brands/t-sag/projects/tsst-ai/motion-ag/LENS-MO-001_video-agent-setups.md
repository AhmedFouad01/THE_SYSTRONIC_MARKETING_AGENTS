# LENS-MO-001 · Video-agent setups for Motion AG · 2026-10-10
Agent: tsst-lens (LENS_AG) · Skills: SK-001 (question plan), SK-002 (claim grading), SK-003 (tool matrix, OBSERVED/INFERRED/UNKNOWN) · Brand t-sag / tsst-ai · Status NOT_READY · Nothing generated, no credits spent.
Labels: **O** = official page of the vendor; **O\*** = official domain, but the page was JS-rendered or blocked, so the fact comes from the search snippet of that page (Lead: open it); **T** = third-party; **L** = local evidence; **NC** = not confirmed. Numbers in [ ] = sources at the end. All checked 2026-10-10.

## 1. Comparison table (flagship, price, rights, access)
Capabilities (9:16, refs, start/end frame, audio) come from our connector catalog [26] (L) and are shown as 9:16 / refs / frames / audio.

| Tool | Flagship now | Subscription | API $/s | Commercial rights / indemnity | API/MCP | 9:16 · refs · frames · audio |
|---|---|---|---|---|---|---|
| Sora (OpenAI) | **DEAD**: app ended 2026-04-26 O\* [2]; Videos API + sora-2/pro shut 2026-09-24 O [1] | none (not in ChatGPT Plus) | none (old list $0.10/$0.30 = T [27]) | moot | none | n/a |
| Veo (Google) | Veo 3.1 / Fast / Lite; Gemini Omni 1.1 Flash | AI Pro 1,000 Flow credits, EGP 939.99 in Egypt O [5]; Veo 3.1 Lite "limited trial" (see 3) | Gemini API: Std $0.40 (720/1080p), $0.60 4K; Fast $0.10/0.12/0.30; Lite $0.05/0.08; Omni ~$0.10 at 720p; with audio O [3]. Runway resells Veo at $0.40/$0.15 O [4] | Output indemnity exists for GA models on Google Cloud, unmodified output, paid service O\* [21]. Veo 3.1 IDs on the Gemini API are "preview", so indemnity for them = NC | Yes API; connector yes | yes · 3 img · yes · yes (Omni: 8 img+3 vid refs, no sfx) |
| Kling | 3.0 (Omni3, Turbo, Motion Control) | Standard ~$8.8/mo 660 cr up to Ultra ~$160/mo O\* [19] | official $ NC (JS page [19b]); T: ~$0.084 (EvoLink) to $0.17–0.34 (Novita) [23] | Paid plans include commercial use; Basic free does not O\* [19]. Indemnity NC | Yes API (new keys for 3.0 Turbo T); connector yes | yes · yes · yes · yes |
| Seedance (ByteDance) | 2.5 (Pro, connector rank 1 "sota"); 2.0 Fast/Mini | via Runway/Magnific/Higgsfield | Official = tokens: $10.70/M (480-720p) O\*/T [22]; derived ~$0.10/s 480p, ~$0.23/s 720p, ~$0.57/s 1080p = T-derived; official per-second NC | NC | BytePlus ModelArk (status of first-party access disputed T); connector yes | yes · image+video+audio refs · yes · yes, 4–30 s |
| MiniMax / Hailuo | H3 (2K), H3-Max (480/768p drafts); Hailuo 2.3 | n/a | H3 $0.08/s 768p, $0.13/s 2K; H3-Max $0.05/s 480p, $0.08/s 768p (images beyond free quota extra) **O** [7] | NC | Yes API; connector yes | yes · yes · yes · no sfx |
| Runway | Gen-4.5 (also Seedance 2.0/2.5, Kling 3.0, Veo, Aleph 2.0 inside) | Std $12, Pro $28, Max $76/mo annual (625/2,250/9,500 cr) O [10] | Gen-4.5 $0.12; Gen-4 Turbo $0.05; Veo 3.1 $0.40 O [4] | NC (page silent) | API + "Runway MCP" on Pro O [10]; connector (gen45) | yes · no refs · start frame · no audio |
| Higgsfield | aggregator: Seedance, Kling, Wan, MiniMax, Veo, own | plan prices NC (page JS; T lists $9–$99 conflicting) | API balance in USD, $5 min top-up; Kling 3.0 ~$0.084/s T | "you hold the rights per ToS" O\* [24] | API + MCP (O\*) | follows underlying model |
| Luma | Ray 3.2 | NC | per clip: 5 s = $0.15 (540p), $0.30 (720p), $1.20 (1080p) O [9] | NC (page silent) | API yes | yes · NC · NC · NC; not in our connector |
| Wan (Alibaba) | 3.0 / 3.0-prime | n/a | wan3.0-video $0.05 / 0.10 / 0.20 per s at 480/720/1080p (30% promo); prime $0.068 / 0.14 / 0.28 O [8] | NC | Alibaba Model Studio API; connector (private flag) | yes · yes · yes · yes |
| Strongest beyond list | **Seedance 2.5** by connector rank, **Veo 3.1 Fast** by verified price/quality, native audio, 9:16, and it sits inside our Google plan | | | | | |

**Our existing subscriptions, video content (task 1):**
- **Google AI Pro**: 1,000 Flow units/month used with Gemini Omni Flash; "limited trial" of Veo 3.1 Lite (page in Arabic, Egypt listing) O [5]. The Google One help table (T/O\* [6]) lists Veo 3.1 Fast = 20 credits/gen (about 50 gens) and Lite = 10 credits (about 100 gens) and warns limits change; the two Google pages disagree, so **verify in Ahmed's account before planning**.
- **ChatGPT Plus**: no Sora (see above). Codex is not a video tool.
- **Magnific Premium** ($14.50–20/mo, 240K credits/year; Kling 2.5 "unlimited all year") O\* [20]. Credit rates per second: Kling 3.0 70–90, Veo 3.1 Fast 100, Lite 40, Seedance 2.5 440 at 720p. So 240K credits = about 2,400 s of Veo Fast per year (about 200 s/month). Using the MCP still spends credits even for "unlimited" models. Which Magnific tier Ahmed owns = NC.
- **Claude connector**: 46 video models (catalog [26]); per-credit price and Claude Pro metering = NC (do not assume free).

## 2. Arabic layer
- **ElevenLabs Egyptian**: official evidence is weak. Docs list Arabic (Saudi, UAE) for Multilingual v2/Flash v2.5; Eleven v3 "70+ languages" with no list; **Egyptian dialect is not in the docs** O [12]. The ElevenLabs blog says to pick "accent Egypt" voices in the Voice Library, names no model or voice (updated 2026-10-06) O [13]. The Gemini report's voice names "Haytham/Adam" are **not confirmed** (Famulor, a T catalog, lists an Adam and an Ahmed Yahia; Salesforce lists "Amir" for v3). Price O [11]: $0.08/1K characters (v3, Multi v2), $0.04 Flash; Starter $6, Creator $22, Pro $99/mo. Commercial TTS terms NC on the pricing page.
- **Gemini TTS**: the Google docs list **"Egyptian Arabic" as supported** on gemini-3.8-flash-tts and flash-lite-tts O [14]. This is the only official Egyptian-dialect claim found, and it fits Ahmed's Gemini plan. Price NC (not fetched). **Plan: A/B one Egyptian line on Gemini TTS vs ElevenLabs "accent Egypt" voice; Ahmed's ear decides.**
- **Lip-sync (Arabic evidence)**: Sync Labs works from audio waveform and claims "virtually any language" (O\* [18]); lipsync-2-pro $0.067–0.083/s, sync-3 $0.107–0.133/s; $1.50 per ad in the Gemini report was an estimate and the real maths is about $2.49 per 30 s. Arabic itself is NC. OmniHuman 1.5: documented languages ZH/EN/JA/KO/ES/ID, Arabic NC (T [25]). Kling lip-sync: ZH/EN/JA/KO/ES, Arabic not listed (T [25]). Veed Fabric / Sync 2.0 (connector): no language list found. **Rule for v1: no on-camera Arabic speech. Use voice-over, shots without visible mouths, until a 5 s Arabic lip-sync test passes.**
- **"ffmpeg cannot shape Arabic" is REFUTED.** drawtext got shaping in 2014 (FriBidi, ticket #3758) and moved to HarfBuzz in 2023 (O [15]); the `text_shaping` default is true. Local test on our ffmpeg 9.0.2 (built with libass, libharfbuzz, libfribidi): drawtext with Cairo rendered "مرحبا بكم في فيلا" joined and right-to-left correctly (L [16]). Caveat: raw ffmpeg gives no layout control (animation, mixed AR/EN lines, styling), so keep HTML overlays for all text; use ffmpeg for concat/mux only.

## 3. Assembly / edit for an agent
| Option | Arabic RTL | Agent-fit | Cost | Verdict |
|---|---|---|---|---|
| code-motion (HTML→MP4) + ffmpeg | Browser shaping, proven in house; ffmpeg verified [16] | Local, scriptable, no new tool | $0 | **Use now** (alpha text overlay, concat, mux audio) |
| Remotion | Chromium DOM, so shaping works; RTL reports are community only (T), official docs silent [17] | Best long-term: React compositions + Claude Code | Free up to 3 people (agency headcount only, if only MP4 is delivered); otherwise $25/seat/mo or $0.01/render with $100/mo minimum O\* [17] | Later, when automating; not needed for v1 |
| After Effects (manual) | Works (Ahmed's setup) | Not agent-drivable | owned | Premium finishing only |
| CapCut | not checked (no official fetch) | no agent API known | NC | skip; **NC** |

## 4. The three setups (real AI shots in all three; no slideshow)
Assumptions (stated): 30 s final, 6 shots of ~5 s, **iteration ratio 3x** (90 s generated), one voice take set = 0.5 min at $0.08/min list ($0.12 with 3 retakes), image-to-video from one approved master frame per shot. Prices are official list prices from section 1; connector credit prices may differ (NC). Gemini report figures: $0.15 / $7.65 / $28.65 (not usable: Gen-3 and Sora gone).

### Setup 1: Budget (only what we pay for)
| Step | Tool / model | Who | Human checkpoint |
|---|---|---|---|
| Brief + Egyptian script + JSON shot list | Claude (LENS) | team-prepared | Ahmed OKs script/storyboard |
| Master reference frames | Connector image tool or Magnific | team-prepared prompts, Ahmed generates | Ahmed approves frames |
| Shots | Veo 3.1 Lite/Fast (Flow, AI Pro credits) + Kling 2.5 (Magnific, unlimited), image-to-video, 9:16 | Ahmed manual; automatable later via connector | pick best take per shot |
| Voice | Gemini TTS Egyptian Arabic (Gemini plan) | Ahmed manual; automatic-later | Ahmed listens |
| Arabic text | code-motion alpha overlay | team automatic (local) | visual QA |
| Assemble + mix | ffmpeg concat/mux; AE optional | team automatic | final cut review |
- **Monthly new cost: $0.** Quota limit: Flow 1,000 credits = 180 credits per ad (Lite, 18 gens x 10) to 360 (Fast, 18 x 20), so about **3–5 ads/month**; Kling 2.5 via Magnific adds more clips, silent.
- **One 30 s ad:** cash $0; API-equivalent value 90 s x $0.08 (Lite 1080p) = $7.20 + voice $0. **5 hook variants:** video locked; 5 voice renders + 5 text overlays = $0 cash (about $0.40 at ElevenLabs list if used).
- **Effort:** low–medium. **Risks:** quota refill and Veo 3.1 Lite quality unproven; Flow vs Gemini app tier conflict; no on-camera speech; Ahmed is the generation bottleneck (about 18 clicks per ad).

### Setup 2: Balanced (add pay-per-use quality, official prices)
| Step | Tool / model | Who | Checkpoint |
|---|---|---|---|
| Script, shot JSON, frames | as Setup 1 | team-prepared | script + frames approved |
| Draft staging (optional) | MiniMax H3-Max 480p $0.05/s | Ahmed manual; automatic-later (connector) | choose composition |
| Final shots | **Veo 3.1 Fast 1080p + native ambient audio** ($0.12/s) or Seedance 2.5 Pro for refs/audio control | Ahmed via connector UI/Flow; **automatic-later** via connector slug | per-shot pick (sample 2 of 6 only) |
| Voice | ElevenLabs Creator ($22) Egyptian voice or Gemini TTS | Ahmed / automatic-later | listen |
| Text + assemble | code-motion + ffmpeg | automatic | final review |
- **Monthly: +$22** (ElevenLabs Creator, optional) + prepaid credits (about $50 = 4 ads).
- **One ad:** 90 s x $0.12 = $10.80 + voice $0.12 = **$10.92**. **5 variants:** $10.80 + 5 x $0.08 = **$11.20** (the saving comes from locking video).
- **Effort:** medium (connector tuning, prompt templates). **Risks:** Veo 3.1 "preview" status and no confirmed indemnity; connector credit prices unquoted; ElevenLabs Egyptian unproven.

### Setup 3: Premium (hero/anthem work)
| Step | Tool / model | Who | Checkpoint |
|---|---|---|---|
| Script, frames | Claude + Magnific upscale | team-prepared | Ahmed + client approve frames |
| Hero shots | Veo 3.1 Standard 1080p ($0.40/s; 4K $0.60) or Seedance 2.5 Pro 1080p; refs for identity | Ahmed manual; automatic-later | shot-by-shot QA (big budget only) |
| Voice | ElevenLabs Creator/Pro or Gemini TTS | Ahmed | listen + client |
| Lip-sync (only if speaker on camera) | Sync lipsync-2-pro $0.083/s | Ahmed; **Arabic test mandatory** | Arabic native review |
| Text + final | code-motion alpha overlay -> After Effects | manual | final approval |
- **Monthly: +$22 (voice) + $19 (Sync Creator, if used)** + credits (about $150 = 4 ads).
- **One ad:** 90 s x $0.40 = $36.00 + voice $0.12 + lip-sync 30 s x $0.083 = $2.49 = **$38.61** ($36.12 without lip-sync). **5 variants:** $36.00 + 5 x ($0.08 + $2.49) = **$48.85** with lip-sync per variant ($36.40 voice-over only).
- **Effort:** high. **Risks:** cost; Arabic lip-sync unproven; indemnity only with Vertex GA + paid + unmodified output, so a composited Arabic overlay is "modified" (indemnity likely NC for our use).

## 5. Recommendation
**Motion AG v1 = Setup 2 (Balanced) as the specification, run Budget-first.** Reason: Budget is real AI video and costs nothing extra, but quota allows only 3–5 ads/month and Veo Lite quality is untested; Balanced adds about $11 per ad (30 s, 3x) for official-priced Veo 3.1 Fast with native audio and keeps every step manual-now / automatic-later through the connector we already have. Premium is justified per project, not as a standing setup, and carries Arabic lip-sync and indemnity unknowns. The assembly layer stays code-motion + ffmpeg (Arabic proven locally), with Remotion deferred. Sora is gone, so the Gemini Premium path is void; Veo 3.1 / Seedance 2.5 replace it.

**Pilot (needs Ahmed's go and cost OK, about $3–8 of credits):** one 15 s 9:16 Egyptian-dialect teaser, 3 shots, same frames and shot JSON run on (a) Veo 3.1 Lite/Fast in Flow and (b) Seedance 2.5 or Kling via connector; one Egyptian voice line on Gemini TTS vs ElevenLabs; 3 hook variants by voice and text only; one 5 s Arabic lip-sync test on Sync (free trial) as a side check. Pass criteria: 9:16 shots usable in 3 gens or fewer, voice judged Egyptian by Ahmed, Arabic overlay clean, total effort under 1 hour for Ahmed.

## Sources (checked 2026-10-10)
1. O · developers.openai.com/api/docs/deprecations (Videos API, sora-2, sora-2-pro shut 2026-09-24)
2. O\* · help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation (fetch 403; snippet: app ended 2026-04-26, notice 2026-03-24)
3. O · ai.google.dev/gemini-api/docs/pricing (Veo 3.1, Fast, Lite, Omni)
4. O · docs.dev.runwayml.com/guides/pricing (credits $0.01)
5. O · gemini.google/subscriptions (AI Pro, Egypt listing, 1,000 Flow units, Lite trial)
6. O\* · support.google.com/googleone/answer/16287445 and support.google.com/flow/answer/16526234 (credits per gen, via snippet; conflicts with [5])
7. O · platform.minimax.io/docs/guides/pricing-paygo (H3, H3-Max)
8. O · alibabacloud.com/help/en/model-studio/model-pricing (Wan 3.0, Singapore)
9. O · lumalabs.ai/api/pricing (Ray 3.2)
10. O · runway.com/pricing (plans)
11. O · elevenlabs.io/pricing/api
12. O · elevenlabs.io/docs/overview/capabilities/text-to-speech (languages)
13. O · elevenlabs.io/blog/egyptian-accent-text-to-speech (marketing; updated 2026-10-06)
14. O · ai.google.dev/gemini-api/docs/speech-generation ("Egyptian Arabic")
15. O · trac.ffmpeg.org/ticket/3758; ffmpeg-devel 2014 text_shaping patch; ffmpeg-cvslog 2023-06 HarfBuzz commit
16. L · local `ffmpeg -version` / `-h filter=drawtext` and an Arabic drawtext render (scratchpad, not saved to repo)
17. O\* · remotion.dev/docs/license/faq and /license/pricing (snippet; RTL claims T/community)
18. O\* · sync.so/docs/models/lipsync, sync.so/pricing, support FAQ (snippets)
19. O\* · kling.ai/app/membership/membership-plan and kling.ai/docs/point-policy (snippet); 19b kling.ai/dev/pricing fetched but JS, no numbers
20. O\* · magnific.com/pricing and magnific.com/ai/docs/ai-video-generator-credits (snippet)
21. O\* · cloud.google.com/terms/generative-ai-indemnified-services (snippet)
22. T · cometapi.com/seedance-2-5-api-pricing, atlascloud.ai Seedance 2.5 pricing (BytePlus docs.byteplus.com fetched, no price table)
23. T · evolink.ai, novita.ai, atlascloud.ai Kling pricing
24. O\* · higgsfield.ai/creator-hub/help-center (API, rights) ; T · creatify.ai Higgsfield pricing
25. T · scenario.com help, atlascloud.ai Kling lip-sync guide (language lists)
26. L · motion-ag/connector-video-models_2026-10-10.txt
27. T · magichour.ai, laozhang.ai Sora price pages (historical only)
Count: 21 official-domain entries (13 read directly = O; 8 via search snippet = O\*), 2 local (16, 26), 5 third-party entries (22, 23, 24b, 25, 27).

---
**Lead review 2026-10-10:** ACCEPTED as input. Opened 9 cited URLs ([1] [3] [5] [7] [8] [9] [10] [12] [14]); all match. The NC items stay open. Friction logged (SK-002, SK-003). Next: SPARK round, pending Ahmed's go.
