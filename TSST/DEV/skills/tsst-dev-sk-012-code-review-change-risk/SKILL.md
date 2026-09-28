---
name: tsst-dev-sk-012-code-review-change-risk
description: Use when a concrete change needs engineering review before acceptance or release.
---

# TSST-DEV-SK-012 — Code Review & Change Risk

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: review, risk

## Purpose and trigger

Use when a concrete change needs engineering review before acceptance or release. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Identify the requirements, base/head or stable patch snapshot and changed scope. Rebind evidence if the subject changes.
2. Trace changed behavior through callers and data paths; inspect architecture fit, correctness, edge cases, security, performance, data impact and maintainability.
3. Assess tests against actual changed boundaries, blast radius and rollback difficulty; passing tests do not reduce the impact of a possible failure.
4. Label findings BLOCKING, IMPORTANT, SUGGESTION or NIT; attach location, trigger, consequence, evidence and a concrete remedy.
5. Report review coverage, unresolved findings and residual risk to Lead; verify fixes against the same acceptance criteria.

## Decision rules and guardrails

Do not manufacture findings or confuse style preference with defects. Review is not merge/deployment authority; source security integrations are not assumed available.

## Expected output

Change identity; requirement coverage; severity-ranked findings; regression protection; blast radius; recoverability; acceptance recommendation.

## Verification

Validate findings against source or safe checks, distinguish unproven concerns, and explicitly identify unreviewed areas.

## Sources and optional references

[code-review-excellence](../../references/SOURCES.md#code-review-excellence); [assess-patch-risk](../../references/SOURCES.md#assess-patch-risk); [security-diff-scan](../../references/SOURCES.md#security-diff-scan)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
