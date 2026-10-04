# Independent M2 Delta Re-Audit — R-03 guard — 2026-10-04

**PASS.**

Scope: the R-03 delta only — the UUID-validity guard added to the uncommitted migration `007_collect_event_canonical_id.sql` and tests M2-29a..f — plus the gates it affects. Previous re-audit: [INDEPENDENT_M2_REAUDIT.md](INDEPENDENT_M2_REAUDIT.md). Remediation evidence (R-03 section): [M2_F01_REMEDIATION_EVIDENCE.md](M2_F01_REMEDIATION_EVIDENCE.md).

Precondition for editing 007 in place: 007 was uncommitted and had only ever been applied to disposable scratchpad validation clusters, never to a persistent or shared database.

Re-auditor: separate `tsst-code-worker` (Sonnet 5.5) that did not author the change. TSST Lead verified the repo file carries the identical guarded expression at the index (`007:13`) and the lookup (`007:35`) and accepted the verdict.

## R-03 root cause

`007` cast `source_id::uuid` in the partial index and the replay lookup. `crm.source_receipt` also holds non-UUID ids in other namespaces (`synthetic:*`, `identity:*`; `journey.ts:126,141`). Safety depended on the planner evaluating namespace filters before the cast; SQL does not guarantee qual order.

## Guard

Identical in the index and the lookup; `CASE` guarantees the cast is unreachable for non-matching text:

```sql
CASE WHEN source_id ~ '^(\{[0-9A-Fa-f]{4}(-?[0-9A-Fa-f]{4}){7}\}|[0-9A-Fa-f]{4}(-?[0-9A-Fa-f]{4}){7})$'
     THEN (source_id::uuid)::text END
```

The regex matches PostgreSQL's uuid input grammar (optional paired braces, 32 hex digits, optional hyphen after any 4-hex group), so every legacy form 006 could have stored stays findable.

## Independent checks

| Check | Result |
|---|---|
| Only the guard changed | Diff vs previously re-audited 007: header comment, index line, lookup line only. Owner `postgres`, SECURITY DEFINER, `search_path=pg_catalog, crm`, ACL `{=X/postgres,postgres=X/postgres,crm_runtime=X/postgres}` unchanged. PASS |
| Regex = PG uuid grammar | 20,262 generated forms (case, unhyphenated, braces, hyphen at every position, lone braces, 31/33 digits, non-hex, double/leading/trailing hyphen, whitespace, non-ASCII digits): **0 mismatches** vs safe `::uuid`. 45,126 random mutations: **0 mismatches**. PASS |
| Index usability | 29,000 receipts (canonical, uppercase-unhyphenated, braced, `synthetic:`, `identity:`, non-UUID in another `site:` namespace), ANALYZE: planner uses Index Scan on `source_receipt_site_canonical`; braced legacy row found. PASS |
| Adversarial cast-first | Namespace filter forced expensive (COST 100000): unguarded expression raises 22P02 on `order-1`; guarded returns 0 rows, no error. Guarded expression returns NULL for `not-a-uuid`, `{abc`, 32 chars ending `g`, 5,000 × `x`, empty string. `collect_event` replay works on default, index/bitmap off, forced seqscan. PASS |
| Negative control | Unguarded 007 swapped in: M2-29e fails ("lookup uses guarded expression"); a/b/c/d/f pass (planner order protects them, as the evidence file states). Extra control: non-UUID `source_id` in a `site:` namespace fails under unguarded 007 with 22P02 from index maintenance; works with the guard. PASS |
| Malformed public `event_id` | 8 malformed values via function and HTTP: 422 `VALIDATION_FAILED`, no 500, row counts unchanged; same as before the guard. PASS |

## Gates (fresh copy of current working tree, cmp-identical 007 and tests; fresh initdb PostgreSQL 17.10, 127.0.0.1:55438)

| Command | Result |
|---|---|
| `npm run test:db` | **80/80** (74 + M2-29a..f) |
| `m2-clean-check` 001→007 | PASS, 47 tables (×2) |
| `m2-f01-upgrade-check` 006→007 | PASS |
| `npm run migrate` | 001–007 applied; repeat run idempotent |
| `npm run lint` / `typecheck` / `build` | clean (27 files) / clean / clean |

Evidence-file R-03 claims: all REPRODUCED; none contradicted.

## Findings

| ID | Sev | Finding |
|---|---|---|
| D-01 | Informational, non-blocking | `scripts/m2-clean-check.ts` writes `../m2-runtime/clean-result.json` and fails if that sibling directory does not exist. Predates this delta. |

## Teardown

`pg_ctl stop -m fast -w` → "server stopped", `postmaster.pid` removed; no postgres/pg_ctl/initdb/robocopy processes; nothing listening on 55438/4317/4399. Dev cluster and developer `.env` untouched; no git writes by the re-auditor.

## Verdict

**PASS.** R-03 closed. Remaining non-blocking backlog: R-01, R-02, R-04, D-01, M2-F03..F17.
