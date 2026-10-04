# TSST Real Memory Gradual Sync Packet


## Packet Control
- Packet ID: TSST-SYNC-20261004-0218-SECOND-BRAIN-RUNBOOK
- Project key: TSST
- Project name: The Systronic Smart Agents
- User workspace: AHMED_FOUAD
- Date/time: 2026-10-04 02:18 +03:00
- Source chat/topic: العقل التاني وطريقة تشغيله — TSST Context OS portability, runtime routing, recovery and cross-model operating method
- Current project milestone: TSST-001 — Foundation & Agent Operating Model
- Current project gate: TSST-001A — Requirements & Governance Intake
- Context OS lane: v0.6 RC1, C7 controlled pilot
- Packet state: INCOMING / NOT DURABLY APPLIED


## Requested Memory Name
العقل التاني وطريقة تشغيله
English working label: Second Brain & Operating Method


## Confirmed Facts Added / Changed
1. The user explicitly wants the TSST external-context capability retained under the human-facing name “العقل التاني وطريقة تشغيله”.
2. The durable design principle is model-independent external project memory: canonical project files and verified checkpoints remain the source of truth; model/session memory is only an acceleration/recall layer.
3. The shared Context OS core is intended to be reusable across runtimes. Core responsibilities include:
   - current-state recovery;
   - source-authority resolution;
   - project isolation;
   - bounded context retrieval;
   - do_not_repeat continuity;
   - evidence provenance;
   - checkpoint/resume;
   - memory write gating;
   - skill/tool routing;
   - model-cost/risk routing at the logical tier level.
4. Runtime-specific adapters are separate from the core. A platform adapter may map the common logical tiers FAST / EXECUTION / CODE / EXECUTIVE to that platform’s available models/agents without changing canonical project truth.
5. Claude Code runtime routing has been installed and live-tested in TSST:
   - main TSST Lead / EXECUTIVE context remains Opus 5.5;
   - codebase exploration / FAST workers use Haiku;
   - EXECUTION and CODE workers use Sonnet;
   - /tasks is used as runtime evidence of the actual worker model.
6. The Claude runtime test showed the configured workers were discovered and actual model switching occurred without model substitution.
7. The same Second Brain design is intended for new projects. Each project should have an isolated canonical memory set and its own checkpoints; cross-project durable transfer requires explicit controlled handoff.
8. Proposed portable project skeleton discussed with the user:
   - 00_START_HERE/START_HERE.md
   - 01_CURRENT_STATUS/CURRENT_STATUS.md
   - 02_PROJECT_MEMORY/
   - 03_CHECKPOINTS/LATEST_CHECKPOINT.json
   - 04_SOURCE_MAP/PROJECT_SOURCE_MAP.md
   - 05_TIMELINE/PROJECT_TIMELINE.md
   - context_os/
   - runtime_adapters/
9. Runtime usage discussed:
   - ChatGPT: use a project/source-backed workspace and bootstrap instructions that load canonical state/checkpoint first.
   - Claude Code: use CLAUDE/project instructions plus .claude/agents and runtime routing.
   - Codex: use AGENTS.md / compatible skills and a Codex-specific runtime adapter while sharing the same canonical project memory.
   - Gemini: use a project/Gem/Gemini CLI adapter that reads the same canonical state and checkpoint files.
10. Cross-platform portability is an architecture/operating target. Claude runtime switching is verified. ChatGPT/Codex/Gemini adapters were discussed but are not yet implemented or validated as equivalent runtime-switching systems.


## Decisions Made
- User-approved naming: “العقل التاني وطريقة تشغيله”.
- Treat the Second Brain as a reusable TSST operating capability, not as memory owned by one model provider.
- Canonical project files and evidence-backed checkpoints outrank chat/model recollection.
- Runtime model names and provider-specific routing remain adapter/runtime configuration, not durable business/project truth.
- New projects should use isolated project memory rather than inheriting TSST or another project’s durable state automatically.
- Do not claim cross-platform runtime parity until each adapter is implemented and tested.


## Files / Links Created or Changed
Existing operational artifacts relevant to this packet:
- TSST/context_os/ — installed Context OS v0.6 RC1.
- THE_SYSTRONIC_MARKETING_AGENTS/AGENTS.md — Claude runtime routing section added.
- THE_SYSTRONIC_MARKETING_AGENTS/.claude/settings.json — subagent fallback configuration.
- THE_SYSTRONIC_MARKETING_AGENTS/.claude/agents/Explore.md
- THE_SYSTRONIC_MARKETING_AGENTS/.claude/agents/tsst-fast-worker.md
- THE_SYSTRONIC_MARKETING_AGENTS/.claude/agents/tsst-execution-worker.md
- THE_SYSTRONIC_MARKETING_AGENTS/.claude/agents/tsst-code-worker.md
- TSST/context_os/runtime/TSST_CLAUDE_RUNTIME_MODEL_ROUTER_v0.1.md
- TSST/context_os/evaluations/TSST_C7_RUNTIME_MODEL_ROUTER_INSTALLATION.md
This packet itself:
- 07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-0218-SECOND-BRAIN-RUNBOOK — العقل التاني وطريقة تشغيله


