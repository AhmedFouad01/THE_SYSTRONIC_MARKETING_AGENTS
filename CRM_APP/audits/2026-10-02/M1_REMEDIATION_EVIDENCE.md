# M1 audit remediation — 2026-10-02

Scope: only M1-A01 and M1-A02 from `INDEPENDENT_M1_AUDIT.md`, against implementation `1b395b81a9f0398bd0b9d333b7f7c8f22c1ed897` on `feat/crm-m1-core`. The original FAIL report is preserved; this is remediation evidence, not independent acceptance or M1 closure.

## M1-A01: fail-closed protected-key configuration

- Additive migration005 preserves existing key/ciphertext bytes and adds a protected validation fingerprint. Runtime encryption/digest/decryption functions cannot create or replace a key.
- API and worker check required tenant key state and ciphertext readability before startup. Missing, malformed, wrong or unreadable state produces only `PROTECTED_KEY_UNAVAILABLE`; affected HTTP operations return503. No plaintext fallback.
- Owner-only `provision_identifier_key` is invoked explicitly by synthetic seed/admin configuration. It never replaces an existing key and refuses a missing key when ciphertext exists. Restore matching private backup state instead. External KMS/rotation is excluded.
- `scripts/configure-identifier-key.ts` provides explicit admin provisioning for a tenant with no encrypted identifiers. Runtime cannot invoke that function or read the protected table.
- `M1-R01/R02/R03` verify valid-key preservation, missing/invalid/wrong key rejection, API/worker startup failures, exact safe output, no automatically inserted key, unchanged ciphertext and all business/audit/outbox/receipt rows after rejection.

## M1-A02: authorize task relationship changes

- Task PATCH locks/authorizes the task and validates/authorizes the new deal with current `crm.write`, tenant and assigned-object rules inside the transaction before mutation. Contact agreement and database constraints remain enforced.
- Authorized target changes work. Null unlinks only when a contact remains. Durable replay rechecks target authority. Other entity relationship fields in the same generic PATCH path remain non-writable; owner assignment retains its existing check.
- `M1-R04/R05/R06` cover successful link/change/unlink, manager-owned/other-rep/cross-tenant target denial, unchanged task/version/receipt/audit/event/outbox after denial, replay after authority loss, and rejection of other relationship fields.

## Observed validation

| Gate | Result |
|---|---|
| Focused regression file | 10 passed,0 failed,0 skipped |
| Complete `npm test` | **55 passed,0 failed,0 skipped**:42 real PostgreSQL/API,4 bootstrap,9 Chromium |
| Preserved baseline | All45 previous M0/M1 tests pass; M0 remains22/22 |
| `npm run lint` | PASS,21 files |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| Protected-key values in isolated PostgreSQL log | 0 matches |
| Migration004→005 | PASS; legacy configured key, ciphertext and lookup digest unchanged; startup validation passes |
| Clean migrations001–005 + seed | PASS;30 tables,2 explicitly configured synthetic tenant keys |

Only test assertion output was subsequently hardened to avoid printing a key on a failing assertion; lint/typecheck and all10 focused tests passed again. Product behavior is the version exercised by the full55-test run.

Tests ran in a separate native PostgreSQL17.10 cluster on55436; clean installation used55437. The original development cluster, `.env`, and real local keys were not migrated, overwritten or rotated. Applying005 to an existing installation requires explicit configuration for any unconfigured tenant; missing keys with existing ciphertext require restoration, not regeneration. This intentional deployment prerequisite is documented in README.

Local-only reproduction helpers/results: `tmp/m1-remediation/setup.mts`, `clean.mts`, `upgrade.json`, `clean.json` in the existing execution workspace. Private context/password/data files are not deliverables. Source files are hash-verified when copied back to Drive. No changes to unrelated TSST paths or prior audits.

No M2, memory sync, push, merge, sub-agent creation or delegation. No production KMS, production readiness or RPO/RTO claim. Remediation is ready for independent re-audit; this does not close M1.
