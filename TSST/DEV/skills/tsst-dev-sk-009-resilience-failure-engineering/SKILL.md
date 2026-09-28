---
name: tsst-dev-sk-009-resilience-failure-engineering
description: Use when dependencies, queues or state changes can fail partially or require recovery.
---

# TSST-DEV-SK-009 — Resilience & Failure Engineering

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: reliability, failure

## Purpose and trigger

Use when dependencies, queues or state changes can fail partially or require recovery. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Identify failure modes, affected state, caller expectations and consistency implications, including partial success.
2. Choose timeout budgets and bounded retries with backoff/jitter only for retryable errors and safely repeatable operations.
3. Define idempotency, compensation, graceful degradation, dead-letter handling and recovery ownership where applicable.
4. Preserve diagnostic context while returning safe errors; avoid swallowing failures or reporting success after losing required work.
5. Exercise timeout, duplicate, exhaustion, partial failure and recovery scenarios at relevant boundaries.

## Decision rules and guardrails

Design the failure path, not only the success path. Avoid infinite retries, retry amplification and claiming compensation is atomic rollback.

## Expected output

Failure matrix; error/retry policy; recovery procedures; consistency trade-offs; fault-test evidence.

## Verification

Confirm bounded resource usage, durable failure visibility, and recovery without duplicate side effects or silent data loss.

## Sources and optional references

[error-handling-patterns](../../references/SOURCES.md#error-handling-patterns)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
