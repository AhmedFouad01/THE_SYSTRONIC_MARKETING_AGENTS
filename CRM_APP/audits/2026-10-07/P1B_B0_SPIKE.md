# P1b B0 performance spike (DEV_AG, 2026-10-07)

Skills used: TSST-DEV-SK-002 (probe design: hypothesis, pass/fail bar, cleanup, throwaway labelling), TSST-DEV-SK-006 (data model, plans, indexes, locking/backfill cost), TSST-DEV-SK-014 (baseline/compare, change one cause at a time). All UNVALIDATED. Readiness NOT_READY.

Status: spike finished, **disposable DB and role dropped**. Nothing committed. Measured on one machine, one dataset; see section 9.

## 1. Question and verdict

Hypothesis (P1B_PLAN 2.4): JSONB `custom` + GIN (+ trigram for `q`) meets the 2.2 bars at 50k and 1M rows per tenant, measured as a NOSUPERUSER role under FORCE RLS.

Verdict: **the plain JSONB+GIN model FAILS under RLS; a JSONB + per-tenant partial expression-btree model PASSES, but only with LEAKPROOF wrapper functions (needs a superuser-created function, a security decision).** Details:

- F1 (blocker, new): under RLS the planner refuses to use any index for a predicate whose operator/function is not LEAKPROOF. `jsonb @>`, `->>`, `numeric` comparisons, `LIKE/ILIKE` are all non-leakproof. So the GIN on `custom` and the trigram indexes were never used by the role that runs the API, although they were used by a superuser on the same data (plans archived).
- F2 (existing P1a defect, confirmed at scale): the keyset cursor as emitted today (`a < $x OR (a = $x AND id < $y)`) is a filter, not an index condition; at 1M rows p95 is 3.2 to 4.4 s with 5 s timeouts. The row-value form `(a,id) < ($x,$y)` is 2.9 ms.
- F3: `ORDER BY expr DESC NULLS LAST` (what the compiler emits for nullable keys) does not match an ascending index; 1M rows -> 5 s timeout. Default null ordering (`DESC`, nulls first) uses the backward index scan: 3.6 ms.

## 2. Setup (what was actually run)

| Item | Value |
|---|---|
| Machine | i7-11700K, 16 threads, 32 GB; Windows 11; PG 17.10 (local, the dev server), default settings: shared_buffers 128 MB, work_mem 4 MB, random_page_cost 4, JIT on, max_wal_size 1 GB |
| DB | disposable `crm_spike_b0`; real migrations 001-009 applied (real RLS policies, 3 P1a definer functions, P1a indexes); then scratch B1-shaped columns `custom jsonb NOT NULL DEFAULT '{}'`, `custom_search text`, CHECK `jsonb_typeof='object' AND pg_column_size<=32768` |
| Role | spike-only `crm_spike_b0_rt` (LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS, member of `crm_runtime`); verified in-run: `su=false, bypassrls=false, force_rls=true`. No existing role was altered |
| Data | `contact` 2,050,000 rows: tenant W1M 1,000,000 + tenant W50 50,000 + 50 small tenants x 20,000. `deal` 550,000 (W1M 500,000, W50 50,000). Lead/task NOT seeded (UNMEASURED). Deal at 500k only, not 1M |
| Properties | 20 per object, 60% fill: 5 text (3 searchable feed `custom_search`), 5 select (Zipf; one with 200 options), 3 number, 3 date (ISO strings), 2 checkbox, 2 multi-select (1-3 of 12). Text 45% Arabic / 45% English / 10% mixed. Heap 3.16 GB + TOAST 0.45 GB for 2.05M contacts (~1.8 KB/row all-in). Average `custom` size was NOT re-measured at full scale (a 27k-row smoke gave ~1.1 KB against the 1.5 KB target: the dataset is slightly lighter than the plan) |
| Wide variant | scratch table, 50,000 rows, 100 properties: avg stored 5.2 KB, max 8.1 KB, TOAST 288 MB vs heap 4.7 MB (everything out of line) |
| What "latency" is | DB-side time of the whole request transaction from node: BEGIN, set_config(tenant, token), actor/tenant_access, statement_timeout 5 s, `object_scope`, the query/queries, COMMIT. No HTTP/JSON/serialization time. So API p95 will be a few ms to tens of ms higher |
| Runs | 3 rounds x 100 executions (300) for fast queries; for slow ones the count was cut adaptively (n=15 to 45 per query, recorded in `results.json`). p95 reported = median of the 3 per-round p95. One first run per query recorded as `cold` (OS cache stays warm; not a real cold start). Filter values randomised per run, plus common/rare variants |
| Plans | `EXPLAIN (ANALYZE, BUFFERS)` per key query: `audits/2026-10-07/spike-b0/plans_*.txt` |
| Raw | `spike-b0/results.json` (all numbers), `leakproof_experiment.json` (F1 proof) |
| Scripts (throwaway) | `scripts/spike/b0-{lib,setup,bench,leak,cleanup}.ts`; not promoted, not in `npm test`; re-runnable against a fresh DB |

