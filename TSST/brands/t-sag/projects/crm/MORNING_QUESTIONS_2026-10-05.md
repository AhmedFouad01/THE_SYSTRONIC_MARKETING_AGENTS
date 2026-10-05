# CRM MVP — morning questions (2026-10-05)

Status: PAUSED (usage limit). Done+committed S0–S8 (HEAD 86f0e67, all green: unit 197, db 81, bootstrap 4, ui 82). S9 Reporting WIP UNCOMMITTED in worktree (unverified) — resume agent or rerun S9, then S10 Dashboard, S11 Admin, S12 E2E + retire old web/*.html. Branch `feat/crm-mvp-ui` in off-Drive worktree `C:\Work\tsst-crm-mvp` (not pushed). Local Postgres left running.
Lead decisions D1–D6: `CRM_APP/MVP_UI_IMPLEMENTATION_MAP.md` §6.

## Questions (recommended option first)
1. Push `feat/crm-mvp-ui` + open PR? → Recommend: yes, after review (not done overnight).
2. PowerShell 7 was installed via winget by a worker (needed by `scripts/native-local.ps1`). Keep? → Recommend: keep.
3. M2_EVIDENCE baseline says 82 tests; actual baseline is 99 (81 db incl. m1-remediation, 4 bootstrap, 14 ui). Correct the evidence line? → Recommend: yes, a one-line note.
4. Arabic copy for worker-written keys (6 in S1 marked `// new`, + S2/S3 shell, grid, overlay keys) (`locale.label`, `common.notAvailable`, `state.loading|empty|error|retry`) in `CRM_APP/app/src/ui/i18n/ar.ts` (marked `// new`) was written by the worker, not taken from the handoff. Native review? → Recommend: quick review by you.
5. Fonts: handoff gives font stacks only (system fallback; nothing loaded). Self-host font files? → Recommend: keep system stacks for MVP.
6. Dark `disabledBg` conflict: CRM prototype #1A2230 vs Design System #202936. Used CRM value. → Recommend: keep CRM value.
7. Mobile data grids (≤720px) stay horizontally scrollable tables (per RTL_RESPONSIVE), not card lists. → Recommend: keep.
8. API gaps G1–G6 (`CRM_APP/MVP_UI_IMPLEMENTATION_MAP.md` §7) were worked around client-side; e.g. Leads KPI strip/score columns omitted (no API fields). Schedule a bounded API slice after MVP? → Recommend: yes, post-MVP, separate approval.
9. Security note: a worker printed the LOCAL synthetic dev DB credentials (worktree `.env`, loopback 127.0.0.1:55432 only) into its own tool output once. Not written to any file/commit. Rotate local dev creds? → Recommend: yes, cheap — recreate the local cluster/.env (off-Drive, synthetic).
