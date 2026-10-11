# VB-1 · Visual blueprint inventory · 2026-10-09

Paths are repository-relative; B = `TSST/brands`, S = `TSST/services`, C = `systronic-control-center/systronic-control-center/docs`. Missing kinds: D = system diagram, F = flowchart, R = graphical roadmap. Sizes estimate blueprint scope: S single flow, M several stages, L multiple interacting subsystems.

| area | type (system / project / service / process) | existing visuals (path or none) | missing: system diagram / flowchart / roadmap | source docs (paths) | size S/M/L |
|---|---|---|---|---|---|
| TSST: boot → router → teams → bus → review | system | ASCII lifecycle: `TSST/context/bus.md`; no integrated visual found | D/F/R | `TSST/context/boot.md`, `TSST/context/router.yaml`, `TSST/teams/marketing/team.md`, `TSST/TSST_DECISION_RIGHTS.md` | L |
| T.SAG / CRM | project | Text wireframes: `CRM_APP/MVP_LOFI_WORKSPACE_WIREFRAMES.md` | D/F/R | `B/t-sag/projects/crm/project.md`, `CRM_APP/MVP_INFORMATION_ARCHITECTURE.md`, `CRM_APP/MVP_CORE_TASK_FLOWS.md`, `CRM_APP/CRM_MVP_SPRINT_PLAN_v0.1.md` | L |
| T.SAG / SCC | project | Mermaid: `C/03_architecture/SYSTEM_ARCHITECTURE.md`, `C/03_architecture/DATA_FLOWS.md`, `C/10_ux/USER_FLOWS.md` | R; existing D/F cover selected flows only | `B/t-sag/projects/scc/PARKED.md`, `C/01_product/PRODUCT_ROADMAP.md` | L |
| T.SAG / tsst-ai | project | None found | D/F/R | `B/t-sag/projects/tsst-ai/project.md`, `B/t-sag/status.md` | L |
| VILL / strategy-baseline, social setup | project | Delivery pages: `TSST/brands/vill-studio/projects/social-setup-01/DELIVERY.html` | D/F/R | `B/vill-studio/projects/strategy-baseline/project.md`, `B/vill-studio/status.md` | M |
| ANVIL / switch-pilot | project | Preview: `TSST/PILOTS/TSST-PILOT-001_ANVIL_SWITCH/11_PRODUCTION_V01/PREVIEW.html`; delivery: same pilot's `TSST/brands/anvil/projects/campaign-01/DELIVERY.html` | D/F/R | `B/anvil/projects/switch-pilot/project.md`, `B/anvil/status.md` | M |
| SV-01 · Visual identity | service | None found; stage table exists | D/F/R | `S/SV-01_visual-identity.md` | M |
| SV-02 · Market research | service | None found; stage table exists | D/F/R | `S/SV-02_market-research.md` | M |
| SV-03 · Marketing plan | service | None found; stage table exists | D/F/R | `S/SV-03_marketing-plan.md` | M |
| SV-04 · Content strategy + plan | service | None found; stage table exists | D/F/R | `S/SV-04_content-strategy.md` | M |
| SV-05 · Campaigns | service | None found; stage table exists | D/F/R | `S/SV-05_campaigns.md` | M |
| SV-06 · Website + e-commerce | service | None found; stage table exists | D/F/R | `S/SV-06_website-ecommerce.md` | L |
| Delivery: manifest → generator → client/internal pages → QA | process | HTML outputs in VILL/ANVIL rows; no process diagram found | D/F/R | `S/delivery/README.md`, `S/delivery/build_delivery.py` | M |

1. Decision/owner: TSST Lead selects later MagicPath blueprint work; method: bounded project/status/catalogue skim plus visual filename/Mermaid search, with utility-reader extraction and LENS verification.
2. SCC has four verified Mermaid blocks (architecture, sequence, two user flows); its prose roadmap is not a graphical roadmap (`C/03_architecture/*`, `C/10_ux/USER_FLOWS.md`, `C/01_product/PRODUCT_ROADMAP.md`).
3. “Missing/none found” means unverified in scoped repository search; private memory, dependencies, generated/vendor and historical reference material were excluded; diagram rendering and completeness were not assessed.
4. Portfolio lists CRM, tsst-ai, VILL and ANVIL; SCC exists outside that index; AKYRO and YAKEBDA have no indexed projects, so no project scope was invented (`TSST/core/portfolio.yaml`, `B/t-sag/projects/scc/PARKED.md`).
5. Agent: LENS_AG (`TSST/LENS/AGENT.md`, `TSST/teams/marketing/team.md`); Skills used: TSST-LENS-SK-001, steps 1–8 for decision, scope, evidence selection, limits and QA; skill_friction: no inventory taxonomy/size rubric; explicit definitions above. Readiness remains NOT_READY.
