# Test Run: TSST-DEV-SK-015 · Test 1

## Prompt
Perform a fresh verification of the CRM native bootstrap subsystem before completion. Execute the authoritative verification command, inspect exit status and test counts, expose any unverified boundaries, and produce the structured verification ledger required by TSST-DEV-SK-015.

---

## Raw Execution Output

### Environment & Context
- **Environment:** Windows 10/11, PowerShell, Node.js v24.18.0.
- **Working Directory:** `G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\CRM_APP`
- **Execution Date:** 2026-10-11T14:06:55Z

### Verification Command & Real Output
```powershell
npx tsx --test tests/native-bootstrap.test.ts
```

```text
npm notice run systronic-crm@0.1.0 npx
npm notice run tsx --test tests/native-bootstrap.test.ts
✔ bootstrap fresh preparation persists matching credentials/config before database startup (2074.9096ms)
✔ bootstrap partial cluster retry preserves original password and data (1592.6991ms)
✔ bootstrap incomplete cluster credentials fail safely (1588.0318ms)
✔ bootstrap orphaned password is preserved without initialization (1595.3946ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 7077.784
```
Exit Status: `0`

### Verification Ledger

| Claim ID | Claim | Evidence | Verification Method | Result | Remaining Unverified Items |
|---|---|---|---|---|---|
| CLAIM-01 | Fresh bootstrap creates matching 64-char hex password in `.local-postgres/password` and `.env` before DB launch. | `native-bootstrap.test.ts#L44-L74`: SHA256 digest match asserted, no password leaked in stdout/stderr. | Automated subprocess fixture execution (`spawnSync`). | **PASS** | Endurance verification under concurrent multi-user execution remains unverified. |
| CLAIM-02 | Interrupted bootstrap with existing cluster data retains original password without overwriting. | `native-bootstrap.test.ts#L75-L97`: Stderr outputs recovery instruction; file digest before == after. | Synthetic corrupted state injection and exit status check. | **PASS** | Automatic recovery without manual `.env` restoration is deferred. |
| CLAIM-03 | Incomplete cluster credentials fail safely without creating orphaned password files. | `native-bootstrap.test.ts#L98-L105`: Non-zero exit code, error logged, no password file created. | Asserted rejection of missing file read. | **PASS** | None for this isolated unit. |
| CLAIM-04 | Orphaned password from previous aborted run is preserved. | `native-bootstrap.test.ts#L106-L116`: Non-zero exit code, prior password preserved. | File content digest comparison. | **PASS** | None. |

### Completion Status
**PARTIALLY COMPLETE / VERIFIED BOUNDED SUBSYSTEM**: The bootstrap preparation script (`scripts/native-local.ps1 -PrepareOnly`) is verified passing on Windows with Node v24.18.0. Database runtime startup and long-running PostgreSQL daemon stability remain outside this test's verification scope.
