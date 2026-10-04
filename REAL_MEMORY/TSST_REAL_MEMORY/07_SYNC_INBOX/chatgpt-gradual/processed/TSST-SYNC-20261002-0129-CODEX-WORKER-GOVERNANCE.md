# TSST Real Memory Gradual Sync Packet

- Packet ID: `TSST-SYNC-20261002-0129-CODEX-WORKER-GOVERNANCE`
- Project Key: `TSST`
- Date/Time: `2026-10-02 01:29 Africa/Cairo`
- Source Chat/Topic: CRM M1 execution visibility and Codex temporary worker/sub-agent naming
- Current TSST Milestone: `TSST-001 — Foundation & Agent Operating Model`
- Current TSST Gate: `TSST-001A — Requirements & Governance Intake`
- Packet Type: gradual sync / incoming only
- Previous relevant packet: `TSST-SYNC-20261002-0040-CRM-M0-CLOSURE`

## Confirmed facts added or changed

1. The user observed multiple Codex task names during CRM work, including temporary review/execution labels such as `M0 concurrency timeout`, `M0 reaudit review`, `Fresh m0 reaudit`, `M0 durability audit`, `M0 security audit`, and `Dev review`.
2. These names are to be treated as **temporary Codex execution workers/sub-agents**, not as persistent TSST agents, not as approved additions to the TSST roster, and not as durable architecture roles.
3. No user-approved change has been made to the persistent TSST agent roster as a result of these Codex worker names.
4. The currently visible active Codex job is `M1 astra medium`; at capture time it is still running and is shown working on `designing protected key storage`.
5. M1 completion, acceptance, commit state, and audit status are **not yet confirmed** by this packet.

## Decisions made

- No durable TSST roster change was approved.
- No durable agent addition/rename/removal was approved.

## Proposed operating rule / Needs decision

The following rule was proposed in chat to reduce execution-worker sprawl and naming confusion, but should be treated as **proposed until explicitly accepted into TSST governance**:

- Do not create, spawn, rename, or define new persistent project agents during ordinary Codex execution.
- Do not modify the TSST agent roster from temporary implementation/review sessions.
- Prefer the primary Codex session for implementation.
- Use temporary sub-agents only when genuine independent review is explicitly required.
- Prefer at most one temporary reviewer unless a task explicitly requires more.
- Temporary reviewers/workers must never be written into TSST durable memory as permanent agents or team roles.

## Files / links created or changed

- No project file was modified solely for this clarification.
- This packet is the only intended write from this sync action.

## Pending items

1. Wait for the active `M1 astra medium` execution to finish and provide its final implementation report.
2. Review M1 against the approved CRM M1 gate before any closure.
3. Decide whether to adopt the proposed Codex temporary-worker governance rule into TSST operating governance.
4. If approved later, update only the appropriate TSST governance/decision targets through the normal review/apply process.

## Risks / blockers

- Repeated temporary worker names can be mistaken for approved TSST agents, causing roster drift or memory contamination if not explicitly classified.
- The active M1 run is incomplete; no success/failure claim should be captured as durable fact yet.
- TSST Operating Baseline v0.1 remains outside this packet and must not be implied as approved by this sync.

## Proposed exact memory targets

If the proposed worker-governance rule is explicitly approved later:

- `02_PROJECT_MEMORY/PROJECT_DECISIONS.md`
  - Add a decision clarifying persistent TSST agents vs temporary execution workers.
- `02_PROJECT_MEMORY/PROJECT_PROFILE.md` or the future approved operating baseline/agent contract section
  - Clarify that temporary Codex workers do not alter the official agent roster.
- `02_PROJECT_MEMORY/PROJECT_BACKLOG.md`
  - Mark temporary-worker governance as resolved once accepted.

Do **not** update the CRM product project's engineering truth with TSST roster semantics unless a controlled cross-project handoff is explicitly requested.

## Confidence / uncertainty notes

- High confidence: temporary Codex task labels are not user-approved TSST roster changes.
- High confidence: the M1 Codex job is active at capture time based on the user-provided execution screenshot.
- Medium confidence: the proposed one-reviewer execution policy is suitable; it remains a proposal until explicit approval.
- No secrets, passwords, API keys, tokens, or credentials are included.

## Durable apply status

`NOT APPLIED` — incoming gradual-sync packet only. Review and explicit approval are required before any durable TSST memory update.
