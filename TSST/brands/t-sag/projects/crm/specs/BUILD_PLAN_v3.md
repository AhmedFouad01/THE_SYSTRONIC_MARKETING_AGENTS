# BUILD_PLAN_v3 — CRM roadmap 2–5

2026-10-07 · DEV_AG · Plan only · NOT_READY. No implementation, installs, tests or provider verification performed. Existing contracts are evidence; new modules, routes and migrations below are recommendations. Paths are relative to CRM_APP; new UI filenames are proposed under app/src.

## 1. Architecture decisions

Decision record is embedded here because this brief permits only this artifact. Keep the current application/PostgreSQL boundary: tenant CRM owns records, consent and business events; website/form owns observed acquisition; finance owns payment evidence; Meta owns asynchronous delivery receipts. Agency fixed-deal grants never become tenant audience authority.

| Boundary | Recommended option and reason | Trade-off / rejected alternative / reversal trigger |
|---|---|---|
| Segments | Save versioned tenant-scoped contact/lead definitions using the B4 typed filter AST/compiler and registry permissions; one filter language prevents divergent list/audience behavior. | Reject separate SQL or provider-specific filters. Dynamic calculations cost reads; add bounded materialization only after measured load. Reject unknown/archived/unreadable properties; missing is not false. Leads resolve to distinct non-merged contacts. |
| Tracking/events/consent | Extend compatible journey storage after inspecting 006/007 at build time; append immutable touchpoints and canonical events plus separate purpose/channel consent evidence; preserves provenance without a competing journey store. | Reject mutable last-touch-only rows and implicit opt-in. Store UTC occurred/received times, UTM fields, opaque gclid/fbclid/ttclid, sanitized path/referrer/session and stable event_id. Consent: unknown/granted/denied/withdrawn, purpose/channel, source, grant/change time, collector, notice_version, evidence reference and version. Minimize retention after approved policy. |
| Connections | Tenant-owned provider connection and explicit Page/ad-account/dataset bindings; server-only authenticated envelope encryption with key version and deployment-supplied key outside DB; separates asset authority and secrets. | Reject plaintext/browser token storage and shared agency credentials. Minimal verified OAuth scopes, expiry/revocation/rotation, audited redacted access and separate key lifecycle. Revisit managed secret storage when hosting requirements are approved. |
| Sync | Reuse transactional business_event/outbox, with destination delivery ledger and bounded workers; one committed action survives retries without coupling CRM transactions to Meta. | Reject synchronous provider calls in writes. Eventual consistency: stable tenant+destination+event_id uniqueness; audience operation keys include binding/revision/contact/action. Bounded timeouts, jittered retry for transient/rate-limit failures; permanent/expired-token failures quarantine. Ambiguous writes reconcile before retry. |
| Lead Ads | Verify challenge and raw-body signature, then durably record/enqueue the notification before acknowledgement; authenticated ingestion survives duplicate delivery and outages. | Reject trusting payload tenant IDs or fetching details before durability. Route only verified asset→tenant bindings; deduplicate tenant+leadgen_id, quarantine unknown assets/ambiguous matches, tolerate ordering through original timestamps and catch-up cursors. |

Dispatch rechecks consent and connection state; withdrawal cancels queued identifying sends and prioritizes removals. Stable original event time survives retries. First acquisition touch stays preserved; conversion first/last snapshots freeze with versioned late-event correction. No fingerprinting, cross-tenant stitching, sensitive/clinical exports or reconstructed click IDs. Customer-list personalization and ad measurement are separate from newsletter consent.

APIs follow existing envelopes, command_id/Idempotency-Key, expected_version conflicts, strict validation and authorization-before-lookup. Proposed segment/journey/job lists use bounded opaque cursors. OAuth callbacks use single-use, expiring actor/tenant-bound state; webhook signature algorithm, supported fields, API version and provider retry limits require current documentation at build time.

## 2. Migration numbering

013–014 are done; 015–017 are reserved for Claude's auth B2/lockout work; 018 is import. The read migration directory and scripts/migrate.ts contain 001–014 and 018; no 019 exists. Leave 019 unused: **new work starts at 020**.

Planned allocation: 020 segments/permissions; 021 journey/event extensions; 022 consent/evidence; 023 connections; 024 delivery ledger; 025 Lead Ads receipts; 026 audience bindings/membership. Each schema task updates scripts/migrate.ts with its ordered entry, RLS/grants and object-integrity rules where applicable. Additive upgrades preserve CRM object counts; disable feature/worker for recovery, retain evidence, forward-fix schema.

