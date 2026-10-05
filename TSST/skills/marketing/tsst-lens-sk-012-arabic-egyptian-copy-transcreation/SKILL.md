---
name: tsst-lens-sk-012-arabic-egyptian-copy-transcreation
description: Use when writing or adapting Arabic or Egyptian-dialect marketing copy, or transcreating English message houses into Arabic: register choice, bidi pitfalls, cultural cues, dialect QA, native review.
id: TSST-LENS-SK-012
team: marketing
owner: LENS_AG
status: UNVALIDATED
version: 0.1
---

# TSST-LENS-SK-012 Arabic & Egyptian Copy / Transcreation

Status: `UNVALIDATED`

## Objective

Produce Arabic copy that sounds native to the target audience and carries the same promise and proof as the source message house, without literal translation errors, cultural missteps, or broken mixed-script text.

## Triggers

Use for Arabic or Egyptian ads, posts, captions, landing copy, CTAs; EN->AR message-house transcreation; register decisions; Ramadan/Eid/seasonal copy; Arabic copy review. Use together with SK-011 (craft) and SK-005 (message house).

## Reusable principles

- Transcreate: keep the promise, proof, and emotional effect; rebuild the sentence in how the audience would say it.
- Register follows audience, platform, and category, not the translator's habit.
- Arabic audiences are not one audience: Egypt, Gulf, Levant, Maghreb differ. Name the target market; do not assume "Arabic" is enough.
- Claims and proof rules do not relax in Arabic (SK-005, SK-002).
- Machine output is a draft; a native reviewer is the gate.

## Workflow

1. Confirm target country/market, audience segment, platform, brand voice, and source message house (EN or AR).
2. Choose register (table). Record the choice and why.
3. Decide loanwords: keep Latin/English terms the audience actually uses (see below); translate or replace the rest.
4. Map tone (formal/warm/playful/authoritative) to concrete word and verb choices, not adjectives.
5. Transcreate pillar by pillar: promise, proof, objection, CTA. Do not go word by word; re-express the idea, then back-check meaning against the source.
6. Apply seasonal and cultural cues (below) only where they fit the offer honestly.
7. Check mixed-script and numeral handling; flag rendering needs to STUDIO.
8. Run the dialect QA checklist, then the native-review gate. Package with a gloss (EN back-translation) for the reviewer.

### Register choice

| Register | Fits | Risks |
|---|---|---|
| MSA (فصحى مبسطة) | Pan-Arab reach, formal/B2B, institutions, long-form, legal-ish text | Can feel stiff or distant on social |
| Egyptian colloquial (عامية مصرية) | Egypt consumer social, ads, captions, reels, community replies | Reads local; may not travel to Gulf/Levant; spelling not standardised |
| Franco/Arabizi mix (Latin letters + numerals, e.g. 3, 7, 5) | Youth/lifestyle chatter, informal DMs | Weak for ads, hard to read, poor search/accessibility; use sparingly |
| Light-colloquial MSA (hybrid) | Multi-market consumer copy | Needs a native ear to avoid sounding artificial |

Default: Egyptian colloquial for Egypt consumer social/ads; simplified MSA for multi-market or formal material. Keep one register per piece.

### English loanwords

Natural when the audience already uses them for the category: tech and app terms, brand and product names, fashion, fitness, some finance and design words (e.g. "اوردر", "ديليفري", "ستايل", "كاش"). Prefer Arabic where a common word exists and warmth matters, or where trust/religious/family context is central. Test: would a friend say it aloud this way? Keep one spelling per loanword across the brand.

### Short examples (illustrative, native-review required)

- EN: "Free delivery on orders over 500 EGP."
  - Egyptian: "التوصيل ببلاش على أي أوردر فوق ٥٠٠ جنيه."
  - MSA: "توصيل مجاني للطلبات التي تتجاوز ٥٠٠ جنيه."
