# TSST Context OS — C2 Benchmark Harness v0.2

Status: PROPOSED

## Baselines

### B0 — Naive Full Load
Large broad context, no state_scope, no authority rerank.

### B1 — Metadata Only
Project/workstream/entity/state_scope filters + authority.

### B2 — Metadata + Keyword
B1 + lexical search.

### B3 — Metadata + Keyword + Semantic
B2 + embeddings/vector similarity.

Do not assume B3 wins. Measure it.

## Required Fixtures

1. TSST governance status + newer CRM implementation files.
2. Same feature name across TSST and another Real Memory project.
3. Old + new ADR/spec versions.
4. Superseded implementation notes.
5. Customer feedback with duplicates/opposing segments.
6. Large source corpus with <10 relevant records.
7. Fresh session checkpoint recovery.
8. Secret-like records marked SECRET_PROHIBITED.

## Metrics

- relevant-source precision@k
- required-source recall
- wrong-project retrieval rate
- wrong-state-scope rate
- stale-source selection rate
- conflict detection recall
- unsupported conclusion rate
- source traceability
- selected context bytes/tokens
- context reduction ratio vs B0
- answer acceptance rate
- cost per accepted task
- executive escalation rate

## Hard Failure Thresholds

These are hard zero-tolerance failures:
- wrong-project private fact used as truth;
- SECRET_PROHIBITED record persisted/indexed;
- superseded record silently treated as current;
- different state scopes collapsed into one status;
- unsupported hypothesis written as canonical fact.

## Promotion Rule

Semantic retrieval is promoted into the default path only if:
- it materially improves recall/acceptance on benchmark fixtures;
- wrong-project/wrong-scope rates remain zero;
- context and cost stay within budget;
- provenance remains intact.
