# TSST-CREATIVE-SK-023 — Master-Detail Records, Drawers & Contextual Actions


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Keep users in flow by designing record previews, split views, drawers, overlays and contextual actions with correct focus and escape behavior.


## Trigger
Use when users need to inspect/edit CRM records from tables, kanban, inboxes or tasks without losing list context.


## Sources
- https://attio.com/help/reference/managing-your-data/records/create-and-view-records
- https://www.radix-ui.com/primitives/docs/components/dialog
- https://www.radix-ui.com/primitives/docs/components/popover


## Workflow
1. Classify actions as inline, popover, drawer/split-pane, modal or full page.
2. Design stable master-detail relationship.
3. Preserve list filters/scroll/selection while record detail opens.
4. Specify focus entry/return and Escape behavior.
5. Keep destructive/complex tasks distinct from lightweight inspection.
6. Define deep-link and refresh behavior for open records.


## Output contract
Record-detail anatomy; preview/drawer/full-page decision matrix; focus model; action placement; history/deep-link behavior.


## Guardrails
- Do not use modal for long multi-step workflows.
- Do not trap the user without clear close/back behavior.
- Do not reset table state when previewing another record.
- Contextual actions must respect permissions and current record state.


## Practical evaluation
Prototype rapid review of 10 leads from a filtered list with edit/task/log-call actions; no lost filter/scroll/context.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.