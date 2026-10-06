# P1a server query tranche: contract and status (ADR-002, DEV_AG)

Scope: ADR-002 phase P1a. Additive to `M1_CONTRACTS.md`; nothing below breaks an existing route, field or parameter.
Skills applied (UNVALIDATED): TSST-DEV-SK-004 (slicing), -006 (migration 008), -005 (list contract), -008 (threat model in `P1A_THREAT_MODEL.md`).

## Status

| Slice | State | Evidence |
|---|---|---|
| S1 explicit projection | DONE | `src/query.ts` `COLUMNS`; `crm.ts` `record()` and list use it; `transition.ts` no `SELECT *`. Test P1A-S1 adds a hypothetical column and proves it never reaches get/list (fails if `SELECT *` returns) |
| S2 RLS/scope hoist | DONE | migration 008: `crm.context_tenant_if_allowed()` (policy InitPlan), `crm.object_scope()` (one scope lookup per list request), `crm.owner_names()` (for the later `expand=owner`). Tests P1A-S2a/S2b |
| S3 created_at/updated_at | DONE | migration 008 (columns, backfill, `touch_row` trigger, 8 indexes). Tests P1A-S3a/S3b |
| S4 list query contract | NOT STARTED | design below is the target; only `owner_names` (S4 dependency) is in place |

## Delivered behavior (S1-S3)

- Objects (`contacts|leads|deals|tasks`, list and get) now also return `created_at`, `updated_at` (ISO UTC). All previous fields are unchanged. Column list is explicit; adding a DB column later does not expose it until `COLUMNS` is edited on purpose.
- `created_at`: lead = `received_at` (exact). contact/deal/task = earliest `<kind>.created` audit row; rows without one (M0-era / directly seeded) carry the migration time and are therefore "unknown", not a claimed creation time. `updated_at` = latest known audit/transition evidence, else `created_at`, then DB-maintained by a BEFORE UPDATE trigger. `created_at` is immutable (trigger restores it on any UPDATE).
- List responses keep `{data, next_cursor}` and the legacy `?cursor=<uuid>` / `?due=` semantics and `ORDER BY id`. Default order changes only in S4.
- List authorization: scope is resolved once per request (`tenant` for manager/reader, `assigned` = `owner_id = actor` for rep). Same 403 conditions as before (no crm.read, no MFA, no membership, agency grant header).

## Migration 008 (additive, expand step)

Applied with `npm run migrate` (transactional, advisory-locked). Runner now asserts contact/lead/deal/task row counts are identical before/after (printed). Constant-default `ADD COLUMN` is metadata-only on PG 17. Indexes (`*_tenant_created`, `*_tenant_owner_created`) are created non-concurrently inside the migration transaction (runner is transactional; local volume small); for large tables pre-create them `CONCURRENTLY` with the same names. Deferred relationship triggers are flushed (`SET CONSTRAINTS ALL IMMEDIATE`) after the backfill because PostgreSQL refuses DDL on tables with pending trigger events (found on first run, rolled back cleanly). Rollback = forward-fix (restore old policy text from 001/002, keep columns); never drop populated columns.

## S4 target contract (ADR-002 4.4), not yet implemented

`GET /v1/{contacts|leads|deals|tasks}?q=&filter=&sort=&limit=&cursor=&include_total=&expand=`
- `filter`: URL-encoded JSON `{"and":[{"p":"status","op":"in","v":[..]},{"or":[..]}]}`; system fields only; ops `eq neq in nin is_null not_null`, `gt gte lt lte between` (number/date), `contains starts_with` (text); depth 3, 20 conditions, 4 KB; compiled to bound parameters, keys from a fixed per-kind table.
- `sort=-created_at` (max 2 keys + `id` tiebreak, nulls last, whitelisted); default newest first once shipped.
- keyset cursor: opaque base64url `{v:[exact text values],id,fp}`; `fp` = hash(kind+filter+sort+q) else 422 `CURSOR_STALE`; legacy UUID cursor accepted only without q/filter/sort. Timestamp key values must travel as SQL text (JS Date would lose microseconds).
- `include_total=1` -> `total_count:{value,exact}` capped by `LIMIT 10001`; envelope adds `has_more`.
- `expand=contact,owner`: `contact:{id,display_name}` or `{id,restricted:true}`; `owner:{id,name}` via `crm.owner_names()`.
