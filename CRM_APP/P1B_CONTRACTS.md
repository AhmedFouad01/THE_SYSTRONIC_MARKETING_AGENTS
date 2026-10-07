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
