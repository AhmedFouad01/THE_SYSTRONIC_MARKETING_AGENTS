# CHARTS_CONTRACTS — dashboard aggregate endpoints (roadmap v2 item 4, server half)

Status: server implemented and DB-tested; shared chart surface implemented in `app/src/features/dashboard/charts`, C1 pipeline, C2 leads and C3 outcomes widgets live in the dashboard; C4–C5 pending. Source: `src/charts.ts`, tests `tests/dashboard-charts.test.ts`.
No migration or SECURITY DEFINER function. Approved exact dependencies Chart.js 4.5.1 + react-chartjs-2 5.3.1 are installed for the UI round. The shared typed row model drives canvas data, exact bigint money tooltips and accessible tables; unsafe numeric plots are omitted and explained alongside their exact table values.

## 1. Common rules

- Method/auth: `GET` only (anything else under `/v1/dashboard/` is 404). Same headers as every `/v1` call: `Authorization: Bearer <token>`, `X-Tenant-Id: <uuid>`.
- Envelope: `{ "data": {...}, "request_id": "..." }`. Errors use the standard envelope `{code, safe_message, request_id, retryable}`.
- Authorization: `crm.read` through `crm.object_scope` (same as the list endpoints), inside the normal tenant transaction as `crm_runtime`, so RLS `tenant_boundary` applies.
  - Role `manager`/`reader`: `scope: "tenant"`. Role `rep`: `scope: "assigned"`, every figure counts only records with `owner_id = caller` (the same rule as the lists).
  - No `crm.read` (worker, no membership) or another tenant's token: 403 `FORBIDDEN`. Bad token: 401. An `X-Grant-Id` (agency grant) header: 403 (a grant never gives list scope, as on the lists).
  - Every response carries `scope` so the UI can label a rep's numbers "mine".
- Strict query validation: unknown or repeated parameter, bad value: 422 `VALIDATION_FAILED`.
- Statement timeout 5 s per request (fails closed).
- Locale-neutral output. The UI does Arabic digits and labels.
  - Counts: JSON integers.
  - Money: minor units as **decimal strings** (`amount_minor`, bigint-safe, same idea as `value_minor` in campaign-performance). The UI converts with the existing `toBig` and formats per currency. **Currencies are never summed together:** every money total is `[{currency, amount_minor}]`, sorted by currency, absent when zero deals.
  - Dates: ISO. Bucket `start` and `end` are local calendar dates `YYYY-MM-DD` (`end` exclusive = next bucket start). `as_of` is a UTC ISO timestamp.
  - Stage, pipeline and source names are returned raw (user content: the UI must apply its bidi isolation).
- Time series parameters (`deals-outcomes`, `activity`):
  - `bucket`: `week` | `month`, default `month`.
  - `week_start`: `monday` | `saturday`, default `monday` for backward compatibility. Only valid with `bucket=week`; invalid values, repeats, or use with month/default buckets return 422. Weekly responses echo the effective `week_start`; monthly payloads stay unchanged. The server aggregates the actual local Saturday-to-Saturday interval when requested, rather than changing labels on Monday aggregates.
  - `periods`: integer 1..104, default 12. The series is the last `periods` buckets ending with the current one. It is zero-filled and contiguous, so a line or bar chart needs no gap handling.
  - `tz`: IANA name (must exist in `pg_timezone_names`), default `UTC`. **There is no tenant timezone column in the data model today**, so the UI passes the tenant's/browser timezone (e.g. `Africa/Cairo`). Storing a tenant timezone is a later setting (would be a migration at that time).

## 2. Endpoints

