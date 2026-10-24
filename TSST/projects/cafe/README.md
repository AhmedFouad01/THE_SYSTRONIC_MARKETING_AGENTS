# CAFE — TSST project onboarding pointer

Date: 2026-10-24
Owner instruction: "عايزين نستخدم TSST على مشروع cafe"
TSST project ID: `cafe`
Real Memory key: `CAFE_RESTAURANT_MS`
State: `SETUP_STAGED / SUPERVISED_ROUTING / NO NEW ENGINEERING EXECUTION`
Routing: TSST Lead -> DEV_AG for **separately scoped, owner-approved** engineering assignments. DEV_AG remains `NOT_READY`; onboarding does not make it autonomous.
Skills executed during onboarding: **none**. Skill selection below is a future routing suggestion; all 16 DEV skills currently `UNVALIDATED`.

## Source-of-truth map

- Product repository: [Do7a193/CAFE_RESTAURANT_MS](https://github.com/Do7a193/CAFE_RESTAURANT_MS), default `main`.
- Project memory: [01_PROJECTS/CAFE_RESTAURANT_MS](https://github.com/AhmedFouad01/real-memory-os/tree/main/01_PROJECTS/CAFE_RESTAURANT_MS). Preserve prior checkpoints; do **not** overwrite its current status during intake.
- Intake packet (proposed, not applied): [2026-10-24_CAFE_RESTAURANT_MS_TSST_SETUP.rm-sync.md](https://github.com/AhmedFouad01/real-memory-os/blob/main/05_GLOBAL_SYNC_INBOX/chatgpt/pending/2026-10-24_CAFE_RESTAURANT_MS_TSST_SETUP.rm-sync.md).
- [TSST status](status.md) is an operational pointer, not a replacement for code, signed QA evidence or governed Real Memory.

GitHub refs and diffs are authoritative for source state; exact-head local build/test evidence is authoritative for QA; Real Memory is the reviewed continuity record. Default `main` is **not** presumed to equal customer deployment.

## Reconciled continuation anchor (2026-10-24 intake)

- `main` last observed head `5cb20959b35e17620d799e0026d09d881f2c6ad8`: operational POS/KDS/Billing/Printing merge (2026-10-12). Do not reopen already finished operational gates without changed-risk evidence.
- UX workstream `feat/crms-ux-final-visual-system` is unmerged. Draft [POS PR #34](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/34) head `ca01c872a0c84039ead2713e102f4cf14a7c863f`, base UX branch, OPEN/DRAFT/UNMERGED as of this intake.
- Real Memory 2026-10-20 evidence: owner Windows exact-HEAD/clean-tree check, PWA 22/22 test files and **150/150** tests PASS; lint, typecheck and PWA build PASS. These are **reported local evidence**, not rerun by TSST in this onboarding.
- Manual cashier A/B conflict UX screenshot demonstrates visible warning, empty ticket, EGP 0 and disabled submit. It does **not** prove an HTTP 409 trace or unique live-tab row count; preserve this specific residual evidence boundary.
- Responsive drawer/layout and POS/Billing screen smoke passed at sampled viewports; these are not blanket device certification.
- Draft [PRINT03 PR #31](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/31) is independent; physical printer/drawer test is deferred. Draft [Settings/Printer PR #23](https://github.com/Do7a193/CAFE_RESTAURANT_MS/pull/23) is also separate.
- Existing local-first rules: Edge PostgreSQL is financial/transactional truth, Redis/cache is nonauthoritative, post/financial entries are append-only with compensating corrections, and site/table isolation and idempotency matter.
- The Hybrid multi-developer/AI collaboration agreement remains deferred, **not activated**.

## Future TSST work routing

Read [status.md](status.md) and the latest linked PR/branch at the beginning of a work session; perform a scoped `OBSERVE -> VERIFY REF -> PLAN -> ISOLATE -> EXECUTE -> BUILD -> TEST -> VERIFY -> UPDATE RM` process **only after applicable approval**.

- Lead: approval boundary, scope decomposition, collision avoidance and review.
- DEV_AG/POS + QA: `TSST-DEV-SK-010` (debugging), `SK-011` (regression), `SK-012` (change-risk review), `SK-015` (verification).
- DEV_AG/edge/concurrency: `SK-009` (partial failure), `SK-006` (database) and `SK-008` (security) only if a specific risk warrants them.
- DEV_AG/printing/release: `SK-013` (release/CI gates) and `SK-015`; physical hardware proof cannot be replaced by source inspection.
- Use skills manually under Lead supervision, with evidence and a clear handoff. Do not represent skill packages as validated or independent background agents.

## Hard boundaries

- No automatic merge, GitHub Actions, deployment, customer database mutation, price/accounting change, activation of Hybrid teamwork or broad test reruns from this request.
- `PR #34 -> UX branch -> main` is a possible **post-approval** merge order, not authorization to merge.
- This is a project-local TSST pointer. TSST Core freeze through 2026-11-15 is preserved; no `TSST/core/portfolio.yaml` change or portfolio auto-discovery.
- RM intake is proposal-only; canonical project memory promotion needs review, exact targets and controlled apply. Preserve the prior 2026-10-20 memory checkpoint.
