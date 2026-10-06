# P1b decisions (2026-10-06)

Status: **PROVISIONAL (Lead, night run). The user confirms in the morning.** Source: `P1B_PLAN.md` §7. Authority: the user authorised the night run to proceed along the roadmap with the recommended answers (NIGHT_RUN.md §2.1).

| # | Decision | Provisional answer |
|---|---|---|
| 1 | B0 spike first, plus the §2.2/2.3 bars | **Yes.** The bars are estimates until B0 measures them. |
| 2 | B1 (migration only) ships without UI | **Yes.** It is the only exception to ADR-002 §9.1 besides B0. |
| 3 | Two-session workflow | **Deferred.** Tonight runs one session, sequentially, on `feat/crm-mvp-ui`: the server half then the UI half per slice. Two sessions can resume when the user has budget. |
| 4 | `pg_trgm` + admin CLI for `indexed` properties (max 5 per object per tenant) | **Yes, conditional.** `pg_trgm` is installed (migration 013, B6) only if B0 shows it is needed. It is a Postgres contrib extension, not an npm dependency. |
| 5 | No React Aria in B0–B7; revisit searchable multi-select after B3 | **Yes.** |

The night run will not decide alone on: new npm dependencies, anything irreversible, push, merge into master, or deploy.
