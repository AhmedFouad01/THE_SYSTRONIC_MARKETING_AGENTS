# REPORT · CODEX-LEAD-ROLE (DEV_AG, direct dispatch, no commit)
1. runtimes.yaml: codex `roles: []` -> `roles: [lead]` + comment; LF kept; lead_order [claude] unchanged; other session's `status: available`/`until:` kept.
2. test_runtime_agents.py: "non-lead cannot limit another runtime" actor codex -> chatgpt (still expects exit 2). test_bus.py: "other runtime cannot set limit" actor codex -> chatgpt (still expects refusal). CRLF kept, one token each.
3. LIMIT_FALLBACK.md: one Backup-Lead line under the owner rule (Codex = Lead, DEEP sparingly; Antigravity = ROLE B file tool; Gemini app = research/image/video).
Verify: test_bus, test_friction_check, test_gdoc_expected_absent, test_neutrality_exempt, test_runtime_agents, test_skill_index_and_guard all pass; gen_runtime_agents --check OK; `bus.py ls --me codex` -> roles=['lead'].
Not mine: validate_spine 26/28 (CRM LENS doc names a provider model; CRM-PLAN-BUILD result hash edited after done) - pre-existing.
Skills used: TSST-DEV-SK-011 (kept assertion strictness), -015 (fresh runs), -016 (this report). skill_friction: none.
