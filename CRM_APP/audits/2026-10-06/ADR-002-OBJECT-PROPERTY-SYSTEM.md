# ADR-002 — Object & Property System (HubSpot-style) for T.SAG CRM

Status: ACCEPTED by user 2026-10-06 (see §9). Date 2026-10-06. Author: DEV_AG (TSST BUILD). Design only: no code, schema, commit or deploy. Extends ADR-001 (stack unchanged: Node 24, PG 17, `pg`, no new infra).
Skills applied: TSST-DEV-SK-003 (decision record), TSST-DEV-SK-006 (schema/migration), TSST-DEV-SK-005 (API contract). All UNVALIDATED.
Evidence base: migrations 001-007, `src/crm.ts`, `src/api.ts`, `src/db.ts`, M1/M2 contracts, `audits/2026-10-05/DEV_REVIEW.md` (F-01/F-02, P0 tranche), `HUBSPOT_COMPETITOR_INTEL.md` (rows 5/7/10/29), `app/src/ui/data-grid/*`. **No performance was measured** (no `psql` on PATH; the live DB was deliberately not touched). All volume figures are estimates and are gated by a spike in slice P1-S10.

## 1. Context and decision drivers

User requirement (2026-10-06): contacts/leads/deals are OBJECTS; objects have user-defined PROPERTIES (text, radio, dropdown, formula, custom objects...) that appear as table columns (add/hide) and filters. Build the object system first, display on top.

Facts in THIS codebase that constrain the design:
1. Four hard-coded tables (`contact, lead, deal, task`), composite `(tenant_id,id)` PKs/FKs, typed CHECKs (`amount_minor>=0`, `status IN (...)`), deferred relationship-agreement triggers (004), column-level `GRANT UPDATE(...)` on `deal`. Runtime role is NOSUPERUSER/NOBYPASSRLS, **cannot run DDL**; unknown request fields are rejected (M1 rule); `crm.<kind>` is chosen from the fixed list `["contact","lead","deal","task"]` (`crm.ts:51`).
2. RLS: every table has `tenant_boundary USING (crm.tenant_access(tenant_id))`, a SECURITY DEFINER function taking the **row's** tenant_id, so it is evaluated per row (not hoistable to an initplan). Lists also call `crm.can_object('crm.read',kind,id,grant)` per row (`crm.ts:657`). Finding: harmless at 150 rows, a latent cost at 100k+ rows when filter/sort/count must visit every match. Fixing this is a prerequisite for the P0 tranche (see 4.8).
3. Concurrency/audit: every mutation = `version` check (`expected_version`) + one `evidence()` triple (`audit_log` with `changed_fields text[]`, `business_event`, `outbox`) + `durable()` idempotency. `check_object_reference` trigger (003) validates a finite `object_kind` list; `object_authorized` (002) has a per-kind owner lookup.
4. Lists today: `ORDER BY id LIMIT 51`, cursor = last UUIDv4 (random, so "newest" is unrepresentable); no `created_at` on contact/deal/task (lead has `received_at`); `SELECT *` is returned verbatim (anything added to a table leaks unless projected).
5. Grid already speaks `ViewState{query,filters(eq/in/gte/lte),sorts,hidden columns,density,pageSize}` and stores saved views in localStorage (`savedViews.ts`, decision D3). Server views must be a superset of that shape.
6. M2 (journey, conversion, commerce_order, `normalize_won` trigger reading `deal.amount_minor`) hangs FKs off `contact`/`deal`. M0-M2 evidence exists and must not be invalidated.
7. Sensitive data: phone/email are encrypted in `contact_identifier` (keyed digest, `sensitive.read/write`). They must **not** become ordinary properties.

Drivers, in order: (a) tenant isolation/security unchanged or stronger; (b) table UX must filter/sort/search the *whole* dataset on server (F-01/F-02); (c) do not rewrite M0-M2; (d) smallest reversible steps; (e) 50k typical, 1M ceiling records per tenant.