Phases: A baseline (P1a indexes only); B plain GIN `jsonb_path_ops`; B2 forced-bitmap and composite `(tenant_id, custom)` GIN (btree_gin); B3 per-tenant partial GIN + expression btree on raw `->>`; C per-tenant partial expression btrees on LEAKPROOF wrappers; D pg_trgm; E `CREATE INDEX CONCURRENTLY` with live writers; F schema ops + wide variant; G bulk-update bloat; H insert-throughput split.

## 3. Findings that change the design

### F1. RLS + non-leakproof predicates = no index (decisive)
Evidence (`leakproof_experiment.json`, same data, same query, 1M tenant, count of rare select value, capped 10001):
| Caller | p50 | Plan |
|---|---|---|
| superuser (RLS bypassed) | 42.8 ms | Bitmap Heap Scan via GIN |
| `crm_spike_b0_rt` (RLS) | 4,075 ms | Seq Scan, 1.7M rows removed by filter |
| `crm_spike_b0_rt`, predicate through a LEAKPROOF wrapper + partial expression index | 8.2 ms (count), 1.5 ms (list) | Bitmap/Index scan on the expression index |
Catalog check in the spike DB: `jsonb_contains`, `jsonb_object_field(_text)`, `jsonb_typeof`, `numeric_eq/lt/le`, `textlike`, `texticlike`, `arraycontains`, `jsonb_exists` are NOT leakproof; `texteq`, `text_ge/le`, `int4eq`, `booleq`, `uuid_eq`, `timestamptz_lt` are. Consequences:
- GIN `jsonb_path_ops` on `custom` is dead weight for the API role (B: results identical to baseline; B2 forced-bitmap and the `(tenant_id, custom)` composite GIN did not help either: 320 ms very-rare at 1M, 3.9 s rare count at 1M; per-tenant partial GIN same). It costs 40 s build and ~0.55 GB per 1M rows (plain GIN on contact = 547 MB; composite = 516 MB; W1M partial = 259 MB).
- Trigram indexes are unusable for the API role for the same reason (D "as shipped": rare-token `q` at 1M still times out at 5 s with both trigram indexes present).
- Only predicates built from leakproof functions/operators can use an index. LEAKPROOF can be set only by a superuser (`CREATE FUNCTION ... LEAKPROOF`).

### F2. Keyset OR-chain (P1a defect)
`L1_default_cursor_orchain` 1M: p50 2.96 s, p95 4.44 s, 2/17 timeouts; deep (50%) 3.17 s. Row-value form: 2.9 ms. Same for custom-sort keyset: OR-chain p95 5.0 s (timeouts), row-value 4.1 ms. At 50k the OR-chain is fine (20.7 ms). Fix belongs in the compiler (single-direction keys -> row comparison; mixed directions need a different strategy, UNMEASURED).

### F3. Sort direction and NULLS
1M, expression index (n1) ascending: asc 3.9 ms, desc default-nulls 3.6 ms, desc NULLS LAST (compiler form) 5 s timeout (50k: 728 ms). Use PostgreSQL default null ordering for custom-property sorts, or accept two indexes.

