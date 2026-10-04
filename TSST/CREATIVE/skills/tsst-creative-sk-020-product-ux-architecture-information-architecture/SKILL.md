# TSST-CREATIVE-SK-020 — Product UX Architecture & Information Architecture


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Turn product scope, roles and domain objects into a clear information architecture, task model and navigation hierarchy for complex SaaS products.


## Trigger
Use when designing or restructuring CRM modules, navigation, object/view hierarchy, user flows or workspace architecture.


## Sources
- https://www.nngroup.com/articles/ten-usability-heuristics/
- https://attio.com/help/reference/attio-101/attios-data-model/define-your-data-model-objects-lists-and-views


## Workflow
1. Extract real user roles/tasks from approved product requirements; do not invent personas.
2. Map primary objects, workflows and decisions.
3. Create task flows and information architecture before high-fidelity UI.
4. Separate global navigation, workspace navigation, record context and local actions.
5. Test labels against user language and minimize memory load.
6. Produce a click-depth and dead-end review.


## Output contract
IA map; task-flow map; primary/secondary navigation model; object/view taxonomy; rationale; unresolved questions.


## Guardrails
- Do not copy another SaaS navigation verbatim.
- Do not let database structure dictate the interface.
- Do not add screens without a real user task.
- Prefer recognition over recall and consistent terminology.


## Practical evaluation
Given the Systronic CRM M0–M2 scope, produce an IA and top 8 task flows; every MVP task must complete without orphan screens or contradictory labels.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.