## 2. Requirements and non-goals (MVP = P1)

| Area | MVP (P1) | Later |
|---|---|---|
| Objects | Standard: contact, lead, deal, task get a property registry | **Custom objects: P2** (registry designed now; see 6) |
| Types | text, long text, number, currency (fixed currency per property, integer minor units), date, datetime, single-select (display variant `dropdown`\|`radio`), multi-select (display `checkbox_list`\|`tags`), checkbox (boolean), user/owner | url (P2); **formula P3**; rollup/calculated P3; association/lookup P2 |
| Property meta | group, label (en+ar, one required), description, option sets (ordered, color, archivable), `required` (create-time + non-clearable), `read_only`, `sensitive` (needs `sensitive.read`), `searchable`, `show_in_table_default`, simple validation (min/max, max length, regex-free in P1) | `unique` P2 (claim table), conditional required P3 |
| Standard fields | Exposed in the same registry as `is_system` properties (storage=column): `display_name,title,status,owner,amount,currency,due_at,created_at,updated_at,stage,pipeline,source...`; label/group/visibility editable, key/type fixed | lead status as configurable option set P3 |
| Pipelines/stages | Deal `pipeline`/`stage` are system properties of type `stage`; filter/sort/display via registry; **writes only via the existing transition command** (guard, audit, outbox, won-outcome unchanged). Lead `status` stays a system lifecycle; the user-defined "lead stage" is a custom single-select | Pipelines for custom objects: not planned |
| Views | Per object: saved columns (order/width), filters, sorts, query, density; private or shared; default view; per-user | Board view/group-by P2; calendar later |
| Associations | Existing FK relations exposed read-only in registry | Generic labeled associations P2 |
| Limits | 100 active custom properties/object, 32 KB custom JSON/record, 200 options/property, filter depth 3 / 20 conditions | tunable |
| Non-goals | Arbitrary code/JS formulas; per-tenant DDL (columns/tables created at runtime); custom phone/email types; property-level ACL per role beyond sensitive/read_only; import/export UI; workflow triggers on property change; field history (value-level, P2); multi-currency FX |

## 3. Options

All four share one idea: a **registry** (`property_definition`) is the single source of truth for UI columns, validation and the query compiler. They differ in where values live.

**A. JSONB `custom` column on each existing table + `property_definition`.** Values in `custom jsonb`; GIN `jsonb_path_ops` + optional per-property expression indexes.
**B. EAV `property_value` table** (`tenant,object_type,object_id,property_id`, typed columns text/num/ts/bool/ref).
**C. One generic `record` core table for ALL objects** (standard + custom): promoted typed columns + `properties jsonb`; existing four tables migrated into it.
**D. Hybrid (recommended):** standard fields stay real columns (exposed through the registry as system properties); custom properties on the 4 standard objects in JSONB (A); custom objects (P2) in a generic `record` table (the C structure, scoped to custom types only); associations in a link table. One query compiler maps `property -> SQL expression` for all.