### F4. Other design facts
- Dates stored as ISO text sort/range correctly as text (`text_ge/le` are leakproof); a raw `::date` cast is STABLE and cannot be indexed. Numbers: wrapper returns `float8` (float8 comparisons usable); `numeric` comparisons are not leakproof; float8 loses exactness above 2^53 (currency minor units need a decision).
- `?|` / `?&` cannot be served by `jsonb_path_ops` (only `@>`). Moot under F1.
- The planner estimates a flat ~10k rows for any `custom @>` predicate (no statistics), so it picks the `created_at` index walk. This is fast when the value is common (13-20 ms at 1M) and slow for rare or combined values (two conditions 1.5 s p95 at 1M; rare count 4 s). Expression indexes carry statistics (after ANALYZE), which is why they plan correctly.
- Partial per-tenant indexes (`WHERE tenant_id = '<uuid>'`) are proven by the planner from the bound `tenant_id=$1` (custom plan, unnamed statements) and were used. Build time for the whale: 4.1-4.6 s per index (contact), 1.9 s (deal).
- Bulk write cost of `custom` (G): one UPDATE of all 1M whale rows merging 2 keys = 557 s, 43.5 GB WAL, heap +47% (3.18 -> 4.69 GB), indexes +41%, HOT updates ~0% (110 of 1.03M), plain VACUUM does not shrink. Never backfill defaults into `custom`; treat `default` as read-time.
- `evidence()` with `object_kind='property'` is rejected by the 003 object-integrity trigger (SQLSTATE 23503): B2 must extend that function/migration. (Spike used `contact` as a stand-in for cost.)
- Unrelated hazard seen: deleting 100k contacts took > 3 min because the self-FK `(tenant_id, merged_into_id)` has no index (each delete seq-scans). Not on the P1b path; note for any future bulk delete/merge cleanup.

## 4. Pass/fail against P1B_PLAN 2.2 (p95, server-side DB time, page of 50)

PASS/FAIL refer to the shape named in the "Configuration" column. "Raw" = JSONB predicates (`@>`, `->>`) as the plan describes. "LP" = LEAKPROOF wrapper + per-tenant partial expression btree. "50k"/"1M" = tenant W50 / W1M in the same 2.05M-row table.

