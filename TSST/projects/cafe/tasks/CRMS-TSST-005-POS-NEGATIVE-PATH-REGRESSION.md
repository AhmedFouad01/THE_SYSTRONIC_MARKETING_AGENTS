# CRMS-TSST-005 — POS cancellation negative-path regression and release review

Date: 2026-10-25
Coordinator: TSST Lead (supervised; no autonomous DEV_AG, skills remain UNVALIDATED)
Owner continuation: "كمل" following CRMS-TSST-004 scoped stale-claim E2E PASS.
Scope branch: `Do7a193/CAFE_RESTAURANT_MS`, `fix/crms-pos-readd-after-empty-cancel` PR #34, initial HEAD `ca01c872a0c84039ead2713e102f4cf14a7c863f`.
State: `IN_PROGRESS / FOCUSED_NEGATIVE_TESTS`

## Governance and assignment lock — before writes
- Single owner: TSST Lead supervised code review, small focused unit regression and if demonstrated necessary a minimal bug fix on PR #34 only.
- Source and existing tests reviewed first, no module-wide rewrite or UX branch changes; no other assigned developer/agent should edit these files concurrently. Use GitHub tracked revisions for every write and update status after.
- Allowed scoped paths `apps/pwa/src/pages/PosPage.tsx`, `apps/pwa/src/pages/PosPage.test.tsx`; no Edge/DB/POS finance/security/backend changes.
- Cases:
  1. Removal cancellation says table released but `releasedTableId` mismatches selected table.
  2. Authoritative occupancy says table `OCCUPIED` or contains a live tab after removal.
  3. `tableReleased=false`, especially when table still carries another live order.
  4. Occupancy read rejects *after successful server-side cancellation*: avoid carrying cancelled order state in UI; distinguish a confirmed server mutation from a failed reload.
- Historical owner full PWA 150/150 PASS at **original** head remains historical; any new code/test HEAD must be marked **UNVERIFIED** until focused test gate runs and user supplies actual output.
- No GitHub Actions, rebase, merge, PR draft-to-ready conversion, production deployment, local DB reset, force-push, permissions changes, Real Memory canonical apply.
- UX PR #35 remains independently DRAFT/unmerged. Exact integrated commit and owner signoff are separate from code readiness.
- Scope outcome to be evidence report, changed SHAs, recommended focused Windows Vitest command, and TSST status update. No claim PASS without real test output.
