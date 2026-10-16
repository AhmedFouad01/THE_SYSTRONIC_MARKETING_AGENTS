# TSST Skill Validation · Round 1 Judge Packet

> **Notice for the Independent Judge:**
> This packet is self-contained. It contains validation materials for the 8 skills assigned to Round 1.
> For each skill, you will find:
> 1. Skill ID & one-line purpose.
> 2. Binary checklist (3–5 PASS/FAIL questions taken directly from the skill specification).
> 3. Evidence:
>    - For P1 skills: real past-job excerpt with locator (`LOCATOR: <path>#L<start>-L<end>` followed by `EXCERPT:`).
>    - For P0 skills: fresh positive test runs inline (5 tests per skill).
> 4. Negative tests: 2 near-miss prompts evaluated for false-positive triggering (YES/NO) and designated owning skill.
> 5. Applicable evaluation flags (`ARABIC_HUMAN_REVIEW`, `EDITED_FINAL`, `BLOCKED`).
> No preliminary score or subjective pass/fail verdict is provided.

---

## 1. TSST-LENS-SK-001 — Research Planning

### Purpose
Convert a business decision into bounded research questions, methods, evidence requirements, analysis steps, limitations, and decision-ready deliverables.

### Binary Checks
- [ ] **Check 1 (Decision & Scope):** Is the supported business decision, decision owner, deadline, and scope boundary (population, geography, period, exclusions) explicitly stated before search activity?
- [ ] **Check 2 (Question Decomposition):** Are research questions distinct, answerable, and explicitly separated from hypotheses, assumptions, and deliverables?
- [ ] **Check 3 (Evidence-Method Mapping):** Does each research question map to needed evidence, preferred source type, collection method, and fallback?
- [ ] **Check 4 (Quality & Limitations):** Are source/data limitations, uncertainty, quality checks, and stop conditions documented?
- [ ] **Check 5 (Decision Alignment):** Do planned deliverables directly support decision choices rather than providing open-ended topical summaries?

### Evaluation Flags
- `ARABIC_HUMAN_REVIEW` (Egyptian market context, local tool access, and Arabic typography/script references).

### Evidence (P1 — Reused Past Job)
- Source job: Motion AG toolchain research (`LENS-MO-001`, task closed 2026-10-10).
- Location: `TSST/brands/t-sag/projects/tsst-ai/motion-ag/LENS-MO-001_video-agent-setups.md`

LOCATOR: TSST/brands/t-sag/projects/tsst-ai/motion-ag/LENS-MO-001_video-agent-setups.md#L1-L20
EXCERPT:
```
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
```

### Negative Tests (Trigger Boundary)
1. **Prompt:** "Evaluate our top 3 competitors' pricing pages and compile a claim-by-claim ledger verifying the accuracy of each stated platform feature."
   - *Would this skill wrongly trigger?* **NO** (This requires micro-grading and verifying claim support against sources, which is evidence validation rather than scoping a new research plan).
   - *Owning skill:* `TSST-LENS-SK-002` (Source Validation & Evidence Grading).
2. **Prompt:** "Write the detailed campaign brief, target customer persona profile, and core value proposition for an upcoming Cairo gym launch."
   - *Would this skill wrongly trigger?* **NO** (This creates marketing messaging and customer definition rather than designing an empirical research inquiry).
   - *Owning skill:* `TSST-LENS-SK-004` (Customer ICP & JTBD) / `TSST-LENS-SK-005` (Positioning & Messaging).

---

## 2. TSST-LENS-SK-002 — Source Validation & Evidence Grading

### Purpose
Grade sources and claim support by authority, directness, method, freshness, bias, scope match, and corroboration; maintain an auditable claim-evidence ledger.

### Binary Checks
- [ ] **Check 1 (Atomic Claims):** Are deliverable claims decomposed into atomic, evaluable statements with explicit non-fact labels (assumption, hypothesis, disputed) where direct evidence is lacking?
- [ ] **Check 2 (Source Metadata):** Are author/publisher, exact publication date, retrieval date, source type, methodology, sample size, and incentives recorded for each analyzed source?
- [ ] **Check 3 (Independent Multi-Criteria Grading):** Are directness, authority, method transparency, freshness, scope match, and bias graded separately rather than relying on a single global score or domain reputation?
- [ ] **Check 4 (Corroboration & Conflict Reconciliation):** Are conflicting sources identified, underlying duplicate reporting separated from independent corroboration, and root causes of divergence analyzed?
- [ ] **Check 5 (Claim Disposition & Uncertainty):** Does every claim receive a clear disposition (supported, qualified, assumption, hypothesis, disputed, unsupported) with residual uncertainty and missing evidence outlined?

