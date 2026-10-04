# TSST Context OS v0.6 RC1 — C6 Evaluation Report

Status: **REFERENCE PASS / RELEASE CANDIDATE, NOT PRODUCTION-CERTIFIED**

## Scope

C6 stress-tested the reference implementation across retrieval, routing, VOC/product-strength safeguards, recovery, and integrated continuation scenarios.

This is deterministic synthetic/reference validation. It does not replace real-provider cost tests, real CRM customer-data tests, or an authorized production pilot.

## Results

### Retrieval

- Cases: **500**
- Wrong-project selections: **0**
- Secret-prohibited selections: **0**
- Wrong-state-scope selections: **0**
- Superseded-as-current selections: **0**
- Average selected records: **8.00**
- Median synthetic context reduction vs full corpus: **99.69%**
- Minimum synthetic context reduction: **99.59%**

### Model / Tool Routing

- Cases: **3,000**
- Tier distribution: **{'EXECUTION': 1257, 'EXECUTIVE': 1386, 'CODE': 333, 'FAST': 24}**
- Executive use caused by volume alone: **0**
- LOW-budget silent executive use: **0**
- Unauthorized external actions allowed: **0**
- Unauthorized internal mutations allowed: **0**

### VOC / Product Strength

- Scenario batches: **1,000**
- Single-account false verification: **0**
- PII-safe-memory failures: **0**
- Duplicate inflation failures: **0**
- Contradictory evidence incorrectly promoted to CLAIM_READY: **0**

### Recovery

- Scenario batches: **1,000**
- Same-scope newer evidence not marked stale: **0**
- Cross-scope false staleness: **0**
- Cross-project false staleness: **0**
- Missing critical evidence not invalidated: **0**
- Do-not-repeat failures: **0**

### Integrated Scenarios

- **fresh_session_resume_crm** — PASS; `CODE`
- **bulk_voc_first_pass** — PASS; `FAST`
- **architecture_change** — PASS; `EXECUTIVE`

## Aggregate

- Synthetic/reference assertions exercised: **12,503**
- Hard failures: **0**
- Verdict: **PASS**

## What C6 establishes

The current reference design successfully enforces the intended invariants under the tested synthetic/adversarial cases:

1. project and state-scope hard boundaries precede semantic relevance;
2. prohibited secrets do not enter retrieval output;
3. superseded state is not treated as current;
4. large input volume alone does not justify executive-model use;
5. mutation/external actions are authority-gated;
6. one loud customer cannot manufacture a verified product strength;
7. duplicate feedback does not inflate breadth;
8. contradictory customer evidence remains a blocker for claim readiness;
9. fresh sessions can resume from evidence-backed checkpoints;
10. closed work is protected by do-not-repeat logic.

## What is still unproven

Before any production-readiness claim:

- real Claude/OpenAI API routing with current model IDs;
- measured real token/cost/latency data;
- provider-native prompt caching/deferred tool behavior;
- live CRM data under applicable privacy authorization;
- production-scale retrieval/index performance;
- authenticated multi-tenant end-to-end integration;
- fault injection against real connectors;
- controlled TSST pilot.

Therefore RC1 means **installable/evaluable candidate**, not production approval.
