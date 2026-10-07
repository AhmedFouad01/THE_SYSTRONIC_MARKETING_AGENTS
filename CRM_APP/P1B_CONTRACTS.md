# P1b contracts (ADR-002, DEV_AG)

Additive to `M1_CONTRACTS.md` and `P1A_CONTRACTS.md`. Headers, error envelope, `Idempotency-Key` + `command_id` are the M1 conventions. Skills applied (UNVALIDATED): TSST-DEV-SK-005 (API), -007 (authorization), -011 (tests).

## B2 Schema API (registry) — server half, migration 011

Base: `/v1/schema`. Implemented in `src/schema.ts` (routes, DB rules) and `src/schemarules.ts` (the ONE validator: `validateProperty`, `validateGroup`, `validateOptionWrite`, `validateOrder`; pure, unit-tested). Body limit for `/v1/schema/*` is 64 KB (others stay 16 KB).

### Permissions (fixed `role_permission` catalogue, migration 011; all scope `tenant`, none record-scoped)
| Action | manager (MFA) | rep | reader | analyst | agency grant | worker |
|---|---|---|---|---|---|---|
| `schema.read` (all GETs) | yes | yes | yes | no | no | no |
| `property.manage` (every write below) | yes | no | no | no | no | no |
| `view.manage` (B5, not used yet) | yes | no | no | no | no | no |
| `view.write` (B5, not used yet) | yes | yes | yes | yes | no | no |

Enforced in the database (`crm.can_object`: tenant membership + `mfa_ok` + role action). A manager session without MFA gets 403 on reads and writes. Agency grants are fixed-deal only, so they never reach `property`/`view` actions. Permission is checked before any object/key lookup (an unauthorised caller learns nothing about existence). Sensitive properties are omitted from every read for callers without `sensitive.read` (reader); reps and managers see them. Tenant isolation is RLS (`tenant_boundary`, initplan form from 010): another tenant's keys return 404.

### Routes
| Method + path | Purpose | Status |
|---|---|---|
| `GET /v1/schema` | `[{key,kind,label,schema_rev}]` objects of the tenant | 200 |
| `GET /v1/schema/{object}` | Full schema. Query: `include_archived=1` (archived properties/groups, flagged `archived:true`), `options=none` (omit option lists, keep `option_count`; lazy loading) | 200 |
| `GET /v1/schema/{object}/properties/{key}` | One property with all options (archived properties visible only with the key; hidden sensitive -> 404) | 200 |
| `POST /v1/schema/{object}/properties` | Create custom property | 201 (200 replay) |
| `PATCH /v1/schema/{object}/properties/{key}` | Edit (needs `expected_version`) | 200 |
| `POST /v1/schema/{object}/properties/{key}/archive` | Archive (never delete) | 200 |
| `POST /v1/schema/{object}/properties/order` | Reorder: `{keys:[all active keys], expected_schema_rev}` | 200 |
| `POST /v1/schema/{object}/properties/{key}/options` | Add option | 201 |
| `PATCH /v1/schema/{object}/properties/{key}/options/{value}` | Edit/archive/reactivate option | 200 |
| `POST /v1/schema/{object}/properties/{key}/options/order` | Reorder: `{values:[all active values], expected_version}` | 200 |
| `POST /v1/schema/{object}/groups` | Create group | 201 |
| `PATCH /v1/schema/{object}/groups/{key}` | Edit group (`expected_version`) | 200 |
| `POST /v1/schema/{object}/groups/{key}/archive` | Archive (409 `GROUP_NOT_EMPTY` while it holds active properties; the seeded `general` group always does) | 200 |
| `POST /v1/schema/{object}/groups/order` | Reorder: `{keys, expected_schema_rev}` | 200 |

`{object}`: `contact|lead|deal|task` (registry-driven: any non-archived `object_type` key). No hard delete route exists; runtime has no DELETE grant.

### GET /v1/schema/{object} payload
`data = {object, kind, label, schema_rev, limits:{properties:100,options:200,groups:50}, types:[{type,displays[],validation[],options}], option_colors[8], groups:[{key,label,position,version,archived}], properties:[…]}`.
Property: `{key,label{en?,ar?},description|null,type,display,group(key),position,storage,is_system,required,read_only,sensitive,searchable,indexed,show_default,validation{},currency|null,version,archived,option_count,options:[{value,label,color|null,position,archived}]}`. Archived options are always listed (flagged) so stored values keep a label ("(archived)"). Everything is read in ONE SQL statement (one snapshot), so `schema_rev` always matches the content. Size: 100 custom properties (25 single-selects × 12 options) + system properties 81,622 bytes measured; bar 128 KB (decision 12). Worst case (100 × 200 options) exceeds it: use `options=none` + the single-property GET (lazy option loading).
Not yet present (additive later): `filterable_ops`, `sortable` (B4).

