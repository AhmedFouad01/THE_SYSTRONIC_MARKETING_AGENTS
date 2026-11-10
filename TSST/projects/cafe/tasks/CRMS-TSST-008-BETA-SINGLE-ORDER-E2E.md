# CRMS-TSST-008 — Beta single-order HTTP E2E + close-while-live + table transfer

Date: 2026-11-10 · Issued by: TSST Lead (Claude, R61) · Bus task: `CRMS-TSST-008` · Worker: Codex (`tsst-dev`, CODE tier)
Team: build · Skills: `TSST/DEV/skills/tsst-dev-sk-011-testing-tdd-engineering`, `TSST/DEV/skills/tsst-dev-sk-015-verification-before-completion`

## Why

Beta blockers that need no phone (see Cafe `docs/gates/CRMS-CLOUD-HANDOFF.md` and `docs/gates/CRMS-BETA-ACCEPTANCE-CHECKLIST.md` at `545f595`):

1. No single test drives **one order** through the whole HTTP cycle; 002C/D/E prove the pieces separately.
2. `BILLING:kds_work_still_live` is only checked as a string in source (`scripts/crms-002s-local-verify.mjs:62`), never at runtime.
3. Table transfer (`POST /table-tabs/:tabId/transfer`, `apps/edge-api/src/modules/pos/pos.controller.ts:279`) has no runtime test.

## What to build (tests only)

A new isolated runner pair in the Cafe repo, following the existing `scripts/crms-002e-local-verify.mjs` + `scripts/crms-002e-runtime-verify.mjs` pattern (own compose project name, dynamic 127.0.0.1 ports, tmpfs Postgres, self-signed TLS Edge API, random bootstrap owner, `down -v` in `finally`, clean-tree check):

- `scripts/crms-002w-local-verify.mjs`, `scripts/crms-002w-runtime-verify.mjs`, `package.json` script `verify:crms-002w:local`. If `002w` is taken, use the next free letter and say so.

Runtime flow, all through HTTP on **one** order (one business day, real role accounts created in the run):

A. **Full cycle.** Open a table tab (dine-in) → add 2 items → submit → KDS item(s) to READY then SERVED → create bill → partial cash collect → InstaPay collect + confirm → bill settled → close the bill (MANAGER or OWNER_ADMIN; billing.bill.close is limited to those roles) → assert the bill is closed, the table is free, the order is in its final state, and audit rows exist for each step.
B. **Close while the kitchen is live.** A second order is submitted, its KDS item is NOT served yet, and the bill is fully paid → `POST /bills/:id/close` must be rejected with `BILLING:kds_work_still_live` (assert status + code). Serve it, then close succeeds.
C. **Table transfer.** (1) valid transfer to a free table → 2xx, the tab moves, and the source table is free; (2) transfer to the same table → 400; (3) transfer to an occupied/unavailable table → 409. Assert the exact codes the service returns. If the real codes differ from 400/409, **do not change the app**; record the real codes and flag the difference in the report.
D. **Permissions.** WAITER cannot close a bill (403); CASH_CUSTODIAN without confirm cannot confirm an InstaPay payment (403).

Read the endpoint and DTO shapes from `apps/edge-api/src/modules/{pos,kds,billing}` and the existing runtime scripts. Do not guess them.

## Where to work

- Fresh clone (do not reuse other folders): `git clone https://github.com/Do7a193/CAFE_RESTAURANT_MS.git C:\Users\Do7a\Projects\CAFE_RESTAURANT_MS_E2E008`, then `git switch -c codex/crms-beta-e2e-008 545f595`, then `pnpm install --frozen-lockfile` (pinned pnpm 12.4.1, Node 24).
- **Do not touch**: `CAFE_RESTAURANT_MS_036`, `CAFE_RESTAURANT_MS_BETAGATE_20261109`, compose projects `crmsbetaqa-20261109` and `*androidclone*`, or ports 55460, 55461, 18543 and 5194 (a live QA environment is running there).
- Build any binaries from **PowerShell** (Git Bash rewrites `/api/v1` env values).

## Hard limits

Test files and the new `package.json` script only. No change to app logic, SQL migrations or seeds. No merge, PR, deploy, or GitHub Actions. You may push the new branch only (the workflows are `workflow_dispatch` only, so a push does not trigger them). No production data or credentials, and no secrets in logs or commits. Do not raise timeouts to hide failures. If the flow fails because of an **app bug**, stop, do not fix it, and report it with the exact request, response and code.

## Done when

1. `pnpm verify:crms-002w:local` passes twice in a row from a clean tree, and `docker ps -a` shows no leftover project containers or volumes afterwards.
2. The existing gates still pass on the branch: `pnpm --filter @crms/testing test` (8), typecheck and lint for the touched packages.
3. Commit(s) end with `Co-Authored-By: Codex`, are on `codex/crms-beta-e2e-008`, and are pushed (no PR).
4. Report at `TSST/bus/out/CRMS-TSST-008.md` (≤4 KB): branch + SHA, files changed, the commands run with their pass counts, the real transfer status codes, any app bug found (request/response/code), cleanup proof, and `skills_used`.
