---
name: tsst-dev-sk-016-technical-solution-communication
description: Use when returning an engineering recommendation, implementation or operational handoff to TSST Lead.
---

# TSST-DEV-SK-016 — Technical Solution Communication

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: communication, handoff

## Purpose and trigger

Use when returning an engineering recommendation, implementation or operational handoff to TSST Lead. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Identify the recipient, decision and required technical depth; lead with the outcome and underlying problem.
2. Explain the selected solution, meaningful alternatives and trade-offs using concrete behavior. Separate facts, assumptions, hypotheses and recommendations.
3. Link changed artifacts, setup/use instructions and verification evidence; state security/data implications, known limits and remaining work.
4. Explain operational ownership, failure response, rollback/recovery and the next authorized action when applicable.
5. Return the shared TSST handoff to Lead with requested domain reviews and unresolved decisions; label implementation separately from production activation.

## Decision rules and guardrails

Primarily custom TSST method. A technically correct solution without a clear handoff is incomplete. Do not hide uncertainty in jargon or claim approval, deployment or validation from file creation.

## Expected output

Outcome; rationale/trade-offs; artifact links; setup/use; Claim/Evidence/Verification Method/Result/Remaining Unverified Items; risks; ownership and next action.

## Selectable output modes

Choose the shallowest output mode that supports the actual decision. Do not generate Engineering Blueprint detail for a simple executive decision.

### Executive View

For fast leadership decisions:

- Problem
- Current State
- Recommendation
- Why
- Expected Impact
- Main Risks
- Next Action

### Decision View

When alternatives/trade-offs matter:

- Objective
- Constraints
- Alternatives
- Trade-off Matrix
- Recommendation
- Why Not Alternatives
- Risk
- Reversibility

### Engineering Blueprint

For implementation handoff:

- Architecture
- Components
- Boundaries
- Data Flow
- Data Model
- APIs
- Identity/Security
- Failure Model
- Observability
- Testing
- Migration
- Deployment
- Rollback

## Technical visual artifacts

When they materially improve understanding, support a Mermaid architecture diagram, sequence diagram, ERD, state diagram, data-flow diagram, deployment diagram or dependency diagram.

Do not create decorative diagrams. Every diagram must clarify a decision, interface, state transition, dependency or implementation path.

## Verification

Check that a recipient can locate the deliverable, understand the decision, reproduce relevant verification and know the limits and next step.

## Sources and optional references

[Custom TSST](../../references/SOURCES.md#custom-tsst)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
