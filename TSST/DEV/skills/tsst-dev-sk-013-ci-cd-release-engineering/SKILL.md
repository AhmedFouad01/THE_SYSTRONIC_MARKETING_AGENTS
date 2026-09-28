---
name: tsst-dev-sk-013-ci-cd-release-engineering
description: Use when build pipelines, release controls or deployment procedures are created or changed.
---

# TSST-DEV-SK-013 — CI/CD & Release Engineering

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: devops, release

## Purpose and trigger

Use when build pipelines, release controls or deployment procedures are created or changed. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Identify environments, artifact provenance, release requirements, authority and recovery objectives.
2. Define build, tests, lint and relevant security checks with explicit failure gates, minimal credentials and traceable artifacts.
3. Design environment promotion, staged rollout, migration sequencing and rollback/forward recovery for the real platform.
4. Specify preflight conditions, deployment gates, post-deploy verification, abort thresholds and an accountable operator.
5. Validate configuration and rehearse safely before an authorized release; hand off blocked gates without executing them.

## Decision rules and guardrails

Keep core platform-neutral; load GitHub Actions templates only for that platform. A green pipeline is not production approval. Do not execute deployment just because its plan exists.

## Expected output

Pipeline/configuration; artifact handling; gates; rollout/migration sequence; recovery procedure; post-deploy checks and evidence.

## Verification

Verify failure gates block promotion, artifacts are identifiable, credentials are scoped, and rollout/recovery checks are executable in the target environment.

## Sources and optional references

[deployment-pipeline-design](../../references/SOURCES.md#deployment-pipeline-design)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
