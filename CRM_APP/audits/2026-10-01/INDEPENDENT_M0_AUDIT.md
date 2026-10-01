# Independent M0 audit — 2026-10-01

**Verdict: FAIL — do not close M0 or start M1.**

Target: `42f630db39cc91fa2520027585c7756b5f58ae78`, branch `feat/crm-m0-foundation`. Two fresh reviewers received bounded security and durability review assignments without the implementation conversation. Lead independently reran gates and reproduced the blocking finding. Review concerns only M0, not production readiness or later milestones.

## Findings

1. **BLOCKING / P1 — a new retry key is not bound on durable command replay.** `CRM_APP/src/transition.ts:55` returns at line 62 before the retry-cache write at line 110. Execute A (New → Qualified, expected version 0, command ID A) with K1; replay A with K2; then execute B (Qualified → Won, expected version 1, command ID B) with K2. Expected: 409 `IDEMPOTENCY_CONFLICT` because K2 has already been presented for a different body inside the cache window (`CRM_BLUEPRINT/06_API_CONTRACTS.md:8`). Observed on real PostgreSQL: B succeeds at version 2; two transition rows exist. This is a retry-key contract defect, not a duplicate of the same durable command. Test 09 covers durable replay but misses binding the newly supplied key. Remedy: atomically register the supplied non-conflicting key/hash/result before returning a durable replay, and add a regression for this exact sequence. Preserve independent durable-command retention.

2. **IMPORTANT / P2 — bootstrap retry can overwrite the only saved cluster password.** `CRM_APP/scripts/native-local.ps1:5` guards only `.env`; line 9 overwrites `.local-postgres/password` before attempting initdb. If initdb succeeds but server start/database creation fails before `.env` is written at line 23, rerunning generates a different password and overwrites the original, then fails on the existing data directory. Static finding; the audit did not overwrite credentials to demonstrate it. Guard existing data/password first and preserve credentials on partial failure. Documented manual continuation avoids this; it does not invalidate the successful historical bootstrap.

3. **Evidence gap — concurrent worker claim is not exercised by the existing test.** `CRM_APP/tests/foundation.test.ts:288` runs two workers after the one-shot worker at lines 274–287 has processed the only job. The competing calls see an empty queue. The row-lock/SKIP LOCKED implementation appears suitable, but the test must start competing workers with pending work to substantiate the concurrency claim. This is not evidence of an observed duplicate effect.

## Independent verification

| Check | Fresh observation |
|---|---|
| Target / source identity | HEAD equals target; tracked application/Blueprint diff empty; all 35 source-manifest entries match in Drive and local execution mirror |
| `npm run lint` / `npm run typecheck` / `npm run build` | PASS |
| `npm test` | 16 passed: 12 PostgreSQL/API and 4 Chromium Arabic/English × 360/1280px; 0 failed/skipped |
| Retry-key adversarial probe | FAIL as described in finding 1; see `retry-key-observation.json` and `retry-key-probe.mts` |
| Native `scripts/native-recovery.ts` | PASS, 18 CRM table counts/digests matched; restored runtime RLS failed closed; measured copy/start interval 4,148ms. No production RPO/RTO claim |
| Security review | PASS within documented trusted-application boundary: protected session lookup, non-owner/non-bypass runtime, transaction-local context, composite references, server object/action checks, current grant/role checks and worker reauthorization |
| Durability review | FAIL on finding 1; transaction atomicity, version locking, durable command identity, real child-process crash rollback and bounded database effect deduplication otherwise supported |
| Git whitespace / scope | `git diff --check` passed; unrelated pre-existing TSST files preserved |

The existing Drive npm/Docker limitations remain disclosed; the verified local mirror and real native PostgreSQL are valid equivalents for these M0 checks. They are not the reason for this FAIL. Further authorization negatives (expired/wrong-object grants, worker role downgrade/inactive membership, unknown role and GET denial) remain coverage improvements, not confirmed security bugs.

## Disposition

M0 remains open. No product-code fixes, closure/status promotion, memory sync, M1 implementation, commit or push performed by this audit. The original commit/evidence is retained unchanged. Fix finding 1 and address the important bootstrap issue / concurrency evidence before requesting a fresh audit of a new commit.

Reproduce from CRM_APP against the dedicated synthetic local database:

```powershell
node --env-file=.env --import tsx audits/2026-10-01/retry-key-probe.mts
```

This probe appends a fresh synthetic tenant fixture and emits no session credentials. Reviewer roles: `m0_security_audit` and `m0_durability_audit`; Lead executed the independent gates and adversarial probe.
