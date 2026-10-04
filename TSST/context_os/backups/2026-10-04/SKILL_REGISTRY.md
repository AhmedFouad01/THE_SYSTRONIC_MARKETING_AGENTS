# Skill Registry


Source: [historical specialist skill matrix](../TSST_Specialist_Skill_Matrix_v0.1.xlsx)  
Imported: 2026-09-20  
Specialist registry total: 68 skills; team total: 98 including the [30 Lead skills](LEAD/SKILL_REGISTRY.md)
Current validation state: 1 `VALIDATED`, 2 `LAB_VALIDATED`, 65 `UNVALIDATED` among specialists. Team total: 1 `VALIDATED`, 2 `LAB_VALIDATED`, 95 `UNVALIDATED`. Every imported skill started as `UNVALIDATED`.


Phase 1 follows the workbook's Training Roadmap: TSST-CREATIVE-SK-001–TSST-CREATIVE-SK-006, TSST-LENS-SK-001–TSST-LENS-SK-006, and TSST-SPARK-SK-001–TSST-SPARK-SK-006. These 18 skills have internal packages and queued evaluations. The art-direction package, production stack SK-009–019, and CRM product-UI/UX stack SK-020–030 are installed; 11 team packages remain backlog (CREATIVE SK-007, four LENS, six SPARK). Registration does not imply installation or validation.


## CREATIVE_AG — Visual Identity & Creative


### TSST-CREATIVE-SK-001 — Brand System Architecture