### Write bodies (unknown fields -> 422 `FIELD_NOT_WRITABLE`; every write needs `command_id` UUID and `Idempotency-Key`)
- Create property: `key` `^[a-z][a-z0-9_]{0,62}$` (reserved: `id, tenant_id, version, custom, custom_search, properties, schema_rev, constructor, prototype, *_id` of records, JS Object.prototype names…), `type` (text, long_text, number, currency, date, datetime, single_select, multi_select, checkbox, user), `label {en?,ar?}` (≥1 non-empty, ≤120 code points, NFC-trimmed, no control or bidi override/isolate characters; LRM/RLM allowed), optional `description {en?,ar?}|null` (≤500), `group` (key, default `general`), `position` (0..1,000,000, default last+10), `display` (per type: text/long_text/number/currency/date/datetime/checkbox/user `default`; single_select `default|dropdown|radio`; multi_select `default|checklist`), flags `required, read_only, sensitive, searchable, show_default`, `validation` (text `max_length` 1..2000, long_text `max_length` 1..20000, number/currency `min`,`max` (currency integers, min<=max), multi_select `max_selected` 1..50), `currency` (required iff type=currency: ISO-4217 uppercase, validated against `Intl`; forbidden otherwise), `options[]` (select types only, ≤200: `{value,label,color?,position?}`).
  Cross-rules: `required` + `read_only` rejected; `sensitive` + `searchable` rejected (search text is readable by readers); `searchable` only for text/long_text. `indexed` is not writable (reserved for the admin index job, B6).
- Patch property: `expected_version` + any of `label, description, group, position, display, required, read_only, sensitive, searchable, show_default, validation`. `key, type, currency, storage, column_name, is_system, object_type, options, indexed, version` -> 422 `FIELD_NOT_WRITABLE` (issue `IMMUTABLE`). **System properties** (`is_system`, standard columns): only `label, group, position` -> otherwise 422 `SYSTEM_PROPERTY_IMMUTABLE`; archive refused; options cannot be added or archived (label/color/position of existing options may change).
- Option: create `{expected_version, value, label, color?, position?}` (value `^[a-z0-9][a-z0-9_-]{0,63}$`, stable forever; color in `option_colors` or null); patch `{expected_version, label?, color?, position?, archived?}`. Option writes use the PROPERTY's `version` as the concurrency token and bump it.
- Group: `{key,label,position?}`; patch `{expected_version,label?,position?}`; max 50 active per object.

### Concurrency, idempotency, schema_rev
- `expected_version` in the body (M1 convention; `If-Match` is not used) must equal the row's `version`, else 409 `VERSION_CONFLICT`. Orders use `expected_schema_rev` (property/group order) or the property `expected_version` (options). A request whose key set does not match the active set -> 422 `REORDER_SET_MISMATCH`.
- Every write takes a per-object row lock (`object_type FOR UPDATE`): writes to one object serialise; `schema_rev` increases by exactly 1 per effective change (create, edit, archive, option add/edit, order, group change). A no-op edit (same values) changes nothing: no version, no `schema_rev`, no evidence.
- `command_id` receipts (`crm.inbox`) + `Idempotency-Key` cache (`crm.command_retry`, 7 days) via the M1 `durable()`: same command and body -> 200 with `replayed:true`, nothing applied; same command or key with a different body or target (the request target is part of the hash) -> 409 `IDEMPOTENCY_CONFLICT`. Replay re-authorises first.
- Mutation response: `{object, schema_rev, replayed, property|group|properties|groups}` (orders return `[{key,position,version}]`).

### Evidence
Every effective change writes `audit_log` + `business_event` + `outbox` in the same transaction with `object_kind='property'` (property/option changes; actions `property.created|updated|archived`) or `'property_group'` (`property_group.created|updated|archived`). `changed_fields` holds field names only (`label`, `option:<value>`, `position`…), never values. Migration 011 extends `crm.check_object_reference()` to accept both kinds (definition / group must exist in the same tenant). The worker processes these outbox rows as no-ops.

