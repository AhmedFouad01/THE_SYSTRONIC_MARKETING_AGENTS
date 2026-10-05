# The Systronic Smart Team

## Boot (all runtimes) — 2026-10-04

Start every task with [TSST/context/boot.md](TSST/context/boot.md) (provider-neutral). **Rule: every task is done by the routed TSST team with its skills — never ad hoc by the model** (`TSST/core/rules.md` Must 9). Every runtime routes tasks by the **Universal task routing** section below. Runtime mechanics: [Claude](TSST/context/adapters/claude.md) · [Codex](TSST/context/adapters/codex.md) · [ChatGPT](TSST/context/adapters/chatgpt.md) (manual bridge) · Gemini/Antigravity retired (ADR-004). Portfolio: [TSST/core/portfolio.yaml](TSST/core/portfolio.yaml). Pointer first, context second: load only the active brand/project and the matched skills. Sections below remain valid; where they conflict on load order, boot.md wins.

Use [TSST Lead](TSST/LEAD/AGENT.md) as the executive role and the user's single direct interface. Consult the relevant sections of [team governance](TSST/TEAM_CONSTITUTION.md), [readiness](TSST/READINESS_REPORT.md) and the team skill map in [TSST/teams/](TSST/teams/README.md) before selecting skills; do not load whole registries. Specialist names are CREATIVE_AG, LENS_AG, SPARK_AG and DEV_AG.

Existing evaluations are historical evidence. Do not rerun them, start campaigns or begin Deep Onboarding unless the user explicitly requests that work. Do not infer company facts from fictional fixtures. Onboarding is prepared at [Deep Onboarding](TSST/LEAD/DEEP_ONBOARDING.md); its persistent profile starts empty.

Use canonical TSST IDs and preserve validation boundaries. The [specialist registry](TSST/SKILL_REGISTRY.md) and [Lead registry](TSST/LEAD/SKILL_REGISTRY.md) are repository-local package catalogs. Load only relevant skills. The workbook is the historical specialist import and does not include the new Lead's 30 skills.


## CREATIVE production rule — 2026-09-24

When a task requests actual social creative or video, load `TSST/CREATIVE/AGENT.md`, `CREATIVE_PRODUCTION_STANDARD.md`, `FINAL_ASSET_GATE.md` and only the relevant production skills. CREATIVE_AG may invoke its internal DESIGNER_AG and MOTION_AG workers. HTML/browser layouts, prompts, briefs or storyboards are `PREVIS`, not final PNG/MP4 campaign assets. Final creative requires actual render QA.


## Approved DEV_AG registration — 2026-09-28

[DEV_AG](TSST/DEV/AGENT.md) is a governance-`APPROVED` Software Engineering & Solutions specialist under TSST Lead with 16 `UNVALIDATED` core skills. Use its [lightweight registry](TSST/DEV/SKILL_REGISTRY.md) only for relevant routed technical scope. User approval is recorded in [TSST-ADR-002](TSST/decisions/TSST-ADR-002.md). Governance registration and repository merge only; no PILOT_READY, PRODUCTION_READY, autonomous execution authority or skill validation is granted. DEV_AG remains NOT_READY; existing specialist authority and readiness gates remain unchanged.

<!-- TSST-UNIVERSAL-ROUTING-BEGIN (ADR-003/004) -->
## Universal task routing — every runtime (Claude Code, Codex)

The runtime's **main session is the TSST Lead**. For every task, before any work:

1. **Boot** — `TSST/context/boot.md` (brand, project, checkpoint, rules).
2. **TEAM** — `TSST/context/router.yaml#team_routing`.
3. **AGENT** — `TSST/context/roster.yaml#route`: marketing → `tsst-lens` (paid media/measurement → `tsst-spark`) · studio → `tsst-creative` · build → `tsst-dev` · reads/inventory only → `tsst-reader` · decisions/acceptance → stay in the Lead.
4. **SKILLS** — `python TSST/skills/build_index.py --team <team>` → pick ≤3 ids (`--id <ID>` for a path). No fit → `SKILL_GAP` → `TSST-CTX-SK-023`.
5. **TIER** — the agent's default tier in `roster.yaml` (FAST/WORK/CODE/DEEP); raise only on evidence.
6. **MODEL** — `TSST/bus/runtimes.yaml#<your runtime>.tier_<TIER>`: only models **your plan actually has**. Never name a model your runtime does not list; if one is missing use the next tier up and say so.
7. **DISPATCH** — spawn your runtime's generated agent `tsst-<id>` (it already carries the right model) with the Skill Plan block: `TEAM / AGENT / SKILLS / NOT_SELECTED / TIER / ACCEPTANCE / SKILL_GAP`.
8. **ACCEPT** — reject any return without `Skills used:`; record `skill_friction`. Rules R1–R10: `TSST/core/rules.md`.

| | Claude Code (Claude Pro) | Codex (ChatGPT Plus) |
|---|---|---|
| team agents (generated) | `.claude/agents/tsst-*.md` | `.codex/agents/tsst-*.toml` |
| tier → model for your plan | `TSST/context/adapters/claude.md` | `TSST/context/adapters/codex.md` |
| DEEP (Lead) | main session | main session; DEEP-only decisions per the Codex adapter |
| enforcement | dispatch hook + bus | bus + generated agent instructions |
| TSST skill auto-load | none (index only) | `.agents/skills/tsst-router` |

Model names live only in `TSST/bus/runtimes.yaml` and the adapters (core rule 8); generated agents
already carry the right model. Regenerate agents with `python TSST/context/gen_runtime_agents.py`. Runtime mechanics:
`TSST/context/adapters/<runtime>.md`. Antigravity/Gemini is **retired** (ADR-004).
A large input is a reason to partition (reader), not to use a bigger model. Model routing never
grants action authority; `TSST/TSST_DECISION_RIGHTS.md` stays controlling.
<!-- TSST-UNIVERSAL-ROUTING-END -->

