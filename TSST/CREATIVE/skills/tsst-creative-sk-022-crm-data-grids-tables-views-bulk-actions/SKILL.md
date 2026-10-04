# TSST-CREATIVE-SK-022 — CRM Data Grids, Tables, Views & Bulk Actions


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Design dense CRM tables and interactive grids that remain scannable, configurable, accessible and efficient at scale.


## Trigger
Use for Contacts, Leads, Deals, Tasks, Reports, selectable rows, bulk actions, saved views, filters, sort and column controls.


## Sources
- https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines
- https://www.w3.org/WAI/ARIA/apg/patterns/table/
- https://www.w3.org/WAI/ARIA/apg/patterns/grid/


## Workflow
1. Choose semantic table vs interactive grid based on interaction needs.
2. Define essential default columns and progressive disclosure.
3. Specify sort/filter/search/saved-view behavior.
4. Design row selection and batch-action bar.
5. Provide row-level quick actions without action clutter.
6. Specify loading, empty, error, partial and pagination/virtualization states.
7. Define keyboard traversal when grid behavior is justified.


## Output contract
Table/grid anatomy; density modes; column model; toolbar; bulk-action model; saved-view behavior; accessibility notes.


## Guardrails
- Do not make every cell interactive.
- Do not rely on horizontal scrolling for core tasks when avoidable.
- No hidden destructive bulk actions.
- Native table semantics preferred unless interactive-grid behavior is truly required.


## Practical evaluation
Design a 1,000-record Deals workspace with sort/filter/view/bulk actions and keyboard path; pass accessibility and scan-speed review.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.