| Criterion | A JSONB/table | B EAV | C generic core | D hybrid |
|---|---|---|---|---|
| Filter/sort 50k rows | Seq scan + jsonb extract: tens of ms (est.); fine | Join per filter/sort key: acceptable at 50k only for 1-2 conditions | Same as A | Same as A |
| 1M rows | Needs indexes: GIN for eq/contains/multi-select; expression btree per hot property (see 4.6) ; est. 100-500 ms indexed, seconds unindexed | Multi-filter = N self-joins; 20 props x 1M = 20M rows; worst of all | As A; one big table makes every tenant's index heavier | As A |
| Sort by custom property | Expression index required at scale | Index on (tenant,property,value) but join+sort poor; keyset hard | Same as A | Same as A |
| RLS/tenant isolation | Inherits existing table RLS; `custom` column covered automatically; 1 new policy for registry tables | New table, new policy; value rows duplicate tenant_id | Rewrites policy/FKs for all objects; one RLS table = single blast radius | Existing RLS reused; `record`+registry get same policy macro |
| Versioning / optimistic concurrency | Record `version` covers custom writes unchanged (1 bump per PATCH) | Per-value rows: record version needs a separate row/trigger; torn writes possible | Native | Native (record-level) |
| Audit/outbox | `evidence()` reused; `changed_fields` gets `custom:<key>` entries | Same, but value-level history is easy | Native | `evidence()` reused; trigger list extended for custom kinds |
| DB-level integrity (FKs, CHECKs, typed grants, deferred triggers) | Unchanged for standard fields; custom values validated in app only | App-only for everything custom | **Lost** for the 4 objects (FKs become soft refs/association rows) or heavily re-emulated | Kept for standard, soft for custom (acceptable: user-defined data) |
| Migration effort from today | Low: add columns + registry; zero data moves | Medium: backfill nothing (no custom data yet) but new write/read paths for everything | **Very high**: move 4 tables, rewrite crm.ts/journey/transition/automation/normalize_won/merge, re-run M0-M2 evidence | Low in P1, additive in P2 |
| Formula support | Stored value in `custom` (filter/sort like any prop) or read-time SQL | Stored in EAV row; read-time impractical | Same as A | Same as A |
| Custom objects | Not supported by A alone (needs a table) | Natural | Natural | P2 via `record` table |
| Risk | JSONB bloat/TOAST on wide records; no DB-level types | Query-plan fragility; slow grids (core UX) | Rewrite risk on a validated, audited core; M0-M2 evidence invalidated | Two storage shapes (column vs jsonb) hidden behind compiler; mitigated by one registry |
| Reversibility | High (drop `custom` column; values remain in audit-free JSON) | Medium | Very low | High (each phase additive; C reachable later by migrating `record` rows if ever needed) |

Rejected: **B** (poor table-view performance; our core UX is filter/sort/columns; every multi-filter needs a join), **C** (rewrite of a delivered, evidence-backed core for no MVP benefit; loses composite FKs and typed integrity), **A-only** (cannot do custom objects, so it only defers the decision; D contains A as P1).

## 4. Decision: Option D, delivered in phases

### 4.1 Boundaries and dependency direction
`registry (definitions) -> validator -> write path (crm.ts)`; `registry -> query compiler -> list endpoints`; `views` store only config (never data; data scope always re-applied by RLS + scope predicate). UI depends only on the schema endpoint and list contract. No new process, queue, cache service or dependency (formula parser, if any, is hand-written).

