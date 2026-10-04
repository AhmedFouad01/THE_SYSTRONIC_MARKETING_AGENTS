# Implementation Sequence


## Phase 0 — Repository audit
Claude must first inspect the real frontend repository and produce:
- reusable code inventory
- conflicting/obsolete UI inventory
- proposed target folder architecture
- affected file map
- migration order
- test strategy


Do not change backend business logic.


## Phase 1 — Production UI Core
Implement:
1. tokens/theme
2. locale/direction
3. icons
4. primitives
5. AppShell
6. overlays/interactions
7. data-workspace primitives


## Phase 2 — Existing MVP core screens
Migrate:
1. Leads
2. Contacts
3. Deals


Preserve Lead → Contact → Deal context.


## Phase 3 — Next MVP modules
Current working sequence:
1. Pipeline
2. Tasks / Follow-up
3. Dashboard
4. Reporting


## Phase 4 — Wire deferred actions
Implement real flows for prototype controls currently disabled:
- Import
- New Lead
- Email
- Call


## Rule for new components
Reuse → Compose → identify gap → add shared component → document contract → use in feature.


Never create a one-off feature component when the requirement is globally reusable.