## 3. Ordered task list

Each increment targets 60–120 minutes including its checks. Depend on named predecessors, not their unmerged branches. If baseline discovery enlarges a task, stop at its bounded contract and return a split proposal.

Checks **C** = lint, typecheck, test:unit, build. **D** = C + test:db in the isolated lane DB. Every task explicitly selects C or D; no UI suite. Add focused unit/API/DB tests below; UI tests exercise pure state/adapters, with worker-owned manual smoke for layout/accessibility.

### (2) Navigation, import and dashboard

**N1 — Restructure navigation.** Depends: baseline. Files: app/src/ui/shell/AppShell.tsx, navigation config/tests, locale labels. Migration: none. Tests: linked-leaf coverage, aliases, permission filtering. Checks: C. done_when: Overview/CRM/Insights/Administration, nested Pipeline/Settings and mobile More match NAV_AND_SCREENS; upcoming leaves are inert badges; old routes/list state survive.

**N2 — Workspace/disclosure behavior.** Depends: N1. Files: AppShell, session/context state, locale keys. Migration: none. Tests: tenant-change reset, active-branch expansion, actor/tenant persistence. Checks: C. done_when: authorized switch reloads capabilities/data, clears selections/import drafts; 375px focus return and RTL disclosures work; agency restrictions remain.

**I1 — Upload and mapping.** Depends: N2. Files: proposed app/src/imports/ImportWizard.tsx, API adapter/state/locales. Migration: none. Tests: field/limit mapping, duplicate targets, unauthorized properties. Checks: C. done_when: /imports has gated CSV/XLSX upload and contract-driven targets; 5MiB/5000-row/100-column limits, sheet/country/owner defaults and bidi-safe samples appear.

**I2 — Preview and policy.** Depends: I1. Files: import wizard/reducer/errors. Migration: none. Tests: input invalidation, skip/update/create, abort gating, truncated error samples. Checks: C. done_when: writes-free preview must rerun after changes; lead/contact matching distinctions, blank-preserves-value, formula warnings and safe row errors are explained.

**I3 — Commit and result ledger.** Depends: I2. Files: import adapter/result/history views. Migration: none. Tests: double-submit, identical uncertain retry/replay, 50-job/200-row pagination. Checks: C. done_when: one atomic synchronous import shows all outcomes and ledger; no fabricated polling/undo; reauthentication preserves same-tenant draft; /imports becomes live only with complete gates.

**D0 — Shared chart surface.** Depends: N1. Files: proposed app/src/dashboard/chart adapters/components, approved dependency manifest/lockfile, locales. Migration: none. Tests: bigint formatting, scope/state adapter, RTL configuration. Checks: C. done_when: approved Chart.js 4.5.1/react-chartjs-2 5.3.1 work with semantic theme tokens, reduced motion, localized accessible tables and independent loading/empty/error/403 states.

**D1 — C1 pipeline.** Depends: D0. Files: dashboard pipeline widget/adapter. Migration: none. Tests: zero/archived stages, ordering, separate currencies. Checks: C. done_when: horizontal RTL bars include won/lost, pipeline/currency selectors; exact bigint-safe money and identical table payload.

**D2 — C2 leads.** Depends: D0. Files: dashboard leads widget/adapter. Migration: none. Tests: source/status totals, Other aggregation, assigned scope. Checks: C. done_when: status KPI strip and stacked sources show Other(N), localized labels and correct Mine scope.

**D3 — Saturday server buckets.** Depends: existing charts contract. Files: src/charts.ts, CHARTS_CONTRACTS.md, tests/dashboard-charts.test.ts. Migration: none. Tests: Saturday boundaries, Cairo/DST, zero-fill, invalid query, Monday compatibility. Checks: D. done_when: explicit validated week_start supports Saturday in SQL, default Monday retained; UI never relabels Monday aggregates.

**D4 — C3 outcomes.** Depends: D0,D3. Files: dashboard outcomes adapter/widget. Migration: none. Tests: month/week requests, browser timezone, money precision. Checks: C. done_when: 12-month default/week toggle and optional single-currency won-value line preserve chronological order and display as_of/timezone.

