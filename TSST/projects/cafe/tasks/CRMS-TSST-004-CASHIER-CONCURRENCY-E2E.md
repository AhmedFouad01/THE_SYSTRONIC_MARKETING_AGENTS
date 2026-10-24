# CRMS-TSST-004 — Cashier Concurrency E2E Verification

Date: 2026-10-24
Project: `CAFE_RESTAURANT_MS`
TSST coordinator: supervised/manual TSST Lead
Owner-approved task scope: continue last checkpoint and prepare/attempt focused cashier concurrency QA, without authorizing merges, code changes to application, CI or production.
State: `IN_PROGRESS / QA_EVIDENCE_RECONCILIATION`
Upstream: [CRMS-TSST-003](../reviews/CRMS-TSST-003-POS-PR34-FORMAL-REVIEW.md)

## Lock before work
- Shared task ownership locked to this single QA evidence task; no developer or agent should modify same POS behavior in parallel.
- Target POS [PR #34](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34), candidate `ca01c872a0c84039ead2713e102f4cf14a7c863f`; UX [PR #35](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/35) remains separate draft.
- Historical owner local PWA 150/150 PASS, typecheck/lint/build PASS (2026-10-20); do NOT re-run unchanged full suite without source risk.
- Acceptance: prove through actual QA-runtime interaction (not static/mocked tests) that cashier B claims test table, cashier A attempts stale claim, POST /pos/table-tabs produces HTTP 409, UI shows alert, no duplicate live tabs, orders, or items. Evidence must not include bearer tokens or personal/real business records.
- If owner QA browser/DB is not available through connected tools, mark E2E `NOT_EXECUTED`, publish a safe focused runbook and exact proof requirements. Do not claim PASS.
- Inspect code/tests/migrations only as needed to make runbook grounded.
- No application code changes, GitHub Actions, merges, branch rebases, deployments, production writes, remote execution assumptions, or Real Memory canonical apply. Stage Real Memory intake if useful, with governed apply.
