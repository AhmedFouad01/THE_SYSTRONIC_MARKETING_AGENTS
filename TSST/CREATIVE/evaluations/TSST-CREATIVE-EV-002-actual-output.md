# `BRAND.md`

---
document: BRAND.md
brand: Madar Fleet / مدار فليت
version: 1.0
owner: CREATIVE_AG Brand Systems Lead
approver: Brand Lead
approved_date: 2026-09-20
review_date: 2026-12-20
---

# Madar Fleet Brand Guidelines

## 1. Purpose

Madar Fleet exists to make fleet maintenance predictable and accountable.

## 2. Positioning

Madar Fleet converts vehicle, workshop, and service-history records into prioritized maintenance actions with a visible audit trail.

The brand must communicate operational clarity and accountability. It must not imply entertainment, aggression, exclusivity, speculative technology, or unsupported automation.

## 3. Audience

The primary audience is logistics operators in the Middle East who need to understand, prioritize, execute, and audit fleet-maintenance work.

These guidelines serve:

- Human designers
- AI agents
- Front-end engineers
- Presentation teams
- Social-content teams

## 4. Brand attributes

| Attribute | Required expression |
|---|---|
| Clear | Use direct hierarchy, explicit labels, legible information, and unambiguous calls to action. |
| Dependable | Present records, actions, ownership, and evidence consistently. Avoid unsupported claims. |
| Disciplined | Use approved assets and tokens systematically. Keep layouts structured and purposeful. |
| Modern | Use current, restrained digital patterns without novelty for its own sake. |

### Anti-attributes

Madar Fleet must not appear:

- Playful
- Aggressive
- Luxury-coded
- Neon-futurist

Decoration, imagery, motion, typography, or language that introduces these qualities is outside the approved identity.

## 5. Identity principles

### 5.1 Operational clarity

Every composition should help its audience identify:

1. What requires attention
2. Why it requires attention
3. What action follows
4. Who owns that action
5. What evidence or history supports it

### 5.2 Visible accountability

Maintenance states, ownership, dates, records, and audit information should be explicit rather than implied by visual styling.

### 5.3 Restrained confidence

Use clear hierarchy and deliberate spacing. Avoid visual noise, exaggerated scale, decorative urgency, or dramatic effects.

### 5.4 Evidence before claims

Do not claim legal clearance, accessibility compliance, operational outcomes, or asset approval without evidence from the responsible source.

### 5.5 Equal language status

Arabic and English are peers. Neither language is a decorative translation or secondary brand layer.

## 6. Canonical sources

This document defines shared brand meaning and visual rules. It does not replace subject-specific canonical sources.

| Subject | Canonical source | Current version | Owner |
|---|---|---:|---|
| Purpose, positioning, attributes, audiences | [`strategy/positioning.md`](strategy/positioning.md) | 1.0 | Strategy Lead |
| Shared brand meaning and rules | `BRAND.md` | 1.0 | CREATIVE_AG Brand Systems Lead |
| Approved token values | [`tokens/brand.tokens.json`](tokens/brand.tokens.json) | 1.2 | Design Systems Lead |
| Asset filenames, approval state, rights, permitted edits | [`assets/manifest.yml`](assets/manifest.yml) | 1.1 | Brand Operations |
| Agent retrieval and decision procedure | [`AGENT_GUIDE.md`](AGENT_GUIDE.md) | 1.0 | CREATIVE_AG Brand Systems Lead |

Token values must be retrieved from `tokens/brand.tokens.json`. Asset state and rights must be confirmed in `assets/manifest.yml` at the time of use.

## 7. Logo system

### 7.1 Approved selection

| Surface condition | Required asset |
|---|---|
| Approved dark surface | `assets/logos/madar-lockup-dark.svg` |
| Approved light surface | `assets/logos/madar-lockup-light.svg` |
| Surface theme or approval is unknown | Do not place a logo; verify the surface or escalate. |

The asset named `madar-lockup-dark.svg` is the bilingual white lockup intended for approved dark surfaces. The asset named `madar-lockup-light.svg` is the bilingual navy lockup intended for approved light surfaces. Select by permitted surface, not by filename interpretation alone.

### 7.2 Symbol use

`assets/logos/madar-symbol.svg` may be used alone only when:

- A full bilingual lockup appears on the same page or in the same deck; or
- For sequential social content, a full bilingual lockup appears in the immediately preceding frame.

The symbol must never be the only identity on an isolated export.

### 7.3 Permitted transformation

All logo variants may be scaled proportionally.

No unsupplied minimum size, exclusion zone, alignment construction, or measurement may be inferred. Escalate if a use requires a rule not present in the canonical sources.