**D5 — C4 tasks.** Depends: D0. Files: dashboard tasks widget/adapter. Migration: none. Tests: partition invariant, overlapping next_24h, zero states. Checks: C. done_when: exact overdue/next-24h KPIs plus seven days/later never double-count the overlapping KPI.

**D6 — C5 activity.** Depends: D0,D3. Files: dashboard activity widget/composition. Migration: none. Tests: 12 Saturday weeks, record-series mapping, role ordering. Checks: C. done_when: five distinguishable record/completion series, M/R versus rep widget order, 1440/375 and both themes pass worker smoke including measured text/graphics contrast.

### (3) Segments

**S1 — Reuse B4 filter boundary.** Depends: accepted B4 AST/compiler. Files: src/listquery.ts, schema metadata/shared filter module, P1B_CONTRACTS.md. Migration: none. Tests: typed AND/OR, range/membership/relative-date/empty, unreadable/archived keys. Checks: D. done_when: lists/segments share validation/compiler; no second dialect. Listed sources do not prove B4 shipped; wait for its contract if absent.

**S2 — Segment storage/authority.** Depends: S1. Files: migrations/020_segments.sql, scripts/migrate.ts, permission/session projection. Migration: 020. Tests: tenant RLS, manager writes, rep assigned previews, reader no export, agency denial. Checks: D. done_when: versioned definitions with one user-entered name (dir=auto/Bdi), bilingual UI chrome and explicit segment actions exist with inert export.

**S3 — Segment CRUD.** Depends: S2. Files: proposed src/segments.ts, contracts/tests. Migration: none. Tests: replay/conflict, strict AST validation, cursor scoping. Checks: D. done_when: authorized save/edit/archive/list/preview use existing envelopes and optimistic concurrency.

**S4 — Distinct calculation.** Depends: S3. Files: proposed src/segmentcalc.ts, worker/count tests. Migration: none. Tests: lead→contact dedup, merged exclusions, null semantics, scope. Checks: D. done_when: CRM count/revision/as_of are reproducible; consent-eligible count stays unknown until T3, never equated with platform reach.

**S5 — Refresh scheduling.** Depends: S4. Files: segment worker/outbox handlers. Migration: none. Tests: record/import/merge/property invalidation, coalescing, retry. Checks: D. done_when: manual/hourly reconciliation and relevant changes enqueue bounded refresh targeting 15 minutes; incompatible definitions pause exports.

**S6 — Segment screen.** Depends: S3–S5. Files: proposed app/src/segments views, router/nav/locales. Migration: none. Tests: editor AST roundtrip, role gates, stale/count states. Checks: C. done_when: /segments offers authorized creation/preview, revision/refresh status and truthful unknown eligibility; enables live nav only now.

### (4) Tracking, journey and consent

**T1 — Journey/event storage.** Depends: existing 006/007 inspection at build time. Files: migrations/021_tracking.sql, scripts/migrate.ts, event contracts. Migration: 021. Tests: canonical ID uniqueness, same-tenant references, immutable timestamps. Checks: D. done_when: additive compatible touch/event fields support provenance and consent-version snapshots without duplicating existing canonical events.

**T2 — Consent storage.** Depends: T1. Files: migrations/022_consent.sql, scripts/migrate.ts, permission contracts. Migration: 022. Tests: purpose/channel separation, unknown defaults, evidence/version integrity. Checks: D. done_when: restricted consent evidence/history exists; no imported/form completion implies permission.

**T3 — Consent commands/withdrawal.** Depends: T2,S4. Files: proposed src/consent.ts, segment eligibility hook. Migration: none. Tests: replay/conflict, unauthorized changes, denial suppression. Checks: D. done_when: grant/withdraw writes evidence atomically; eligible counts recompute; immediate suppression and removal intent are durable before delivery workers exist.

**T4 — Acquisition collection.** Depends: T3. Files: existing collect routes, proposed src/tracking.ts, form adapter/contracts. Migration: none. Tests: consent gate, URL stripping, duplicate events, tenant/session linking. Checks: D. done_when: bounded validated UTM/click/session ingestion preserves original times; only permitted deterministic links, no fabricated identifiers.

**T5 — CRM business signals.** Depends: T4. Files: src/crm.ts and existing activity/stage/payment producers, event mapper. Migration: none. Tests: qualification/reopen/no-op/import replay, paid versus won, refund. Checks: D. done_when: stable action IDs cover ADS event triggers; absent booking/finance producer remains disabled pending authoritative input, never inferred as payment.

