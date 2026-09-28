# TSST-CREATIVE-SK-008 Evaluation — Creative Art Direction

Status: `PASS`  
Skill status: `LAB_VALIDATED`

## Task

Use `NABD-ART-DIRECTION-v1.0` to create three distinct visual directions, select one with comparative rationale, and execute it as a social ad, executive presentation slide, and responsive web hero with Arabic/English consideration.

## Required visual evidence

- three direction boards with visibly different concepts;
- one selected direction and rejection rationale for the alternatives;
- rendered social ad;
- rendered 16:9 executive slide;
- rendered desktop and mobile web hero;
- typography, composition, imagery, spacing, brand-consistency, and visual-QA notes.

## Evaluation emphasis

Score the actual rendered work for visual hierarchy, originality, brand coherence, cross-channel consistency, readability, production realism, and whether it looks generic or genuinely art-directed.

## Automatic failures

- documentation without rendered visual applications;
- three directions that are only color swaps or prompt variants;
- copied external identity;
- unreadable or corrupted Arabic/English used as final evidence;
- campaign publication or unsupported performance/production claims.

## Validation ceiling

This synthetic internal test may recommend no higher than `LAB_VALIDATED`.

## Evaluation record

Evaluation ID: `TSST-CREATIVE-EV-008`  
Skill ID and skill version: `TSST-CREATIVE-SK-008`, package v0.1  
Agent: CREATIVE_AG — Visual Identity & Creative Agent  
Date: 2026-09-20  
Evaluator: TSST Lead with an independent visual reviewer  
Fixture: `NABD-ART-DIRECTION-v1.0`  
Evidence directory: `CREATIVE/evaluations/TSST-CREATIVE-EV-008-output/`

### Test brief

Create three genuinely distinct visual directions for the fictional bilingual municipal water-network platform NABD, choose one against the approved brief, and execute that direction as a 1080×1350 social ad, 1920×1080 executive slide, and responsive desktop/mobile web hero. The test required credible Arabic/English behavior, typography hierarchy, composition, imagery direction, spacing, brand consistency, and inspection of the actual rendered pixels.

### Actual output

The candidate created three direction boards:

1. **Civic Cutaway** — a sectional surface/system/signal field with a buried path and inspection aperture.
2. **Operational Ledger** — a field-record metaphor using ruled columns, check marks, ownership, and a decision chain.
3. **Pressure Echo** — an off-axis radial pressure field with a warm interrupted pulse.

It selected **Civic Cutaway** because its concept makes hidden infrastructure legible without a literal dashboard and carries consistently across the three required channels. It then produced finished HTML/CSS renders for social, executive slide, desktop hero, and mobile hero, plus a rationale and internal QA record.

### Visual score

| Criterion | Weight | Score | Evidence |
| --- | ---: | ---: | --- |
| Visual hierarchy | 15 | 13 | Strong promise-first hierarchy and stable aperture focal point; some micro-labels and dead space weaken secondary scan order. |
| Originality | 15 | 12 | Civic Cutaway is distinctive and avoids stock/SaaS clichés; Operational Ledger and Pressure Echo rely more on familiar form/wireframe and radar conventions. |
| Brand coherence | 15 | 13 | Mineral palette, cutaway strata, oblique signal path, circular aperture, and calm editorial typography form a consistent system. |
| Cross-channel consistency | 15 | 14 | The selected grammar is clearly preserved while crop, density, order, and proportion adapt to each surface. |
| Readability | 15 | 11 | Arabic shaping is intact, but the executive Arabic headline orphans `مياه.`, Arabic proof/footer labels are too small for projection, and mobile overlay labels are too small and low-contrast. |
| Production realism | 15 | 11 | Correct native dimensions and real responsive reflow were demonstrated, but redundant CTAs, unequal bilingual CTA emphasis, microcopy sizes, and unresolved whitespace prevent production readiness. |
| Genuinely art-directed vs generic | 10 | 8 | The selected direction has an organizing idea that survives without color and is more than a prompt; the alternatives are less resolved and somewhat familiar. |

Run 01 total score: **82/100**

The global 85-point threshold was not met, and readability and production realism fell below the required 8/10 floor.

Critical failures: none.  
Run 01 result: **FAIL**.  
Training disposition: revision-capable; **not `NEEDS_RETRAINING`**.  
Run 01 validation state: **`UNVALIDATED`**.

### Exact visual weaknesses

