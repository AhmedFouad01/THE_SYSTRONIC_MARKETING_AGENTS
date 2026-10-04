# TSST Context OS v0.4 — CRM Voice of Customer & Product Strength Memory

Status: **PROPOSED / UNVALIDATED**
Gate: C4 CRM / Voice-of-Customer Memory

## 1. Goal

Convert customer and sales evidence into structured, auditable product intelligence without:
- copying unnecessary PII into TSST memory;
- confusing one customer's opinion with market truth;
- losing segment/JTBD context;
- turning model-generated clusters into canonical facts;
- contaminating CRM operational truth with marketing interpretations.

---

## 2. Source Boundary

The CRM remains the operational source of customer/contact/deal/journey truth.

TSST Context OS stores or retrieves:
- pseudonymous evidence locators;
- normalized observation categories;
- segment/JTBD context;
- issue/outcome metadata;
- evidence confidence;
- derived clusters;
- validated product lessons.

Raw customer identity, protected identifiers, credentials and full private conversations stay in the CRM/domain system unless an explicitly authorized workflow requires them.

---

## 3. Evidence Classes

### `VOC_OBSERVATION`
One bounded customer/sales/support observation.

### `VOC_CLUSTER`
A derived grouping of related observations.
Not canonical customer truth.

### `PRODUCT_SIGNAL`
A repeated pattern suggesting product value, weakness or opportunity.

### `PRODUCT_STRENGTH`
A validated evidence-backed strength.
Must pass explicit proof criteria.

### `PRODUCT_GAP`
A validated recurring failure/need/problem.

### `POSITIONING_CLAIM`
A customer-facing claim candidate.
Requires stronger evidence than an internal product signal.

---

## 4. Observation Contract

```yaml
voc_observation:
  observation_id: VOC-...
  tenant_id: <opaque>
  customer_locator: <pseudonymous CRM locator>
  source_locator: <CRM event/note/call/ticket/deal reference>
  source_channel: sales_call|support|feedback|deal_note|survey|usage|other
  observed_at: ...
  segment:
    business_profile: ...
    role: ...
    maturity: ...
  jtbd:
    trigger: ...
    desired_outcome: ...
  product_area: ...
  observation_type: praise|pain|objection|request|outcome|churn_reason|win_reason
  normalized_theme: ...
  statement_summary: ...
  severity: 1..5|null
  outcome_strength: 1..5|null
  evidence_quality: DIRECT|SECONDARY|INFERRED
  sentiment: positive|negative|mixed|neutral
  tags: [...]
  privacy:
    contains_pii: false
    durable_copy_allowed: true
```

No raw phone/email/name is required for TSST reasoning.

---

## 5. Cluster Contract

Clusters are derived.

```yaml
voc_cluster:
  cluster_id: ...
  theme: ...
  segment_scope: ...
  observation_ids: [...]
  observation_count: ...
  distinct_accounts: ...
  time_span: ...
  contradictory_observation_ids: [...]
  evidence_mix: ...
  confidence: ...
  source_refs: [...]
```

A cluster with high count but one account is not equivalent to broad validation.

---

## 6. Product Strength Model

A feature becomes a product strength only if it demonstrates customer value.

A candidate strength must answer:

1. **What customer problem does it solve?**
2. **For which segment/JTBD?**
3. **What outcome changed?**
4. **Compared with what alternative?**
5. **How repeatable is the evidence?**
6. **How independent are the evidence sources?**
7. **Can we prove the claim externally?**

### Evidence dimensions

- `frequency`: repeated independent evidence
- `breadth`: distinct accounts/segments
- `outcome`: measured or observed result
- `directness`: direct vs inferred evidence
- `comparative`: evidence against an alternative
- `recency`: relevant current product version
- `consistency`: contradiction rate
- `proofability`: can a claim be substantiated

---

## 7. Confidence States

### `HYPOTHESIS`
Plausible but not sufficiently proven.

### `STRONG_SIGNAL`
Repeated credible evidence, still not enough for a strong market claim.

### `VERIFIED_STRENGTH`
Multiple independent evidence sources + demonstrated outcome + bounded segment/context.

### `CLAIM_READY`
Verified strength plus external-claim proof requirements satisfied.

`CLAIM_READY` is stricter than internal product confidence.

---

## 8. Weakness / Gap Model

A recurring problem can become a validated product gap when:
- observations are independent;
- affected segment is identifiable;
- severity/business impact is material;
- the issue is not explained by onboarding/configuration/user error alone;
- current product version still exhibits it;
- evidence is traceable.

Do not automatically route every request into roadmap scope.

Classify cause:
- product capability;
- UX/usability;
- configuration;
- training/onboarding;
- integration;
- performance/reliability;
- messaging/expectation mismatch;
- pricing/commercial;
- unknown.

---

## 9. Feedback-to-Agent Routing

### LENS_AG
- JTBD;
- segmentation;
- positioning;
- evidence validation;
- research gaps.

### DEV_AG
- reproducible product defects;
- architecture/technical gaps;
- integration/performance/security issues.

### CREATIVE_AG
- UI/UX friction;
- terminology/navigation issues;
- visual comprehension;
- interaction feedback.

### SPARK_AG
- acquisition message/offer mismatch;
- attribution/measurement gaps;
- channel/creative performance interpretation.

### TSST Lead
- cross-domain prioritization;
- product-vs-marketing diagnosis;
- strength/gap acceptance;
- strategic synthesis.

Routing does not transfer domain ownership.

---

## 10. Product vs Marketing Diagnosis

Before changing product, classify whether the evidence indicates:

- product problem;
- usability problem;
- expectation/positioning problem;
- lead-quality problem;
- sales-process problem;
- implementation/configuration problem;
- measurement problem;
- unknown.

This prevents product development from becoming the default fix for every complaint.

---

## 11. Privacy

CRM already separates protected identifiers and tenant data.

C4 must preserve:
- tenant isolation;
- contact authority;
- sensitive-read controls;
- protected identifier boundaries;
- no plaintext secret/token storage;
- no cross-client identity graph.

TSST durable memory stores abstractions and locators, not unnecessary raw PII.

---

## 12. C4 Exit Gate

C4 cannot close until practical tests prove:
- one loud customer is not promoted to a universal strength/gap;
- duplicate notes from the same account do not inflate breadth;
- contradictory feedback is preserved;
- PII is excluded from derived durable evidence;
- product strengths remain segment/JTBD-specific;
- marketing claims require stronger proof than internal product signals;
- agent routing correctly distinguishes product, UX, messaging and measurement issues.