### Evaluation Flags
- `ARABIC_HUMAN_REVIEW` (Evaluates Egyptian market data, CBE regulations, local retail commerce, and Arabic terminologies).

### Evidence (P0 — 5 Fresh Positive Test Runs)
*Full raw outputs preserved unedited in `runs/TSST-LENS-SK-002-test-[1-5].md`.*

#### Summary of Test Runs:
- **Test 1 (`runs/TSST-LENS-SK-002-test-1.md`):** Graded claims on Greater Cairo e-commerce COD share (75%), InstaPay retail displacement (>40%), and New Cairo card-on-delivery preferences (60%) across CBE regulatory reports, payment aggregator blogs, and BCG/Paymob research. Dispositions: Claim 1.1 Qualified, Claim 1.2 Disputed/Hypothesis, Claim 1.3 Unsupported Assumption.
- **Test 2 (`runs/TSST-LENS-SK-002-test-2.md`):** Graded claims on Egyptian Gen Z fashion discovery and TikTok vs Instagram direct conversion (3x claim) using TikTok MENA whitepapers, local agency survey data (EDMA), and regional media research. Dispositions: Claim 2.1 Disputed, Claim 2.2 Refuted, Claim 2.3 Qualified.
- **Test 3 (`runs/TSST-LENS-SK-002-test-3.md`):** Graded claims on Egyptian B2B SaaS payment gateway regulations and SME cloud accounting adoption (40% claim) using CBE licensing circulars, local tech op-eds, and CAPMAS/MCIT national enterprise census data. Dispositions: Claim 3.1 Qualified, Claim 3.2 Refuted (Factual Error), Claim 3.3 Refuted by Census Truth (actual 14.2%).
- **Test 4 (`runs/TSST-LENS-SK-002-test-4.md`):** Graded claims on luxury residential interior fit-out budgets in New Cairo / Sheikh Zayed (4.5M EGP average) and pre-handover designer engagement (80%) using JLL MENA advisory reports, Chamber of Woodworking Industries project data, and broker promotional blogs. Dispositions: Claim 4.1 Qualified by sqm, Claim 4.2 Refuted (actual 31%), Claim 4.3 Qualified.
- **Test 5 (`runs/TSST-LENS-SK-002-test-5.md`):** Graded claims on WhatsApp Business open rates (98% in 15 min), Meta API pricing ($0.012 claim), and cart recovery rates for Egyptian quick-commerce using Meta's official August 2026 rate card, global SaaS blogs, and Wamda Cairo operational telemetry. Dispositions: Claim 5.1 Refuted, Claim 5.2 Refuted (Actual $0.0638), Claim 5.3 Qualified.

### Negative Tests (Trigger Boundary)
1. **Prompt:** "Design an end-to-end research project to evaluate whether Egyptian B2B distribution companies will pay for automated inventory reconciliation software."
   - *Would this skill wrongly trigger?* **NO** (Framing business questions, selecting methodologies, and defining sample scope belongs to research planning).
   - *Owning skill:* `TSST-LENS-SK-001` (Research Planning).
2. **Prompt:** "Audit our Meta Ads account tracking to ensure purchase conversion events are deduplicated between browser pixel and Conversions API."
   - *Would this skill wrongly trigger?* **NO** (This involves technical ad tracking telemetry and conversion architecture).
   - *Owning skill:* `TSST-SPARK-SK-002` (Measurement Architecture).

---

## 3. TSST-CREATIVE-SK-002 — Brand Guidelines Engineering

### Purpose
Convert approved brand rules into versioned, human- and agent-readable guidance with explicit precedence, machine-readable references, and testable constraints.

### Binary Checks
- [ ] **Check 1 (Canonical File Map & Precedence):** Does the output define a canonical repository structure with clear, unambiguous precedence order across strategy, brand rules, tokens, and assets?
- [ ] **Check 2 (Agent Decision Logic):** Are agent operating instructions structured with explicit condition-to-action rules for retrieval, asset selection, and task execution?
- [ ] **Check 3 (Constraint & Prohibition Visibility):** Are non-negotiable constraints, forbidden asset manipulations, and usage boundaries clearly separated from illustrative examples?
- [ ] **Check 4 (Machine-Readable Token Integration):** Are design tokens, asset manifests, and color/type references linked to machine-readable source files instead of duplicating hardcoded values across prose?
- [ ] **Check 5 (Versioning & Escalation Ownership):** Are version metadata, ownership, approval dates, escalation paths, and revalidation triggers explicitly specified?

