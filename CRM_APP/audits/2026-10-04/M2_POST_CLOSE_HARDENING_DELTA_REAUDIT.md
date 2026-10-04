# M2 Post-Close Hardening — Independent Delta Re-Audit — 2026-10-04

**PASS WITH NON-BLOCKING FINDINGS.**

Branch `chore/crm-m2-post-close-hardening` from `a926b9d` (M2 CLOSED @ `3bd3fcb`). M2 is not reopened; this is separate hardening of R-01, R-02, R-04 and D-01 from [INDEPENDENT_M2_REAUDIT.md](INDEPENDENT_M2_REAUDIT.md) and [INDEPENDENT_M2_R03_DELTA_REAUDIT.md](INDEPENDENT_M2_R03_DELTA_REAUDIT.md).

Implementer and re-auditor were separate `tsst-code-worker` runs (Sonnet 5.5); TSST Lead reviewed the diff and accepted.

## Phase 1 — dev-cluster data check (read-only)

The only persistent cluster (local development, `127.0.0.1:55432`, database `crm_m0`) was inspected with `default_transaction_read_only=on` inside `BEGIN READ ONLY … ROLLBACK`: `public.crm_migrations` holds versions 1–4 only; `crm.source_receipt` and `crm.collection_site` do not exist; 488 tenants, all synthetic "Tenant A"/"Tenant B" fixtures; loopback only. The cluster was not running beforehand, was started with its own data directory for the check and stopped again. The duplicate queries could not run because the table does not exist: **no 006-era data exists, so R-01/R-02 have no affected data.**

## Delta

| File | Change | Item |
|---|---|---|
| `tests/m2.test.ts` | M2-25 sends mixed/upper-case `campaign_id`, asserts replay identity and touchpoint campaign; new M2-30 holds the canonical tenant advisory lock on a second connection and asserts UPPER/mixed-case-tenant requests block until release | R-04 |
| `scripts/m2-clean-check.ts`, `scripts/m2-upgrade-check.ts` | `mkdir("../m2-runtime", {recursive:true})` before writing results | D-01 |
| `README.md:23,84`, `M2_CONTRACTS.md:132` | Migration chain wording 001–007 | R-04 |
| `M2_EVIDENCE.md` | R-01/R-02 data-exposure disposition with verification method; accepted as documented limits; no backfill or runtime change | R-01, R-02 |

No migration, `journey.ts`, `api.ts`, replay behavior, M2-F03..F17, M3, readiness or TSST change.

## Independent checks

| Check | Result |
|---|---|
| Scope | Only the files above; migrations and `src/*` cmp-identical. PASS |
| M2-30 contention | Holder uses the exact `lock()` key; UPPER and mixed-case requests pending at 400 ms, complete after COMMIT. Negative control: `lock()` reverted to `hashtextextended($1,2)` → M2-30 fails. Holder released in `finally`; no leak; timing window can only false-pass, not false-fail. 4/4 runs ≈1 s. PASS |
| M2-25 campaign | Negative control: 007 campaign canonicalization blanked → M2-25 fails. PASS |
| D-01 | Fresh copy with no `../m2-runtime`: both scripts succeed and create their result files. PASS |
| Docs | Chain wording matches `migrate.ts` (7 entries, 7 files); no production-verification claim. PASS (H-01 resolved by Lead, below) |

## Gates (fresh copy, fresh initdb PostgreSQL 17.10, 127.0.0.1:55438, synthetic data)

| Command | Result |
|---|---|
| Targeted M2-25 / M2-28 / M2-30 | 3/3 |
| `npm run test:db` | **81/81** |
| `npx playwright test` | **14/14** |
| `npm run lint` / `typecheck` / `build` | clean / clean / clean |
| `m2-clean-check` 001→007 | PASS, 47 tables |
| `m2-upgrade-check` | PASS, 48 rows preserved |
| `m2-f01-upgrade-check` | PASS |

Implementer gates matched (81/81, 14/14, all scripts PASS). Teardown verified in both runs: server stopped, no postgres processes, no listeners on 55438/4317/4399, disposable `.env` files deleted. Dev cluster and developer `.env` not touched by either gate run.

## Findings (non-blocking)

| ID | Finding | Disposition |
|---|---|---|
| H-01 | `M2_EVIDENCE.md` dev-cluster claim lacked its verification method (re-auditor was barred from the dev cluster) | Resolved by Lead before commit: method and observed values added; docs only |
| H-02 | `m2-upgrade-check.ts` reports `"001-005 -> 006"` and applies only 006; accurate (007 covered by `m2-f01-upgrade-check`) but potentially confusing | Backlog |
| H-03 | M2-28 alone still passes with the pre-F02 `lock()` | Covered by M2-30; informational |
| H-04 | Validation scripts need a pre-clean disposable cluster (cannot drop `crm_runtime` while another database depends on it) | Harness note; backlog |

## Verdict

**PASS WITH NON-BLOCKING FINDINGS.** R-04 and D-01 closed; R-01 and R-02 closed as documented limits with no affected data.
