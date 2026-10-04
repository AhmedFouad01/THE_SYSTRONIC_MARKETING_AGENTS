# TSST Context OS v0.6 RC1 — Install Map

Status: **READY FOR REVIEW / NOT APPLIED**

This map intentionally separates:
- repository/runtime installation,
- TSST governance edits,
- Real Memory durable changes.

Nothing should be copied blindly over current files.

## A. Repository / Runtime Additions

Recommended new subtree:

```text
TSST/
  context_os/
    README.md
    policies/
      STATE_SCOPE_MODEL.md
      RETRIEVAL_ARCHITECTURE.md
      RANKING_POLICY.md
      CONFLICT_STALENESS_POLICY.md
      MODEL_ROUTER_POLICY.md
      TOOL_ROUTING_POLICY.md
      COST_GUARD_POLICY.md
      MEMORY_GOVERNANCE.md
      CHECKPOINT_POLICY.md
      PRODUCT_STRENGTH_POLICY.md
      VOC_AGENT_ROUTING.md
    contracts/
      CONTEXT_RECORD_SCHEMA.json
      RETRIEVAL_CONTRACT.yaml
      ROUTING_DECISION_CONTRACT.yaml
      TOOL_REGISTRY_SCHEMA.json
      CHECKPOINT_SCHEMA.json
      RESUME_PACK_CONTRACT.yaml
      VOC_OBSERVATION_SCHEMA.json
    skills/
      TSST-CTX-SK-001 ... TSST-CTX-SK-022
    runtime/
      MODEL_RUNTIME_CONFIG.example.yaml
    evaluations/
      C2_REAL_CASE_BENCHMARK.md
      C3_REFERENCE_TEST_RESULT.json
      C4_REFERENCE_TEST_RESULT.json
      C5_REFERENCE_TEST_RESULT.json
      C6_EVALUATION_REPORT.md
```

Reference prototypes/tests may live under:

```text
TSST/context_os/reference/
```

They are evaluation assets, not production runtime dependencies.

## B. Existing TSST Files That Would Need Controlled Edits

Do not overwrite. Merge exact reviewed sections into:

1. `TSST/LEAD/AGENT.md`
   - add Context OS preflight;
   - require Current State Loader / Context Router for substantial work;
   - add model/tool routing and checkpoint requirements.

2. `TSST/SKILL_REGISTRY.md`
   - register TSST-CTX-SK-001..022 as `UNVALIDATED` initially.

3. `TSST/TEAM_CONSTITUTION.md`
   - add context/memory invariants;
   - preserve existing agent authority/readiness model.

4. `TSST/TSST_DECISION_RIGHTS.md`
   - map tool action classes to existing A/B/C rights;
   - do not broaden user delegation.

5. `TSST/READINESS_REPORT.md`
   - record Context OS as a separate readiness lane;
   - creation/testing must not upgrade specialist readiness.

6. `TSST/handoffs/HANDOFF_TEMPLATE.md`
   - add Context Pack / evidence locator / checkpoint fields.

## C. Real Memory Changes

Only after explicit review/approval:

- record accepted Context OS architecture decision;
- record source-authority/state-scope model;
- record current Context OS gate/status;
- record install location/source map;
- do **not** embed all 22 skill bodies into Real Memory;
- do **not** store model IDs/prices as durable facts.

## D. Runtime Configuration

Keep outside durable memory:
- current Claude/OpenAI model IDs;
- prices;
- API credentials;
- secret keys;
- environment endpoints;
- provider-specific cache settings.

## E. Optional Future Components

Do not install into the critical path yet:
- Zep;
- Graphiti;
- Letta;
- external vector DB beyond benchmark need.

They remain candidates after real corpus evaluation.

## F. Rollback

Installation should be additive first.

Rollback:
- disable Context OS preflight flag;
- restore prior Lead routing behavior;
- leave canonical Real Memory untouched except approved audit entries;
- remove derived index/runtime state safely;
- never roll back by deleting canonical source history.