### 7.4 Prohibited transformations

Never:

- Recolor a logo
- Redraw or reconstruct it
- Separate its Arabic and English language elements
- Stretch or distort it
- Add outlines
- Add shadows
- Apply filters
- Automatically mirror it for RTL layouts

Rights and permitted edits must always be rechecked against `assets/manifest.yml`.

## 8. Color and theme

Use token identifiers from `tokens/brand.tokens.json`; do not transcribe their values into implementation guidance or creative files when token references are supported.

Approved brand and theme roles include:

- `color.brand.core`
- `color.surface.light`
- `color.text.light`
- `color.surface.dark`
- `color.text.dark`
- `color.text.muted.light`
- `color.text.muted.dark`

Use the light surface and light-theme text tokens together for approved light compositions. Use the dark surface and dark-theme text tokens together for approved dark compositions.

`color.brand.core` is an approved brand token, but it is not automatically a status, urgency, success, warning, error, or chart-series color.

### Deprecated token

`color.brand.primary` is deprecated. It exists only as a temporary migration mapping to `color.brand.core`.

- Do not use `color.brand.primary` in new work.
- Existing work should migrate to `color.brand.core`.
- Do not remove the deprecated token before its v2.0 removal target is approved and coordinated by the Design Systems Lead.

### Missing semantic colors

There are no approved success, warning, or error color tokens. Do not invent them or reinterpret brand tokens as semantic colors.

Status must be communicated with explicit text and, where an approved component permits it, an additional non-color cue such as a shape, pattern, or icon. Color alone is never sufficient.

### Missing chart palette

There is no approved chart palette. Do not create categorical, sequential, diverging, or semantic chart-color assignments. Chart data and structure may be prepared, but branded color treatment requires approval from the Design Systems Lead and Brand Lead.

## 9. Typography

Typography must use:

- `type.family.latin` for English
- `type.family.arabic` for Arabic

The canonical family values and implementation details must be retrieved from `tokens/brand.tokens.json`.

Approved font files and their license files are stored under `assets/fonts/`. They are approved for web, deck, and social use. Do not substitute a reference brand’s typeface or introduce an unapproved family.

No unsupplied type scale, weight map, line-height system, or letter-spacing rule may be invented as a permanent brand standard. A surface-specific implementation may propose such values for review, but they do not become canonical without approval.

## 10. Language and layout

Arabic and English have equal status.

### 10.1 Direction

- Arabic layouts use RTL.
- English layouts use LTR.
- Text alignment, reading order, navigation flow, and directional controls must follow the active language.
- Logo artwork must not be automatically mirrored.

### 10.2 Localized and bilingual assets

Interfaces and content may be localized separately. A valid Arabic-only interface does not need to duplicate all content in English, and vice versa.

When an asset is bilingual:

- Both languages must contain equally complete information.
- Neither language may omit qualifications, dates, calls to action, legal copy, status, or evidence included in the other.
- Visual prominence must not imply that one language is merely explanatory or decorative.
- Translation must preserve meaning, not just approximate length.

Equal completeness does not require mechanically identical line breaks or mirrored artwork.

## 11. Imagery

Imagery should support the approved purpose and positioning by showing credible operational contexts, people, vehicles, workshops, records, or maintenance activity.

Avoid imagery or treatments that feel playful, aggressive, luxury-coded, neon-futurist, sensational, or technologically speculative.

### Known photo restriction

`assets/photos/depot-team-01.jpg`:

- Has a non-exclusive commercial stock license.
- May be cropped.
- May receive basic color correction.
- Has no recorded model/property release evidence.
- Is restricted to internal prototypes until Legal clears external use.

Do not use this photo in external web pages, decks, campaigns, or social exports before clearance. Do not state or imply that release evidence exists.

For every other image, consult `assets/manifest.yml`. Missing rights information is a stop condition, not permission.

## 12. Layout and spacing

Use the approved spacing tokens `space.1` through `space.8` by reference to `tokens/brand.tokens.json`.

Layouts should:

- Establish an obvious information hierarchy.
- Group related records, actions, ownership, and evidence.
- Preserve readable spacing across viewport or export sizes.
- Adapt composition to RTL or LTR reading order.
- Keep decorative elements subordinate to operational content.
- Avoid density that obscures accountability or scanning.

No unsupplied grid, margin, logo-clearance, social-safe-area, or deck-safe-area measurement is a brand rule. Where a delivery platform requires dimensions or safe areas, verify them in the delivery environment or escalate rather than treating an example as canonical.

## 13. Accessibility

Responsive web work targets WCAG 2.2 AA.

