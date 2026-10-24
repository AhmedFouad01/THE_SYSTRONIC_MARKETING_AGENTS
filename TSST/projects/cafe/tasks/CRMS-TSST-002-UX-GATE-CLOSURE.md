# CRMS-TSST-002 — UX Gate Closure & Draft PR Preparation

Date: 2026-10-24
Coordinator: TSST Lead (supervised/manual; DEV_AG NOT_READY, skill packs UNVALIDATED)
State: `IN_PROGRESS / DOCS_ONLY`
Ownership lock: UX evidence reconciliation and proposed PR preparation. Single reviewer/coordinator; no parallel module ownership activated.

## Entry refs (read before edit)
- Cafe repo: `Do7a193/CAFE_RESTAURANT_MS`
- Main: `5cb20959b35e17620d799e0026d09d881f2c6ad8`
- UX base branch: `feat/crms-ux-final-visual-system` at `d069073cc17959dbd3e46fffb1ff51d70fe0c332` (39 ahead/0 behind main)
- POS draft PR #34: `ca01c872a0c84039ead2713e102f4cf14a7c863f` -> UX branch; **not merged**.
- Historical local QA from canonical RM and PR #34 comment: PWA full 22/22 files 150/150 PASS, lint/typecheck/build PASS on POS+UX candidate exact POS commit, owner A/B cashier UI smoke; not a new run.

## Scoped deliverables
1. Reconcile UX gate header, acceptance criteria, evidenced pass, deferrals and pending decisions without erasing historical checkpoints.
2. Explain the POS branch test ancestry vs UX branch doc-only changes; do not overclaim tested new HEAD.
3. Record issue #32 fix-source and historical viewport evidence; retain issue OPEN pending explicit accepted disposition.
4. Prepare a separate **DRAFT** UX->main review PR with exact documented scope (no merge, no deployment, no Actions) if safe and supported by API.
5. Recheck stacked PR #34 references and prepare a follow-up only if necessary.
6. Update TSST status and stage a Real Memory pending proposal (review/apply separate).

## Prohibited / boundaries
- Do not touch application logic, CSS, API, DB, finance, auth, printing, KDS or production/customer data.
- Do not merge PR #34, UX->main or other PRs. No branch rebase, push to POS branch or GitHub Actions.
- Do not mark fresh local test PASS, concurrent HTTP409/PostgreSQL race PASS, or physical hardware PASS.
- Do not promote skills, activate autonomous agents, change TSST Core, or apply canonical Real Memory.
- User's collaboration rule: record assignment and ownership **before changing source docs**, then update on delivery.

## Required closure evidence
- Published updated UX gate document with verified URL and HEAD after doc update.
- Draft UX->main PR reference if creation succeeds, or clearly report blocker.
- Unresolved signoffs enumerated and no merge authority implied.
