# GEM-SCC-001 — Lead review · 2026-10-07

Output: pasted by Ahmed in chat (Claude session 2026-10-07), not saved as a file. Gemini Pro, Arabic.
Verdict: **ACCEPTED WITH CORRECTIONS.** Output is input (R2). The Lead reviewed it against the repo clone, without a DEV round.

## Acceptance checks
- Coverage: PASS. The table rows match the repo per folder: 88 docs files, 21 ADRs (= 109), plus README and START_HERE.
- Every MERGE names a target: PASS. Targets `OPERATIONS_GUIDE.md` and `RUNBOOK.md` are new files, and `OPERATIONS_GUIDE.md` is missing from its own proposed structure. Use RUNBOOK.md for both.
- Contradictions cite both paths: PASS.
- Summary counts do not match its own table. The summary says KEEP 18 / MERGE 33 / DEFER 20. The table actually has KEEP 26 / MERGE 25 / DEFER 15 / DROP 24 (90 rows).

## Corrections (binding for execution)
1. **No deletion.** DROP means move to `docs/_archive/`. This follows TSST's fixed boundary on historical evidence. The 13_audit files (CONSISTENCY_AUDIT, IMPLEMENTATION_DECISIONS) are evidence: archive them, never delete.
2. **Update docs are not "fully handled by Velopack".** YAKEBDA is Node 22 + Express + PostgreSQL running on the restaurant PC. Updates involve DB migrations, and Velopack does not roll those back. Velopack trust also relies on code signing, which is deferred. So:
   - ADR-009 (update signing) stays **valid**, not superseded. It covers DEV risk S1.
   - UPDATE_AND_ROLLBACK and UPDATE_CLIENT_FLOW → DEFER, not DROP.
3. **Tenancy and RBAC still exist in the code** (RLS on 19 tables, role matrix). DEV's advice is to keep RLS dormant, not to rip it out. So:
   - TENANCY_AND_ISOLATION and RBAC_MATRIX → DEFER.
   - ADR-003 → "dormant under hybrid plan".
4. AUTHENTICATION_AND_AUTHORIZATION → KEEP. Phase 0 changes auth defaults (JWT secret, refuse-defaults).
5. FAILURE_MODES → DEFER. It covers offline and partial-failure design; GlitchTip does not replace that.
6. ERROR_AND_CRASH_REPORTING → MERGE into PRIVACY_AND_LOGGING, because its redaction rules are needed for GlitchTip scrubbing.
7. SUBSCRIPTION_MODEL → MERGE into LICENSING_MODEL, because the renewals screen (SPARK screen 4) needs it.
8. openapi.yaml is NOT current either: it has 29 paths against about 45 route handlers (DEV). Sync it to the code before making it the single API reference.
9. FINAL_STATUS.md is the stale file (it says 0%). KEEP it as the target, but rewrite it from IMPLEMENTATION_STATUS plus the TSST report.

## Gemini's open questions → Lead proposals (for the decision sheet)
- Phase 0 key storage: a key file on the server with OS-restricted permissions, loaded at start, not env vars. Move to a KMS/vault later.
- Keygen: only if the fallback is triggered; then integrate by API, not manual entry.
- Manual payments: a "record payment" action in the dashboard extends the license and is audit-logged. Alerts only remind; nothing auto-renews.
- Update notify: SCC's existing update-check endpoint, not Uptime Kuma.

## Execution
After Phase 0, as one DEV task (TEAM build, TSST-DEV-SK-004 + SK-015). Move files, don't delete. One commit per folder group.