This target is not a compliance claim. Compliance may be stated only after the delivered components have been tested and the evidence recorded.

At minimum:

- Test text and non-text contrast in their actual component states.
- Test keyboard access and visible focus behavior.
- Preserve semantic structure and meaningful reading order.
- Provide suitable text alternatives for informative imagery.
- Confirm RTL and LTR reading and interaction order.
- Do not communicate status by color alone.
- Include explicit labels for maintenance state, urgency, ownership, and action.
- Test responsive behavior rather than assuming token use guarantees accessibility.

Deck and social work should preserve legibility, logical reading order, and non-color status cues even when WCAG conformance is not being claimed.

## 14. Channel invariants

The following rules apply across web, executive decks, and LinkedIn:

- Use only current approved assets and token references.
- Preserve logo artwork and proportional scaling.
- Keep Arabic and English equal when both appear.
- Use the correct reading direction for each language.
- Keep status understandable without color.
- Do not invent rights clearance or accessibility results.
- Maintain the clear, dependable, disciplined, and modern identity.
- Avoid all anti-attributes.

### 14.1 Responsive web product and marketing pages

- Use responsive hierarchy and approved spacing tokens.
- Select theme tokens according to the actual approved surface.
- Use the corresponding full lockup unless valid symbol conditions are met.
- Test components before making a WCAG 2.2 AA claim.
- Localize Arabic and English interfaces independently when appropriate.

### 14.2 Executive decks

- Use a 16:9 format.
- Keep evidence, conclusions, owners, and next actions explicit.
- A symbol may appear alone within the deck only when the full bilingual lockup also appears in that deck.
- Treat a slide exported separately as an isolated export; it must not depend on identity found only elsewhere in the deck.
- Do not use rights-restricted imagery in an externally distributed deck.

### 14.3 LinkedIn assets

- An isolated asset must contain a full bilingual lockup rather than the symbol alone.
- In a sequence, the symbol may be used alone only when the full bilingual lockup appears in the immediately preceding frame.
- Bilingual frames must preserve equal information completeness.
- Confirm platform dimensions and safe areas at production time; they are not defined by this guide.
- Do not use an internal-prototype-only image in published content.

## 15. Do and don’t

### Do

- Reference canonical tokens rather than copying their values.
- Use the light lockup on approved light surfaces and the dark lockup on approved dark surfaces.
- Label status and urgency explicitly.
- Use directionally correct Arabic and English layouts.
- Check asset approval and rights before every release.
- Escalate missing rules.
- Document test evidence before claiming accessibility compliance.

### Don’t

- Use the deprecated token in new work.
- Interpret bright green as an approved urgent-action color.
- Borrow another company’s type, textures, colors, or identity.
- Separate the bilingual lockup by language.
- Mirror the logo in RTL layouts.
- Use the symbol as the only identity on an isolated export.
- Invent semantic or chart colors.
- Assume a stock license proves model or property release.
- Claim compliance solely because approved tokens were used.

## 16. Explicit noncanonical boundaries

### `legacy/social-notes.md`

This file is historical and noncanonical. Its instruction to use bright green for urgent actions is not approved because:

- No corresponding approved token exists.
- No semantic urgency assignment has been approved.
- No accessibility approval exists.

The instruction must not be used. Urgency must instead use explicit text and a non-color cue where available. A proposal for a new urgency treatment requires Design Systems Lead and Brand Lead review.

### `references/github-brand-guidelines.pdf`

This file is unauthorized as a source of Madar Fleet identity. It may be consulted only for documentation structure.

The stakeholder request to make Madar Fleet resemble GitHub dark mode, use its requested typeface, or use contribution-grid textures is not approved. Those visual choices must not be adopted, approximated, or used as fallback inspiration.

Examples and reference brands never outrank current canonical Madar Fleet sources.

## 17. Governance and change control

### Approval authority

| Change | Required authority |
|---|---|
| Brand meaning, identity principles, or prohibitions | Brand Lead |
| Token value, token addition, semantic color, chart palette, or typography token | Design Systems Lead; Brand Lead review where brand meaning is affected |
| Asset approval state or permitted edits | Brand Operations |
| Asset rights or release state | Brand Operations and Legal |
| Purpose, positioning, attributes, or audiences | Strategy Lead, with downstream brand review |
| Operational wording that does not alter meaning | CREATIVE_AG Brand Systems Lead |

Rights restrictions must never be weakened by another document, example, stakeholder request, or implementation constraint.

### Revalidation triggers

Review this document before its scheduled review date if any of the following occurs:

