---
name: tsst-dev-sk-003-architecture-trade-off-engineering
description: Use when system boundaries, shared contracts, or architectural decisions materially affect delivery.
---

# TSST-DEV-SK-003 — Architecture & Trade-off Engineering

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: architecture, decisions

## Purpose and trigger

Use when system boundaries, shared contracts, or architectural decisions materially affect delivery. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Map users, system boundaries, data ownership, interfaces, change vectors and failure boundaries from the real requirements.
2. Compare build/buy/reuse/configure and the simplest viable architecture against scale, security, operability and reversibility.
3. State dependency direction, interface contracts, consistency expectations and failure behavior. Use patterns only when they solve an evidenced problem.
4. Record the decision, drivers, trade-offs, rejected alternatives, consequences and reversal/migration triggers in a project-local ADR using existing ID rules.
5. Review sensitive trust/data boundaries and provide an incremental implementation and verification path.

## Decision rules and guardrails

Do not default to microservices, CQRS, sagas or workflow engines. Consult those optional source skills only when the problem requires their mechanisms; no distributed-system complexity without demonstrated need.

## Expected output

Boundary/interface description; decision record; rejected alternatives; risks; security and recovery considerations; implementation implications.

## Verification

Walk representative success, failure and change scenarios through the design. Confirm each major component has an actual requirement and owner.

## Sources and optional references

[architecture-patterns](../../references/SOURCES.md#architecture-patterns); [architecture-decision-records](../../references/SOURCES.md#architecture-decision-records)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