### 4.2 Data model sketch (migrations 008+, additive; runtime gets only INSERT/UPDATE on listed tables, never DDL)
```sql
-- P1-S1 (008): ordering + timestamps for P0 tranche
ALTER TABLE crm.contact ADD created_at timestamptz NOT NULL DEFAULT now(), ADD updated_at timestamptz NOT NULL DEFAULT now(); -- same for deal, task
ALTER TABLE crm.lead ADD created_at timestamptz, ADD updated_at timestamptz;     -- created_at := received_at (backfill)
-- P1-S5 (009): registry + values
crm.object_type(tenant_id, key, kind 'standard'|'custom', label jsonb, schema_rev int, version int, archived bool, PK(tenant_id,key))
crm.property_group(tenant_id, id, object_type, key, label jsonb, position int)
crm.property_definition(tenant_id, id, object_type, key text /*^[a-z][a-z0-9_]{0,62}$, immutable, unique per object, must not collide with std keys*/,
  type text CHECK(...), display text, label jsonb, description jsonb, group_id, position, storage 'column'|'custom'|'record',
  column_name text, is_system bool, required bool, read_only bool, sensitive bool, searchable bool, indexed bool, show_default bool,
  validation jsonb, currency char(3), version int, archived_at timestamptz,
  UNIQUE(tenant_id,object_type,key), FK(tenant_id,object_type) -> object_type, FK(tenant_id,group_id) -> property_group)
crm.property_option(tenant_id, property_id, value text /*stable*/, label jsonb, color text, position int, archived bool, PK(tenant_id,property_id,value))
ALTER TABLE crm.contact|lead|deal|task ADD custom jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(custom)='object' AND pg_column_size(custom)<=32768), ADD search_text text NOT NULL DEFAULT '';
CREATE INDEX ... USING gin(custom jsonb_path_ops);  CREATE INDEX ... USING gin(search_text gin_trgm_ops);  -- pg_trgm (contrib, same as pgcrypto)
CREATE INDEX ... ON crm.<t>(tenant_id, created_at DESC, id DESC);  -- default sort; plus (tenant_id, owner_id, ...) for assigned scope
-- P1-S9: views
crm.saved_view(tenant_id, id, object_type, name, scope 'private'|'shared', owner_id, config jsonb, is_default bool, position int, version int, created_at, updated_at)
-- P2: custom objects + associations
crm.record(tenant_id, id, object_type, display_name, owner_id, custom jsonb, search_text, version, created_at, updated_at, PK(tenant_id,id), FK(tenant_id,object_type))
crm.association_type(tenant_id, id, from_type, to_type, label_fwd, label_rev, cardinality, required bool)
crm.association(tenant_id, type_id, from_kind, from_id, to_kind, to_id, PK(...))  -- integrity via trigger, generalizing check_object_reference
crm.property_unique(tenant_id, property_id, value_hash text, object_id uuid, PK(tenant_id,property_id,value_hash))  -- unique w/o DDL
```
All new tables: `ENABLE`+`FORCE ROW LEVEL SECURITY`, `tenant_boundary` policy, composite `(tenant_id,..)` FKs, same grant discipline. Value storage in JSONB, by property **key**: text/long text = string; number = JSON number; currency = integer minor units (currency fixed on the definition, so it is never mixed); date `YYYY-MM-DD`, datetime ISO-8601 UTC fixed width (so string order = time order and a plain text btree works); single-select = option `value`; multi-select = sorted array of values; checkbox = boolean; user = principal uuid validated by `assignment_ok`. Null/absent = key removed.

### 4.3 Standard fields as system properties
The registry lists standard columns with `storage='column'`. The compiler resolves every property key to an SQL expression: column -> `t.<col>`; custom -> `(t.custom->>'k')` (cast per type, guarded by `jsonb_typeof`); keys are validated against the registry and bound as parameters, never concatenated from input. This is why the UI never needs to know where a value lives and why P1 can ship without moving a single existing row.

### 4.4 API shape (all `/v1`, additive; existing routes/fields keep working; same headers, error envelope, `Idempotency-Key`+`command_id` on mutations)
Schema (registry):
- `GET /v1/schema/objects`; `GET /v1/schema/{object}/properties` -> `{object, schema_rev, groups[], properties[{key,label,type,display,group,storage,is_system,required,read_only,sensitive,searchable,options[],filterable_ops[],sortable,show_default,version}]}`. Properties the caller may not read (sensitive) are omitted.
- `POST /v1/schema/{object}/properties` (key,type,label,... ; type/key immutable after create); `PATCH .../{key}` + `expected_version` (label, group, description, options, flags); `POST .../{key}/archive` (never hard delete; values stay in JSON, hidden, cleaned by a later job); `PUT .../{key}/options` replaces the ordered set (option `value` stable; removed option = archived, existing values render as "(archived)").
- Every change: audit (`object_kind='property'`), `schema_rev+1`, `property.updated` event.

Records: PATCH/POST on existing routes accept `properties:{key:value|null}` next to current standard fields. Unknown key -> 422 `UNKNOWN_PROPERTY`; type failures -> 422 `{errors:[{property,code}]}`; stale -> 409 `VERSION_CONFLICT` (record-level). Responses keep standard fields top-level and add `properties` (custom only) + `created_at,updated_at`.