### Evaluation Flags
- `ARABIC_HUMAN_REVIEW` (Egyptian brand system; bilingual Arabic/English guidelines, Cairo typography rules).

### Evidence (P1 — Reused Past Job)
- Source job: VILL Brand Guidelines v1.0 (`C7-VILL-12`, task closed 2026-10-05).
- Location: `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0/AGENT_GUIDE.md`

LOCATOR: TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0/AGENT_GUIDE.md#L1-L13
EXCERPT:
```
# Agent use — VILL v1.0

Read [BRAND.md](BRAND.md), approved palette JSON, original logo and relevant current verbal/strategy sections before authoring. This file is guidance, not permission to publish or change authorities. Do not use historical v0.x colours or rejected campaign templates as the visual standard.

Choose by task intent: social application → native aspect ratio and question/detail/decision hierarchy; proposal/deck → white clarifying rules; website → responsive Arabic-first hierarchy. Select the section explicitly; do not paste all guide rules indiscriminately. Use JSON tokens directly. Keep original logo, clear space and measured cut geometry. Layout exact LENS source strings; label hypotheses/concepts and unresolved contacts. Escalate ambiguity to Lead while proceeding with independent safe layout work.

| Request test | Selection | Ambiguity resolved / open |
|---|---|---|
| Navy website hero | 12–15 and 22; Arabic-first Cairo, original logo, white support, orange decision | Existing contact channel unknown: show internal TBC only, no fabricated CTA destination |
| White proposal | 07–14 and 23; logo navy holding square, navy text, semantic JSON | Orange body on white fails: change to navy; no proof claim without actual evidence |
| Arabic paid kitchen ad | 05–06, 16–18; exact LENS question, native 4:5 | Diagram CONCEPT only; image rights, project proof and placement overlays open; no release authority |

After changes: run local build/render/preview; inspect actual images at native/phone sizes and PDF raster, not source alone. Check all text against authority, logo decode, bidi, contrast, crop essentials, labels and footer separation. Record defects, fixes and remaining limitations. Keep before evidence. Versioned review is required before turning draft guidance into approved brand rules. Owner TSST Lead; execution CREATIVE_AG and verbal LENS_AG.
```

### Negative Tests (Trigger Boundary)
1. **Prompt:** "Define the fundamental brand mission, core values, brand archetype narrative, and strategic positioning pillars for a new luxury boutique in Cairo."
   - *Would this skill wrongly trigger?* **NO** (This establishes strategic brand foundations and positioning, which precedes guideline engineering).
   - *Owning skill:* `TSST-CREATIVE-SK-001` (Brand System Architecture) / `TSST-LEAD-SK-008` (Brand & Creative Strategy).
2. **Prompt:** "Review the exported PNG carousel ad images to identify contrast failures and logo clear space defects."
   - *Would this skill wrongly trigger?* **NO** (This performs post-production visual defect detection and QA on rendered assets).
   - *Owning skill:* `TSST-CREATIVE-SK-010` (Visual QA & Brand Compliance).

---

## 4. TSST-CREATIVE-SK-005 — Typography System

### Purpose
Define readable Arabic and Latin typography systems with role-based scales, pairing logic, line metrics, fallbacks, licensing, and cross-channel tests.

### Binary Checks
- [ ] **Check 1 (Semantic Roles & Tokens):** Are type tokens defined by semantic roles (display, heading, body, label, caption, data/code) with size, weight, line-height, and tracking specified for both scripts?
- [ ] **Check 2 (Optical Pairing Rationale):** Is the pairing between Arabic and Latin justified by visual weight, loop height, and stroke contrast rather than forcing identical mechanical metrics?
- [ ] **Check 3 (Bidi & Numeral Behavior):** Are bidirectional isolation rules (`<bdi>`), mixed-script inline formatting, and tabular numeral treatments explicitly defined?
- [ ] **Check 4 (Licensing & Font Delivery):** Are font licenses, distribution rights, web/app delivery methods, and local OS fallback stacks documented?
- [ ] **Check 5 (Cross-Surface Readability Testing):** Does the system verify legibility across diverse channel contexts (social 4:5/9:16, presentation decks, responsive mobile/web) at actual delivery sizes?

