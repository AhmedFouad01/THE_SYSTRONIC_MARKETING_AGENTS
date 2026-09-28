---
name: tsst-dev-sk-006-data-sql-migration-engineering
description: Use when data models, SQL behavior, schema changes, backfills or data migrations are involved.
---

# TSST-DEV-SK-006 — Data, SQL & Migration Engineering

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: database, migration, performance

## Purpose and trigger

Use when data models, SQL behavior, schema changes, backfills or data migrations are involved. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Model entities, ownership, constraints, transaction boundaries and concurrency invariants before choosing indexes or query rewrites.
2. Measure query plans and behavior with representative volumes and distributions; distinguish estimated cost from observed performance.
3. Design migration ordering, application-version compatibility, resumable backfill, validation and rollback or forward recovery. Assess locking and consistency impacts.
4. Use expand/contract or low/zero-downtime techniques only when availability requirements justify them; identify irreversible steps explicitly.
5. Rehearse on safe fixtures with backups/restore evidence as appropriate, compare counts and invariants, and hand off the execution gate.

## Decision rules and guardrails

Keep core vendor-neutral; verify engine/version semantics before execution. A down migration is not proof of data recovery. Production mutation needs explicit scoped authority.

## Expected output

Schema/query rationale; migration and backfill plan; validation queries; recovery plan; measured results and downtime assumptions.

## Verification

Check data invariants, concurrency, interrupted/resumed backfills, old/new application compatibility and realistic recovery.

## Sources and optional references

[sql-optimization-patterns](../../references/SOURCES.md#sql-optimization-patterns); [database-migration](../../references/SOURCES.md#database-migration)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
