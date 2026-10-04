# TSST Checkpoint Policy v0.5

Status: PROPOSED / UNVALIDATED

## Create a checkpoint when

- a meaningful execution block closes;
- context is about to compact;
- work changes model/provider/session;
- a milestone/gate is verified;
- an incident/debugging branch reaches a stable finding;
- user asks to save/continue later.

## Do not checkpoint as complete when

- tests are not run;
- evidence is missing;
- the implementation is only planned;
- approval is still reserved;
- release authority is absent.

## Evidence rule

A completion claim needs:
Claim + Evidence locator + Verification method + Result + Remaining unverified items.

## Supersession

New checkpoint may supersede earlier checkpoint only within compatible project/workstream/state_scope.

Cross-scope checkpoint is parallel state, not supersession.
