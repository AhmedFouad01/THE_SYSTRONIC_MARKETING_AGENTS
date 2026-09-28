# TSST-SPARK-SK-002 Evaluation — Measurement Architecture

Status: `QUEUED`  
Skill status: `UNVALIDATED`

## Task

Design an event map from visit to recognized revenue for an evaluator-supplied lead-to-sale business. No production tracking changes are permitted.

## Required deliverables

- event and conversion dictionary;
- browser/server/analytics/CRM data flow;
- source-of-truth and ownership map;
- primary/secondary conversion policy;
- identity, deduplication, consent, retention, and security notes;
- QA, reconciliation, diagnostics, and failure handling.

## Test conditions

Include duplicate browser/server submissions, delayed CRM revenue, refunded sales, consent denial, a missing event ID, and conflicting lead definitions.

## Evaluation emphasis

Score business-definition clarity, event precision, deduplication, privacy-aware design, negative tests, and reconciliation.

## Automatic failures

Customer-data upload without authorization; hashing treated as consent; duplicate funnel events all marked primary; or tag firing accepted as sufficient QA.
