---
name: tsst-spark-sk-003-attribution-fundamentals
description: Explain and reconcile multi-touch attribution across analytics and ad platforms, including model, window, time basis, scope, modeled data, and double-counting limits.
---

# TSST-SPARK-SK-003 Attribution Fundamentals

Status: `UNVALIDATED`

## Objective

Interpret multi-channel journeys without double counting, conflating incompatible scopes, or presenting attributed credit as causal incrementality.

## Triggers

Use for attribution explanations, platform-versus-analytics reconciliation, channel-credit disputes, model comparisons, conversion-window review, or journey analysis.

## Reusable principles

- Attribution assigns credit under a model; it does not prove causality.
- Always state model, eligible channels, lookback window, event/key-event definition, time basis, identity scope, and data freshness.
- Platform reports may each claim credit for the same conversion; summed platform totals are not a deduplicated total.
- Analytics dimensions can use different scopes and attribution behavior.
- Modeled, view-through, engaged-view, cross-device, and consent-affected conversions require explicit treatment.
- Reconcile to a business source of truth while preserving legitimate scope differences.

## Workflow

1. Define the business conversion and source of truth.
2. Inventory each report's conversion definition, model, window, channels, time basis, timezone, identity, and filters.
3. Map the customer journey using a shared event key where available.
4. Identify duplicate credit, missing touchpoints, modeled records, late adjustments, and incompatible scopes.
5. Compare models only on equivalent definitions and date logic.
6. Explain differences as expected, fixable, or unresolved.
7. Present attributed, observed, and incremental interpretations separately.
8. Recommend measurement changes or experiments needed for causal questions.

## Output contract

- journey and conversion definitions;
- report-scope comparison table;
- model/window/time-basis notes;
- deduplication and reconciliation analysis;
- explained differences and residual gap;
- decision implications and causal limitations.

## Guardrails

- Never equate platform-reported revenue with absolute business truth.
- Never sum platform-attributed conversions without deduplication and scope analysis.
- Do not compare reports using different event-time or interaction-time bases as though they match.
- Do not describe data-driven attribution as a controlled incrementality experiment.
- Recheck current model availability and platform rules before use.

## Completion checklist

- [ ] Conversion and source of truth are defined.
- [ ] Models, windows, channels, time basis, and scopes are recorded.
- [ ] Duplicate credit and modeled data are addressed.
- [ ] Differences are quantified where data permits.
- [ ] Attribution and incrementality are separated.
- [ ] Current official documentation was checked.

## Practical evaluation

Explain an evaluator-supplied multi-channel journey where Meta, Google Ads, GA4, and CRM report different totals. Reconcile without double counting, identify scope differences, and state what cannot be inferred causally.

## Common failure modes

- adding platform totals;
- model name reported without window or scope;
- direct, view-through, or modeled treatment omitted;
- event time and click time mixed;
- discrepancy forced to zero with arbitrary adjustments;
- attribution used as proof of incrementality.

## Sources

- [Google Analytics: Get started with attribution](https://support.google.com/analytics/answer/10596866)
- [GA4 traffic-source dimension scopes](https://support.google.com/analytics/answer/11080067?hl=en)

Source use: current GA4 attribution reference. Other platforms require their own current official documentation.
