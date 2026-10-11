# YAKEBDA_MS — Audit Remediation Execution Plan v1.0


**Date:** 2026-07-13  
**Project:** YAKEBDA_MS  
**Repository:** `AhmedFouad01/yakebda-ms`  
**Verified baseline:** `main @ d52ab28c928e57a75aff249f57032f18f379f27f`  
**Program status:** Mandatory remediation freeze  
**Source inputs:** `YKMS-AUDIT-FULL-REPORT.md`, `YKMS-P0-SECURITY-FINANCE-FIXES.md`, `YKMS-P1-RELIABILITY-FIXES.md`, `YKMS-P2-MAINTAINABILITY-FIXES.md`, `YKMS-P3-PLATFORM-FIXES.md`


## 1. Non-negotiable program decision


No new product feature, new core module, new roadmap implementation, Channel Menus, Inventory, Delivery expansion, Finance module, Accounting Bridge, Online Connector, or e-Receipt work may start until P0, P1, P2, P3, and the P4 final re-audit are completed, merged, validated, documented, and explicitly accepted by the user.


Allowed work during the freeze:
- bug fixes directly tied to the audit findings;
- tests, migrations, observability, documentation, accessibility, refactoring, and rollback work required by this plan;
- emergency production fixes, isolated and documented, only when they cannot wait for the active remediation phase.


Disallowed:
- opportunistic features;
- scope expansion;
- visual redesign;
- silent branch restacking;
- combining future modules with remediation PRs;
- marking a phase complete from local success only.


## 2. Evidence correction before execution


The uploaded execution briefs are working inputs, not unquestionable truth. Live review of `main @ d52ab28` produced these corrections:


1. **R2 must not add a second order-number lock.** Migration `20260712_012_order_integrity_stabilization.ts` already assigns `order_no` in a `BEFORE INSERT` trigger protected by `pg_advisory_xact_lock`. The application still calculates a redundant `MAX+1`, but the database trigger is authoritative. Remediation: remove/neutralize the redundant application calculation and strengthen tests; do not duplicate the lock unless a failing concurrency test proves the trigger ineffective.
2. **The Customers part of R4 is already protected.** `GET /customers` currently requires `customers.manage`; `/customers/lookup` requires `customers.lookup`. Do not add `customers.view` merely because the audit brief proposed it. Add regression tests and change code only if live tests prove exposure.
3. **A blanket permission on `GET /settings` would break operational screens.** POS, KDS, Orders, and AppShell consume runtime settings. Remediation must split safe runtime settings from full administrative settings rather than simply blocking the existing endpoint.
4. **R1 and R7 must execute together in P0.** A “read paid total, then insert” guard outside a transaction remains raceable. Payment validation, order locking, insert, and audit must be one atomic transaction; print enqueue remains after commit.
5. **PIN lockout cannot be safely implemented as only a user counter.** A failed PIN does not identify which user was attempted. Use branch/IP/device-scoped attempt tracking plus rate limiting; email login may additionally use user/email-scoped lockout. Never store attempted PIN/password.


Every finding enters a Revalidation Gate before patching:
- reproduce with a focused test;
- inspect current code and migration behavior;
- classify as Confirmed, Already Fixed, Partially Fixed, or Invalid;
- record the evidence and final file list;
- only Confirmed/Partially Fixed findings proceed to code.


## 3. Delivery model


### Serial PR order


1. `fix/audit-p0-integrity-security`
2. `fix/audit-p1-operational-reliability`
3. `test/audit-p2a-frontend-safety-net`
4. `refactor/audit-p2b-ui-maintainability`
5. `chore/audit-p3-platform-hardening`
6. `audit/p4-final-production-readiness`


Rules:
- each branch starts from current `main` after the preceding PR is merged;
- no stacked remediation PRs unless explicitly approved;
- each PR stays Draft until all gates pass;
- exact head SHA and CI must be reverified before Ready/Merge;
- no next implementation phase begins before the previous phase is merged and post-merge smoke checks pass;
- one checkpoint commit per remediation unit;
- migrations are forward-only additions with tested `down()` where practical;
- no commit removes or weakens an existing test to obtain green CI.


## 4. Gate 0 — Baseline freeze and finding revalidation


### Objective
Create an evidence ledger and prevent stale audit instructions from causing duplicate or destructive work.


