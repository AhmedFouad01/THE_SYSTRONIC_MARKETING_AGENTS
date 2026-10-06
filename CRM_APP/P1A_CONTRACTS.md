# P1a server query tranche: contract and status (ADR-002, DEV_AG)

Scope: ADR-002 phase P1a. Additive to `M1_CONTRACTS.md`; nothing below breaks an existing route, field or parameter.
Skills applied (UNVALIDATED): TSST-DEV-SK-004 (slicing), -006 (migration 008), -005 (list contract), -008 (threat model in `P1A_THREAT_MODEL.md`).

## Status

| Slice | State | Evidence |
|---|---|---|
| S1 explicit projection | DONE | `src/query.ts` `COLUMNS`; `crm.ts` `record()` and list use it; `transition.ts` no `SELECT *`. Test P1A-S1 adds a hypothetical column and proves it never reaches get/list (fails if `SELECT *` returns) |
| S2 RLS/scope hoist | DONE | migration 008: `crm.context_tenant_if_allowed()` (policy InitPlan), `crm.object_scope()` (one scope lookup per list request), `crm.owner_names()` (for the later `expand=owner`). Tests P1A-S2a/S2b |
| S3 created_at/updated_at | DONE | migration 008 (columns, backfill, `touch_row` trigger, 8 indexes). Tests P1A-S3a/S3b |
| S4 list query contract | DONE | `src/listquery.ts` (pure compiler), `src/list.ts` (execution), wired in `crm.ts`. Tests P1A-S4a..e (DB, 1k-row ordering, filter/SQL-injection, cursor tamper, isolation/scope/expand/total) + `tests/listquery.unit.test.ts` |

## Delivered behavior (S1-S3)

- Objects (`contacts|leads|deals|tasks`, list and get) now also return `created_at`, `updated_at` (ISO UTC). All previous fields are unchanged. Column list is explicit; adding a DB column later does not expose it until `COLUMNS` is edited on purpose.
- `created_at`: lead = `received_at` (exact). contact/deal/task = earliest `<kind>.created` audit row; rows without one (M0-era / directly seeded) carry the migration time and are therefore "unknown", not a claimed creation time. `updated_at` = latest known audit/transition evidence, else `created_at`, then DB-maintained by a BEFORE UPDATE trigger. `created_at` is immutable (trigger restores it on any UPDATE).
- List responses keep `{data, next_cursor}` and the legacy `?cursor=<uuid>` / `?due=` semantics and `ORDER BY id`. Default order changes only in S4.
- List authorization: scope is resolved once per request (`tenant` for manager/reader, `assigned` = `owner_id = actor` for rep). Same 403 conditions as before (no crm.read, no MFA, no membership, agency grant header).

## Migration 008 (additive, expand step)

Applied with `npm run migrate` (transactional, advisory-locked). Runner now asserts contact/lead/deal/task row counts are identical before/after (printed). Constant-default `ADD COLUMN` is metadata-only on PG 17. Indexes (`*_tenant_created`, `*_tenant_owner_created`) are created non-concurrently inside the migration transaction (runner is transactional; local volume small); for large tables pre-create them `CONCURRENTLY` with the same names. Deferred relationship triggers are flushed (`SET CONSTRAINTS ALL IMMEDIATE`) after the backfill because PostgreSQL refuses DDL on tables with pending trigger events (found on first run, rolled back cleanly). Rollback = forward-fix (restore old policy text from 001/002, keep columns); never drop populated columns.

## S4 delivered contract (ADR-002 4.4; contacts, leads, deals, tasks)

`GET /v1/{contacts|leads|deals|tasks}?q=&filter=&sort=&limit=&cursor=&include_total=&expand=` (+ legacy `?due=` on tasks). The "new path" is active when `q`, `filter` or `sort` is present; otherwise the legacy path is byte-compatible (order `id`, `next_cursor` = last id UUID, `?cursor=<uuid>`, `?due=`). Responses add `has_more` (always) and, only when requested, `total_count` / `expand` keys.
- `limit` 1..200 (default 50). Any other value 422 `VALIDATION_FAILED`. All input errors are 422 `VALIDATION_FAILED`; a cursor that no longer matches the query is 422 `CURSOR_STALE`.
- `filter`: URL-encoded JSON, root = group `{"and":[..]}` / `{"or":[..]}` (one key) or one condition `{"p","op","v"}`; no other keys. Limits: depth 3, 20 conditions, 4096 bytes, 100 list items, 200 chars per text value. Fields come from a fixed per-kind table (`FIELDS`); `tenant_id`, `merged_into_id`, `source_evidence`, identifiers and unknown keys are rejected. Types/ops: uuid `eq neq in nin is_null not_null`; text + `contains starts_with` (bound ILIKE, `% _ \` escaped, so literal); int/bigint/timestamp + `gt gte lt lte between`. `neq` is NULL-safe (`IS DISTINCT FROM`), `nin` keeps NULL rows. `status` values are checked against the CHECK set. Timestamps: ISO with offset, or `YYYY-MM-DD` (UTC).
- `sort`: max 2 keys, `-` = desc, per-kind whitelist (contact `display_name source created_at updated_at`; lead `title source status received_at created_at updated_at`; deal `title amount_minor currency created_at updated_at`; task `title due_at status completed_at created_at updated_at`), implicit `id` tiebreak in the first key's direction, NULLS LAST on nullable columns (`completed_at`). New path default = `-created_at` (matches the S3 indexes). Without q/filter/sort the default stays `id` (legacy) until the UI grids switch (DECISION for Lead: flip the default in the grid slice).
- Cursor: base64url `{v:[exact key values as text],id,fp}`, `fp` = first 16 hex of sha256(kind, canonical filter, sort, q, due). Keyset OR-chain predicate (no OFFSET). Values are re-validated by type on decode; malformed -> 422 `VALIDATION_FAILED`; wrong `fp`, opaque cursor on a legacy request, or UUID cursor with q/filter/sort -> 422 `CURSOR_STALE`. `fp` is a staleness check, not a signature: a forged cursor can only move the page position, because tenant, rep scope (`owner_id = actor`), filter and `q` are always applied in SQL.
- `q`: bounded ILIKE (<=100 chars) on `display_name` (contact) / `title` (others). Identifier-digest (phone/email) search is NOT in S4 (needs `sensitive.read` gating + key handling; open item). No trigram index exists yet (pg_trgm not installed): `q`/`contains` are tenant-scoped scans, bounded by a transaction-local `statement_timeout=5s` on the new path.
- `include_total=1` (only `0|1` accepted) -> `total_count:{value,exact}` from a `LIMIT 10001` count of the same scope+filter (value caps at 10000, `exact:false` above it).
- `expand=contact,owner` (contacts accept only `owner`; others 422; duplicates 422): `owner:{id,name}` via `crm.owner_names()` (`name:null` if not resolvable), `contact:{id,display_name}`, `{id,restricted:true}` when the caller's scope cannot read that contact, `null` when there is no contact_id. Works on the legacy path too (adds keys only).
- Authorization unchanged: `crm.read` + `crm.object_scope` once per request; agency grant header, analyst, no-MFA still 403.

Open items (not S4): trigram/GIN index for `q`; digest search; default-order flip; `fields=`, `view_id`, `POST .../search` (later ADR slices).
