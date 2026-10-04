# M2 Journey & Reporting — bounded implementation evidence

Recorded 2026-10-03 (Africa/Cairo). Primary session only; synthetic data throughout.

- Branch: `feat/crm-m2-journey-reporting`.
- M1 audited baseline: `e0a86d9876e29caad5009015074e04b322ad7601`.
- M1 closure documentation: `93bd92a2a148d0f751a2f8735ae3896a25b3532e`.
- M2 implementation SHA: `ba841c90b64e8bc4bb49c47247bd724f36e3a3a6` (resolved by the evidence-only follow-up).
- Verdict: **PASS for the bounded local M2 slice**, not independent audit or production acceptance.

## Coverage and implementation

| Requirements | Implemented / demonstrated |
|---|---|
| TRK-01 | Public tenant/site collection, CORS, strict validation/consent, payload/rate limits, durable source identity, timestamp preservation, forged-field rejection |
| TRK-02 | Anonymous visitor/session evidence; explicit verified form/order links; effective intervals, shared-identifier non-merging, correction provenance and replay protection |
| TRK-03 | Canonical immutable payment/refund/service-won conversions; outcome dedup independent of transport cache; typed transactional calculation outbox; no provider delivery |
| CMP-01/02 | Rename-safe campaign IDs, source/UTM/ad/click evidence, currency/timezone/account dimensions and replaceable synthetic daily cost snapshots |
| ATR-01/02 | `deterministic-v1`: First Touch + Last Non-Direct Touch, default 30-day lookback; deterministic credits/hash, immutable runs/as-of, explicit unknown, separate currencies/outcomes/provider labels |
| COM-01 | Separate orders/payments/fulfillments/refunds; direct purchase without fabricated deal, unpaid/COD delivery has no paid conversion, partial refunds preserve originals and reverse credit |
| TEN/IAM/INT/NFR dependencies | Tenant-equal references, 17 new FORCE-RLS tables, non-owner/non-BYPASSRLS runtime, current action/object/field checks, worker reauthorization, transaction/replay integrity, bilingual narrow/desktop UI |

Migration: `006_journey_reporting.sql`, additive after 001–005. Seventeen new
tables; additive BusinessEvent fields/indexes and explicit permission/function
changes. Original migrations and protected-key implementation remain unchanged.

Service: `src/journey.ts`; HTTP integration in `src/api.ts`; calculation jobs use
the existing `src/jobs.ts` loop. UI: `web/reporting.html`, linked from CRM.
Routes and exact field/authority/late-event contracts: `M2_CONTRACTS.md`.
Reproduction: `tests/m2.test.ts`, `tests/m2-ui.spec.ts`,
`scripts/m2-clean-check.ts`, `scripts/m2-upgrade-check.ts`.

## Executed gates

| Gate | Final result |
|---|---|
| `npm run lint` | PASS, 26 checked files |
| `npm run typecheck` | PASS |
| `npm test` | **82 passed / 0 failed / 0 skipped / 0 cancelled** |
| PostgreSQL/API | 64 passed: existing 42 + M2 22 |
| Bootstrap | 4 passed |
| Chromium | 14 passed: existing 9 + M2 5; English/Arabic, 360/1280px, details/journey, loading/empty/error/permission states |
| M0/M1 regression | **All original 55 passed**; M0 subset 22/22 |
| `npm run build` | PASS |
| Fresh dependency install | `npm ci --offline` in an empty dependency directory, then build PASS |
| Clean schema install | 001–006 PASS; 47 CRM tables, two synthetic tenants, explicitly provisioned keys and valid protected configuration |
| M1→M2 upgrade | PASS; all 48 pre-upgrade fixture rows across 30 existing tables retained, all original field values preserved, keys/ciphertext/lookup digests byte-identical |
| Diff/staging/source checks | `git diff --check`, staged check and source SHA256 match verified before commit |