### Required outputs
- `docs/engineering/AUDIT_REMEDIATION_LEDGER.md`
- finding table: ID, severity, current evidence, reproduction test, status, owner file, final decision;
- baseline metrics: API test count, frontend test count, CSS file count/LOC/`!important`, `Pos.tsx` LOC, CI Node version;
- fresh database migration success from zero to latest;
- backup/restore note for the test database;
- no code fixes in this checkpoint except test harness or documentation needed to prove a finding.


### Files reviewed immediately
- `apps/api/src/modules/orders.ts`
- `apps/api/src/db/migrations/20260712_012_order_integrity_stabilization.ts`
- `apps/api/src/modules/auth.ts`
- `apps/api/src/modules/settings.ts`
- `apps/api/src/modules/restaurant.ts`
- `apps/api/src/modules/bridge.ts`
- `apps/api/src/modules/shifts.ts`
- `apps/admin/src/main.tsx`
- `apps/admin/src/pages/Pos.tsx`
- `apps/admin/src/components/ui/overlays.tsx`
- `.github/workflows/ci.yml`
- `docs/ROADMAP.md`
- `docs/engineering/CURRENT_IMPLEMENTATION.md`
- `docs/YAKEBDA_MS_Milestone_Log.md`


## 5. P0 — Financial integrity and authentication security


### P0.1 Atomic payment integrity — combines R1 + R7


Required behavior:
- standalone payment route accepts real capture methods only; `unpaid` remains an order-creation state, not a payment row;
- start a DB transaction;
- load and lock the order row (`FOR UPDATE`);
- compute net paid inside the same transaction;
- reject zero/negative capture, fully paid order, overpayment, cancelled order, invalid branch, disabled payment method, and missing required shift;
- insert payment and audit atomically;
- enqueue receipt print only after commit in best-effort mode;
- add concurrency test: simultaneous payment requests cannot overpay;
- add/verify indexes used by `order_id` and `shift_id` sums;
- keep currency values rounded through one shared money helper; no ad-hoc floating arithmetic.


Primary impacted files:
- `apps/api/src/modules/orders.ts`
- `apps/api/src/i18n/ar.ts`
- `apps/api/src/lib/money.ts` **new**
- `apps/api/src/db/migrations/20260713_015_payment_integrity.ts` **proposed new**
- `apps/api/src/db/knex.ts`
- `apps/api/tests/payment-integrity.test.ts` **proposed new**
- `apps/api/tests/mvp.test.ts`
- `apps/api/tests/security-scope.test.ts`


Possible supporting files after revalidation:
- `apps/api/src/lib/audit.ts`
- `apps/api/src/modules/settings.ts`


### P0.2 Order-number allocation cleanup — corrected R2


Required behavior:
- prove concurrent numbering against the existing DB trigger;
- remove the redundant application-side `MAX(order_no)+1` calculation from `orders.ts` if the trigger works as designed;
- keep migration 012 as the single authority;
- do not add another advisory lock;
- preserve branch/account and daily/continuous numbering semantics;
- all N concurrent creates succeed with unique contiguous values.


Impacted files:
- `apps/api/src/modules/orders.ts`
- `apps/api/src/db/migrations/20260712_012_order_integrity_stabilization.ts` **read/verify; no edit expected**
- `apps/api/tests/order-numbering.test.ts`
- `apps/api/src/app.ts` only if obsolete order-number conflict mapping is removed after proof.


### P0.3 Auth rate limiting, persistent attempt tracking, and failed-auth audit — revised R3


Required behavior:
- rate limit both email and PIN login;
- use request keys that remain meaningful behind the deployed proxy;
- configure Express `trust proxy` explicitly;
- persist attempt windows/locks in PostgreSQL so protection survives process restarts and multiple API replicas;
- PIN failures are tracked by `branch_id + IP/device context`; email failures by normalized email/account context + IP;
- audit and structured security log failed attempts without PIN/password;
- return Arabic 429/423-style errors;
- reset the relevant counter after successful authentication;
- redact `authorization`, password, PIN, token, and sensitive request bodies;
- keep bcrypt verification, but cap abuse before the candidate loop.


