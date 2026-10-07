# Import — server API contract (roadmap v2 item 3, server half)

Migration **018** (013-017 reserved for auth). Code: `src/import.ts` (routes, plan, job), `src/importfile.ts` (CSV/XLSX parse + limits),
`src/importmap.ts` (mapping, cell coercion). Tests: `tests/import.unit.test.ts`, `tests/import.test.ts` (in `test:db`).

All routes: `Authorization: Bearer`, `X-Tenant-Id`; POST also needs `Idempotency-Key` (any string; the real idempotency is by file content, below).
Envelope: `{ data, request_id }`; errors `{ code, safe_message, request_id, retryable, errors?: [{field, code}] }`.
**Authority:** action `crm.import` (manager only, MFA) plus `crm.write`, plus `sensitive.write` when email/phone is mapped. Rep, reader, worker and agency
grants get 403 on every route. Everything is tenant-scoped under RLS.

## Routes
| Method + path | Purpose |
|---|---|
| `GET /v1/imports/fields?object=contact\|lead` | Mapping targets (fixed + the tenant's active, writable custom properties, with select options) and the hard limits |
| `POST /v1/imports/inspect` | Authorized upload structure and first three raw sample rows. **Writes nothing.** |
| `POST /v1/imports/preview` | Parse + validate + duplicate-check. **Writes nothing.** |
| `POST /v1/imports` | Run the import (one transaction). 201 new job, 200 `replayed: true` |
| `GET /v1/imports?cursor=` | Jobs, 50 per page (`next_cursor`) |
| `GET /v1/imports/:id` | One job |
| `GET /v1/imports/:id/rows?outcome=&after=` | Per-row outcome ledger, 200 per page (`next_after`) |

## Upload inspection (I1 UI)
`POST /v1/imports/inspect`: `{object,format,filename,file_base64,options?:{sheet}}` with the same file/name/format/sheet validation and guarded parser limits as preview. Unknown keys, mapping and other options are rejected. The existing no-agency `crm.import` + `crm.write` gate runs before file decoding/parsing; raw samples come exclusively from the caller's uploaded file, never CRM rows or inferred property targets.
Response `data`: `{object,format,file{name,sha256,bytes},limits,headers,total_rows,sheet,samples:[{row,cells}]}`. At most three data rows; original spreadsheet row numbers; at most 100 columns; dates serialize as ISO strings; formula-like values remain plain text. Default XLSX sheet is 1; CSV sheet is null. No duplicate checks, identifier lookup, registry matching or writes occur.
`/fields` additionally returns `sensitive_mapping` (read + write rights on the selected object). Its existing target list remains compatible; clients hide email/phone and sensitive custom targets when this flag is absent/false. Older servers cannot enable sensitive mapping in the staged UI until they expose this authority flag.

## Request body (preview and commit)
```json
{
  "object": "contact" | "lead",
  "format": "csv" | "xlsx",
  "filename": "clients.csv",
  "file_base64": "<base64 of the raw file bytes>",
  "mapping": { "columns": [ { "column": 0, "target": "display_name" }, { "column": 3, "target": "property:company" } ] },
  "options": { "duplicate_mode": "skip|update|create", "error_policy": "skip|abort", "owner_id": "<uuid>",
               "default_country_code": "+20", "sheet": 1 },
  "preview_rows": 20
}
```
`options` and every option are optional (defaults: `skip`, `skip`, the caller, none, first sheet). `preview_rows` (1-100) is preview only. Unknown keys are 422.
`format` must match the bytes (ZIP magic for xlsx) or 422 `FORMAT_MISMATCH`. `column` is the 0-based index into `headers` (preview returns them).

### Targets
* contact: `display_name` (required), `email`, `phone`, `property:<key>`
* lead: `title` (required), `contact_name`, `email`, `phone`, `source_evidence` (default `import:<filename>`), `property:<key>` (lead properties)
* `user`-typed, read-only, archived and (without read+write on sensitive) sensitive properties cannot be mapped. Each target at most once.
* Mapping problems: 422 `MAPPING_INVALID` with `errors[]` codes `UNKNOWN_TARGET`, `UNKNOWN_PROPERTY`, `DUPLICATE_TARGET`, `COLUMN_OUT_OF_RANGE`, `REQUIRED_TARGET_<NAME>`.

### Cell rules
Blank cells are ignored (an import never clears a value). Digits may be Arabic-Indic. Numbers: `١٢٫٥` ok; `currency` = integer minor units.
Checkbox: true/false/yes/no/1/0/نعم/لا. Dates: ISO `YYYY-MM-DD` / ISO datetime with offset (xlsx date cells are converted). Multi-select: values separated by `;` or `|`.
Phone: `+<digits>`, `00<digits>`, or a local `0…` number with `default_country_code`. Email: lowercased. **A cell starting with `= + - @` is stored as plain text, never evaluated**
(row gets a `FORMULA_LIKE:<target>` warning only). Anything exported later must prefix such cells itself.
Per-row errors: `REQUIRED`, `INVALID_EMAIL`, `INVALID_PHONE`, `MAX_LENGTH`, `INVALID_VALUE`, `CONTACT_REQUIRED`, `AMBIGUOUS_MATCH`, and the property validator codes (`INVALID_TYPE`, `OPTION_UNKNOWN`, `REQUIRED`, ...) as `properties.<key>`.

## Duplicates (keyed on email, then phone, among non-merged contacts of the tenant)
* contact `skip`: matched row skipped (`reason: DUPLICATE`). `update`: display name, new identifiers and changed property values are applied (`NO_CHANGE` is a skip). `create`: always inserts.
* A row matching two different contacts: `skip` skips it (`DUPLICATE_AMBIGUOUS`), `update` fails the row `AMBIGUOUS_MATCH`.
* lead: the contact is reused whenever an identifier matches (a contact is never duplicated by a lead import); the **lead** is the duplicate unit = same contact + same title (case-insensitive), not closed.
* A row without email/phone cannot be matched and is created.
* Rows earlier in the same file count (a second row with the same email is a duplicate of the first).

## Preview response `data`
`headers`, `total_rows`, `summary {create, update, skip, error, warnings}`, `rows[]` (first N: `{row, status: create|update|skip|error, reason?, errors?, warnings?, values}`),
`error_rows[]` (up to 100), `error_rows_truncated`, `already_imported {job_id, created_at} | null`, `limits`, `file {name, sha256, bytes}`. `row` = spreadsheet row number (header = 1).

## Commit and idempotency
* `error_policy: skip` imports valid rows and records invalid ones as `failed` (returned in `error_rows`, up to 100). `abort`: any invalid row => 422 `IMPORT_REJECTED`, nothing written.
* The whole import is one transaction: all or nothing, no partial job.
* **Idempotent by content:** key = sha256(tenant, object, file bytes hash, format, normalised mapping, options). The same file + mapping + options returns the stored job
  (200, `replayed: true`, `error_rows: []`) and writes nothing; concurrent identical submits yield exactly one job. Changing mapping or options is a new job (and its rows then dedupe against what exists).
* Response `data.job`: `{id, object, status, file{name,sha256,format}, duplicate_mode, error_policy, actor_id, total_rows, created, updated, skipped, failed, created_at}`.
* Evidence: per created/updated record the same audit + business event + outbox rows as a manual write (`contact.created`, `lead.updated`, ...; changed fields include `import`),
  one `import.completed` audit/event for the job, and an immutable `import_row` per row. Imported records have `source = 'import'`.

## Hard limits (also returned by `/fields`)
file 5 MiB; 5000 data rows; 100 columns; 20,000 chars per cell (field rules are tighter: name/title 160, evidence 500); request body ~7 MiB (base64).
XLSX archive: 300 entries; 25 MiB inflated per entry, 50 MiB total, ratio 100:1 above 256 KiB; no encryption, ZIP64, overlapping entries, path traversal, or DTD/entity declarations.
Error codes: 413 `FILE_TOO_LARGE`/`PAYLOAD_TOO_LARGE`; 422 `EMPTY_FILE`, `HEADER_MISSING`, `TOO_MANY_ROWS`, `TOO_MANY_COLUMNS`, `CELL_TOO_LONG`, `CSV_MALFORMED`, `INVALID_ENCODING`,
`UNSUPPORTED_ENCODING` (UTF-16), `NOT_TEXT`, `NOT_XLSX`, `ZIP_BOMB`, `ZIP_OVERLAP`, `ZIP_ENCRYPTED`, `ZIP_UNSUPPORTED`, `ZIP_UNSAFE_PATH`, `ZIP_TOO_MANY_ENTRIES`, `XML_DTD_FORBIDDEN`, `SHEET_NOT_FOUND`.
Measured: 5000 rows commit in ~17 s on the local database (single transaction).

## Not in this round
UI; per-row owner; `user`-typed properties; company/deal/task import; undo; background (async) jobs; non-UTF-8 encodings.