### 2.1 `GET /v1/dashboard/pipeline-stages[?pipeline_id=<uuid>]`
Deals per stage: count and value. Max 100 pipelines (same cap as `/v1/pipelines`).
```json
{ "scope": "tenant",
  "pipelines": [ { "pipeline_id": "...", "name": "Sales",
    "stages": [ { "stage_id": "...", "name": "New", "position": 1, "outcome": null, "archived": false,
                  "deal_count": 12, "totals": [ { "currency": "EGP", "amount_minor": "1500000" } ] } ] } ] }
```
- Stages ordered by `position`; zero-deal stages are included with `deal_count: 0, totals: []`. Archived stages appear only while they still hold deals.
- `outcome` is `"won"`, `"lost"` or `null`; C1 includes and labels both terminal outcomes.
- The aggregate and session contracts supply no configured primary currency. C1 selects one currency independently, defaults to currency-code order, and never derives a tenant primary from unrelated report amounts. Pipeline and currency changes reuse the same authorized payload; money remains an exact decimal string in the table and secondary tooltip.

### 2.2 `GET /v1/dashboard/leads-breakdown`
Leads by source and status.
```json
{ "scope": "tenant", "total": 26,
  "by_status": { "open": 24, "qualified": 1, "closed": 1 },
  "sources": [ { "source": "web", "open": 2, "qualified": 1, "closed": 0, "total": 3 } ],
  "other": { "source_count": 4, "open": 4, "qualified": 0, "closed": 0, "total": 4 } }
```
- `sources`: top 20 by total (ties by name), the rest rolled into `other` (`null` when there are at most 20 sources). Sum of `sources[].total` plus `other.total` equals `total`.

### 2.3 `GET /v1/dashboard/deals-outcomes?bucket=&periods=&tz=&week_start=`
Deals won and lost over time.
```json
{ "scope": "tenant", "as_of": "2026-10-07T10:00:00.000Z", "tz": "Africa/Cairo", "bucket": "month", "periods": 12,
  "from": "2025-11-01", "to": "2026-11-01",
  "buckets": [ { "start": "2026-10-01", "end": "2026-11-01",
    "won":  { "count": 3, "totals": [ { "currency": "EGP", "amount_minor": "5100" }, { "currency": "USD", "amount_minor": "700" } ] },
    "lost": { "count": 1, "totals": [ { "currency": "EGP", "amount_minor": "300" } ] } } ] }
```
- A deal counts when it currently sits in a stage with outcome `won`/`lost`. Its close moment is the latest `stage_transition` into that stage, or `updated_at` when the deal was placed there with no recorded transition (seeded/imported). A reopened-and-reclosed deal counts once.
- Bucketing is done in the requested `tz` (a deal closed 23:30 UTC on the last day of a month falls in the next month for `Africa/Cairo`).

### 2.4 `GET /v1/dashboard/tasks-due?tz=`
Open tasks, partitioned by due time (completed tasks excluded).
```json
{ "scope": "tenant", "as_of": "...", "tz": "Africa/Cairo", "today": "2026-10-07",
  "open_total": 40, "overdue": 7, "next_24h": 5,
  "days": [ { "date": "2026-10-07", "count": 3 }, "... 7 entries, today .. today+6 ..." ],
  "later": 12 }
```
- Invariant: `overdue + sum(days[].count) + later = open_total`. `days` only counts tasks not yet due (`due_at >= now`), so today's already-overdue tasks are in `overdue`.
- `overdue` and `next_24h` are exact (no 50+ cap) and use the same definitions as the dashboard W1/W2 (`due_at < now`, `now <= due_at < now + 24h`). `next_24h` overlaps `days` by design (it is the W2 KPI); it is not part of the partition.

### 2.5 `GET /v1/dashboard/activity?bucket=&periods=&tz=&week_start=`
Activity over time = records created per bucket plus tasks completed.
```json
{ "scope": "tenant", "as_of": "...", "tz": "UTC", "bucket": "week", "week_start": "monday", "periods": 12, "from": "...", "to": "...",
  "buckets": [ { "start": "2026-10-05", "end": "2026-10-12", "contacts_created": 4, "leads_created": 9,
                 "deals_created": 2, "tasks_created": 11, "tasks_completed": 8 } ] }
```
- Merged contacts are excluded from `contacts_created`.
- Deliberately not the audit log: that stream needs `audit.read` (managers only); the dashboard is a `crm.read` surface and reps must get their own activity.
- Caveat: `created_at` of rows that existed before migration 008 and have no `*.created` audit row equals the migration time (documented in 008). Irrelevant for new tenants.

