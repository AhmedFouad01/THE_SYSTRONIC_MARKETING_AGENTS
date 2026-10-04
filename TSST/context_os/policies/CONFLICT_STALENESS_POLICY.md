# TSST Conflict & Staleness Policy v0.2

Status: PROPOSED / UNVALIDATED

## Conflict Types

### C1 — Same-scope state conflict
Two active records claim incompatible current state for the same:
project + workstream + state_scope + state_key.

Action:
- compare authority/version/date;
- resolve only if supersession is supported;
- otherwise mark UNRESOLVED.

### C2 — Cross-scope apparent conflict
Example:
TSST governance gate open, CRM product milestone advanced.

Action:
Not a conflict. Preserve both.

### C3 — Decision vs implementation divergence
Implementation behavior differs from accepted ADR/spec.

Action:
Do not silently declare implementation authoritative.
Open a conformance issue or explicit decision-change path.

### C4 — Derived vs canonical
Summary/embedding/graph claim differs from source.

Action:
Canonical source wins. Rebuild/invalidate derived record.

### C5 — Customer evidence conflict
Different customers report opposite needs/outcomes.

Action:
Preserve segmentation/context. Do not average into a universal truth.

## Staleness

A record is stale when:
- a newer verified record explicitly supersedes it; or
- its provider/policy/runtime validity window expired; or
- its source was materially revised; or
- a configured TTL applies to a time-sensitive fact.

Age alone is not staleness for durable decisions.

## Stale Retrieval Behavior

Default:
- exclude superseded;
- down-rank stale mutable facts;
- surface stale status when historical evidence is necessary;
- force current-source refresh for external current facts.