| Operation | Bar 50k / 1M | Configuration | 50k p95 | 1M p95 | Result |
|---|---|---|---|---|---|
| List default first page | 100 / 150 | P1a indexes | 3.4 | 3.1 | PASS |
| List default, keyset cursor (random / deep) | 100 / 150 | P1a OR-chain as emitted | 20.7 / 13.9 | 4,442 (2 timeouts) / 3,174 | 50k PASS, **1M FAIL** |
| same | | row-value form | 3.0 (deep) | 2.9 (deep) | PASS |
| System filters: contact owner+source; deal stage+owner; rep scope (contact, deal) | 150 / 400 | P1a indexes | 3.2 / 3.3 / 3.0 / 3.0 | 3.5 / 3.0 / 2.9 / 2.9 (deal 500k) | PASS |
| Custom filter, select eq / multi has_any,has_all / checkbox (common and moderately rare values) | 300 / 800 | Raw `@>`, with or without GIN | <= 21 (has_all 40) | <= 19 (has_all 42) | PASS, but the `created_at` index walk answers it, not the GIN (F1) |
| Custom filter, two conditions (s1 + c2) | 300 / 800 | Raw | 228 | 1,507 | 50k PASS, **1M FAIL** |
| Custom filter, truly rare value (s5, ~0.2%) | 300 / 800 | Raw, any GIN variant | 124 | 330 | PASS in this run (index walk still short); degrades with rarity, see counts |
| Custom filter select eq random/common/rare, checkbox rare, s1+c2, s1 in 3 values | 300 / 800 | LP expression index | <= 13.5 (in-3: 110) | <= 28.4 | **PASS** |
| Custom filter multi-select rare values via index | 300 / 800 | LP | UNMEASURED | UNMEASURED | UNMEASURED (no leakproof array operator tested) |
| Custom sort number/date/text, no filter, **unindexed** | 300 / no latency bar, clean timeout < 5 s | none | 714 (**FAIL** 300) | 5,014 = timeout x17/17 (clean, no hang) | 50k FAIL, 1M clean timeout as predicted |
| Custom sort, **indexed**, asc and desc-default-nulls | 300 / 1000 | LP expression index | 3.8 | 3.9 | PASS |
| Custom sort desc NULLS LAST (compiler form) | 300 / 1000 | LP index (asc) | 728 | 5,018 timeout | **FAIL** (F3) |
| Sort select by option position (bound array) | 300 / n.a. | unindexed | 645 | 5,014 timeout | FAIL at 50k; cannot be indexed with a bound array |
| Custom range filter n1/d1 between + sort | 300 / 1000 | LP index | 2.9 / 3.6 | 4.5 / 4.0 | PASS |
| Custom filter + custom sort (indexed): s1 common/rare/random, c2 rare | 300 / 1000 | LP | 128 / 12.8 / 48.3 / 13.1 | 5.7 / 30.9 / 28.1 / 15.1 | PASS |
| Custom keyset on custom sort | 300 / 1000 | LP, OR-chain | 477 | 5,014 timeout | **FAIL** |
| same | | LP, row-value | 4.1 | 4.1 | PASS |
| `q` substring, no trigram | 300 / 1000 (with trigram) | P1a + custom_search | Arabic 3-char 357 (**FAIL**), rare 59, English <= 6 | rare token 5,017 timeout x17/17; Arabic common display-only 2,298; English common 4.5 | **FAIL** at 1M (confirms the P1a review risk) |
| `q` substring, trigram indexes present, as shipped (RLS) | | trigram on `search_normalized` + `custom_search` | see `results.json` (`*_tri`) | rare token 5,016 timeout | **FAIL** (F1: index unusable) |
| `q` substring, trigram present and `textlike/texticlike` marked LEAKPROOF (spike DB catalog only, hypothetical) | 300 / 1000 | trigram | <= 7.2 | <= 4.5 (rare token 3.2) | PASS (not a shippable state without a security decision) |
| `q` prefix (`starts_with`) | n.a. | btree/none | 4.3 | 4.6 | PASS (common prefix; a rare prefix at 1M UNMEASURED) |
| `include_total` unfiltered | 300 / 1000 | | 10.8 | 14.7 (max 550) | PASS |
| `include_total` with custom filter | 300 / 1000 | Raw, common / rare | 232 / 256 | 270 (700 once GIN) / 4,005 | 50k PASS, **1M FAIL** for rare |
| same | | LP | 7.4 / 2.9 | 147 / 10.5 | PASS |
| `include_total` with `q` common / rare | 300 / 1000 | no trigram | 25 / 67 | 28 / 1,968 | **1M rare FAIL** (same with trigram under RLS 1,978; LP-LIKE 3.3) |
| Record GET with `properties` | 30 / 30 | | 4.7 | 4.9 | PASS (DB side only) |
| Record PATCH, 5 properties (validator not included: DB merge + search text + audit + event + outbox) | 80 / 100 | baseline indexes | 7.5 | 7.5 | PASS |
| same | | all indexes (4 base + 2 trigram + 5 partial expr) | 7.9 | 8.4 | PASS |
| 20 concurrent writers, distinct rows | 0 errors, p95 <= 250 | baseline / all indexes | 22.4 / 23.2 (0 errors) | 20.7 / 26.3 (0 errors) | PASS |
| Schema change: create / edit property (scratch registry table, +audit/event/outbox, `schema_rev`+1) | 100 / 100, independent of rows | | 5.6 / 7.0 | 6.4 / 6.7 | PASS (same cost at 50k and 1M, no DDL) |
| Schema GET (100 properties, 33 of them 20-option selects) | 50 ms, 64 KB | | 4.2 ms | 4.1 ms | time PASS, **size FAIL**: 89.9 KB JSON uncompressed |
| `indexed` flip: `CREATE INDEX CONCURRENTLY` on the whale | n/a / <= 120 s; writers during build <= 2x | partial expr index | 2.0 s | 6.3 s; writers p95 4.8 vs 4.6 baseline (1.0x), 0 errors | PASS |

Not measured (UNMEASURED): lead and task tables; deal at 1M; 100-property filter/sort at 1M beyond the 50k wide table; the 5 s statement timeout under 20 concurrent list readers; HTTP-level latency; the validator cost; mixed-direction two-key keyset; `custom` size at the plan's 1.5 KB at full scale; GIN pending-list behaviour (fastupdate left default, not isolated); 200 indexes per database.

