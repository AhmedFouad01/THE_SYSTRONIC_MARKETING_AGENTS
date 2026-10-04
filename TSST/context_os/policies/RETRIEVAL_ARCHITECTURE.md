# TSST Context OS v0.2 — Retrieval Architecture

Status: **PROPOSED / UNVALIDATED**
Gate: C2 Retrieval & Indexing

## 1. Objective

Retrieve the minimum authoritative evidence needed for the active decision while preserving:
- project isolation;
- state-scope separation;
- source provenance;
- supersession history;
- privacy boundaries;
- deterministic auditability.

Retrieval is not memory truth. It is a discovery layer over canonical sources.

---

## 2. Retrieval Pipeline

```text
Task / Decision Need
        |
        v
Project + Workstream Filter       <- hard boundary
        |
        v
State Scope Filter                <- governance/workstream/product/readiness/release
        |
        v
Entity / Exact-ID Retrieval       <- cheapest/highest precision first
        |
        v
Keyword / Metadata Retrieval
        |
        v
Semantic Retrieval                <- optional derived signal
        |
        v
Authority + Freshness Rerank
        |
        v
Conflict / Supersession Check
        |
        v
Bounded Evidence Bundle
        |
        v
Context Pack
```

---

## 3. Retrieval Modes

### R0 — Exact
Use known file/document/entity/checkpoint IDs.

Best for:
- current status;
- ADRs;
- known CRM record;
- known implementation commit;
- known evaluation.

### R1 — Structured metadata
Filter by:
- project;
- workstream;
- state_scope;
- entity;
- memory_class;
- authority class;
- date/version;
- status;
- sensitivity.

### R2 — Keyword / lexical
Use for terminology, identifiers, error text, feature names and code symbols.

### R3 — Semantic
Use embeddings/vector search to discover conceptually related material.

Semantic score is a ranking signal only, never an authority signal.

### R4 — Temporal / graph
Deferred candidate for future evaluation.
Use only if temporal/relationship queries materially outperform the simpler stack.

---

## 4. Query Intent

Every retrieval request declares one primary intent:

- `current_state`
- `durable_decision`
- `implementation_truth`
- `approved_spec`
- `historical_evidence`
- `customer_evidence`
- `external_current_fact`
- `procedure`

Authority ranking changes by intent.

Example:
For `durable_decision`, an accepted ADR outranks a newer implementation note.
For `implementation_truth`, fresh verified test/commit evidence can outrank an older planning document.
For `current_state`, compare within the same `state_scope`.

---

## 5. Hard Filters Before Ranking

Reject before semantic scoring when:
- `project_key` mismatches and no controlled handoff exists;
- sensitivity exceeds requester/tool authorization;
- record is marked secret-prohibited;
- record belongs to another customer/tenant without explicit authority;
- status is deleted/revoked;
- required state_scope does not match the question.

This prevents similarity search from defeating governance.

---

## 6. Candidate Ranking

Suggested signals:

- scope_match
- exact_entity_match
- authority_fit_for_intent
- verification_state
- freshness_fit
- source_version_fit
- keyword_score
- semantic_score
- provenance_completeness
- supersession_status

Negative signals:
- stale
- superseded
- historical-only
- unresolved provenance
- wrong scope
- duplicate

Important:
A high semantic score cannot override a hard authority or project boundary.

---

## 7. Retrieval Stop Rule

Stop expanding when all are true:

1. Decision-critical facts have authoritative support.
2. Known contradictions have been surfaced.
3. Acceptance criteria are answerable.
4. Additional candidates are redundant or lower authority.
5. Context budget remains healthy.

---

## 8. Evidence Bundle Contract

```yaml
evidence_bundle:
  request_id: ...
  project_key: TSST
  intent: implementation_truth
  state_scope: product_milestone
  decision_needed: ...
  candidates_considered: 17
  selected:
    - record_id: ...
      source_locator: ...
      authority_class: verified_implementation
      version: ...
      excerpt: ...
      semantic_score: 0.82
      final_rank_reason:
        - exact workstream
        - verified evidence
        - newer applicable version
  conflicts: []
  excluded:
    - record_id: ...
      reason: superseded
  sufficiency:
    status: SUFFICIENT|PARTIAL|INSUFFICIENT
    missing: []
```

---

## 9. Index Strategy v0.2

Canonical store:
- existing Real Memory / project docs / repository / CRM operational stores.

Derived index:
- lexical index;
- metadata index;
- optional embeddings.

Recommended initial implementation:
- SQLite/PostgreSQL metadata + FTS/keyword;
- provider-neutral embedding adapter only after baseline lexical tests;
- no graph database in the critical path yet.

Reason:
The first evaluation should prove whether semantic retrieval materially improves precision after strong metadata and scope filtering.

---

## 10. Reindex / Invalidation

On source update:
1. generate new source version;
2. mark derived chunks for old version stale;
3. index new version;
4. preserve old version for historical audit if policy requires;
5. never mutate source-of-truth text from the indexer.

On accepted supersession:
- preserve old record;
- link `superseded_by`;
- default retrieval excludes superseded record unless historical context is requested.

---

## 11. Security Boundary

Never index:
- passwords;
- API keys;
- access tokens;
- private fixture tokens;
- encryption keys;
- prohibited secrets.

Customer PII:
- keep in CRM/domain store;
- index minimum necessary fields or pseudonymous locators where permitted;
- do not copy raw PII into TSST durable memory.

---

## 12. C2 Exit Gate

C2 is ready for integration only when:
- schema validation passes;
- cross-project rejection tests pass;
- state-scope tests pass;
- stale/superseded handling passes;
- exact + metadata + keyword retrieval benchmark is measured;
- semantic retrieval is added only if it improves the benchmark enough to justify cost/complexity.