- A canonical source changes version.
- A new logo, token, language, channel, or asset class is introduced.
- A semantic status system or chart palette is proposed.
- Asset rights or release evidence changes.
- Accessibility testing reveals a failure.
- A new rule changes brand meaning or an existing prohibition.
- A conflict or recurring ambiguity is discovered.

Unknown or missing rules must be escalated rather than invented.

# `AGENT_GUIDE.md`

---
document: AGENT_GUIDE.md
brand: Madar Fleet / مدار فليت
version: 1.0
owner: CREATIVE_AG Brand Systems Lead
approved_date: 2026-09-20
review_date: 2026-12-20
---

# Madar Fleet Agent Guide

## 1. Purpose

This guide gives humans and agents a deterministic procedure for retrieving, applying, checking, and escalating Madar Fleet brand rules.

It operationalizes canonical sources. It does not create new brand meaning, token values, asset rights, or approvals.

## 2. Canonical file map

| File | Authority | Version | Owner |
|---|---|---:|---|
| [`strategy/positioning.md`](strategy/positioning.md) | Purpose, positioning, attributes, audiences | 1.0 | Strategy Lead |
| [`BRAND.md`](BRAND.md) | Identity meaning and shared visual rules | 1.0 | CREATIVE_AG Brand Systems Lead; Brand Lead approver |
| [`tokens/brand.tokens.json`](tokens/brand.tokens.json) | Sole canonical source for approved token values | 1.2 | Design Systems Lead |
| [`assets/manifest.yml`](assets/manifest.yml) | Sole canonical source for asset filenames, approval state, rights, and permitted edits | 1.1 | Brand Operations |
| `AGENT_GUIDE.md` | Retrieval, decision, QA, and escalation procedure | 1.0 | CREATIVE_AG Brand Systems Lead |
| [`legacy/social-notes.md`](legacy/social-notes.md) | Historical notes only; noncanonical | — | Not authoritative |
| [`references/github-brand-guidelines.pdf`](references/github-brand-guidelines.pdf) | Documentation-structure inspiration only | — | Not an identity source |

## 3. Exact retrieval order

For every branded task, use this order:

1. Read the current `AGENT_GUIDE.md`.
2. Read `strategy/positioning.md` to confirm purpose, positioning, attributes, and audience.
3. Read `BRAND.md` to identify applicable identity rules and prohibitions.
4. Read `tokens/brand.tokens.json`; retrieve only the token roles required by the task.
5. Read `assets/manifest.yml`; confirm the exact asset filename, approval state, rights, and permitted edits before using any asset.
6. Inspect the requested source copy, data, surface, language, theme, distribution context, and accessibility evidence.
7. Consult legacy notes or external references only when explicitly necessary, and mark them noncanonical.
8. Run the QA checklist in this guide before delivery.

Do not begin from a legacy note, external reference, remembered value, previous export, or stakeholder analogy.

## 4. Precedence and conflict resolution

Precedence is subject-specific rather than a permission to let one file rewrite another.

1. Rights restrictions in `assets/manifest.yml` and Legal decisions are absolute and may never be weakened.
2. `strategy/positioning.md` governs purpose, positioning, attributes, and audience.
3. `BRAND.md` governs brand meaning, shared identity rules, and prohibitions.
4. `tokens/brand.tokens.json` governs token values and token lifecycle state.
5. `assets/manifest.yml` governs asset identity, approval state, rights, and permitted edits.
6. `AGENT_GUIDE.md` governs operating procedure but cannot override any canonical subject owner.
7. Current canonical files outrank legacy notes, examples, old exports, external references, and stakeholder analogies.
8. An example demonstrates an application only; it does not establish a new rule.
9. If two current canonical sources conflict within the same subject, stop and escalate to the relevant owner.
10. If a rule or value is absent, stop or constrain the deliverable and escalate. Do not invent it.

## 5. Task intake

Before selecting assets or styling, record:

- Surface: responsive web, 16:9 deck, LinkedIn, or unapproved/unknown
- Distribution: internal prototype or external release
- Language: Arabic, English, or bilingual
- Direction: RTL or LTR
- Theme: approved light, approved dark, mixed, or unknown
- Identity need: full lockup or proposed symbol use
- Asset needs: logo, photo, illustration, chart, or other
- Status needs: success, warning, error, urgency, maintenance state, or none
- Accessibility requirement and available test evidence
- Whether the request cites a legacy note or external reference

Any unknown that affects rights, logo eligibility, language completeness, or release safety is a stop condition.

## 6. Deterministic decision tables

### 6.1 Logo and theme

