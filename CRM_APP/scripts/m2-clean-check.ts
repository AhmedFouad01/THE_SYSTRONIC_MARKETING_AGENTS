import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import pg from "pg";
import { seed } from "./seed.js";
// Destructive only to the expressly disposable M2 validation database/role.
const u = new URL(process.env.ADMIN_DATABASE_URL ?? "");
if (
	u.hostname !== "127.0.0.1" ||
	u.port !== "55438" ||
	u.pathname !== "/crm_m2"
)
	throw new Error("Isolated M2 validation cluster required");
const root = new pg.Client({ connectionString: new URL("/postgres", u).href });
await root.connect();
try {
	await root.query("DROP DATABASE IF EXISTS crm_m2");
	await root.query("DROP ROLE IF EXISTS crm_runtime");
	if (!process.argv.includes("--reset-only")) {
		await root.query("CREATE DATABASE crm_m2");
		const db = new pg.Client({ connectionString: u.href });
		await db.connect();
		try {
			for (const file of [
				"001_foundation.sql",
				"002_crm_core.sql",
				"003_object_integrity.sql",
				"004_relationship_authority.sql",
				"005_protected_key_configuration.sql",
				"006_journey_reporting.sql",
				"007_collect_event_canonical_id.sql",
				"008_list_query_timestamps_scope.sql",
			])
				await db.query(await readFile(`migrations/${file}`, "utf8"));
			const fixture = await seed(db);
			assert.ok(fixture.ids.a !== fixture.ids.b);
			await db.query("SELECT crm.assert_identifier_configuration()");
			const tables = Number(
				(
					await db.query(
						"SELECT count(*) FROM pg_tables WHERE schemaname='crm'",
					)
				).rows[0].count,
			);
			assert.equal(tables, 47);
			await mkdir("../m2-runtime", { recursive: true });
			await writeFile(
				"../m2-runtime/clean-result.json",
				JSON.stringify(
					{
						result: "PASS",
						migrations: "001-008",
						tables,
						syntheticTenants: 2,
						protectedConfiguration: "PASS",
					},
					null,
					2,
				),
			);
			console.log(
				`Clean install PASS: ${tables} tables, 2 synthetic tenants, explicit protected keys`,
			);
		} finally {
			await db.end();
		}
	}
} finally {
	await root.end();
}
