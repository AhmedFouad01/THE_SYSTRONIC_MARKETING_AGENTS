---
name: tsst-dev-sk-014-observability-reliability-performance
description: Use when service health, reliability targets, performance or failure localization need engineering work.
---

# TSST-DEV-SK-014 — Observability, Reliability & Performance

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: observability, reliability, performance

## Purpose and trigger

Use when service health, reliability targets, performance or failure localization need engineering work. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Define how users experience success and failure. Select SLIs, SLO windows and error budgets with justified targets rather than copied defaults.
2. Design correlated metrics, logs and traces sufficient to tell whether it works, whether it is degrading, where it failed and how users/systems are affected.
3. Set actionable alerts with ownership and runbooks; include context propagation, sampling, retention, cardinality and sensitive-data limits.
4. Measure representative baseline/load behavior, locate bottlenecks, change one material cause and compare outcomes and resource cost.
5. Test telemetry and alerts under safe fault/load conditions and describe missing coverage or uncertain capacity.

## Decision rules and guardrails

Keep core vendor-neutral; Prometheus/Grafana references are optional only for relevant stacks. Tracing does not justify microservices. No arbitrary sampling or performance targets.

## Expected output

Health questions and signals; SLI/SLO definitions; alert/runbook mapping; baseline and comparison; user/system impact; limitations.

## Verification

Demonstrate a normal and degrading/failing path produces useful signals, confirm correlation, and report measured impact and instrumentation overhead.

## Sources and optional references

[distributed-tracing](../../references/SOURCES.md#distributed-tracing); [slo-implementation](../../references/SOURCES.md#slo-implementation)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
