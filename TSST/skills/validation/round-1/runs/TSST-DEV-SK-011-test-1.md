# Test Run: TSST-DEV-SK-011 · Test 1

## Prompt
Execute the CRM_APP automated test suite for native bootstrap environment isolation and credential persistence (`tests/native-bootstrap.test.ts`) using Node.js test runner. Verify test-to-risk mapping, deterministic fixture behavior, and report real test execution results unedited.

---

## Raw Execution Output

### Command Executed
```powershell
npx tsx --test tests/native-bootstrap.test.ts
```
Working directory: `G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\CRM_APP`

### Real Console Output
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

### Risk-to-Test Mapping
- **Acceptance Risk:** Unauthenticated or inconsistent `.env` database connection strings created prior to cluster initialization.
- **Test Level:** Unit / Isolated Subprocess Integration (Node.js test runner spawning `scripts/native-local.ps1 -PrepareOnly`).
- **Fixture Strategy:** Disposable directory created via `mkdtemp(path.join(tmpdir(), "crm-m0-bootstrap-"))`, verified cleaned up in `finally` block.
- **Verification Result:** PASS (4 passed, 0 failed, 0 skipped).