### Evaluation Flags
- `ARABIC_HUMAN_REVIEW` (Extensive Arabic typography specifications, font pairings, calligraphy rules, and Egyptian brand copy).

### Evidence (P0 — 5 Fresh Positive Test Runs)
*Full raw outputs preserved unedited in `runs/TSST-CREATIVE-SK-005-test-[1-5].md`.*

#### Summary of Test Runs:
- **Test 1 (`runs/TSST-CREATIVE-SK-005-test-1.md`):** Bilingual typography system for "VILL Studio" (New Cairo architectural practice) pairing Alexandria (Arabic) and Inter (Latin). Establishes optical ratio (Inter at 104%), 1.45–1.55 Arabic display leading, bidi isolation rules, and surface mapping across 1080×1350 social feed, 16:9 pitch decks, and responsive web.
- **Test 2 (`runs/TSST-CREATIVE-SK-005-test-2.md`):** Enterprise B2B FinTech typography system for "Masroofy" pairing IBM Plex Sans Arabic and IBM Plex Sans Latin. Engineered for dense financial tables, OpenType `tnum` tabular alignment, and mobile PWA input ergonomics.
- **Test 3 (`runs/TSST-CREATIVE-SK-005-test-3.md`):** Artisanal coffee brand typography system for "Kawkab Coffee" pairing Marhey (Arabic display) and Noto Kufi Arabic (body/tasting notes) with Outfit (Latin). Includes 70×100mm retail label micro-typography, 9:16 social stories, and bilingual cafe wall menus.
- **Test 4 (`runs/TSST-CREATIVE-SK-005-test-4.md`):** HealthTech telemedicine platform typography system for "Sehhaty Egypt" pairing Cairo and Plus Jakarta Sans. Tailored for unambiguous medical dosages, dot disambiguation on low-cost Android displays, and 200% accessibility scaling.
- **Test 5 (`runs/TSST-CREATIVE-SK-005-test-5.md`):** Luxury desert eco-lodge typography system for "Zulal Oasis" (Fayoum) pairing classical Amiri (Naskh Arabic) with Cormorant Garamond (Latin Serif). Features luxury hardcover compendium margins, social carousel headline placement over twilight sky, and transactional booking engine fallback.

### Negative Tests (Trigger Boundary)
1. **Prompt:** "Write a high-converting Arabic headline and three caption variations for our summer clearance sale on Instagram."
   - *Would this skill wrongly trigger?* **NO** (This produces advertising copy text rather than engineering the typographic font system).
   - *Owning skill:* `TSST-LENS-SK-012` (Arabic & Egyptian Copy Transcreation).
2. **Prompt:** "Build the complete light and dark mode color token system with semantic tokens for primary, surface, and border roles."
   - *Would this skill wrongly trigger?* **NO** (This designs the color palette system rather than typography roles and font pairings).
   - *Owning skill:* `TSST-CREATIVE-SK-006` (Color System & Accessibility).

---

## 5. TSST-CREATIVE-SK-008 — Creative Art Direction

### Purpose
Translate approved positioning into distinct, ownable visual directions and execute a selected direction consistently across real channel compositions.

### Binary Checks
- [ ] **Check 1 (Conceptual Divergence):** Does the deliverable present 2–3 directions that diverge in visual mechanism and concept rather than minor color or prompt tweaks?
- [ ] **Check 2 (Comprehensive Direction Specification):** Does each direction define a name, strategic idea, key visual device, composition structure, typography behavior, lighting/imagery, and production risks?
- [ ] **Check 3 (Comparative Rationale):** Is the selected direction justified against the brief with explicit rationale detailing why it is more ownable and what alternatives were rejected?
- [ ] **Check 4 (Light Leads the Eye):** Does the direction strictly reject dulling overlays, heavy black vignettes, or artificial haze placed over real photography to force type legibility?
- [ ] **Check 5 (Cross-Channel Adaptation):** Is the organizing visual idea adapted into realistic channel compositions (social, executive slide, responsive web) preserving identity without mechanical resizing?

### Evaluation Flags
- `ARABIC_HUMAN_REVIEW` (Egyptian brand context, Arabic-first visual hierarchy, and bilingual layout rules).

