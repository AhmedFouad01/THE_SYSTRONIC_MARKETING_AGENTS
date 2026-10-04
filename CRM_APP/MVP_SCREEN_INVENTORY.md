# Systronic CRM — MVP Screen & Surface Inventory


Status: Wave 1 / UX-00 inventory
Owners: TSST Lead + CREATIVE_AG
Baseline: M0 + M1 + M2 closed locally. M3/provider integrations are excluded.


## Current user-facing surfaces


### CRM workspace — web/index.html
Entry context: session token, tenant/workspace ID, optional grant ID.


Primary views:
1. Work queue / overview.
2. Contacts.
3. Leads.
4. Deals / pipeline.
5. Follow-ups / tasks.
6. Audit, permission-gated.
7. Processing status / outbox, permission-gated.


Conditional configuration:
1. Pipeline configuration.
2. Automation rules: create and enable/disable stage follow-up rules.


Record/action surfaces:
1. Contact create/edit/detail.
2. Sensitive contact identifiers when authorized.
3. Contact journey/timeline.
4. Duplicate search and reviewed merge when authorized.
5. Lead create/edit/detail/status.
6. Deal create/edit/detail.
7. Deal stage transition and stage history.
8. Task create/edit/detail, due filters and completion.


### Journey & Reporting — web/reporting.html
Current separate reporting surface:
1. Campaign performance.
2. Conversions list/detail.
3. Orders list/detail with payments, refunds and fulfillment.
4. Contact journey.
5. Attribution calculation/publish action when authorized.


Explicit reporting states include unknown/unattributed, internal attribution, provider attribution not connected, unpublished calculation, stale/new-run explanation, permission denied, loading, empty and error.


### Foundation proof — web/foundation.html
M0 synthetic deal-transition proof only. Engineering evidence, not a target MVP navigation surface.


## API capabilities without dedicated MVP UI


1. Collection-site management.
2. Identity-linking/correction intake.
3. Commerce import.
4. Campaign intake.
5. Spend snapshot ingestion.
6. Raw journey entity lists.


These should remain operational/admin capabilities unless a validated daily user task requires first-class UI.


## Permission-sensitive variations


Current contracts expose crm.read, crm.write, sensitive.read, sensitive.write, crm.merge, pipeline.manage, audit.read, report.read, report.calculate, integration.manage, integration.ingest and conversion.normalize. Object-scoped grants can further restrict records.


## Current interaction states


Observed: loading, empty, saved, permission denied, validation failure, version conflict, network retry, pagination, capability visibility, stale/unpublished reporting, Arabic RTL, English LTR and narrow/mobile layout.


Missing reusable product states: skeletons, rich denied/conflict recovery, offline/retry component, selection/bulk state, saved views, record preview, command palette and task-specific empty states.


## Current component inventory


Ad-hoc primitives: header, navigation buttons, buttons, inputs, textarea, select, table, overview cards, status output, editor section, detail section, forms, language toggle and pagination.


Domain patterns: contact detail/journey/merge, deal transition/history, task completion, pipeline/automation configuration, campaign-performance card, conversion/order detail and reporting journey timeline.


## Current-vs-required gaps


1. Persistent AppShell shared by CRM and reporting.
2. Global search.
3. Context-preserving master-detail side panel.
4. Data-grid sort/filter/columns/saved views/selection/bulk actions.
5. Real deal pipeline/Kanban interaction.
6. Command palette and visible quick actions.
7. Deep-link-safe view/record state.
8. Preserved filter/scroll/selection during record inspection.
9. Adaptive mobile task model.
10. Reusable light/dark tokens.
11. Reusable permission/error/conflict/empty components.
12. Decision-first reporting with progressive drill-down.
13. Separation of daily sales work from admin/configuration.
14. Component-level keyboard/accessibility behavior.


## UX-00 exit


The real product surface map is now sufficient to proceed to task architecture and IA. No product semantics or M3 scope were added.