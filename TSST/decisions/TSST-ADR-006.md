# TSST-ADR-006 — Shared execution preflight and reduced workflow duplication

Date: 2026-10-12 (Africa/Cairo). Owner authority: Ahmed's explicit request to implement REVIEW-001 repairs and review/simplify recent TSST work across runtimes. Status: implementation authorized within that scope; validation evidence is in REPAIR-001-RESULT, no production activation.
Extends ADR-003/004/005, without adding or removing roster members.

## Problem and evidence

REVIEW-001 found incomplete/fail-open dispatch checks, Windows path validation gaps, unpropagated working-tree rules, stale role/tier text, eight friction records ignored silently, and structural checks presented too broadly. Recent 2026-10-06..12 repo/chat evidence also shows repeated task restatement and rereads. The historical ~17M cache-read figure is one dated audit example, not a current usage measurement. Full Claude/other runtime session history was unavailable.

## Decision implemented under the repair mandate

1. `context/workflow.md` is the shared execution method. One existing task packet provides the Skill Plan, source/track, authority reference and scopes; adapters supply only access/model/contract mechanics. A direct instruction for identified fixes is reused inside that scope; new commitments and reserved actions still require their own authority.
2. `context/preflight.py` validates that packet and actual canonical source/branch before scoped mutation, and records input hashes. It neither performs the mutation nor authenticates the owner nor proves method comprehension. Claude dispatch and explicit Codex/manual invocation share plan validation. Unsupported native selection is declared, not invented; an explicitly opened roster contract can carry the same bounded specialist method, with native loading unverified. No ungoverned generic worker and no spawned Lead.
3. Validate path spelling consistently before scope comparisons. Validation errors stop the affected dispatch/mutation. Existing historical bus evidence stays readable.
4. Friction records use the strict schema; preserve migrated original text and track recognizable gaps. Duplicate rows from one task do not count as independent repeats. No automatic lesson promotion.
5. DELIVERY.json stays authoritative. Generated hash-bound TSST_JOB_SYNC mirrors provide machine-readable agreement in existing pointers; normal sync_jobs refreshes them. job_check defaults to strict structured agreement; legacy --structure-only explicitly cannot establish R20. Narrative quality, factual truth, visual review and publication authority remain separate.
6. Use the bus for actual coordination/lease/dependencies, not a dummy identity gate for a direct Lead session. Daily-board startup remains conditional on the owner's explicit command. Resume rather than restart; checkpoint once and link detailed evidence.

## Limits and acceptance

No blanket platform tool interception is claimed. Native/custom-agent load or an actual Claude session is not validated merely by generated-file checks or fixtures. Cross-runtime end-to-end acceptance remains explicitly unverified until exercised in that runtime. The implementation may be committed only on its TSST track; master merge, publication/spend and readiness promotion are not authorized by this record.
Regression evidence, source-preservation checks, any excluded checks and remaining deployment/propagation limits belong in `handoffs/decisions-review/REPAIR-001-RESULT.md`. No measured savings percentage is claimed.

Sources: owner messages in this chat; `handoffs/decisions-review/REVIEW-001.md`; `context/workflow.md`; existing R1–R42 and TSST_DECISION_RIGHTS.md.