- EN: "Ready in two days." Literal "جاهز في يومين" is fine in Egyptian; MSA: "يُسلَّم خلال يومين."
- Transcreation, not translation: EN "Don't sleep on this" -> not a literal "لا تنم عليه"; use "ماتفوتش الفرصة دي."
- CTA: "اطلب دلوقتي" (Egyptian) / "اطلب الآن" (MSA).

### RTL / bidi and numerals

- Mixed Arabic + Latin (brand names, prices, URLs, hashtags) can reorder visually; punctuation, parentheses, and numbers next to Latin text are the usual breakers. Test in the real platform and device.
- Decide numeral style once: Eastern Arabic-Indic (٠١٢٣) vs Western (0123). Egypt consumer content often uses either; follow brand and platform norms, stay consistent, never mix in one price.
- Currency, units, and percentages: confirm position and spacing with a native reader; keep the symbol/unit from drifting away from its number.
- Place Latin brand names and URLs where they will not flip a sentence; avoid ending an Arabic line with a Latin word plus punctuation.
- Hashtags: mixed-script hashtags may break; test them. Provide hashtags separately in the handoff.
- Text inside images, kerning/joining of Arabic letters, font choice, and layout direction are rendering work: hand to STUDIO with the exact string, direction, and numeral style specified.

### Cultural and religious sensitivity

- Do not use religious phrases or verses as sales hooks; avoid trivialising sacred terms. Use greetings (e.g. "رمضان كريم", "عيد مبارك") respectfully and only where the brand voice fits.
- Avoid imagery/wording that clashes with local modesty, family, or political norms; flag, do not decide.
- Humour, idioms, and slang age quickly and vary by region; verify currency with a native reviewer.
- Gender: Arabic marks gender in verbs and adjectives; choose masculine/feminine/inclusive forms deliberately per audience.

### Seasonal cues

Ramadan (iftar/suhoor timing, giving, family, reduced daytime posting patterns), Eid (gifting, family visits), back-to-school, summer, and shopping peaks. Moon-based dates shift each year: verify dates against a current calendar before planning. Do not fake scarcity or deadlines because of a season; offers must be real.

## Dialect QA checklist

- [ ] Target market named; register matches it and stays consistent.
- [ ] Reads as spoken, not as translated English; no calques.
- [ ] Verb forms, pronouns, and gender intentional.
- [ ] Colloquial spelling consistent (one spelling per word across the brand).
- [ ] Loanwords justified and spelled consistently.
- [ ] Numerals consistent; price/unit/currency order checked.
- [ ] Back-translation matches the source message house meaning, claims, and qualifiers.
- [ ] No religious, political, or sensitive-term misuse.
- [ ] Length fits placement (Arabic truncation differs).

## Output contract

- market, register choice, and rationale;
- transcreated copy per pillar/placement;
- English gloss/back-translation for the reviewer;
- loanword and numeral decisions;
- bidi/rendering notes for STUDIO;
- seasonal cues used and date verification status;
- native-review status: `PENDING` / `PASSED` (named reviewer) / `CHANGES`.

## Quality gates / critical failures

- CRITICAL: Arabic copy marked ready without native review.
- CRITICAL: claim, price, or qualifier lost or altered in transcreation.
- CRITICAL: religious phrase used to push a sale; sensitive content unflagged.
- Register mixed within one piece without intent.
- Mixed-script rendering untested on the real platform.

## Handoffs

- Craft, hooks, variants -> SK-011. Message house changes -> SK-005. Evidence -> SK-002.
- Rendering, fonts, text-on-image, RTL layout -> STUDIO (specify exact string, direction, numeral style).
- Native-speaker review -> user-designated reviewer; final visual approval -> CREATIVE_AG.

## Common failure modes

- literal word-for-word translation;
- MSA where the audience expects colloquial, or Egyptian slang in a multi-market piece;
- Franco used in paid ads;
- numerals and currency scrambled in bidi;
- assuming Gulf and Egyptian audiences share idiom.

## Changelog

- 0.1: initial draft under TSST-ADR-003; UNVALIDATED. Examples need native confirmation.
