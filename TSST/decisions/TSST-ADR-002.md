# TSST-ADR-002 — DEV_AG governance registration and repository merge

Date: 2026-09-28. Decision owner: user. Integration owner: TSST Lead.
Status: APPROVED — governance registration and repository merge only.

## Authority and exact scope

User instruction in this repository conversation, following the final audit of commit `31b45573fd10bd28c8d917534f5ca91f5cc3fc92`:

> Approve DEV_AG as a TSST specialist under TSST Lead, with the implemented scope, 16 UNVALIDATED core skills, 9 on-demand Dynamic Packs, and NOT_READY status. This approval authorizes governance registration and repository merge only; it does not grant PILOT_READY, PRODUCTION_READY, autonomous execution authority, or skill validation.

## Decision and transition

DEV_AG transitions from PROPOSED to APPROVED for governance registration only. Its [contract](../DEV/AGENT.md) retains the implemented scope and subordinate relationship to TSST Lead, the executive/user-facing orchestrator. The [core registry](../DEV/SKILL_REGISTRY.md) retains exactly 16 UNVALIDATED skills and nine on-demand Dynamic Packs. Packs are scaffolding, not skills, additional agents or independent validation states.

The audited implementation and this governance registration may be merged from `feat/dev-ag-v0.2` into `master`. Preserve the initial baseline `881d2d64cee0a1742a82395a08637806133e9889` and implementation commit without rewriting history. A fast-forward merge is sufficient when master is still the baseline.

## Limits and remaining gates

Readiness remains NOT_READY. No PILOT_READY, PRODUCTION_READY, autonomous execution authority, skill validation or production activation is granted. No practical evaluation is run or represented as completed by this decision. Future execution remains bounded by separately authorized scope, existing decision rights and applicable readiness/acceptance gates. Existing specialist authority is retained; engineering lanes remain internal capabilities. Real Memory and historical evaluation evidence are unchanged.

Governance approval does not establish practical engineering capability. Scope-specific evaluation and readiness promotion require their own evidence and authority.
