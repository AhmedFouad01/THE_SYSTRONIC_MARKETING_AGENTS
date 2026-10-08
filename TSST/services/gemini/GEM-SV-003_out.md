> **Lead review 2026-10-08: PARTIAL. The process and templates are kept as generic defaults. ALL policy and compliance facts are NOT CONFIRMED.**
> - Lead opened 10 of the 25 URLs. Only 2 are good: TikTok split-test best practices ✓ and Google Ads "Healthcare and medicines" ✓. The TikTok industry-entry link and Google 2423645 redirect to generic or merged pages. Five are dead: Meta "Personal Health" (311756586071496) and Meta "Learning phase" (749554315241088) are Page Not Found; TikTok ad-specs no longer exists; **both EDA links are 404**.
> - So the claims "EDA pre-approval via PROMAT" (rule 12), Meta/TikTok 18+ targeting and the before/after rules are **unverified** here. They must be checked on the live official pages (SPARK, with WebFetch) before any ANVIL ad goes out. "Scale ≤20 %" is agency folklore, not a cited Meta rule.
> - Process breach: the tool read TSST boot.md despite the ROLE block. On GEM-SV-001 it ran shell commands despite "no shell".

# Part 1 — Campaign process
A structured campaign transforms a business need into a measurable result through defined stages and client approval gates.

**Campaign Stages:**
1. **Brief:** Defining objectives, audience, and constraints.
2. **Strategy:** Market research, channel selection, and budget allocation. *(Client Approval Gate)*
3. **Concept / Big Idea:** Developing the creative theme and core message. *(Client Approval Gate)*
4. **Ad Matrix:** Planning variations, formats, and placements.
5. **Production:** Creating visual assets and copy. *(Client Approval Gate)*
6. **Pre-launch QA:** Policy compliance check, tracking setup, and QA.
7. **Launch:** Deploying the campaign across channels.
8. **Optimisation:** Real-time monitoring, A/B testing, and budget shifting.
9. **Report:** Strategic analysis and learnings. *(Client Approval Gate)*

**Campaign Brief Template:**
*   **Objectives & KPIs:** Primary goal (e.g., CPA, ROAS, Lead Volume).
*   **Target Audience:** Buyer personas, demographics, pain points.
*   **Context & Constraints:** Budget, timeline, competitor insights, brand guidelines.
*   **Key Messages:** Core value proposition.

**Creative Brief Template:**
*   **Objective:** What action should the user take?
*   **Audience Persona:** Who are we talking to?
*   **Core Problem / Hook:** What stops their scroll in the first 3 seconds?
*   **Key Value Proposition:** The solution or benefit.
*   **Required Formats & Specs:** e.g., 9:16 Video, 4:5 Image.
*   **Call to Action (CTA):** Next step (e.g., Shop Now).

---

# Part 2 — Creative mix
The creative mix should align with the objective and funnel stage:
*   **Awareness (Top of Funnel):** Short, high-impact videos (10-15s), broad appeal, focusing on brand identity and the core problem.
*   **Consideration/Traffic (Middle of Funnel):** 15-30s videos, carousels showcasing features, user testimonials, clear value propositions.
*   **Conversions/Sales (Bottom of Funnel):** Strong CTAs, User-Generated Content (UGC), dynamic product catalogs, targeted offers.

**Native Best Practices by Placement:**
*   **Meta (Reels / Stories):** Vertical 9:16 format. Native aesthetics without heavy commercial production. Keep text out of the bottom and right-side UI safe zones.
*   **Meta (Feed):** 4:5 or 1:1 image/video format to maximize screen real estate.
*   **TikTok (In-Feed / Spark Ads):** Vertical 9:16, 20–35 seconds sweet spot. Fast-paced editing, trend-aware audio, highly native feel. Essential to respect the UI safe zones.
*   **YouTube Shorts:** Vertical 9:16, 15–60 seconds. High utility and educational value. Loopable content works well.

**The First 3 Seconds:** Regardless of platform, the hook is critical. Avoid slow intros; use pattern interrupts, curiosity gaps, or pointed questions immediately.

---

# Part 3 — Ads inside vs outside the content plan
**Inside the Content Plan (Organic / Boosted Posts / Spark Ads):**
These are posts that live permanently on the brand's profile. 
*   **When to use:** For brand building, community engagement, leveraging existing organic traction, and maintaining a cohesive grid aesthetic.
*   **Spark Ads (TikTok) / Partnership Ads:** Leveraging organic posts (from the brand or creators) as paid ads. This utilizes authentic engagement signals (likes/comments) which boosts credibility and often lowers CPA.

**Outside the Content Plan (Dark Posts / Dedicated Ads):**
These ads appear in feeds but do not live on the brand's public profile.
*   **When to use:** For aggressive A/B testing of different hooks, copy, and visuals. This allows agencies to run dozens of variations without cluttering the organic feed with repetitive or highly sales-driven content.

