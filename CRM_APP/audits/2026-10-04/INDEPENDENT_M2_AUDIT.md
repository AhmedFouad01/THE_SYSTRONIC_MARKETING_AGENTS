# Independent M2 Audit — 2026-10-04

**FAIL — BLOCKING FINDINGS. M2 remains open.**

Audited implementation: `ba841c90b64e8bc4bb49c47247bd724f36e3a3a6` (`feat(crm): deliver M2 journey reporting`). Branch: `feat/crm-m2-journey-reporting`. HEAD at audit: `acd0398`; its only change after the implementation is the SHA placeholder in the M2 evidence files. All product code files read were byte-unchanged between `ba841c9` and HEAD.

This is a fresh source/runtime audit. It does not rely on the `M2_EVIDENCE.md` PASS claim or on any earlier chat findings; every finding below was re-derived from code at `ba841c9`, and the blocker was reproduced over real HTTP against real PostgreSQL. No product code was modified, no remediation applied, no M3 work started, no readiness changed, no push/merge.

## Routing and reviewers

| Role | Agent | Tier | Model (self-reported) | Scope |
|---|---|---|---|---|
| TSST Lead | main session | EXECUTIVE | Opus 5.5 | Partitioning, spot-verification of blocker at `006:52/68/70`, consolidation, verdict |
| Partition A | `tsst-code-worker` | CODE | Sonnet 5.5 | Contracts, migration 006, tenant isolation / RLS / RBAC / field authority |
| Partition B | `tsst-code-worker` | CODE | Sonnet 5.5 | `journey.ts`, API/worker integration, replay/idempotency, attribution, commerce, late evidence |
| Partition C | `tsst-code-worker` | CODE | Sonnet 5.5 | Diff, regression, tests, clean install/upgrade, RTL/LTR, evidence-claim reproduction, blocker runtime repro |

A and B found the blocker independently from different scopes; C reproduced it at runtime.

## Blocking finding

### M2-F01 — Public collection idempotency is case-inconsistent on `event_id` (P1, BLOCKING, RUNTIME REPRODUCED)

Location: `CRM_APP/migrations/006_journey_reporting.sql:52` vs `:68` and `:70` (`crm.collect_event`).

The receipt lookup normalizes the id: `source_id=(b->>'event_id')::uuid::text` (lowercase). The `business_event.source_event_id` insert (`:68`) and the `source_receipt.source_id` insert (`:70`) store the raw `b->>'event_id'` text. The unique index `business_source_identity` (`:10`) is on raw text.

Independent HTTP / real-PostgreSQL reproduction (disposable cluster, synthetic site/tenant):

1. POST `/v1/collect/events` with UPPERCASE `event_id` → **202**, event `c96fe53a…`. `business_event` 0→1, `source_receipt` 0→1, touchpoint 0→1.
2. Same UUID lowercase, otherwise identical payload → **202**, **different** event `e8765586…`. Counts 2/2/2. `source_event_id` holds both `921DE8CC-…` and `921de8cc-…`.
3. Replay either form afterwards → **409 SOURCE_CONFLICT**.
4. Fresh data, identical UPPERCASE replay → **422 VALIDATION_FAILED** (unique index), not the original event id.
5. Lowercase first then UPPERCASE → 202 then 409; no duplicate.

Impact: one logical event becomes two events and two touchpoints, inflating attribution and campaign counts; an uppercase-UUID client never receives a clean replay. Violates the M2 contract "retries return the same event". UUIDs are case-insensitive by RFC 4122, so this is reachable by ordinary clients.

Required closure: normalize `event_id` (and other UUID-as-text identifiers stored by `collect_event`) once, and use the same normalized value in the lookup, both inserts and the request hash. Add case-variant replay regression tests (UPPER→lower, lower→UPPER, UPPER→UPPER). No fix was applied.

## Non-blocking findings

