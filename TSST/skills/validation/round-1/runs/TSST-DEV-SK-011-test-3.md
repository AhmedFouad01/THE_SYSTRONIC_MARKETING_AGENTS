# Test Run: TSST-DEV-SK-011 · Test 3

## Prompt
Formulate and execute an automated test verifying fail-closed behavior when cluster data directories exist without associated credential files. The test must prove that incomplete states abort immediately and reject unauthenticated initialization.

---

## Raw Execution Output

### Test Implementation (`tests/native-bootstrap.test.ts#L98-L105`)
```typescript
test("bootstrap incomplete cluster credentials fail safely", async () =>
	fixture(async (root, run) => {
		await mkdir(path.join(root, ".local-postgres/data"), { recursive: true });
		const result = run();
		assert.notEqual(result.status, 0);
		assert.match(String(result.stderr), /incomplete credential\/config state/);
		await assert.rejects(readFile(path.join(root, ".local-postgres/password")));
	}));
```

### Real Command & Test Result
```powershell
npx tsx --test --test-name-pattern="incomplete cluster credentials" tests/native-bootstrap.test.ts
```

Output:
```text
✔ bootstrap incomplete cluster credentials fail safely (1588.0318ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### Analysis & TDD Verification
- **Failure Mode Tested:** Cluster directory is present but password file is absent (e.g., interrupted backup recovery or manual accidental deletion).
- **Behavior Observed:** The script throws a non-zero exit status, logs `incomplete credential/config state`, and strictly refrains from auto-generating a replacement password file that would orphan the cluster.
- **Result:** PASS.
