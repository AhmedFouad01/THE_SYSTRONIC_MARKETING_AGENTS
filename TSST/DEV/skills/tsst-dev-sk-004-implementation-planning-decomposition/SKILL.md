---
name: tsst-dev-sk-004-implementation-planning-decomposition
description: Use when an accepted engineering scope needs multiple verifiable implementation increments.
---

# TSST-DEV-SK-004 — Implementation Planning & Decomposition

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: planning, delivery

## Purpose and trigger

Use when an accepted engineering scope needs multiple verifiable implementation increments. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Read the approved scope and repository context; identify affected modules, contracts, dependencies and acceptance criteria.
2. Divide work into small increments that each produce a reviewable, verifiable result. Sequence dependencies without inventing fixed-duration tasks.
3. For each increment record objective, dependency, affected area, implementation action, expected result, verification and rollback/failure consideration.
4. Identify missing inputs and reserved decisions. Keep independent authorized work separable from blocked work.
5. Maintain the plan as evidence changes, explaining scope impact to Lead; do not silently broaden the assignment.

## Decision rules and guardrails

Reuse existing project documentation. Do not install a new planning framework, require agents, or treat a plan as permission for deployment.

## Expected output

Ordered increments with all seven fields; acceptance mapping; dependencies; decision/authority gaps.

## Verification

Check coverage of every acceptance criterion, dependency ordering, observable results and recovery feasibility.

## Sources and optional references

[writing-plans](../../references/SOURCES.md#writing-plans); [context-driven-development](../../references/SOURCES.md#context-driven-development)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