## Operating Method to Preserve
For a new or resumed project:
1. Resolve project key and enforce project isolation.
2. Load START_HERE and CURRENT_STATUS.
3. Recover the latest verified checkpoint.
4. Resolve independent state scopes instead of treating every newer file as a universal supersession.
5. Apply source authority before semantic similarity.
6. Retrieve only the minimum context required for the active task.
7. Honor do_not_repeat unless a valid reopening trigger exists.
8. Route the task by logical tier:
   - FAST: extraction/classification/low-risk bulk first pass.
   - EXECUTION: normal analysis/planning/debugging/bounded execution.
   - CODE: repo-heavy implementation, technical audit, tests, migrations, remediation.
   - EXECUTIVE: architecture boundaries, high-impact ambiguity, irreversible decisions, cross-agent conflict and final critical acceptance.
9. Platform adapter maps the logical tier to the actual model/agent available on that runtime.
10. Existing authority rules still control tool actions; a stronger model never creates additional authority.
11. End meaningful work with an evidence-backed checkpoint containing completed work, open items, blockers, do_not_repeat and exact next action.
12. Pass the Memory Write Gate before promoting a lesson or derived summary into durable project memory.


## Proposed Universal Commands
These were proposed as a future convenience layer and are not yet implemented as a universal command system:
- PROJECT_START
- PROJECT_CONTINUE
- PROJECT_STATUS
- CHECKPOINT_NOW
- MEMORY_SYNC


## Pending Items
1. Build and validate a reusable Universal Context OS Starter Kit for new projects.
2. Create explicit ChatGPT, Codex and Gemini runtime adapters using the same canonical memory/checkpoint contract.
3. Define the exact canonical location and schema for project checkpoints across all new projects.
4. Validate “new session → PROJECT_CONTINUE / كمل المشروع” recovery independently on each runtime.
5. Measure real token/cost savings and routing accuracy after several production-like tasks.
6. Decide whether the proposed universal command names become approved TSST commands.
7. Current CRM product work remains separate from this memory topic; do not use this packet to alter CRM milestone state.


## Risks / Blockers
- A provider-specific model router cannot be assumed portable 1:1 to another provider.
- Chat/session memory can be stale or unavailable; it must not replace canonical files.
- If a runtime cannot read the external project sources, automatic recovery degrades and must be stated explicitly.
- Cross-project retrieval can leak context if project isolation is bypassed.
- Large context volume alone must not force use of the strongest/most expensive model.
- Runtime model IDs, prices, secrets and credentials must not be stored as canonical durable truth.
- Cross-platform adapters remain partially unimplemented; portability is a design decision, not yet a fully validated implementation claim.


## Proposed Exact Durable Memory Targets
Pending review/approval before durable apply:
1. 02_PROJECT_MEMORY/PROJECT_DECISIONS.md
   - Add approved human-facing name “العقل التاني وطريقة تشغيله”.
   - Add decision that canonical external memory is provider-independent and runtime adapters are provider-specific.
   - Add decision that canonical project files/checkpoints outrank model/session memory.
2. 02_PROJECT_MEMORY/PROJECT_PROFILE.md
   - Add Context OS / Second Brain as a TSST operating capability, explicitly not a new top-level agent.
3. 02_PROJECT_MEMORY/PROJECT_BACKLOG.md
   - Add Universal Context OS Starter Kit.
   - Add ChatGPT runtime adapter.
   - Add Codex runtime adapter.
   - Add Gemini runtime adapter.
   - Add cross-runtime recovery validation and cost telemetry.
4. 02_PROJECT_MEMORY/PROJECT_MEMORY_MAP.md
   - Add entry mapping “العقل التاني وطريقة تشغيله” to Context OS core, runtime adapters, checkpoints and evidence.
5. 04_SOURCE_MAP/PROJECT_SOURCE_MAP.md
   - Add operational Context OS path and Claude runtime-router/evaluation artifacts.
6. 05_TIMELINE/PROJECT_TIMELINE.md
   - Record 2026-10-04 naming + verified Claude runtime-routing milestone.
7. 01_CURRENT_STATUS/CURRENT_STATUS.md
   - Add only after review: C7 controlled pilot now includes verified Claude runtime model switching; other provider adapters remain pending. Do not alter TSST-001A closure status without separate baseline approval.


## Confidence / Uncertainty
- High confidence: naming request, provider-independent memory principle, installed TSST Context OS, verified Claude runtime routing behavior.
- High confidence: canonical files/checkpoints should remain authoritative over model recollection.
- Medium confidence / implementation pending: exact reusable folder skeleton for every future project until a Starter Kit is formally approved.
- Medium confidence / implementation pending: ChatGPT/Codex/Gemini adapter details and equivalent runtime model switching.
- Open governance point: this packet is an incoming sync capture only. It must not be treated as durable Real Memory until reviewed and explicitly committed.


## Commit Boundary
No durable TSST memory target was changed by this packet. No cross-project memory was updated. No secret, credential, API key or token is included.