1. **Executive slide:** the Arabic headline leaves `مياه.` orphaned; the Arabic proof line and bottom evidence labels are not convincingly projector-safe.
2. **Desktop hero:** the header CTA duplicates the primary CTA; the Arabic secondary CTA is smaller and visually weaker than the English action; small evidence pills/process labels approach annotation size; lower-left space is under-resolved.
3. **Mobile hero:** tiny white evidence labels overlay the signal path and dark strata with inconsistent contrast; `PRESSURE SIGNAL` competes with the line; the header CTA is redundant; excessive vertical space separates action from imagery.
4. **Social ad:** the bilingual headlines are strong, but the gap before imagery is oversized and the bottom CTA/pressure label become marginal at feed scale.
5. **Direction 01 board:** faint large ellipses can read as leftover construction guides, and Arabic typographic behavior is demonstrated only in the small lockup.
6. **Direction 02:** the table, checkboxes, bars, and empty columns resemble an under-resolved UI wireframe despite the intended physical-ledger metaphor; it is less distinctive at feed scale.
7. **Direction 03:** concentric rings resemble a familiar radar/target device, infrastructure meaning depends on explanatory copy, and bottom annotations are too small.
8. The candidate's own QA called the slide projector-safe and all native-size labels adequate, but the independent pixel review contradicted those claims. The QA method needs target-distance and minimum-size checks rather than visual inspection alone.

### Recommended remediation

- Reflow the executive Arabic headline to remove the orphan and enlarge the Arabic proof/footer labels for projector viewing.
- Establish explicit minimum rendered sizes for social, slide, desktop, and mobile annotations, then retest at target viewing scale.
- Give Arabic and English CTAs comparable hierarchy; remove redundant header CTAs.
- Remove or enlarge mobile overlay microcopy and place it on a stable high-contrast surface away from the signal line.
- Tighten vertical rhythm between bilingual copy, actions, and imagery on social/mobile and resolve unused desktop space.
- Refine Direction 02 away from UI wireframe conventions and Direction 03 away from generic radar symbolism, even if they remain unselected alternatives.
- Repeat visual QA with feed-scale, projector-distance, desktop, and physical/mobile-size views. A corrected rerender may use retest ID `TSST-CREATIVE-EV-011`.

No campaign was launched or published, and no production validation is claimed.

## Remediation evaluation

Evaluation ID: `TSST-CREATIVE-EV-011`  
Type: focused remediation retest  
Core direction: Civic Cutaway preserved  
Evidence: revised social, slide, desktop hero, and mobile hero renders with old versions retained  
Result: **PASS**  
Score: **88/100**  
Validation state: **`LAB_VALIDATED`**

### Old versus revised proof

| Previous failure | Revised evidence | Result |
| --- | --- | --- |
| Arabic title orphaned `مياه.` on the executive slide | Title is manually balanced across two meaningful lines: `اكتشف هبوط الضغط قبل أن يتحول` / `إلى فاقد مياه.` | Corrected |
| Arabic proof and evidence labels were not projector-safe | Arabic proof increased from 23 px to 28 px with a controlled two-line break; evidence labels increased from 15 px to 19 px and gained Arabic counterparts | Corrected at 1920×1080 lab scale |
| Arabic CTA was weaker than English on desktop | English and Arabic CTAs now occupy equal columns, height, fill, and visual weight | Corrected |
| Mobile labels collided with the signal path and had unstable contrast | The tiny overlay list was removed; the remaining bilingual pressure label sits on an opaque sand card away from the path | Corrected |
| Social copy-to-visual rhythm had excessive dead space | The cutaway begins 90 px earlier, its field is taller, and equal CTA bars anchor the visual bottom | Corrected |
| Desktop lower-left area was under-resolved | Approved English/Arabic proof content now occupies the mid-field and the operational chain anchors the bottom | Corrected |
| Header actions duplicated the primary CTA | Header CTAs were removed on desktop and mobile; headers now contain identity/context only | Corrected |
| Responsive behavior felt partially compositional rather than production-realistic | Mobile uses stacked full-width bilingual actions, removes unsafe microcopy, preserves a 20 px gutter, and retains the aperture in the intentional crop | Corrected in static responsive lab evidence |

### Remediation score

| Criterion | Weight | Revised score | Change from run 01 |
| --- | ---: | ---: | ---: |
| Visual hierarchy | 15 | 14 | +1 |
| Originality | 15 | 12 | 0 |
| Brand coherence | 15 | 14 | +1 |
| Cross-channel consistency | 15 | 14 | 0 |
| Readability | 15 | 13 | +2; passes minimum |
| Production realism | 15 | 13 | +2; passes minimum |
| Genuinely art-directed vs generic | 10 | 8 | 0 |
| **Total** | **100** | **88** | **+6** |

The unchanged pass threshold was 85/100. Readability and production realism each reached 13/15, exceeding the required 8/10-equivalent floor.

### Remaining lab limitations

- Projector safety is supported by the 1920×1080 raster and larger type, not by a physical projector/viewing-distance test.
- The Arabic face is a system-font lab fallback; production still requires licensed font selection and qualified Arabic editorial review.
- Static web renders do not establish browser compatibility, zoom, focus, keyboard, hover, or full accessibility behavior.
- Social rhythm is materially improved but still requires an actual platform crop/preview before publication.
- The unselected Operational Ledger and Pressure Echo directions were not remediated because this retest was limited to Civic Cutaway.

No real campaign was launched. `LAB_VALIDATED` is the maximum and applied state; no pilot or production validation is claimed.
