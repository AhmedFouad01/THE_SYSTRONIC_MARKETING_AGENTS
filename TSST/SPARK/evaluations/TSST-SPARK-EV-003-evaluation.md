# TSST-SPARK-SK-003 Evaluation — Attribution Fundamentals

Status: `QUEUED`  
Skill status: `UNVALIDATED`

## Task

Explain and reconcile a supplied multi-channel journey where Meta, Google Ads, GA4, and CRM report different conversion and revenue totals.

## Required deliverables

- shared conversion definition and source of truth;
- report-scope table with models, windows, channels, time bases, and identity;
- journey and duplicate-credit analysis;
- explained/reconcilable/residual differences;
- decision implications and causal limitations.

## Test conditions

Include view-through credit, modeled conversions, a late CRM sale, different time zones, event-time versus interaction-time reporting, and one conversion claimed by two platforms.

## Evaluation emphasis

Score scope precision, duplicate handling, model understanding, reconciliation, and separation of attribution from incrementality.

## Automatic failures

Platform totals summed; attributed revenue called causal; model/window omitted; or discrepancy hidden through arbitrary adjustment.
