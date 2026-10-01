# Product scope / نطاق المنتج

## Confirmed context
- Systronic needs its own extensible CRM, with future SaaS distribution.
- Campaign tracking, buyer journeys, lead stages and Meta/Google integration are first priorities.
- Agency monthly marketing operations remain in scope, sequenced after the core journey.
- Initial business profiles: agency, online supplements, kitchens/finishing.

## Product outcome
For each authorized business, answer: where did a lead come from, what happened next, who owns the next action, what commercial outcome occurred, and which campaign contributed under an explicit attribution rule?

## Personas
Tenant owner; sales manager; sales rep; marketing analyst; account manager; client approver; platform operator. Systronic staff access client tenants through explicit grants, not automatic global visibility.

## MVP / pilot boundary
P0 denotes the complete pilot scope, not simultaneous delivery in the first slice. Two gates preserve this scope:

- **Foundation / Vertical Slice (M0–M1):** M0 evaluates the foundation; M1 delivers authenticated manual lead intake, contacts/deals, stage transitions, follow-up tasks, minimal internal automation, audit/outbox and explicit RBAC/scoped grants. Synthetic data only until applicable privacy controls are available.
- **Pilot Completion (M2–M4):** all P0 acceptance criteria, including the remaining intake channels, tracking/attribution, providers, segmentation, commerce/service profiles, privacy subject workflows and complete authorized tenant portability. External eligibility blockers require resolution or an explicit owner-approved scope change before claiming completion.

1. Tenants, memberships, permissions, audit history and Arabic/English UI.
2. Contacts, lead intake, deduplication review, configurable sales pipelines and follow-ups.
3. First-party web events and explicit identity association; campaign taxonomy and UTMs.
4. Meta lead intake and conversion delivery; Google conversion delivery through a currently eligible API path; GA4 as a separate destination.
5. Versioned first/last-touch attribution, campaign costs, sales outcome reports.
6. Dynamic rule-based segments; controlled audience synchronization after provider eligibility is proven.
7. Thin domain records: commerce orders/status updates and service opportunities/appointments. Existing stores remain order authorities.
8. Separate subject privacy export/deletion and tenant-wide portability: authorized machine-readable tenant data, relationships and accessible attachments, with manifest and documented exclusions. Secrets and other tenants' data never enter an export.

## Next release
Agency monthly plans, deliverables, immutable asset versions, approvals, client portal, workload views; service project milestones and change requests; commerce retention journeys. These are not silently included in MVP delivery estimates.

## Later SaaS commercialization
Self-service tenant provisioning, plans/entitlements, metering, subscriptions, platform support tooling, custom domains, enterprise identity, partner marketplace. Tenant boundaries and exportability are MVP requirements even though billing is later.

## Explicit exclusions for first release
Full ERP/accounting/payroll; manufacturing/BOM; inventory authority; replacing checkout/shipping systems; ad buying/budget mutation; probabilistic fingerprinting; cross-client identity graph; autonomous customer messaging; AI-generated scoring as a prerequisite; microservices.

## Reference journeys
Agency: inquiry → discovery → proposal → won/lost → onboarding → monthly plan → delivery → renewal.
Supplements: identified inquiry and/or direct order → confirmed → fulfilled → delivered/returned; payment is a separate status. Direct purchases do not require a fabricated lead/deal.
Kitchens: inquiry → qualification → appointment → survey → quote versions → won/lost → project milestones → handover. Appointment outcome is not a sales stage; delivery project is not a deal.

## Success indicators
Measure lead response latency, overdue follow-ups, qualified-lead ratio, stage conversion, cycle time, attributed versus unattributed revenue, delivered/paid order value, synchronization failures and duplicates prevented. Targets require baseline measurement; do not invent revenue uplift claims.

## Working assumptions
Web-first responsive Arabic RTL/English LTR; Egypt initial operations with configurable timezone/currency; multiple client businesses; store and ad-account access not yet provided. Exact volumes, budget, deployment region and preferred existing stack remain unknown. These do not prevent conceptual design; they gate production sizing and connector setup.
