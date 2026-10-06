# P1a S1–S5 security review — 2026-10-07

## Scope and evidence

Reviewed `migrations/008_list_query_timestamps_scope.sql`, `009_arabic_search.sql`, `src/query.ts`, `src/listquery.ts`, `src/list.ts`, the list and sources routes in `src/crm.ts`, and envelope forwarding in `src/api.ts` on `feat/crm-p1b`. Traced HTTP input through `crmRequest` and `planList` to PostgreSQL under `crm_runtime`; checked the generated SQL, RLS policy, derived contact/deal/lead/stage/owner lookups, and both cursor forms. Used `P1A_THREAT_MODEL.md`, `P1A_CONTRACTS.md`, and ADR-002 §5 as requirements, then verified conclusions against source and tests.

## Findings and fixes

| Severity | Location | Finding, trigger and impact | Resolution and evidence |
|---|---|---|---|
| MAJOR | `migrations/008_list_query_timestamps_scope.sql:60` | The three new `SECURITY DEFINER` functions were granted to `crm_runtime` without explicitly revoking PostgreSQL's global default `PUBLIC EXECUTE`. A role with future `crm` schema usage could invoke these functions directly, bypassing the intended narrow function ACL. Current `crm_runtime` calls still enforce token, tenant, MFA and membership, so this did not demonstrate a cross-tenant data leak in the current roles. | Explicit `REVOKE ... FROM PUBLIC` in migration 008 at line 81, plus an idempotent repair for already migrated databases in `scripts/migrate.ts:57`. `tests/p1a.test.ts:27` checks catalog ACLs and retained runtime access against real PostgreSQL. |
| MINOR | `src/listquery.ts:406` | Derived contact and task lookup scope used the literal `$2::uuid`. The current bind order made `$2` the actor, but a future parameter added before the actor could silently select the wrong value or fail with a cast error. | Save the actor placeholder once at `src/listquery.ts:322` and reuse it in the base and every derived lookup. `tests/listquery.unit.test.ts:34` covers q, filter, contact and task related lookups. Unknown scope modes now fail closed at `src/listquery.ts:319`. |
| MINOR | `src/list.ts:21` | Legacy list requests with opt-in `include_total` or `expand` could invoke extra database work without the 5-second query bound applied to modern lists. | Apply the transaction-local 5-second bound to these opt-in requests. Plain legacy requests and their response bytes are unchanged; P1A-S5d verifies the legacy response. |

No unresolved BLOCKER or MAJOR finding remains in this scope.

## Boundary checks

- **Tenant and rep scope:** `crm.object_scope` derives only `tenant` or `assigned` from `role_permission.scope` (database CHECK constraint). The base list always constrains `tenant_id`; assigned mode also constrains `owner_id`. The lead/deal contact lookups, task deal and linked lead lookup, and contact expansion each repeat tenant and assigned-owner predicates. Stage lookup uses tenant, pipeline and stage IDs; owner names use the context tenant, active writer membership, and `crm.read` check. `tests/p1a.test.ts` S2a/S2b, S4e, S5b/S5c/S5d exercise those boundaries.
- **Untrusted SQL:** filter fields, operators and sort keys come from fixed whitelists; values, q patterns, actor, tenant and cursor values use parameters. `%`, `_` and backslash are escaped for literal pattern matching. Nested filters, q length, list length and limit are bounded. S4b/S4c and the unit compiler tests cover rejected identifiers, metacharacters and injections.
- **Cursor:** opaque cursors validate shape, types, key count and a query fingerprint; a forged cursor can alter only the page position because scope and filter predicates remain in SQL. Legacy UUID cursors are accepted only on legacy requests. S4d and S4e cover tampering and cross-tenant reuse.
- **RLS and definer functions:** the four object tables have FORCE RLS; the policy's context tenant function fails closed on missing or unauthorized context. New definers use fixed `search_path`; the explicit ACL repair closes their PUBLIC grant. S2b and the new ACL test cover this. Existing older definer functions outside S1–S5 were not reaudited.
- **Projection and response:** explicit system columns in `src/query.ts` prevent newly added columns from appearing automatically. `src/api.ts` forwards `has_more` and requested `total_count` without widening query authority. S1 and S4e cover these paths.

## Verification and residual risk

On `crm_p1b`, migration 001–009 and seed succeeded. `npm run lint`: 233 files, pass. `npm run typecheck`: pass. `npm run test:unit`: 32 files, 307 tests passed. `npm run test:db`: 96 tests passed. `npm run test:bootstrap`: 4 tests passed. No UI or external scan was run. `q`/substring search remains a tenant-scoped scan without trigram acceleration; the 5-second statement timeout bounds each affected query but may return a timeout on very large tenants. The 009 generated-column rewrite and index creation are appropriate to the local fixture; production volume and latency remain for the separately gated performance work.

This review is a source and local-test gate for P1a only. It does not authorize merge, deployment, P1b implementation, or a broader security certification.