---

# Part 4 — Testing and optimisation
**Creative Testing Structures:**
*   **Meta Advantage+ Creative:** Provide diverse assets and multiple text options. The system automates enhancements (cropping, brightness, text swapping) to find the winning combination per user.
*   **TikTok Split Testing (A/B Test):** Test *one* variable at a time (e.g., hook, targeting, bid). Maintain non-overlapping audiences. 

**Testing Rules:**
*   **Duration & Budget:** Run tests for a minimum of 7 days. Ensure budget is sufficient to achieve statistical significance (TikTok recommends 80% testing power / 90% confidence).
*   **No Mid-Test Changes:** Do not edit campaigns during the learning/testing phase.
*   **Decision Rules (Kill/Scale):** 
    *   *Kill:* Ad sets that spend 2-3x the target CPA without conversions, or have statistically lower performance after 7 days.
    *   *Scale:* Increase budget on winning ad sets gradually (e.g., 15-20% every few days) to avoid resetting the learning phase, or use Cost Cap bidding to scale efficiently.

---

# Part 5 — Supplements and health ad policy
Dietary supplements and weight loss products face strict, claims-based scrutiny across platforms.

**Platform Policies:**
*   **Meta:** Claims-based approach. Prohibits claims to "cure," "heal," or "prevent" diseases. Unrealistic results ("lose 10kg in 2 days") are banned. Weight loss/gain supplements *must* be targeted to 18+. Images focusing on negative self-perception or zooming on body parts (fat pinching) are prohibited. Before-and-after images are scrutinized heavily and rejected if paired with violative claims.
*   **TikTok:** Extremely strict. Prohibits exaggerated weight loss claims and content promoting harmful behaviors/negative body image. Weight management/muscle gain ads *must* be targeted to 18+. Many weight loss supplements (appetite suppressants, fat burners) are strictly prohibited on TikTok Shop.
*   **Google:** Supplements are a restricted category. Prohibits unapproved pharmaceuticals or implying a product can prevent/cure a disease. Focus on broad intent ("vitamins") rather than specific medical outcomes.

**Egypt-Specific Regulations (EDA):**
*   The **Egyptian Drug Authority (EDA)** requires **pre-approval** for all dietary supplement advertising materials via the PROMAT platform.
*   Claims must strictly align with the EDA's registered White Lists.

**Pre-launch Compliance Checklist:**
- [ ] Are all health claims realistic and avoiding "cure/prevent" language?
- [ ] Is the campaign strictly targeted to audiences 18+ (if weight management)?
- [ ] Does the visual avoid body-shaming, fat pinching, or unrealistic before/afters?
- [ ] Does the landing page content match the ad claims exactly without adding prohibited medical claims?
- [ ] (Egypt only) Has the specific creative received EDA approval via PROMAT?

---

# Part 6 — Measurement and reporting
**KPIs per Objective:**
*   **Awareness:** Reach, Impressions, CPM, Video Completion Rate.
*   **Consideration/Traffic:** Click-Through Rate (CTR), Cost Per Click (CPC), Landing Page Views.
*   **Conversions/Sales:** Cost Per Acquisition (CPA), Return on Ad Spend (ROAS), Total Purchases, Conversion Rate.

**Minimum Tracking Setup:**
*   **Meta:** Pixel + Conversions API (CAPI) configured with prioritized standard events.
*   **TikTok:** TikTok Pixel + Events API.
*   **Universal:** UTM parameters on all ad URLs for independent Google Analytics tracking.

**Reporting Cadence & Template:**
*   **Cadence:** Weekly pacing/optimization updates; in-depth Monthly strategic reports.
*   **Report Template Sections:**
    1.  **Executive Summary:** High-level performance vs. goals (What happened?).
    2.  **KPI Dashboard:** The core metrics (Spend, ROAS, CPA).
    3.  **Creative Performance:** Winners and losers (Which hooks/formats worked best?).
    4.  **Audience Insights:** Demographic and placement performance.
    5.  **Strategic Recommendations:** Next steps, testing hypotheses for the following month (What do we do now?).

---

