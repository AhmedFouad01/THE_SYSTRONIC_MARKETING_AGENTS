# The Systronic Smart Team

## Boot (all runtimes) — 2026-10-04

Start every task with [TSST/context/boot.md](TSST/context/boot.md) (provider-neutral). **Rule: every task is done by the routed TSST team with its skills — never ad hoc by the model** (`TSST/core/rules.md` Must 9). Every runtime routes tasks by the **Universal task routing** section below. Runtime mechanics: [Claude](TSST/context/adapters/claude.md) · [Codex](TSST/context/adapters/codex.md) · [ChatGPT](TSST/context/adapters/chatgpt.md) (manual bridge) · Gemini/Antigravity retired as a runtime (ADR-004); [Gemini Desktop](TSST/context/adapters/gemini-desktop.md) = manual external tool via Ahmed (TSD-018). Portfolio: [TSST/core/portfolio.yaml](TSST/core/portfolio.yaml). Pointer first, context second: load only the active brand/project and the matched skills. Sections below remain valid; where they conflict on load order, boot.md wins.

Use [TSST Lead](TSST/LEAD/AGENT.md) as the executive role and the user's single direct interface. Consult the relevant sections of [team governance](TSST/TEAM_CONSTITUTION.md), [readiness](TSST/READINESS_REPORT.md) and the team skill map in [TSST/teams/](TSST/teams/README.md) before selecting skills; do not load whole registries. Specialist names are CREATIVE_AG, MOTION_AG, LENS_AG, SPARK_AG and DEV_AG.

Existing evaluations are historical evidence. Do not rerun them, start campaigns or begin Deep Onboarding unless the user explicitly requests that work. Do not infer company facts from fictional fixtures. Onboarding history is at [Deep Onboarding](TSST/LEAD/DEEP_ONBOARDING.md); the current frozen profile is `TSST/TSST_OPERATING_PROFILE.md`. Do not reopen discovery automatically.

Use canonical TSST IDs and preserve validation boundaries. The [specialist registry](TSST/SKILL_REGISTRY.md) and [Lead registry](TSST/LEAD/SKILL_REGISTRY.md) are repository-local package catalogs. Load only relevant skills. The workbook is the historical specialist import and does not include the new Lead's 30 skills.


## CREATIVE production rule — 2026-09-24

When a task requests actual social creative, load `TSST/CREATIVE/AGENT.md`, `CREATIVE_PRODUCTION_STANDARD.md`, `FINAL_ASSET_GATE.md` and only the relevant production skills. CREATIVE_AG may invoke its internal DESIGNER_AG worker. Video, motion, reels, animation, voice-over and shot lists belong to the independent Motion AG team (`TSST/MOTION/AGENT.md`, [TSST-ADR-005](TSST/decisions/TSST-ADR-005.md)); CREATIVE_AG does the final brand check on its video. HTML/browser layouts, prompts, briefs or storyboards are `PREVIS`, not final PNG/MP4 campaign assets. Final creative requires actual render QA.


## Approved DEV_AG registration — 2026-09-28

[DEV_AG](TSST/DEV/AGENT.md) is a governance-`APPROVED` Software Engineering & Solutions specialist under TSST Lead with 16 `UNVALIDATED` core skills. Use its [lightweight registry](TSST/DEV/SKILL_REGISTRY.md) only for relevant routed technical scope. User approval is recorded in [TSST-ADR-002](TSST/decisions/TSST-ADR-002.md). Governance registration and repository merge only; no PILOT_READY, PRODUCTION_READY, autonomous execution authority or skill validation is granted. DEV_AG remains NOT_READY; existing specialist authority and readiness gates remain unchanged.

<!-- TSST-UNIVERSAL-ROUTING-BEGIN (ADR-003/004) -->
## Universal task routing — every runtime

The main session is TSST Lead. The canonical operating procedure is [workflow.md](TSST/context/workflow.md): recover one checkpoint → one plan/preflight → bounded specialist work → relevant checks and one checkpoint. Follow it once per task; refresh changed evidence. Reuse the owner's existing scoped approval.

- Team/agent: `TSST/context/router.yaml` + `roster.yaml`. Marketing → LENS; paid/measurement → SPARK; studio → CREATIVE; video/motion → MOTION; build → DEV; utility reads → READER; decisions/acceptance → Lead (never spawned).
- Skills: `python TSST/skills/build_index.py --team <team>`, then `--id <ID>`; open ≤3 matched bodies. Gap → TSST-CTX-SK-023. Keep the seven-field Skill Plan in one packet, not separate copies.
- Before mutation: `python -B TSST/context/preflight.py --plan <existing-plan.json> --mutate --json`. Authority references do not widen permissions. Stop the affected step on failure.
- Native agent selection is preferred when verified. Otherwise the adapter may use explicit-contract mode with the same generated contract, skill bodies and scoped plan; report native loading as unverified. Never substitute an ungoverned generic worker.
- Tier/model mechanics: `TSST/bus/runtimes.yaml` + the runtime adapter; only available mapped models. A task label does not prove what actually ran.
- Returns list Skills used/skipped, evidence and skill_friction. Client jobs still require R18–R20; utility/internal checkpoints are not new client jobs. Daily-board startup remains conditional on ابدأ اليوم.

Generated contracts: `.claude/agents/tsst-*.md` and `.codex/agents/tsst-*.toml`; edit roster/agent-contract then run `python TSST/context/gen_runtime_agents.py`. `--check` proves generated-file consistency only. Claude dispatch hook and Codex explicit preflight share validation; no unverified platform-wide interception is claimed. Read `TSST/context/adapters/<runtime>.md` only for mechanics. Antigravity/Gemini stay ROLE B external tools under ADR-004/R41.
<!-- TSST-UNIVERSAL-ROUTING-END -->
