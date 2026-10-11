# Test Run: TSST-DEV-SK-011 · Test 2

## Prompt
Develop and verify an adverse-path regression test for database bootstrap recovery when a prior cluster initialization failed mid-run. The test must verify that an existing saved password and data directory are never overwritten or leaked during an aborted retry.

---

## Raw Execution Output

### Test Implementation (`tests/native-bootstrap.test.ts#L75-L97`)
```typescript
test("bootstrap partial cluster retry preserves original password and data", async () =>
	fixture(async (root, run) => {
		await mkdir(path.join(root, ".local-postgres/data"), { recursive: true });
		const passwordFile = path.join(root, ".local-postgres/password");
		await writeFile(passwordFile, "persisted-synthetic-password\n");
		await writeFile(path.join(root, ".local-postgres/data/PG_VERSION"), "17");
		const before = digest(await readFile(passwordFile, "utf8"));
		const result = run();
		assert.notEqual(result.status, 0);
		assert.match(
			String(result.stderr),
			/Recover .env using the saved cluster password/,
		);
		assert.equal(digest(await readFile(passwordFile, "utf8")), before);
		assert.equal(
			await readFile(
				path.join(root, ".local-postgres/data/PG_VERSION"),
				"utf8",
			),
			"17",
		);
		assert.ok(!String(result.stderr).includes("persisted-synthetic-password"));
	}));
```

### Real Command & Test Result
```powershell
npx tsx --test --test-name-pattern="partial cluster retry" tests/native-bootstrap.test.ts
```

Output:
```text
✔ bootstrap partial cluster retry preserves original password and data (1592.6991ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### Analysis & TDD Verification
- **Failure Mode Tested:** Script blindly generating a new 64-character hex password while an existing PG data directory exists, locking administrators out of existing data.
- **Assertion:** Script aborts with exit code != 0, outputs explicit remediation guidance in stderr, and preserves byte-for-byte SHA256 digest of original password. Stderr verified not to leak password secret in cleartext.
