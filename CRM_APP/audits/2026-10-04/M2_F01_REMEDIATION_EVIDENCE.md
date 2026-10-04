# M2-F01 remediation evidence (bounded; uncommitted working tree)

Branch `feat/crm-m2-journey-reporting`, base HEAD `acd0398`. CODE tier (Sonnet 5.5). No git add/commit/push. Lead review/acceptance and independent re-audit still required.

## Files changed
| File | Change |
|---|---|
| `CRM_APP/migrations/007_collect_event_canonical_id.sql` (new, 54 lines) | `CREATE OR REPLACE FUNCTION crm.collect_event` (lines 11-53) + partial expression index `source_receipt_site_canonical` (line 10) + re-issued `GRANT EXECUTE` (line 54) |
| `CRM_APP/scripts/migrate.ts` | registers `[7, "007_collect_event_canonical_id.sql"]`; log text 001-007 |
| `CRM_APP/scripts/m2-clean-check.ts` | adds 007 to the clean-install chain; label 001-007 |
| `CRM_APP/scripts/m2-f01-upgrade-check.ts` (new) | 001-006 -> 007 upgrade check using the real 006 function to create legacy data |
| `CRM_APP/src/journey.ts` lines 47-54 | F02: tenant lock key hashes `$1::uuid::text` |
| `CRM_APP/tests/m2.test.ts` (appended, M2-23..M2-28) | regression tests |
| `CRM_APP/M2_CONTRACTS.md` lines 50-51 | one-line canonical-id clarification |

006 is unchanged (verified byte-equal to HEAD).

## Root cause
`crm.collect_event` looked up the receipt with `(b->>'event_id')::uuid::text` (lowercase) but stored raw `b->>'event_id'` in `business_event.source_event_id` and `source_receipt.source_id`; the unique index `business_source_identity` is on raw text; the request hash was over the raw body. Different letter case therefore missed the lookup (duplicate event) or hit the raw unique index (422) or mismatched the hash (409).

## Exact fix (007)
After validation and before any lock/lookup: `orig=b; canon=(b->>'event_id')::uuid::text;` then `b` is rewritten with canonical lowercase text for `event_id`, `visitor_id`, `session_id` and (if present) `campaign_id`. Canonical `b` feeds the request hash `h`, receipt lookup, `business_event.source_event_id` (= `canon`), `source_receipt.source_id` (= `canon`).
Legacy compatibility without rewriting rows: lookup is `(source_id::uuid)::text = canon AND namespace LIKE 'site:%'` ordered `(source_id=canon) DESC, source_id` `LIMIT 1`, served by the partial expression index (cast only evaluated on site-namespace rows, all uuid-castable). A found receipt matches if `request_hash` equals any of: canonical hash, hash of the original raw body (`orig`), or hash of canonical body with `event_id` set to the stored legacy `source_id`. Conflict (different payload) still raises P2003 -> 409. Owner, `SECURITY DEFINER`, `search_path=pg_catalog,crm`, and ACL verified identical before/after 007.

## Canonicalization decisions
- event_id: canonical (defect).
- visitor_id, session_id, campaign_id: normalized in the hashed body only, because they are part of the replay hash and a case-differing retry would otherwise 409. Visitor/session storage already used `::uuid` (uuid columns), so no stored-form change.
- Legacy rows where visitor/session case also differed from the replay are not matched by the legacy-hash fallbacks (409); not a realistic path and no data rewrite was warranted.
- Legacy duplicate pairs (UPPER + lower both stored by 006): replay deterministically returns the canonical (lowercase) receipt's event; the extra legacy duplicate event is NOT removed (no backfill/delete). Reported for Lead decision; no backfill judged necessary for correctness of the fix.
- Why additive 007 not edit-006: 006 is version-tracked in `public.crm_migrations`; edits would never reach upgraded databases.

## F02 decision: FIXED (same defect class, single point)
`journey.ts` has one tenant-lock helper (`lock`, two call sites); the SQL side already hashes canonical `tenant_id::text`. Hashing `$1::uuid::text` makes both keys equal for any header casing. No architecture/contract change. M1 `crm.ts:222` lock (different key) untouched. Test M2-28 is weak by nature: it proves key equality in SQL and that a mixed-case tenant calculate still succeeds, not actual lock contention.

## Tests added (tests/m2.test.ts)
M2-23 x5 (upper->lower, lower->upper, upper->upper, lower->lower, mixed->upper): same event id; exactly 1 business_event, 1 source_receipt, 1 touchpoint, 1 attribution_job, 0 attribution_credit; stored `source_event_id`/`source_id` lowercase; changed payload -> SOURCE_CONFLICT. M2-24 concurrent (Promise.all, 9 calls cycling upper/lower/mixed): one event. M2-25 visitor/session case. M2-26 legacy non-canonical 006-style receipt (rows rewritten to raw form + raw hash) found by lower/upper/mixed replay, rows not rewritten, conflict still 409. M2-27 HTTP: UPPER, lower, UPPER -> 202/202/202, same id, single event. M2-28 F02 lock key.
Negative control: with the 006 function restored, 8 of 10 new tests failed (lower->lower and M2-28 pass, as expected); with 007, 10/10 pass.
Upgrade check `scripts/m2-f01-upgrade-check.ts`: builds 001-006, reproduces the defect with the real 006 function (4 events from case variants), snapshots events/receipts/touchpoints, applies 007, asserts byte-identical rows, unchanged owner/secdef/config/ACL, legacy UPPER/lower/mixed replays return original event ids, no new rows, conflict -> P2003, new event stored canonical. PASS.

