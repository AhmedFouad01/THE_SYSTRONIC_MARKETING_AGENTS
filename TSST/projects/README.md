# Project records

2026-09-22 | Implementation of the user-approved repository documentation policy.

Create one folder per actual project when a scoped request is received. No client execution has started from creating this directory.

Suggested structure (Lead administrative convention, not a user-prescribed filename requirement):

- 00_BRIEF.md: request, source/date, confirmed facts, open inputs, scope, acceptance criteria.
- 01_PLAN.md: executive summary + detailed phases, owners, dependencies, deliverables, quality gates, proposed timing and user approval reference. Begin DRAFT; execution waits for approval.
- 02_STATUS.md: current phase, completed/remaining work, artifacts and blockers; update at stage completion.
- 03_DECISIONS.md: approval references, version/scope, changes, impact on time/scope/priority, alternatives and recommendations.
- assignments/: handoffs using ../handoffs/HANDOFF_TEMPLATE.md (resolved from TSST root); canonical IDs per ../ID_CONVENTIONS.md.
- reviews/: self-checks, specialist QA, defects, revisions and unresolved dissent.
- deliverables/: editable sources, presentation-ready outputs and handover summary; internal acceptance and user approval tracked separately.

Do not mark an assignment executed, QA passed or a deliverable approved without evidence. Existing readiness and Decision Rights remain binding. Keep client forecasts separate from company facts.
