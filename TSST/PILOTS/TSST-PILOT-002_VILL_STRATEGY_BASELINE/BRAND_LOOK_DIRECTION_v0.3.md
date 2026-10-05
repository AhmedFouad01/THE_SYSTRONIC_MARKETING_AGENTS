# VILL Studio — Brand Look Direction v0.3

2026-10-05 · VILL_STUDIO / VILL-001 · C7-VILL-07 · CREATIVE written visual direction (revision of v0.2).
Status: REVISED DRAFT FOR LEAD ACCEPTANCE; user approval pending. v0.2 and earlier are preserved.
Inputs: [BRAND_LOOK_DIRECTION_v0.2.md](BRAND_LOOK_DIRECTION_v0.2.md), inputs/Logo.png, inputs/VI/, [BRIEF.md](BRIEF.md).
Scope: written specification only. No image/video generation, no render QA, no final-asset claim. Every rule below is a **RECOMMENDATION** unless labelled otherwise.

## 0. ملخص بالعربي (R10)

**الشخصية:** VILL Studio استوديو تصميم وتنفيذ fit-out بيبيع وضوح النطاق وتقليل مخاطر التنفيذ قبل ما يبيع الفخامة. الشكل البصري هادئ، معماري، دقيق: خامات حقيقية، مساحات فاضية مقصودة، grid منضبط، ومفيش زخرفة أو ذهب أو مبالغة luxury.

**الخط والاتجاه:** نستخدم عائلة واحدة مقترحة (IBM Plex Sans Arabic + IBM Plex Sans). النص العربي دايمًا RTL ومحاذاة يمين، من غير letter-spacing ومن غير tatweel أو مط للحروف. أي اسم لاتيني أو رقم مع وحدته (زي 2400 mm) يتعزل كـ run مستقل عشان ترتيب القراءة ميتلخبطش. الأرقام في القياسات والأسعار والتواريخ بالأرقام الغربية (0–9) كاقتراح، والقرار النهائي مفتوح للمستخدم. اللوجو والصور والرسومات الهندسية لا تُعكس أبدًا في النسخة العربية.

**الإثبات:** أي رقم قياس، أو "QC Verified"، أو "مشروع منفذ" لازم يكون وراه سجل حقيقي (مشروع، تاريخ، مصدر، إذن نشر). أي مشهد توضيحي أو moodboard يتكتب عليه CONCEPT ومينفعش يتقدم كدليل تنفيذ.

**المطبخ:** إعلان المطبخ يفضل kitchen-specific: فايدة المطبخ + CTA "Project Assessment" ويودي على صفحة المطبخ المخصصة بنفس الهوية والخط والألوان. باقي البيت يظهر كامتداد اختياري بس، ومن غير ما نلمّح إن العميل لازم يشتري البيت كله.

## 1. Brand character & principles

VILL expresses “One vision. One scope. One accountable team” and the stored pillars (design intelligence, execution control, transparency, detail, accountability) [Strategy v0.2 §2]. It sells risk reduction and clarity before aesthetics.

1. **Architectural restraint** — structure, sightlines and proportion over ornament; no gold trims, faux-3D badges, gradient borders.
2. **Material truth (R8)** — show real finishes as they are. Named materials in this document are *aesthetic references*, not VILL specifications or installed products. Actual project finishes always win over the palette; never alter real grain, gloss or material identity to "fit" the look.
3. **Information clarity** — layouts read like a well-organised drawing set: clear hierarchy, purposeful negative space, annotations that explain a decision.
4. **Process truth (R4)** — execution content is welcome *only* when backed by a real record (§7). Ideal-looking process imagery without a record is CONCEPT.

## 2. Colour system (Phase 2)

Derived directly from \Logo.png\ and the VI \
Dark
Luxury
DNA\ deck. No new colours were added; the palette is harmonised around the logo's exact sampled values.

