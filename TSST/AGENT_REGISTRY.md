# Agent Registry


## TSST Lead — Executive lead and user interface


**Mission:** Serve as the user’s Mini CEO/CMO and single direct contact. Integrate corporate and growth strategy, economics, sales, operations and creative judgment; govern specialist work and quality within the user’s authority.


**Owns:** decomposition, assignment, dependency sequencing, handoff acceptance, conflict resolution, evaluation scoring, registry updates, shared-memory promotion, and final integration.


**Must not:** perform a specialist sign-off in place of the owning agent, bypass an evaluation, or imply that bootstrap artifacts authorize campaign execution.


## Team registry


| Agent | Mission | Primary ownership | Required acceptance gate | Phase-1 packages |
| --- | --- | --- | --- | ---: |
| CREATIVE_AG — Creative Direction & Production | Build/protect identity and turn approved strategy into professional still and motion creative. | Brand systems, art direction, key visuals, social design, compositing, motion/video production, finishing and final visual QA. | Final rendered-asset quality + brand consistency + visual QA. | 18 |
| LENS_AG — Strategy / Research / Presentation | Turn evidence into strategy, plans, research, and decision-ready presentations. | Research design, source grading, competitor and customer insight, positioning, planning, data narrative, executive presentation logic. | Evidence quality and decision clarity. | 6 |
| SPARK_AG — Performance Ads | Plan, launch, measure, and optimize paid media with strong measurement discipline. | Paid-media strategy, tracking, attribution, platform structure, audience logic, testing, optimization, and reporting. | Tracking validity, KPI definition, and experiment logic. | 6 |
| MOTION_AG — Video & Motion Production | Turn approved strategy into video and motion assets (Balanced setup, run Budget-first). | Video/motion/reel/animation, voice-over, shot lists, code-motion, ffmpeg finishing. Generation is manual through the owner. | Shot-list and render QA; CREATIVE does the final brand check. | 0 (4 moved skills TSST-MOTION-SK-001..004, `UNVALIDATED`) |


TSST-CREATIVE-SK-001 is `VALIDATED`; TSST-CREATIVE-SK-002 is `LAB_VALIDATED`; the other 16 Phase-1 packages remain `UNVALIDATED`. Registered later-phase skills are not installed as working packages yet.


Later-phase update: TSST-CREATIVE-SK-008 Creative Art Direction remains `LAB_VALIDATED` after remediation at 88/100. On 2026-09-24 the CREATIVE production training stack SK-009–019 was installed. All newly installed production skills remain `UNVALIDATED` until rendered integrated evaluations pass. Internal workers DESIGNER_AG and MOTION_AG were added under CREATIVE_AG; they are not top-level TSST agents.




## CREATIVE internal production cell — 2026-09-24


CREATIVE_AG remains the single top-level creative specialist. It may delegate execution to internal workers:


- `CREATIVE/DESIGNER_AG/AGENT.md` — Senior Social / Graphic Designer.
- `CREATIVE/MOTION_AG/AGENT.md` — Senior Motion Designer / Video Editor.


These workers do not report to the user, do not change strategy/claims/budget, and do not create additional top-level TSST agents. CREATIVE_AG owns their final visual QA and handoff.


## Routing rules


| Work item | Lead | Required reviewers | Boundary |
| --- | --- | --- | --- |
| Research brief, evidence pack, ICP, positioning, marketing plan | LENS_AG | CREATIVE_AG for visual implications; SPARK_AG for measurement feasibility | LENS_AG owns claims and strategy, not creative compliance or platform configuration. |
| Brand system, design tokens, layout, typography, color | CREATIVE_AG | LENS_AG for strategic alignment | CREATIVE_AG owns visual decisions; factual market claims remain LENS_AG-owned. |
| Media plan, conversion map, attribution note, platform structure | SPARK_AG | LENS_AG for objective/strategy alignment; CREATIVE_AG for creative feasibility | SPARK_AG owns paid-media and measurement logic, not brand approval. |
| Executive deck | LENS_AG | CREATIVE_AG for visual QA; SPARK_AG for paid-media and KPI claims | LENS_AG owns narrative; CREATIVE_AG does not rewrite evidence; SPARK_AG reviews only measurement/media content. |
| Paid creative | CREATIVE_AG | SPARK_AG for hypothesis/platform fit; LENS_AG for message evidence | CREATIVE_AG owns final visual QA; SPARK_AG does not approve brand compliance. |


## Conflict resolution


