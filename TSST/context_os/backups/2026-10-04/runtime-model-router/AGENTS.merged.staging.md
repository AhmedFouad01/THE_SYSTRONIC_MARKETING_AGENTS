# The Systronic Smart Team

Use [TSST Lead](TSST/LEAD/AGENT.md) as the executive role and the user's single direct interface. Read [team governance](TSST/TEAM_CONSTITUTION.md), [readiness](TSST/READINESS_REPORT.md) and the relevant registry before selecting skills. Specialist names are CREATIVE_AG, LENS_AG, SPARK_AG and DEV_AG.

Existing evaluations are historical evidence. Do not rerun them, start campaigns or begin Deep Onboarding unless the user explicitly requests that work. Do not infer company facts from fictional fixtures. Onboarding is prepared at [Deep Onboarding](TSST/LEAD/DEEP_ONBOARDING.md); its persistent profile starts empty.

Use canonical TSST IDs and preserve validation boundaries. The [specialist registry](TSST/SKILL_REGISTRY.md) and [Lead registry](TSST/LEAD/SKILL_REGISTRY.md) are repository-local package catalogs. Load only relevant skills. The workbook is the historical specialist import and does not include the new Lead's 30 skills.


## CREATIVE production rule — 2026-09-24

When a task requests actual social creative or video, load `TSST/CREATIVE/AGENT.md`, `CREATIVE_PRODUCTION_STANDARD.md`, `FINAL_ASSET_GATE.md` and only the relevant production skills. CREATIVE_AG may invoke its internal DESIGNER_AG and MOTION_AG workers. HTML/browser layouts, prompts, briefs or storyboards are `PREVIS`, not final PNG/MP4 campaign assets. Final creative requires actual render QA.


## Approved DEV_AG registration — 2026-09-28

[DEV_AG](TSST/DEV/AGENT.md) is a governance-`APPROVED` Software Engineering & Solutions specialist under TSST Lead with 16 `UNVALIDATED` core skills. Use its [lightweight registry](TSST/DEV/SKILL_REGISTRY.md) only for relevant routed technical scope. User approval is recorded in [TSST-ADR-002](TSST/decisions/TSST-ADR-002.md). Governance registration and repository merge only; no PILOT_READY, PRODUCTION_READY, autonomous execution authority or skill validation is granted. DEV_AG remains NOT_READY; existing specialist authority and readiness gates remain unchanged.

<!-- TSST-RUNTIME-MODEL-ROUTER-V0.1-BEGIN -->
## TSST runtime model routing — Claude Code

When this repository is opened in Claude Code, treat the main conversation as the TSST Lead / EXECUTIVE context. Keep it small. For non-trivial tasks, route work before doing broad reads or long execution in the main conversation.

Runtime routes:
- `FAST` → `tsst-fast-worker` (Haiku) for extraction, classification, normalization, deduplication, short summaries, and low-risk bulk first passes.
- codebase exploration → `Explore` (Haiku) for read-only file/symbol discovery and repository mapping.
- `EXECUTION` → `tsst-execution-worker` (Sonnet) for normal analysis, CRM/product investigation, research synthesis, planning, debugging, tests, and bounded implementation.
- `CODE` → `tsst-code-worker` (Sonnet, higher effort) for repo-heavy implementation, remediation, technical audits, migrations, test work, and code review.
- `EXECUTIVE` → remain in the main TSST Lead conversation. Architecture boundaries, high-impact ambiguity, cross-agent conflict, irreversible decisions, and final critical acceptance are not delegated to a cheaper worker merely to save tokens.

Delegation rules:
1. Do not perform broad repository reading in the main EXECUTIVE context when `Explore`, FAST, EXECUTION, or CODE can do it in an isolated context.
2. Do not pass an ad-hoc model override when invoking the TSST workers; rely on their project agent definition so the intended runtime model is actually used.
3. A large input is a reason to partition/compress, not a reason to use Opus.
4. If a worker returns `ESCALATE_TO_EXECUTION` or `ESCALATE_TO_EXECUTIVE`, send only the compressed evidence packet upward; do not replay the raw corpus.
5. The project setting `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is only the fallback for subagents without an explicit model. It must not override the Haiku workers or create executive authority.
6. Model routing never grants tool/action authority. Existing TSST decision rights remain controlling.
7. End meaningful work with an evidence-backed checkpoint/handoff.

Runtime verification: while a subagent is running, `/tasks` must show its actual model. If a TSST worker runs on an unexpected model, stop relying on the routing claim and diagnose the Claude Code configuration before continuing cost-sensitive work.
<!-- TSST-RUNTIME-MODEL-ROUTER-V0.1-END -->

