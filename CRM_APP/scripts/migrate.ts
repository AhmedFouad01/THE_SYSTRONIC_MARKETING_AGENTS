import { readFile } from "node:fs/promises";
import pg from "pg";
const db = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
await db.connect();
try {
	await db.query("BEGIN");
	await db.query("SELECT pg_advisory_xact_lock(724901)");
	await db.query(
		"CREATE TABLE IF NOT EXISTS public.crm_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
	);
	const { rowCount } = await db.query(
		"SELECT 1 FROM public.crm_migrations WHERE version=1",
	);
	if (!rowCount) {
		await db.query(
			await readFile(
				new URL("../migrations/001_foundation.sql", import.meta.url),
				"utf8",
			),
		);
		await db.query("INSERT INTO public.crm_migrations(version) VALUES(1)");
	}
	const password = new URL(process.env.DATABASE_URL ?? "").password;
	if (!/^[a-zA-Z0-9]{24,}$/.test(password))
		throw new Error("Use generated alphanumeric runtime password");
	await db.query(`ALTER ROLE crm_runtime PASSWORD '${password}'`);
	await db.query("COMMIT");
	console.log("Migration 001 applied/verified");
} catch (e) {
	await db.query("ROLLBACK");
	throw e;
} finally {
	await db.end();
}
