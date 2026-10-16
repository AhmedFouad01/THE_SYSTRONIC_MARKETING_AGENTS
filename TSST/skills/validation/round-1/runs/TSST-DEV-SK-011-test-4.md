# Test Run: TSST-DEV-SK-011 · Test 4

## Prompt
Design and execute a test case verifying that an orphaned password file from an interrupted bootstrap process is safely preserved and never overwritten by subsequent initializations.

---

## Raw Execution Output

### Test Implementation (`tests/native-bootstrap.test.ts#L106-L116`)
```typescript
test("bootstrap orphaned password is preserved without initialization", async () =>
	fixture(async (root, run) => {
		await mkdir(path.join(root, ".local-postgres"));
		const file = path.join(root, ".local-postgres/password");
		await writeFile(file, "retained\n");
		const before = digest(await readFile(file, "utf8"));
		const result = run();
		assert.notEqual(result.status, 0);
		assert.match(String(result.stderr), /Prior bootstrap password preserved/);
		assert.equal(digest(await readFile(file, "utf8")), before);
	}));
```

### Real Command & Test Result
```powershell
npx tsx --test --test-name-pattern="orphaned password" tests/native-bootstrap.test.ts
```

Output:
```text
✔ bootstrap orphaned password is preserved without initialization (1595.3946ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### Analysis & TDD Verification
- **Failure Mode Tested:** Prior interrupted installation left an unlinked password file. A subsequent blind execution might overwrite the secret with a fresh hash before the admin can inspect it.
- **Behavior Observed:** Script halts, outputs `Prior bootstrap password preserved`, and leaves the original file content unchanged.
- **Result:** PASS.
