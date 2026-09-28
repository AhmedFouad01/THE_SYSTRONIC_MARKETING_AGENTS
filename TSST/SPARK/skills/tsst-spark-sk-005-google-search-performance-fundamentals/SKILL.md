---
name: tsst-spark-sk-005-google-search-performance-fundamentals
description: Design Google Search structures from real query intent, conversion readiness, keyword and negative logic, ads and landing-page fit, bidding constraints, and campaign hygiene.
---

# TSST-SPARK-SK-005 Google Search & Performance Fundamentals

Status: `UNVALIDATED`

## Objective

Create a Search campaign design that captures relevant intent, routes it to coherent ads and landing pages, uses valid conversion signals, and exposes bidding and measurement assumptions.

## Triggers

Use for Google Search planning, keyword/intent structure, negative-keyword logic, ad/landing mapping, bidding review, or pre-launch hygiene checks. This skill does not authorize launch.

## Reusable principles

- Start from customer intent and query meaning, not keyword volume alone.
- Group terms only when they can share intent, ad promise, landing experience, and bidding objective.
- Use match types and negatives as controls to shape eligible queries; review actual search terms after launch when authorized.
- Make conversion actions and values match the business objective before automated bidding relies on them.
- Align ad claim, proof, and landing-page experience.
- Keep structure simple enough to concentrate data and maintain it.

## Workflow

1. Confirm business objective, geography/language, offer, approved claims, economics, conversion readiness, and landing pages.
2. Research customer intents and separate brand, category, problem, competitor, informational, and excluded meanings as applicable.
3. Map keyword themes to intent, ad promise, landing page, and conversion action.
4. Define match-type rationale, negative themes, geo/language settings, schedule constraints, and brand-safety exclusions.
5. Choose bidding and budget logic based on valid measurement, value quality, data maturity, and current official options.
6. Define responsive search ad inputs and asset requirements without fabricating claims.
7. Create pre-launch hygiene and post-launch search-term review plans.
8. Recheck current Google Ads documentation; remove deprecated tactics.

## Output contract

- intent taxonomy and evidence;
- campaign/ad-group map;
- keyword and negative logic;
- ad-to-landing-page map;
- conversion, value, bidding, and budget rationale;
- settings and hygiene checklist;
- monitoring, search-term review, and escalation plan.

## Guardrails

- Separate intent from keyword volume.
- Do not launch or modify a Google Ads account during bootstrap.
- Do not recommend a deprecated bid strategy or feature; current official documentation controls.
- Do not use broad automation without valid conversion data and negative/query controls.
- Do not invent claims or send mismatched intent to a generic page.

## Completion checklist

- [ ] Intent categories are distinct and evidence-backed.
- [ ] Ad groups share intent, promise, and landing fit.
- [ ] Match and negative logic are explicit.
- [ ] Conversion and bidding prerequisites are valid.
- [ ] Claims are approved and landing pages align.
- [ ] Current platform features and policies were checked.

## Practical evaluation

Design a Search structure for an evaluator-supplied real-demand scenario. The fixture includes ambiguous keywords, brand terms, weak landing-page coverage, an invalid conversion action, and one deprecated bidding suggestion that must be rejected.

## Common failure modes

- structure based only on volume;
- overlapping ad groups with no intent difference;
- missing negatives;
- invalid lead event used for bidding;
- ad promise unsupported by landing page;
- outdated platform tactic repeated from memory.

## Sources

- [Google Ads Search Skillshop](https://skillshop.withgoogle.com/googleads/)
- [Google Ads conversion measurement](https://support.google.com/google-ads/answer/1722022?hl=en)

Source use: official learning and measurement guidance. Check current Google Ads Help for active bidding, matching, and policy behavior before acceptance.
