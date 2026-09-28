---
name: tsst-dev-sk-002-solution-exploration-technical-spikes
description: Use when meaningful solution choices or technical uncertainty could change implementation.
---

# TSST-DEV-SK-002 — Solution Exploration & Technical Spikes

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: discovery, experimentation

## Purpose and trigger

Use when meaningful solution choices or technical uncertainty could change implementation. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Identify the uncertainty and the decision it blocks. Consider elimination, simplification, configuration, reuse, integration and purchase before custom code.
2. Compare meaningful Conservative, Balanced and High-Leverage options where useful; omit artificial alternatives and explain when only one viable option remains.
3. Compare effort, time-to-value, complexity, risk, operational burden, reversibility, security, scalability, performance, maintainability and dependency/vendor risk using evidence or labeled estimates.
4. Define a bounded probe with hypothesis, cheapest safe method, time/resource limit, success/failure criterion and cleanup. Use non-production fixtures within existing authority.
5. Run the authorized probe, retain observations and limitations, then recommend a path or identify unresolved uncertainty. Label throwaway code and prevent accidental promotion.

## Decision rules and guardrails

Use the cheapest safe experiment that resolves material uncertainty. A successful probe does not prove production suitability or authorize purchase.

## Expected output

Options comparison; probe question, limits and results; recommendation; rejected options; remaining uncertainty.

## Verification

Check the probe actually distinguishes the choices, record actual results, and avoid extrapolating beyond the tested conditions.

## Sources and optional references

[brainstorming](../../references/SOURCES.md#brainstorming); [architecture-patterns](../../references/SOURCES.md#architecture-patterns)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
