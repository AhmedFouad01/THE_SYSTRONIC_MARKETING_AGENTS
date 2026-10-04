# Systronic CRM — MVP Sprint Plan v0.1


Sprint ID: `CRM-MVP-01`
Date: 2026-10-03
Owner / Orchestrator: TSST Lead
Product UX owner: CREATIVE_AG
Creative execution support: DESIGNER_AG under CREATIVE_AG
Engineering owner: DEV_AG
Current product baseline: M0 + M1 CLOSED; M2 implemented locally and awaiting independent audit closure.
State: `READY TO EXECUTE AFTER USER APPROVAL OF THIS SPRINT`


## Sprint Goal


Turn the existing M0–M2 CRM into a coherent, professional, Arabic-first MVP experience that is fast to operate, visually distinctive, responsive and usable for a real pilot without expanding into the full M3+ roadmap.


The sprint optimizes for one complete working experience:


`Lead / Intake → Contact → Deal → Pipeline → Follow-up Task → Won/Lost → Journey / Reporting`


The visual target is not a generic dashboard. The MVP must behave as a focused enterprise workspace: low context switching, strong data interaction, clear hierarchy, fast actions, native RTL, and consistent desktop/mobile behavior.


## Non-negotiable boundaries


1. Preserve all M0/M1/M2 data, security, RLS, RBAC, idempotency, attribution and commerce invariants.
2. No M3 provider integration is silently added during this sprint.
3. Meta/Google/GA4/Shopify integrations remain outside the baseline until explicitly approved.
4. CREATIVE_AG may reorganize presentation/navigation/interaction, but may not change product semantics or authorization rules.
5. DEV_AG may implement approved UX but may not silently redesign it.
6. All UI/UX skills SK-020–SK-030 remain `UNVALIDATED` until evidence from this sprint is accepted.
7. M2 must receive an independent audit PASS before final MVP closure.
8. No push/merge without an explicit later release decision.


## Reference DNA


Use references as principles, not copies:


- Linear-class restraint: hierarchy, low visual noise, command-driven speed.
- Attio-class CRM workspace: objects/lists/views, master-detail, table/kanban duality, contextual actions.
- Stripe-class reporting: KPI hierarchy, progressive drill-down, decision-first analytics.
- Carbon / WAI / enterprise-system patterns: dense data tables, bulk actions, accessibility and keyboard behavior.
- Systronic-specific visual identity: original product grammar, typography, color, iconography and motion.


## Sprint Structure


### Wave 0 — M2 Audit Closure (parallel safety lane)


Owner: Independent reviewer under TSST Lead.


Actions:
- Run the previously defined Independent M2 Audit on implementation commit `ba841c90b64e8bc4bb49c47247bd724f36e3a3a6`.
- Preserve product code during audit.
- If blockers appear, remediate only blockers and re-audit.
- Do not start M3.


Exit gate:
- `PASS — M2 may close` or PASS with no blocking findings.


This lane may run in parallel with UX discovery, but M2 cannot be declared closed until the audit gate passes.


---


### Wave 1 — UX Inventory + Task Architecture


Owners: CREATIVE_AG + TSST Lead.
Skills: SK-020, SK-021, SK-030.


CREATIVE_AG inspects the real M0–M2 product, not only screenshots.


Required inventory:
- all MVP routes/screens;
- all roles/permission-sensitive states;
- core objects: Contact, Lead, Deal, Pipeline/Stage, Task, Journey, Conversion, Campaign/Reporting;
- CRUD/action entry points;
- loading / empty / error / denied / stale-conflict states;
- desktop + narrow/mobile behavior;
- current UX debt.


Core task flows to model:
1. Review a new lead.
2. Find/open a contact.
3. Convert/work a lead into a deal.
4. Move a deal through pipeline stages.
5. Create/complete follow-up.
6. Review customer journey.
7. Inspect conversion/campaign reporting.
8. Manager/admin oversight within existing permissions.


Deliverables:
- `MVP_SCREEN_INVENTORY.md`
- `MVP_UX_AUDIT.md`
- `MVP_INFORMATION_ARCHITECTURE.md`
- `MVP_CORE_TASK_FLOWS.md`


Acceptance:
- every core task has a start, completion state and recovery path;
- no orphan screen;
- terminology is consistent;
- click/context-loss problems are identified before visual design.


Hard rule:
No final high-fidelity visual direction before Wave 1 is accepted.


---


### Wave 2 — Interaction Architecture


Owner: CREATIVE_AG.
Skills: SK-021–SK-025.


Define the operating model:


#### App shell
- compact collapsible sidebar;
- clear workspace hierarchy;
- global search;
- command palette / quick actions;
- predictable active state;
- no oversized admin menu.


#### CRM lists
- Table as the primary dense-data mode where appropriate;
- Kanban/Pipeline where stage movement is the job;
- saved views;
- sort/filter/search;
- clear column model;
- bulk actions with safe selection behavior.


