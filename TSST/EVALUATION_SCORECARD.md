# Evaluation Scorecard

## Scoring model

Each practical evaluation is scored out of 100. TSST Lead accepts a skill only when the total is at least 85, every category reaches its minimum, and no critical failure occurs.

| Category | Weight | Minimum | What the reviewer checks |
| --- | ---: | ---: | --- |
| Objective and scope fit | 10 | 8 | The artifact answers the assigned decision and stays within role boundaries. |
| Evidence and source fidelity | 20 | 16 | Claims are traceable, source quality and freshness are assessed, and official guidance wins platform conflicts. |
| Method application | 20 | 16 | The skill's reusable method is applied correctly and transparently. |
| Output contract | 15 | 12 | All required sections, definitions, files, and decision fields are present. |
| Guardrails and risk control | 15 | 12 | The artifact respects the skill and team guardrails and exposes material uncertainty. |
| Quality assurance | 10 | 8 | Required checks are executed and defects are documented or corrected. |
| Repeatability and handoff clarity | 10 | 8 | Another agent can reproduce, review, and continue the work from the artifact. |

## Critical failures

Any one of these produces an automatic fail regardless of score:

- fabricated evidence, source, data, result, customer insight, or platform behavior;
- an important unsupported claim presented as fact;
- current platform guidance contradicted without a documented official source;
- failure to distinguish fact, assumption, hypothesis, and recommendation;
- missing required CREATIVE_AG visual QA, LENS_AG evidence/narrative QA, or SPARK_AG measurement/KPI logic;
- privacy, consent, policy, copyright, or brand-rights risk ignored;
- copied brand identity or repository assets presented as original work;
- evaluation inputs or expected answers leaked into the artifact in a way that invalidates the test;
- campaign launch, spend, publication, or external mutation during bootstrap.

## Evaluation record

Each completed evaluation must record:

```text
Evaluation ID:
Skill ID and skill version:
Agent:
Date:
Evaluator:
Input fixture version:
Artifact paths:
Category scores and evidence:
Critical failures: none / list
Total score:
Result: PASS / FAIL
Required remediation:
Retest ID:
Source freshness checked:
```

## Readiness calculation

- Phase-1 readiness is blocked until all 18 Phase-1 evaluations pass.
- One failed or unrun Phase-1 evaluation keeps the affected agent `NOT_READY`.
- `PILOT_READY` requires all six Phase-1 evaluations for that agent to pass and TSST Lead to approve a bounded pilot scope.
- `PRODUCTION_READY` additionally requires all Critical skills needed for that production scope, cross-agent integration tests, current policy checks, and TSST Lead acceptance.
- Team readiness cannot exceed the lowest readiness of an agent required for the intended work.