## Gates (isolated embedded PostgreSQL 17.10, fresh initdb `pgdata-f01`, 127.0.0.1:55438, scratchpad copy; synced working-tree files; own generated .env; dev cluster/.env untouched). Port 55438 used because the existing check scripts hard-guard it.
| Command | Result |
|---|---|
| `tsx scripts/m2-clean-check.ts` (001-007) | PASS: 47 tables, 2 synthetic tenants (run twice) |
| `tsx scripts/m2-f01-upgrade-check.ts` (001-006 + legacy data -> 007) | PASS (run twice) |
| `npm run migrate` | "Migrations 001-007 applied/verified" |
| `npm run test:db` | tests 74, pass 74, fail 0 (before and after biome formatting, final run on 007) |
| targeted `--test-name-pattern="M2-2[3-8]"` | 10/10 pass |
| `npx playwright test` | 14 passed |
| `npm run lint` | clean, 27 files checked |
| `npm run typecheck` | clean |
| `npm run build` | clean |
| `M0_PWSH=powershell.exe npm run test:bootstrap` (informational, M2-F14) | tests 4, pass 3, fail 1 (known environment-blocked) |

## Teardown proof
`pg_ctl -m fast -w stop` -> "server stopped"; `postmaster.pid` gone; Playwright webServer exited; `tasklist` shows no postgres/pg_ctl/initdb/chrome processes; no process command line references `m2-audit-run`; netstat shows zero LISTENING on 55438/4317/4399 (only TIME_WAIT client sockets remain). The scratchpad copy (synthetic data only, generated .env) remains outside the repo.

## NOT changed
M2-F03..F17, M3, 006 migration, readiness docs, TSST memory, README (still says "migration 006"; Lead may update docs), M2_EVIDENCE.md, production/dev data, external services. Existing duplicate events from pre-007 data are not backfilled or deleted. No commits.

## R-03 guard (re-audit finding: uuid cast reachable for non-UUID source_id)
**Root cause.** `007` indexed and looked up `(source_id::uuid)::text`. `crm.source_receipt` also holds non-site namespaces (`synthetic:*`, `identity:*`) whose `source_id` is arbitrary text (journey.ts commerce path). Safety relied only on the planner evaluating the namespace filters before the cast, which SQL does not guarantee.

**Guard (007, edited in place; never applied to a persistent DB).** Identical expression in the index and the lookup:
`CASE WHEN source_id ~ '^(\{[0-9A-Fa-f]{4}(-?[0-9A-Fa-f]{4}){7}\}|[0-9A-Fa-f]{4}(-?[0-9A-Fa-f]{4}){7})$' THEN (source_id::uuid)::text END`
CASE order is guaranteed, so the cast is unreachable for invalid text under any plan. The regex mirrors PostgreSQL `uuid_in`: optional braces that must pair, 32 hex digits, optional hyphen after any 4-hex group (a bare `{...` or `...}` is rejected, as PG does). A header comment line records R-03. 006, canonicalization, hash fallback and everything else are unchanged.

**Tests (tests/m2.test.ts, M2-29a..f).** a: non-UUID commerce receipts (real path) plus collect and replay under default plan and forced seq scan (`SET LOCAL enable_indexscan=off; enable_bitmapscan=off`, fresh session). b: lower/upper/mixed replay dedups to 1 event/receipt/touchpoint on both plans. c: legacy receipts stored unhyphenated, braced, uppercase, all-hyphen and mixed-hyphen forms are found on canonical replay and not rewritten (both plans). d: 768 PG-accepted forms must match and 17 PG-rejected forms must not match the regex (checked against live `::uuid`). e: function source and index definition carry the guarded expression; at 20k-row volume (rolled back, ANALYZE) the default planner uses `source_receipt_site_canonical` for the lookup; negative-control probe forces the namespace filter last (COST 100000 temp function): the unguarded cast raises 22P02, the guarded expression returns 0. f: malformed event_id (`not-a-uuid`, 31 digits, 33 digits, `g`, unpaired brace, empty, leading space, number) gives 422 VALIDATION_FAILED via collect() and HTTP, no 500, no rows written. Status was identical against the pre-change 007 (baseline run).

**Negative control, honestly.** Against the old unguarded 007, M2-29a/b/c/f also pass: planner qual ordering happens to evaluate the namespace filter first, so a plain forced seq scan does not expose the defect. The guard is therefore proven by M2-29e (probe where the cast would run first: unguarded fails, guarded passes) plus the code/EXPLAIN assertions (M2-29e failed on old 007 at the "lookup uses guarded expression" assertion).

**Gates** (fresh initdb `pgdata-r03`, PostgreSQL 17.10, 127.0.0.1:55438, scratchpad copy, synced working tree). `npm run test:db`: 80 tests, 80 pass, 0 fail (74 + 6 new; run twice, last after biome format and type fix). m2-clean-check 001-007: PASS, 47 tables (x2). m2-f01-upgrade-check 006->007: PASS (x2). `npm run migrate`: 001-007 applied. lint clean (27 files). typecheck clean. build clean. Playwright not run (no UI-adjacent change).

**Teardown.** `pg_ctl -m fast -w stop` -> "server stopped"; `postmaster.pid` gone; no postgres/pg_ctl/initdb process; no process command line references the scratch run or `pgdata-r03`; zero LISTENING on 55438/4317/4399. Dev cluster and developer `.env` untouched. No git add/commit/push.