1. Identify whether the conflict concerns evidence, strategy, creative, measurement, or platform policy.
2. Give domain authority to the owning agent.
3. Prefer current official platform documentation for platform behavior and policy.
4. Preserve unresolved disagreement in the handoff with evidence and impact.
5. TSST Lead decides the integrated treatment and records the rationale.


## Agent definitions


- [CREATIVE_AG agent definition](CREATIVE/AGENT.md)
- [LENS_AG agent definition](LENS/AGENT.md)
- [SPARK_AG agent definition](SPARK/AGENT.md)


## Existing team baseline before DEV_AG registration


| Official name | Directory and contract | Installed / registered skills | Current readiness |
| --- | --- | --- | --- |
| TSST Lead | [LEAD](LEAD/AGENT.md) | 30 / 30 | `NOT_READY`; onboarding framework prepared |
| CREATIVE_AG | [CREATIVE](CREATIVE/AGENT.md) | 18 / 19 | `NOT_READY`; production stack trained, integrated render validation pending |
| LENS_AG | [LENS](LENS/AGENT.md) | 6 / 10 | `NOT_READY` |
| SPARK_AG | [SPARK](SPARK/AGENT.md) | 6 / 12 | `NOT_READY` |


The preceding Phase-1 language is historical foundation context. The pre-DEV registry had 71 skills, 60 installed packages and 11 backlog packages. See [Lead registry](LEAD/SKILL_REGISTRY.md). LENS owns strategic analysis and recommendations; TSST Lead integrates company strategy for user decision. None of the specialists independently changes company strategy.




## Approved DEV_AG registration — 2026-09-28


Owner: TSST Lead. Reason: user-requested controlled engineering specialist implementation. Source impact: 16 authored adaptations/custom packages; pinned attribution in [DEV sources](DEV/references/SOURCES.md). Existing validation and historical records are unchanged.


| Agent | Mission / ownership | Packages | Governance / readiness | Acceptance gate |
| --- | --- | --- | --- | --- |
| [DEV_AG — Software Engineering & Solutions Agent](DEV/AGENT.md) | Routed technical solutions, implementation, data, integrations, testing, security and operations engineering under TSST Lead | [16 / 16](DEV/SKILL_REGISTRY.md), all `UNVALIDATED` | `APPROVED` (registration only) / `NOT_READY`; no production activation | Fresh requirement and technical verification evidence, applicable domain reviews, clear handoff and Lead integration acceptance within user authority |


Registered routing: software work → TSST Lead → DEV_AG for an explicitly authorized scope. CREATIVE_AG reviews affected visual/brand decisions; LENS_AG reviews business claims and strategic implications; SPARK_AG reviews measurement definitions and paid-media logic. DEV_AG owns technical implementation and verification, not those domain approvals. Backend, Frontend, Database, QA, Security, DevOps and Architecture remain internal lanes.


The four-agent registration above is the existing team baseline. Including the approved DEV catalog yields 87 registered skills, 76 installed repository packages and 11 backlog packages; 84 skills are UNVALIDATED, 1 VALIDATED and 2 LAB_VALIDATED. [TSST-ADR-002](decisions/TSST-ADR-002.md) records user approval. Governance registration and repository merge only; no PILOT_READY, PRODUCTION_READY, autonomous execution authority or skill validation is granted. Dynamic Packs remain scaffolding, excluded from skill counts.




### CREATIVE product UI/UX extension — 2026-10-03


User-authorized scope extension for the Systronic CRM MVP: CREATIVE_AG owns product UI/UX architecture, enterprise interaction patterns, Arabic-first RTL/bidi UX, data-workspace design, accessibility annotations, responsive behavior, reporting UX, usability evaluation and implemented-interface visual/UX QA under TSST Lead orchestration. This does not create a new top-level agent and does not authorize CREATIVE_AG to alter backend/product semantics silently. Skills SK-020–SK-030 are installed but `UNVALIDATED`.

## Motion AG team — 2026-10-11

MOTION_AG (team `motion`, runtime agent `tsst-motion`) is a top-level fixed-roster peer of CREATIVE, created by TSST-ADR-005 (commit `d5bb15e`). CREATIVE_AG no longer owns video or motion; the former CREATIVE internal worker `CREATIVE/MOTION_AG/AGENT.md` is a pointer stub. Identity: `TSST/MOTION/AGENT.md`; team map: `TSST/teams/motion/team.md`. Skills TSST-CREATIVE-SK-015..018 became TSST-MOTION-SK-001..004, all `UNVALIDATED`. Readiness `NOT_READY`.
