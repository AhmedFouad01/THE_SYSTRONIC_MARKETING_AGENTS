---
name: tsst-lens-sk-014-landing-page-cro
description: Use when planning, auditing or testing a landing page: single goal, ad message match, section architecture, form friction, mobile and Arabic RTL, CRO audit, A/B test briefs.
id: TSST-LENS-SK-014
team: marketing
owner: LENS_AG
status: UNVALIDATED
version: 0.1
---

# TSST-LENS-SK-014 Landing Page & CRO

Status: `UNVALIDATED`

## Objective

Produce a landing page brief or CRO audit that serves one conversion goal, matches the traffic source's promise, removes friction, and yields testable hypotheses. Brand-neutral; apply to any offer.

## Triggers

New landing page brief, page rewrite, low conversion diagnosis, ad-to-page message match check, form or checkout friction review, A/B test planning, Arabic/RTL page considerations.

## Reusable principles

- One page, one primary conversion (lead form, WhatsApp click, call, purchase). Secondary actions must not compete.
- Message match: the headline echoes the ad/source promise, audience and offer in the same words. Mismatch is the first thing to fix.
- Proof before pressure: evidence of value precedes the ask. Claims follow SK-005 / SK-002 grading; no unprovable superlatives.
- Reduce friction before adding persuasion: every field, step, and unclear label costs conversions.
- Mobile first: most Egypt/MENA traffic is phone, often on mid-range devices and variable networks.
- Honest persuasion only: no fake urgency, fake scarcity, fake counters, fake reviews, pre-ticked consent, hidden costs, or confirmshaming.
- Change one hypothesis at a time; decide by pre-set rules, not by peeking.

## Workflow

1. Confirm inputs: offer, audience/ICP (SK-004), source/ad promise, conversion goal, current metrics if any, constraints, language(s).
2. Define page goal: the single conversion, its value, and the micro-conversions that support it (scroll, click-to-chat).
3. Message match: write the source promise next to the headline; list any word, offer, price, or audience mismatch; fix to match.
4. Section architecture (default order, trim for simple offers):
   - Hero: promise, who it is for, primary CTA, one proof element above the fold.
   - Problem / value: customer outcome, not feature list.
   - Proof: real testimonials, numbers with source and date, case examples, logos only if real and permitted.
   - How it works / offer detail: price or price logic, what is included, what is excluded.
   - Objections / FAQ: top 4-6 from customer evidence (price, trust, timing, delivery, after-sales).
   - Final CTA: repeat the single action; add risk-reducers that are true (guarantee only if the business honors it).
5. Form and friction audit: fields required vs needed; phone-first inputs; input type and keyboard; inline validation in clear language; autofill; error text; speed of response promised vs real; privacy line with link; consent only as the law requires and unticked.
6. Mobile-first and Arabic RTL checks: thumb-reach sticky CTA; tap targets at least 44 px; readable body text without zoom; page weight and load speed; RTL layout mirrored (not just text), numerals and phone numbers displayed correctly in mixed bidi text, Arabic font with proper line height, forms and icons mirrored, Arabic copy written natively (Egyptian-friendly tone where appropriate, not literal translation). Test on real phones.
7. CRO audit heuristics (score each pass / partial / fail with evidence):
   - clarity: value understood in 5 seconds;
   - relevance: matches source and audience;
   - proof: specific, verifiable, near the claim;
   - friction: fields, steps, load time, distractions;
   - CTA: visible, specific verb, one primary;
   - trust: contact details, policies, secure handling, real identity;
   - objections answered where they arise;
   - accessibility: contrast, labels, focus, alt text;
   - tracking readiness: events defined for goal and micro-conversions.
8. Prioritize fixes by impact, confidence, effort (ICE) and separate "fix now" (bugs, mismatches) from "test" (judgement calls).
9. Hypothesis and A/B brief per test: "Because [evidence], changing [element] to [variant] for [segment] will change [metric] by [expected direction]". Include primary metric, guardrail metric (lead quality, refunds, complaints), audience split, minimum run window and sample logic, stop rule, and what decision each outcome triggers. Low traffic: prefer sequential before/after or qualitative tests and say so.
10. Handoffs: build spec to DEV/STUDIO (sections, copy in AR/EN, states, components, RTL notes); measurement plan, event naming, and test analysis to SPARK-SK-002; visual approval to CREATIVE_AG.

## Output contract

- page goal and single conversion;
- message-match table (source promise vs page);
- section architecture with copy intent and proof per section;
- form/friction findings;
- mobile and RTL checklist results;
- CRO heuristic scorecard with evidence;
- prioritized fix list and test backlog;
- A/B test brief(s) with hypothesis, metrics, stop rule;
- handoff notes (DEV/STUDIO build, SPARK-SK-002 measurement);
- open evidence gaps.

## Quality gates / critical failures

Critical (block delivery):
- more than one primary conversion;
- headline contradicts or ignores the source promise;
- fake urgency, scarcity, reviews, counters, or hidden fees;
- unsupported claim or superlative on the page;
- form collects data with no stated purpose or consent where required;
- RTL page only translated, not mirrored/tested;
- test brief with no primary metric or stop rule.

Gate checklist:
- [ ] One goal, one CTA style.
- [ ] Message match verified.
- [ ] Every claim has proof or is qualified.
- [ ] Friction audit done; fields justified.
- [ ] Mobile and RTL checked on real devices.
- [ ] Tests are single-hypothesis with decision rules.
- [ ] Tracking requirements handed to SPARK-SK-002.

## Handoffs

- DEV / STUDIO: build spec, copy, component list, RTL notes.
- SPARK-SK-002: events, attribution, test analysis.
- CREATIVE_AG: visual direction and final approval.
- LENS SK-005 / SK-002: claim wording and evidence grade.

## Common failure modes

- generic hero that could fit any competitor;
- navigation menu leaking visitors from a paid page;
- long forms for low-intent traffic;
- testimonials without names, dates, or context;
- testing button color while the offer is unclear;
- ending tests early on a lucky streak.

## Practical evaluation

Given an ad, a page screenshot or description, and a metrics snapshot, deliver a message-match table, scorecard, top 5 fixes, and one valid A/B brief that avoids dark patterns.

## Changelog

- 0.1: initial draft (ADR-003 P1 gap closure). Unvalidated; no registry entry yet.
