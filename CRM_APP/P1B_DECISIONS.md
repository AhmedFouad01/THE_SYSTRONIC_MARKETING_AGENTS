# P1b decisions (2026-10-06)

Status: decisions 1–5 **APPROVED by the user 2026-10-07 ~02:10**. Source: `P1B_PLAN.md` §7. Authority: the user authorised the night run to proceed along the roadmap with the recommended answers (NIGHT_RUN.md §2.1).

| # | Decision | Provisional answer |
|---|---|---|
| 1 | B0 spike first, plus the §2.2/2.3 bars | **Yes.** The bars are estimates until B0 measures them. |
| 2 | B1 (migration only) ships without UI | **Yes.** It is the only exception to ADR-002 §9.1 besides B0. |
| 3 | Two-session workflow | **Deferred.** Tonight runs one session, sequentially, on `feat/crm-mvp-ui`: the server half then the UI half per slice. Two sessions can resume when the user has budget. |
| 4 | `pg_trgm` + admin CLI for `indexed` properties (max 5 per object per tenant) | **Yes, conditional.** `pg_trgm` is installed (migration 013, B6) only if B0 shows it is needed. It is a Postgres contrib extension, not an npm dependency. |
| 5 | No React Aria in B0–B7; revisit searchable multi-select after B3 | **Yes.** |

The night run will not decide alone on: new npm dependencies, anything irreversible, push, merge into master, or deploy.

## After the B0 spike (Lead, 2026-10-07 02:25; source `audits/2026-10-07/P1B_B0_SPIKE.md`)
| # | Decision | Answer and reason |
|---|---|---|
| 6 | Indexing strategy under RLS: LEAKPROOF wrappers vs typed-slot columns (F1) | **Deferred to B6, when a large customer appears.** First customers are small (thousands of rows). At 50k, B0 shows the raw JSONB paths are usable. LEAKPROOF needs a superuser plus a security review, and is possible on self-managed Postgres on the user's EC2. Nothing irreversible is shipped now. |
| 7 | GIN `jsonb_path_ops` in 010 | **No.** Under RLS it is never used, and it costs ~0.5 GB per 1M rows plus write amplification. |
| 8 | P1a OR-chain keyset (F2) | **Fix now:** use a row-value comparison for same-direction keys, which is every current sort (one key plus the id tiebreak). It is a real bug at scale and cheap to fix. |
| 9 | DESC NULLS LAST (F3) | **Use default null ordering** wherever an index must serve the sort. |
| 10 | Backfilling `custom` (F4) | **Never backfill.** `ADD COLUMN ... DEFAULT '{}'` only. |
| 11 | `evidence()` for properties (F5) | **B2 extends** the 003 integrity trigger with object_kind 'property'. |
| 12 | Schema GET size bar | **Raise to 128 KB**, with lazy option loading as a later optimisation. |
| 13 | pg_trgm / 013 | **Deferred with #6.** Not needed at 50k. |
