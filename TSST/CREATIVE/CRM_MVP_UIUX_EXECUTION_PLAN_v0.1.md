# CRM MVP UI/UX Execution Plan v0.1


Owner: TSST Lead
Creative owner: CREATIVE_AG
Internal execution: DESIGNER_AG may support UI composition under CREATIVE_AG.
Date: 2026-10-03
State: PLAN / USER-DIRECTED UI/UX PRE-MVP WORKSTREAM


## Objective


Build a distinctive, high-efficiency Arabic-first CRM product experience before MVP release. The goal is not to reskin the current screens; it is to define a coherent product UX architecture, reusable design system, interaction model and validated visual language that can scale through MVP and later SaaS stages.


## Current boundary


- Preserve M0/M1/M2 product behavior and security invariants.
- UI/UX work may reorganize navigation, views, layout, interaction and presentation.
- Product/backend semantics, authorization rules, data truth, attribution logic and milestone scope may not be silently changed by CREATIVE_AG.
- All new UI/UX skills are installed as UNVALIDATED until tested on the CRM MVP.
- No copied third-party identity or screen recreation. References are principle/pattern inputs only.


## Existing CREATIVE strengths to reuse


- Brand System Architecture
- Brand Guidelines Engineering
- Design Tokens
- Visual Hierarchy & Layout
- Typography System
- Color System & Accessibility
- Creative Art Direction
- Visual QA & Brand Compliance


## New UI/UX skill pack


- SK-020 Product UX Architecture & Information Architecture
- SK-021 Enterprise Workspace Navigation & Context Management
- SK-022 CRM Data Grids, Tables, Views & Bulk Actions
- SK-023 Master-Detail Records, Drawers & Contextual Actions
- SK-024 Command Palette & Keyboard-First Productivity
- SK-025 Forms, Validation & Error Recovery
- SK-026 Arabic-First RTL/Bidi Product UX
- SK-027 Accessible Interaction & WCAG 2.2
- SK-028 Responsive & Adaptive SaaS Layouts
- SK-029 Dashboard & Data Visualization UX
- SK-030 Usability Testing, Heuristic Evaluation & UX QA


## Reference families to study — principles, not copies


### Linear
Study: low-noise shell, hierarchy, keyboard/productivity feel, contextual commands, restraint.


### Attio
Study: CRM objects/lists/views, table/kanban duality, record preview/details, sidebar structure, quick actions.


### Stripe
Study: metric hierarchy, progressive drill-down, clear financial/reporting states, operational clarity.


### Vercel
Study: context-aware navigation, collapsible hierarchy, clean product shell, environment switching patterns.


### Superhuman / Front class workflows
Study: inbox/master-detail behavior, rapid triage, keyboard efficiency and persistent context.


### Carbon / PatternFly / Atlassian
Study: enterprise-grade tables, toolbars, density, accessibility, design-system rules and data visualization.


### W3C / WCAG / ARIA APG
Use as accessibility and keyboard-interaction authority.


## Execution phases


### Gate UX-00 — Product inventory
CREATIVE_AG + TSST Lead inspect the current M0–M2 UI and list every MVP surface, action, state and permission-dependent variation.


Deliverables:
- screen inventory;
- component inventory;
- user-role/task matrix;
- UX debt list;
- current-vs-required gaps.


Exit:
No new visual direction until the real product surface map is complete.


### Gate UX-01 — Task architecture / IA
Define the MVP daily jobs first:
- capture/review lead;
- find/open contact;
- create/update deal;
- move stage;
- create/complete follow-up;
- review customer journey;
- inspect reporting;
- manager/admin oversight as required by existing scope.


Deliverables:
- task flows;
- information architecture;
- navigation model;
- click-depth/context-loss map.


Target principle:
CRM should behave as a workspace, not a collection of disconnected admin pages.


### Gate UX-02 — Interaction model
Define:
- persistent app shell;
- collapsible sidebar;
- tabs/views;
- table + kanban behavior;
- master-detail / side panel;
- command palette;
- keyboard shortcuts;
- contextual actions;
- drawers/modals/popovers;
- bulk actions;
- saved filters/views;
- empty/loading/error/permission/conflict states.


