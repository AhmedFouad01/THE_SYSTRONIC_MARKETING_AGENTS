# Systronic CRM — MVP UX Audit


Status: Wave 1 / UX-00 → UX-01 input
Owners: TSST Lead + CREATIVE_AG


## Executive assessment


The M0–M2 UI is a credible engineering/admin workspace but not yet a coherent daily-use CRM product. The main problem is fragmentation and context loss, not lack of backend capability.


## Strengths to preserve


1. Arabic RTL and English LTR already exist.
2. Visible focus treatment exists.
3. Permission, conflict and network states are differentiated.
4. Retry semantics preserve command identity.
5. Optimistic version conflicts are surfaced.
6. Contacts, leads, deals and tasks share consistent contracts.
7. Contact journey, deal history and reporting evidence already exist.
8. Reporting distinguishes internal, unknown, unpublished and disconnected-provider states.
9. Capability flags already gate configuration, merge and audit.
10. Narrow layouts avoid catastrophic breakage.


## Priority findings


### UX-F01 — Fragmented shell — Major
CRM and reporting are separate experiences with repeated connection context.
Direction: one permission-aware AppShell with shared session/tenant context.


### UX-F02 — Record inspection loses list context — Major
Detail/edit sections replace spatial context and scroll the page.
Direction: master-detail/side panel for common inspection and editing.


### UX-F03 — Lists are basic tables, not operating views — Major
No sort, filter, configurable columns, saved views, row selection or bulk actions.
Direction: reusable DataGrid/View model.


### UX-F04 — Deals are called pipeline but behave as a table — Major
Stage movement exists only through record detail.
Direction: pipeline/Kanban plus table mode.


### UX-F05 — Overview counts can be misread — Major
Cards use fetched-page lengths, with a plus sign when more records exist.
Direction: label as queue/page indicators or add authoritative aggregate endpoints before calling them KPIs.


### UX-F06 — Repeated connection context — Major
CRM and reporting ask again for token/tenant.
Direction: unified shell using the existing in-memory session model.


### UX-F07 — Admin configuration mixed with daily work — Moderate
Pipeline and automation configuration share the daily workspace.
Direction: permission-gated Admin/Configuration area.


### UX-F08 — No global search — Major
Frequent record retrieval requires manual scanning.
Direction: global search and command/open-record path. Any backend search gap must be separately approved.


### UX-F09 — Minimal filtering and no saved views — Major
Only tasks expose a due filter.
Direction: reusable views/filters across core objects.


### UX-F10 — No deep-link-safe workspace state — Moderate
View/record context is local page state.
Direction: route/state strategy in UX-02.


### UX-F11 — Mobile is stacked desktop — Major
Responsive CSS collapses layout but does not redesign the task flow.
Direction: task-prioritized narrow mode.


### UX-F12 — Light/dark system not implemented — Moderate
Current screens use ad-hoc single-theme CSS.
Direction: approved tokens before final screen styling.


### UX-F13 — Recovery states are mostly status text — Major
Correct semantics, weak recovery UX.
Direction: reusable denied/error/conflict/empty components.


### UX-F14 — Reporting lacks progressive drill-down — Major
Campaign rows/cards do not yet create a clear decision hierarchy.
Direction: summary → comparison/table → evidence drill-down while keeping model/version/as-of visible.


### UX-F15 — Audit/outbox are raw operational lists — Moderate
Useful evidence is implementation-centric.
Direction: keep permission-gated and translate status/failure meaning into operational language.


## Resulting product principle


The CRM should behave as one persistent object-and-task workspace, not disconnected CRUD/admin pages.


## Scope control


This audit does not change RLS/RBAC, idempotency, attribution truth, conversion truth, M2 contracts, provider integrations or M3 scope.