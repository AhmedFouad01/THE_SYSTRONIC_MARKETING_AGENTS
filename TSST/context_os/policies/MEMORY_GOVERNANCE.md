# TSST Memory Governance v0.1

Status: PROPOSED

## Memory Classes

### Canonical
Human-auditable source of truth.

### Operational
Current system state in CRM/repository/runtime.

### Evidence
Audits, tests, feedback, experiments, research.

### Derived
Summaries, embeddings, tags, graph relations, inferred clusters.

### Ephemeral
Current-task scratch state.

## Promotion Rules

Derived → Canonical: never automatically.
Evidence → Learning: only after validation/review.
Hypothesis → Fact: only with evidence.
Feedback → General customer truth: never from a single record.

## Supersession

Every durable mutable fact should support:
- valid_from;
- superseded_at or status;
- superseded_by;
- source;
- project scope.

Do not delete history merely because a newer state exists.

## Retrieval Metadata

Recommended fields:
- memory_id;
- project_key;
- workstream;
- entity_type;
- entity_id;
- memory_class;
- fact_type;
- authority_level;
- source_locator;
- source_date;
- observed_at;
- valid_from;
- superseded_by;
- confidence;
- sensitivity;
- retention_class;
- tags.

## Privacy

Customer PII remains in the appropriate operational system.
TSST memory stores references and validated abstractions, not unnecessary raw personal data.

## Write Approval

Normal execution can generate a proposed write packet.
Durable TSST Real Memory changes continue through the project's controlled sync/review process.