Execution used the pre-existing local mirror, with all 36 tracked executable,
configuration and test files hash-matched to the G: baseline before edits.
Final M2 sources were copied to G: and SHA256-matched back to the tested mirror.
Native PostgreSQL used a newly created, isolated disposable loopback cluster on
55438. The original M0/M1 development cluster/configuration was not modified.
Sanitized summary and source hashes: `evidence/M2_VALIDATION.json`. No fixture
credentials, key material or database dumps are committed.

Security fixtures cover foreign visitor/session/identity/event/touchpoint/order/
conversion/report/site/campaign access; tenant-equal FK failures; role/grant and
membership revocation; sensitive click/visitor identifier filtering; immutable
conversion write denial; and revoked originating authority before queued work.
Collection replay and concurrent payment replay produce one logical effect.
Late evidence creates a new calculation through the reauthorized worker, while
previous runs remain unchanged. All required journey/commerce attribution
fixtures are executable, including unknown, direct-after-nondirect, outside
lookback, corrections, late timestamps, partial refunds and mixed currencies.

Initial test work found and fixed narrow English layout overflow. A sandboxed
Playwright process shutdown stalled; the final complete run with Windows process
permissions exited successfully. The final counts above supersede those runs.

## Limits and follow-ups

- No blocking finding remains within this bounded local slice. This is primary-session validation, not an independent M2 re-audit.
- Public origin/site keys are low-trust abuse signals, never proof of identity. Production bot mitigation/operational capacity is not established.
- Pre-M2 service outcomes lack historical amount snapshots in M1; first normalization snapshots the current deal value. Reports label deal_won separately from paid commerce revenue; reconstructing earlier amounts requires separate source evidence.
- Native/local-mirror execution is demonstrated. Docker/direct-Drive dependency execution remains unverified, as do production identity/MFA integration and external secret custody/KMS.
- Git auto-maintenance encountered the pre-existing invalid `refs/codex/desktop.ini` during M1 closure. Commits succeeded; later commits disable automatic maintenance for that invocation. The ref directory was not changed.
- No Meta/Google/GA4/Shopify connector, OAuth, provider delivery, external spend credentials, audience sync, segments, agency operations, billing, AI/ML scoring, M3+, production infrastructure, production RPO/RTO claim, memory sync, push, merge or sub-agent creation/use.

## Post-close hardening — R-01 / R-02 data-exposure disposition (2026-10-04)

Recorded after M2 closure at `3bd3fcb`, in response to
`audits/2026-10-04/INDEPENDENT_M2_REAUDIT.md` (R-01, R-02, R-04) and
`audits/2026-10-04/INDEPENDENT_M2_R03_DELTA_REAUDIT.md` (D-01). Documentation only:
no backfill, migration or runtime change.

- No persistent or production traffic evidence exists for migration 006.
- The only persistent cluster (local development, loopback `127.0.0.1:55432`, database
  `crm_m0`) has migrations 001–004 only; 006 and 007 were never applied there and
  `crm.source_receipt` does not exist. Its tenant data is synthetic fixtures. Verified
  2026-10-04 by a direct read-only inspection (`default_transaction_read_only=on`,
  `BEGIN READ ONLY … ROLLBACK`): `public.crm_migrations` = versions 1–4; no
  `source_receipt`/`collection_site` relation; tenants named "Tenant A"/"Tenant B";
  cluster stopped again afterwards. The independent delta re-auditor did not re-query it.
- Every application of 006/007 was on a disposable scratch validation cluster with
  synthetic data. No deploy or hosting configuration exists in the repository.
- Therefore R-01 (legacy case-variant duplicate event pairs written under 006) and R-02
  (legacy hash-fallback 409 conflicts on replay) have no affected data. Both are accepted
  as documented limits.
- Revisit only if a database that ran 006 with real traffic is ever found; at that point
  inspect it for case-variant duplicate source ids before applying 007.

Hardening test changes (same pass): M2-25 now sends mixed/upper-case `campaign_id` and
asserts unchanged replay identity and a resolved campaign reference; M2-30 holds the
canonical tenant advisory lock on a second connection and asserts upper/mixed-case-tenant
requests block until release (R-04). `scripts/m2-clean-check.ts` and
`scripts/m2-upgrade-check.ts` now create `../m2-runtime` before writing (D-01).
