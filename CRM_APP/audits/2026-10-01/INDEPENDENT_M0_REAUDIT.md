# Independent M0 re-audit

Completed: **2026-10-02 (Africa/Cairo)**. Audit started 2026-10-01; stored beside the original audit as requested.

**Verdict: PASS WITH NON-BLOCKING FOLLOW-UPS**

Audited implementation: `7f3ce318eac24e8ec4f6bd47fcde44f07dae2560`.
Evidence-only follow-up / current HEAD: `f1a1810246453594894645bf3ae50c6d54dbe5cc`.
Branch: `feat/crm-m0-foundation`.

All three original findings are **CLOSED** and all mandatory M0 gates passed. No blocking finding remains. This does not certify production readiness, promote TSST/DEV_AG readiness, perform formal project closure, or authorize M1 execution.

## Target and independent review

`git status`, branch, six-commit log and `git diff --check` confirmed the requested state. The follow-up changes only one evidence line recording the remediation SHA. Twenty-six runtime/test/config files in the local execution mirror were SHA-256 matched to the Drive checkout, whose tracked content matches the target plus that evidence-only line. The scope diff from `42f630db39cc91fa2520027585c7756b5f58ae78` to the target contains the replay fix, bootstrap-state guards/order, regression tests, test command and audit artifacts only.

A fresh independent reviewer (`m0_reaudit_review`, without implementation conversation history) inspected transition, bootstrap, concurrency tests and surrounding database/worker/API/security paths. It found all three prior findings closed and no new blocking M0 defect. Lead separately observed actual database, bootstrap and browser behavior below. No production code was changed during re-audit.

The original FAIL report remains unchanged: `INDEPENDENT_M0_AUDIT.md`, SHA-256 `2D2EEF21F94B3E4ABA9C24CA6D754A4295F566E39667995679F2BCE96FD34990`. Original failure observation and remediation evidence remain historical, not replaced by this result.

## Prior findings

| Finding | Independent observation | Status |
|---|---|---|
| Retry key K2 unbound on durable replay | Actual PostgreSQL test 13 and the required adversarial probe: A/K1 succeeds at version 1; A/K2 returns the original result; both cache entries carry the same hash/result; B/K2 yields **409 IDEMPOTENCY_CONFLICT**; one transition/history/event/outbox/audit/receipt and one worker effect remain. Expiring retry cache and replaying A still returns the durable result. The new cache write occurs under the same deal lock and transaction before replay returns | **CLOSED** |
| Bootstrap retry overwrites credentials | Four dedicated tests passed. Additionally, the **exact full native-local.ps1**, without PrepareOnly or source edits, completed initdb → server start → database create → migrate → seed in an isolated fresh copied workspace: 2 tenants, 18 CRM tables and non-superuser/non-bypass runtime. Removing only that disposable workspace's `.env` reproduced a partial state with real PostgreSQL data/password; retry refused safely, retained the original password hash and gave recovery instructions. Generated admin/runtime credentials were absent from captured startup/retry output. The working cluster's data and credential hash were preserved; it was started normally for subsequent gates | **CLOSED** |
| Concurrency test starts after work is consumed | Test 14 creates a pending job, starts worker 1, and confirms it is blocked at a PostgreSQL advisory barrier **after taking the actual outbox row lock**. While the first worker is still active and the row remains pending, worker 2 executes `workOne` on another pooled connection and returns false through SKIP LOCKED. There are zero effects before release and exactly one effect/attempt with processed status afterward. Test 10 also re-proved retry and actual child-process crash/restart behavior | **CLOSED** |

## Fresh gates and security regression

| Check | Observed result |
|---|---|
| Targeted `node --env-file=.env --import tsx --test --test-name-pattern='13 |14 ' tests/foundation.test.ts` | 2 passed |
| `node --env-file=.env --import tsx audits/2026-10-01/retry-key-probe.mts` | PASS; 409 conflict and exactly one transition |
| `npm run test:bootstrap` | 4 passed, including incomplete state and orphaned password refusal |
| Full `npm test` | **22 passed / 0 failed / 0 skipped**: 14 real PostgreSQL/API, 4 bootstrap-state, 4 Chromium RTL/LTR |
| `npm run lint` | PASS, 15 files |
| `npm run typecheck` / `npm run build` | PASS / PASS |
| RLS and runtime role | Tests 01–03: business tables ENABLE/FORCE RLS; runtime non-owner, not superuser, no BYPASSRLS; A cannot read/update B; forged tenant/token/actor context fails; transaction-local state does not leak through the pool |
| RBAC and authority | Tests 04–05: unauthorized action and assigned scope denied; current grant revocation denies replay and pending worker effect. Static review reconfirmed deny-by-default role/action predicates and worker authorization of its own role plus initiating actor/grant |
| Composite references | Test 02: cross-tenant contact/deal relationship rejected by PostgreSQL FK |
| Atomicity and replay | Tests 06–13: controlled transition, invalid/stale rejection, rollback of an injected audit failure, durable-command identity, worker retry/crash and corrected retry-key binding passed |
| Backup → restore | `scripts/native-recovery.ts`: **18 table counts and row digests matched**, restored runtime RLS failed closed. Synthetic copy/start interval **3,042ms**; `reaudit-recovery.json`. No production RPO/RTO claim |
| Repository state | Tracked product code unchanged; `git diff --check` PASS; unrelated TSST untracked files preserved |

Full fresh bootstrap is an additional audit experiment beyond the 22-test suite. Its sanitized result is `reaudit-bootstrap.json`. The local harness and private logs/data are retained outside Drive in the execution mirror's ignored `.local-postgres/reaudit-fresh-*` workspace; the fresh server was stopped after verification. No passwords or raw database backups are included in this report.

## Scope assessment and follow-ups

No weakened authorization, changed tenant isolation, new duplicate outcome path, cache/durable-ledger coupling, credential overwrite, or hidden production test bypass was found. The concurrency barrier is a temporary database trigger installed by the test administrator and removed in cleanup; production worker code is unchanged. `PrepareOnly` stops at bootstrap state preparation and is not an API/worker privilege bypass. Full fresh bootstrap independently exercised the normal path.

**Blocking findings: none.**

**Non-blocking follow-up:** bound the second worker's wait in `tests/foundation.test.ts:494` with timeout/cancellation and assured barrier cleanup. If a future change removes SKIP LOCKED, the test could otherwise hang while the barrier is held. The audited implementation demonstrably skips the locked pending job and produces one effect; this is test-harness hardening, not an observed runtime race.

Existing environment limitations remain transparent: npm writes on Google Drive and Docker startup were not re-certified. A source-verified local mirror and real native PostgreSQL supplied the required proofs, including full fresh bootstrap and physical restore. Docker-specific logical-backup scripts remain unverified; this does not block the demonstrated native M0 path.

No M1, memory sync, push, product-code modification or new commit performed. This report and sanitized re-audit observations are new audit artifacts only.