List (P0 tranche): `GET /v1/{contacts|leads|deals|tasks}?q=&filter=&sort=&fields=&limit=&cursor=&expand=&include_total=&view_id=` (also `POST .../search` with the same JSON body for long filters; read-only, exempt from `Idempotency-Key`).
- `filter` = URL-encoded JSON `{"and":[{"p":"stage","op":"in","v":["..."]},{"or":[{"p":"lead_stage","op":"eq","v":"hot"},{"p":"amount","op":"gte","v":500000}]}]}`. Ops by type: `eq neq in nin is_null not_null` (all); `gt gte lt lte between` (number/currency/date/datetime); `contains starts_with` (text; trigram); `has_any has_all` (multi-select); `is true/false` (checkbox). Limits: depth 3, 20 conditions, 4 KB. Compiled to parameterized SQL only.
- `sort=-created_at,lead_stage` (max 2 keys + implicit `id` tiebreak, nulls last). Only properties the registry marks `sortable` (text/number/date/select-by-option-position; multi-select not sortable).
- `q`: trigram match on display name/title/`search_text` (+ searchable custom props) and, when it parses as phone/email, the existing keyed identifier digest (no plaintext compare; sensitive rules unchanged).
- `fields=display_name,lead_stage,stage` limits projection (replaces `SELECT *`); default = view/system default columns. Sensitive properties are removed server-side if the actor lacks permission.
- Keyset cursor: opaque base64url `{v:[sortvalues],n:[nullflags],id,fp}` where `fp` = hash(filter+sort+schema_rev); predicate expands to the row-comparison OR-chain, so deep paging is O(limit). A legacy UUID cursor with no filter/sort is still accepted (old default order is kept only for that legacy form; new default is `-created_at,id`). Mismatched `fp` -> 422 `CURSOR_STALE`.
- Envelope: `{data[], next_cursor, has_more, total_count:{value,exact}, schema_rev}`; `total_count` only when `include_total=1`, counted with a cap (`LIMIT 10001` subquery; `exact:false` above the cap) to avoid 1M-row counts.
- `expand=contact,owner,stage,pipeline,lead,deal` returns `{id,display_name|name}`; owner names go through a definer lookup limited to active members of the context tenant (same policy as `assignees()`); a contact the actor cannot read (rep scope) returns `{id, restricted:true}` instead of a name. Removes F-02/F-11.