Primary impacted files:
- `apps/api/src/modules/auth.ts`
- `apps/api/src/app.ts`
- `apps/api/src/config.ts`
- `apps/api/src/i18n/ar.ts`
- `apps/api/src/lib/authThrottle.ts` **new**
- `apps/api/src/db/migrations/20260713_016_auth_attempt_protection.ts` **proposed new**
- `apps/api/src/db/knex.ts`
- `apps/api/tests/foundation.test.ts`
- `apps/api/tests/security.test.ts`
- `apps/api/tests/security-scope.test.ts`


Dependency files only if a library is selected:
- `apps/api/package.json`
- root `package-lock.json`


### P0.4 Settings read minimization and customer permission regression — revised R4


Required behavior:
- classify settings into:
  - runtime-safe keys required by POS/KDS/Orders;
  - administrative/sensitive keys;
- add a runtime projection endpoint such as `GET /settings/runtime`;
- operational screens consume only the runtime projection;
- full `GET /settings` requires `settings.manage` or a deliberately approved read-only permission;
- tenant/branch scope remains mandatory;
- `GET /customers` and customer detail remain on `customers.manage`;
- `/customers/lookup` remains least-privilege `customers.lookup`;
- no new `customers.view` permission unless a real read-only CRM role is explicitly approved.


Backend files:
- `apps/api/src/modules/settings.ts`
- `apps/api/src/modules/restaurant.ts` **regression verification; edit only if test fails**
- `apps/api/src/db/seedData.ts` only if a new `settings.view` permission is approved
- `apps/api/src/db/knex.ts` and a migration only if the permission catalog changes
- `apps/api/tests/settings.test.ts`
- `apps/api/tests/settings-architecture.test.ts`
- `apps/api/tests/security-scope.test.ts`
- `apps/api/tests/ykms-02f.test.ts`


Frontend consumers to migrate from full settings to runtime settings:
- `apps/admin/src/pages/Pos.tsx`
- `apps/admin/src/pages/Kitchen.tsx`
- `apps/admin/src/pages/Orders.tsx`
- `apps/admin/src/components/ui/AppShell.tsx`
- `apps/admin/src/pages/Settings.tsx` remains the full-admin consumer
- `apps/admin/src/pages/settings/shared.tsx`
- `apps/admin/src/lib/api.ts`


### P0 exit gate
- all P0 findings reproduced then fixed or formally invalidated;
- all payment writes atomic and race-tested;
- auth abuse controls survive process restart;
- no operational screen loses required settings;
- fresh migration + rollback checks pass;
- API typecheck, complete API tests, Admin build, `git diff --check`, dependency audit pass;
- post-merge smoke test on `main`;
- P0 report stored in repo docs and Real Memory.


## 6. P1 — Operational reliability


### P1.1 Print-job state machine and recovery — R5


Required behavior:
- atomic claim using transaction + `FOR UPDATE SKIP LOCKED` or one atomic `UPDATE … RETURNING`;
- increment attempt count during claim;
- backoff through `next_attempt_at`;
- retry failed jobs below max attempts;
- terminal `dead` state at max attempts;
- stuck `printing` recovery based on age;
- admin requeue endpoint uses `print_jobs.manage`;
- bridge requeue/claim remains account/device scoped;
- audit claim failure, retry, dead-letter, manual requeue;
- bridge contract documents every state and payload field.


Primary impacted files:
- `apps/api/src/modules/bridge.ts`
- `apps/api/src/modules/printJobs.ts`
- `apps/api/src/services/printJobService.ts` **new**
- `apps/api/src/config.ts`
- `apps/api/src/i18n/ar.ts`
- `apps/api/src/db/migrations/20260713_017_print_job_reliability.ts` **proposed new**
- `apps/api/src/db/knex.ts`
- `packages/bridge-contract/src/types.ts`
- `packages/bridge-contract/CONTRACT.md`
- `apps/api/tests/foundation.test.ts`
- `apps/api/tests/security.test.ts`
- `apps/api/tests/print-job-reliability.test.ts` **proposed new**


### P1.2 Refund, cancellation safety, shift variance, and exact money — R6


Chosen operational rule:
- a paid order cannot be cancelled while net paid is greater than zero;
- the operator must perform an explicit refund first;
- refund is immutable and references the original payment;
- no payment row is deleted or edited;
- cash refund belongs to the active refunding shift, while preserving the original payment reference.