Exit:
Every MVP task has a complete interaction path in low fidelity.


### Gate UX-03 — Visual foundations
Build CRM-specific product design system:
- color roles;
- light/dark strategy if approved;
- Arabic/Latin typography;
- spacing scale;
- density modes;
- radii/borders/elevation;
- icon grammar;
- focus/hover/selected/disabled/error states;
- chart/data-viz tokens;
- motion rules;
- RTL/LTR logical tokens.


Figma variables/tokens should map cleanly to code tokens.


### Gate UX-04 — Three product directions
CREATIVE_AG produces 3 genuinely different high-fidelity directions from the same approved UX architecture.


Required:
1. Productivity-first / Linear-class restraint.
2. CRM workspace / Attio-class data interaction.
3. Distinct Systronic premium direction combining efficiency with brand character.


Each direction must show:
- Home/work queue;
- Leads or Contacts table;
- Deal pipeline;
- record detail;
- tasks/follow-up;
- reporting;
- command palette;
- Arabic RTL;
- mobile/narrow state.


User selects one direction or a controlled hybrid.


### Gate UX-05 — Component system
Convert chosen direction into reusable components and patterns:
- app shell/sidebar/header;
- command palette;
- buttons/icon buttons;
- inputs/select/combobox;
- tabs;
- filters;
- table/grid;
- bulk action bar;
- status chips;
- kanban;
- record side panel;
- timeline/activity;
- task list;
- KPI/chart cards;
- dialogs/popovers/toasts;
- skeleton/empty/error/access-denied/conflict states.


Each component gets:
- anatomy;
- variants;
- states;
- RTL/LTR behavior;
- keyboard behavior;
- responsive behavior;
- accessibility annotation;
- dev notes.


### Gate UX-06 — Interactive Figma prototype
Build the selected MVP flows as a clickable prototype using the real component system.


Must include:
- Arabic RTL primary;
- English LTR;
- desktop;
- 360px/mobile;
- keyboard/focus annotations;
- realistic synthetic data.


### Gate UX-07 — UX validation
Run:
- heuristic review;
- accessibility review;
- task-based usability checks;
- visual consistency review;
- RTL/bidi QA;
- responsive QA.


Blockers:
- failed core task;
- hidden critical action;
- lost context/state;
- keyboard trap;
- broken RTL/bidi;
- unreadable density;
- inaccessible focus/contrast;
- destructive action without prevention/confirmation/recovery.


### Gate UX-08 — DEV handoff
CREATIVE_AG hands to engineering:
- Figma source;
- component inventory;
- design tokens;
- interaction specs;
- state matrix;
- responsive behavior;
- accessibility notes;
- implementation priority;
- screenshots/annotations;
- no ambiguous 'make it like Figma' handoff.


### Gate UX-09 — Implementation visual QA
CREATIVE_AG reviews implemented screens against approved design:
- structure;
- spacing;
- typography;
- color;
- component behavior;
- responsive;
- RTL;
- keyboard/focus;
- loading/error/permission states.


UI is not accepted from screenshots alone where interaction behavior matters.


## MVP UX acceptance targets


- Core daily tasks are reachable with minimal context switching.
- Frequent expert actions have optional keyboard/command shortcuts.
- Lists preserve filters, selection and scroll when previewing records.
- Arabic RTL is native, not a mirrored patch.
- Tables are dense but readable and support clear view/filter/bulk-action patterns.
- Reporting leads with decisions/KPIs and provides drill-down instead of chart overload.
- Mobile is task-prioritized rather than desktop squeezed smaller.
- Every interactive state has keyboard/focus behavior.
- Visual identity is recognizably Systronic CRM without copying reference products.


## Governance


TSST Lead owns task routing, approval gates and final handoff.
CREATIVE_AG owns product UX/visual direction and visual QA for this workstream.
DESIGNER_AG may execute component/screen production under CREATIVE_AG.
Engineering owns implementation feasibility and code quality; it may not silently redesign approved UX.
Any scope/functionality change discovered during UX work is raised to TSST Lead before implementation.