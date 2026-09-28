---
name: tsst-dev-sk-001-solution-discovery-constraint-reframing
description: Use when a routed engineering request has an unclear objective, constraints, or solution scope.
---

# TSST-DEV-SK-001 — Solution Discovery & Constraint Reframing

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: discovery, requirements

## Purpose and trigger

Use when a routed engineering request has an unclear objective, constraints, or solution scope. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Read the brief, existing implementation and authoritative project context. Separate the objective from the requested implementation; identify users, root problem and measurable success criteria.
2. List hard constraints with their authority, soft preferences with their trade-offs, material assumptions with owners, and unknowns with a way to resolve them.
3. Challenge whether the process should exist or be simplified before automating it. Present a reframed problem when it changes the decision; do not silently change scope.
4. Classify Spike (feasibility question and disposable probe), Bounded (existing flow with limited change), or Architectural (new system or material boundary change). Scale artifacts and revisit classification when evidence changes.
5. Return an actionable brief and the smallest next decision to Lead; carry forward existing explicit authorization.

## Decision rules and guardrails

Ask only questions that block a material decision. Missing facts remain unknown. Classification is a planning aid, not approval or proof of readiness.

## Expected output

Objective; current behavior; root problem; success criteria; hard/soft constraints; assumptions and unknowns; classification and rationale; proposed next step.

## Verification

Trace criteria and constraints to supplied evidence. Check that the proposed step addresses the root problem and stays inside the routed scope.

## Sources and optional references

[brainstorming](../../references/SOURCES.md#brainstorming); [context-driven-development](../../references/SOURCES.md#context-driven-development)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
