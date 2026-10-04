# TSST Context OS v0.5 — Long-Run Recovery & Compaction

Status: **PROPOSED / UNVALIDATED**
Gate: C5 Long-Run Recovery

## 1. Objective

Allow a fresh model/session/provider to continue a large project from verified state without replaying the conversation or rereading the full corpus.

Continuity is based on:
- canonical source locators;
- verified checkpoint;
- changed artifact list;
- open blockers;
- next executable action;
- do-not-repeat list.

Opaque model compaction is useful but is not the durable project state.

---

## 2. Checkpoint Classes

### `SESSION`
Short-lived recovery point for a work block.

### `WORKSTREAM`
Stable handoff point for a bounded stream such as CRM UI.

### `MILESTONE`
Evidence-backed closure/opening of a product milestone.

### `INCIDENT`
Recovery point during debugging/incident handling.

### `RELEASE`
Release/deploy checkpoint. Separate from implementation completion.

A checkpoint cannot silently change a different state scope.

---

## 3. Checkpoint Schema

Every checkpoint records:

- checkpoint ID/version;
- project/workstream;
- state scope;
- parent checkpoint;
- created at;
- authority;
- last verified state;
- completed items;
- changed artifacts;
- evidence locators;
- verification results;
- open items;
- blockers;
- next action;
- do-not-repeat;
- pending user decisions;
- assumptions/uncertainty;
- source versions/hashes where practical;
- safe resume instructions.

Checkpoint does **not** store chain-of-thought.

---

## 4. Resume Protocol

```text
Fresh session
   ↓
Governance kernel
   ↓
Latest candidate checkpoint
   ↓
Validate project/workstream/scope
   ↓
Check checkpoint supersession
   ↓
Verify critical artifact/source existence/version
   ↓
Look for newer authoritative evidence
   ↓
Build Current Case Snapshot
   ↓
Resume exact next executable task
```

If newer verified evidence exists, the checkpoint is a starting locator, not unquestionable truth.

---

## 5. Do-Not-Repeat Contract

Checkpoint must explicitly preserve completed work that should not be casually repeated.

Examples:
- closed migrations;
- accepted ADR;
- passed independent audit;
- completed tests;
- approved UX direction.

Reopening requires:
- new failure evidence;
- changed requirement;
- superseding decision;
- affected dependency/version change.

---

## 6. Compaction Boundary

Before compaction:
1. finalize current verified results;
2. create checkpoint;
3. preserve evidence locators;
4. preserve current unresolved conflict;
5. record next action;
6. then compact/drop intermediate tool chatter.

Never compact away the only copy of:
- user approval;
- accepted decision;
- failure evidence;
- artifact locator;
- unresolved blocker.

---

## 7. Provider Switch

A provider switch (Claude ↔ Codex or model tier change) must transfer only a provider-neutral Resume Pack:

```yaml
resume_pack:
  checkpoint: ...
  objective: ...
  current_case: ...
  sources: [...]
  acceptance_criteria: [...]
  next_action: ...
  tool_authority: ...
  model_router_state: ...
```

No provider-specific hidden conversation state is required.

---

## 8. Checkpoint Validity

A checkpoint is:
- `CURRENT`
- `STALE`
- `SUPERSEDED`
- `INVALID`

STALE:
newer source/artifact exists but relationship is not fully reconciled.

SUPERSEDED:
a later accepted checkpoint explicitly replaces it.

INVALID:
critical referenced evidence/artifact is missing or does not match the recorded version and the mismatch changes the claimed state.

---

## 9. Recovery Conflict Rules

### Newer checkpoint vs older canonical decision
The newer checkpoint cannot override a durable decision unless it includes an accepted superseding decision.

### Newer implementation vs old workstream checkpoint
Implementation evidence can make checkpoint stale for implementation truth.

### Governance open vs product milestone complete
Both may remain true due to separate state scopes.

---

## 10. C5 Exit Gate

Must prove:
- fresh session resumes correct next task;
- closed work is not repeated;
- stale checkpoint is detected;
- missing critical evidence invalidates completion claim;
- provider switch works from Resume Pack alone;
- no chain-of-thought is required;
- separate state scopes remain separate after recovery.