Data model:
- add reversal metadata to `payments` (`transaction_type`, `reversal_of_payment_id`, `reason`) or an equivalent explicit immutable model;
- capture amount is positive; refund may be stored as an offset with enforced invariant;
- net paid and shift totals use the same shared money service;
- refund cannot exceed refundable balance;
- persist `variance` and `over_short` on shift close;
- close response includes unsettled/open order warnings;
- approval flag and `orders.refund` permission are enforced.


Backend files:
- `apps/api/src/modules/orders.ts`
- `apps/api/src/modules/shifts.ts`
- `apps/api/src/lib/money.ts`
- `apps/api/src/i18n/ar.ts`
- `apps/api/src/db/migrations/20260713_018_refund_shift_integrity.ts` **proposed new**
- `apps/api/src/db/knex.ts`
- `apps/api/src/db/seedData.ts` only if permission wording/grants change
- `apps/api/tests/refund-shift-integrity.test.ts` **proposed new**
- `apps/api/tests/mvp.test.ts`
- `apps/api/tests/settings-architecture.test.ts`


Minimal operational UI, using existing components and no redesign:
- `apps/admin/src/components/OrderDetail.tsx`
- `apps/admin/src/pages/Orders.tsx`
- `apps/admin/src/pages/Pos.tsx` only if refund is exposed in cashier history
- `apps/admin/src/lib/api.ts`


### P1 exit gate
- no lost or infinitely retried print jobs;
- duplicate bridge polls cannot double-claim;
- paid cancellation is impossible without explicit reversal;
- partial/full refund and mixed-method cases tested;
- shift cash/variance exact to currency precision;
- payment/audit atomicity preserved;
- complete tests/build/migrations/contract docs pass;
- post-merge smoke on `main`.


## 7. P2A — Frontend safety net before refactor


This phase must merge before CSS consolidation or `Pos.tsx` decomposition.


Required tooling:
- Vitest + Testing Library + jsdom;
- deterministic API mocks;
- `admin:test` root script;
- CI test step before Admin build;
- no visual or behavior changes.


Impacted files:
- `apps/admin/package.json`
- root `package.json`
- root `package-lock.json`
- `apps/admin/vite.config.ts`
- `apps/admin/src/test/setup.ts` **new**
- `.github/workflows/ci.yml`


Minimum suites:
- cart calculation and quantity changes;
- variant/bread requirements;
- source/quote/payment submission gating;
- cart retained on failure and cleared only on confirmed success;
- `resolveAssetUrl`;
- Drawer/Modal Escape behavior and later focus-trap behavior;
- runtime settings projection compatibility;
- refund action permission/validation if P1 adds UI.


Proposed test files:
- `apps/admin/src/pages/pos/__tests__/cart-model.test.ts`
- `apps/admin/src/pages/pos/__tests__/payment-gating.test.tsx`
- `apps/admin/src/pages/pos/__tests__/variant-selection.test.tsx`
- `apps/admin/src/components/ui/__tests__/overlays.test.tsx`
- `apps/admin/src/lib/__tests__/assets.test.ts`


### P2A exit gate
Frontend tests run locally and in CI; no risky refactor begins until green on `main`.


## 8. P2B — UI maintainability without redesign


### P2B.1 CSS consolidation — revised R8


Current imports confirmed in `apps/admin/src/main.tsx`:
- `styles.css`
- `ykms-02d.css`
- `ykms-02f.css`
- `pos-operational.css`
- `pos-final.css`
- `pos-card-layout-fix.css`
- `ui-cleanup.css`
- `theme.css`
- `theme-interactions.css`
- `ui-polish.css`
- `ui-polish-final.css`
- `final-closure.css`
- `select-rendering-fix.css`
- `pos-1920-density.css`
- `pos-delivery-checkout.css`
- `pos-fast-rail.css`
- `pos-fast-rail-final.css`
- `global-colors.css`


The existing project contract remains:
- `theme.css` is the semantic token source;
- `global-colors.css` is the final color authority and stays the final import.


Target architecture is therefore **≤4 stylesheets**, not a blind ≤3 target:
1. `theme.css`
2. `base.css`
3. `pos.css`
4. `global-colors.css` (last)


