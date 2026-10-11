# VB-2 · Visual blueprint plan · 2026-10-09

**Decision:** Lead selects CREATIVE rounds: recommend system-first over service-first/project-first. Audience: Lead/CREATIVE_AG. Deadline: this pass. Scope: all 13 VB-1 rows as inventoried 2026-10-09; no drawing, implementation redesign or private memory.

**Method/limit:** inventory facts supply names/coverage; questions are priority, drawable structure and specialist dependencies. All rows selected; rank by dependency/reuse/coverage. Layouts/arrows are **editorial proposals**. Detailed architecture, service stages and product roadmaps require later scoped source reads. Hypothesis: shared vocabulary reduces ambiguity; Lead reviews. CREATIVE can draw these proposals without rereading.

**Priorities:** **P1** TSST/delivery/CRM: explain routing, reusable delivery and a large text-wireframe project. **P2** SV-01–06: reusable services before brand-specific views. **P3** SCC/tsst-ai/VILL/ANVIL: SCC has selected D/F coverage; remaining rows have limited structural evidence, warranting bounded proposals.

**Drawing contract:** D=system diagram, F=flowchart, R=roadmap. Chains give complete nodes/arrows. Use exact text, rounded rectangles, left-to-right arrows and “Proposed blueprint” label. Arrows mean proposed editorial progression/relationship, not integration; branches are separate connectors. No dates, numerical KPIs or hidden subnodes. Existing HTML/wireframes remain references.

Paths: B=`TSST/brands`; S=`TSST/services`; C=`systronic-control-center/systronic-control-center/docs`. Other paths are repository-relative. Primary input for every row: `TSST/handoffs/visual-blueprints/VB1_INVENTORY.md`.

| Priority / item | Visual and complete proposed nodes/arrows | Source provenance |
|---|---|---|
| P1 · TSST | D: Owner request → Lead boot/router → Team + skills; Team + skills → LENS / SPARK / CREATIVE / DEV (four separate nodes); each agent → Return + friction/lessons → Lead review; Lead review → Accepted handoff; Lead review → Lead feedback → Team + skills. Inset lifecycle: Ready → Claim → Progress → Done → Independent review → Closed; Progress → Blocked → Ready. Bus task → Lead boot/router. Label outer input/output “work arrives”/“approved recipient”. | `TSST/context/boot.md`; `TSST/context/router.yaml`; `TSST/teams/marketing/team.md`; `TSST/context/bus.md`; `TSST/TSST_DECISION_RIGHTS.md` |
| P1 · Delivery | F: Manifest → Generator → Client page; Generator → Internal page; Client page → QA; Internal page → QA; QA → Lead review. Label QA “proposed review step”; no automatic publication arrow. | `S/delivery/README.md`; `S/delivery/build_delivery.py` |
| P1 · T.SAG / CRM | D documentation overview (implementation unverified): CRM blueprint brief → Information architecture → Core task flows → Workspace wireframes → CREATIVE blueprint → Lead review. Show Sprint plan as a reference card, with dashed “informs proposal” arrow to CRM blueprint brief. These are documentation relationships, not runtime components. | `B/t-sag/projects/crm/project.md`; `CRM_APP/MVP_INFORMATION_ARCHITECTURE.md`; `CRM_APP/MVP_CORE_TASK_FLOWS.md`; `CRM_APP/MVP_LOFI_WORKSPACE_WIREFRAMES.md`; `CRM_APP/CRM_MVP_SPRINT_PLAN_v0.1.md` |
| P3 · SCC | R: Existing architecture + flows → Identify roadmap coverage → Proposed roadmap blueprint → Source-owner review → Accepted export. This is a blueprint-production roadmap, not a product release roadmap. | `B/t-sag/projects/scc/PARKED.md`; `C/03_architecture/SYSTEM_ARCHITECTURE.md`; `C/03_architecture/DATA_FLOWS.md`; `C/10_ux/USER_FLOWS.md`; `C/01_product/PRODUCT_ROADMAP.md` |
| P3 · tsst-ai | R: Inventory → Define tsst-ai blueprint → CREATIVE draft → Source-owner review → Accepted export. Use only this editorial roadmap; do not imply TSST and tsst-ai are the same system. | `B/t-sag/projects/tsst-ai/project.md`; `B/t-sag/status.md` |
| P3 · VILL | F: Strategy-baseline brief → Social setup blueprint → CREATIVE draft → Source-owner review → Accepted export. | `B/vill-studio/projects/strategy-baseline/project.md`; `B/vill-studio/status.md` |
| P3 · ANVIL | F: Switch-pilot brief → Campaign blueprint → CREATIVE draft → Source-owner review → Accepted export. **SPARK input needed** before ads/measurement details. | `B/anvil/projects/switch-pilot/project.md`; `B/anvil/status.md` |

<!-- PAGE BREAK: page 2 -->

**Service proposals:** Each is an F, with three nodes and two arrows exactly as listed. “Brief” is a proposed input placeholder; “Deliverable review” is a proposed review placeholder. These chains do not claim documented service stages. Use one panel per service; no invented acceptance thresholds.

| Priority / item | Complete proposed nodes/arrows | Source provenance / dependency |
|---|---|---|
| P2 · SV-01 | Brief → Visual identity → Deliverable review | `S/SV-01_visual-identity.md` |
| P2 · SV-02 | Brief → Market research → Deliverable review | `S/SV-02_market-research.md` |
| P2 · SV-03 | Brief → Marketing plan → Deliverable review | `S/SV-03_marketing-plan.md`; **SPARK input needed** for any ads/KPI expansion. |
| P2 · SV-04 | Brief → Content strategy + plan → Deliverable review | `S/SV-04_content-strategy.md`; **SPARK input needed** for any paid distribution/KPI expansion. |
| P2 · SV-05 | Brief → Campaigns → Deliverable review | `S/SV-05_campaigns.md`; **SPARK input needed** for ads/KPIs. |
| P2 · SV-06 | Brief → Website + e-commerce → Deliverable review | `S/SV-06_website-ecommerce.md`; **SPARK input needed** for tracking/conversion KPI expansion. |

**Dispatchable CREATIVE rounds:** R1 TSST D only; R2 Delivery F only; R3 CRM D only; R4 SV-01/02 F pair; R5 SV-03/04 F pair; R6 SV-05/06 F pair; R7 SCC R only; R8 tsst-ai R only; R9 VILL F only; R10 ANVIL F only. Each round draws listed nodes/arrows, checks labels/connectors and returns preview + editable source in one pass. P1 → P2 → P3; R7–10 independently deferrable. Factual expansion requires a separate scoped task.

**QA / stop:** Check all 13 rows, TSST inputs/outputs, connector completeness, fact/proposal labels, paths and SPARK flags. CREATIVE owns visual review. Reject unsupported facts; block ads/measurement expansion until SPARK input. No drawing, commit or VB-3. Readiness NOT_READY.

**Skills used:** TSST-LENS-SK-001 steps 1–8: decision, questions, evidence/proposals, scope, source mapping, selection, QA, feasibility. Agent: LENS_AG (`TSST/LENS/AGENT.md`; `TSST/teams/marketing/team.md`). **skill_friction:** no diagram/page-count rubric; brief supplies format. **SKILL_GAP:** none for editorial plan. **Limits:** inventory-only project/service evidence; no implementation validation; two-page editorial target, rendering unverified.


