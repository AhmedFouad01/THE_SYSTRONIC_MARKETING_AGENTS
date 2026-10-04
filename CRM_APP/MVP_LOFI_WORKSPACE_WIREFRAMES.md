# Systronic CRM — Low-Fidelity Workspace Wireframes


Status: Wave 2 / UX-02 PREVIS
Owner: CREATIVE_AG
Purpose: interaction/layout proof only. Not final visual direction.


## WF-01 — Desktop AppShell + List + Record Panel


[ Sidebar 224/collapsed ]
  Systronic
  Home
  Leads
  Contacts
  Deals
  Tasks
  Insights
  ----------
  Admin* 
  Operations*
  ----------
  User / Language


[ Context Header ]
  Contacts / Saved View
  [Global Search] [Quick Create] [Command]


[ View Toolbar ]
  View ▾ | Filters | Sort | Columns | Search-in-view
                                      [ + Contact ]


[ Main Table ]
  □  Name        Owner      Source      Status     Next action
  □  A...
  □  B...
  □  C...
  ...
  cursor load-more / continuation


When record opens:
[ Main Table preserved ~60% ] [ Record Panel ~40% ]
                               Contact Name   X
                               Status / owner
                               ----------------
                               Summary
                               Activity
                               Tasks
                               Related
                               Journey
                               ----------------
                               Primary action
                               More ▾


Behavior proof:
- filter/scroll stays intact;
- opening next record replaces only panel content;
- Close returns focus to source row.


## WF-02 — Leads Review


Header: Leads
Toolbar: New/Open saved view | Filters | Sort | Columns | + Lead


Table defaults:
Lead | Contact | Source | Owner | Status | Next task


Panel:
Lead title
Source + evidence
Owner / status
Linked contact
Recent activity
Next action
[Create Deal] [Create Task] [Edit]


No conversion semantics are invented; Create Deal uses the existing deal creation contract.


## WF-03 — Deals Pipeline


Header: Deals
View switch: [Pipeline] [Table]
Toolbar: Pipeline selector | Owner filter | Search | + Deal


Pipeline:
| New            | Qualified       | Won/Lost outcome columns as configured |
| Deal A          | Deal D          | ... |
| Deal B          | Deal E          |
| Deal C          |                 |


Card:
Deal title
Contact
Amount / currency
Owner
Next task indicator where available
[Open] [Move stage ▾]


Accessible stage movement:
Move stage menu → allowed transitions only → reason → submit.


Drag-and-drop is optional enhancement, never the sole path.


Mobile:
Stage segmented/select control → one stage list at a time.


## WF-04 — Tasks / Follow-up Queue


Header: Tasks
Views: Open | Due Today | Overdue | Completed
Toolbar: Owner / linked object filters | + Task


Rows:
Due time | Task | Related record | Owner | Status | Quick Complete


Open task → side panel with:
- title
- due
- owner
- contact/deal context
- status/outcome
- [Complete] [Edit]


## WF-05 — Insights / Campaign Performance


Header: Insights
Subnav: Campaigns | Conversions | Journey | Orders


Persistent report context bar:
Model: Last Non-Direct
Version: deterministic-v1
Lookback: 30d
As-of / Run
Source: Internal
[Calculate]*


Decision hierarchy:
1. Summary indicators only if authoritative.
2. Campaign comparison table.
3. Unknown/unattributed row always explicit.
4. Click/open row → evidence drill-down panel.
5. Provider-reported attribution displays “Not connected” rather than zero.


## WF-06 — Contact Journey


Contact panel or Insights → Journey:
Contact selector/search
Chronological timeline


Each item:
Event/action
Occurred time
Received time
Source/evidence label where allowed


No evidence:
“No journey evidence available for this contact.”
Not an error state.


## WF-07 — Quick Create Drawer


Drawer title: Create Deal
Fields:
Contact*
Lead (optional)
Title*
Pipeline*
Stage*
Owner*
Amount
Currency


Footer:
[Cancel] [Create Deal]


Validation:
- errors inline;
- values preserved;
- permission/conflict/network recovery does not clear form.


## WF-08 — Conflict Recovery


Panel/dialog:
“This record changed after you opened it.”


Latest authoritative:
Owner: X
Stage: Qualified
Version: 8


Your proposed change:
Stage: Won
Reason: ...


Actions:
[Review latest] [Retry after review] [Cancel]


Never auto-overwrite.


## WF-09 — Mobile


Top bar:
[Menu] Context title [Search]


Body:
one list or one record surface.


Bottom/primary action:
contextual + Add


Record opens as full-height sheet.
Filters open as dedicated sheet.
Pipeline shows one stage at a time.
Dense table transforms to prioritized list rows; do not shrink all desktop columns.


## Wireframe acceptance


All eight Wave-1 tasks can be mapped onto these layouts without requiring a full page reset for common inspection/actions. These are PREVIS interaction artifacts only.