| Condition | Action |
|---|---|
| Surface is confirmed as an approved dark surface | Use `assets/logos/madar-lockup-dark.svg`; confirm current manifest state; scale proportionally. |
| Surface is confirmed as an approved light surface | Use `assets/logos/madar-lockup-light.svg`; confirm current manifest state; scale proportionally. |
| Surface is mixed | Select the logo per local approved surface. Do not recolor a single logo to fit both. |
| Surface is custom, photographic, low-contrast, or its approval is unknown | Do not guess a variant or add effects. Change to an approved surface if authorized, otherwise escalate. |
| Request asks for recolor, outline, shadow, filter, redraw, stretch, or language separation | Reject the transformation and use an unchanged approved asset. |
| RTL layout | Preserve logo artwork unchanged; do not mirror it. |

For non-logo theme implementation:

| Condition | Action |
|---|---|
| Approved light theme | Retrieve the light surface, text, and muted-text tokens from `tokens/brand.tokens.json`. |
| Approved dark theme | Retrieve the dark surface, text, and muted-text tokens from `tokens/brand.tokens.json`. |
| New work requests `color.brand.primary` | Replace the request with `color.brand.core`; do not introduce the deprecated token. |
| Existing implementation uses `color.brand.primary` | Plan migration to `color.brand.core`; preserve coordinated compatibility until the approved v2.0 removal. |
| Theme or contrast behavior cannot be verified | Do not claim accessibility; test the component or escalate. |

### 6.2 Language and direction

| Condition | Action |
|---|---|
| Arabic-only localized content | Use RTL layout and `type.family.arabic`. Do not mirror logo artwork. |
| English-only localized content | Use LTR layout and `type.family.latin`. |
| Bilingual content | Ensure equal information completeness, apply the correct direction within each language region, and use each language’s approved typography token. |
| One language omits a qualification, CTA, date, status, evidence, or legal statement found in the other | Block delivery until parity is restored. |
| Request asks to split the bilingual logo into Arabic and English versions | Reject; use the intact approved lockup. |
| Translation meaning is uncertain | Escalate for language review; do not approve based on visual similarity or line length. |

### 6.3 Symbol use

| Condition | Action |
|---|---|
| Symbol appears on a page that also contains a full bilingual lockup | Symbol use is permitted, subject to manifest confirmation. |
| Symbol appears within a deck that also contains a full bilingual lockup | Symbol use is permitted inside the deck; separately exported slides must be reassessed as isolated exports. |
| Symbol appears in a social frame immediately after a frame containing the full bilingual lockup | Symbol use is permitted. |
| Symbol appears on an isolated export | Reject symbol-only identity; use an approved full bilingual lockup. |
| Social frame with symbol is not immediately preceded by a full-lockup frame | Reject symbol-only use. |
| Presence of the required full lockup cannot be confirmed | Treat the item as isolated and require a full lockup. |

### 6.4 Status and urgency

| Condition | Action |
|---|---|
| A status or urgency state is required | Use an explicit state label. Add an approved non-color cue if available. |
| Request assigns meaning using color alone | Reject and add a text label plus a non-color cue where available. |
| Request asks for success, warning, or error colors | State that no semantic colors are approved; escalate to the Design Systems Lead and Brand Lead if a new system is required. |
| Request says “use bright green for urgent actions” based on legacy notes | Reject the legacy rule. No approved token or accessibility evidence supports it. |
| Request repurposes `color.brand.core` as success or urgency | Reject the semantic reassignment unless formally approved. |
| No approved icon or component exists | Use an explicit text label; do not invent an official icon system. Escalate if another cue is required. |

### 6.5 Charts

| Condition | Action |
|---|---|
| A chart is requested | Prepare data, hierarchy, labels, annotations, and accessibility requirements. |
| One or more chart colors must be assigned | Stop visual color assignment because no chart palette is approved; request Design Systems Lead and Brand Lead approval. |
| Request proposes green/red or other semantic chart colors | Reject the proposed mapping. |
| A draft must communicate series before palette approval | Use explicit series labels and documented non-color distinctions only if the delivery medium supports them; mark the draft non-final and do not present the treatment as a brand palette. |
| Chart is intended for external release | Do not release until its visual treatment and accessibility have been approved and tested. |

### 6.6 Photos and rights

| Condition | Action |
|---|---|
| Any photo is requested | Check `assets/manifest.yml` for filename, approval state, rights, and permitted edits. |
| `assets/photos/depot-team-01.jpg` is used in an internal prototype | Permitted; only crop and basic color correction are allowed. Retain internal-prototype status. |
| That photo is proposed for external web, deck, or social use | Block use and escalate through Brand Operations to Legal. |
| Request claims that the photo has model/property releases | Reject the claim; release evidence is not recorded. |
| Another image has missing or unclear rights | Do not use it. Escalate to Brand Operations and Legal where rights are involved. |
| Request asks for an edit not permitted by the manifest | Reject the edit or obtain a manifest update before proceeding. |

