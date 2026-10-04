# Independent M1 Audit — 2026-10-02

**FAIL — M1 remains open**

Audited implementation: `1b395b81a9f0398bd0b9d333b7f7c8f22c1ed897`. Branch: `feat/crm-m1-core`. M0 closure: `f54fbf6a4ac5366f047ca49b5ee9db19e0d68ccc`. HEAD evidence follow-up: `8c22379`; its only change after the implementation is `M1_EVIDENCE.md`. No tracked product changes existed at audit start. Two unrelated untracked TSST paths were preserved.

One current-session reviewer; no agents created or used. This is a fresh runtime/source audit, not reliance on the earlier PASS claim. The requested model setting cannot be changed or verified through the available execution tools.

## Blocking findings

### M1-A01 — Lost tenant key is silently replaced, breaking existing protected data (P1)

Location: `migrations/002_crm_core.sql:34–36`; called by `src/crm.ts:160` and `:71`.

Independent HTTP/real-PostgreSQL reproduction on a new synthetic tenant:

1. Create a contact with an encrypted email; confirm authorized decryption succeeds.
2. Save its tenant key privately, then delete only this fixture's `identifier_secret` row to simulate missing key state while ciphertext remains.
3. GET the original contact: **200**, identifier value silently becomes **null**.
4. POST another contact with an identifier: **201**. The encryption function generates a different tenant key without detecting existing ciphertext.
5. GET the original contact again: **500 INTERNAL_ERROR**. Restore the saved original key: the original identifier reads correctly again.

The missing-key condition does not fail closed: a successful write creates mixed-key ciphertext under an unversioned single key, making the old records unreadable and splitting keyed duplicate lookup. This is a data-integrity/protected-key acceptance failure, not a demand for production KMS. An empty invalid key correctly rejected the separate write with500; no plaintext fallback was observed. Runtime direct key-table SELECT was denied with42501.

Required closure: distinguish first-use provisioning from lost/corrupt key state; refuse affected reads/writes explicitly when ciphertext exists but the usable original key does not. Do not silently replace that key. Add missing-key/corrupt-key regression coverage, including atomic no-new-contact/event/outbox/audit behavior on rejection. No fix was applied during this audit.

### M1-A02 — Task PATCH accepts an unauthorized deal relationship (P1)

Location: `src/crm.ts:705–731,748–788`. `deal_id` is allowed for tasks but omitted from the immutable relationship-field rejection. The generic PATCH loop writes it without authorizing the target deal. This contradicts `M1_CONTRACTS.md:22` and IAM-01 object/field authorization.

Independent HTTP/real-PostgreSQL reproduction:

1. Manager creates a contact assigned to a rep, a manager-owned deal for that contact, and an open task assigned to the rep for the same contact, initially without a deal link.
2. Rep GET `/v1/deals/{managerDeal}` returns **403 FORBIDDEN**.
3. Rep PATCH `/v1/tasks/{ownedTask}` with a fresh command/key, `expected_version:0`, and `deal_id:{managerDeal}` returns **200**.
4. PostgreSQL confirms the unauthorized relationship persisted and task version became1.

Tenant-equal/contact-equal constraints still hold; this is an assigned-object/field boundary failure within a tenant, not cross-tenant disclosure. Required closure: reject `deal_id` in PATCH per the documented contract, or explicitly define and authorize relinking against the target object. Add the denied-target regression. No fix was applied.

## Observed gates and coverage

