# C2 Real-Case Benchmark — TSST / CRM

Status: **REFERENCE PASS / NOT PRODUCTION VALIDATION**

Naive full-document baseline: **35,263 bytes** across the sampled live source set.

| Case | Top selected source | Selected fragment bytes | Context reduction | Wrong-project selected |
|---|---|---:|---:|---|
| governance_current_state | `TSST_CURRENT_STATUS_2026-09-23` | 244 | 99.3% | NO |
| crm_implementation_truth | `CRM_M2_EVIDENCE_2026-10-03` | 368 | 99.0% | NO |
| crm_workstream_current_state | `CRM_MVP_SPRINT_2026-10-03` | 216 | 99.4% | NO |
| lead_readiness | `TSST_LEAD_AGENT_2026-09-28` | 187 | 99.5% | NO |

## What this proves

- The state-scope filter keeps TSST governance separate from CRM product/workstream state.
- The implementation-truth query prefers the bounded M2 evidence over the older CRM README milestone statement.
- The adversarial MOBIX record is hard-rejected even when given perfect keyword/semantic similarity.
- The sample demonstrates large context reduction because the router selects bounded evidence fragments instead of all sampled documents.

## What this does NOT prove

- It does not validate semantic embeddings.
- It does not benchmark a full TSST corpus.
- It does not establish production latency/cost.
- It does not validate all 22 skills.
- It does not authorize a durable Real Memory change.