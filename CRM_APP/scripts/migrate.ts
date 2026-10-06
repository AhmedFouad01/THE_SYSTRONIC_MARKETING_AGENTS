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
	for (const [version, file] of [
		[1, "001_foundation.sql"],
		[2, "002_crm_core.sql"],
		[3, "003_object_integrity.sql"],
		[4, "004_relationship_authority.sql"],
		[5, "005_protected_key_configuration.sql"],
		[6, "006_journey_reporting.sql"],
		[7, "007_collect_event_canonical_id.sql"],
		[8, "008_list_query_timestamps_scope.sql"],
		[9, "009_arabic_search.sql"],
	] as const) {
		const { rowCount } = await db.query(
			"SELECT 1 FROM public.crm_migrations WHERE version=$1",
			[version],
		);
		if (!rowCount) {
			// Additive upgrades must not change object row counts (ADR-002 4.10 verification step).
			const counts = async () => {
				const out: Record<string, number> = {};
				for (const t of ["contact", "lead", "deal", "task"])
					out[t] = Number(
						(await db.query(`SELECT count(*) n FROM crm.${t}`)).rows[0].n,
					);
				return out;
			};
			const before = version >= 8 ? await counts() : null;
			await db.query(
				await readFile(
					new URL(`../migrations/${file}`, import.meta.url),
					"utf8",
				),
			);
			if (before) {
				const after = await counts();
				if (JSON.stringify(before) !== JSON.stringify(after))
					throw new Error(`Row counts changed in migration ${version}`);
				console.log(`Migration ${version} row counts unchanged:`, after);
			}
			await db.query("INSERT INTO public.crm_migrations(version) VALUES($1)", [
				version,
			]);
		}
	}
	// Repair privileges on databases that applied 008 before its PUBLIC EXECUTE fix.
	// This is idempotent and runs under the same migration lock and transaction.
	await db.query(
		"REVOKE EXECUTE ON FUNCTION crm.context_tenant_if_allowed(),crm.object_scope(text,uuid),crm.owner_names(uuid[]) FROM PUBLIC",
	);
	const password = new URL(process.env.DATABASE_URL ?? "").password;
	if (!/^[a-zA-Z0-9]{24,}$/.test(password))
		throw new Error("Use generated alphanumeric runtime password");
	await db.query(`ALTER ROLE crm_runtime PASSWORD '${password}'`);
	await db.query("COMMIT");
	console.log("Migrations 001–009 applied/verified");
} catch (e) {
	await db.query("ROLLBACK");
	throw e;
} finally {
	await db.end();
}