### 6.7 Reference and inspiration requests

| Condition | Action |
|---|---|
| `references/github-brand-guidelines.pdf` is used to organize documentation | Permitted for structure only. |
| Request asks for GitHub-like dark mode, the requested external typeface, or contribution-grid textures | Reject those identity choices as unauthorized. Return to Madar canonical tokens, typography, assets, and attributes. |
| External example conflicts with a canonical rule | Follow the canonical rule. |
| Stakeholder says an external reference is “just inspiration,” but asks to reproduce distinctive identity elements | Treat it as an identity request and reject it unless formally approved. |
| Reference introduces a missing Madar rule | Do not import the rule. Escalate the gap. |

### 6.8 Surface rules

| Surface | Required action |
|---|---|
| Responsive web | Use responsive hierarchy, approved spacing tokens, correct theme tokens, correct language direction, and tested components. Do not claim WCAG 2.2 AA without evidence. |
| Executive deck | Use 16:9. Make evidence, owners, and next actions explicit. Reassess separately exported slides as isolated assets. |
| LinkedIn | Confirm current production dimensions separately. Apply isolated-export and social-sequence logo rules. Preserve bilingual completeness. |
| Unknown surface | Do not invent format-specific rules; establish the surface or escalate. |

## 7. Token-use protocol

1. Retrieve token values from `tokens/brand.tokens.json`.
2. Reference token names directly wherever the implementation supports tokens.
3. Do not copy canonical values into this guide, `BRAND.md`, comments, or a parallel token list.
4. Use only defined token roles.
5. Do not derive unapproved semantic roles from visual similarity.
6. Use `space.1` through `space.8` for spacing.
7. Use `type.family.latin` and `type.family.arabic` according to content language.
8. Do not use `color.brand.primary` in new work.
9. Record any required but missing role as a token gap and escalate it.

## 8. Forbidden behavior

An agent must never:

- Invent a logo measurement, clear space, minimum size, grid, or safe area.
- Recolor, redraw, split, mirror, stretch, outline, shadow, or filter a logo.
- Use the symbol as the only identity on an isolated export.
- Copy token values into prose as a substitute for canonical references.
- Use the deprecated token in new work.
- Invent success, warning, error, urgency, or chart colors.
- Treat bright green as an approved urgent-action color.
- Claim that token use alone proves WCAG 2.2 AA compliance.
- Claim unrecorded model/property releases or external photo clearance.
- Use an internal-prototype-only photo in an external release.
- Copy GitHub identity choices into Madar Fleet.
- Substitute an external typeface or texture because a stakeholder requested a resemblance.
- Reduce bilingual information in one language.
- Treat examples, legacy notes, or old exports as authority.
- Weaken a rights restriction.
- Resolve a missing rule through personal taste.

## 9. QA checklist

### Source and traceability

- [ ] Current strategy, brand, token, manifest, and agent-guide versions were read.
- [ ] Every token role traces to `tokens/brand.tokens.json`.
- [ ] Every asset traces to `assets/manifest.yml`.
- [ ] No legacy note or external reference was treated as canonical.
- [ ] Distribution context is recorded as internal or external.

### Identity

- [ ] Logo variant matches the approved local surface.
- [ ] Logo is proportionally scaled and otherwise unchanged.
- [ ] RTL treatment does not mirror logo artwork.
- [ ] Symbol eligibility is proven.
- [ ] Isolated exports contain a full bilingual lockup.
- [ ] Work expresses the approved attributes and avoids anti-attributes.

### Language

- [ ] Arabic uses RTL and its approved typography token.
- [ ] English uses LTR and its approved typography token.
- [ ] Bilingual information is equally complete.
- [ ] Calls to action, dates, statuses, qualifications, and legal text have parity.
- [ ] Translation meaning has been reviewed when uncertain.

### Color, status, and charts

- [ ] Theme tokens match the approved surface.
- [ ] New work does not use `color.brand.primary`.
- [ ] Status has an explicit text label.
- [ ] Status does not rely on color alone.
- [ ] No brand token was silently reassigned to a semantic role.
- [ ] No unapproved chart palette was introduced.

### Assets and rights

- [ ] Asset approval and permitted edits were checked.
- [ ] Photo rights match the intended distribution.
- [ ] `depot-team-01.jpg`, if used, remains internal unless Legal clearance is recorded.
- [ ] No release evidence is claimed unless recorded.
- [ ] Rights restrictions were not weakened.

