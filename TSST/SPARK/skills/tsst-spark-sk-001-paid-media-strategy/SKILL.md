---
name: tsst-spark-sk-001-paid-media-strategy
description: Design paid-media strategy from a business objective through funnel role, channel choice, KPI tree, budget logic, measurement prerequisites, and decision cadence.
---

# TSST-SPARK-SK-001 Paid Media Strategy

Status: `UNVALIDATED`

## Objective

Create a paid-media strategy in which campaign and channel decisions follow the business objective, audience, funnel role, economics, and valid measurement.

## Triggers

Use for media strategy, channel-role design, paid funnel planning, KPI trees, budget logic, or preflight review before campaign architecture.

## Reusable principles

- Start with the business outcome and customer decision, not a platform campaign type.
- Give each channel a specific role based on audience behavior, intent, creative fit, and measurement feasibility.
- Define a KPI tree from business outcome to leading and diagnostic metrics.
- Separate forecasts and assumptions from observed baselines.
- Allocate budget through explicit constraints, learning needs, and marginal decision logic.
- Measurement readiness is a prerequisite, not a downstream optimization task.

## Workflow

1. Confirm the business objective, value model, audience, offer, geography, horizon, constraints, and approved positioning.
2. Map the customer journey and identify where paid media can create or capture demand.
3. Define channel roles and reject channels without a defensible role.
4. Build the KPI tree with formulas, owners, data sources, latency, and decision thresholds.
5. Check conversion, attribution, consent, creative, landing-page, and CRM prerequisites.
6. Build transparent budget logic with assumptions, minimum learning needs, stop conditions, and reallocation rules.
7. Define test sequence, monitoring cadence, and escalation triggers.
8. Request LENS_AG strategy/evidence review and CREATIVE_AG creative-feasibility review.

## Output contract

- business objective and paid-media role;
- audience/funnel map;
- channel-role rationale and exclusions;
- KPI tree and metric dictionary;
- budget logic, assumptions, and constraints;
- measurement and creative prerequisites;
- test roadmap, decision cadence, risks, and stop conditions.

## Guardrails

- Do not design campaign structure before the business objective.
- Do not invent conversion rates, targets, budgets, or platform outcomes.
- Do not use ROAS alone; include volume, margin/value, incrementality limits, and funnel diagnostics as relevant.
- Do not recommend a channel whose signal, creative, or audience prerequisites are absent.
- Recheck current official platform documentation before platform-specific recommendations.

## Completion checklist

- [ ] Paid activity traces to a business objective.
- [ ] Every channel has a distinct role and evidence.
- [ ] KPIs have formulas, sources, ownership, and cadence.
- [ ] Budget logic exposes assumptions and stop rules.
- [ ] Measurement, consent, creative, and landing prerequisites are explicit.
- [ ] CREATIVE_AG/LENS_AG review requests are defined.

## Practical evaluation

Build a paid-media strategy and KPI tree for an evaluator-supplied product. The fixture includes a fixed budget, uncertain conversion baseline, two viable channels, one weak-fit channel, and an incomplete tracking setup. The candidate must not produce a launch-ready campaign structure.

## Common failure modes

- platform-first plan;
- every channel included;
- metric list instead of KPI tree;
- budget split with false precision;
- optimization promised before valid tracking;
- platform-reported return treated as incrementality.

## Sources

- [Google Ads Skillshop](https://skillshop.withgoogle.com/googleads/)
- [Google Ads conversion measurement](https://support.google.com/google-ads/answer/1722022?hl=en)

Source use: official platform learning. Strategy must still use the organization's economics, evidence, and measurement constraints.