**T6 — Import consent extension.** Depends: T3,I3. Files: src/import.ts, src/importmap.ts, IMPORT_CONTRACTS.md, mapping UI. Migration: none. Tests: missing/invalid evidence, replay, rollback, purpose distinction. Checks: D. done_when: additive explicit purpose/source/time/notice/evidence mapping is validated atomically; otherwise consent remains unknown; eligibility updates without treating import as conversion.

**T7 — Journey query/snapshots.** Depends: T4,T5. Files: journey/report modules, contracts/tests. Migration: none. Tests: late/out-of-order events, first-touch preservation, corrections, assigned scope. Checks: D. done_when: paginated chronology and frozen conversion snapshots use observed 30-day first/last click credit, expose unknown history and timezone, never sum platform totals.

**T8 — Journey/consent UI.** Depends: T3,T7. Files: proposed app/src/journeys, contact detail, router/locales. Migration: none. Tests: chronology/correction adapter, permissions, unknown/withdrawn states. Checks: C. done_when: /journeys and contact context expose evidence/lifecycle separately from deal stages, role-gated consent actions and truthful attribution labels.

### (5) Meta — Lead Ads, audiences, CAPI

**Every M task: verify against current Meta docs at build time.** Use ADS_REQUIREMENTS links; record selected API version/scopes/contracts. Tests use mocked providers; account activation is separately gated.

**M1 — Connection storage/crypto.** Depends: T3, Claude auth dependency. Files: migrations/023_connections.sql, scripts/migrate.ts, proposed src/connectioncrypto.ts. Migration: 023. Tests: wrong-tenant denial, tamper/key-version/rotation, log redaction. Checks: D. done_when: encrypted server-only token envelope, asset ownership and integration.manage manager gate exist.

**M2 — OAuth endpoints.** Depends: M1. Files: proposed src/metaoauth.ts, contracts/tests. Migration: none. Tests: state replay/expiry, tenant mismatch, exchange timeout, revoked access. Checks: D. done_when: minimal verified scopes authorize selected assets, expiry/disconnect stops use; tokens never enter browser responses/logs.

**M3 — Connection UI.** Depends: M2. Files: proposed app/src/integrations, router/nav/locales. Migration: none. Tests: authorization, reconnect/disconnect/pause state. Checks: C. done_when: manager can connect/select Page/account/dataset; /settings/integrations reports gates without implying activation.

**M4 — Delivery ledger.** Depends: M1,T5. Files: migrations/024_delivery.sql, scripts/migrate.ts, outbox/ledger module. Migration: 024. Tests: atomic enqueue, uniqueness, claim lease/crash recovery. Checks: D. done_when: pending/accepted/rejected/cancelled/removal states and stable idempotency keys persist without provider calls.

**M5 — Common dispatch worker.** Depends: M4,T3. Files: worker/Meta adapter. Migration: none. Tests: timeout/429/5xx, permanent error, stale token, concurrent withdrawal. Checks: D. done_when: bounded calls recheck consent, pause/reconcile ambiguous writes, prioritize removals and redact diagnostics.

**M6 — Lead webhook intake.** Depends: M2,M4. Files: migrations/025_meta_leads.sql, scripts/migrate.ts, proposed src/metaleads.ts. Migration: 025. Tests: challenge, raw-body invalid signature, replay/duplicate, unknown asset. Checks: D. done_when: verified notifications enqueue durably before acknowledgement; no client tenant fallback or duplicate receipt.

**M7 — Lead retrieval/mapping.** Depends: M6. Files: Lead Ads worker, src/properties.ts integration. Migration: none. Tests: retrieval failure, +20 phone, ambiguous match, invalid property, duplicate lead. Checks: D. done_when: tenant+leadgen_id yields one valid lead with page/form/ad/time provenance; mapping failures quarantine; native leads are not resent as new conversions.

**M8 — Lead catch-up.** Depends: M7. Files: lead worker/cursor/status modules. Migration: none. Tests: pagination, restart, webhook overlap, old arrival. Checks: D. done_when: authorized bounded catch-up recovers gaps once, preserves original time and records reconciliation progress.

**M9 — Audience binding schema.** Depends: M5,S5. Files: migrations/026_audiences.sql, scripts/migrate.ts, proposed src/metaaudiences.ts. Migration: 026. Tests: tenant/account mismatch, revision binding, membership uniqueness. Checks: D. done_when: manager binds segment revision to verified account/audience with delivery/removal state.