### Surface and accessibility

- [ ] Web layouts were tested responsively.
- [ ] Web components have actual accessibility test evidence before a compliance claim.
- [ ] Contrast, keyboard access, focus, structure, reading order, and alternatives were checked where applicable.
- [ ] Deck format is 16:9.
- [ ] Separately exported slides were checked as isolated assets.
- [ ] LinkedIn dimensions and safe areas were verified in the production environment.
- [ ] No unsupported compliance statement appears.

### Delivery

- [ ] Unknown rules are listed as escalations.
- [ ] Non-final or internal-only material is labeled.
- [ ] The output contains no invented measurements, colors, releases, or test results.
- [ ] The final file can be understood without relying on undocumented prior frames, pages, or conversations.

## 10. Escalation matrix

| Issue | Escalate to | Required handling |
|---|---|---|
| Purpose, positioning, attribute, or audience conflict | Strategy Lead | Pause affected messaging. |
| Material brand meaning or prohibition change | Brand Lead | Do not implement until approved. |
| Token value, new semantic token, chart palette, or token lifecycle change | Design Systems Lead | Keep proposed values out of canonical work until approved. |
| Brand implications of a token change | Design Systems Lead and Brand Lead | Obtain both technical and brand review. |
| Asset filename, approval state, or permitted-edit change | Brand Operations | Use current manifest state until updated. |
| Rights, releases, or external-use uncertainty | Brand Operations and Legal | Block external use. |
| Arabic or English meaning uncertainty | Qualified language reviewer and Brand Lead where meaning changes | Block bilingual approval until resolved. |
| Accessibility uncertainty | Responsible implementation/accessibility reviewer | Do not make a compliance claim. |
| Conflict between current canonical files | Relevant source owners; Brand Lead coordinates cross-domain resolution | Record the conflict and stop the affected decision. |

## 11. Change and version protocol

1. Open a change record identifying the affected source, reason, requester, and surfaces.
2. Classify the change by subject: strategy, brand meaning, token, asset state, rights, or operational guidance.
3. Obtain approval from the owner listed in the escalation matrix.
4. Update the canonical source first.
5. Increment its version according to the repository’s approved versioning practice.
6. Update dependent documentation references without duplicating canonical values.
7. Re-run representative ambiguity tests and the QA checklist.
8. Record approval and effective date.
9. Notify human and agent consumers.
10. Preserve existing rights restrictions unless Brand Operations and Legal explicitly approve a change.

Material changes to brand meaning or prohibitions require Brand Lead approval. Token values require Design Systems Lead approval. Asset rights or state changes require Brand Operations, with Legal involved wherever rights are affected.

The deprecated token’s removal target does not authorize early deletion. Removal must be coordinated and approved.

## 12. Concise examples

### Valid: light web page

> Build an English maintenance-history page on the approved light surface. Use the light-surface lockup, LTR layout, the English typography token, approved spacing tokens, and explicit status labels. Test the actual components before stating accessibility compliance.

Why valid: asset, direction, typography, spacing, status, and testing behavior all trace to canonical rules.

### Invalid: legacy urgency treatment

> Make overdue repairs bright green because the social notes say urgent actions should be green.

Why invalid: the note is noncanonical, no semantic urgency color is approved, and status cannot rely on color.

### Valid: bilingual social sequence

> Frame 1 uses the full bilingual lockup and equally complete Arabic and English content. Frame 2 may use the symbol alone because it immediately follows Frame 1, while retaining complete bilingual information and correct directional treatment.

Why valid: the sequence satisfies the social symbol condition and language parity rule.

### Invalid: isolated symbol export

> Export Frame 2 by itself with only the symbol.

Why invalid: the preceding-frame context is lost, making it an isolated export.

### Valid: internal photo prototype

> Use `assets/photos/depot-team-01.jpg` in an internal prototype with a crop and basic color correction, and label the prototype internal-only.

Why valid: usage and edits remain inside the recorded restriction.

### Invalid: external photo assumption

> Publish the depot photo because a commercial stock license must include all releases.

Why invalid: release evidence is not recorded; external use requires Legal clearance.

### Invalid: external-brand imitation

> Use GitHub-like dark styling, the stakeholder’s requested external typeface, and contribution-grid textures.

Why invalid: the reference is authorized only for documentation structure, not Madar identity.

### Valid: missing chart palette response

> Prepare the chart’s data, labels, and annotations, but hold branded color assignment and external release pending palette approval.

Why valid: it advances safe work without inventing a chart system.

# Ambiguity-test results

## Test 1 — Legacy urgency color

