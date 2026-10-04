# Systronic CRM — MVP Information Architecture


Status: Wave 1 / UX-01 proposal
Owners: TSST Lead + CREATIVE_AG


## Objective


Create one persistent enterprise workspace for:
Lead / Intake → Contact → Deal → Pipeline → Follow-up Task → Won/Lost → Journey / Reporting


## Global shell


Persistent elements:
1. Workspace/tenant context.
2. Primary navigation.
3. Global search entry.
4. Quick-create entry.
5. User/session context.
6. Language direction control.
7. Context header.
8. Command-palette entry.


CRM and reporting share the same shell.


## Primary navigation


### Home
Work queue and operational priorities: overdue, due soon, recent lead/deal activity and permission-scoped manager indicators.


### Leads
Table/list, saved views, filters and record preview.


### Contacts
Table/list, saved views, record preview, journey/activity and authorized duplicate/merge actions.


### Deals
Pipeline/Kanban for stage work, table mode for dense analysis, record preview and stage history.


### Tasks
Open, due today, overdue, completed and contextual tasks.


### Insights
Journey, conversions, campaign performance and order/payment/refund evidence as relevant. Attribution model/version/lookback/as-of/source remain visible.


## Permission-gated secondary navigation


### Admin / Configuration
Pipelines, stages/transitions and automation rules.


### Operations
Audit log and processing/outbox status.


Raw integration-ingest endpoints are not primary navigation unless a validated task later requires them.


## Record interaction


Default behavior:
1. Keep active list/pipeline in place.
2. Open common record inspection in a side panel/drawer.
3. Preserve filters, sort, scroll and selection.
4. Allow record-to-record movement where useful.
5. Use full page only for genuinely deep workflows.


Possible record sections: Summary, Activity/Journey, Tasks, Deal/Stage History, Related Objects and authorized evidence/reporting.


## Create/edit


Quick create: Lead, Contact, Deal, Task.
Forms must not destroy underlying work context. Validation, permission and conflict recovery preserve entered data.


## Search and commands


Global search covers core CRM objects.
Command palette candidates: Create Lead, Contact, Deal, Task; Search/Open Record; Move Deal Stage; Open Pipeline; Open Reporting.
Every command retains a visible non-keyboard path.


## Responsive model


Desktop: full sidebar + dense table/pipeline + side-panel detail.
Mobile/narrow: one task at a time, drawer/sheet patterns, reachable primary actions and no squeezed desktop table as the default.


## RTL/LTR


Arabic RTL is primary. IDs, emails, phones, URLs, currencies and mixed names require bidi-safe handling. Directional icons are reviewed individually. Layout uses logical start/end behavior.


## Context preservation


Opening a record must not reset current view, filters, sort, scroll, selection or pipeline position.


## UX-01 exit


All eight core tasks must have a clear entry point, completion state, recovery path, minimal context loss and permission-aware behavior.