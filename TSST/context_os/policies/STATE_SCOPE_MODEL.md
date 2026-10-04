# TSST Context OS — State Scope Model v0.2

Status: **PROPOSED / UNVALIDATED**

## Why this exists

A large TSST project can have several valid states at the same time.

Examples:
- TSST governance can remain in an onboarding/setup gate.
- A CRM workstream can have M0/M1 closed and M2 active.
- An agent can remain `NOT_READY` even while a bounded user-authorized task is executed.
- A release can be blocked even while implementation is complete.

Therefore:

> **Newer does not automatically mean authoritative across different state scopes.**

A state record must declare the axis it governs.

## State Scopes

| Scope | Meaning | Example |
|---|---|---|
| `project_governance` | TSST operating model / governance gate | TSST-001A |
| `workstream` | A bounded stream of work | CRM MVP UI sprint |
| `product_milestone` | Product/engineering milestone | CRM M2 |
| `agent_readiness` | Agent/skill readiness | DEV_AG NOT_READY |
| `release` | Deploy/publish/pilot state | release blocked |
| `decision` | Accepted durable decision status | ADR accepted |
| `runtime` | Current environment/runtime state | API running locally |
| `external_dependency` | Provider/access/approval dependency | Meta access pending |

## Non-Override Rule

A source in one scope cannot silently supersede a source in another.

Examples:
- `product_milestone=M2_IMPLEMENTED` does not close `project_governance=TSST-001A`.
- `agent_readiness=NOT_READY` does not erase a one-off bounded user authorization.
- `implementation=DONE` does not imply `release=APPROVED`.

## Current Case Snapshot

A correct snapshot is multi-axis:

```yaml
current_case:
  project_key: TSST
  scopes:
    project_governance:
      state: TSST-001A
      source: ...
    workstream:
      id: CRM-MVP-01
      state: ...
      source: ...
    product_milestone:
      id: CRM-M2
      state: ...
      source: ...
    agent_readiness:
      DEV_AG: NOT_READY
      CREATIVE_AG: NOT_READY
    release:
      state: NOT_AUTHORIZED
```

The Lead reasons over the combined snapshot instead of forcing all state into a single linear status.
