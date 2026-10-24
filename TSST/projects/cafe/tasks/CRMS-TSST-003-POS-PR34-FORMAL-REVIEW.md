# CRMS-TSST-003 — POS PR #34 Formal Review and Release Signoff Gate

Date: 2026-10-24
Project: CAFE_RESTAURANT_MS
Scope owner: TSST Lead / supervised manual code reviewer
Current state: `IN_PROGRESS / REVIEW-ONLY`
Target: https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34
Companion: https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/35

## Ownership / entry lock
- Registered in shared GitHub TSST before any review outcome update; don't start another developer/agent on POS lifecycle or modify branch without an assigned handoff.
- Target POS head `ca01c872a0c84039ead2713e102f4cf14a7c863f`. UX head `1bcb7cf62318d324b9bf26364d5cff240f9b2420` is one doc-only commit later; POS is 7 ahead / 1 behind UX.
- PR #34 and UX PR #35 both OPEN / DRAFT / UNMERGED. Do not merge/rebase or trigger Actions as part of this task.
- Owner historical on-target PWA full 150/150, lint/typecheck/build PASS (2026-10-20) and cashier conflict UI sample PASS; no live DB/HTTP 409 E2E proof. Preserve original scope.

## Deliverables
1. Review POS 2-file diff at fixed target SHAs, trace request IDs, selected-table state, occupancy/cancel handling, and error path; compare meaningful test assertions to source behavior.
2. Check backend authority / 409 contracts as needed, and scope release/evidence gaps without manufacturing fresh test results.
3. Severity-rank blocking/important/suggestion findings and generate formal decision `REVIEW_ACCEPTED`, `CHANGES_REQUESTED`, or `CONDITIONAL`, with exact refs.
4. Post a transparent **review comment** on PR #34 (not an approval/merge) if appropriate; update TSST task and status; stage proposed Real Memory sync packet, no canonical apply.
5. Obtain separate explicit owner merge authorization on a later turn if technically ready; never infer it from "continue".

## Constraints
- No app source changes, production DB, security/finance business rules, CI / GitHub Actions, PR merge, deployment or autonomous agent/skill promotion.
- No repeat of accepted full QA merely for historical docs-only branch drift.
- Source review is not a fresh runtime test or final deployment signoff. PR #35 remains separate.
