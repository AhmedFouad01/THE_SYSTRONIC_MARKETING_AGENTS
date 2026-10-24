# CRMS-TSST-003 — POS PR #34 Formal Review and Release Signoff Gate

Date: 2026-10-24
Project: CAFE_RESTAURANT_MS
Scope owner: TSST Lead / supervised manual code reviewer
Current state: `SOURCE_REVIEW_DELIVERED / RELEASE_SIGNOFF_PENDING`
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

## Delivery — 2026-10-24

**Source review complete; Release Signoff PENDING.** Scope-specific decision: `CONDITIONAL CODE REVIEW PASS / NO MERGE`. No new blocking defect confirmed in PR #34 two-file diff, but real HTTP 409/DB cardinality proof and owner approval remain outstanding.

- [Full TSST-003 technical review and risk matrix](../reviews/CRMS-TSST-003-POS-PR34-FORMAL-REVIEW.md), published commit `b63f1c66b8e8631ac85382b5c1bcd7920939e531`.
- PR #34 informational review comment ID `6384716095` posted (NOT a GitHub `APPROVE` review). PR remains DRAFT/OPEN.
- Confirmed API `releasedTableId` and cancellation response contract; backend `FOR UPDATE` table lock, `pos.controller` mapping to 409, PWA EdgeApiError conflict classification, scoped new UI error placement and re-add tests.
- Findings: `R-01 IMPORTANT` live simultaneous 409/DB E2E evidence missing (recommended focused QA); `R-02 IMPORTANT` negative-branch assertions missing for occupied/mismatched released table or failed occupancy read; `R-03 MINOR` fallback generic error on failed occupancy read; `R-04 PROCESS` PR remains DRAFT/no owner approval.
- Historical owner exact-sha PWA 150/150 PASS and lint/typecheck/build PASS retained, **not rerun**. No source file modification, PR merge/rebase, GitHub Actions, DB or financial operation was performed.
- One UX gate **docs-only** commit `1bcb7cf6` makes POS compare now +7/-1 relative to UX tip; does not imply app source drift.
- [UX->main PR #35](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/35) remains separate draft and unmerged. No issue closure.
- Next potential governed task: `CRMS-TSST-004` one targeted safe A/B QA evidence / explicit accepted deferral, then request separate owner authorization before POS->UX merge.