### Evidence (P1 — Reused Past Job)
- Source job: VILL Brand Guidelines v1.0 Art Direction Decision (`C7-VILL-12`, task closed 2026-10-05).
- Location: `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0/ART_DIRECTION.md`

LOCATOR: TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0/ART_DIRECTION.md#L1-L9
EXCERPT:
```
# Direction decision - before implementation

A - Decision cut. Strategic idea: reveal a decision and the evidence it needs. One diagonal boundary uses the original V's measured 19.26 degree lean; two fields carry question and rule, orange marks the decision once. Asymmetrical Arabic-first headings, Cairo 900/700 with calm Latin support; white clarifies method, navy groups evidence. Imagery remains truthful and licensed; diagrams labelled CONCEPT, not proof. Risks: cuts can become ornament; require one meaningful relationship and one focal point.

B - Scope ledger. Strategic idea: make scope visible as an editorial register. Vertical ledger columns, numbered rules, tabulated evidence, no diagonal split. Cairo 700, disciplined baseline, alternating navy and white; orange indexes records. Calm detail imagery after rights verified. Risk: usable but resembles any architecture documentation system and loses the distinctive logo's direction.

Select A: geometry can survive removal of colour/logo, links to the user's approved direction and supports question-to-detail-to-rule. Reject B as the primary device; retain tabular discipline only when needed for rules. Native applications adapt cut scale and information order; never simply resize.

Palette is approved; execution and LENS verbal are draft for review. No fabricated plan/built/QC records. SK-008 direction method; SK-002 rule structure; SK-005 AR-first role scale; SK-010 actual render inspection.
```

### Negative Tests (Trigger Boundary)
1. **Prompt:** "Write a 15-second storyboard with shot-by-shot visual prompts, transition cues, and sound effects for an AI-generated product video."
   - *Would this skill wrongly trigger?* **NO** (This creates a motion beat sheet and AI video prompt sequences).
   - *Owning skill:* `TSST-MOTION-SK-005` (AI Shot List & Prompts).
2. **Prompt:** "Export and package final 300 DPI CMYK PDF files with crop marks and bleed specifications for commercial offset printing."
   - *Would this skill wrongly trigger?* **NO** (This handles technical prepress export pipeline rather than conceptual art direction).
   - *Owning skill:* `TSST-CREATIVE-SK-019` (Creative Production Pipeline & Export QA).

---

## 6. TSST-CREATIVE-SK-010 — Visual QA & Brand Compliance

### Purpose
Detect and correct visual defects before any creative is accepted for user/media review.

### Binary Checks
- [ ] **Check 1 (Render Inspection):** Does the QA audit inspect the actual rendered output (pixels, image exports, rasters) rather than evaluating only source prompts, layout briefs, or CSS markup?
- [ ] **Check 2 (Multi-Dimensional Quality Criteria):** Are logo clear space/geometry, typography, Arabic shaping, color roles, platform safe zones, composition hierarchy, and photographic quality audited?
- [ ] **Check 3 (Structured Defect Logging):** Is each detected defect documented with severity (Critical/Major/Minor), visual evidence location, required corrective action, and re-inspection verification?
- [ ] **Check 4 (Gate Downgrade Discipline):** Are assets downgraded to PREVIS or PRODUCTION_DRAFT when unrendered or when unresolved defects remain?
- [ ] **Check 5 (Objective Measurement):** Are contrast ratios and platform safe zones verified against concrete standards (WCAG AA/AAA and native platform UI overlays)?

### Evaluation Flags
- `ARABIC_HUMAN_REVIEW` (Audits Arabic typography shaping, RTL reading alignment, and regional Egyptian copy).

### Evidence (P0 — 5 Fresh Positive Test Runs)
*Full raw outputs preserved unedited in `runs/TSST-CREATIVE-SK-010-test-[1-5].md`.*

