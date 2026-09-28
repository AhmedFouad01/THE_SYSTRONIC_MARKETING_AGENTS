---
name: tsst-dev-sk-005-api-integration-engineering
description: Use when designing, implementing or changing APIs, webhooks or external integrations.
---

# TSST-DEV-SK-005 — API & Integration Engineering

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: backend, contracts, integration

## Purpose and trigger

Use when designing, implementing or changing APIs, webhooks or external integrations. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Identify producers, consumers, compatibility promises and trust boundaries. Define request/response schemas, validation, auth and error contracts.
2. Specify versioning and pagination semantics where needed; align OpenAPI or the repository contract format with implemented behavior.
3. Define idempotency scope, retries, deadlines/timeouts and rate limits. For webhooks include signature validation, replay defense, duplicate delivery and ordering behavior.
4. Implement using established adapters and dependencies, with bounded calls and observable outcomes that redact sensitive data.
5. Test contract compatibility and relevant authentication, validation, timeout, duplicate and upstream failure cases.

## Decision rules and guardrails

Do not invent provider behavior. Check the selected provider/version documentation at use time. Retrying an unsafe side effect requires a deduplication or reconciliation design.

## Expected output

API contract and compatibility notes; implementation; integration configuration without secrets; failure policy; verification evidence.

## Verification

Exercise representative consumer contracts and adverse responses; compare documented and actual schemas/statuses.

## Sources and optional references

[api-design-principles](../../references/SOURCES.md#api-design-principles); [openapi-spec-generation](../../references/SOURCES.md#openapi-spec-generation)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
