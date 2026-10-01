# M0 audit remediation — 2026-10-01

State: **READY FOR RE-AUDIT**. This is regression evidence, not independent acceptance or official M0 closure.

Original implementation: `42f630db39cc91fa2520027585c7756b5f58ae78`. Original `INDEPENDENT_M0_AUDIT.md` verdict remains **FAIL** and its content is unchanged; the original `retry-key-observation.json` is also retained unchanged. Both previously untracked audit artifacts are included with this remediation to preserve the source of the findings.

Remediation commit: `7f3ce318eac24e8ec4f6bd47fcde44f07dae2560` (`fix(crm): close M0 audit findings`). This SHA was recorded after commit in an evidence-only follow-up; tested source is unchanged.

| Finding | Bounded fix | Regression / observed result | Status |
|---|---|---|---|
| New retry key not bound on durable replay | Under the existing deal lock and transaction, upsert a missing/expired retry key with the durable receipt's hash/result before returning. Existing live keys retain their expiration. Durable command/event identities are unchanged | `tests/foundation.test.ts`, test 13: A/K1 → A/K2 replay → B/K2 returns 409 IDEMPOTENCY_CONFLICT; K2 same body returns A; cache expiry still returns A; exactly one history/event/outbox/audit/receipt and one worker effect. Required audit probe now asserts and prints PASS | **CLOSED — remediation verified; independent re-audit pending** |
| Partial bootstrap retry overwrites saved password | Guard existing data/password before generating credentials; refuse incomplete or prior state with recovery instructions. Create password exclusively and persist matching `.env` before initdb/start/create-db. No automatic credential rotation or automatic resume | `tests/native-bootstrap.test.ts`: four script-level cases PASS: fresh credential/config preparation plus repeat refusal; existing partial data/password preserved; missing password fails safely; orphaned password preserved. Password hashes checked and secret output rejected | **CLOSED — remediation verified; independent re-audit pending** |
| Competing workers tested only on an empty queue | New test starts with one pending job. A test-only PostgreSQL trigger holds worker 1 at an advisory-lock barrier after it has acquired the real outbox row lock. `pg_blocking_pids` confirms the barrier before worker 2 enters actual `workOne` | `tests/foundation.test.ts`, test 14: first remains active with pending job, second returns false via SKIP LOCKED before barrier release; no effect before release, one effect/attempt and processed status afterward. Polling observes an actual lock condition; elapsed delay does not establish success | **CLOSED — remediation verified; independent re-audit pending** |

## Commands and fresh results

- Targeted first: `node --env-file=.env --import tsx --test --test-name-pattern='13 |14 ' tests/foundation.test.ts` — **2 passed**.
- `npm run test:bootstrap` — **4 passed**. `-PrepareOnly` exercises actual bootstrap state preparation/guards in disposable directories without starting a server; this is bounded script-level evidence, not a claim that a new full cluster was started by these tests.
- Required `node --env-file=.env --import tsx audits/2026-10-01/retry-key-probe.mts` — **PASS**, expected 409, original result on replay, one transition. The probe now fails with a nonzero exit code if this regression returns.
- Final `npm run lint` (**15 files**), `npm run typecheck`, `npm test`, `npm run build` — **PASS**. Full suite: **22 passed, 0 failed/skipped** = 14 real PostgreSQL/API + 4 bootstrap filesystem/script + 4 Chromium RTL/LTR tests.
- `git diff --check` and staged whitespace/scope checks — PASS before commit.
- Bootstrap persistence order changed, so `scripts/native-recovery.ts` was repeated: **18 tables matched**, restored runtime RLS failed closed, measured synthetic copy/start interval **3,141ms**. See `remediation-recovery.json`. No production RPO/RTO claim. Existing local cluster was preserved and restarted normally.

Execution used the existing local mirror at `C:\Users\10\Documents\ChatGPT\THE_SYSTRONIC_MARKETING_AGENTS\tmp\m0-stage`, real PostgreSQL 17.10 and PowerShell 7. Changed source files were copied back to the requested Drive checkout and verified by SHA-256; `remediation-hashes.json` records these hashes and the unchanged historical audit artifacts. The original implementation manifest/evidence remains historical rather than being silently rewritten.

No dependencies, schema, worker production behavior, Blueprint decisions, M1 work, memory sync or push added. One lint issue in test cleanup was corrected before the passing final suite. Existing unrelated TSST files remain untouched. Bootstrap retries deliberately stop and explain manual recovery; they never replace existing credentials. The final evidence-only follow-up records the implementation SHA without changing tested code.