**Input**

> “The old social notes say urgent actions should be bright green. Make all overdue maintenance green on the website.”

**Expected decision path**

1. Retrieve current canonical sources in the prescribed order.
2. Identify the request as status/urgency treatment.
3. Find that `legacy/social-notes.md` is noncanonical.
4. Confirm that no semantic urgency color exists.
5. Apply the rule that status cannot rely on color alone.
6. Use an explicit overdue label and an approved non-color cue if an approved component supplies one.
7. Escalate any request to create a semantic color system to the Design Systems Lead and Brand Lead.

**Outcome**

Bright green is rejected. No existing brand token is reassigned to urgency. The component may proceed with explicit text, but a new color treatment remains blocked pending approval and testing.

**Guide sufficient?** Yes. It resolves precedence, status behavior, token gaps, and escalation without invention.

---

## Test 2 — Unauthorized GitHub-like direction

**Input**

> “Make the executive deck feel like GitHub dark mode. Use Mona Sans and contribution-grid textures.”

**Expected decision path**

1. Classify the PDF as structure-only reference material.
2. Identify the requested styling, typeface, and texture as identity choices rather than documentation structure.
3. Reject those external identity elements.
4. Use the approved dark-theme token roles from `tokens/brand.tokens.json`.
5. Use the approved dark-surface lockup.
6. Use the approved language typography tokens.
7. Maintain a 16:9 deck and Madar’s clear, dependable, disciplined, modern attributes.

**Outcome**

The deck can use Madar’s approved dark theme, but it cannot imitate GitHub, use the requested external typeface, or adopt contribution-grid textures.

**Guide sufficient?** Yes. It distinguishes structural inspiration from identity borrowing and provides a valid fallback path.

---

## Test 3 — Arabic isolated LinkedIn symbol

**Input**

> “Create one Arabic LinkedIn graphic using only the Madar symbol. It is part of a campaign, but this file may also be shared by itself.”

**Expected decision path**

1. Classify the file as an isolated export because it may be shared independently.
2. Apply Arabic RTL layout and `type.family.arabic`.
3. Do not mirror the logo artwork.
4. Reject symbol-only identity on the isolated export.
5. Select the full bilingual lockup according to the approved surface theme.
6. Keep the Arabic content complete; the bilingual lockup itself remains intact.

**Outcome**

The isolated asset must contain the appropriate full bilingual lockup. Symbol-only identity is rejected.

**Guide sufficient?** Yes. The isolated-export rule removes ambiguity created by the broader campaign context.

---

## Test 4 — External deck photo

**Input**

> “Use the depot-team photo in a customer-facing investor deck. The stock license should be enough.”

**Expected decision path**

1. Check `assets/manifest.yml`.
2. Identify the deck as external distribution.
3. Confirm that only a commercial stock license is recorded and release evidence is absent.
4. Apply the internal-prototype-only restriction.
5. Block the photo.
6. Escalate through Brand Operations to Legal.

**Outcome**

The photo is not used in the external deck unless its manifest state is updated after Legal clearance. No release claim is made.

**Guide sufficient?** Yes. The correct result is a controlled stop and escalation, not completion by assumption.

---

## Test 5 — Red/green maintenance chart

**Input**

> “For the board deck, show healthy vehicles in green and critical vehicles in red. Keep it accessible.”

**Expected decision path**

1. Identify a chart-palette and semantic-status request.
2. Confirm that no chart palette or semantic colors are approved.
3. Reject the red/green assignment.
4. Prepare chart data, labels, annotations, and non-color distinctions as a non-final draft where feasible.
5. Escalate palette approval to the Design Systems Lead and Brand Lead.
6. Require accessibility testing before external release or any compliance claim.

**Outcome**

No red/green palette is produced. The information architecture may proceed, but branded color treatment and external release remain pending approval and testing.

**Guide sufficient?** Yes. It supports partial progress while preventing an invented palette.

---

## Test 6 — Unknown photographic logo surface

**Input**

> “Place whichever Madar logo looks best over a busy vehicle photo, and add a shadow if needed.”

**Expected decision path**

1. Check the manifest and logo prohibitions.
2. Identify the background as neither a confirmed approved light nor approved dark surface.
3. Reject subjective variant selection and the requested shadow.
4. If authorized, introduce an approved light or dark surface region and use its corresponding lockup.
5. Otherwise escalate the surface treatment.

**Outcome**

No logo is placed directly on the uncertain photographic background and no shadow is added. Placement proceeds only after an approved surface is established.

**Guide sufficient?** Yes. It converts “looks best” into a deterministic surface condition and safely handles the missing case.