- Objective: بناء الهوية كنظام: logo, color, type, imagery, layout, motion, do/don't
- Priority / stage: Critical / Foundation
- Source: [GitHub Brand Guidelines 2026](https://brand.github.com/GitHub-BrandGuidelines-2026.pdf) — Official brand guideline example
- Practical evaluation: حوّل أي Brand Brief إلى Brand System واضح مع guardrails
- Guardrail: ممنوع نسخ الهوية؛ نتعلم طريقة التوثيق
- Package: `CREATIVE/skills/tsst-creative-sk-001-brand-system-architecture/SKILL.md`
- Status: `VALIDATED` — `TSST-CREATIVE-EV-001`, 95/100


### TSST-CREATIVE-SK-002 — Brand Guidelines Engineering


- Objective: تحويل الهوية إلى ملف تعليمات قابل للقراءة بواسطة البشر والـAgents
- Priority / stage: Critical / Foundation
- Source: [BSD XR Agent Guide](https://github.com/BitSpaceDevelopment/bsd-branding-repo/blob/main/agent-guide.md) — Agent-readable brand repository pattern
- Practical evaluation: أنشئ BRAND.md + AGENT_GUIDE.md لبراند تجريبي
- Guardrail: مرجع هيكلي فقط
- Package: `CREATIVE/skills/tsst-creative-sk-002-brand-guidelines-engineering/SKILL.md`
- Status: `LAB_VALIDATED` — `TSST-CREATIVE-EV-002`, 94/100


### TSST-CREATIVE-SK-003 — Design Tokens


- Objective: تحويل اللون/الخط/المسافات إلى tokens تمنع الانحراف البصري
- Priority / stage: Critical / Foundation
- Source: [Design Tokens Community Group](https://github.com/design-tokens/community-group) — Official DTCG specification repository
- Practical evaluation: أنشئ token hierarchy لبراند متعدد القنوات
- Guardrail: استخدم standard naming ولا تربط الهوية بأداة واحدة
- Package: `CREATIVE/skills/tsst-creative-sk-003-design-tokens/SKILL.md`
- Status: `UNVALIDATED`


### TSST-CREATIVE-SK-004 — Visual Hierarchy & Layout


- Objective: Grid, spacing, hierarchy, alignment, rhythm, composition
- Priority / stage: High / Foundation
- Source: [GitHub Primer](https://github.com/primer) — Mature design system primitives and guidelines
- Practical evaluation: راجع 3 creatives وحدد مشاكل hierarchy/layout
- Guardrail: نتعلم المبادئ لا شكل GitHub
- Package: `CREATIVE/skills/tsst-creative-sk-004-visual-hierarchy-layout/SKILL.md`
- Status: `UNVALIDATED`


### TSST-CREATIVE-SK-005 — Typography System


- Objective: اختيار type scale, weights, line-height, Arabic/Latin pairing, readability
- Priority / stage: High / Foundation
- Source: [GitHub Brand Guidelines 2026](https://brand.github.com/GitHub-BrandGuidelines-2026.pdf) — Typography usage in a production brand
- Practical evaluation: كوّن type system عربي/إنجليزي مع usage rules
- Guardrail: اختبار readability على social + deck + web
- Package: `CREATIVE/skills/tsst-creative-sk-005-typography-system/SKILL.md`
- Status: `UNVALIDATED`


### TSST-CREATIVE-SK-006 — Color System & Accessibility


- Objective: Palette roles, contrast, semantic color, dark/light applications
- Priority / stage: High / Foundation
- Source: [GitHub Primer Primitives](https://github.com/primer/primitives) — Color, typography and spacing primitives
- Practical evaluation: بناء palette مع semantic roles وcontrast checks
- Guardrail: لا تستخدم اللون للزينة فقط
- Package: `CREATIVE/skills/tsst-creative-sk-006-color-system-accessibility/SKILL.md`
- Status: `UNVALIDATED`


### TSST-CREATIVE-SK-007 — Design System Documentation


- Objective: توثيق components/patterns/examples والحفاظ على consistency
- Priority / stage: High / Scale
- Source: [Storybook Design System](https://github.com/storybookjs/design-system) — Open design-system implementation and documentation
- Practical evaluation: حوّل 5 مكونات بصرية إلى documented patterns
- Guardrail: مهم للتوسع وليس فقط UI
- Package: backlog
- Status: `UNVALIDATED`


### TSST-CREATIVE-SK-008 — Creative Art Direction


- Objective: تحويل positioning إلى visual concept, mood, photography, composition, lighting
- Priority / stage: Critical / Creative
- Source: [source{d} Design / Brand Style Guide](https://github.com/src-d/design) — Open brand + media + presentation guideline example
- Practical evaluation: اصنع 3 art directions لنفس المنتج مع rationale
- Guardrail: لا نخلط بين art direction و مجرد prompt
- Package: `CREATIVE/skills/tsst-creative-sk-008-creative-art-direction/SKILL.md`
- Status: `LAB_VALIDATED` — `TSST-CREATIVE-EV-011`, 88/100; remediation pass after run 01 failed at 82/100


### TSST-CREATIVE-SK-009 — Performance Creative Systems


- Objective: Hook, thumb-stop, message hierarchy, platform-native formats, iteration
- Priority / stage: Critical / Creative
- Source: [Meta Reels Ads Guidance](https://www.facebook.com/business/ads/facebook-instagram-reels-ads) — Official Meta creative guidance for Reels ads
- Practical evaluation: حوّل offer واحد إلى 6 creative hypotheses
- Guardrail: يجب ربط كل creative بفرضية أداء
- Package: `CREATIVE/skills/tsst-creative-sk-009-performance-creative-systems/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-010 — Visual QA & Brand Compliance


- Objective: مراجعة logo usage, spacing, font, color, crop, safe zones, consistency
- Priority / stage: Critical / QA
- Source: [Design System + Brand Guidelines](https://github.com/primer) — Combine official guidelines with checklist-based QA
- Practical evaluation: اعمل checklist يكتشف 15 خطأ بصري شائع
- Guardrail: CREATIVE_AG لا يسلم creative بدون QA pass
- Package: `CREATIVE/skills/tsst-creative-sk-010-visual-qa-brand-compliance/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-011 — Social Media Graphic Design


- Objective: Professional feed, Story, carousel and ad-static composition with real focal hierarchy and brand-specific craft
- Priority / stage: Critical / Production
- Source: Professional editorial/advertising composition principles + platform formats + approved brand systems
- Practical evaluation: Render a 5-piece social mini-campaign with one visual grammar and non-duplicative compositions
- Guardrail: Copy swaps on one template do not count as multiple designed assets
- Package: `CREATIVE/skills/tsst-creative-sk-011-social-media-graphic-design/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-012 — Campaign Key Visual & Composition


- Objective: Translate campaign strategy into a memorable key visual and scalable visual grammar
- Priority / stage: Critical / Production
- Source: Campaign art-direction and editorial-composition practice
- Practical evaluation: 3 directions → selected hero 4:5 + recomposed 9:16 execution
- Guardrail: Brand colors + logo + headline alone are not a key visual
- Package: `CREATIVE/skills/tsst-creative-sk-012-campaign-key-visual-composition/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-013 — Image Compositing & Retouching


- Objective: Credible product/subject/environment composites with matched edges, light, shadow, scale, perspective and color
- Priority / stage: Critical / Production
- Source: Adobe Photoshop official masking/layer-mask/compositing guidance
- Practical evaluation: Composite supplied subject/product into a new scene and pass 100% edge/light/perspective QA
- Guardrail: Preserve product truth and natural texture; avoid halos/floating subjects
- Package: `CREATIVE/skills/tsst-creative-sk-013-image-compositing-retouching/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-014 — Generative Visual Production & Reference Fidelity


- Objective: Use generative imagery as controlled production material while preserving exact brand/product truth and reference boundaries
- Priority / stage: High / Production
- Source: Current generative-image/editing tool guidance + approved brand/reference rules
- Practical evaluation: Generate and QA three options, reject artifacts, deliver one compositable provenance-labeled result
- Guardrail: Exact logos/products should be composited from authorized masters rather than trusted to generation
- Package: `CREATIVE/skills/tsst-creative-sk-014-generative-visual-production-reference-fidelity/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-015 — Motion Design


- Objective: Intentional keyframed brand/typographic/graphic motion using timing, easing and visual hierarchy
- Priority / stage: Critical / Motion
- Source: Adobe After Effects official keyframe/animation guidance
- Practical evaluation: Render an 8–12s bilingual motion reveal and inspect full playback/keyframes
- Guardrail: Presets/default fly-ins do not substitute for a motion concept
- Package: `CREATIVE/skills/tsst-creative-sk-015-motion-design/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-016 — Short-form Video Editing


- Objective: Reels/TikTok editing with hook, beat structure, shot purpose, captions and native vertical behavior
- Priority / stage: Critical / Motion
- Source: Adobe Premiere official edit/export guidance + TikTok official vertical/native creative guidance
- Practical evaluation: Render a 15–20s vertical short from mixed assets with a distinct first-3-second hook
- Guardrail: Slideshow/static-card motion is not professional video by default
- Package: `CREATIVE/skills/tsst-creative-sk-016-short-form-video-editing/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-017 — Sound Design & Audio Finishing


- Objective: Clear voice/music/SFX mix with purposeful sonic rhythm and rights awareness
- Priority / stage: High / Motion
- Source: Adobe Premiere official audio guidance + platform commercial-audio rights rules
- Practical evaluation: Mix a 15–20s short and deliver a level/rights QA note
- Guardrail: Music may not mask speech; accessible music does not imply advertising rights
- Package: `CREATIVE/skills/tsst-creative-sk-017-sound-design-audio-finishing/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-018 — Color Grading & Visual Finishing


- Objective: Shot/image matching, color correction and controlled final branded look
- Priority / stage: High / Finishing
- Source: Adobe Premiere official color correction/grading guidance
- Practical evaluation: Match three mismatched sources and apply one restrained final look
- Guardrail: Correct first, grade second; protect skin and product/brand color truth
- Package: `CREATIVE/skills/tsst-creative-sk-018-color-grading-visual-finishing/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24


### TSST-CREATIVE-SK-019 — Creative Production Pipeline & Export QA


- Objective: Deterministic asset manifest, versioning, requested-format export, placement preview and final render QA
- Priority / stage: Critical / QA
- Source: Adobe production/export guidance + TSST final-asset gate
- Practical evaluation: Take a mixed still/video mini-campaign from source manifest through final exports and QA log
- Guardrail: HTML/previs cannot replace requested PNG/MP4 final output
- Package: `CREATIVE/skills/tsst-creative-sk-019-creative-production-pipeline-export-qa/SKILL.md`
- Status: `UNVALIDATED` — training installed 2026-09-24




### TSST-CREATIVE-SK-020 — Product UX Architecture & Information Architecture
- Objective: Convert approved product roles, tasks and domain objects into clear IA, task flows and navigation.
- Priority / stage: Critical / Product UX
- Sources: NN/g usability heuristics; Attio objects/lists/views documentation.
- Package: `CREATIVE/skills/tsst-creative-sk-020-product-ux-architecture-information-architecture/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03 for CRM MVP UI/UX pilot.


### TSST-CREATIVE-SK-021 — Enterprise Workspace Navigation & Context Management
- Objective: Design a low-noise SaaS shell with predictable sidebar, context navigation, search and minimal context switching.
- Priority / stage: Critical / Product UX
- Sources: Attio navigation/workspace docs; NN/g heuristics.
- Package: `CREATIVE/skills/tsst-creative-sk-021-enterprise-workspace-navigation-context/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-022 — CRM Data Grids, Tables, Views & Bulk Actions
- Objective: Build dense, scannable and accessible CRM table/grid patterns with filters, saved views and batch actions.
- Priority / stage: Critical / Product UX
- Sources: Carbon Data Table; W3C WAI-ARIA Table/Grid patterns.
- Package: `CREATIVE/skills/tsst-creative-sk-022-crm-data-grids-tables-views-bulk-actions/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-023 — Master-Detail Records, Drawers & Contextual Actions
- Objective: Preserve list/work context while inspecting and acting on CRM records.
- Priority / stage: Critical / Product UX
- Sources: Attio record patterns; Radix Dialog/Popover accessibility behavior.
- Package: `CREATIVE/skills/tsst-creative-sk-023-master-detail-records-drawers-contextual-actions/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-024 — Command Palette & Keyboard-First Productivity
- Objective: Add discoverable quick actions and keyboard efficiency for expert users without harming novice usability.
- Priority / stage: High / Product UX
- Sources: Attio quick actions; WAI keyboard-interface guidance; Radix toolbar patterns.
- Package: `CREATIVE/skills/tsst-creative-sk-024-command-palette-keyboard-first-productivity/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-025 — Forms, Validation & Error Recovery
- Objective: Prevent input errors and make correction/recovery clear while preserving user work.
- Priority / stage: Critical / Product UX
- Sources: GOV.UK Design System validation/error guidance; NN/g heuristics.
- Package: `CREATIVE/skills/tsst-creative-sk-025-forms-validation-error-recovery/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-026 — Arabic-First RTL/Bidi Product UX
- Objective: Treat Arabic RTL and mixed-direction data as first-class product behavior.
- Priority / stage: Critical / Product UX
- Sources: W3C Internationalization RTL/bidi guidance.
- Package: `CREATIVE/skills/tsst-creative-sk-026-arabic-first-rtl-bidi-product-ux/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-027 — Accessible Interaction & WCAG 2.2
- Objective: Embed keyboard, focus, target-size, contrast and semantic accessibility into component and flow design.
- Priority / stage: Critical / Product UX QA
- Sources: W3C WCAG 2.2; WAI-ARIA APG; Radix accessibility.
- Package: `CREATIVE/skills/tsst-creative-sk-027-accessible-interaction-wcag22/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-028 — Responsive & Adaptive SaaS Layouts
- Objective: Design content-prioritized responsive behavior rather than mechanical desktop shrinking.
- Priority / stage: High / Product UX
- Sources: Figma design-system/variables guidance; Atlassian Design System foundations.
- Package: `CREATIVE/skills/tsst-creative-sk-028-responsive-adaptive-saas-layouts/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-029 — Dashboard & Data Visualization UX
- Objective: Build decision-oriented reporting with clear KPI hierarchy, drill-down and accessible charts.
- Priority / stage: High / Product UX
- Sources: Carbon data visualization; Atlassian data-visualization color guidance.
- Package: `CREATIVE/skills/tsst-creative-sk-029-dashboard-data-visualization-ux/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.


### TSST-CREATIVE-SK-030 — Usability Testing, Heuristic Evaluation & UX QA
- Objective: Validate real task completion and usability before product UI sign-off.
- Priority / stage: Critical / Product UX QA
- Sources: Nielsen Norman Group heuristic evaluation and usability-testing guidance.
- Package: `CREATIVE/skills/tsst-creative-sk-030-usability-testing-heuristic-evaluation-ux-qa/SKILL.md`
- Status: `UNVALIDATED` — installed 2026-10-03.




## LENS_AG — Strategy / Research / Presentation


### TSST-LENS-SK-001 — Research Planning


- Objective: تحويل السؤال التجاري إلى research questions, scope, methods, deliverables
- Priority / stage: Critical / Research
- Source: [NASA Research Presentation Guide](https://www.giss.nasa.gov/edu/icp/education/presentation/) — Structured approach to framing and presenting research
- Practical evaluation: صمم research brief لسوق جديد
- Guardrail: ابدأ بالسؤال والقرار وليس بجمع معلومات
- Package: `LENS/skills/tsst-lens-sk-001-research-planning/SKILL.md`
- Status: `UNVALIDATED`


### TSST-LENS-SK-002 — Source Validation & Evidence Grading


- Objective: فصل primary/secondary sources وتقييم freshness, authority, bias, confidence
- Priority / stage: Critical / Research
- Source: [NASA Research Presentation Guide](https://www.giss.nasa.gov/edu/icp/education/presentation/) — Evidence-first research discipline
- Practical evaluation: رتب 10 مصادر حسب الثقة وسبب الترتيب
- Guardrail: أي claim مهم يجب أن يكون له evidence
- Package: `LENS/skills/tsst-lens-sk-002-source-validation-evidence-grading/SKILL.md`
- Status: `UNVALIDATED`


### TSST-LENS-SK-003 — Competitor Intelligence


- Objective: تحليل positioning, offer, pricing, creative, channels, funnel—not مجرد SWOT
- Priority / stage: High / Research
- Source: [Meta Ad Library](https://www.facebook.com/ads/library/) — Official ad transparency/research source
- Practical evaluation: اعمل competitor matrix لخمسة منافسين
- Guardrail: فرّق بين observed facts والاستنتاج
- Package: `LENS/skills/tsst-lens-sk-003-competitor-intelligence/SKILL.md`
- Status: `UNVALIDATED`


### TSST-LENS-SK-004 — Customer / ICP / JTBD


- Objective: فهم segment, triggers, pains, desired outcomes, objections, buying context
- Priority / stage: Critical / Strategy
- Source: [JTBD Framework](https://strategyn.com/jobs-to-be-done/) — Jobs-to-be-Done strategic framework reference
- Practical evaluation: كوّن ICP + JTBD لمنتج فعلي
- Guardrail: ممنوع اختراع persona من غير evidence
- Package: `LENS/skills/tsst-lens-sk-004-customer-icp-jtbd/SKILL.md`
- Status: `UNVALIDATED`


### TSST-LENS-SK-005 — Positioning & Messaging


- Objective: Category, audience, alternative, differentiator, proof, message hierarchy
- Priority / stage: Critical / Strategy
- Source: [April Dunford Positioning Resources](https://www.aprildunford.com/) — Positioning methodology reference
- Practical evaluation: ابنِ positioning canvas + message house
- Guardrail: الـclaim لازم يكون قابل للإثبات
- Package: `LENS/skills/tsst-lens-sk-005-positioning-messaging/SKILL.md`
- Status: `UNVALIDATED`


### TSST-LENS-SK-006 — Marketing Planning


- Objective: Objectives → strategy → channels → initiatives → KPI → budget → cadence
- Priority / stage: Critical / Planning
- Source: [Think with Google](https://www.thinkwithgoogle.com/) — Marketing insights and planning reference
- Practical evaluation: ابنِ 90-day plan بفرضيات ومقاييس
- Guardrail: لا تحول البلان إلى قائمة بوستات
- Package: `LENS/skills/tsst-lens-sk-006-marketing-planning/SKILL.md`
- Status: `UNVALIDATED`


### TSST-LENS-SK-007 — Experiment & Learning Agenda


- Objective: Hypothesis, variable, control, success metric, duration, interpretation
- Priority / stage: High / Planning
- Source: [Google Ads Measurement Learning](https://skillshop.withgoogle.com/googleads/) — Official measurement learning path
- Practical evaluation: صمم 5 تجارب تسويقية بمتغير واحد
- Guardrail: لا تعلن winner بدون بيانات كافية
- Package: backlog
- Status: `UNVALIDATED`


### TSST-LENS-SK-008 — Data Storytelling


- Objective: Chart selection, declutter, insight titles, narrative, decision framing
- Priority / stage: Critical / Presentation
- Source: [Hands-On Data Visualization](https://github.com/HandsOnDataViz/book) — Open-access data visualization and storytelling book
- Practical evaluation: حوّل raw table إلى 5-slide data story
- Guardrail: كل chart لازم يجاوب سؤال محدد
- Package: backlog
- Status: `UNVALIDATED`


### TSST-LENS-SK-009 — Executive Presentation Architecture


- Objective: Audience → decision → storyline → evidence → recommendation → next action
- Priority / stage: Critical / Presentation
- Source: [NASA Research Presentation Guide](https://www.giss.nasa.gov/edu/icp/education/presentation/) — Research-to-presentation structure
- Practical evaluation: ابنِ deck 12 slides وTitle Test
- Guardrail: العناوين وحدها يجب أن تحكي القصة
- Package: backlog
- Status: `UNVALIDATED`


### TSST-LENS-SK-010 — Advanced Slide Design & Chart QA


- Objective: Information density, visual hierarchy, chart choice, annotation, consistency
- Priority / stage: High / Presentation
- Source: [Storytelling with Data Skill Reference](https://github.com/AliDujie/storytelling-with-data) — Agent-oriented data storytelling implementation
- Practical evaluation: راجع deck سيئ وأعد هيكلته
- Guardrail: استخدمه كمرجع وليس كحقيقة إحصائية للمزاعم الداخلية
- Package: backlog
- Status: `UNVALIDATED`


## SPARK_AG — Performance Ads


### TSST-SPARK-SK-001 — Paid Media Strategy


- Objective: Objective, funnel stage, channel role, budget logic, KPI tree
- Priority / stage: Critical / Foundation
- Source: [Google Ads Skillshop](https://skillshop.withgoogle.com/googleads/) — Official Google Ads learning paths
- Practical evaluation: ابنِ media strategy لمنتج مع KPI tree
- Guardrail: لا تبدأ campaign structure قبل business objective
- Package: `SPARK/skills/tsst-spark-sk-001-paid-media-strategy/SKILL.md`
- Status: `UNVALIDATED`


### TSST-SPARK-SK-002 — Measurement Architecture


- Objective: Events, conversions, naming, deduplication, source of truth, QA
- Priority / stage: Critical / Measurement
- Source: [Google Enhanced Conversions Best Practices](https://support.google.com/google-ads/answer/14795081?hl=en) — Official conversion measurement guidance
- Practical evaluation: صمم event map من visit إلى revenue
- Guardrail: Tracking قبل optimization
- Package: `SPARK/skills/tsst-spark-sk-002-measurement-architecture/SKILL.md`
- Status: `UNVALIDATED`


### TSST-SPARK-SK-003 — Attribution Fundamentals


- Objective: Touchpoints, attribution models, limitations, platform vs analytics differences
- Priority / stage: Critical / Measurement
- Source: [Google Analytics Attribution](https://support.google.com/analytics/answer/10596866) — Official attribution documentation
- Practical evaluation: فسر journey متعدد القنوات بدون double counting
- Guardrail: لا تساوي platform-reported revenue بالحقيقة المطلقة
- Package: `SPARK/skills/tsst-spark-sk-003-attribution-fundamentals/SKILL.md`
- Status: `UNVALIDATED`


### TSST-SPARK-SK-004 — Meta Campaign & Creative Fundamentals


- Objective: Placements, creative formats, testing, Advantage automation
- Priority / stage: Critical / Platform
- Source: [Meta Reels Ads Guidance](https://www.facebook.com/business/ads/facebook-instagram-reels-ads) — Official Meta ads guidance
- Practical evaluation: ابنِ Meta test plan مع 3 creative hypotheses
- Guardrail: تعلم platform-native creative
- Package: `SPARK/skills/tsst-spark-sk-004-meta-campaign-creative-fundamentals/SKILL.md`
- Status: `UNVALIDATED`


### TSST-SPARK-SK-005 — Google Search & Performance Fundamentals


- Objective: Keywords, intent, bidding, audiences, measurement, campaign hygiene
- Priority / stage: Critical / Platform
- Source: [Google Ads Search Skillshop](https://skillshop.withgoogle.com/googleads/) — Official certification learning path
- Practical evaluation: صمم Search structure لطلب حقيقي
- Guardrail: افصل intent عن keyword volume فقط
- Package: `SPARK/skills/tsst-spark-sk-005-google-search-performance-fundamentals/SKILL.md`
- Status: `UNVALIDATED`


### TSST-SPARK-SK-006 — TikTok Ads Fundamentals


- Objective: Creative, targeting, objectives, measurement, policy
- Priority / stage: High / Platform
- Source: [TikTok Academy](https://ads.tiktok.com/business/en/academy) — Official marketer and advertiser education
- Practical evaluation: صمم TikTok launch plan
- Guardrail: TikTok creative ≠ Meta creative resized
- Package: `SPARK/skills/tsst-spark-sk-006-tiktok-ads-fundamentals/SKILL.md`
- Status: `UNVALIDATED`


### TSST-SPARK-SK-007 — TikTok Creative Best Practices


- Objective: TikTok-first creative, 9:16, sound, people, safe zone, continuous testing
- Priority / stage: High / Creative
- Source: [TikTok Creative Best Practices](https://ads.tiktok.com/help/article/creative-best-practices?lang=en) — Official performance creative guidance
- Practical evaluation: حوّل concept واحد إلى 4 TikTok-native variants
- Guardrail: اختبر ولا تعتمد best practice كقانون
- Package: backlog
- Status: `UNVALIDATED`


### TSST-SPARK-SK-008 — Pixel + Server-Side Events


- Objective: Browser + API measurement, event parity, deduplication, diagnostics
- Priority / stage: Critical / Measurement
- Source: [TikTok Pixel / Events API](https://ads.tiktok.com/help/article/get-started-pixel?lang=en) — Official web data connection guidance
- Practical evaluation: ارسم Pixel+API measurement architecture
- Guardrail: مهم للـCRM integrations لاحقًا
- Package: backlog
- Status: `UNVALIDATED`


### TSST-SPARK-SK-009 — Conversion Data & First-Party Signals


- Objective: Enhanced conversions, hashed first-party data, offline lead conversion loop
- Priority / stage: Critical / Measurement
- Source: [Google Enhanced Conversions](https://support.google.com/google-ads/answer/9888656?hl=en) — Official first-party conversion measurement
- Practical evaluation: صمم CRM→Ads conversion feedback loop
- Guardrail: Privacy/consent جزء من التصميم
- Package: backlog
- Status: `UNVALIDATED`


### TSST-SPARK-SK-010 — Audience Strategy


- Objective: Prospecting, retargeting, exclusions, seed quality, lifecycle segmentation
- Priority / stage: High / Optimization
- Source: [Google Ads Skillshop](https://skillshop.withgoogle.com/googleads/) — Official audience and campaign learning
- Practical evaluation: ابنِ audience map حسب lifecycle
- Guardrail: الـaudience ليس بديلًا عن offer/creative
- Package: backlog
- Status: `UNVALIDATED`


### TSST-SPARK-SK-011 — Creative Testing System


- Objective: Hypothesis-led testing, variable isolation, iteration cadence, fatigue detection
- Priority / stage: Critical / Optimization
- Source: [Meta Reels + TikTok Best Practices](https://www.facebook.com/business/ads/facebook-instagram-reels-ads) — Official platform testing guidance
- Practical evaluation: أنشئ creative testing matrix لـ30 يوم
- Guardrail: غيّر متغير رئيسي واحد قدر الإمكان
- Package: backlog
- Status: `UNVALIDATED`


### TSST-SPARK-SK-012 — Optimization & Reporting


- Objective: Diagnose by funnel, marginal efficiency, spend scaling, anomaly detection, learning log
- Priority / stage: Critical / Optimization
- Source: [Google Ads Measurement Skillshop](https://skillshop.withgoogle.com/googleads/) — Official measurement and optimization learning
- Practical evaluation: حلل account وهمي وحدد action + confidence
- Guardrail: ممنوع optimization بالـROAS وحده
- Package: backlog
- Status: `UNVALIDATED`




## DEV_AG approved core catalog — 2026-09-28


Change owner: TSST Lead. IDs: `TSST-DEV-SK-001`–`TSST-DEV-SK-016`. Reason: user-requested controlled implementation. Source impact: authored adaptations of the specified openai/plugins and wshobson/agents skills plus custom TSST communication guidance, with exact paths and pinned revisions in [DEV attribution](DEV/references/SOURCES.md).


[DEV core registry](DEV/SKILL_REGISTRY.md) is the L0 catalog for all 16 exact names, triggers, categories/tags, package links, validation states and sources. All 16 are installed repository-local and UNVALIDATED; specialist governance status is APPROVED (registration only), with NOT_READY readiness under [TSST-ADR-002](decisions/TSST-ADR-002.md). Load only activated skill instructions and needed references.


The pre-DEV baseline was 41 specialist / 71 team skills. Including the approved catalog: 57 specialist / 87 team skills, 76 installed packages, 11 backlog; specialist states 1 VALIDATED, 2 LAB_VALIDATED, 54 UNVALIDATED; team states 1 VALIDATED, 2 LAB_VALIDATED, 84 UNVALIDATED. Existing states are unchanged. User approval grants registration and repository merge only, not evaluation, production activation, autonomous execution or skill validation.