Method:
- inventory selectors, LOC, color declarations, and `!important`;
- capture the visual contract first;
- collapse one component family at a time;
- separate color ownership from layout ownership;
- remove empty legacy layers only after parity proof;
- reduce `!important` by at least 90%;
- use logical RTL properties;
- fix drawer animation direction;
- no change to accepted Product Grid, KDS, AppShell, pricing, or order behavior.


Files:
- `apps/admin/src/main.tsx`
- all 18 CSS files listed above
- new `apps/admin/src/base.css`
- new `apps/admin/src/pos.css`
- `docs/engineering/CSS_CONSOLIDATION_PLAN.md` **new**
- `scripts/check-theme-contract.mjs` must remain enforced and may be expanded.


### P2B.2 Overlay accessibility


Required:
- focus first interactive element on open;
- trap Tab/Shift+Tab;
- Escape closes;
- restore focus to trigger;
- correct `aria-labelledby`/accessible labels;
- nested overlay behavior tested.


Files:
- `apps/admin/src/components/ui/overlays.tsx`
- `apps/admin/src/hooks/useFocusTrap.ts` **new**
- `apps/admin/src/components/ui/__tests__/overlays.test.tsx`
- consolidated CSS owner file.


### P2B.3 Split `Pos.tsx` — R9


Order:
1. extract/test pure cart and selection model;
2. extract `ProductGrid`;
3. extract `Cart`;
4. extract `PaymentPanel`;
5. extract `OrderHistory`;
6. keep shared state in the page orchestrator.


Files:
- `apps/admin/src/pages/Pos.tsx`
- `apps/admin/src/pages/pos/model.ts` **new**
- `apps/admin/src/pages/pos/types.ts` **new**
- `apps/admin/src/pages/pos/ProductGrid.tsx` **new**
- `apps/admin/src/pages/pos/Cart.tsx` **new**
- `apps/admin/src/pages/pos/PaymentPanel.tsx` **new**
- `apps/admin/src/pages/pos/OrderHistory.tsx` **new**
- corresponding P2A tests.


Target:
- `Pos.tsx` orchestrator approximately ≤300 LOC;
- no duplicated state;
- no behavior or visual changes.


### Visual parity contract


Capture and compare:
- POS
- KDS
- Orders detail
- Menu
- Customers
- Users/RBAC


At:
- 1366×768 Light
- 1366×768 Dark
- 1920×1080 Light
- 1920×1080 Dark


Total minimum reference set: 24 screenshots.


### P2B exit gate
- tests green;
- visual parity accepted;
- ≤4 CSS files;
- ≥90% `!important` reduction;
- one authoritative selector family per component;
- RTL drawer and focus trap fixed;
- `Pos.tsx` decomposed;
- no business/API/schema change.


## 9. P3 — Platform hardening and documentation truth


### P3.1 Observability — R11


Required:
- `pino`/`pino-http` or equivalent structured JSON logger;
- request ID accepted/generated and returned on 500;
- method/path/status/duration logging;
- health/static exclusions;
- secret/PII redaction;
- failed auth security events logged and audited;
- server stack only in logs, never in client response.


Files:
- `apps/api/src/app.ts`
- `apps/api/src/index.ts`
- `apps/api/src/config.ts`
- `apps/api/src/lib/logger.ts` **new**
- `apps/api/src/middleware/requestContext.ts` **new**
- `apps/api/package.json`
- root `package-lock.json`
- `apps/api/tests/observability.test.ts` **new**


### P3.2 Cursor pagination — R12


Apply first to Orders, then Customers and Products.


Backend:
- `apps/api/src/modules/orders.ts`
- `apps/api/src/modules/restaurant.ts`
- `apps/api/src/modules/menu.ts`
- `apps/api/src/lib/cursor.ts` **new**
- `apps/api/src/db/migrations/20260713_019_cursor_pagination_indexes.ts` **proposed new**
- `apps/api/src/db/knex.ts`
- `apps/api/tests/pagination.test.ts` **new**


Frontend:
- `apps/admin/src/pages/Orders.tsx`
- `apps/admin/src/pages/Customers.tsx`
- `apps/admin/src/pages/Menu.tsx`
- `apps/admin/src/lib/api.ts`