#### Summary of Test Runs:
- **Test 1 (`runs/TSST-CREATIVE-SK-010-test-1.md`):** Audited rendered 1080×1350 PNG for VILL Studio kitchen reveal. Identified 5 defects: Critical contrast failure (Orange on White card 2.28:1), Major logo clear-space violation (38px margin < 76px H), Critical Arabic ligature break in "المعمارية", and Major art direction violation (gradient wash over oak cabinetry). All remediated and verified.
- **Test 2 (`runs/TSST-CREATIVE-SK-010-test-2.md`):** Audited 9:16 (1080×1920) TikTok/Reels master cover for Jannat New Cairo. Detected Critical platform UI collision (CTA button blocked by right interaction rail), Major 1:1 profile crop cut-off, and Major bidi price reversal ("5.2M ج.م يبدأ من"). All resolved and re-tested against native overlays.
- **Test 3 (`runs/TSST-CREATIVE-SK-010-test-3.md`):** Audited 1920×1080 executive pitch deck slides for PayMasr fintech. Caught Critical logo horizontal stretch (+12% distortion), Major tabular number misalignment in financial columns, and unreadable 9px gray footnote. All corrected.
- **Test 4 (`runs/TSST-CREATIVE-SK-010-test-4.md`):** Audited 3-slide product carousel (1080×1350) for Kawkab Coffee. Caught Major seam jump (42px vertical misalignment of continuous flavor graphic across slides 1–2), Critical tasting note contrast failure (1.85:1 over table photo), and packaging mockup perspective warp.
- **Test 5 (`runs/TSST-CREATIVE-SK-010-test-5.md`):** Audited responsive mobile web hero (390×844 iPhone render) for Zulal Oasis eco-lodge. Detected Critical RTL header inversion (hamburger placed at right in Arabic view), Major touch-target failure (26×34px date button failing 44×44px WCAG), and dark wash violation over sunset photography. All corrected and approved.

### Negative Tests (Trigger Boundary)
1. **Prompt:** "Design an accessible color palette for our SaaS web application with semantic tokens for success, error, warning, and neutral states."
   - *Would this skill wrongly trigger?* **NO** (This designs the color system rather than conducting QA defect audits on rendered designs).
   - *Owning skill:* `TSST-CREATIVE-SK-006` (Color System & Accessibility).
2. **Prompt:** "Conduct a usability test and heuristic UX evaluation of our CRM checkout flow with 5 representative users."
   - *Would this skill wrongly trigger?* **NO** (This is a UX heuristic evaluation and usability study rather than visual brand render QA).
   - *Owning skill:* `TSST-CREATIVE-SK-030` (Usability Testing & UX QA).

---

## 7. TSST-DEV-SK-011 — Testing & TDD Engineering

### Purpose
Use when behavior changes need a test strategy, regression protection or meaningful automated tests.

### Binary Checks
- [ ] **Check 1 (Risk-to-Test Mapping):** Does the test design map acceptance criteria and failure risks to appropriate test levels (unit, integration, contract, E2E) at the lowest cost level that observes behavior?
- [ ] **Check 2 (Deterministic Fixtures):** Are edge cases and adverse paths covered using independent, deterministic test fixtures that isolate external dependencies?
- [ ] **Check 3 (Meaningful Failure Observation):** Does the work demonstrate meaningful failure-to-pass observation (RED → GREEN → REFACTOR) without mock-away tautologies?
- [ ] **Check 4 (Real Execution Evidence):** Are automated tests executed freshly on the target codebase with real command output, exit status, and suite statistics reported?
- [ ] **Check 5 (Coverage & Boundary Transparency):** Are skipped checks, environment limitations, and remaining coverage gaps explicitly documented?

### Evaluation Flags
- None (Automated software test suites and CLI command outputs).

### Evidence (P0 — 5 Fresh Positive Test Runs)
*Full raw outputs preserved unedited in `runs/TSST-DEV-SK-011-test-[1-5].md`.*

#### Summary of Test Runs:
- **Test 1 (`runs/TSST-DEV-SK-011-test-1.md`):** Real test execution of CRM_APP native bootstrap test suite (`tests/native-bootstrap.test.ts`). Ran `npx tsx --test tests/native-bootstrap.test.ts`. Real output: 4/4 passed, 0 failed, duration 7077ms. Verified deterministic `mkdtemp` lifecycle and password SHA256 integrity.
- **Test 2 (`runs/TSST-DEV-SK-011-test-2.md`):** TDD adverse-path regression test for partial cluster retry. Tested simulated interrupted initialization; verified non-zero exit code, error message regex match, and byte-for-byte SHA256 preservation of existing password.
- **Test 3 (`runs/TSST-DEV-SK-011-test-3.md`):** TDD edge-case test for incomplete cluster credentials. Tested missing password file with existing data directory; verified script fails closed without creating orphaned credentials.
- **Test 4 (`runs/TSST-DEV-SK-011-test-4.md`):** TDD guardrail test for orphaned password preservation. Verified pre-existing password file is untouched by abortive re-initializations.
- **Test 5 (`runs/TSST-DEV-SK-011-test-5.md`):** Adverse-path worker crash regression test (`tests/crash-worker.ts`). Verified that sudden process termination (`process.exit(77)`) triggers immediate database rollback and outbox lock release without orphaned database effects.