## 5. Index budget (2.3)

| Bar | Measured | Result |
|---|---|---|
| <= 8 indexes per object table incl. existing | contact: 4 existing + 2 trigram = 6 global (+ plain GIN would be 7); 5 per-tenant partial expression indexes on top | PASS |
| <= 5 expression indexes per object per tenant | 5 (n1, d1, t1, s1, c2) | PASS |
| <= 200 per database | 29 indexes in total at the end; 200 not tested | UNMEASURED |
| Index bytes <= 1.2x heap | contact baseline 0.22x heap (736 MB / 3.31 GB); with trigram + 10 partial expr 0.43x (1.37 GB / 3.16 GB); after the 1M update 0.45x | PASS |
| Insert throughput with GIN+trigram >= 70% of baseline | baseline 16.8k rows/s; with 2 trigram GINs 8.2k = **49% FAIL**; without the `custom_search` trigram 16.4k = 98% PASS; without any contact trigram 19.0k | FAIL as designed; PASS if trigram only on display columns |
| GIN pending list measured | not isolated | UNMEASURED |
| TOAST rate and bloat after 1M updates | TOAST 14% of heap at 1.1-1.8 KB rows; wide rows (5 KB) are 100% out of line; 1M-row update: +47% heap, +41% idx, +50% TOAST, 43.5 GB WAL, 557 s, HOT ~0% | measured (cost is high, see F4) |
| `VALIDATE CONSTRAINT` of the 32 KB CHECK on 2M rows | 8.1 s contact, 2.3 s deal (first run, from log; the stored timing in `results.json` shows 1 ms because that was a re-run) | OK (NOT VALID then VALIDATE confirmed cheap here) |

## 6. Recommendation for B1 (migration 010) and later

1. **Storage: JSONB `custom` + `custom_search`, no promoted columns for P1b.** Registry/schema-change/write-path bars all pass with large margin; the reversal-table promotion trigger (more than 30% / 8 properties needing promotion) was not approached (5 expression indexes cover filter, sort, range and keyset).
2. **Do not ship the GIN `jsonb_path_ops` on `custom` in 010.** Under RLS it is never chosen; it costs build time, ~0.5 GB per 1M rows and write amplification. Revisit only if the leakproof decision below makes `@>` usable.
3. **Fast path = per-tenant partial expression btrees** `ON crm.<object> (<wrapper>(custom,'key'), [created_at DESC,] id [DESC]) WHERE tenant_id = '<uuid>'`, created by the planned `indexed` flow (B6, `CREATE INDEX CONCURRENTLY`, admin CLI, <= 5 per object per tenant). Index types: select/text/date(ISO text) via `jtxt`, number via `jnum8` (float8), checkbox via `jbool`. Build 4-5 s per index at 1M, no writer impact.
4. **Decision needed before B1 ships (ESCALATE_TO_DEEP / user): LEAKPROOF.** Item 3 only works if the wrappers are LEAKPROOF, which needs a superuser to create the functions (acceptable on this local/self-hosted Postgres; unknown on a managed host) and a security review of the leakproof claim (the wrappers must never raise data-dependent errors; they return NULL on type mismatch). Alternatives, none measured here: (a) typed slot columns (Option C: `num_1..n`, `txt_1..n`, `bool_1..n`, `ts_1..n` using native leakproof operators) for the hot indexed properties; (b) run list queries through a dedicated role that bypasses RLS and re-implements the tenant predicate in SQL (weakens the DB-enforced isolation, architecture change). Without one of these, unindexed filters are limited to what the `created_at` walk can answer and counts/rare values time out at 1M.
5. **Compiler rules to carry into B4 (from F2/F3):** row-value keyset for same-direction keys; default NULL ordering for custom sorts (or accept the `NULLS LAST` index cost); no `?|`; sort-by-select-position is unindexable (use the option value order or promote); never emit unguarded casts; keep the 5 s timeout (it behaved cleanly: no hang, 0 server errors besides 57014).
6. **`custom_search`:** keep, but only for properties flagged searchable (spike: 3 of 5 text properties, ~265 bytes average). Do not give it its own trigram index (49% insert throughput); either fold the searchable text into one trigram-indexed column with `search_normalized`, or accept scan-based search for custom text.
7. **Schema GET size:** 100 properties with 20 options each exceeds 64 KB uncompressed (89.9 KB); either raise the bar to 128 KB, lazy-load options, or rely on gzip (UNMEASURED).
8. **Never backfill defaults into `custom`** (557 s, 43 GB WAL per 1M rows).

