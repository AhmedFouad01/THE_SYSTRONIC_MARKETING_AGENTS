# SKILL — CRM Voice-of-Customer Memory
ID: TSST-CTX-SK-021
Status: UNVALIDATED
Priority: P1

## Trigger
Customer feedback, calls, tickets, sales notes or CRM events are analyzed.

## Evidence model
Each observation should preserve:
- customer/account pseudonymous locator where appropriate;
- segment/context;
- source channel;
- date;
- exact issue/outcome category;
- product area;
- severity/frequency;
- evidence locator;
- whether it is observation or interpretation.

## Workflow
1. Keep raw PII in the CRM/domain system.
2. Extract bounded evidence records.
3. Deduplicate repeated copies of the same interaction.
4. Cluster by JTBD/problem/outcome without erasing segment differences.
5. Preserve contradictory feedback.
6. Send compact evidence clusters to LENS/Lead.
7. Promote no general product lesson without validation.

## Critical failure
Turning one loud customer into a universal product requirement.


## Shared v0.2 execution contract

### Required return fields
- `status`: PASS | PARTIAL | BLOCKED | FAIL
- `facts`
- `assumptions`
- `evidence_locators`
- `conflicts`
- `remaining_unknowns`
- `next_action`

### General guardrails
- Respect project/workstream/state_scope boundaries.
- Preserve source provenance.
- Do not promote derived material above canonical sources.
- Do not claim validation/readiness from package creation.
- Do not persist secrets.

### Evaluation requirement
This skill remains `UNVALIDATED` until a practical fixture demonstrates correct triggering, output, boundary behavior and critical-failure avoidance.