| ID | Sev | Status | Finding | Evidence | Fix direction |
|---|---|---|---|---|---|
| M2-F02 | P2 | CONFIRMED (code) | Tenant advisory-lock key depends on `X-Tenant-ID` header casing; API hashes raw header, `collect_event` hashes `tenant_id::text`. Mixed-case callers do not serialize, weakening app-enforced refund-cap / identity-overlap / calculate-vs-collect consistency. Order-row `FOR UPDATE` still protects money. | `journey.ts:47-52`, `api.ts:20-33`, `006:49` | Normalize tenant id or hash `$1::uuid::text` |
| M2-F03 | P2 | CONFIRMED (code) | `evidence_hash` ignores timestamps: `canonical()` serializes `Date` as `{}`, so `occurred_at`/`valid_from`/`valid_to` never enter the hash. | `journey.ts:36-46`, `:559` | Serialize `Date` as ISO |
| M2-F04 | P2 | SUSPECTED (race) | "Latest run" can be a staler calculation: `as_of DEFAULT now()` is transaction start, lock taken later; report orders by `as_of DESC`. | `journey.ts:753`, `:877`; 006 `as_of` default | `clock_timestamp()` after lock; concurrency test |
| M2-F05 | P2 | CONFIRMED (code) | Late payment dated before a cancellation is rejected `ORDER_CANCELLED` based on current status. | `journey.ts:420` | Compare `occurred_at` to `status_at` |
| M2-F06 | P2 | CONFIRMED (code) | Attribution worker has no attempt count / dead-letter; failing job stays `pending` at queue head; `worker.ts` has no try/catch so any throw kills the process for all tenants. | `journey.ts:854-887`, `jobs.ts:48`, `worker.ts:22` | Per-tenant catch, attempts, `failed` status |
| M2-F07 | P2 | CONFIRMED (code) | Capacity unproven: one full-tenant recalculation job per collected event; each writes a full run + credits (quadratic storage); `calculate()` loads all conversions/touches into memory with nested loops; public collection waits on the same tenant lock; campaign report unbounded. | `journey.ts:502-570`, `:881`; `queue_collected_attribution` | Coalesce jobs per tenant, SQL-side selection, decouple collection lock, bounded-volume test |
| M2-F08 | P2 | CONFIRMED (code) | Commerce outcome key `${source}:${order}:${kind}:${external}` can collide because `code()` permits `:`; second payment rejected with rollback. | `journey.ts:478` | Hash or structured key |
| M2-F09 | P2 | CONFIRMED (code) | Contact-journey cursor round-trips through JS `Date` (ms) while M1 events have µs timestamps; boundary row repeats on next page. | `journey.ts:730`, `:738-742` | Carry timestamp text from SQL |
| M2-F10 | P2 | CONFIRMED (code) | Pre-M2 `deal_won` conversions are reconstructed from current deal amount with the same `definition_version`/`evidence_kind` as true snapshots; reports cannot flag them. (Acknowledged limitation; flagging is missing.) | `journey.ts:491-501` | Distinct `evidence_kind`, surface in report |
| M2-F11 | P2 | CONFIRMED (code) | Contact merge (M1, unchanged) does not repoint M2 references (`identity_link`, `conversion`, `commerce_order`); post-merge attribution splits or becomes unknown. | `crm.ts:549-553` | Extend merge to M2 tables + test |
| M2-F12 | P2 | SUSPECTED | Anonymous replays return before the rate limit but after taking tenant advisory locks and a pooled connection (`max: 5`); spoofable site key/origin could stall a tenant / starve pool. | `006:49-56`, `db.ts:4` | Rate-limit before lock; load test |
| M2-F13 | P2 | CONFIRMED (gap) | Visitor linked to multiple contacts gives identical eligibility to each contact's conversion; policy undefined in contract and untested. | `journey.ts` calculate path | Define policy; add test |
| M2-F14 | P2 | REPRODUCED | 4 bootstrap tests require PowerShell 7 (`pwsh`, `[Convert]::ToHexString`); `82 passed` is environment-dependent. Not an M2 regression. | `npm run test:bootstrap` 0/4 shipped, 3/4 with `M0_PWSH=powershell.exe` | Document prerequisite or PS5 fallback |
| M2-F15 | P3 | CONFIRMED (code) | Hardening bundle: list endpoints for conversions/orders return `SELECT *` to analyst (contract-consistent); prototype keys in `mappings[...]` → 500 (not injectable); zone-less public `occurred_at` accepted; table-wide UPDATE grants vs M0 column grants; `identity_link.revoked_at` resettable; no explicit `REVOKE EXECUTE … FROM PUBLIC` on M2 definer functions; `collection_origin_allowed` is a cross-tenant origin oracle; app-only invariants (spend/campaign currency, credit=conversion value, `deal_won` requires `deal_id`); missing indexes; old-event replay >365d returns 422; touch eligibility `<=` vs contract "precede"; no down migration. | `journey.ts:791-793`, `:841-847`; `006:9`, `:33`, `:46`, `:109-110` | Bounded hardening pass |
| M2-F16 | P3 | CONFIRMED (code) | RTL/bidi: `web/reporting.html` sets `lang`/`dir` and uses logical CSS, but only timestamps are `<bdi dir=ltr>`-wrapped; amounts, currency codes, UUIDs, source names are not; values shown as raw minor units; tenant input lacks `dir="ltr"`; default language EN/LTR vs Arabic/RTL in `index.html`. | `web/reporting.html` | `<bdi>` wrapping, `Intl.NumberFormat`, align default |
| M2-F17 | P3 | CONFIRMED | Test gaps: id case variants (F01), multi-contact visitors (F13), equal-timestamp tie-break, cross-currency refund, rate-limit boundary, large-volume calculate, UI bidi numbers. | M2-01..22, Chromium M2 tests | Add with remediation |