Contract:
- existing `{ data }` remains compatible;
- add `next_cursor` and `has_more`;
- cursor is keyset-based on the endpoint’s real deterministic sort plus ID;
- no duplicates/gaps;
- indexes match actual filters and ordering.


### P3.3 Node 22 and shared contract types — revised R13


Required:
- CI Node 22;
- add Admin tests to CI;
- create a shared contracts workspace using Zod schemas and `z.infer`;
- API handlers and Admin consume the same DTO types;
- migrate high-drift order/customer/pagination contracts first;
- do not claim complete OpenAPI until response schemas are actually covered.


Files:
- `.github/workflows/ci.yml`
- root `package.json`
- root `package-lock.json`
- `packages/contracts/package.json` **new**
- `packages/contracts/src/orders.ts` **new**
- `packages/contracts/src/customers.ts` **new**
- `packages/contracts/src/pagination.ts` **new**
- `apps/api/src/modules/orders.ts`
- `apps/api/src/modules/restaurant.ts`
- `apps/admin/src/lib/api.ts`
- `apps/admin/src/components/OrderDetail.tsx`
- `apps/admin/src/pages/Orders.tsx`
- `apps/admin/src/pages/Customers.tsx`
- `apps/admin/src/pages/Pos.tsx` or extracted POS types.


### P3.4 Roadmap and status reconciliation — corrected R14


`PROJECT_STATUS.md` does not exist on the verified baseline. Do not invent it as an edit target.


Update:
- `docs/ROADMAP.md`
- `docs/engineering/CURRENT_IMPLEMENTATION.md`
- `docs/YAKEBDA_MS_Milestone_Log.md`
- `README.md`
- relevant Project Master/ADR documents if their claims changed;
- cross-link the audit report, P0–P4 plan, and final verification report.


Required truth:
- shipped versus planned table;
- CRM recorded under actual shipped history;
- order sources/global UI integration recorded as merged in PR #19;
- refund flag no longer described as a no-op after P1;
- inventory/loyalty remain clearly unimplemented;
- YKMS-02H versus YKMS-11 naming debt resolved explicitly, not silently.


### P3 exit gate
- structured logs and request correlation verified;
- pagination complete without truncation;
- Node 22 CI green;
- Admin tests in CI;
- shared contracts compile from both workspaces;
- docs match code and merge history.


## 10. P4 — Final read-only re-audit and freeze release gate


No product features may start before this gate passes.


Required work:
- re-run A0–A10 against final `main`;
- verify every original finding as Fixed, Invalidated with evidence, or Explicitly Deferred with user approval;
- fresh database from zero through all migrations;
- migration down/up validation for P0–P3 migrations;
- full API typecheck/tests;
- full Admin tests/build;
- theme contract check;
- dependency audit;
- Node 22 CI;
- tenant/branch isolation tests;
- concurrent payment, order numbering, print claim, refund, and pagination tests;
- 24-image visual parity pack;
- keyboard-only overlay accessibility test;
- review logs for secret/PII leakage;
- verify no temporary workflows/scripts/patches;
- update docs and Real Memory.


Required final artifacts:
- `docs/engineering/AUDIT_REMEDIATION_FINAL_REPORT.md`
- final finding matrix;
- migration inventory;
- test-count delta;
- CSS and `Pos.tsx` before/after metrics;
- known residual risks;
- explicit “Feature Freeze Lifted” decision.


The freeze is lifted only after:
1. P0–P3 PRs are merged;
2. P4 report is complete;
3. exact `main` SHA and CI are verified;
4. user explicitly approves resuming feature work.


## 11. Standard validation commands


At every phase, run the relevant subset and report exact output:


npm ci
npm audit
npm run ui:colors:check
npm run api:migrate
npm run api:test
npm run admin:test
npm run admin:build
npm run check
git diff --check


API-specific:
cd apps/api
npx tsc --noEmit
NODE_ENV=test npx vitest run --no-file-parallelism


Do not claim completion when a command is unavailable; record the gap and fix the project script.


## 12. Program reporting format


Every remediation PR report must contain:
- base SHA and head SHA;
- finding IDs addressed;
- final file list;
- migrations and rollback result;
- endpoint/contract changes;
- test count before/after;
- CI run;
- manual QA evidence;
- security/financial invariants;
- deferred items;
- confirmation that no feature work was included.