### Negative Tests (Trigger Boundary)
1. **Prompt:** "Perform a security threat modeling assessment on our JWT token refresh flow using the STRIDE methodology."
   - *Would this skill wrongly trigger?* **NO** (This performs architectural threat analysis rather than engineering automated automated test suites).
   - *Owning skill:* `TSST-DEV-SK-008` (Security Threat Modeling).
2. **Prompt:** "Investigate and diagnose the root cause of an unexplained intermittent 500 error in the webhook ingestion endpoint."
   - *Would this skill wrongly trigger?* **NO** (This focuses on defect localization and debugging rather than test strategy and regression engineering).
   - *Owning skill:* `TSST-DEV-SK-010` (Systematic Debugging & Root Cause Analysis).

---

## 8. TSST-DEV-SK-015 — Verification Before Completion

### Purpose
Use before claiming an engineering task is complete, fixed, passing or ready for handoff.

### Binary Checks
- [ ] **Check 1 (Fresh Evidence Rule):** Is each completion claim supported by fresh, locatable verification evidence rather than assertions, historical logs, or assumptions?
- [ ] **Check 2 (Command & Output Inspection):** Does the verification record exact commands, exit statuses, full terminal outputs, failures, and skipped checks?
- [ ] **Check 3 (Behavior vs Command Execution):** Does the verification distinguish successful command termination from proof of the required system behavior?
- [ ] **Check 4 (Unverified Boundary Disclosure):** Are all remaining unverified items, environment constraints, and deferred risks explicitly enumerated with their consequences?
- [ ] **Check 5 (Structured Verification Ledger):** Does the report provide the required structured format (Claim, Evidence, Verification Method, Result, Remaining Unverified Items, Version/Environment)?

### Evaluation Flags
- None (Technical verification ledgers and environment audits).

### Evidence (P0 — 5 Fresh Positive Test Runs)
*Full raw outputs preserved unedited in `runs/TSST-DEV-SK-015-test-[1-5].md`.*

#### Summary of Test Runs:
- **Test 1 (`runs/TSST-DEV-SK-015-test-1.md`):** Fresh verification of the CRM native bootstrap subsystem. Executed `npx tsx --test tests/native-bootstrap.test.ts` (Exit code 0, 4/4 passing). Produced structured 4-row ledger mapping claims to evidence lines.
- **Test 2 (`runs/TSST-DEV-SK-015-test-2.md`):** Negative/blocked verification audit testing containerized deployment claim (`compose.yaml`). Executed `docker ps`, captured exit code 1 and named pipe failure, and explicitly recorded the Docker pathway as BLOCKED without assuming success.
- **Test 3 (`runs/TSST-DEV-SK-015-test-3.md`):** Repository cleanliness and whitespace audit. Executed `git diff --check` (Exit code 0) and `git status --short`, confirming zero whitespace errors and verifying that all modifications are strictly confined within `TSST/skills/validation/`.
- **Test 4 (`runs/TSST-DEV-SK-015-test-4.md`):** Environment engine verification against `CRM_APP/package.json` line 7 constraint (`engines.node: "24.18.0"`). Executed `node -v` (Output: `v24.18.0`, exit code 0) and validated compliance.
- **Test 5 (`runs/TSST-DEV-SK-015-test-5.md`):** Post-execution teardown hygiene audit. Queried `$env:TEMP` for residual `crm-m0-bootstrap-*` directories following test runs, confirming 0 orphaned directories.

### Negative Tests (Trigger Boundary)
1. **Prompt:** "Set up the GitHub Actions CI workflow to run lint and unit tests on every pull request."
   - *Would this skill wrongly trigger?* **NO** (This creates CI/CD pipeline automation infrastructure rather than auditing completion claims).
   - *Owning skill:* `TSST-DEV-SK-013` (CI/CD & Release Engineering).
2. **Prompt:** "Conduct an architectural code review of PR #42 to evaluate maintainability and code structure."
   - *Would this skill wrongly trigger?* **NO** (This performs peer code review rather than pre-completion claim verification).
   - *Owning skill:* `TSST-DEV-SK-012` (Code Review & Change Risk).
