---
name: tsst-dev-sk-010-systematic-debugging-root-cause-analysis
description: Use when a reproducible bug, failing check or unexplained behavior needs diagnosis.
---

# TSST-DEV-SK-010 — Systematic Debugging & Root Cause Analysis

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: debugging, diagnosis

## Purpose and trigger

Use when a reproducible bug, failing check or unexplained behavior needs diagnosis. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Reproduce the original symptom and record expected/actual behavior, environment and revision; if intermittent, collect conditions and frequency.
2. Gather logs, recent changes and boundary observations to localize the failure without exposing secrets.
3. Write a falsifiable hypothesis and test it with the smallest controlled experiment. Change one relevant factor at a time.
4. Identify the causal mechanism, apply the minimal justified fix and add regression protection at the appropriate level.
5. Verify the original failure and relevant adjacent behavior freshly; document root cause, evidence and unresolved conditions.

## Decision rules and guardrails

Do not default to speculative patching. If evidence contradicts the hypothesis, revise it rather than stacking fixes. Diagnostic instrumentation must remain scoped.

## Expected output

Reproduction; evidence timeline; tested hypotheses; root cause; minimal fix; regression and original-symptom verification.

## Verification

Demonstrate the regression check detects the defect and the changed implementation resolves it; report limits for intermittent failures.

## Sources and optional references

[systematic-debugging](../../references/SOURCES.md#systematic-debugging); [debugging-strategies](../../references/SOURCES.md#debugging-strategies)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