## Areas that passed

| Area | Independently observed |
|---|---|
| Diff | `git show --stat ba841c9`: 17 files, +2552/−19. Migrations 001–005 untouched. Edits to `README.md`, `package.json`, `playwright.config.ts`, `scripts/migrate.ts` (006 entry), `src/api.ts`, `src/jobs.ts` (fallthrough to `attributionWorkOne`), `web/index.html` (one link) — all expected wiring. |
| RLS / tenant | All 17 new tables `ENABLE` + `FORCE` RLS with the same `tenant_boundary` policy (USING + WITH CHECK) as M0/M1 (`006:24-31`, `93-95`). Runtime role non-owner, NOBYPASSRLS. Clean schema: 43/47 tables FORCE RLS; the 4 without are pre-M0 identity tables. Authenticated routes run in `transaction()` with `set_config(..., true)` then `permit()`/`record()` (`journey.ts:608-619`). Agency grants cannot reach M2 kinds. `redact()` removes sensitive fields without `sensitive.read` (`journey.ts:811-818`). |
| Money | Integer minor units (`isSafeInteger`, 0..1e12, bigint), currency pinned per order, cumulative refund ≤ payment, refund cannot predate payment, order row `FOR UPDATE` inside one transaction. |
| Attribution | Weight always 1 (DB-enforced), zero-touch → unknown bucket, deterministic tie-break `occurred_at` then id in SQL. |
| Late evidence | Runs append-only (no UPDATE grant); late evidence queues recalculation (exceptions F04, F05). |
| Static | `npm run lint` PASS (26 files), `typecheck` PASS, `build` PASS. |
| PostgreSQL tests | `npm run test:db` **64/64** (42 existing + M2-01..22). |
| Chromium | `npx playwright test` **14/14** (9 existing + 5 M2). |
| Clean install | `m2-clean-check.ts` 001→006 PASS: 47 tables, 2 tenants. |
| Upgrade | `m2-upgrade-check.ts` 001–005 + fixture → 006 PASS: 48 rows across 30 tables retained (deepEqual over every column incl. keys/ciphertext). |

## M2_EVIDENCE.md claims

| Claim | Result |
|---|---|
| 64 PostgreSQL tests (22 new) | REPRODUCED |
| 14 Chromium (5 new) | REPRODUCED |
| lint / typecheck / build PASS | REPRODUCED |
| Clean install / upgrade, 48 rows byte-identical | REPRODUCED |
| 55/55 regression | PARTIAL — 51/55; 4 bootstrap blocked by missing PowerShell 7 (F14) |
| 82 passed total | PARTIAL — 78 reproduced + 4 environment-blocked |
| `npm ci --offline` | UNVERIFIABLE (online `npm ci` used) |
| Docker / Drive-direct execution | UNVERIFIABLE (Docker daemon not running) |
| M2 PASS for bounded slice | CONTRADICTED by M2-F01 |

## Environment and isolation

- Code exported with `git archive ba841c9 CRM_APP` into the session scratchpad (`…\scratchpad\m2-audit-run`), `npm ci` there.
- Disposable embedded PostgreSQL 17.10 cluster, fresh `initdb`, `127.0.0.1:55438`, throwaway password, synthetic data only. API on port 4399 for HTTP repro. The M0/M1 development cluster, local execution mirror and developer `.env` were not touched.
- Chromium installed into the user-level ms-playwright cache (outside the repo).
- Teardown confirmed: `pg_ctl stop -m fast -w` → "server stopped"; API server closed; no postgres/pg_ctl/chrome processes; no LISTENING sockets on 55438/4317/4399; no containers started. Scratchpad copy remains with synthetic data only.
- Repo note: `git log --all` fails on stray `.git/refs/codex/desktop.ini` (Drive artifact); history searches used explicit refs.

## Not verified

- Runtime proof of suspected races F04 and F12.
- `api.ts` mapping of unique violations for F02/F08 (422 vs 500).
- PowerShell 7 bootstrap path; Docker path; offline install.
- Production capacity, bot mitigation, OAuth, MFA, KMS — out of M2 scope by contract.

## Verdict

**FAIL — BLOCKING FINDINGS.** M2 may not close until M2-F01 is fixed with case-variant regression coverage and an independent re-audit confirms it. F02–F17 are non-blocking; Lead recommends F02, F03, F06 and F11 be included in the same remediation slice because they are small and affect evidence integrity / worker availability. No remediation is authorized by this audit.