**M10 — Audience snapshots/diffs.** Depends: M9. Files: audience planner. Migration: none. Tests: distinct eligibility, consent withdrawal, departed contacts, revised filter. Checks: D. done_when: initial snapshot and add/remove diffs use stable operation keys; incompatible definitions pause; withdrawal bypasses stale snapshot.

**M11 — Audience dispatch.** Depends: M10. Files: Meta audience adapter/worker. Migration: none. Tests: verified normalization/SHA-256, batching, partial/ambiguous failure, receipts. Checks: D. done_when: consented email/phone only, no sensitive/custom values; retries/reconciliation do not duplicate additions; removals retain evidence.

**M12 — CAPI mapping.** Depends: M5,T5. Files: proposed src/metacapi.ts, versioned mapping contract. Migration: none. Tests: native-lead suppression, event-ID pairing, payment value/currency, missing context. Checks: D. done_when: only approved events map; deal won is not Purchase, clinical/internal/refund/import events excluded; truthful action_source, documented fbc, no fabricated fbp/operator IP.

**M13 — CAPI delivery.** Depends: M12. Files: CAPI worker/adapter. Migration: none. Tests: consent recheck, duplicate browser/server ID, age cutoff, per-event errors. Checks: D. done_when: original event_name/time/ID survive bounded retries, permanent failures quarantine; accepted receipt never claims matching/attribution.

**M14 — Delivery/status UI.** Depends: M8,M11,M13. Files: integrations/segments status views, ledger summaries. Migration: none. Tests: counts, redaction, stale/pending/retry/permission states. Checks: D. done_when: pending/accepted/rejected/removed counts, lag/reasons and separate returned platform estimates appear; daily reconciliation detects gaps/lag and consent/isolation failures pause connector.

### Later stubs and dependencies

Google: adapter stub only for Customer Match/Data Manager and offline/enhanced leads; TikTok: stub only for Events API 2.0/customer files. No routes, credentials, migrations or implementation tasks now.

Claude owns **auth B2–B5**; consume accepted session/tenant/capability/lockout contracts before M1/M2. Do not implement those increments here. AUTH_PLAN §6 actually lists settled choices rather than increments; ownership/details require Claude's handoff. TOTP deferred (D2): read “manager with MFA” as manager role until mfa_ok is turned ON before launch; preserve capability checks and launch gate.

## 4. Shared rules for every build task

- Branch per task from feat/crm-mvp-ui; Codex worktree C:\Work\tsst-crm-codex. Resolve predecessor integration through the owner; no autonomous merging.
- Own per-lane database and explicit process environment override. Never read or print .env, secrets or connection strings; migration/admin/runtime/auth roles retain separation.
- Port 4317 is untouchable. No push, merge or deploy.
- Arabic is full RTL; English equally supported. Use logical layouts, bidi isolation for mixed names/IDs/URLs, localized numbers, keyboard focus and reduced motion; manually smoke 375/1440 and both themes where relevant.
- Reviews are light now: worker's own selected checks only, no UI suite. Heavy reviews occur pre-launch.
- Record actual checks/output and done_when evidence. Recovery: disable route/flag/worker or revert task code; no destructive schema rollback, imported-data undo or evidence deletion.
- Legal notices/retention, business verification, App Review, asset authorization and real qualification/payment rules gate activation; stubbed build progress can proceed. Skills remain UNVALIDATED; readiness NOT_READY.

## 5. Risks (maximum five)

1. **Unverified Meta behavior/access.** Verify docs per M task, pin version/scopes; mock development and keep live delivery paused pending review/assets.
2. **Consent or tenant leak.** Fail closed on unknown evidence/asset ownership, test cross-tenant and dispatch races; withdrawal suppresses immediately and connector pauses on breaches.
3. **Baseline/auth contract drift.** Confirm B4 reuse and Claude B2–B5 handoff; honor 015–017 reservations and AUTH §6 mismatch; split blocked dependencies without replacing their contracts.
4. **Retries, gaps and event confusion.** Durable receipts/leases, stable IDs, removal priority, catch-up and daily reconciliation; distinguish paid, won, native lead and accepted delivery.
5. **Timing/RTL/performance errors.** Server Saturday/Cairo buckets, bigint-safe money and shared tables; measure contrast/layout and bounded query/refresh behavior before launch.