# Part 7 — Playbook rule candidates
1. Every campaign starts with an approved written brief before production begins. (Agency Strategy Standard)
2. Always test one variable at a time in split tests to ensure clean data. (TikTok Business Help Center)
3. Weight loss and muscle gain supplement ads must be age-restricted to 18+. (Meta / TikTok Ad Policies)
4. Never use words like "cure," "heal," or "prevent" in dietary supplement copy. (Google / Meta Ads Policy)
5. TikTok split tests must run for a minimum of 7 days without mid-test edits. (TikTok Business Help Center)
6. Ensure landing page claims exactly match the ad copy to avoid ad disapproval. (Meta / Google Ad Policies)
7. Meta Advantage+ requires multiple text and creative variants to optimize effectively. (Meta Business Help Center)
8. Keep text overlays out of the right-hand and bottom safe zones on 9:16 videos. (TikTok / Meta Creative Best Practices)
9. Hook the viewer in the first 3 seconds with a visual or audio pattern interrupt. (Platform Creative Best Practices)
10. Use Dark Posts for aggressive conversion testing to keep organic feeds clean. (Agency Execution Standard)
11. Scale winning ad sets by a maximum of 20% every few days to avoid resetting the learning phase. (Meta Business Help Center)
12. All dietary supplement ads in Egypt must have EDA approval via PROMAT prior to launch. (Egyptian Drug Authority)
13. Implement both the browser Pixel and Server-Side API (CAPI) before launching conversion campaigns. (Meta / TikTok Business Help Center)
14. Use standardized UTM parameters on all ad links for accurate third-party tracking. (Agency Analytics Standard)
15. Client reports must include strategic recommendations and next steps, not just vanity metrics. (Agency Reporting Standard)

---

# Sources
1. https://www.facebook.com/business/help/311756586071496 (Meta Ad Policies: Personal Health, no date shown)
2. https://www.facebook.com/business/help/2489235377778604 (Meta: Advantage+ Creative, no date shown)
3. https://www.facebook.com/business/help/1126601471131461 (Meta: Advantage+ Placements, no date shown)
4. https://www.facebook.com/business/help/482869522197623 (Meta: Best Practices for Video Ads, no date shown)
5. https://www.facebook.com/business/help/749554315241088 (Meta: Understanding the Learning Phase, no date shown)
6. https://ads.tiktok.com/help/article/tiktok-advertising-policies-industry-entry (TikTok Ad Policies: Industry Entry, no date shown)
7. https://ads.tiktok.com/help/article/tiktok-advertising-policies-ad-creatives-landing-page (TikTok Ad Policies: Creatives & Landing Pages, no date shown)
8. https://ads.tiktok.com/help/article/split-test-best-practices (TikTok: Split Testing Best Practices, no date shown)
9. https://ads.tiktok.com/help/article/spark-ads-overview (TikTok: Spark Ads Overview, no date shown)
10. https://ads.tiktok.com/help/article/tiktok-video-best-practices (TikTok: Video Best Practices, no date shown)
11. https://support.google.com/adspolicy/answer/176031 (Google Ads Policy: Healthcare and medicines, no date shown)
12. https://support.google.com/adspolicy/answer/2423645 (Google Ads Policy: Unapproved pharmaceuticals and supplements, no date shown)
13. https://www.edaegypt.gov.eg/ar/%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D8%AE%D8%AF%D9%85%D8%A7%D8%AA-%D8%A7%D9%84%D8%B4%D8%B1%D9%83%D8%A7%D8%AA/%D8%A7%D9%84%D8%A5%D8%B9%D9%84%D8%A7%D9%86%D8%A7%D8%AA-%D9%88%D8%A7%D9%84%D9%85%D9%88%D8%A7%D8%AF-%D8%A7%D9%84%D8%AF%D8%B9%D8%A7%D8%A6%D9%8A%D8%A9/ (Egyptian Drug Authority: Advertising and Promotional Materials, no date shown)
14. https://www.edaegypt.gov.eg/ar/%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2-%D8%A7%D9%84%D8%A5%D8%B9%D9%84%D8%A7%D9%85%D9%8A/%D8%A7%D9%84%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1/%D9%87%D9%8A%D8%A6%D8%A9-%D8%A7%D9%84%D8%AF%D9%88%D8%A7%D8%A1-%D8%AA%D8%B7%D9%84%D9%82-%D9%85%D9%86%D8%B5%D8%A9-promat/ (Egyptian Drug Authority: PROMAT platform launch, no date shown)
15. https://www.facebook.com/business/tools/meta-pixel (Meta Pixel Setup, no date shown)
16. https://www.facebook.com/business/help/2040882565969969 (Meta Conversions API, no date shown)
17. https://ads.tiktok.com/help/article/tiktok-pixel-overview (TikTok Pixel Overview, no date shown)
18. https://ads.tiktok.com/help/article/events-api-overview (TikTok Events API Overview, no date shown)
19. https://support.google.com/analytics/answer/10901610 (Google Analytics: Custom URLs/UTMs, no date shown)
20. https://www.facebook.com/business/help/1360662660721200 (Meta: Ad Set Budget Optimization, no date shown)
21. https://ads.tiktok.com/help/article/tiktok-ad-specs (TikTok: Ad Specifications and Safe Zones, no date shown)
22. https://www.facebook.com/business/help/1769742116668748 (Meta: Reel and Story Ad Specs, no date shown)
23. https://support.google.com/google-ads/answer/10711674 (Google: YouTube Shorts Ads Best Practices, no date shown)
24. https://ads.tiktok.com/help/article/creative-testing (TikTok: Creative Testing, no date shown)
25. https://www.facebook.com/business/help/1297837770381665 (Meta: A/B Testing Guide, no date shown)
