# CRMS-TSST-005 — POS cancellation negative-path regression and release review

Date: 2026-10-25
Coordinator: TSST Lead (supervised; no autonomous DEV_AG, skills remain UNVALIDATED)
Owner continuation: "كمل" following CRMS-TSST-004 scoped stale-claim E2E PASS.
Scope branch: `Do7a193/CAFE_RESTAURANT_MS`, `fix/crms-pos-readd-after-empty-cancel` PR #34, initial HEAD `ca01c872a0c84039ead2713e102f4cf14a7c863f`.
State: `PATCH_DELIVERED / NEW_HEAD_TESTS_NOT_RUN`

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

## Delivery checkpoint — 2026-10-25

**State:** `FOCUSED_CODE_AND_TEST_PATCH_PUSHED / NEW_HEAD_TESTS_NOT_RUN / PR34_DRAFT`

- Remote POS branch started at `ca01c872a0c84039ead2713e102f4cf14a7c863f` (original historical owner PWA 150/150 PASS). Two scoped commits added:
  - `ec4fdd8aefaa15826d707eb85ccf253fb4ae5f86`: 95 lines of focused `PosPage.test.tsx` regression tests (4 parameterized negative table-retention cases + one occupancy refresh failure case).
  - `febc7e75e3539a89531365d2b0161bd7be474e59`: minimal change `PosPage.tsx` (16 additions, 1 deletion) to clear cancelled draft and selected-table choice if server-side removal succeeded but follow-up occupancy refresh errors; warn operator to refresh table data before another order.
- Exact remote HEAD after change: `febc7e75e3539a89531365d2b0161bd7be474e59`, branch `fix/crms-pos-readd-after-empty-cancel`, PR #34, 2 more commits/0 behind earlier head; only 2 changed frontend paths.
- Tests added for (1) mismatched releasedTableId; (2) refreshed table OCCUPIED; (3) live tab detected despite table status AVAILABLE; (4) tableReleased=false; and (5) refresh throwing after successful removal. Scope specifically excludes Edge, DB, finance, KDS, hardware, security, and UX branch.
- **CRITICAL EVIDENCE RULE:** No fresh Vitest/typecheck/lint/build ran in this assistant session; no CI ran. New commit test status `UNVERIFIED`. Historic 150/150 PASS applies to older `ca01c872`, **not** `febc7e75`. In particular, do not merge PR #34 until new exact-head focused test/TypeScript results are captured and reviewed.
- Recommended owner Windows manual gate from verified exact checked-out candidate, after safely stopping currently running dev/watch processes and `git pull --ff-only` on a clean working tree:
  ```powershell
  cd C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS
  git status --short
  git pull --ff-only origin fix/crms-pos-readd-after-empty-cancel
  git rev-parse HEAD
  pnpm.cmd --dir apps/pwa exec vitest run src/pages/PosPage.test.tsx --config vitest.config.ts --pool=threads --maxWorkers=1 --no-file-parallelism
  pnpm.cmd --filter @crms/pwa typecheck
  pnpm.cmd --filter @crms/pwa lint
  ```
- Once focused gates pass: optional PWA build and targeted manual cancellation/re-add smoke at 390×844 only when needed; owner approval separately required before PR #34 POS -> UX integration, and later PR #35 UX -> main.
- Previous CRMS-TSST-004 QA-T03 stale-selection 409/E2E scoped PASS at old HEAD remains a real historical observation; **this new HEAD has not received a fresh E2E pass**.
- No GitHub Actions, PR merge/rebase, draft-ready toggle, production data work or Real Memory canonical write.
