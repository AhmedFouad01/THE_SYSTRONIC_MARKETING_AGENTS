// Run ONLY against a disposable empty database; preserves the real M1 cluster.
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import pg from "pg";
import { seed } from "./seed.js";
const url = new URL(process.env.ADMIN_DATABASE_URL ?? "");
if (url.pathname !== "/crm_m2")
	throw new Error("Disposable crm_m2 database required");
const root = new pg.Client({
	connectionString: new URL("/postgres", url).href,
});
await root.connect();
await root.query("CREATE DATABASE crm_m2");
await root.end();
const db = new pg.Client({ connectionString: url.href });
await db.connect();
try {
	const files = [
		"001_foundation.sql",
		"002_crm_core.sql",
		"003_object_integrity.sql",
		"004_relationship_authority.sql",
		"005_protected_key_configuration.sql",
	];
	await db.query(
		"CREATE TABLE public.crm_migrations(version integer PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())",
	);
	for (const [i, file] of files.entries()) {
		await db.query(await readFile(`migrations/${file}`, "utf8"));
		await db.query("INSERT INTO public.crm_migrations(version) VALUES($1)", [
			i + 1,
		]);
	}
	const f = await seed(db);
	await db.query(
		"SELECT set_config('crm.tenant',$1,false),set_config('crm.token',$2,false)",
		[f.ids.a, f.tokens.manager],
	);
	await db.query(
		"INSERT INTO crm.contact_identifier VALUES($1,gen_random_uuid(),$2,'email',crm.encrypt_identifier('fixture@example.test'),crm.identifier_digest('fixture@example.test'),'M2 upgrade fixture',$2)",
		[f.ids.a, f.ids.contact],
	);
	const tables = (
		await db.query(
			"SELECT tablename FROM pg_tables WHERE schemaname='crm' ORDER BY tablename",
		)
	).rows.map((r) => r.tablename as string);
	const snapshot: Record<string, pg.QueryResultRow[]> = {};
	for (const t of tables)
		snapshot[t] = (await db.query(`SELECT * FROM crm.${t} ORDER BY 1,2`)).rows;
	await db.query("BEGIN");
	await db.query(
		await readFile("migrations/006_journey_reporting.sql", "utf8"),
	);
	await db.query("INSERT INTO public.crm_migrations(version) VALUES(6)");
	await db.query("COMMIT");
	let count = 0;
	for (const t of tables) {
		const before = snapshot[t],
			after = (await db.query(`SELECT * FROM crm.${t} ORDER BY 1,2`)).rows;
		if (t === "role_permission") {
			for (const row of before)
				assert.ok(after.some((r) => JSON.stringify(r) === JSON.stringify(row)));
		} else {
			assert.equal(after.length, before.length, t);
			for (let i = 0; i < before.length; i++)
				for (const key of Object.keys(before[i]))
					assert.deepEqual(after[i][key], before[i][key], `${t}.${key}`);
		}
		count += before.length;
	}
	const config = await db.query("SELECT crm.assert_identifier_configuration()");
	assert.equal(config.rowCount, 1);
	await writeFile(
		"../m2-runtime/upgrade-result.json",
		JSON.stringify(
			{
				result: "PASS",
				oldTables: tables.length,
				preservedRows: count,
				protectedKeyCiphertextAndDigest: "byte-identical",
				migrations: "001-005 -> 006",
			},
			null,
			2,
		),
	);
	console.log(
		`Upgrade PASS: ${tables.length} existing tables; ${count} rows preserved including protected key/ciphertext/digest`,
	);
} finally {
	await db.end();
}