## 3. Why these five
They are exactly the aggregates the existing dashboard cannot compute from page-1 lists (`audits/2026-10-05/DASHBOARD_SPEC.md`: W1/W2 are capped counts, no pipeline or lead breakdown, no time axis). Separate endpoints (not one bundle) because the dashboard spec requires per-widget loading/empty/error/403 states, and each has a different time window and parameters. The attribution/marketing figures (W3, W4, W6, W7) already come from `/v1/reports/campaign-performance` and are untouched.

## 4. Widget mapping for the UI round (Chart.js 4.5.1 + react-chartjs-2 5.3.1)

| Widget | Endpoint | Chart | Notes |
|---|---|---|---|
| C1 Pipeline by stage | 2.1 | horizontal bar (count), value as secondary label/tooltip | One bar per stage in `position` order; a currency selector when `totals` has several currencies (primary first), never summed. In RTL the value axis runs right-to-left (`indexAxis: "y"`, reversed x scale). Won/lost terminal stages shown with their own token colors. |
| C2 Leads by source | 2.2 | stacked horizontal bar (open/qualified/closed per source) + doughnut or KPI strip for `by_status` | `other` as a final muted bar labelled "Other (N sources)". |
| C3 Won vs lost over time | 2.3 | grouped column (won/lost counts) per bucket; optional line for won value in the chosen currency | Month default, week toggle. Pass the browser `tz` and `week_start=saturday` for weeks. |
| C4 Tasks due | 2.4 | column chart over `days` (today..+6) with `overdue` and `later` as end columns, or KPI cards W1/W2 backed by `overdue`/`next_24h` | W1/W2 can now show exact counts instead of `50+`. |
| C5 Activity | 2.5 | multi-line or stacked column per bucket (created records vs tasks completed) | Pass `bucket=week&week_start=saturday` and the browser `tz` for a 12-week view. |

UI requirements carried from NIGHT_RUN §5 item 4 (not done here):
- Animations on, respecting `prefers-reduced-motion`.
- Colors from the `--sy-*` tokens including dark.
- Arabic digits and labels, and an RTL legend and tooltip.
- An `aria-label` on each canvas and a data-table fallback built from the same payload.
- Tiny sparklines and progress bars may stay hand-drawn SVG.
- Per widget: loading, empty (all-zero series shows the empty state, not a flat chart), error + Retry, and 403 (leave the other widgets working).
- A rep sees `scope: "assigned"`: label the widgets accordingly.

## 5. Performance and indexes
- Task queries use `task_due(tenant_id,status,due_at,owner_id)`; `activity` and the created-based counts use the `*_tenant_created` and `*_tenant_owner_created` indexes. Pipeline, leads and closed-deal aggregates scan the tenant's deals/leads (no covering index).
- **No index migration was added** (migration 019 is not used). The 1M-row measurement is deferred; if it shows these three scans over budget, the candidates are `deal(tenant_id, stage_id) INCLUDE (owner_id, amount_minor, currency)`, `lead(tenant_id, source, status) INCLUDE (owner_id)` and `stage_transition(tenant_id, deal_id, to_stage, occurred_at)`. The 5 s statement timeout bounds the risk until then.

## 6. User decisions (Ahmed, 2026-10-07)
- **Week start = Saturday.** The UI must request `bucket=week&week_start=saturday` on C3/C5. Never relabel or shift Monday aggregates in the UI: the server computes Saturday local-midnight boundaries in SQL, including DST changes. Omitted `week_start` retains Monday for existing clients.
- **Timezone = browser.** The UI sends the browser's IANA zone as `tz`. No stored tenant timezone for now (no migration).
