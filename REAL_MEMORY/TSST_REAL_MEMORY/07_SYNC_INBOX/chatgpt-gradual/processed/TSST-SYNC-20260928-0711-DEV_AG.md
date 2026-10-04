# TSST Real Memory Gradual Sync Packet

- **Packet ID:** `TSST-SYNC-20260928-0711-DEV_AG`
- **Project Key:** `TSST`
- **Date/Time:** `2026-09-28 07:11 Africa/Cairo`
- **Source Chat/Topic:** `TSST_SETUP_CONTINUE — Developer Team / DEV_AG definition`
- **Current Milestone:** `TSST-001 — Foundation & Agent Operating Model`
- **Current Gate:** `TSST-001A — Requirements & Governance Intake`
- **Packet Status:** `INCOMING / NOT YET COMMITTED TO DURABLE MEMORY`

## Confirmed Facts Added / Changed

1. A software-development workstream is required inside TSST.
2. The official specialist-agent name is `DEV_AG`.
3. `DEV_AG` is the software engineering and solutions workstream for production-grade software delivery.
4. Scope includes, at minimum:
   - ERP systems
   - CRM systems
   - POS systems
   - business-management systems
   - web applications
   - internal tools and dashboards
   - APIs and integrations
   - WordPress / WooCommerce
   - Shopify / custom e-commerce
   - mobile applications
   - desktop applications
5. The engineering capability must emphasize practical production quality, maintainability, scalability, security, observability, integration readiness, and organized software-delivery practices.
6. Required engineering competence includes System Design, System Architecture, Software Architecture, Design Patterns, APIs, Integrations, databases, backend, frontend, testing/QA, DevOps/delivery, security, and engineering quality practices.
7. Architecture is not tied to one programming language or framework.

## Decisions Made

### Proposed decision for durable acceptance: DEV_AG creation
- Add `DEV_AG` as a specialist agent/workstream under `TSST Lead`.
- Display role: `Software Engineering & Solutions Agent`.

### Proposed decision for durable acceptance: Hybrid technology model
`DEV_AG` uses a **Hybrid** technology-selection model:
- maintain a preferred/default stack;
- allow alternative stacks when project requirements justify them;
- justify major stack deviations using requirements, scalability, maintainability, security, integration needs, operational fit, and cost.

### Proposed decision for durable acceptance: Capability-lane model
For the initial baseline, architecture, backend, frontend, integrations, QA, platform/DevOps, commerce, mobile, and desktop are treated as capability lanes within `DEV_AG`, not separate top-level specialist agents by default.

### Proposed decision for durable acceptance: Technical authority model
`DEV_AG` may make routine technical decisions inside an approved project scope.
High-impact decisions escalate through `TSST Lead`, with user approval when business-, financial-, security-, or production-critical. Examples include:
- major architecture changes;
- core-stack changes;
- production deployment;
- destructive database migrations;
- paid cloud/service commitments;
- production-secret handling;
- security-model changes;
- major external integrations.

## Files / Links Created or Changed

- Gradual-sync path prepared under `07_SYNC_INBOX/chatgpt-gradual/incoming/` for this packet.
- No durable TSST memory files were modified as part of this `RM_SYNC_NOW` operation.

## Pending Items

1. Define the preferred/default engineering stack for the Hybrid model.
2. Freeze the detailed `DEV_AG` agent contract: inputs, outputs, SLAs, forbidden actions, escalation rules, and acceptance gates.
3. Define the formal engineering lifecycle / SDLC gate sequence.
4. Define architecture-review, security-review, QA, performance, deployment, and production-release gates.
5. Define repository/GitHub permissions, cloud/hosting permissions, database permissions, secret-handling rules, and production-access boundaries.
6. Define standard technology-selection and architecture-decision documentation, including ADR expectations.
7. Define cross-agent handoffs, especially `CREATIVE_AG -> DEV_AG` for UI/UX implementation and `LENS_AG -> DEV_AG` for requirements/research where relevant.
8. Define `DEV_AG` KPIs and readiness/evaluation criteria before production-ready status.
9. Continue remaining `TSST-001A` onboarding items and produce `TSST Operating Baseline v0.1` for explicit approval.

## Risks / Blockers

- `DEV_AG` must not be treated as production-ready until its contract, permissions, quality gates, and evaluation/readiness criteria are approved.
- A Hybrid model without an explicit preferred stack and deviation criteria could create technology sprawl; this remains open.
- Production infrastructure, secrets, credentials, API keys, tokens, and private credentials must not be stored in Real Memory.
- No cross-project durable memory may be merged into TSST by default.

## Proposed Exact Memory Targets

Subject to review and explicit commit approval:

1. `02_PROJECT_MEMORY/PROJECT_PROFILE.md`
   - Add `DEV_AG` to specialist operating roles.
   - Add its software-engineering mission and scope.

2. `02_PROJECT_MEMORY/PROJECT_DECISIONS.md`
   - Record accepted decision: creation/name of `DEV_AG`.
   - Record accepted decision: Hybrid technology-selection model.
   - Record accepted decision: capability-lane structure and escalation model.

3. `02_PROJECT_MEMORY/PROJECT_BACKLOG.md`
   - Add preferred-stack definition.
   - Add DEV_AG contract, permissions, SDLC, QA/security/release gates, KPIs, and readiness evaluation.

4. `02_PROJECT_MEMORY/PROJECT_MEMORY_MAP.md`
   - Add `DEV_AG` to team structure and current onboarding map.

5. `01_CURRENT_STATUS/CURRENT_STATUS.md`
   - Reflect that the developer workstream has been defined during intake while its detailed operating contract remains open.

6. `05_TIMELINE/PROJECT_TIMELINE.md`
   - Add 2026-09-28 onboarding event for DEV_AG scope and Hybrid model approval.

7. Future operating artifacts after baseline approval:
   - `TSST/DEV/AGENT.md`
   - `TSST/DEV/SKILL_REGISTRY.md`
   - DEV_AG skills/evaluations/readiness artifacts, only after the operating baseline authorizes implementation.

## Confidence / Uncertainty Notes

- **High confidence:** `DEV_AG` name, Hybrid technology model, inclusion of mobile and desktop, and the high-impact escalation model were explicitly approved by the user in this chat.
- **High confidence:** ERP, CRM, POS, web, WordPress, Shopify, integrations/APIs, architecture, system design, and design-pattern competence are explicitly required.
- **Open / not yet frozen:** preferred stack, exact internal capability structure, detailed permissions, evaluation design, and production-readiness criteria.

