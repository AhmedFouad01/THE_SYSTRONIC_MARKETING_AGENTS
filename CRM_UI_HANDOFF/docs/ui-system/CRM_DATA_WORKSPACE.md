# CRM Data Workspace


The Leads workspace is the canonical pattern for data-heavy CRM screens.


## Required capabilities
- semantic HTML table when the content is tabular and not a spreadsheet editor
- searchable dataset
- saved views
- structured filters
- sortable columns with aria-sort
- column visibility
- comfortable / compact density
- row multi-select
- select-all for the current page
- contextual batch actions
- pagination and rows-per-page
- empty state
- master-detail record panel


## Selection model
Record detail selection and bulk selection are separate.


Opening a record:
- changes master-detail context
- must not implicitly add the row to a bulk action


Bulk selection:
- explicitly uses checkboxes
- exposes batch actions in table context


## Current prototype batch action
Assign to me.


## Current workflow
Lead → Contact → Deal preserves selected record context.


## Saved views
Current prototype:
- All leads
- My leads
- Unassigned


Future modules should reuse the data-workspace contract rather than building independent tables.