| Area | Independently observed result |
|---|---|
| Full baseline | `npm test`: **45 passed /0 failed /0 skipped**:32 real PostgreSQL/API,4 bootstrap,9 Chromium. All **22/22 M0** regressions pass. Initial attempt hit a stopped local database; the existing cluster was started and the complete rerun exited0. |
| Static/build | `npm run lint` PASS,19 files; `npm run typecheck` PASS; `npm run build` PASS. No fixes/write mode used. |
| Tenant/RLS | Extra probe: A GET/PATCH of B Contact/Lead/Deal/Task each rejected; direct runtime SQL SELECT/UPDATE of B returned0 rows for all4. Baseline confirms forged context, pooled-context isolation, inactive membership, grant revocation, deny-default, cross-tenant FKs, worker reauthorization. Runtime non-owner/nonsuperuser/no BYPASSRLS and FORCE RLS remain intact. Assigned-object exception is M1-A02. |
| Protected fields | Reader redaction/sensitive action/MFA tests pass. Known-value scan of55 tracked text files against72 current protected keys plus current DB credentials:0 matches. Private PostgreSQL log:0 matching key/password values. Scan is bounded, not a claim about every historical secret. Key-loss handling fails M1-A01. |
| Contacts/merge | `M1-01/03/10–13`: explicit merge/replay, original identifier provenance, source tombstone, child references/version changes, stale preview, shared identifier without auto-merge, field/object denials pass. Create/read/update are the implemented M1 subset; deletion is not claimed. |
| Manual lead | Independent HTTP A/K1, A/K1, A/K2, B/K2, expired-cache A/K3: same A ID; K2 bound to A; B rejected409 IDEMPOTENCY_CONFLICT. Exact deltas:1 contact,1 lead,2 events,2 outbox,2 audits,1 durable inbox. `M1-15/16` independently rerun concurrency and injected rollback pass. |
| Deals/pipeline | `M1-04` and foundation06–09/11–13 pass: valid/invalid/stale/concurrent transitions, atomic history/event/outbox/audit, lost reason, won→reopened→won single commercial outcome. Source diff extends the existing transition engine. |
| Tasks/automation | `M1-05–08/17/18`, foundation05/10/14 pass: complete/overdue/escalation, retry/crash, disabled rule, revoked actor/grant, real worker identity and overlapping SKIP LOCKED claims. Source review: generated task/escalation events lack stage-transition links, so they cannot recursively trigger stage follow-ups. PATCH relationship exception is M1-A02. |
| UI | Existing tests only: Arabic RTL/English LTR at360/1280, operational journeys, empty/loading/error/retry/denied/stale feedback:9/9. No visual redesign audit. |
| Migrations | Exact migration runner001–004 executed in two new isolated clusters on55434/55435, leaving the working cluster untouched. Clean install:30 tables. Upgrade: original M0 migration+fixture+transition/receipt/event/outbox/audit, then002–004; all43 original rows' original-column values preserved across18 tables. All12 new business tables ENABLE/FORCE RLS. Both disposable clusters stopped afterward. |
| Scope | Reviewed implementation diff and M1-specific requirements only. No Meta/Google/GA4/attribution/segments/audiences/commerce/agency operations/billing/AI/M2+ implementation found. No production readiness or RPO/RTO claim. |

## Reproduction and evidence locations

The33 tracked executable/config/test files were SHA256-matched between Drive and the existing local execution mirror before running gates. Execution directory:
`C:\Users\10\Documents\ChatGPT\THE_SYSTRONIC_MARKETING_AGENTS\tmp\m0-stage`.

Audit-only helpers/results are under its sibling `tmp\m1-audit`, outside product code. Commands from the execution directory:

```text
npm run lint
npm run typecheck
npm test
npm run build
node --env-file=.env --import tsx ../m1-audit/adversarial.mts
node --env-file=.env --import tsx ../m1-audit/security.mts
node --import tsx ../m1-audit/migrations.mts
```

Sanitized outputs: `adversarial-results.json`, `security-results.json`, `migration-results.json`. Extra adversarial acceptance groups:2 PASS (lead, tenant/secret scan),2 FAIL (key-loss, unauthorized task linkage); these are additional to the45 green baseline tests. The upgrade helper used the exact M0 fixture from the closure commit. Its original-column snapshot digest is `ee238cc65cf05f89aa9e3c40b9cc1de7b8ac408c154bb8334df50c2bf62c1ef4`.

Non-blocking follow-ups: direct Drive dependency installation and Docker remain unverified, while the matched native PostgreSQL path is demonstrated. Synthetic MFA/session and local key-custody limitations remain documented deployment boundaries.

No product-code modification, M2, memory sync, push, merge, or sub-agent creation/use. Only this audit report is added to the repository; previous M0 audit history is preserved. M1 cannot close until both blocking findings are remediated and independently rechecked.