| Role | Name | Hex | Use & Distribution |
|---|---|---|---|
| Primary Brand | Logo Navy | \#040136\ | 60% — Primary text, reversed backgrounds, structural elements. Exact from Logo.png. |
| Accent Brand | Logo Orange | \#EE8C01\ | 5% — Call to action (CTA) backgrounds, tight focal highlights. Exact from Logo.png. |
| Base / Light | Warm Ivory | \#F2EFE6\ | 20% — Dominant background, negative space. From VI deck. |
| Neutral | Soft Stone | \#B8B6B0\ | 2% — Secondary surfaces, decorative hairlines. From VI deck. |
| Dark Accent | Obsidian | \#0E0E0F\ | 10% — Deepest shadows, extreme contrast edges. From VI deck. |
| Warm Structure | Smoked Oak | \#2A2119\ | 3% — Secondary headings on light grounds, architectural accents. From VI deck. |

*Note: Aged Bronze (\#B07A3C\ from VI) is omitted from core UI use to avoid clashing with the primary Logo Orange.*

**FACT — isolated opaque sRGB pair contrast** (WCAG relative-luminance formula):

| Text / foreground on background | Ratio | Allowed text use |
|---|---|---|
| Logo Navy \#040136\ on Warm Ivory \#F2EFE6\ (and reverse) | 17.19:1 | Any size |
| Logo Navy on Soft Stone \#B8B6B0\ | 9.74:1 | Any size |
| Smoked Oak \#2A2119\ on Warm Ivory | 13.73:1 | Any size |
| Logo Orange \#EE8C01\ on Logo Navy | 7.89:1 | Any size |
| Logo Orange on Obsidian \#0E0E0F\ | 7.71:1 | Any size |
| Logo Orange on Warm Ivory | 2.18:1 | **Never text** — decorative or large button backgrounds only |
| Soft Stone on Warm Ivory | 1.76:1 | **Decorative only** — never text |

Rules: no opacity/tint reductions on text colours; no text on photographs without a tested solid or scrim panel; meaningful dividers must use Logo Navy or Smoked Oak, not Soft Stone alone.


## 3. Typography

**Proposed pair:** IBM Plex Sans Arabic (Arabic) + IBM Plex Sans (Latin). 
*(Note: The VI deck implies a typographic direction, but as no specific font files were provided in \inputs/VI/\, we retain the unified superfamily recommendation from v0.2 to ensure metric harmony.)*
Fallback stacks: Arabic \\\\
IBM
Plex
Sans
Arabic\, \Noto
Sans
Arabic\, Tahoma, sans-serif\; Latin \\\\IBM
Plex
Sans\, \Helvetica
Neue\, Arial, sans-serif\. Weights in use: Regular 400, Medium 500, SemiBold 600 only.

**Logo Usage (Phase 2):**
- Primary mark is \Logo.png\.
- **Clear space:** Minimum clear space around the logo must equal the height of the \V\ in the logo.
- No typographic recreation of the logo is permitted.


**Script-specific tokens (R1):**

| Token | Latin | Arabic |
|---|---|---|
| Tracking | Display −0.01em; labels +0.02em max | **0 always** — no letter-spacing, no tatweel/kashida, no horizontal stretch or condensed faking |
| Line-height | Display 1.15 · headings 1.25 · body 1.5 | Display 1.35 · headings 1.45 · body 1.7 (room for diacritics, ascenders, descenders) |
| Case | Sentence case; ALL CAPS only for ≤3-word labels | n/a |
| Weight for emphasis | Medium/SemiBold | Medium/SemiBold; never faux-bold or outline |

**Unit mapping (R3):**

| Level | Web (CSS) | Social export, px on 1080-wide canvas (starting values) |
|---|---|---|
| Display | `clamp(2.5rem, 5vw, 4rem)` | 88–120 px |
| H1/H2 | 1.75–2.25rem | 56–72 px |
| Subhead | 1.125–1.25rem | 40–48 px |
| Body | 1rem (16 px) min | 34–40 px |
| Data label | 0.8125rem (13 px) min | 28 px min |

Social values are **HYPOTHESIS** starting points (1 rem = 16 px). They must be validated later at phone display size with the longest Arabic copy and the fallback font; this document claims no rendered pass or failure.

## 4. Arabic / RTL and bilingual rules (R2)

- **Base direction:** Arabic blocks are `dir="rtl"`, right-aligned; Latin blocks LTR, left-aligned. No centred long paragraphs.
- **Isolation:** each complete Latin run and each number+unit run is isolated (`<bdi>` / `dir` span in web; FSI…PDI in other tools) so the unit stays with its number and punctuation lands correctly.
- **Numerals:** proposed default Western digits 0–9 for dimensions, prices, dates and IDs; units in Latin (`mm`, `m²`). Arabic-Indic digits in prose = open decision for the user. One system per asset.
- **Bilingual order:** one primary language per asset; the secondary language is smaller and grouped, not interleaved line-by-line. Technical terms stay in English per BRIEF.
- **Mirroring:** Arabic-primary layouts mirror reading-order elements (text column side, sequence arrows, carousel progress). **Never mirror** logos, photographs, renders, plans or technical drawings.
- **Later QA strings (not tested here):** «مطبخ VILL — 2400 mm (عرض)», «Project Assessment — احجز تقييم مشروعك», a date «2026-10-05», a price «EGP 250,000» placeholder, a mixed sentence ending in Latin and a parenthesis. Check joining, diacritic clipping, run order and punctuation.

## 5. Image & render direction

- Perspective: one- or two-point aligned to architecture; camera ~100–120 cm; 24–50 mm full-frame equivalent to limit distortion.
- Light: soft daylight key; warm accent lighting only where functional; no HDR halos or coloured effects.
- Detail: joints, edges, transitions, grain matching, shadow gaps — **only** when photographed from a real project (§7).
- Finishes (R8): reflective or glossy real finishes are shown truthfully; control glare and distortion through angle and light, do not retouch them matte.
- Render labelling: every render carries `3D Concept Visualization` / `تصور ثلاثي الأبعاد`; only record-backed photography may carry `Completed Project / مشروع منفذ` [Strategy v0.2 §2].

## 6. Layout, grid & formats (R7)

- Composition margin of 8–10% is **guidance**, not a platform-safe certification.
- Before production release: apply the current placement-specific UI overlay for each placement (feed, Stories/Reels, Search assets as applicable), plus thumbnail/crop previews and a phone preview. Protect CTA, wordmark, captions and render labels in every crop.
- Split-screen (plan/built, render/built, before/after): 50/50 with a Basalt or Walnut divider when the split carries meaning; each half labelled with its type (render / built / plan).
- Annotation language (dimension lines, material labels, check tags) is allowed only under §7; otherwise it is visibly marked `Illustrative`.
- Formats: Carousel 4:5 (1080×1350); Reels 9:16 (1080×1920), restrained lower-thirds, no bouncy stickers; single image 1:1 / 4:5, one focal point, ≥30% negative space as guidance.

## 7. Proof & annotation rule (R4)

A factual annotation or proof claim (dimension, tolerance, "QC Verified", milestone status, "Completed Project", testimonial) may appear in external creative **only if** it has a record with: project ID, source document (drawing / QC sheet / handover record / review), date, responsible signer, and client/asset permission. Precision words ("millimetre-accurate") require a documented tolerance from that record.
Without a record: the element is either removed or labelled `CONCEPT` / `Illustrative` and must not imply execution, pass status or completion. Nothing is inferred from renders or moodboards. Record collection sits with CREATIVE + Operations [OPEN_DATA_REQUESTS P1 Proof].

## 8. Kitchen paid entry within the whole-home brand (R9)

- **Primary message:** a kitchen-specific benefit and the `Project Assessment` CTA, routed to the dedicated kitchen page with the same wordmark, typography, palette and grid [Strategy v0.2 §3].
- **Brand cue:** contextual line “VILL Studio · Interior Design & Fit-out” (Strategy v0.2 §3); no kitchen sub-brand, no separate visual language, and the v0.1 descriptor “Integrated Architectural Scope” is withdrawn because it can obscure a kitchen-only offer.
- **Whole-home:** secondary and optional — e.g. a later carousel slide or page section. Adjoining-room views are allowed when truthful, never compulsory; tight kitchen detail crops are fine.
- **Never imply** that a whole-home purchase is required to buy a kitchen.
- CREATIVE reviews ad + page + assessment together before any production.

## 9. Written moodboard (CONCEPT — illustrative only, no generated images)

All three are described archetypes for direction, **not** VILL projects, records or proof (R4, R8).
1. **Living reception (whole-home):** calm double-height space, daylight, continuous pale stone-like floor to terrace, low timber seating, clean ceiling shadow line. Materials are aesthetic references only.
2. **Kitchen workshop (kitchen entry):** central island with textured stone-like cladding, dark matte top, full-height timber joinery, one linear pendant aligned to the island. Optional background glimpse of a dining area — illustrative, not a required element.
3. **Process table (execution content placeholder):** drawing set, material samples and a blank inspection sheet on a table. Labelled `CONCEPT`; carries no pass status, dimensions or milestone claim. In production it is replaced by a real record per §7 or not used.

## 10. Dos and don'ts

| Do | Don't |
|---|---|
| Explain the decision behind the design in restrained language | Superlatives ("exclusive luxury", "unmatched"), absolute guarantees |
| Use Basalt/Walnut for meaningful text and dividers | Put text in Raw Mortar or on unpanelled photos |
| Keep Arabic tracking 0, RTL, isolated Latin/number runs | Letter-space, stretch or tatweel Arabic; flip logos or drawings |
| Show real finishes truthfully, gloss included | Retouch materials to fit the palette |
| Label renders and concepts clearly | Present renders, moodboards or placeholders as executed proof |
| Keep kitchen ads kitchen-specific inside the masterbrand | Make kitchen ads look like a separate shop, or imply whole-home is mandatory |

## Review disposition — C7-VILL-05

| Item | Disposition |
|---|---|
| R1 MAJOR Arabic tracking | Fixed §3: separate Latin/Arabic tokens; Arabic tracking 0, no tatweel/stretch; script-specific line-height; shaping/clipping checks deferred to production QA |
| R2 MAJOR RTL/bidi | Fixed §4: base direction, run isolation, numeral default + open decision, bilingual order, mirroring limits, QA strings listed (not tested) |
| R3 MAJOR units/readability | Fixed §3: web rem vs social export-px table, minimum labels, script-specific leading; social sizes labelled HYPOTHESIS; no rendered pass/fail claimed |
| R4 MAJOR proof claims | Fixed §§1, 6, 7, 9: record-required rule (project, source, date, signer, permission); v0.1 "millimetre-accurate", "2400 mm", "QC Verified · Milestone 03" and passed-inspection scene removed or marked CONCEPT |
| R5 MINOR contrast | Fixed §2: corrected 14.75:1 (recomputed); full pair table with allowed uses; Raw Mortar decorative only; no tinted text or untested photo overlays |
| R6 MINOR fonts | Fixed §3: one pair + fallback stacks + weights; licence/delivery and bilingual metric samples listed as open before use; mark not recreated by font |
| R7 MINOR safe zones | Fixed §6: margins as guidance; placement overlays, crop/thumbnail and phone preview required before release; no platform-safe certification |
| R8 MINOR material truth | Fixed §§1, 5, 9: materials are aesthetic references; real finishes win; blanket gloss ban replaced by glare/distortion control |
| R9 MINOR kitchen containment | Fixed §8: kitchen benefit + Project Assessment primary, dedicated kitchen page, whole-home optional, adjoining rooms not compulsory, v0.1 descriptor withdrawn |
| R10 MINOR language | Fixed §0: Arabic summary of character, type/RTL rules, proof rule and kitchen containment; technical terms kept in English |
| C7 Phase 2 | Phase 2 implementation | Fixed §§2, 3: exact hex sampled from Logo.png (#040136, #EE8C01); palette tokens updated with VI neutrals and distribution percentages; contrast table recomputed; typography retained from v0.2 but logo usage and clear space rules added. |

**Checkpoint:** v0.3 addresses Phase 2 brief (Logo.png hex sampling + VI neutrals) and v0.2 findings as producer dispositions for Lead verification, not self-acceptance. Open for the user: numeral system in Arabic prose, font licence/delivery confirmation, approved logo master. Actual shaping, readability, crop and final-asset QA remain unverified and need separately authorised production. VILL-001 stays open. Runtime: Antigravity, model selected in UI = Claude Opus 5.5 · high.