#### Record interaction
- master-detail / side panel where context should be preserved;
- full page only for genuinely deep workflows;
- record switching without resetting list filters/scroll;
- contextual actions close to the record;
- deep-link-safe state.


#### Command palette
Candidate commands:
- Create lead
- Create contact
- Create deal
- Create task
- Log activity
- Search/open record
- Move deal stage
- Open pipeline
- Open reporting


Keyboard shortcuts are optional accelerators; all actions remain accessible through visible UI.


#### Forms and recovery
- compact forms;
- sensible defaults;
- clear field validation;
- preserve user data after failure;
- permission/conflict errors explain recovery;
- destructive actions require appropriate prevention/confirmation/undo.


Deliverables:
- `MVP_INTERACTION_MODEL.md`
- low-fidelity workspace wireframes;
- state/overlay decision matrix;
- command map;
- keyboard/focus map.


Acceptance:
All eight core tasks can be completed in low fidelity without losing context.


---


### Wave 3 — Product Design System + 3 UI Directions


Owner: CREATIVE_AG.
Execution support: DESIGNER_AG.
Skills: existing SK-003–006, SK-008, SK-010 plus SK-026–029.


#### Foundation system
Create:
- semantic color roles;
- light/dark strategy recommendation;
- Arabic/Latin type system;
- spacing scale;
- density modes;
- borders/radii/elevation;
- icon grammar;
- focus/hover/active/selected/disabled/error states;
- chart/data-viz tokens;
- RTL/LTR logical tokens;
- motion/micro-interaction rules.


#### Three genuinely different directions


Direction A — Productivity Workspace
- Linear-class restraint;
- compact shell;
- minimal visual noise;
- strong keyboard/command behavior.


Direction B — CRM Data Workspace
- Attio-class object/view behavior;
- sophisticated tables;
- master-detail records;
- stronger configurable views.


Direction C — Systronic Premium
- original Systronic visual language;
- premium but restrained;
- preserves productivity and data density;
- not decorative dashboard styling.


Each direction must include:
- Home / work queue;
- Leads or Contacts workspace;
- Deal pipeline;
- Record detail;
- Tasks/follow-up;
- Journey/reporting;
- Command palette;
- Arabic RTL desktop;
- 360px/mobile sample.


Deliverable:
- `MVP_UI_DIRECTION_REVIEW_v0.1`
- Figma boards/prototypes for all three directions.


### USER APPROVAL GATE


The sprint pauses for user selection:
- A;
- B;
- C;
- or a controlled hybrid with explicit rules.


No DEV implementation of final UI starts before this approval.


---


### Wave 4 — Component System + Interactive Prototype


Owner: CREATIVE_AG.
Execution support: DESIGNER_AG.
Skills: SK-022–SK-030.


Build reusable product components:


- AppShell / Sidebar / Header
- Command Palette
- Button / Icon Button
- Input / Textarea / Select / Combobox
- Tabs / Segmented Control
- Filter bar
- Data Table / Grid
- Bulk Action Bar
- Saved View controls
- Status chips
- Kanban / Pipeline cards
- Record detail side panel
- Timeline / Activity
- Task list
- KPI / Chart card
- Dialog / Popover / Drawer
- Toast / Inline feedback
- Skeleton / Empty / Error / Permission Denied / Conflict states


For each component:
- anatomy;
- variants;
- interactive states;
- Arabic/English;
- RTL/LTR;
- keyboard/focus;
- responsive behavior;
- accessibility annotation;
- developer notes.


Prototype must cover:
- desktop;
- 360px mobile;
- Arabic RTL primary;
- English LTR;
- representative permission/error/conflict states.


Exit gate:
Interactive prototype completes all eight core tasks.


---


### Wave 5 — DEV Implementation


Owner: DEV_AG.
UX authority: CREATIVE_AG.
Orchestration: TSST Lead.


Branch target after M2 closure:
`feat/crm-mvp-uiux`


Implementation rules:
- reuse existing M0–M2 APIs/services;
- UI refactor only unless an approved UX need exposes a bounded API gap;
- any API/domain change must be surfaced to TSST Lead before implementation;
- preserve RLS/RBAC/field permissions;
- use approved design tokens/components;
- implement keyboard/focus behavior, not screenshots only;
- preserve loading/error/denied/conflict states;
- responsive from 360px through desktop;
- Arabic-first RTL + English LTR.


Priority order:
1. App shell/navigation/search.
2. Contacts/Leads workspace.
3. Record side panel/details.
4. Deal pipeline.
5. Tasks/follow-up.
6. Journey.
7. Reporting/dashboard.
8. Mobile/narrow optimization.
9. Empty/error/access/conflict polish.
10. Command palette/keyboard accelerators.


Engineering acceptance:
- previous test suite remains green;
- no security/tenant regression;
- new E2E UI flows are added;
- lint/typecheck/build pass.


---


### Wave 6 — UX Validation + Visual QA


