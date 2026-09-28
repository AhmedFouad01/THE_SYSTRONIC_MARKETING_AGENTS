---
name: tsst-spark-sk-002-measurement-architecture
description: Design event and conversion measurement from visit to revenue with naming, parameters, ownership, deduplication, consent, source-of-truth rules, and QA evidence.
---

# TSST-SPARK-SK-002 Measurement Architecture

Status: `UNVALIDATED`

## Objective

Create a measurement architecture that produces decision-usable events and conversions from browser, server, analytics, ad platforms, and CRM systems without silent duplication or ambiguous ownership.

## Triggers

Use for event maps, conversion definitions, tracking plans, enhanced conversions, offline conversion loops, deduplication, source-of-truth decisions, or tracking QA.

## Reusable principles

- Define business events before implementing platform tags.
- Give every event an owner, trigger, parameters, identity/deduplication rule, consent treatment, and QA evidence.
- Separate primary optimization conversions from secondary observation signals.
- Use a stable transaction or event identifier where browser and server sources may duplicate the same action.
- Reconcile platform, analytics, CRM, and finance definitions; do not force them to equal when scopes differ.
- First-party and enhanced-conversion data require lawful collection, normalization, security, and consent handling.

## Workflow

1. Confirm the funnel, business definitions, systems, jurisdictions, consent requirements, and decision use.
2. Map user/business events from visit through qualified outcome and revenue.
3. Define event names, exact triggers, required parameters, identifiers, values, currencies, timestamps, and owners.
4. Select the system of record for each business outcome and define platform/analytics roles.
5. Design browser, server, analytics, CRM, and import flows with deduplication and failure handling.
6. Classify conversions as primary/biddable or secondary/observational by objective.
7. Create QA cases for valid, duplicate, missing, refunded, delayed, consent-denied, and cross-device scenarios.
8. Document diagnostics, reconciliation tolerances, monitoring, and rollback/escalation.

## Output contract

- event/conversion map from visit to revenue;
- event dictionary and parameter schema;
- data-flow diagram and ownership;
- primary/secondary conversion policy;
- identity, deduplication, consent, retention, and security notes;
- QA test plan, reconciliation logic, and monitoring.

## Guardrails

- Tracking precedes optimization.
- Do not deploy tags, upload customer data, or change production systems without explicit authorization and privacy/legal approval.
- Do not collect fields merely because a platform accepts them.
- Do not hash data and assume that hashing alone resolves consent or privacy obligations.
- Do not hide duplicate, missing, or delayed conversions with aggregate totals.

## Completion checklist

- [ ] Business definitions and source of truth are explicit.
- [ ] Event triggers and parameters are testable.
- [ ] Primary and secondary conversions match the objective.
- [ ] Deduplication and delayed/offline flows are defined.
- [ ] Consent, privacy, retention, and security owners are named.
- [ ] QA includes negative and reconciliation cases.

## Practical evaluation

Design an event map from visit to recognized revenue for a supplied lead-to-sale business. Include browser and server events, CRM qualification, offline revenue, deduplication, consent, and QA. No production implementation is permitted.

## Common failure modes

- platform event names treated as business definitions;
- purchase/lead events without unique IDs;
- primary conversions that double-count funnel stages;
- no consent-denied behavior;
- CRM and ad-platform time/value definitions mixed;
- successful tag firing treated as proof of correct business measurement.

## Sources

- [Google Enhanced Conversions Best Practices](https://support.google.com/google-ads/answer/14795081?hl=en)
- [Google Ads conversion measurement](https://support.google.com/google-ads/answer/1722022?hl=en)

Source use: current official Google measurement guidance. Apply equivalent platform-specific rules only after checking that platform's current official documentation.