Views: `GET/POST /v1/views?object=` , `PATCH/DELETE /v1/views/{id}` (+`expected_version`). `config={columns:[{key,width?}], filter, sort[], query, density, page_size}` (superset of the grid's `ViewState`). Validated against the registry at save; at read, archived/unreadable keys return `stale_columns:[...]` instead of failing. Passing `view_id` to a list applies it, explicit params override. Private views: any member with `crm.read` (reader included; a view holds no data). Shared views and "default for everyone": `view.manage`. One-time client import of existing localStorage views via POST, then clear the local key.

### 4.5 Permissions (extend the fixed catalogue in `role_permission`; no generic ACL engine)
`property.manage` = manager (+MFA, via `mfa_ok`): create/alter/archive definitions and option sets. `view.manage` = manager (shared views). `view.write` = manager, rep, reader, analyst (private views). Value writes: `crm.write` on the record (assigned scope for reps, unchanged) + `sensitive.write` when the property is `sensitive`; `read_only`/system/formula properties reject writes. Agency grants and the worker get none of the new actions. Definitions are per tenant; an agency manager cannot see another tenant's registry (RLS).

### 4.6 Query performance and indexing (estimates, to be proven in P1-S10)
- Default: `(tenant_id, created_at DESC, id DESC)` and `(tenant_id, owner_id, created_at DESC, id DESC)` serve the common table and the "assigned" scope.
- Equality/multi-select/checkbox on custom: one GIN `jsonb_path_ops` per table (bitmap-ANDed with the tenant btree).
- Sort or range on a custom property at >~200k rows: property flag `indexed` (max 5 per object per tenant). Because runtime has no DDL, a privileged **owner-only** function/worker (same pattern as `provision_identifier_key` in 005) runs `CREATE INDEX CONCURRENTLY ... ((custom->>'k')) WHERE tenant_id='...'` (typed cast per property type) and flips `indexed_ready`. Until ready, the API still answers (slower) and the UI shows a hint. This avoids both per-tenant DDL from the app and EAV.
- `total_count` capped; no `OFFSET` anywhere.
- Gate (P1-S10): 50k and 1M synthetic rows/tenant, EXPLAIN (ANALYZE, BUFFERS) on: default list, filter by stage + owner, filter on custom select, sort by custom number, q search. Pass bar proposed: p95 <= 300 ms at 50k, <= 1.0 s at 1M with an enabled index. If JSONB cannot meet it, the compiler abstraction lets a hot property be promoted to a real column without API change (that is the "typed promoted column" escape hatch of C).

### 4.7 Validation pipeline (single place: `validateProperties(registry, object, patch, actor)`)
1) shape/size (existing `fields()`; 4 KB->64 KB cap for bodies carrying `properties`); 2) load registry for (tenant, object), compare `schema_rev` inside the same transaction; 3) per-property authority (read_only, sensitive.write); 4) type coercion/validation (finite number, integer minor units, ISO date, option in active set, user via `assignment_ok`, multi-select <= 50); 5) required (create, and non-clearable); 6) size caps; 7) merge `custom = (custom || $patch) - $removed_keys`, rebuild `search_text` for searchable properties; 8) `version+1` with `expected_version`; 9) `evidence()` with `changed_fields = [...std, 'custom:<key>']`. Old rows that violate a newer rule remain readable; rules apply to new writes only. Merge job (`/contacts/merges`): target wins per key, source-only keys are filled in and listed in the preview (extends existing "target fields win" rule).

### 4.8 Security, isolation and recovery notes
- Two-tenant isolation tests are mandatory for every new table and for `custom` values (tenant B cannot read A's definitions or values, nor pass A's `property_id` in FK/filter).
- **Prerequisite change (P1-S3):** replace per-row definer calls in list queries/policies. Compute scope once per request: `scope='tenant'` -> no per-row function; `scope='assigned'` -> `owner_id = actor`; agency grant keeps the fixed-deal path. Policy form `tenant_id = (SELECT crm.context_tenant_if_allowed())` makes the access check an initplan. Both changes need Lead/Deep security review and the existing isolation suites green before merge.
- Replace `SELECT *` with explicit projection before `custom` exists, otherwise sensitive custom values would be returned to readers.
- Formula sandbox (P3): parsed AST only, no `eval`/`Function`, whitelisted functions, depth/length caps, no I/O, no recursion; dependency graph with cycle detection at definition time.
- Recovery: all migrations additive; rollback = keep columns, stop reading them (ADR-001/M1 rule: never drop populated columns); backup before each migration step.

### 4.9 Formula and rollup approach (P3)
Language: literals, `{property}` refs, `+ - * /`, comparisons, `IF/AND/OR/NOT/COALESCE`, `CONCAT/LOWER/UPPER/LENGTH`, `ROUND/MIN/MAX`, date diff in days. Hand-written parser to AST (`type` of result inferred and stored on the definition). **Computed on write, stored in `custom`** (same transaction, same version bump), so formulas are filterable/sortable/indexable like any property and cannot make list reads slower. On definition create/edit or when a referenced property changes: resumable keyset-batched backfill job through the existing outbox/worker loop (one evaluator in TS, golden-vector tests; no second SQL evaluator to drift). Non-deterministic functions (`NOW()`, age) are excluded in MVP (or flagged display-only, not filterable). Rollups (count/sum/min/max over associations) are asynchronous via outbox events, show `computed_at`, eventually consistent by design.

