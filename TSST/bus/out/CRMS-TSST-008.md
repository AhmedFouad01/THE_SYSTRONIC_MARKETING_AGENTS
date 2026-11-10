# CRMS-TSST-008 — BLOCKED

Codex claimed the existing task through `bus.py`. Fetched TSST `origin/master` at `924adedd6cdae4c8389df3a6f379ccfc6a6cb77b` and verified the task brief and operating contracts match the local copies. Local TSST stayed on `master`. Mutation preflight passed in explicit `tsst-dev` contract mode. Contract SHA256 `299c9d553ee27086abfd877907b33d0ecf5e539a655fc16a09a00ea09da924cd`.

Cafe clean branch `codex/crms-beta-e2e-008`, local SHA `023828cbf96abef447ff032ed646f94555997e2e`, parent `545f595c792e2c33f24c41f7c02d87347b106644`. Commit contains only `scripts/crms-002w-local-verify.mjs`, `scripts/crms-002w-runtime-verify.mjs`, and one `package.json` script. `git diff --check HEAD^ HEAD` passed.

- `pnpm install --frozen-lockfile` passed on Node 24.21.0 and pnpm 12.4.1. `pnpm --filter @crms/edge-api... build` passed. `pnpm --filter @crms/testing test` passed 8/8. Scoped `typecheck` and `lint` passed for `@crms/edge-api` and `@crms/testing`.
- `pnpm verify:crms-002w:local` on the final clean commit reached the HTTP scenarios. An earlier launch stopped before HTTP because the Windows environment allowlist hid the Compose plugin. The tests-only runner fix restored Compose access.
- A passed. One dine-in order `01a1c4fd-5a25-7a21-8324-daeed5ce3c86` with two items went through KDS service, partial cash and confirmed InstaPay, settlement and close. The order closed, the table became available, and 16 matching mutation audit rows were verified.
- C passed. Transfer to a free table returned `201`, moved the tab and freed the source. Same-table transfer returned `400` with `Destination table must be different`. Occupied-table transfer returned `409` with `Destination table is not available`.
- D passed. WAITER bill close and CASH_CUSTODIAN InstaPay confirm both returned `403`.
- B blocked the verifier. The second bill was `SETTLED`, EGP 40 paid, EGP 0 due, with one KDS item `QUEUED`. `POST /api/v1/billing/bills/01a1c4fd-60a7-74ef-bb7a-0fd44da46a89/close` with `{"expectedVersion":3}` returned HTTP `409` and `{"message":"Bill lifecycle does not allow this operation","error":"Conflict","statusCode":409}`. The required `code: BILLING:kds_work_still_live` was absent. At the pinned base, `apps/edge-api/src/modules/billing/billing.service.ts:632` throws that sentinel and `billing.controller.ts:117–124` maps it to the generic response. Per brief, execution stopped before serving and reclosing the second order or attempting a second pass. The branch was not pushed and its remote ref is absent.

Isolation and cleanup passed. Local Docker `desktop-linux`, unique Compose project `crms002w-verify-831d26828180`, tmpfs Postgres, self-signed TLS, loopback ports `65269`–`65271`. All 31 migrations applied to temporary Postgres. `down -v` left zero test containers, volumes, networks or listeners. Temporary TLS key removed. Protected QA and Android container IDs and listener PIDs on `5194`, `18543`, `55460`, and `55461` matched baseline. No app changes, merge, PR, deployment, production data changes, or Actions dispatch.

Evidence under `C:/Users/Do7a/Projects/CAFE_RESTAURANT_MS_E2E008/tmp/crms-002w-evidence/crms002w-verify-831d26828180/` in `runtime.log` and `summary.json`. Runtime log SHA256 `789349fcca0d22c9b376acc4fe2c414a6673367529cf32bfc7f1c5577d08ffbf`.

Skills used: `TSST-DEV-SK-011` for scenario coverage and assertions, `TSST-DEV-SK-015` for pinned evidence, gates and cleanup. Skill friction: none.
