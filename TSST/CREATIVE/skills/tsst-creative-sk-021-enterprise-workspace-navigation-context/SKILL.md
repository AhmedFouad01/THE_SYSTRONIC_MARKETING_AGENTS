# TSST-CREATIVE-SK-021 — Enterprise Workspace Navigation & Context Management


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Design a fast enterprise workspace shell with predictable sidebar, contextual navigation, search, quick actions and low context-switch cost.


## Trigger
Use for application shell, sidebars, tabs, view switching, global search and nested CRM workspaces.


## Sources
- https://attio.com/help/reference/attio-101/introduction-to-navigating-attio
- https://attio.com/help/reference/productivity-collaborating/navigating-your-workspace
- https://www.nngroup.com/articles/ten-usability-heuristics/


## Workflow
1. Define persistent vs contextual navigation.
2. Limit top-level destinations to real daily jobs.
3. Design collapsible sidebar and stable active-state behavior.
4. Keep record/task context visible during common actions.
5. Add global search and quick action entry points.
6. Specify breadcrumbs/back behavior only where it reduces disorientation.


## Output contract
Workspace shell spec; navigation states; context-switch rules; search/quick-action entry points; mobile navigation adaptation.


## Guardrails
- No mega-sidebar by default.
- No duplicate navigation paths with different labels.
- Avoid full-page navigation for lightweight record inspection/actions.
- Never hide essential location/context after opening overlays.


## Practical evaluation
Prototype a sales rep moving Lead→Contact→Deal→Task→Report and back with minimal context loss; document clicks/keystrokes and failure points.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.