### Errors (envelope `{code, safe_message, request_id, retryable}` plus optional `errors:[{field,code}]`)
| Status | `code` | When / `errors[].code` |
|---|---|---|
| 401 / 403 | `UNAUTHENTICATED` / `FORBIDDEN` | no session / missing action, MFA, agency, wrong tenant |
| 404 | `NOT_FOUND` | unknown route/object/property/group/option (also another tenant's) |
| 409 | `VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `KEY_EXISTS`, `OPTION_EXISTS`, `PROPERTY_ARCHIVED`, `GROUP_ARCHIVED`, `GROUP_NOT_EMPTY` | state conflicts |
| 413 | `PAYLOAD_TOO_LARGE` | body > 64 KB |
| 422 | `VALIDATION_FAILED` + `errors[]` | all violations at once: `KEY_INVALID, KEY_RESERVED, TYPE_INVALID, LABEL_REQUIRED, LABEL_INVALID, LABEL_LANG_UNSUPPORTED, DESCRIPTION_INVALID, CURRENCY_REQUIRED, CURRENCY_INVALID, CURRENCY_NOT_ALLOWED, DISPLAY_INVALID, OPTIONS_NOT_ALLOWED, OPTIONS_INVALID, OPTION_VALUE_INVALID, OPTION_DUPLICATE, OPTION_COLOR_INVALID, VALIDATION_INVALID, VALIDATION_KEY_UNKNOWN, VALIDATION_RANGE_INVALID, POSITION_INVALID, BOOLEAN_REQUIRED, VERSION_REQUIRED, REQUIRED_READ_ONLY, SENSITIVE_NOT_SEARCHABLE, SEARCHABLE_TYPE_UNSUPPORTED, GROUP_NOT_FOUND, ORDER_INVALID, ORDER_DUPLICATE, REORDER_SET_MISMATCH` |
| 422 | `FIELD_NOT_WRITABLE` + `errors[{field,code:UNKNOWN\|IMMUTABLE}]`; `SYSTEM_PROPERTY_IMMUTABLE`; `PROPERTY_LIMIT_EXCEEDED` (100 active custom per object); `OPTION_LIMIT_EXCEEDED` (200 active per property); `GROUP_LIMIT_EXCEEDED` (50) | |

Limits are also enforced by the 010 DB triggers (backstop; the API pre-checks answer first).

### Migration 011 (additive; forward-fix only)
Permission rows above; `property_group.version` + `.archived` (+ `GRANT UPDATE(version,archived)`); `check_object_reference()` accepts `property` and `property_group` (still SECURITY DEFINER, `REVOKE ALL FROM PUBLIC`). Rollback = remove the routes; registry rows stay inert.

## B3 Record write path: custom property values — server half (no migration; uses 010 columns + 011 permissions)

Implemented in `src/properties.ts` (the ONE validator `validateProperties(registry, object, patch, actor, {mode, current})`, pure and unit-tested, plus the DB helpers) with thin call sites in `crm.ts`, `list.ts`, and one predicate in `listquery.ts` (`q`). Skills applied (UNVALIDATED): TSST-DEV-SK-005, -006, -011.

### Write: `properties` on POST/PATCH of `/v1/{contacts|leads|deals|tasks}` (and on the inline `contact` object of a lead create)
- Body: `properties: {key: value|null}` next to the existing fields (+ `command_id`, and `expected_version` on PATCH). PATCH is a partial update: absent keys are untouched; `null`, `""` (text) and `[]` (multi-select) clear (the key is removed, nulls are never stored). Body limit stays 16 KB.
- Values: text/long_text string (NFC, trimmed; no control/bidi-override chars; newline only in long_text; `max_length` counted in code points, defaults 2000/20000); number finite, |v| <= 1e15, `min/max`; currency = integer minor units (safe integer) in the property's fixed currency; date `YYYY-MM-DD` (real calendar date); datetime ISO 8601 with `Z` or offset, stored/returned as UTC instant `...T..:..:..sssZ`; checkbox boolean; single_select = option `value` (active); multi_select = string[] of active option values, unique, <= `max_selected` (<= 50); user = principal id (uuid, must pass `crm.assignment_ok`). An option archived after it was chosen stays valid while unchanged; it cannot be newly chosen. Types url/email/phone do not exist in the registry type list, so they are not implemented.
- Rules: unknown key (also a system column such as `source`, `__proto__`, malformed key) -> 422 `UNKNOWN_PROPERTY`; archived property -> `PROPERTY_ARCHIVED`; `read_only` -> `READ_ONLY` (even to clear); `required` -> `REQUIRED` on create (missing/null/empty) and when clearing; a required property added later does not block edits that do not touch it. Merged `custom` > 24,000 JSON bytes -> 422 `PROPERTIES_TOO_LARGE` (010 CHECK is the backstop, mapped to the same code). > 100 keys / non-object `properties` -> 422 `VALIDATION_FAILED`.
- Sensitive: a sensitive property needs `sensitive.write` to write and `sensitive.read` to read, checked on THE record (rep: assigned only; agency grants: never). A caller without `sensitive.read` gets `UNKNOWN_PROPERTY` for it (no existence oracle); a caller who may read but not write gets 403. A required sensitive property the caller cannot see is skipped on create.
- Errors: `{code, safe_message, request_id, retryable, errors:[{field:"properties.<key>", property:"<key>", code}]}`, ALL violations in one response; top-level `code` = `UNKNOWN_PROPERTY` if any key is unknown, else `VALIDATION_FAILED`. Per-property codes: `UNKNOWN_PROPERTY, PROPERTY_ARCHIVED, READ_ONLY, REQUIRED, INVALID_TYPE, INVALID_VALUE, MAX_LENGTH, MIN_VALUE, MAX_VALUE, MAX_SELECTED, OPTION_UNKNOWN, OPTION_ARCHIVED, DUPLICATE_OPTION, USER_INVALID, TOO_MANY_PROPERTIES`. Stale `expected_version` -> 409 `VERSION_CONFLICT` (record level, nothing written).
- Atomicity: the registry slice is read in the record's transaction under `FOR KEY SHARE` on the `object_type` row (B2 schema writes hold it `FOR UPDATE`, so a definition change and a record write serialise); the record row is locked `FOR UPDATE`; value validation, merge, `custom_search` rebuild, `version+1`, audit/event/outbox and the `durable()` receipt commit or roll back together. Replay (same command/key/body) returns `replayed:true`, applied once; same command with a different body -> 409 `IDEMPOTENCY_CONFLICT`.
- Evidence: `changed_fields` = standard field names + `custom:<key>` for keys whose value actually changed, keys only, never values (not for sensitive ones either); `properties` itself is never listed.

### Storage
`custom` = merged JSON of only keys that hold a value. `custom_search` = `crm.normalize_search()` of the searchable + active + non-sensitive text/long_text values (registry order, joined with U+001F), truncated to 8192 bytes on a UTF-8 boundary, rebuilt on every write that carries `properties` (and on merge). No backfill (decision 10); rows never written keep `custom='{}'`, `custom_search=''`.

### Read
- `GET /v1/{kind}/{id}` and every write response add `properties:{key:value}`: only active custom properties that hold a value; sensitive ones only with `sensitive.read` on that record. `version` and standard fields unchanged; the `custom` blob is never returned.
- Lists: no `properties` by default (P1A-S1 projection unchanged). `?props=key1,key2` (max 20, unique) adds `properties` with only those keys to each row; unknown / archived / unreadable-sensitive key -> 422 `UNKNOWN_PROPERTY`; `props=` (empty) -> `{}`. Chosen over the ADR's generic `fields=` because P1a never implemented `fields=` and plan row B4 already names `props=`.
- `q` also matches `custom_search` (folded both sides; sensitive and non-searchable values are never in it).

### Contact merge (`/v1/contacts/merge-previews`, `/merges`)
Target wins per key; keys only the source has (or whose target value is empty) are filled in. Preview adds `custom:{fill:[keys], conflicts:[keys where both differ, target kept], fits:boolean}` (existing `conflicts` array unchanged). Commit applies the fill and rebuilds the target's `custom_search`, lists `custom:<key>` for filled keys in the target's `contact.merge_received` audit row, leaves the source's own values untouched, and refuses with 422 `PROPERTIES_TOO_LARGE` (nothing applied) when the merged blob would exceed the cap. Sensitive keys are listed/filled only for a caller with sensitive read+write.

### Session
`GET /v1/session` adds `schema_read` and `property_manage` (booleans, from `crm.can_object('schema.read'|'property.manage','property',NULL)`): manager true/true, rep and reader true/false.

### Known limits (follow-ups)
`custom_search` is not rebuilt when a property's `searchable`/`sensitive` flag changes or it is archived (no backfill); rows keep stale search text until their next write (a q hit/no-hit oracle, never a value): needs a bounded rebuild job (B4/B6). A list `props=` sensitive check is per request (tenant level), exact because rep lists are already assigned-only.