Owner: CREATIVE_AG.
Technical support: DEV_AG.
Final integration: TSST Lead.
Skills: SK-010, SK-026–030.


Run:


#### Heuristic review
- visibility/system status;
- real-world language;
- user control/recovery;
- consistency;
- error prevention;
- recognition over recall;
- efficiency;
- restrained design;
- useful error recovery;
- help only where necessary.


#### Accessibility
Baseline target:
- WCAG 2.2 AA for representative MVP flows;
- keyboard-only operation;
- visible focus;
- no keyboard traps;
- icon buttons named;
- contrast and non-color cues;
- usable touch targets;
- proper overlay focus return.


#### RTL/Bidi
Test:
- Arabic names;
- English names;
- mixed company names;
- emails;
- phone numbers;
- URLs;
- IDs;
- currencies;
- dates;
- charts/tables/forms/drawers.


#### Responsive
Test:
- 360px;
- tablet/narrow;
- standard desktop;
- large desktop;
- zoom and overflow behavior.


#### Usability tasks
1. Capture/review lead.
2. Find contact.
3. Create/update deal.
4. Move stage.
5. Create/complete task.
6. Inspect journey.
7. Read conversion report.
8. Recover from one validation/permission/conflict state.


Blocking conditions:
- core task cannot be completed;
- severe context loss;
- hidden critical action;
- keyboard trap;
- broken RTL/bidi;
- unreadable data density;
- inaccessible focus/contrast;
- destructive action without sufficient prevention/recovery;
- visual implementation materially diverges from approved system.


Exit gate:
No unresolved severity-1 or severity-2 UX finding.


---


### Wave 7 — MVP E2E Gate


Owners:
- TSST Lead — integrated acceptance;
- CREATIVE_AG — UX/visual sign-off;
- DEV_AG — engineering verification;
- one independent reviewer — final audit.


Required E2E pilot scenario:


`New lead → Contact → Deal → Pipeline progression → Follow-up Task → Won/Lost → Journey → Reporting`


Must work:
- without direct database intervention;
- under real tenant/RBAC boundaries;
- Arabic RTL;
- English LTR;
- desktop;
- narrow/mobile;
- with audit/BusinessEvent/outbox behavior preserved.


Required final gates:
- M2 independently closed;
- all M0–M2 regression tests green;
- new MVP UI/E2E tests green;
- lint/typecheck/build/diff checks PASS;
- clean install + upgrade remain valid;
- UX validation PASS;
- accessibility representative-flow PASS;
- CREATIVE implementation QA PASS;
- independent MVP audit has no blockers.


Final verdict:
- `MVP READY FOR PILOT`
or
- `MVP NOT READY` with exact blockers.


## Definition of Done


The MVP is done when a real user can operate the complete sales workflow quickly and clearly, not merely when all screens exist.


Acceptance summary:
- workspace-style UX instead of disconnected admin pages;
- native Arabic RTL and solid English LTR;
- strong tables/views/pipeline interaction;
- record inspection without needless context loss;
- fast task/follow-up operation;
- useful decision-first reporting;
- responsive mobile task flows;
- keyboard/command acceleration for expert users;
- accessible focus/interaction baseline;
- visually coherent Systronic product system;
- all existing product/security invariants preserved;
- no unresolved blocking UX/security/data issue.


## Deferred After MVP


Unless separately approved:
- Meta provider integration;
- Google Ads provider integration;
- GA4 provider integration;
- Shopify/provider connector;
- audience/segment sync;
- agency workspace;
- SaaS billing;
- advanced/ML attribution;
- AI scoring;
- broad M3+ roadmap.


A first real external lead-source integration may be added as a separate MVP extension only after explicit user approval.


## Sprint Tracking States


Use:
- `TODO`
- `IN_PROGRESS`
- `REVIEW`
- `BLOCKED`
- `APPROVED`
- `DONE`


Initial board:
- MVP-001 M2 independent audit — TODO
- MVP-002 Screen/component inventory — TODO
- MVP-003 UX audit — TODO
- MVP-004 IA + task flows — TODO
- MVP-005 Interaction model — TODO
- MVP-006 Design foundations/tokens — TODO
- MVP-007 Three UI directions — TODO
- MVP-008 User direction approval — BLOCKED by MVP-007
- MVP-009 Component system — BLOCKED by MVP-008
- MVP-010 Interactive prototype — BLOCKED by MVP-009
- MVP-011 DEV UI implementation — BLOCKED by MVP-008 + M2 closure
- MVP-012 UX/accessibility/RTL QA — BLOCKED by MVP-011
- MVP-013 E2E pilot verification — BLOCKED by MVP-012
- MVP-014 Independent MVP audit — BLOCKED by MVP-013
- MVP-015 MVP pilot-ready closure — BLOCKED by MVP-014


## Governance note


This sprint is a product-workstream execution plan. It does not close or replace the TSST operating-baseline governance gate. Durable TSST memory must record the workstream status without silently changing TSST-001A.