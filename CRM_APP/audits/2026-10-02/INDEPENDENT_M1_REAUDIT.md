# Independent M1 Re-Audit — 2026-10-02

**PASS — M1 may close**

Target/HEAD: `e0a86d9876e29caad5009015074e04b322ad7601`; branch `feat/crm-m1-core`. One primary-session reviewer; no sub-agents. Both original blocking findings are CLOSED. This verdict permits M1 closure; it does not perform closure/memory sync or authorize production deployment.

## Target and method

`git status`, `git branch --show-current`, `git log -6 --oneline`, and `git diff --check` confirmed the target and clean tracked product tree. Original FAIL `INDEPENDENT_M1_AUDIT.md` and committed `M1_REMEDIATION_EVIDENCE.md` were preserved. Unrelated untracked TSST paths were untouched.

Reviewed the remediation diff from `8c22379` to target, with the original implementation comparison for context. Changes are bounded to protected-key configuration, task relation authorization, focused tests and documentation. Migrations001–004 are unchanged. No M2 implementation or weakening of existing RLS, permissions, durable commands, transition, merge or worker processing was found.

The36 tracked executable/config/test files were SHA256-matched against the existing local execution mirror before gates. Tests used native PostgreSQL17.10 on disposable port55436, Node24.18.0 and the pinned dependencies. The original development cluster/key was untouched. No mocks substituted for database/security behavior.

## Original blocker closure

### M1-A01 — CLOSED

Migration005 removes runtime provisioning and checks protected configuration; API/worker entrypoints validate before starting. Provisioning is an explicit owner-only operation, which cannot replace existing keys or recreate a missing key when ciphertext exists. No plaintext fallback exists.

Independent HTTP/SQL probe created a protected identifier and verified valid decryption. For missing, malformed and wrong fixture keys separately:

- Existing-contact GET and protected-contact POST returned503 `PROTECTED_KEY_UNAVAILABLE`.
- Actual API and worker subprocesses exited1, with empty stdout and only the safe error code on stderr.
- Full-row snapshots of contact/identifier/lead/deal/task/audit/event/outbox/inbox/retry data were unchanged. Key state was also unchanged: absent stayed absent; invalid/wrong stayed unreplaced.
- Restoring the original fixture key restored original identifier readability. No ciphertext was overwritten or automatically re-encrypted.
- Runtime direct key-table read and provisioning execution were denied42501.

Known-value scan of60 tracked/evidence text files plus API/startup output, audit rows and the isolated database log found zero current protected-key/credential matches. This is a bounded current-value check, not a historical or production secret scan. Focused tests `M1-R01/R02/R03` additionally cover explicit provisioning and missing-key refusal with existing ciphertext.

### M1-A02 — CLOSED

`src/crm.ts` locks/authorizes the task, then locks/authorizes the new deal with current `crm.write` and object scope before mutation in the same transaction. Tenant/contact constraints remain defense in depth. Durable replay rechecks target authority.

Independent HTTP/SQL probe observed:

| Case | Result |
|---|---|
| Writable task → inaccessible manager-owned deal |403; no data/receipt/audit/event/outbox change |
| Assigned rep → another rep's deal |403; no change |
| Cross-tenant target |404; no change |
| Authorized link → authorized relink → unlink |200 each; expected versions1,2,3 |

`M1-R04/R05/R06` also pass, including authority loss before replay and rejection of other relationship fields. This is server-side authorization, not reliance on FK/RLS alone.

## Fresh mandatory gates

| Command/coverage | Observed result |
|---|---|
| `npm run lint` |PASS;21 files |
| `npm run typecheck` |PASS |
| `npm test` |**55 passed /0 failed /0 skipped** |
| PostgreSQL/API portion |42/42:14 foundation +18 M1 +10 remediation |
| Bootstrap portion |4/4 |
| Chromium portion |9/9; Arabic RTL/English LTR,360/1280px, operational and error/denied/conflict states |
| M0 regression subset |**22/22**:14 foundation +4 bootstrap +4 original UI |
| `npm run build` |PASS |
| `git diff --check` |PASS |

Security: foundation01–05 and M1-09–13/17/18 pass for non-owner/non-BYPASSRLS runtime, FORCE RLS, forged context, pool-local context, scoped authorization, revocation, composite references and current worker authority. Additional independent API and runtime SQL probes denied Tenant A read/update of Tenant B Contact/Lead/Deal/Task; direct SQL returned zero rows.

Regressions: M1-01/03 preserve protected identifiers, shared-identifier non-merging and explicit merge provenance. M1-02/15/16 preserve durable manual-lead identity across replay/cache expiry/concurrency and rollback. M1-04 plus foundation06–13 preserve transition atomicity/conflicts and won→reopened→won dedup. M1-05–08/17/18 and foundation05/10/14 preserve task/automation idempotency, disabled rules, revoked authority, restart and overlapping worker claims.

## Install/upgrade evidence verified

Used the permitted existing bounded evidence and inspected its reproduction helpers; installation was not rerun during this re-audit:

- `tmp/m1-audit/migration-results.json`: clean001–004; M0→004 preserves all43 original rows and original-column values across18 tables;12 new business tables FORCE RLS. Migrations001–004 remain byte-unchanged by remediation.
- `tmp/m1-remediation/upgrade.json`:004→005 preserves the legacy key, ciphertext and lookup digest exactly; configured-key startup check passes.
- `tmp/m1-remediation/clean.json`: clean001–005 produces30 tables, two synthetic tenants/two explicitly configured keys and successful startup validation.

Together these demonstrate the bounded clean-install/upgrade path without row loss. Missing configuration after upgrade intentionally requires explicit admin provisioning for empty tenants, or restoration of the matching key where ciphertext exists. No production RPO/RTO claim.

## Evidence and limits

Execution workspace: `C:\Users\10\Documents\ChatGPT\THE_SYSTRONIC_MARKETING_AGENTS\tmp\m0-stage`. Independent helper/result: sibling `tmp\m1-reaudit\probe.mts` and `probe-results.json`; run `node --import tsx ../m1-reaudit/probe.mts` with private isolated-cluster environment variables. No credentials are included in this report. Initial helper assertions incorrectly assumed a nested error envelope and universal404 rather than403/404 denial; those audit-only assertions were corrected, then the complete probe exited0. Product code was not changed.

Blocking findings: **none**. Non-blocking deployment follow-ups remain direct-Drive dependency installation/Docker validation and documented external secret custody/KMS and real identity/MFA integration; these are outside this M1 remediation audit. No production readiness is asserted.

Only this new report is added to the repository. No product-code modification, M2, memory sync, push, merge, or sub-agent creation/use. Original FAIL history and remediation evidence remain intact.