### 4.10 Migration plan for existing data (zero downtime, local)
Expand/contract on the one dev DB; the running API (4317) keeps working throughout because every step is additive and old code ignores new columns.
1. 008: add `created_at/updated_at` (constant/`now()` defaults = metadata-only in PG 17, no table rewrite) + new indexes `CREATE INDEX CONCURRENTLY` outside the migration transaction (migration runner must support a non-transactional step; today's lock-serialized runner needs a small extension, flagged in slice S1). Backfill `created_at`: lead = `received_at`; others = earliest `*.created` audit row for that object (audit_log has `occurred_at`; M1+ writes `<kind>.created`; M0-era rows have none), else migration time and honestly labelled "unknown". Keyset-batched (500), resumable, idempotent; then `CHECK ... NOT VALID` + `VALIDATE`. `updated_at` set by a BEFORE UPDATE trigger (runtime grant extended by column).
2. 009: registry tables + `custom`/`search_text` columns (default `'{}'`/`''`, no rewrite). Seed per tenant the system definitions for the 4 objects (idempotent function; run for all tenants at migrate time and by privileged tooling for new tenants, same as seed today). Add `GRANT UPDATE(custom,search_text,updated_at)` + new tables' grants.
3. Deploy projection/query code (P1-S2/S3) first, then writes with `properties` (S7). No existing record needs data conversion: today there are no custom fields, so `custom='{}'` is correct.
4. Verify: row counts equal before/after per table; no NULL `created_at` after VALIDATE; `schema_rev` seeded; RLS probes from two tenants; old unit/e2e suites still green; M2 evidence scripts (`m2-clean-check`, `m2-upgrade-check`) pass against a disposable DB. Forward-fix instead of down-migration.
5. P2 `record`/association tables are separate additive migrations; nothing in standard tables changes.

### 4.11 Test strategy (summary; TSST-DEV-SK-011 not invoked)
Unit: type validators (valid/invalid/boundary per type), filter-compiler golden SQL + injection fuzz (keys/ops/values), cursor round-trip/stale, formula vectors + cycle detection (P3). DB integration (real PG, existing fixtures): cross-tenant isolation per new table, rep-assigned scope on filtered/sorted lists, sensitive redaction, version conflicts on concurrent property PATCH, idempotent replay, resumable backfill, old-code/new-schema compatibility. Volume: synthetic 50k/1M seeds + EXPLAIN gates (4.6). E2E (Playwright, 5k rows): search finds a record beyond the 150th (F-01), names present at scale (F-02), add/hide a custom column, filter by custom select, saved shared view, AR/RTL labels.

## 5. Phased delivery

| Phase | Slices | What the UI gets |
|---|---|---|
| **P1a: server query tranche** (independent, valuable alone; delivers DEV_REVIEW P0) | S1 migration 008 timestamps/indexes/backfill (M); S2 query compiler over *system* properties: `q/sort/filter` + keyset + `has_more/total_count` (L); S3 explicit projection, `expand`, RLS scope hoisting + isolation re-proof (M, security review); S4 UI: re-point `useCursorList` at server params, remove client-sample search (UI) | Search/sort/filter over all rows, real names, "50 of 4,213", newest-first |
| **P1b: property engine on standard objects** | S5 migration 009 registry + `custom` + seeds (M); S6 schema API + permissions + audit (M); S7 record write path: validator, merge, evidence, merge-job integration (L); S8 compiler extension to custom props, `search_text`, per-type ops (M); S9 saved views server + localStorage import (M); S10 perf spike + gates + `indexed` owner-only function (L); S11 docs/contract (M1_CONTRACTS addendum, OpenAPI-style tables) (S) | Property settings page (create text/number/currency/date/select/multi/checkbox/user, options, groups); add/hide custom columns; typed filter builder; custom fields on record forms; shared/private view tabs |
| **P2: custom objects + associations** | `object_type` custom CRUD (`c_` key prefix); `record` table + generic `/v1/objects/{type}`; generalize `check_object_reference`, `object_authorized`, `evidence()` kinds; association types/labels/cardinality + required-on-create; filter "associated with X"; expand via associations; `unique` claims; property value history; board/group-by view | Object builder, association cards on record page, custom-object tables with the same grid |
| **P3: formulas, rollups, refinements** | Parser + type inference; stored computation + backfill job; dependency graph; rollups via outbox; conditional required; lead status as option set with semantic category; read-time formulas (flagged) | Formula editor with preview, calculated columns, rollup columns |

Gate between phases: P1a needs Lead go; P1b starts only after P1a security review and the S10 spike thresholds are agreed; P2 only after P1b is accepted by the user.

## 6. Consequences
Positive: no rewrite of the validated M0-M2 core; tenant isolation, versioning, audit, outbox and idempotency are reused as-is; grids become correct at scale; user-defined properties without DDL; the registry unlocks custom objects, views and formulas as additive layers.
Negative: two storage shapes behind one compiler; custom values lack DB-level integrity/types (validated in app; mitigated by one validator and tests); JSONB sort/range at 1M needs privileged index management; registry cache/`schema_rev` adds a small invalidation concern; `SELECT *` removal and RLS hoisting touch security-sensitive paths (needs review).
Reversal/migration triggers: if spike S10 fails the pass bar and promotion to columns is not enough -> reconsider C for the hot objects; if >30% of properties get promoted to columns -> adopt C's typed-slot columns; if tenants need >100 properties/object -> revisit limits, not the model.

## 7. Open questions for the user (recommended answer first)
1. **Custom objects now or later?** Recommended: P2 (after properties ship on contact/lead/deal/task). The registry is designed so they are additive; doing both at once doubles risk.
2. **"Lead stage": system `status` stays (open/qualified/closed lifecycle) plus a user-defined `lead_stage` dropdown, or make lead status itself fully configurable?** Recommended: keep status as is and add the custom dropdown now; make status configurable with semantic categories in P3 (it drives qualification rules and reports).
3. **Who defines properties?** Recommended: managers only (with MFA); reps get private views only; shared views by managers. Alternative: allow reps to create private properties (not recommended: breaks shared reports).
4. **Formulas: stored on write (recommended) vs always live?** Stored values are filterable/sortable and fast; live values are always fresh but cannot be filtered at scale. Time-dependent formulas (age, days overdue) excluded from MVP. Confirm.
5. **Limits and labels:** 100 custom properties/object, labels required in at least one of Arabic/English (the other falls back), phone/email stay protected identifiers (no custom phone/email type), `unique` deferred to P2. Confirm or adjust.

## 8. Approval request
Approve Option D and P1a (server query tranche) as the first execution slice, with P1b following after the S10 performance gate. Nothing in this ADR has been implemented.

## 9. Decision record (user, 2026-10-06)
- ACCEPTED: Option D (hybrid), phased; P1a server query tranche first; §7 recommended answers 1–5.
- Client stack (TECH_RESEARCH picks) ACCEPTED, adoption gated by a BUILD RTL spike: React Aria Components (behaviour/a11y/RTL) styled with **Tailwind CSS** (user preference for component styling, mapped to existing `--sy-*` tokens), TanStack Table + Virtual, dnd-kit (+ "Move to…" alternative), TanStack Query, React Hook Form + Zod, react-querybuilder (AST only), motion (lazy), in-house formula engine (P3).
- Visual direction: user likes transparency / glass effect — CREATIVE_AG to spec within the approved token system (contrast, dark, RTL, reduced-transparency).
- Skills: import React Aria, TanStack, Postgres best-practices skills via TSST-CTX-SK-023 + BUILD test; author RTL/bidi QA skill and property-grid skill.
