import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const digest = (value: string) =>
	createHash("sha256").update(value).digest("hex");
async function fixture(
	fn: (root: string, run: () => ReturnType<typeof spawnSync>) => Promise<void>,
) {
	const root = await mkdtemp(path.join(tmpdir(), "crm-m0-bootstrap-"));
	await mkdir(path.join(root, "scripts"));
	await cp(
		"scripts/native-local.ps1",
		path.join(root, "scripts/native-local.ps1"),
	);
	const run = () =>
		spawnSync(
			process.env.M0_PWSH ?? "pwsh.exe",
			[
				"-NoProfile",
				"-File",
				path.join(root, "scripts/native-local.ps1"),
				"-PgBin",
				root,
				"-PrepareOnly",
			],
			{ encoding: "utf8", windowsHide: true, timeout: 15000 },
		);
	try {
		await fn(root, run);
	} finally {
		const resolved = path.resolve(root);
		assert.ok(
			resolved.startsWith(path.resolve(tmpdir()) + path.sep) &&
				path.basename(resolved).startsWith("crm-m0-bootstrap-"),
		);
		await rm(resolved, { recursive: true, force: true });
	}
}
test("bootstrap fresh preparation persists matching credentials/config before database startup", async () =>
	fixture(async (root, run) => {
		const result = run();
		assert.equal(result.status, 0, String(result.stderr));
		const password = (
			await readFile(path.join(root, ".local-postgres/password"), "utf8")
		).trim();
		const env = await readFile(path.join(root, ".env"), "utf8");
		assert.match(password, /^[A-F0-9]{64}$/);
		assert.equal(
			digest(/^POSTGRES_PASSWORD=(.+)$/m.exec(env)?.[1] ?? ""),
			digest(password),
		);
		assert.ok(
			env.includes(`postgresql://postgres:${password}@127.0.0.1:55432/crm_m0`),
		);
		assert.ok(
			!String(result.stdout).includes(password) &&
				!String(result.stderr).includes(password),
		);
		const before = digest(
			await readFile(path.join(root, ".local-postgres/password"), "utf8"),
		);
		assert.notEqual(run().status, 0);
		assert.equal(
			digest(
				await readFile(path.join(root, ".local-postgres/password"), "utf8"),
			),
			before,
		);
	}));
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
test("bootstrap incomplete cluster credentials fail safely", async () =>
	fixture(async (root, run) => {
		await mkdir(path.join(root, ".local-postgres/data"), { recursive: true });
		const result = run();
		assert.notEqual(result.status, 0);
		assert.match(String(result.stderr), /incomplete credential\/config state/);
		await assert.rejects(readFile(path.join(root, ".local-postgres/password")));
	}));
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
