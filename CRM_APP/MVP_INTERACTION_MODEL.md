# Systronic CRM — MVP Interaction Model


Status: Wave 2 / UX-02
Owner: CREATIVE_AG under TSST Lead
Inputs: Wave 1 inventory, UX audit, IA and task flows
Boundary: interaction architecture only; no product-semantic, authorization or M3 changes.


## 1. Operating model


The CRM behaves as one persistent workspace.


Desktop composition:
1. Collapsible primary sidebar.
2. Context header / active view toolbar.
3. Main work surface: table, pipeline, task queue or report.
4. Context-preserving record side panel when a common record is opened.
5. Overlay layer for short, bounded actions only.


Narrow/mobile composition:
1. Compact top context + navigation trigger.
2. One primary work surface at a time.
3. Record detail becomes a full-height drawer/sheet.
4. Forms use full-height sheet/page when needed.
5. Critical actions remain visible without forcing desktop-width tables.


## 2. AppShell


Persistent:
- tenant/workspace context;
- primary navigation;
- global search entry;
- quick-create entry;
- language switch;
- current user/session context;
- command palette entry.


Primary nav:
Home, Leads, Contacts, Deals, Tasks, Insights.


Permission-gated secondary nav:
Admin / Configuration; Operations.


Rules:
- no duplicate destinations with different labels;
- current location remains visible when a drawer/dialog opens;
- collapsed sidebar preserves recognizable icons + accessible names;
- CRM and Insights use the same shell/session context;
- this does not change current authentication persistence or token semantics.


## 3. Home / work queue


Purpose: action queue, not vanity dashboard.


Default sections:
- overdue follow-ups;
- due soon;
- recent/active work;
- permission-scoped manager queue indicators when authoritative data exists.


Important constraint:
Current overview card counts are fetched-page lengths, not authoritative totals. They must not be presented as KPI totals without a bounded aggregate API.


## 4. Object workspaces


### Leads
Primary: dense table/list.
Toolbar: view, search/filter, sort, columns where supported, saved views when persistence exists, create.
Row open: side panel.
Row actions: only the 1–3 most frequent, rest in contextual menu.


### Contacts
Primary: dense table/list.
Side panel sections: Summary, Activity/Journey, Related Sales, Tasks.
Sensitive identifiers and duplicate/merge actions remain permission-gated.


### Deals
Default operating mode: Pipeline.
Secondary mode: Table.
Pipeline card shows only decision-essential data.
Stage movement uses existing allowed-transition contract and expected version.
A failed/disallowed/conflicted move returns card to authoritative stage and shows recovery.


### Tasks
Primary views: My/Open, Due Today, Overdue, Completed.
Task may open from global Tasks or contextually from Contact/Deal.
Completion stays a fast visible action.


### Insights
Modes: Campaign Performance, Conversions, Journey, Orders/Evidence.
Persistent report context: attribution model, version, lookback, as-of/source.
Drill-down uses side panel or nested detail without losing report filters.


## 5. Master-detail behavior


Opening a record from a list/pipeline:
- updates route/view state so refresh/deep link can recover the open record;
- does not reset filter, sort, scroll, selection or pipeline position;
- moves focus into the detail heading/first meaningful control;
- Escape or explicit Close returns focus to the originating row/card;
- next/previous record navigation is allowed when order is stable.


Recommended panel width:
- desktop: approximately 420–560 px, responsive to content;
- narrow: full-height sheet.


Record panel structure:
1. record header + status + primary action;
2. essential summary;
3. tabbed/section content;
4. contextual actions;
5. secondary/destructive actions separated from primary actions.


## 6. Form model


Create/edit forms prefer drawer/sheet when short to medium.
Full-page only for genuinely deep workflows.


Rules:
- task-essential fields only;
- sensible defaults;
- optional fields clearly marked;
- field-level errors + summary when multiple;
- values preserved after validation, permission or conflict failures;
- expected-version conflict shows “record changed” comparison/review step before retry;
- Cancel returns to original context;
- dirty close asks before discarding when data would be lost.


## 7. Data table / grid model


Default to semantic table unless cell-level keyboard editing truly requires grid semantics.


Toolbar order:
1. view selector;
2. search/filter;
3. sort;
4. columns;
5. create;
6. overflow.


Selection:
- row checkbox;
- selection count;
- bulk-action bar appears only after selection;
- destructive bulk actions are never hidden in an ambiguous menu.


Pagination:
- current API cursor pagination remains authoritative;
- loading more must preserve current rows and scroll;
- no fake total count.


## 8. Pipeline interaction


Desktop:
- horizontal columns only for stages;
- card movement can use drag-and-drop only if an equivalent keyboard/menu path exists;
- primary accessible path: Move Stage action listing allowed transitions;
- reason is collected before submit where required;
- optimistic movement is visually provisional until server success.


Mobile:
- stage selector / grouped list rather than forcing a wide drag surface.


## 9. Search / quick create


Global search is a UX requirement but current code does not expose a unified search contract.
Classification: API GAP CANDIDATE — DEV_AG must assess before implementation.


Quick create:
Lead, Contact, Deal, Task.
Each remains available through visible UI even if accelerated through command palette.


## 10. View state


The interaction architecture requires route-addressable state for:
- active primary destination;
- active saved/filter view;
- open record;
- report subview;
- attribution model/filter state when appropriate.


Do not put secrets/tokens in URLs.


## 11. Permission behavior


Unauthorized commands/actions:
- omitted from normal action sets when capability is known;
- direct/deep-link access returns a clear denied state;
- no disabled-looking action should imply that authorization can be bypassed.


## 12. Known API/persistence dependencies


Needs DEV_AG feasibility review before implementation:
1. unified global search;
2. persisted saved views;
3. authoritative Home aggregate KPIs;
4. bulk mutation endpoints if bulk write actions are approved;
5. route-addressable server/client state strategy.


These are surfaced as bounded gaps, not silently added features.


## UX-02 interaction acceptance


The eight MVP tasks can be represented without losing list/work context, and every overlay/form/action has a recovery path. High-fidelity styling remains blocked until UX-02 deliverables are complete.