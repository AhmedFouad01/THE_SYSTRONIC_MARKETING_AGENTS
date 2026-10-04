# TSST Product Strength Evidence Policy v0.4

Status: PROPOSED / UNVALIDATED

## Candidate strength record

```yaml
strength:
  strength_id: ...
  label: ...
  product_area: ...
  segment_scope: ...
  jtbd_scope: ...
  problem_solved: ...
  value_created: ...
  relevant_alternative: ...
  evidence:
    observations: [...]
    measured_outcomes: [...]
    tests: [...]
    wins: [...]
  dimensions:
    frequency: 0..5
    breadth: 0..5
    outcome: 0..5
    directness: 0..5
    comparative: 0..5
    consistency: 0..5
    proofability: 0..5
  contradiction_rate: 0..1
  confidence: HYPOTHESIS|STRONG_SIGNAL|VERIFIED_STRENGTH|CLAIM_READY
  limitations: [...]
  proof_gaps: [...]
```

## Minimum logic

No candidate may exceed `HYPOTHESIS` if:
- it comes from only one distinct account; or
- all evidence is inferred; or
- source locators are missing.

`STRONG_SIGNAL` requires:
- repeated evidence;
- at least 2 distinct accounts;
- direct/secondary evidence mix;
- bounded segment/JTBD.

`VERIFIED_STRENGTH` requires:
- at least 3 independent accounts or equivalent strong independent evidence;
- meaningful observed/measured outcome;
- low/moderate contradiction;
- current product relevance;
- clear problem/value relationship.

`CLAIM_READY` additionally requires:
- proofability;
- no material unqualified contradiction;
- claim wording bounded to what evidence supports;
- applicable legal/platform review where needed.

These thresholds are initial evaluation defaults, not immutable business law.
