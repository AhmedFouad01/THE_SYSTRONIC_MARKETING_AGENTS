# Independent M2 Re-Audit — 2026-10-04

**PASS WITH NON-BLOCKING FINDINGS — M2-F01 closed; M2 may close.**

Scope: remediation diff for M2-F01 (with adjacent M2-F02) and the gates it affects only. Not a full M2 re-audit. Original audit: [INDEPENDENT_M2_AUDIT.md](INDEPENDENT_M2_AUDIT.md). Remediation evidence: [M2_F01_REMEDIATION_EVIDENCE.md](M2_F01_REMEDIATION_EVIDENCE.md).

Audited state: implementation `ba841c9`, HEAD `acd0398`, plus the **uncommitted** working-tree remediation on `feat/crm-m2-journey-reporting`. The re-auditor was a separate `tsst-code-worker` (Sonnet 5.5) that did not author the fix; TSST Lead (main session) reviewed the diff and accepted the verdict.

## Remediation under review

| File | Change |
|---|---|
| `migrations/007_collect_event_canonical_id.sql` | New. `CREATE OR REPLACE crm.collect_event`: canonical lowercase UUID for `event_id` used in lookup, both inserts and request hash; visitor/session/campaign canonicalized in hashed body; legacy non-canonical receipts found via partial expression index `source_receipt_site_canonical`; legacy hash fallback. No rows rewritten. |
| `scripts/migrate.ts` | Registers version 7. |
| `scripts/m2-clean-check.ts` | Adds 007 to clean-install chain. |
| `scripts/m2-f01-upgrade-check.ts` | New. Reproduces defect on real 006, applies 007, verifies legacy rows byte-identical and replay. |
| `src/journey.ts:47-54` | M2-F02: `lock()` hashes `$1::uuid::text`. |
| `tests/m2.test.ts` | M2-23..M2-28. |
| `M2_CONTRACTS.md:50-51` | One-line canonical-id clarification. |

`006_journey_reporting.sql` unmodified. No M2-F03..F17 changes, no M3, no readiness or memory changes.

## Independent checks

| Check | Result |
|---|---|
| 007 vs 006 function body | Only canonicalization, lookup, hash comparison and `canon` in inserts differ. Owner, SECURITY DEFINER, `search_path`, ACL (`{=X/postgres,postgres=X/postgres,crm_runtime=X/postgres}`), volatility, return type identical on a real cluster. PASS |
| Canonicalization completeness | `event_id` canonical in lookup, hash, both inserts. Lowercase clients hash identically to pre-fix. PASS |
| False replay | Every differing payload (landing_path, visitor, source) → P2003 on all acceptance paths. PASS |
| Cast safety (`source_id::uuid`) | Non-UUID `synthetic:fixture` receipt via real `/v1/journey/commerce` + 20,000 non-UUID receipts in same tenant; `collect_event` ran without error under default, runtime role with index/bitmap scans off, forced seq scan, forced index scan. PASS at runtime (see R-03) |
| M2-F02 | `api.ts` rejects non-UUID `X-Tenant-ID` with 422 before any lock (probed `not-a-uuid` and injection string); uppercase tenant → 200. Both `lock()` sites follow `permit()`. Key matches SQL `tenant_id::text`. PASS |
| Negative control | 006 `collect_event` swapped into disposable DB: **8/10 new tests fail** (24/32 file). Lower→lower and M2-28 pass by design. PASS |
| Original defect, real HTTP | POST `/v1/collect/events` UPPER → lower → UPPER: **202/202/202, one event id, 1/1/1** event/receipt/touchpoint, stored lowercase. PASS |

## Gates (fresh disposable copy, fresh initdb PostgreSQL 17.10, 127.0.0.1:55438, synthetic data)

| Command | Result |
|---|---|
| `m2-clean-check` (001→007) | PASS, 47 tables, 2 tenants |
| `m2-f01-upgrade-check` | PASS; legacy rows byte-identical; owner/ACL unchanged |
| `npm run migrate` | Migrations 001–007 applied/verified |
| `npm run test:db` | **74/74** (M0 + M1 + M2 incl. M2-23..28) |
| `npx playwright test` | **14/14** |
| `npm run lint` / `typecheck` / `build` | clean (27 files) / clean / clean |
| `test:bootstrap` | Not run — known environment issue M2-F14 |

Remediation evidence-file claims: all reproduced; none contradicted.

## Findings (all non-blocking)

| ID | Sev | Finding | Fix direction |
|---|---|---|---|
| R-01 | P3 | Legacy UPPER+lower duplicate pairs already created under 006 keep their orphan event/touchpoint and still count in attribution; replay returns the lowercase receipt's event. Only relevant if such data exists in an upgraded database. | Decide backfill/merge, or document that no deployed data is affected |
| R-02 | P3 | Legacy hash fallback rejects (409) some true replays of legacy case-variant data (legacy pair with differing payloads; legacy receipt with UPPER visitor/session replayed with other casing). 006 also rejected these. | Extra fallback hash with stored visitor/session casing, or document |
| R-03 | P3 | `(source_id::uuid)::text` in the 007 lookup is safe because the planner evaluates it last; SQL does not guarantee qual order. Partial index path is safe. | Guard cast with `CASE WHEN namespace LIKE 'site:%'` or a UUID regex |
| R-04 | P3 | M2-28 does not test real lock contention (journey half would pass pre-fix); M2-25 title mentions campaign but never exercises `campaign_id`; `README.md` still says "migration 006". | Strengthen tests / update README |

## Isolation and teardown

Fresh scratch copy `…\scratchpad\m2-reaudit-run` (working-tree files cmp-identical to repo). `pg_ctl stop -m fast -w` → "server stopped", `postmaster.pid` removed; API process and Playwright webServer ended; no postgres/pg_ctl/chrome processes; no LISTENING on 55438/4317/4399. Dev cluster and developer `.env` not touched. Repo not modified by the re-audit.

## Verdict

**PASS WITH NON-BLOCKING FINDINGS.** M2-F01 is fixed and regression-protected; M2-F02 fixed as adjacent remediation. M2 may close once the user approves closure. The remediation is not yet committed. Non-blocking backlog: R-01..R-04 plus original M2-F03..F17.
