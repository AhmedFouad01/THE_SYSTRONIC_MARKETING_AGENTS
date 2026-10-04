# TSST Context OS v0.1 — Evaluation Plan

Status: PROPOSED

## Evaluation Philosophy

Evaluate the system, not only the model.

Compare against a naive baseline:
- load broad project context;
- no source-authority resolver;
- no bounded Context Pack;
- no write gate;
- no model routing.

## E1 — Current-State Recovery

Fixture:
Old status file conflicts with newer implementation evidence.

Pass:
- identifies latest verified state;
- does not restart completed work;
- reports unresolved governance mismatch.

## E2 — Minimal Context

Fixture:
Project contains 100+ irrelevant files.

Pass:
- selects only relevant fragments;
- context is substantially smaller than baseline;
- answer quality remains acceptable.

## E3 — Cross-Project Isolation

Fixture:
Similar facts exist in TSST, MOBIX and another client project.

Pass:
- no unapproved durable cross-import;
- correct project source chosen.

Critical failure:
Any private fact from wrong project used as current truth.

## E4 — Source Conflict

Pass:
- conflict identified;
- authority/date compared;
- no silent merge.

## E5 — Skill Progressive Loading

Pass:
- only metadata inspected before selection;
- only required SKILL.md files loaded;
- references opened only when needed.

## E6 — Long-Session Resume

Fixture:
Fresh model session receives only checkpoint + source map.

Pass:
- resumes correct next task;
- does not redo completed gates.

## E7 — Memory Write Gate

Fixture:
Customer says one positive comment.

Pass:
- stores feedback evidence;
- does not promote it to universal product strength.

## E8 — Product Strength Evidence

Pass:
Every proposed strength includes:
- evidence;
- segment;
- context/JTBD;
- alternative;
- confidence;
- proof locator.

## E9 — Model Router

Run matched tasks through:
- fast;
- execution;
- executive escalation path.

Measure:
- quality;
- cost;
- latency;
- escalation rate;
- unnecessary executive use.

## E10 — CRM Feedback Scale

Fixture:
Large feedback corpus with duplicates and conflicting statements.

Pass:
- extraction done outside executive context;
- clusters preserve source references;
- executive synthesis receives compact evidence;
- no PII copied into TSST durable memory.

## Metrics

- Context reduction ratio
- Retrieval precision@k
- Wrong-project retrieval rate
- Stale-source selection rate
- Unsupported-memory-write rate
- Resume accuracy
- Escalation precision
- Executive-model utilization rate
- Cost per accepted task
- Rework rate
- Evidence traceability rate

## v0.1 Production Gate

No production claim until:
- all critical isolation/write tests pass;
- no critical source-authority failure;
- resume accuracy is demonstrated;
- cost benchmark beats naive full-context approach;
- human review accepts traceability and recovery behavior.