## 7. Is `pg_trgm` needed? 

**Yes for 1M-scale substring search, but it does not work as designed under RLS.** Without trigram a rare term at 1M times out at 5 s (confirmed, expected by the plan). With trigram indexes the API role still times out (F1) because `LIKE` is not leakproof; with `textlike/texticlike` marked LEAKPROOF in the database catalog every `q` shape measured is <= 7 ms at both tiers. That catalog change (a per-database `ALTER FUNCTION pg_catalog.textlike ... LEAKPROOF`, superuser) is a security claim on a system function, is not carried by dump/restore, and was applied only inside the disposable DB. So: 013 (`pg_trgm`) is justified **only after** the leakproof decision of 6.4; if it cannot be made, fall back per the plan's reversal table to normalized prefix search (`starts_with`), whose rare-prefix behaviour at 1M is UNMEASURED. At 50k trigram is not needed (worst 357 ms without it, bar 300 ms; 65 ms for display-only).

## 8. Reversal-table mapping (P1B_PLAN 2.5)

| Row | Outcome |
|---|---|
| Custom filter/sort misses the bar with GIN only -> add expression btree | Triggered and confirmed: expression btree (LP) passes everything; promotion to typed column not needed on performance grounds |
| > 30% / > 8 properties need promotion | Not triggered (5 indexed properties cover all tested ops) |
| GIN/trigram write amplification | Triggered for `custom_search` trigram (49%); resolution: drop it, keep display-column trigram (98%) |
| `pg_trgm` not usable | Effectively triggered by F1 (installable, not usable by the RLS role) -> decision in 6.4 |
| RLS initplan stable at 1M | Held: the tenant policy ran as an InitPlan (`One-Time Filter`), `tenant_id` index conditions were used, scope queries 2-3 ms. The problem is not the hoist but non-leakproof predicates |
| Whole model misses even with promotion | Not triggered |

## 9. Limits and caveats ("a pass does not prove production")

- One machine, one run per phase, warm OS cache, PG default config (not tuned), other databases (`crm_m0`, `crm_codex`, `crm_p1b`) present but idle (0 other sessions at each phase start). Not production sizing.
- Synthetic data: 2.05M contact rows, Zipf distributions chosen by me, one whale per tier, two whales share a table, bulk-loaded with FK/trigger checks skipped (`session_replication_role=replica`), so no deferred-trigger cost on seed and the heap is freshly packed (no bloat, favourable physical order per tenant; the `created_at` walk speed depends on how tenant rows are laid out).
- Latency excludes the HTTP stack, JSON, the validator and registry cache; it includes the DB round trips of the request transaction.
- LEAKPROOF results use wrapper functions created by a superuser in the spike DB; the "textlike LEAKPROOF" row alters a system function in the disposable DB only and is hypothetical.
- Some "PASS" rows pass for a benign reason (the `created_at` walk finds 51 matches early because the value is common); they degrade with rarity (see counts and two-condition rows).
- Schema rows use a scratch table with the same RLS text, not the real B1 registry.
- Results are re-runnable but not a regression gate; B6 must re-measure against the real compiler and real indexes (as the plan says).

## 10. Cleanup

`DROP DATABASE crm_spike_b0 WITH (FORCE)` and `DROP ROLE crm_spike_b0_rt` executed via `scripts/spike/b0-cleanup.ts`. Verified before/after: databases `crm_codex, crm_m0, crm_p1b, postgres, template0, template1` unchanged (only `crm_spike_b0` removed); `crm%` roles: `crm_runtime` unchanged (only `crm_spike_b0_rt` removed). No repo `src/`, `migrations/`, `app/`, `tests/`, `package.json` or dev DB schema/data touched. Kept: `scripts/spike/*` (throwaway) and `audits/2026-10-07/spike-b0/*` (raw results and plans). Free space on C: stayed above 85 GB throughout. No commit.
