---
name: tsst-dev-sk-011-testing-tdd-engineering
description: Use when behavior changes need a test strategy, regression protection or meaningful automated tests.
---

# TSST-DEV-SK-011 — Testing & TDD Engineering

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: qa, testing

## Purpose and trigger

Use when behavior changes need a test strategy, regression protection or meaningful automated tests. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Map acceptance criteria and risks to unit, integration, contract, E2E and regression tests; choose the cheapest level that observes the behavior.
2. Cover relevant edge cases and failure paths with independent, deterministic fixtures and controlled external dependencies.
3. Where appropriate use RED → GREEN → REFACTOR: observe a meaningful failure, implement the smallest behavior, then refactor while rerunning the checks.
4. For E2E, test user-observable flows with stable selectors and condition-based waits; investigate flakiness rather than hiding it with retries.
5. Run the relevant suite and report failures, skipped coverage and the exact environment/version.

## Decision rules and guardrails

Do not force TDD onto throwaway spikes or pure research. Avoid tests that merely restate implementation or mock away the behavior they claim to verify.

## Expected output

Risk-to-test mapping; tests and fixtures; relevant red/green evidence; suite results; remaining coverage gaps.

## Verification

Check assertions detect realistic defects, failures have the intended cause, and passing results apply to the changed version.

## Sources and optional references

[test-driven-development](../../references/SOURCES.md#test-driven-development); [e2e-testing-patterns](../../references/SOURCES.md#e2e-testing-patterns)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
